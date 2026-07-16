#!/usr/bin/env node
/**
 * Reads rigid JSON under data/ and writes SSI fragments to view/generated/.
 * Fail-fast on missing required fields.
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
  fs.writeFileSync(path.join(OUT_DIR, name), html, 'utf8');
  console.log('json2html: wrote view/generated/' + name);
}

function videoModal(videoUrl) {
  return [
    '                                    <div class="bs-modal modal fade" id="myModal" tabindex="-1" role="dialog"',
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
    '                                    </div>'
  ].join('\n');
}

function playBtn(videoUrl, extraClass) {
  const cls = extraClass ? ' ' + extraClass : '';
  return (
    '<a href="#" class="bs-btn typ-view video-btn' +
    cls +
    '" data-toggle="modal" data-src="' +
    escAttr(videoUrl) +
    '" data-target="#myModal"><span>play<i class="icon icon-down-arrow"></i></span></a>'
  );
}

/* ---------- carousel ---------- */
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

/* ---------- blog landing ---------- */
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
      sec + '                                        <h2 class="name">' + escAttr(post.title) + '</h2>',
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
      '                                        ' + playBtn(post.videoUrl, 'blog-landing-btn'),
      videoModal(post.videoUrl),
      '                                    </a>',
      '                                </div>'
    ].join('\n');
  }
  if (post.type === 'hashtags') {
    requireKeys(post, ['tags'], 'blog-landing.posts[' + i + ']');
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
  fail('blog-landing.posts[' + i + ']: unknown type "' + post.type + '"');
}

function renderLanding(data) {
  if (!Array.isArray(data.posts)) fail('blog-landing.json: posts must be an array');
  return data.posts.map(renderLandingPost).join('\n');
}

/* ---------- masonry gallery ---------- */
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

/* ---------- stack portfolio ---------- */
function renderStack(data) {
  requireKeys(data, ['slug', 'title', 'items'], 'portfolio ' + (data.slug || '?'));
  if (!Array.isArray(data.items) || data.items.length === 0) {
    fail('portfolio ' + data.slug + ': items must be a non-empty array');
  }
  const inners = data.items
    .map(function (item, i) {
      requireKeys(item, ['type', 'src'], 'portfolio ' + data.slug + ' items[' + i + ']');
      const cls = i === 0 ? 'inner-element typ-mb-10 typ-mob-mt-150' : 'inner-element typ-mb-10';
      if (item.type === 'image') {
        return (
          '                                <div class="' +
          cls +
          '">\n                                    <img alt="' +
          escAttr(item.alt || 'portfolio_img') +
          '" src="' +
          escAttr(item.src) +
          '" />\n                                </div>'
        );
      }
      if (item.type === 'video') {
        return (
          '                                <div class="' +
          cls +
          '">\n                                    <div class="embed-responsive embed-responsive-16by9">\n                                        <iframe src="' +
          escAttr(item.src) +
          '" allow="autoplay; fullscreen; picture-in-picture" allowfullscreen></iframe>\n                                    </div>\n                                </div>'
        );
      }
      fail('portfolio ' + data.slug + ' items[' + i + ']: type must be image|video');
    })
    .join('\n');
  return [
    '                            <div class="grid-item large-pic">',
    inners,
    '                            </div>'
  ].join('\n');
}

