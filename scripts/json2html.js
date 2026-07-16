#!/usr/bin/env node
/**
 * Reads rigid JSON under data/ and writes SSI fragments to view/generated/.
 * Fail-fast on missing required fields. No template engine — string markup only.
 */
'use strict';

const fs = require('fs');
const path = require('path');

const ROOT = path.join(__dirname, '..');
const OUT_DIR = path.join(ROOT, 'view', 'generated');

function fail(msg) {
  console.error('json2html: ' + msg);
  process.exit(1);
}

function readJson(rel) {
  const file = path.join(ROOT, rel);
  if (!fs.existsSync(file)) fail('missing file ' + rel);
  try {
    return JSON.parse(fs.readFileSync(file, 'utf8'));
  } catch (e) {
    fail('invalid JSON in ' + rel + ': ' + e.message);
  }
}

function requireKeys(obj, keys, ctx) {
  keys.forEach(function (k) {
    if (obj[k] === undefined || obj[k] === null) {
      fail(ctx + ' missing required field "' + k + '"');
    }
  });
}

function escAttr(s) {
  return String(s)
    .replace(/&/g, '&amp;')
    .replace(/"/g, '&quot;')
    .replace(/</g, '&lt;');
}

function writeOut(name, html) {
  fs.mkdirSync(OUT_DIR, { recursive: true });
  const dest = path.join(OUT_DIR, name);
  fs.writeFileSync(dest, html, 'utf8');
  console.log('json2html: wrote view/generated/' + name);
}

function renderCarousel(data) {
  if (!Array.isArray(data.carousel)) fail('homepage.json: carousel must be an array');
  return data.carousel
    .map(function (slide, i) {
      requireKeys(slide, ['image', 'alt', 'subtitle', 'title', 'href'], 'homepage.carousel[' + i + ']');
      return [
        '                            <div class="swiper-slide">',
        '                                <div class="bs-banner">',
        '                                    <figure>',
        '                                        <img src="' + escAttr(slide.image) + '" alt="' + escAttr(slide.alt) + '" class="homebnnr">',
        '                                    </figure>',
        '                                    <div class="titlebx">',
        '                                        <div class="content-wrapper">',
        '                                            <p class="subtitle">' + escAttr(slide.subtitle) + '</p>',
        '                                            <h2 class="bs-heading">' + escAttr(slide.title) + '</h2>',
        '                                            <a href="' + escAttr(slide.href) + '" class="bs-btn typ-view bann-btn"><span>view <i',
        '                                                        class="icon icon-down-arrow"></i></span></a>',
        '                                        </div>',
        '                                    </div>',
        '                                </div>',
        '                            </div>'
      ].join('\n');
    })
    .join('\n');
}

function renderLandingPost(post, i) {
  requireKeys(post, ['type'], 'blog-landing.posts[' + i + ']');
  if (post.type === 'post') {
    requireKeys(post, ['title', 'image', 'href', 'size'], 'blog-landing.posts[' + i + ']');
    const sizeClass = post.size === 'large' ? ' typ-large' : '';
    const topSpace = post.size === 'large' ? '' : ' with-top-space';
    const sec =
      post.secTitle && String(post.secTitle).trim()
        ? '                                        <p class="sec-title">' + escAttr(post.secTitle) + '</p>\n'
        : '';
    return [
      '                                <div class="grid-item' + sizeClass + '">',
      '                                    <a href="' + escAttr(post.href) + '" class="bs-cards  typ-blog-landing-posts' + topSpace + ' d-block">',
      sec +
        '                                        <h2 class="name">' +
        escAttr(post.title) +
        '</h2>',
      '                                        <figure class="pics">',
      '                                            <img src="' + escAttr(post.image) + '" alt="' + escAttr(post.title) + '">',
      '                                        </figure>',
      '                                    </a>',
      '                                </div>'
    ].join('\n');
  }
  if (post.type === 'film') {
    requireKeys(post, ['secTitle', 'title', 'image', 'videoUrl'], 'blog-landing.posts[' + i + ']');
    return [
      '                                <div class="grid-item">',
      '                                    <a class="bs-cards  typ-blog-landing-posts d-block">',
      '                                        <p class="sec-title">' + escAttr(post.secTitle) + '</p>',
      '                                        <h2 class="name">' + escAttr(post.title) + '</h2>',
      '                                        <figure class="pics">',
      '                                            <img src="' + escAttr(post.image) + '" alt="' + escAttr(post.title) + '">',
      '                                        </figure>',
      '                                        <a href="#" class="bs-btn typ-view blog-landing-btn video-btn" data-toggle="modal" data-src="' +
        escAttr(post.videoUrl) +
        '" data-target="#myModal"><span>play<i class="icon icon-down-arrow"></i></span></a>',
      '                                        <div class="bs-modal modal fade" id="myModal" tabindex="-1" role="dialog"',
      '                                        aria-labelledby="videoModalLabel" aria-hidden="true">',
      '                                        <div class="modal-dialog modal-dialog-centered" role="document">',
      '                                            <div class="modal-content">',
      '                                                <div class="modal-body">',
      '                                                    <button type="button" class="close" data-dismiss="modal"',
      '                                                        aria-label="Close">',
      '                                                        <span aria-hidden="true">&times;</span>',
      '                                                    </button>',
      '                                                    <div class="embed-responsive embed-responsive-16by9">',
      '                                                        <iframe class="embed-responsive-item" src="" id="video"',
      '                                                            allowscriptaccess="always"></iframe>',
      '                                                    </div>',
      '                                                </div>',
      '                                            </div>',
      '                                        </div>',
      '                                    </div>',
      '                                    </a>',
      '                                </div>'
    ].join('\n');
  }
  if (post.type === 'hashtags') {
    requireKeys(post, ['tags'], 'blog-landing.posts[' + i + ']');
    if (!Array.isArray(post.tags)) fail('blog-landing.posts[' + i + '].tags must be an array');
    const tagsHtml = post.tags
      .map(function (t, j) {
        requireKeys(t, ['class', 'html'], 'blog-landing.posts[' + i + '].tags[' + j + ']');
        return '                                        <p class="tag ' + escAttr(t.class) + '">' + t.html + '</p>';
      })
      .join('\n');
    return [
      '                                <div class="grid-item">',
      '                                    <div class="bs-cards  typ-blog-landing-posts hashtags d-block">',
      tagsHtml,
      '                                    </div>',
      '                                </div>'
    ].join('\n');
  }
  fail('blog-landing.posts[' + i + ']: unknown type "' + post.type + '" (use post|film|hashtags)');
}

function renderLanding(data) {
  if (!Array.isArray(data.posts)) fail('blog-landing.json: posts must be an array');
  return data.posts.map(renderLandingPost).join('\n');
}

function renderLargeItem(img) {
  return [
    '                            <div class="grid-item large-pic">',
    '                                <div class="inner-element typ-mob-mt-150">',
    '                                    <img src="' + escAttr(img.full) + '" />',
    '                                </div>',
    '',
    '                                <div class="bs-modal modal fade" id="myModal" tabindex="-1" role="dialog" aria-labelledby="videoModalLabel" aria-hidden="true">',
    '                                    <div class="modal-dialog modal-dialog-centered" role="document">',
    '                                        <div class="modal-content">',
    '                                            <div class="modal-body">',
    '                                                <button type="button" class="close" data-dismiss="modal" aria-label="Close">',
    '                                                    <span aria-hidden="true">&times;</span>',
    '                                                </button>',
    '                                                <div class="embed-responsive embed-responsive-16by9">',
    '                                                    <iframe class="embed-responsive-item" src="" id="video" allowscriptaccess="always"></iframe>',
    '                                                </div>',
    '                                            </div>',
    '                                        </div>',
    '                                    </div>',
    '                                </div>',
    '',
    '                            </div>'
  ].join('\n');
}

function renderThumbItem(img) {
  return [
    '                            <div class="grid-item">',
    '                                <div class="inner-element">',
    '                                    <a href="' + escAttr(img.full) + '" class="img-popup">',
    '                                        <img src="' + escAttr(img.thumb) + '" />',
    '                                    </a>',
    '                                </div>',
    '                            </div>'
  ].join('\n');
}

function renderGallery(data) {
  requireKeys(data, ['slug', 'title', 'images'], 'blog ' + (data.slug || '?'));
  if (!Array.isArray(data.images) || data.images.length === 0) {
    fail('blog ' + data.slug + ': images must be a non-empty array');
  }
  return data.images
    .map(function (img, i) {
      requireKeys(img, ['full', 'thumb', 'large'], 'blog ' + data.slug + ' images[' + i + ']');
      return img.large ? renderLargeItem(img) : renderThumbItem(img);
    })
    .join('\n');
}

function main() {
  writeOut('home-carousel.html', renderCarousel(readJson('data/homepage.json')));
  writeOut('blog-landing-cards.html', renderLanding(readJson('data/blog-landing.json')));

  const blogsDir = path.join(ROOT, 'data', 'blogs');
  if (!fs.existsSync(blogsDir)) fail('missing data/blogs/');
  const blogFiles = fs.readdirSync(blogsDir).filter(function (f) {
    return f.endsWith('.json');
  });
  if (blogFiles.length === 0) fail('no blog JSON files in data/blogs/');

  blogFiles.forEach(function (file) {
    const data = readJson(path.join('data', 'blogs', file));
    const outName = 'blog-' + data.slug + '-gallery.html';
    writeOut(outName, renderGallery(data));
  });
}

main();
