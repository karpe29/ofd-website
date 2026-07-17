#!/usr/bin/env node
/**
 * Optimize every image URL in data/*.json and re-upload to shared S3 media
 * with consistent paths + WebP delivery.
 *
 * Presets (photography-safe):
 *   thumb  — max long-edge 800px,  WebP q82  (grids / thumnail)
 *   full   — max long-edge 1800px, WebP q85  (popup / portfolio)
 *   tile   — max long-edge 1200px, WebP q85  (home / films / landing)
 *
 * Paths normalized to:
 *   weddings/media/<relative-path-without-ext>.webp
 *
 *   node scripts/optimize-media.js           # dry-run summary
 *   node scripts/optimize-media.js --execute # optimize + upload + rewrite JSON
 */
'use strict';

const fs = require('fs');
const path = require('path');
const {
  ROOT,
  getAwsConfig,
  s3Credentials,
  publicUrl,
  parseArgs,
  collectReferencedUrls,
  urlToKey
} = require('./content-lib');

const PRESETS = {
  thumb: { maxEdge: 800, quality: 82 },
  full: { maxEdge: 1800, quality: 85 },
  tile: { maxEdge: 1200, quality: 85 }
};

function walkJsonFiles(dir, acc) {
  acc = acc || [];
  if (!fs.existsSync(dir)) return acc;
  fs.readdirSync(dir).forEach(function (name) {
    const full = path.join(dir, name);
    if (fs.statSync(full).isDirectory()) walkJsonFiles(full, acc);
    else if (name.endsWith('.json')) acc.push(full);
  });
  return acc;
}

function classify(key) {
  const k = key.replace(/\\/g, '/').toLowerCase();
  if (k.indexOf('/thumnail/') !== -1 || k.indexOf('/thumbnail/') !== -1 || k.indexOf('/thumb/') !== -1) {
    return 'thumb';
  }
  if (k.indexOf('/popup/') !== -1) return 'full';
  if (
    k.indexOf('/images-two/') !== -1 ||
    k.indexOf('/images-three/') !== -1 ||
    k.indexOf('portfolio') !== -1
  ) {
    return 'full';
  }
  return 'tile';
}

function normalizeKey(cfg, oldKey) {
  // weddings/media/blog/foo/bar.JPG → weddings/media/blog/foo/bar.webp
  let rel = oldKey;
  if (rel.indexOf(cfg.mediaPrefix + '/') === 0) {
    rel = rel.slice(cfg.mediaPrefix.length + 1);
  }
  rel = rel.replace(/\\/g, '/');
  // drop query/hash if any
  rel = rel.split('?')[0].split('#')[0];
  const parsed = path.posix.parse(rel);
  const dir = parsed.dir;
  const base = parsed.name; // without extension
  const next = (dir ? dir + '/' : '') + base + '.webp';
  return cfg.mediaPrefix + '/' + next;
}

function localPathForKey(cfg, key) {
  // weddings/media/blog/... → assets/images/blog/...
  let rel = key;
  if (rel.indexOf(cfg.mediaPrefix + '/') === 0) {
    rel = rel.slice(cfg.mediaPrefix.length + 1);
  }
  // try exact, then any extension
  const baseNoExt = rel.replace(/\.[^.]+$/, '');
  const candidates = [
    path.join(ROOT, 'assets', 'images', rel),
    path.join(ROOT, 'assets', 'images', baseNoExt + '.jpg'),
    path.join(ROOT, 'assets', 'images', baseNoExt + '.JPG'),
    path.join(ROOT, 'assets', 'images', baseNoExt + '.jpeg'),
    path.join(ROOT, 'assets', 'images', baseNoExt + '.png'),
    path.join(ROOT, 'assets', 'images', baseNoExt + '.webp')
  ];
  for (let i = 0; i < candidates.length; i++) {
    if (fs.existsSync(candidates[i])) return candidates[i];
  }
  // case-insensitive search in directory
  const absDir = path.join(ROOT, 'assets', 'images', path.dirname(baseNoExt));
  const want = path.basename(baseNoExt).toLowerCase();
  if (fs.existsSync(absDir)) {
    const found = fs.readdirSync(absDir).find(function (n) {
      return path.parse(n).name.toLowerCase() === want;
    });
    if (found) return path.join(absDir, found);
  }
  return null;
}

async function loadSourceBuffer(client, s3mod, cfg, oldKey, localFile) {
  if (localFile) return fs.readFileSync(localFile);
  const res = await client.send(
    new s3mod.GetObjectCommand({ Bucket: cfg.bucket, Key: oldKey })
  );
  const chunks = [];
  for await (const chunk of res.Body) chunks.push(chunk);
  return Buffer.concat(chunks);
}

