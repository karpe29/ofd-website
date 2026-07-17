'use strict';

const fs = require('fs');
const path = require('path');

const ROOT = path.join(__dirname, '..');

function loadEnvFile() {
  const envPath = path.join(ROOT, '.env');
  if (!fs.existsSync(envPath)) return;
  fs.readFileSync(envPath, 'utf8')
    .split(/\r?\n/)
    .forEach(function (line) {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith('#')) return;
      const eq = trimmed.indexOf('=');
      if (eq === -1) return;
      const key = trimmed.slice(0, eq).trim();
      let val = trimmed.slice(eq + 1).trim();
      if (
        (val.startsWith('"') && val.endsWith('"')) ||
        (val.startsWith("'") && val.endsWith("'"))
      ) {
        val = val.slice(1, -1);
      }
      if (process.env[key] === undefined) process.env[key] = val;
    });
}

function getAwsConfig() {
  loadEnvFile();
  const cfg = {
    profile: process.env.AWS_PROFILE,
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
    region: process.env.AWS_REGION || 'ap-south-1',
    bucket: process.env.S3_BUCKET_NAME,
    mediaPrefix: (process.env.S3_MEDIA_PREFIX || 'weddings/media').replace(/^\/+|\/+$/g, '')
  };
  const missing = [];
  // Either an SSO profile (preferred) or static access keys (legacy fallback) must be present.
  if (!cfg.profile && !(cfg.accessKeyId && cfg.secretAccessKey)) {
    missing.push('AWS_PROFILE (or AWS_ACCESS_KEY_ID/AWS_SECRET_ACCESS_KEY)');
  }
  if (!cfg.bucket) missing.push('S3_BUCKET_NAME');
  if (missing.length) {
    throw new Error('Missing env: ' + missing.join(', ') + ' (set in .env — see .env.example)');
  }
  return cfg;
}

function s3Credentials(cfg) {
  if (cfg.accessKeyId && cfg.secretAccessKey) {
    return { accessKeyId: cfg.accessKeyId, secretAccessKey: cfg.secretAccessKey };
  }
  // Falls back to the default provider chain (picks up AWS_PROFILE / SSO cache).
  const { defaultProvider } = require('@aws-sdk/credential-provider-node');
  return defaultProvider({ profile: cfg.profile });
}

function publicUrl(cfg, key) {
  return 'https://' + cfg.bucket + '.s3.' + cfg.region + '.amazonaws.com/' + key;
}

function walkJsonFiles(dir, acc) {
  acc = acc || [];
  if (!fs.existsSync(dir)) return acc;
  fs.readdirSync(dir).forEach(function (name) {
    const full = path.join(dir, name);
    const st = fs.statSync(full);
    if (st.isDirectory()) walkJsonFiles(full, acc);
    else if (name.endsWith('.json')) acc.push(full);
  });
  return acc;
}

function collectReferencedUrls() {
  const urls = new Set();
  const dataDir = path.join(ROOT, 'data');
  walkJsonFiles(dataDir).forEach(function (file) {
    const raw = fs.readFileSync(file, 'utf8');
    let data;
    try {
      data = JSON.parse(raw);
    } catch (e) {
      return;
    }
    JSON.stringify(data, function (_k, v) {
      if (typeof v === 'string' && (v.indexOf('http://') === 0 || v.indexOf('https://') === 0)) {
        urls.add(v);
      }
      return v;
    });
  });
  return urls;
}

function urlToKey(cfg, url) {
  const prefixes = [
    'https://' + cfg.bucket + '.s3.' + cfg.region + '.amazonaws.com/',
    'https://s3.' + cfg.region + '.amazonaws.com/' + cfg.bucket + '/',
    'https://' + cfg.bucket + '.s3.amazonaws.com/'
  ];
  for (let i = 0; i < prefixes.length; i++) {
    if (url.indexOf(prefixes[i]) === 0) return url.slice(prefixes[i].length);
  }
  return null;
}

function parseArgs(argv) {
  const out = { _: [] };
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (a === '--execute' || a === '--confirm') {
      out.execute = true;
    } else if (a.startsWith('--') && a.indexOf('=') !== -1) {
      const parts = a.slice(2).split('=');
      out[parts[0]] = parts.slice(1).join('=');
    } else if (a.startsWith('--')) {
      const key = a.slice(2);
      const next = argv[i + 1];
      if (next && !next.startsWith('--')) {
        out[key] = next;
        i++;
      } else {
        out[key] = true;
      }
    } else {
      out._.push(a);
    }
  }
  return out;
}

module.exports = {
  ROOT,
  loadEnvFile,
  getAwsConfig,
  s3Credentials,
  publicUrl,
  collectReferencedUrls,
  urlToKey,
  parseArgs
};