/* ---------- homepage collage ---------- */
function renderCollageBlock(b, i) {
  requireKeys(b, ['id', 'layout', 'title', 'href', 'dataContent', 'images'], 'homepage.collage[' + i + ']');
  requireKeys(b.images, ['picone', 'pictwo', 'picthree'], 'homepage.collage[' + i + '].images');
  if (b.layout === 'default') {
    return [
      '                    <div id="' + escAttr(b.id) + '" class="row three-pics clr-sec" data-color="pink" data-content="' + escAttr(b.dataContent) + '">',
      '                        <div class="sectiontxt"></div>',
      '                        <div class="col-lg-12 titlebx">',
      '                            <h2 class="bs-heading typ-sml typ-white sml-width">' + escAttr(b.title) + '</h2>',
      '                        </div>',
      '                        <div class="col-lg-12">',
      '                            <p class="cm-para typ-desktop">',
      '                                Once in a while, right in the middle of an ordinary life.. Love gives us a fairytale',
      '                                It sounds like a song of ages, like a prophecy of time',
      '                                like it\'s meant to be, a perpetual familiarity',
      '                            </p>',
      '                        </div>',
      '                        <div class="col-lg-6 ctm-col sec-two-img">',
      '                            <p class="fixedtxt fst-text">' + escAttr(b.title) + '</p>',
      '                            <a href="' + escAttr(b.href) + '">',
      '                                <img src="' + escAttr(b.images.picone) + '" alt="img" class="picone"',
      '                                    data-500-top="transform:translateY(120px)" data-0-top="transform:translateY(0px)">',
      '                            </a>',
      '                            <a href="' + escAttr(b.href) + '">',
      '                                <img src="' + escAttr(b.images.pictwo) + '" alt="img" class="pictwo"',
      '                                    data-500-top="transform:translateY(30px)" data-0-top="transform:translateY(0px)">',
      '                            </a>',
      '                        </div>',
      '                        <div class="col-lg-6 ctm-col single-large-img">',
      '                            <a href="' + escAttr(b.href) + '">',
      '                                <img src="' + escAttr(b.images.picthree) + '" alt="img" class="picthree"',
      '                                    data-500-top="transform:translateY(190px)" data-0-top="transform:translateY(0px)">',
      '                            </a>',
      '                        </div>',
      '                    </div>'
    ].join('\n');
  }
  if (b.layout === 'reverse') {
    return [
      '                    <div id="' + escAttr(b.id) + '" class="row three-pics typ-reverse clr-sec" data-color="pink"',
      '                        data-content="' + escAttr(b.dataContent) + '">',
      '                        <div class="col-lg-12 titlebx rev-sec">',
      '                            <h2 class="bs-heading typ-sml typ-white sml-width">' + escAttr(b.title) + '</h2>',
      '                        </div>',
      '                        <div class="col-lg-6 order-lg-2 ctm-col sec-two-img typ-right">',
      '                            <a href="' + escAttr(b.href) + '">',
      '                                <img src="' + escAttr(b.images.picone) + '" alt="img" class="picone"',
      '                                    data-500-top="transform:translateY(50px)" data-0-top="transform:translateY(0px)">',
      '                            </a>',
      '                            <a href="' + escAttr(b.href) + '">',
      '                                <img src="' + escAttr(b.images.pictwo) + '" alt="img" class="pictwo"',
      '                                    data-500-top="transform:translateY(120px)" data-0-top="transform:translateY(0px)">',
      '                            </a>',
      '                        </div>',
      '                        <div class="col-lg-6 order-lg-1 ctm-col single-large-img">',
      '                            <p class="fixedtxt">' + escAttr(b.title) + '</p>',
      '                            <a href="' + escAttr(b.href) + '">',
      '                                <img src="' + escAttr(b.images.picthree) + '" alt="img" class="picthree"',
      '                                    data-500-top="transform:translateY(160px)" data-0-top="transform:translateY(0px)">',
      '                            </a>',
      '                        </div>',
      '                    </div>'
    ].join('\n');
  }
  if (b.layout === 'updown') {
    return [
      '                    <div id="' + escAttr(b.id) + '" class="row three-pics updown-alignment clr-sec" data-color="pink"',
      '                        data-content="' + escAttr(b.dataContent) + '">',
      '                        <div class="col-lg-12 titlebx">',
      '                            <h2 class="bs-heading typ-sml typ-white sml-width">' + escAttr(b.title) + '</h2>',
      '                        </div>',
      '                        <div class="col-xl-7 col-lg-7 col-md-12 order-lg-2 order-xl-2 ctm-col">',
      '                            <a href="' + escAttr(b.href) + '">',
      '                                <img src="' + escAttr(b.images.picthree) + '" alt="img" class="picthree"',
      '                                    data-500-top="transform:translateY(60px)" data-0-top="transform:translateY(0px)">',
      '                            </a>',
      '                            <a href="' + escAttr(b.href) + '">',
      '                                <img src="' + escAttr(b.images.pictwo) + '" alt="img" class="pictwo desktop-img"',
      '                                    data-900-top="transform:translateY(80px)" data-0-top="transform:translateY(0px)">',
      '                            </a>',
      '                        </div>',
      '                        <div class="col-xl-5  col-lg-5 col-md-12 order-lg-1 order-xl-1 ctm-col sec-two-img typ-left">',
      '                            <a href="' + escAttr(b.href) + '">',
      '                                <img src="' + escAttr(b.images.picone) + '" alt="img" class="picone"',
      '                                    data-500-top="transform:translateY(150px)" data-0-top="transform:translateY(0px)">',
      '                            </a>',
      '                            <a href="' + escAttr(b.href) + '">',
      '                                <img src="' + escAttr(b.images.pictwo) + '" alt="img" class="pictwo mobile-img"',
      '                                    data-500-top="transform:translateY(190px)" data-0-top="transform:translateY(0px)">',
      '                            </a>',
      '                            <p class="fixedtxt typ-btm-start">' + escAttr(b.title) + '</p>',
      '                        </div>',
      '                    </div>'
    ].join('\n');
  }
  fail('homepage.collage[' + i + ']: layout must be default|reverse|updown');
}

