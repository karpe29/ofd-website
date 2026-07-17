#!/usr/bin/env node
/**
 * Upload all local assets/images paths referenced by data JSON
 * into s3://bucket/weddings/media/... and rewrite JSON to HTTPS URLs.
 *
 * Only writes under the media prefix. Does not touch site HTML on S3.
 *
 *   node scripts/migrate-assets-to-s3.js
 *   node scripts/migrate-assets-to-s3.js --execute
 */
'use strict';

const fs = require('fs');
const path = require('path');
const {
  ROOT,
  getAwsConfig,
  s3Credentials,
  publicUrl,
  parseArgs
} = require('./content-lib');

function walkJsonFiles(dir, acc) {
  acc = acc || [];
  fs.readdirSync(dir).forEach(function (name) {
    const full = path.join(dir, name);
    if (fs.statSync(full).isDirectory()) walkJsonFiles(full, acc);
    else if (name.endsWith('.json')) acc.push(full);
  });
  return acc;
}

function collectLocalRefs() {
  const refs = new Set();
  walkJsonFiles(path.join(ROOT, 'data')).forEach(function (file) {
    const data = JSON.parse(fs.readFileSync(file, 'utf8'));
    JSON.stringify(data, function (_k, v) {
      if (typeof v === 'string' && v.indexOf('assets/images/') === 0) refs.add(v);
      return v;
    });
  });
  return Array.from(refs).sort();
}

function resolveLocal(rel) {
  const abs = path.join(ROOT, rel.replace(/\//g, path.sep));
  if (fs.existsSync(abs)) return abs;
  // case-insensitive fallback on Windows
  const dir = path.dirname(abs);
  const base = path.basename(abs);
  if (!fs.existsSync(dir)) return null;
  const found = fs.readdirSync(dir).find(function (n) {
    return n.toLowerCase() === base.toLowerCase();
  });
  return found ? path.join(dir, found) : null;
}

function relToKey(cfg, rel) {
  // assets/images/foo/bar.jpg → weddings/media/foo/bar.jpg
  const suffix = rel.replace(/^assets\/images\//, '');
  return cfg.mediaPrefix + '/' + suffix;
}

function contentType(file) {
  const ext = path.extname(file).toLowerCase();
  if (ext === '.png') return 'image/png';
  if (ext === '.webp') return 'image/webp';
  if (ext === '.gif') return 'image/gif';
  if (ext === '.svg') return 'image/svg+xml';
  return 'image/jpeg';
}

function rewriteJsonFiles(urlMap) {
  let changedFiles = 0;
  walkJsonFiles(path.join(ROOT, 'data')).forEach(function (file) {
    const raw = fs.readFileSync(file, 'utf8');
    const data = JSON.parse(raw);
    let changed = false;
    const next = JSON.parse(
      JSON.stringify(data, function (_k, v) {
        if (typeof v === 'string' && urlMap[v]) {
          changed = true;
          return urlMap[v];
        }
        return v;
      })
    );
    if (changed) {
      fs.writeFileSync(file, JSON.stringify(next, null, 2) + '\n');
      changedFiles++;
      console.log('updated JSON', path.relative(ROOT, file));
    }
  });
  return changedFiles;
}

async function main() {
  const args = parseArgs(process.argv.slice(2));
  const execute = !!args.execute;
  const cfg = getAwsConfig();
  const refs = collectLocalRefs();
  console.log('Local asset refs in data/:', refs.length);
  console.log(execute ? 'EXECUTE: uploading to S3 + rewriting JSON' : 'DRY-RUN (pass --execute to upload)');

  const urlMap = {};
  const missing = [];
  const toUpload = [];

  refs.forEach(function (rel) {
    const local = resolveLocal(rel);
    if (!local) {
      missing.push(rel);
      return;
    }
    const key = relToKey(cfg, rel);
    urlMap[rel] = publicUrl(cfg, key);
    toUpload.push({ rel: rel, local: local, key: key });
  });

  console.log('Will upload:', toUpload.length);
  console.log('Missing on disk:', missing.length);
  if (missing.length) {
    missing.slice(0, 30).forEach(function (m) {
      console.log('  MISSING', m);
    });
  }

  if (!execute) {
    console.log('Sample mapping:');
    toUpload.slice(0, 5).forEach(function (u) {
      console.log(' ', u.rel, '->', 's3://' + cfg.bucket + '/' + u.key);
    });
    return;
  }

  const { S3Client, PutObjectCommand, HeadObjectCommand } = require('@aws-sdk/client-s3');
  const client = new S3Client({
    region: cfg.region,
    credentials: s3Credentials(cfg)
  });

  const CONCURRENCY = 8;
  let uploaded = 0;
  let skipped = 0;
  let failed = 0;
  let i = 0;

  async function worker() {
    while (i < toUpload.length) {
      const idx = i++;
      const item = toUpload[idx];
      try {
        // skip if already present with same size
        let exists = false;
        try {
          const head = await client.send(
            new HeadObjectCommand({ Bucket: cfg.bucket, Key: item.key })
          );
          const localSize = fs.statSync(item.local).size;
          if (head.ContentLength === localSize) exists = true;
        } catch (_e) {
          exists = false;
        }
        if (exists) {
          skipped++;
        } else {
          const body = fs.readFileSync(item.local);
          await client.send(
            new PutObjectCommand({
              Bucket: cfg.bucket,
              Key: item.key,
              Body: body,
              ContentType: contentType(item.local),
              CacheControl: 'public, max-age=31536000, immutable'
            })
          );
          uploaded++;
        }
      } catch (e) {
        failed++;
        console.error('FAIL', item.key, e.message || e);
      }
      if ((uploaded + skipped + failed) % 50 === 0) {
        console.log(
          'progress',
          uploaded + skipped + failed + '/' + toUpload.length,
          '(up',
          uploaded,
          'skip',
          skipped,
          'fail',
          failed + ')'
        );
      }
    }
  }

  const workers = [];
  for (let w = 0; w < CONCURRENCY; w++) workers.push(worker());
  await Promise.all(workers);

  console.log('Upload done. uploaded=', uploaded, 'skipped=', skipped, 'failed=', failed);

  const n = rewriteJsonFiles(urlMap);
  console.log('JSON files updated:', n);

  if (missing.length) {
    console.log('WARNING: ' + missing.length + ' paths could not be uploaded (still local in JSON if present).');
  }
}

main().catch(function (e) {
  console.error(e.message || e);
  process.exit(1);
});