async function optimizeBuffer(sharp, buf, presetName) {
  const preset = PRESETS[presetName];
  const img = sharp(buf, { failOn: 'none' }).rotate();
  const meta = await img.metadata();
  const w = meta.width || 0;
  const h = meta.height || 0;
  const long = Math.max(w, h);
  let pipeline = sharp(buf, { failOn: 'none' }).rotate();
  if (long > preset.maxEdge) {
    if (w >= h) pipeline = pipeline.resize({ width: preset.maxEdge, withoutEnlargement: true });
    else pipeline = pipeline.resize({ height: preset.maxEdge, withoutEnlargement: true });
  }
  const out = await pipeline.webp({ quality: preset.quality, effort: 4 }).toBuffer();
  const outMeta = await sharp(out).metadata();
  return {
    buffer: out,
    beforeBytes: buf.length,
    afterBytes: out.length,
    beforeW: w,
    beforeH: h,
    afterW: outMeta.width,
    afterH: outMeta.height
  };
}

function rewriteJson(urlMap) {
  let files = 0;
  walkJsonFiles(path.join(ROOT, 'data')).forEach(function (file) {
    const data = JSON.parse(fs.readFileSync(file, 'utf8'));
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
      files++;
      console.log('JSON updated', path.relative(ROOT, file));
    }
  });
  return files;
}

async function main() {
  const args = parseArgs(process.argv.slice(2));
  const execute = !!args.execute;
  const cfg = getAwsConfig();
  const sharp = require('sharp');
  const s3mod = require('@aws-sdk/client-s3');
  const client = new s3mod.S3Client({
    region: cfg.region,
    credentials: s3Credentials(cfg)
  });

  const urls = Array.from(collectReferencedUrls()).filter(function (u) {
    return !!urlToKey(cfg, u);
  });
  console.log('HTTPS image URLs in data/:', urls.length);
  console.log(execute ? 'EXECUTE' : 'DRY-RUN (pass --execute to write)');

  const jobs = [];
  const seenNewKey = new Set();
  urls.forEach(function (url) {
    const oldKey = urlToKey(cfg, url);
    if (!oldKey) return;
    if (oldKey.indexOf(cfg.mediaPrefix + '/') !== 0) {
      console.warn('skip non-media key', oldKey);
      return;
    }
    const preset = classify(oldKey);
    const newKey = normalizeKey(cfg, oldKey);
    const local = localPathForKey(cfg, oldKey);
    jobs.push({ url: url, oldKey: oldKey, newKey: newKey, preset: preset, local: local });
    seenNewKey.add(newKey);
  });

  // summary by preset
  const byPreset = { thumb: 0, full: 0, tile: 0 };
  let withLocal = 0;
  jobs.forEach(function (j) {
    byPreset[j.preset]++;
    if (j.local) withLocal++;
  });
  console.log('jobs', jobs.length, 'unique new keys', seenNewKey.size);
  console.log('presets', byPreset, 'local sources', withLocal, 's3 sources', jobs.length - withLocal);

  if (!execute) {
    jobs.slice(0, 8).forEach(function (j) {
      console.log(
        ' ',
        j.preset,
        j.oldKey,
        '→',
        j.newKey,
        j.local ? '(local)' : '(s3)'
      );
    });
    return;
  }

  const urlMap = {};
  const CONCURRENCY = 6;
  let i = 0;
  let done = 0;
  let saved = 0;
  let failed = 0;

  async function worker() {
    while (i < jobs.length) {
      const idx = i++;
      const job = jobs[idx];
      try {
        const src = await loadSourceBuffer(client, s3mod, cfg, job.oldKey, job.local);
        const result = await optimizeBuffer(sharp, src, job.preset);
        await client.send(
          new s3mod.PutObjectCommand({
            Bucket: cfg.bucket,
            Key: job.newKey,
            Body: result.buffer,
            ContentType: 'image/webp',
            CacheControl: 'public, max-age=31536000, immutable'
          })
        );
        urlMap[job.url] = publicUrl(cfg, job.newKey);
        saved += job.url ? result.beforeBytes - result.afterBytes : 0;
        done++;
        if (done % 40 === 0 || done === jobs.length) {
          console.log(
            'progress',
            done + '/' + jobs.length,
            'saved~',
            (saved / 1024 / 1024).toFixed(1) + 'MB',
            'fail',
            failed
          );
        }
      } catch (e) {
        failed++;
        console.error('FAIL', job.oldKey, e.message || e);
      }
    }
  }

  const workers = [];
  for (let w = 0; w < CONCURRENCY; w++) workers.push(worker());
  await Promise.all(workers);

  console.log('Optimize done. ok=', done, 'fail=', failed, 'bytes saved~', (saved / 1024 / 1024).toFixed(1), 'MB');
  const n = rewriteJson(urlMap);
  console.log('JSON files rewritten:', n);
}

main().catch(function (e) {
  console.error(e.message || e);
  process.exit(1);
});