function renderCollage(data) {
  if (!Array.isArray(data.collage)) fail('homepage.json: collage must be an array');
  return data.collage.map(renderCollageBlock).join('\n');
}

function renderLetterBanner(data) {
  requireKeys(data, ['letterBanner'], 'homepage');
  const b = data.letterBanner;
  requireKeys(b, ['image', 'mobileImage', 'subtitle', 'title', 'videoUrl'], 'homepage.letterBanner');
  return [
    '            <div id="hidediv" class="bs-banner typ-full set-bg" data-img="' + escAttr(b.image) + '"',
    '                data-mob-img="' + escAttr(b.mobileImage) + '">',
    '                <div class="container">',
    '                    <div class="titlebx">',
    '                        <p class="subtitle">' + escAttr(b.subtitle) + '</p>',
    '                        <h2 class="bs-heading typ-big">' + escAttr(b.title) + '</h2>',
    '                        <a href="#" class="bs-btn typ-view video-btn" data-toggle="modal"',
    '                            data-src="' + escAttr(b.videoUrl) + '" data-target="#myModal"><span>play<i',
    '                                    class="icon icon-down-arrow"></i></span></a>',
    '                    </div>',
    '                </div>',
    '            </div>'
  ].join('\n');
}

function renderAlbumRows(data) {
  if (!Array.isArray(data.albumRows)) fail('homepage.json: albumRows must be an array');
  const rows = data.albumRows
    .map(function (row, i) {
      requireKeys(row, ['layout', 'title', 'imageLarge', 'imageSmall'], 'homepage.albumRows[' + i + ']');
      const href = row.href || '#';
      const linked = !!row.href;
      if (row.layout === 'right') {
        const imgL = linked
          ? '<a href="' + escAttr(href) + '">\n                                <img src="' + escAttr(row.imageLarge) + '" alt="img"\n                                    data-500-top="transform:translateY(150px)" data-0-top="transform:translateY(0px)">\n                            </a>'
          : '<img src="' + escAttr(row.imageLarge) + '" alt="img" data-500-top="transform:translateY(150px)"\n                                data-0-top="transform:translateY(0px)">';
        const imgS = linked
          ? '<a href="' + escAttr(href) + '">\n                                <img src="' + escAttr(row.imageSmall) + '" alt="img" class="' + escAttr(row.smallClass || '') + '"\n                                    data-500-top="transform:translateY(190px)" data-0-top="transform:translateY(0px)">\n                            </a>'
          : '<img src="' + escAttr(row.imageSmall) + '" alt="img" data-500-top="transform:translateY(190px)"\n                                data-0-top="transform:translateY(0px)">';
        return [
          '                    <div class="row  typ-right">',
          '                        <div class="col-7 col-lg-6 img-right">',
          '                            ' + imgL,
          '                        </div>',
          '                        <div class="col-5 col-lg-6 sml-pic">',
          '                            <h2 class="bs-heading typ-sml">' + escAttr(row.title) + '</h2>',
          '                            ' + imgS,
          '                        </div>',
          '                    </div>'
        ].join('\n');
      }
      if (row.layout === 'left') {
        return [
          '                    <div class="row middle-row typ-left">',
          '                        <div class="col-5 col-lg-6 sml-pic leftside">',
          '                            <h2 class="bs-heading typ-sml leftheading">' + escAttr(row.title) + '</h2>',
          '                            <a href="' + escAttr(href) + '">',
          '                                <img src="' + escAttr(row.imageSmall) + '" alt="img"',
          '                                    data-500-top="transform:translateY(150px)" data-0-top="transform:translateY(0px)">',
          '                            </a>',
          '                        </div>',
          '                        <div class="col-7 col-lg-6 img-left">',
          '                            <a href="' + escAttr(href) + '">',
          '                                <img src="' + escAttr(row.imageLarge) + '" alt="img" class="' + escAttr(row.smallClass || 'shiva') + '"',
          '                                    data-500-top="transform:translateY(190px)" data-0-top="transform:translateY(0px)">',
          '                            </a>',
          '                        </div>',
          '                    </div>'
        ].join('\n');
      }
      fail('homepage.albumRows[' + i + ']: layout must be left|right');
    })
    .join('\n');

  requireKeys(data, ['albumCta'], 'homepage');
  const cta = data.albumCta;
  requireKeys(cta, ['text', 'href', 'image'], 'homepage.albumCta');
  const ctaHtml = [
    '            <div class="mod-spread-patch">',
    '                <div class="container">',
    '                    <div class="inner-sec set-bg" data-img="' + escAttr(cta.image) + '">',
    '                        <div class="content">',
    '                            <p>' + cta.text + '</p>',
    '                            <a href="' + escAttr(cta.href) + '" class="bs-btn typ-view"><span>view <i',
    '                                        class="icon icon-down-arrow"></i></span></a>',
    '                        </div>',
    '                    </div>',
    '                </div>',
    '            </div>'
  ].join('\n');

  return (
    '            <div class="bs-collage">\n                <div class="container">\n' +
    rows +
    '\n                </div>\n            </div>\n' +
    ctaHtml
  );
}

