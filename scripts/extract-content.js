#!/usr/bin/env node
/**
 * One-shot extractor: masonry galleries → data/blogs/*.json
 * stacked portfolios → data/portfolios/*.json
 * Also wires SSI includes into page shells.
 */
'use strict';

const fs = require('fs');
const path = require('path');

const ROOT = path.join(__dirname, '..');

const MASONRY_PAGES = [
  'akhila-ram1',
  'deepika-chaitanya1',
  'kanwal-abhijeet1',
  'manisha-raj1',
  'monisha-monish1',
  'nandi-portfolio1',
  'natasha-kanishk1',
  'navya-bhargav1',
  'neha-dan1',
  'resham-wadhah1',
  'saloni-rishab1',
  'saloni-rishab',
  'servani-siva1',
  'soma-harsha1',
  'sumit-portfolio1',
  'tara-hemant1'
];

const STACK_PAGES = [
  'Chinmayee',
  'wedding-portfolio',
  '22-23-wedding-portfolio',
  'photo-project-1',
  'photo-project-2',
  'photo-project-3',
  'photo-project-4'
];

function extractTitle(html) {
  const m = html.match(/<h2 class="bs-heading typ-white">([\s\S]*?)<\/h2>/);
  return m ? m[1].replace(/\s+/g, ' ').trim() : '';
}

function extractMasonry(html, slug) {
  const images = [];
  // large-pic first img
  const largeBlock = html.match(/grid-item large-pic[\s\S]*?<img[^>]+src="([^"]+)"/i);
  if (largeBlock) {
    images.push({ full: largeBlock[1], thumb: largeBlock[1], large: true });
  }
  const re = /<a href="([^"]+)"[^>]*class="img-popup"[^>]*>\s*<img[^>]+src="([^"]+)"/gi;
  let m;
  while ((m = re.exec(html))) {
    images.push({ full: m[1], thumb: m[2], large: false });
  }
  // alternate attribute order
  const re2 = /class="img-popup"[^>]*href="([^"]+)"[^>]*>\s*<img[^>]+src="([^"]+)"/gi;
  if (images.length <= 1) {
    while ((m = re2.exec(html))) {
      images.push({ full: m[1], thumb: m[2], large: false });
    }
  }
  return {
    slug: slug,
    title: extractTitle(html) || slug,
    images: images
  };
}

function extractStack(html, slug) {
  const items = [];
  // Prefer content inside first large-pic
  let block = html;
  const lp = html.match(/<div class="grid-item large-pic">([\s\S]*?)<\/div>\s*<\/div>\s*<\/div>/);
  // Simpler: find all inner-element blocks that aren't commented
  const parts = html.split('<!--');
  let clean = parts[0];
  for (let i = 1; i < parts.length; i++) {
    const end = parts[i].indexOf('-->');
    if (end !== -1) clean += parts[i].slice(end + 3);
  }
  const innerRe = /<div class="inner-element[^"]*">([\s\S]*?)<\/div>/gi;
  let m;
  while ((m = innerRe.exec(clean))) {
    const chunk = m[1];
    const iframe = chunk.match(/<iframe[^>]+src="([^"]+)"/i);
    if (iframe) {
      items.push({ type: 'video', src: iframe[1] });
      continue;
    }
    const img = chunk.match(/<img[^>]+src="([^"]+)"/i);
    if (img) {
      const altM = chunk.match(/alt="([^"]*)"/i);
      items.push({ type: 'image', src: img[1], alt: altM ? altM[1] : 'portfolio_img' });
    }
  }
  return {
    slug: slug,
    title: extractTitle(html) || slug,
    items: items
  };
}

function replaceGridInner(file, includePath) {
  let html = fs.readFileSync(file, 'utf8');
  if (html.indexOf('view/generated/') !== -1) {
    console.log('skip (already wired):', path.basename(file));
    return;
  }
  const startToken = '<div class="grid">';
  const start = html.indexOf(startToken);
  if (start < 0) throw new Error(file + ': no grid');
  let i = start + startToken.length;
  let depth = 1;
  while (i < html.length && depth > 0) {
    if (html.startsWith('<div', i)) {
      depth++;
      i += 4;
      continue;
    }
    if (html.startsWith('</div>', i)) {
      depth--;
      if (depth === 0) break;
      i += 6;
      continue;
    }
    i++;
  }
  if (depth !== 0) throw new Error(file + ': unbalanced');
  const before = html.slice(0, start + startToken.length);
  const after = html.slice(i);
  fs.writeFileSync(
    file,
    before +
      '\n                            <!--#include virtual="' +
      includePath +
      '" -->\n                        ' +
      after
  );
  console.log('wired', path.basename(file));
}

function main() {
  fs.mkdirSync(path.join(ROOT, 'data', 'blogs'), { recursive: true });
  fs.mkdirSync(path.join(ROOT, 'data', 'portfolios'), { recursive: true });

  MASONRY_PAGES.forEach(function (slug) {
    const file = path.join(ROOT, slug + '.shtml');
    if (!fs.existsSync(file)) {
      console.warn('missing', slug);
      return;
    }
    const html = fs.readFileSync(file, 'utf8');
    const data = extractMasonry(html, slug);
    if (!data.images.length) {
      console.warn('no images', slug);
      return;
    }
    fs.writeFileSync(
      path.join(ROOT, 'data', 'blogs', slug + '.json'),
      JSON.stringify(data, null, 2) + '\n'
    );
    console.log('blog', slug, data.images.length);
    replaceGridInner(file, 'view/generated/blog-' + slug + '-gallery.html');
  });

  STACK_PAGES.forEach(function (slug) {
    const file = path.join(ROOT, slug + '.shtml');
    if (!fs.existsSync(file)) {
      console.warn('missing', slug);
      return;
    }
    const html = fs.readFileSync(file, 'utf8');
    const data = extractStack(html, slug);
    if (!data.items.length) {
      console.warn('no stack items', slug);
      return;
    }
    fs.writeFileSync(
      path.join(ROOT, 'data', 'portfolios', slug + '.json'),
      JSON.stringify(data, null, 2) + '\n'
    );
    console.log('portfolio', slug, data.items.length);
    replaceGridInner(file, 'view/generated/portfolio-' + slug + '-stack.html');
  });
}

main();
