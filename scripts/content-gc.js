#!/usr/bin/env node
/**
 * Manual orphan cleanup for shared S3 weddings/media/.
 * Dry-run by default. Pass --confirm to delete.
 * Never wire this into GitHub Actions.
 *
 *   npm run content:gc
 *   npm run content:gc -- --confirm
 */
'use strict';

const {
  getAwsConfig,
  s3Credentials,
  collectReferencedUrls,
  urlToKey,
  parseArgs
} = require('./content-lib');

async function main() {
  const args = parseArgs(process.argv.slice(2));
  const confirm = !!args.confirm || !!args.execute;

  let cfg;
  try {
    cfg = getAwsConfig();
  } catch (e) {
    console.error(e.message);
    process.exit(1);
  }

  const { S3Client, ListObjectsV2Command, DeleteObjectsCommand } = require('@aws-sdk/client-s3');
  const client = new S3Client({
    region: cfg.region,
    credentials: s3Credentials(cfg)
  });

  const referenced = collectReferencedUrls();
  const referencedKeys = new Set();
  referenced.forEach(function (url) {
    const key = urlToKey(cfg, url);
    if (key) referencedKeys.add(key);
  });

  const prefix = cfg.mediaPrefix + '/';
  const orphans = [];
  let token;
  do {
    const res = await client.send(
      new ListObjectsV2Command({
        Bucket: cfg.bucket,
        Prefix: prefix,
        ContinuationToken: token
      })
    );
    (res.Contents || []).forEach(function (obj) {
      if (!obj.Key || obj.Key.endsWith('/')) return;
      if (!referencedKeys.has(obj.Key)) orphans.push(obj.Key);
    });
    token = res.IsTruncated ? res.NextContinuationToken : undefined;
  } while (token);

  console.log('Referenced HTTPS URLs in data/: ' + referenced.size);
  console.log('Orphan objects under s3://' + cfg.bucket + '/' + prefix + ': ' + orphans.length);
  orphans.forEach(function (k) {
    console.log('  ' + k);
  });

  if (orphans.length === 0) {
    console.log('Nothing to delete.');
    return;
  }

  if (!confirm) {
    console.log('Dry-run only. Re-run with --confirm to delete these objects.');
    return;
  }

  for (let i = 0; i < orphans.length; i += 1000) {
    const chunk = orphans.slice(i, i + 1000).map(function (Key) {
      return { Key: Key };
    });
    await client.send(
      new DeleteObjectsCommand({
        Bucket: cfg.bucket,
        Delete: { Objects: chunk, Quiet: true }
      })
    );
  }
  console.log('Deleted ' + orphans.length + ' orphan object(s).');
}

main().catch(function (e) {
  console.error(e.message || e);
  process.exit(1);
});