function renderFilmTile(tile, i, ctx) {
  requireKeys(tile, ['titleHtml', 'image', 'alt', 'label', 'videoUrl', 'side'], ctx + '[' + i + ']');
  if (tile.side === 'left') {
    return [
      '                    <div class="row bs-img-txt align-items-center">',
      '                        <div class="col-7 col-lg-6 albumpic first-img">',
      '                            <p class="fixedtxt typ-bg-img">' + escAttr(tile.label) + '</p>',
      '                            <img src="' + escAttr(tile.image) + '" alt="' + escAttr(tile.alt) + '" data-500-top="transform:translateY(160px)"',
      '                                data-0-top="transform:translateY(0px)">',
      '                            <h2 class="bs-heading typ-white">' + tile.titleHtml + '</h2>',
      '                        </div>',
      '                        <div class="col-5 col-lg-6">',
      '                            <div class="container">',
      '                                <div class="action-btn">',
      '                                    ' + playBtn(tile.videoUrl),
      videoModal(tile.videoUrl),
      '                                </div>',
      '                            </div>',
      '                        </div>',
      '                    </div>'
    ].join('\n');
  }
  if (tile.side === 'right') {
    return [
      '                    <div class="row bs-img-txt align-items-center">',
      '                        <div class="col-5 col-lg-6">',
      '                            <div class="container">',
      '                                <p class="fixedtxt typ-bg-img md-none">' + escAttr(tile.label) + '</p>',
      '                                <div class="action-btn typ-left">',
      '                                    ' + playBtn(tile.videoUrl),
      videoModal(tile.videoUrl),
      '                                </div>',
      '                            </div>',
      '                        </div>',
      '                        <div class="col-7 col-lg-6  albumpic sec-img">',
      '                            <img src="' + escAttr(tile.image) + '" alt="' + escAttr(tile.alt) + '" data-500-top="transform:translateY(170px)"',
      '                                data-0-top="transform:translateY(0px)">',
      '                            <h2 class="bs-heading typ-white typ-reverse brder-div">' + tile.titleHtml + '</h2>',
      '                        </div>',
      '                    </div>'
    ].join('\n');
  }
  fail(ctx + '[' + i + ']: side must be left|right');
}

