#!/usr/bin/env node
/**
 * Upload staging images to shared S3 weddings/media/ and write URLs into data JSON.
 *
 * SAFETY: dry-run by default. Pass --execute to actually upload to S3.
 *
 * Usage:
 *   node scripts/content-upload.js --slug monisha-monish1
 *   node scripts/content-upload.js --slug monisha-monish1 --execute
 *   node scripts/content-upload.js --home-slot 0 --file ./photo.png
 *   node scripts/content-upload.js --home-slot 0 --file ./photo.png --execute
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

const IMAGE_EXT = /\.(jpe?g|png|webp|gif)$/i;

async function getSharp() {
  try {
    return require('sharp');
  } catch (e) {
    throw new Error('sharp is required. Run: npm install');
  }
}

async function getS3() {
  const { S3Client, PutObjectCommand } = require('@aws-sdk/client-s3');
  return { S3Client, PutObjectCommand };
}

function listImages(dir) {
  if (!fs.existsSync(dir)) {
    throw new Error('Staging folder not found: ' + dir);
  }
  return fs
    .readdirSync(dir)
    .filter(function (n) {
      return IMAGE_EXT.test(n) && fs.statSync(path.join(dir, n)).isFile();
    })
    .sort(function (a, b) {
      return a.localeCompare(b, undefined, { numeric: true, sensitivity: 'base' });
    });
}

function contentType(file) {
  const ext = path.extname(file).toLowerCase();
  if (ext === '.png') return 'image/png';
  if (ext === '.webp') return 'image/webp';
  if (ext === '.gif') return 'image/gif';
  return 'image/jpeg';
}

async function makeThumb(sharp, inputPath) {
  return sharp(inputPath)
    .rotate()
    .resize({ width: 800, withoutEnlargement: true })
    .webp({ quality: 82, effort: 4 })
    .toBuffer();
}

async function makeFull(sharp, inputPath) {
  const meta = await sharp(inputPath, { failOn: 'none' }).metadata();
  const long = Math.max(meta.width || 0, meta.height || 0);
  let pipeline = sharp(inputPath, { failOn: 'none' }).rotate();
  if (long > 1800) {
    if ((meta.width || 0) >= (meta.height || 0)) {
      pipeline = pipeline.resize({ width: 1800, withoutEnlargement: true });
    } else {
      pipeline = pipeline.resize({ height: 1800, withoutEnlargement: true });
    }
  }
  return pipeline.webp({ quality: 85, effort: 4 }).toBuffer();
}

async function makeTile(sharp, inputPath) {
  return sharp(inputPath, { failOn: 'none' })
    .rotate()
    .resize({ width: 1200, withoutEnlargement: true })
    .webp({ quality: 85, effort: 4 })
    .toBuffer();
}

async function uploadBuffer(s3mod, client, cfg, key, body, type) {
  await client.send(
    new s3mod.PutObjectCommand({
      Bucket: cfg.bucket,
      Key: key,
      Body: body,
      ContentType: type,
      CacheControl: 'public, max-age=31536000, immutable'
    })
  );
}

async function uploadBlog(args) {
  const slug = args.slug;
  if (!slug || typeof slug !== 'string') {
    throw new Error('Required: --slug <gallery-slug>');
  }
  const staging = path.join(ROOT, 'content', 'staging', slug);
  const files = listImages(staging);
  if (files.length === 0) throw new Error('No images in ' + staging);

  const execute = !!args.execute;
  let cfg;
  try {
    cfg = getAwsConfig();
  } catch (e) {
    if (execute) throw e;
    // Dry-run can preview keys without credentials
    require('./content-lib').loadEnvFile();
    cfg = {
      bucket: process.env.S3_BUCKET_NAME || 'ofdweddingwebsite',
      region: process.env.AWS_REGION || 'ap-south-1',
      mediaPrefix: (process.env.S3_MEDIA_PREFIX || 'weddings/media').replace(/^\/+|\/+$/g, '')
    };
    console.log('Note: AWS credentials not set — dry-run only (URLs are preview).');
  }

  const sharp = await getSharp();
  const s3mod = execute ? await getS3() : null;
  const client = execute
    ? new s3mod.S3Client({
        region: cfg.region,
        credentials: s3Credentials(cfg)
      })
    : null;

  const images = [];
  console.log(execute ? 'UPLOADING to S3…' : 'DRY-RUN (pass --execute to upload)…');

  for (let i = 0; i < files.length; i++) {
    const name = files[i];
    const fullPath = path.join(staging, name);
    const base = path.basename(name, path.extname(name));
    // Match existing media layout: weddings/media/blog/<slug>/...
    const fullKey = cfg.mediaPrefix + '/blog/' + slug + '/popup/' + base + '.webp';
    const thumbKey = cfg.mediaPrefix + '/blog/' + slug + '/thumnail/' + base + '.webp';

    console.log('  full  -> s3://' + cfg.bucket + '/' + fullKey);
    console.log('  thumb -> s3://' + cfg.bucket + '/' + thumbKey);

    if (execute) {
      const fullBody = await makeFull(sharp, fullPath);
      const thumbBody = await makeThumb(sharp, fullPath);
      await uploadBuffer(s3mod, client, cfg, fullKey, fullBody, 'image/webp');
      await uploadBuffer(s3mod, client, cfg, thumbKey, thumbBody, 'image/webp');
    }

    images.push({
      full: publicUrl(cfg, fullKey),
      thumb: publicUrl(cfg, thumbKey),
      large: i === 0
    });
  }

  const blogPath = path.join(ROOT, 'data', 'blogs', slug + '.json');
  if (execute) {
    let blog = { slug: slug, title: slug, images: [] };
    if (fs.existsSync(blogPath)) {
      blog = JSON.parse(fs.readFileSync(blogPath, 'utf8'));
    }
    blog.slug = slug;
    blog.images = images;
    fs.mkdirSync(path.dirname(blogPath), { recursive: true });
    fs.writeFileSync(blogPath, JSON.stringify(blog, null, 2) + '\n');
    console.log('Updated ' + path.relative(ROOT, blogPath) + ' (' + images.length + ' images)');
  } else {
    console.log('Would update ' + path.relative(ROOT, blogPath) + ' with ' + images.length + ' S3 URLs');
    console.log('No S3 or JSON changes made. Re-run with --execute when ready.');
  }
}

async function uploadHomeSlot(args) {
  const slot = args['home-slot'];
  const file = args.file;
  if (slot === undefined || file === undefined) {
    throw new Error('Required: --home-slot <index> --file <path>');
  }
  const slotIndex = Number(slot);
  if (!Number.isInteger(slotIndex) || slotIndex < 0) {
    throw new Error('--home-slot must be a non-negative integer');
  }
  const abs = path.isAbsolute(file) ? file : path.join(process.cwd(), file);
  if (!fs.existsSync(abs)) throw new Error('File not found: ' + abs);

  const cfg = getAwsConfig();
  const execute = !!args.execute;
  const homepagePath = path.join(ROOT, 'data', 'homepage.json');
  const homepage = JSON.parse(fs.readFileSync(homepagePath, 'utf8'));
  if (!homepage.carousel || !homepage.carousel[slotIndex]) {
    throw new Error('homepage.json has no carousel[' + slotIndex + ']');
  }

  const key = cfg.mediaPrefix + '/home/carousel-' + slotIndex + '.webp';
  console.log(execute ? 'UPLOADING…' : 'DRY-RUN…');
  console.log('  -> s3://' + cfg.bucket + '/' + key);

  if (execute) {
    const sharp = await getSharp();
    const s3mod = await getS3();
    const client = new s3mod.S3Client({
      region: cfg.region,
      credentials: s3Credentials(cfg)
    });
    const body = await makeTile(sharp, abs);
    await uploadBuffer(s3mod, client, cfg, key, body, 'image/webp');
  }

  homepage.carousel[slotIndex].image = publicUrl(cfg, key);
  fs.writeFileSync(homepagePath, JSON.stringify(homepage, null, 2) + '\n');
  console.log('Updated data/homepage.json carousel[' + slotIndex + '].image');
  if (!execute) console.log('No S3 changes made. Re-run with --execute when ready.');
}

async function main() {
  const args = parseArgs(process.argv.slice(2));
  try {
    if (args.slug) await uploadBlog(args);
    else if (args['home-slot'] !== undefined) await uploadHomeSlot(args);
    else {
      console.log('Usage:');
      console.log('  npm run content:upload -- --slug <slug> [--execute]');
      console.log('  npm run content:upload -- --home-slot <n> --file <path> [--execute]');
      console.log('');
      console.log('Default is dry-run. Nothing is uploaded to S3 without --execute.');
      process.exit(1);
    }
  } catch (e) {
    console.error(e.message || e);
    process.exit(1);
  }
}

main();
