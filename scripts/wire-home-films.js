#!/usr/bin/env node
'use strict';
const fs = require('fs');
const path = require('path');
const ROOT = path.join(__dirname, '..');

function patchFile(rel, transforms) {
  const file = path.join(ROOT, rel);
  let html = fs.readFileSync(file, 'utf8');
  const nl = html.indexOf('\r\n') !== -1 ? '\r\n' : '\n';
  transforms.forEach(function (t, idx) {
    const re = t.re;
    if (!re.test(html)) {
      throw new Error(rel + ' transform ' + idx + ' failed: ' + t.name);
    }
    html = html.replace(re, t.repl);
    console.log('  ok', t.name);
  });
  fs.writeFileSync(file, html);
  console.log('patched', rel);
}

patchFile('index.shtml', [
  {
    name: 'collage',
    re: /(<div class="container">)\s*<div id="sec-01"[\s\S]*?(<\/div>\s*<\/div>\s*<\/section>\s*<!-- section collage pic end -->)/,
    repl: '$1\n                    <!--#include virtual="view/generated/home-collage.html" -->\n                $2'
  },
  {
    name: 'letter',
    re: /<div id="hidediv" class="bs-banner typ-full set-bg"[\s\S]*?<\/div>\s*<\/section>\s*<!-- section full banner end -->/,
    repl: '<!--#include virtual="view/generated/home-letter-banner.html" -->\n        </section>\n        <!-- section full banner end -->'
  },
  {
    name: 'album',
    re: /<div class="bs-collage">\s*<div class="container">\s*<div class="row  typ-right">[\s\S]*?<\/div>\s*<\/div>\s*<div class="mod-spread-patch">[\s\S]*?<\/div>\s*<\/div>\s*<\/div>\s*<\/section>\s*<!-- section collage pic end -->\s*<!-- section weeding films start -->/,
    repl: '<!--#include virtual="view/generated/home-album.html" -->\n        </section>\n        <!-- section collage pic end -->\n\n        <!-- section weeding films start -->'
  },
  {
    name: 'films',
    re: /<div class="mod-borderbox">\s*<div class="seperator"><\/div>\s*<div class="row bs-img-txt align-items-center">\s*<div class="col-7 col-lg-6 albumpic first-img">[\s\S]*?<div class="mod-spread-patch typ-small">[\s\S]*?<\/div>\s*<\/div>\s*<\/div>\s*<\/div>\s*<\/section>\s*<!-- section weeding films end -->/,
    repl: '<!--#include virtual="view/generated/home-film-tiles.html" -->\n            </div>\n        </section>\n        <!-- section weeding films end -->'
  },
  {
    name: 'artists',
    re: /(<div class="swiper-container artists-swiper">\s*<div class="swiper-wrapper">)\s*<div class="swiper-slide">\s*<img src="assets\/images\/artists1\.png"[\s\S]*?(<\/div>\s*<\/div>\s*<!-- Add Arrows -->)/,
    repl: '$1\n                            <!--#include virtual="view/generated/home-artists.html" -->\n                        $2'
  },
  {
    name: 'instagram',
    re: /(<div class="swiper-wrapper" id="instafeed">)\s*<div class="swiper-slide">[\s\S]*?(<\/div>\s*<!-- Add Arrows -->\s*<div class="swiper-button-next)/,
    repl: '$1\n                                <!--#include virtual="view/generated/home-instagram.html" -->\n                            $2'
  },
  {
    name: 'social',
    re: /(<div class="mod-social-links social-icons">)\s*<a href="https:\/\/www\.youtube\.com[\s\S]*?(<\/div>\s*<\/div>\s*<\/div>\s*<figure class="btm-vector">)/,
    repl: '$1\n                        <!--#include virtual="view/generated/home-social-links.html" -->\n                    $2'
  }
]);

patchFile('films-landing.shtml', [
  {
    name: 'hero',
    re: /<div id="hidediv" class="bs-banner typ-full set-bg"[\s\S]*?<\/div>\s*<\/section>\s*<!-- section full banner end -->/,
    repl: '<!--#include virtual="view/generated/films-landing-hero.html" -->\n        </section>\n        <!-- section full banner end -->'
  },
  {
    name: 'tiles',
    re: /<div class="mod-borderbox">\s*<div class="seperator"><\/div>\s*<div class="row bs-img-txt align-items-center">\s*<div class="col-7 col-lg-6 albumpic first-img">\s*<p class="fixedtxt typ-bg-img">wedding film<\/p>\s*<img src="assets\/images\/films-nidhi-ranjeev\.jpg"[\s\S]*?(<\/div>\s*<\/section>\s*<!-- section weeding films end -->)/,
    repl: '<!--#include virtual="view/generated/films-landing-tiles.html" -->\n            $1'
  },
  {
    name: 'teasers',
    re: /(<div class="row typ-teasers-grid">)\s*<div class="col-6 ctm-cols">[\s\S]*?(<\/div>\s*<\/div>\s*<\/div>\s*<\/div>\s*<\/section>\s*<!-- section micro videos start -->)/,
    repl: '$1\n                            <!--#include virtual="view/generated/films-landing-teasers.html" -->\n                        $2'
  },
  {
    name: 'reels',
    re: /(<div class="swiper-container video-container">\s*<div class="swiper-wrapper">)\s*<div class="swiper-slide">\s*<a href="https:\/\/vimeo\.com\/968638491"[\s\S]*?(<\/div>\s*<\/div>\s*<div class="swiper-button-next">)/,
    repl: '$1\n                            <!--#include virtual="view/generated/films-landing-reels.html" -->\n                        $2'
  },
  {
    name: 'artists',
    re: /(<div class="swiper-container artists-swiper">\s*<div class="swiper-wrapper">)\s*<div class="swiper-slide">\s*<img src="assets\/images\/artists1\.png" alt="img">[\s\S]*?(<\/div>\s*<\/div>\s*<!-- Add Arrows -->)/,
    repl: '$1\n                            <!--#include virtual="view/generated/films-landing-artists.html" -->\n                        $2'
  }
]);

patchFile('films-listing.shtml', [
  {
    name: 'tiles',
    re: /(<div class="mod-borderbox typ-film-listing">)\s*<div class="sec sec1">[\s\S]*?(<\/div>\s*<\/div>\s*<\/section>)/,
    repl: '$1\n                        <!--#include virtual="view/generated/films-listing-tiles.html" -->\n                    $2'
  }
]);

console.log('done');