function renderHomeFilmTiles(data) {
  if (!Array.isArray(data.filmTiles)) fail('homepage.json: filmTiles must be an array');
  const tiles = data.filmTiles.map(function (t, i) {
    return renderFilmTile(t, i, 'homepage.filmTiles');
  }).join('\n');
  requireKeys(data, ['filmCta'], 'homepage');
  const cta = data.filmCta;
  requireKeys(cta, ['text', 'href', 'image'], 'homepage.filmCta');
  return (
    '                <div class="mod-borderbox">\n                    <div class="seperator"></div>\n' +
    tiles +
    '\n                </div>\n                <div class="mod-spread-patch typ-small">\n                    <div class="container">\n                        <div class="inner-sec set-bg" data-img="' +
    escAttr(cta.image) +
    '">\n                            <div class="content">\n                                <p class="mob-p-t-40">' +
    cta.text +
    '</p>\n                                <a href="' +
    escAttr(cta.href) +
    '" class="bs-btn typ-view"><span>view <i\n                                            class="icon icon-down-arrow"></i></span></a>\n                            </div>\n                        </div>\n                    </div>\n                </div>'
  );
}

function renderArtists(list, ctx) {
  if (!Array.isArray(list)) fail(ctx + ' must be an array');
  return list
    .map(function (a, i) {
      const src = typeof a === 'string' ? a : a.image;
      if (!src) fail(ctx + '[' + i + '] missing image');
      return (
        '                            <div class="swiper-slide">\n                                <img src="' +
        escAttr(src) +
        '" alt="artists">\n                            </div>'
      );
    })
    .join('\n');
}

function renderInstagram(data) {
  if (!Array.isArray(data.instagram)) fail('homepage.json: instagram must be an array');
  return data.instagram
    .map(function (s, i) {
      requireKeys(s, ['href', 'image'], 'homepage.instagram[' + i + ']');
      return [
        '                                <div class="swiper-slide">',
        '                                    <a href="' + escAttr(s.href) + '" target="_blank"',
        '                                        rel="noopener noreferrer">',
        '                                        <img src="' + escAttr(s.image) + '" alt="instafeed">',
        '                                    </a>',
        '                                </div>'
      ].join('\n');
    })
    .join('\n');
}

function renderSocialLinks(data) {
  if (!Array.isArray(data.socialLinks)) fail('homepage.json: socialLinks must be an array');
  return data.socialLinks
    .map(function (s, i) {
      requireKeys(s, ['href', 'class', 'icon'], 'homepage.socialLinks[' + i + ']');
      return (
        '                        <a href="' +
        escAttr(s.href) +
        '" target="_blank"\n                            class="' +
        escAttr(s.class) +
        '"><i class="icon ' +
        escAttr(s.icon) +
        '"></i> </a>'
      );
    })
    .join('\n');
}

/* ---------- films ---------- */
function renderFilmsHero(data) {
  requireKeys(data, ['hero'], 'films-landing');
  const h = data.hero;
  requireKeys(h, ['image', 'mobileImage', 'titleHtml', 'videoUrl'], 'films-landing.hero');
  return [
    '            <div id="hidediv" class="bs-banner typ-full set-bg" data-img="' + escAttr(h.image) + '"',
    '                data-mob-img="' + escAttr(h.mobileImage) + '">',
    '                <div class="container">',
    '                    <div class="titlebx">',
    '                        <h2 class="bs-heading typ-big">' + h.titleHtml + '</h2>',
    '                        <a href="#" class="bs-btn typ-view video-btn" data-toggle="modal"',
    '                            data-src="' + escAttr(h.videoUrl) + '" data-target="#myModal"><span>play<i',
    '                                    class="icon icon-down-arrow"></i></span></a>',
    '                    </div>',
    '                </div>',
    '            </div>'
  ].join('\n');
}

function renderFilmsTiles(data, key, ctx) {
  if (!Array.isArray(data[key])) fail(ctx + ': ' + key + ' must be an array');
  const tiles = data[key]
    .map(function (t, i) {
      return renderFilmTile(t, i, ctx + '.' + key);
    })
    .join('\n');
  return '                <div class="mod-borderbox">\n                    <div class="seperator"></div>\n' + tiles + '\n                </div>';
}

function renderTeasers(data) {
  if (!Array.isArray(data.teasers)) fail('films-landing.json: teasers must be an array');
  return data.teasers
    .map(function (t, i) {
      requireKeys(t, ['image', 'alt', 'videoHref'], 'films-landing.teasers[' + i + ']');
      return [
        '                            <div class="col-6 ctm-cols">',
        '                                <div class="popup-gallery mb-20">',
        '                                    <a href="' + escAttr(t.videoHref) + '" class="video">',
        '                                        <img src="' + escAttr(t.image) + '" alt="' + escAttr(t.alt) + '">',
        '                                    </a>',
        '                                </div>',
        '                            </div>'
      ].join('\n');
    })
    .join('\n');
}

function renderReels(data) {
  if (!Array.isArray(data.reels)) fail('films-landing.json: reels must be an array');
  return data.reels
    .map(function (r, i) {
      requireKeys(r, ['image', 'alt', 'videoHref'], 'films-landing.reels[' + i + ']');
      return [
        '                            <div class="swiper-slide">',
        '                                <a href="' + escAttr(r.videoHref) + '" class="video">',
        '                                    <figure>',
        '                                        <img src="' + escAttr(r.image) + '" alt="' + escAttr(r.alt) + '">',
        '                                    </figure>',
        '                                </a>',
        '                            </div>'
      ].join('\n');
    })
    .join('\n');
}

function renderFilmsListing(data) {
  if (!Array.isArray(data.films)) fail('films-listing.json: films must be an array');
  // listing wraps each film in sec sec1 with flower vector
  return data.films
    .map(function (tile, i) {
      requireKeys(tile, ['titleHtml', 'image', 'alt', 'label', 'videoUrl'], 'films-listing.films[' + i + ']');
      // Each film gets left + right row pair using same data (matches current listing pattern)
      const left = Object.assign({}, tile, { side: 'left' });
      const right = Object.assign({}, tile, {
        side: 'right',
        titleHtml: tile.titleHtmlListing || tile.titleHtml.replace(/<br\s*\/?>/gi, ' ')
      });
      return (
        '                        <div class="sec sec1">\n                            <div class="seperator"></div>\n                            <div class="btm-line"></div>\n' +
        renderFilmTile(left, i, 'films-listing.films').replace(/class="row bs-img-txt/g, 'class="row bs-img-txt') +
        '\n                                <img src="assets/images/films/vector-flower.png" alt="flower" class="vector-flow">\n' +
        renderFilmTile(right, i, 'films-listing.films') +
        '\n                        </div>'
      );
    })
    .join('\n');
}

function main() {
  const home = readJson('data/homepage.json');
  writeOut('home-carousel.html', renderCarousel(home));
  writeOut('home-collage.html', renderCollage(home));
  writeOut('home-letter-banner.html', renderLetterBanner(home));
  writeOut('home-album.html', renderAlbumRows(home));
  writeOut('home-film-tiles.html', renderHomeFilmTiles(home));
  writeOut('home-artists.html', renderArtists(home.artists, 'homepage.artists'));
  writeOut('home-instagram.html', renderInstagram(home));
  writeOut('home-social-links.html', renderSocialLinks(home));

  writeOut('blog-landing-cards.html', renderLanding(readJson('data/blog-landing.json')));

  const blogsDir = path.join(ROOT, 'data', 'blogs');
  fs.readdirSync(blogsDir)
    .filter(function (f) {
      return f.endsWith('.json');
    })
    .forEach(function (file) {
      const data = readJson(path.join('data', 'blogs', file));
      writeOut('blog-' + data.slug + '-gallery.html', renderGallery(data));
    });

  const portDir = path.join(ROOT, 'data', 'portfolios');
  if (fs.existsSync(portDir)) {
    fs.readdirSync(portDir)
      .filter(function (f) {
        return f.endsWith('.json');
      })
      .forEach(function (file) {
        const data = readJson(path.join('data', 'portfolios', file));
        writeOut('portfolio-' + data.slug + '-stack.html', renderStack(data));
      });
  }

  const filmsLanding = readJson('data/films-landing.json');
  writeOut('films-landing-hero.html', renderFilmsHero(filmsLanding));
  writeOut('films-landing-tiles.html', renderFilmsTiles(filmsLanding, 'films', 'films-landing'));
  writeOut('films-landing-teasers.html', renderTeasers(filmsLanding));
  writeOut('films-landing-reels.html', renderReels(filmsLanding));
  writeOut('films-landing-artists.html', renderArtists(filmsLanding.artists || home.artists, 'films-landing.artists'));

  writeOut('films-listing-tiles.html', renderFilmsListing(readJson('data/films-listing.json')));
}

main();
