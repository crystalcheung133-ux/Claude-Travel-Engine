#!/usr/bin/env node
/* Stage E2A — first-paint source test.
   Asserts the raw index.html source (i.e. what a browser has before any
   script runs, or with JS disabled) contains no literal Trip identity in
   the splash block: no logo filename, no slogan, no destination text. */
'use strict';
const fs = require('fs');
const path = require('path');

const REPO_ROOT = path.join(__dirname, '..');
const html = fs.readFileSync(path.join(REPO_ROOT, 'index.html'), 'utf8');

let failures = 0;
function fail(msg) { failures++; console.error('FAIL: ' + msg); }
function ok(msg) { console.log('PASS: ' + msg); }

const FORBIDDEN = ['nz-adventure-logo.png', 'ADVENTURE AWAITS', 'NEW ZEALAND 2026'];
for (const literal of FORBIDDEN) {
  if (html.includes(literal)) fail(`index.html raw source still contains "${literal}"`);
  else ok(`index.html raw source contains no "${literal}"`);
}

// The splash logo must carry the data-brand-logo hook and no src attribute
// (so no logo request fires, and no broken-image icon can appear, before
// applyTripIdentity() sets a real src).
const splashLogoMatch = html.match(/<img[^>]*class="splash-logo"[^>]*>/);
if (!splashLogoMatch) {
  fail('could not find the splash-logo <img> tag in index.html');
} else {
  const tag = splashLogoMatch[0];
  if (/\bsrc="/.test(tag)) fail('splash-logo <img> still has a literal src attribute pre-JS: ' + tag);
  else ok('splash-logo <img> has no src attribute pre-JS (no broken-image request possible)');
  if (/data-brand-logo="splash"/.test(tag)) ok('splash-logo <img> still carries the data-brand-logo hook for applyTripIdentity()');
  else fail('splash-logo <img> lost its data-brand-logo hook: ' + tag);
}

// Slogan/destination elements must exist (for applyTripIdentity() to fill)
// but be empty pre-JS.
for (const key of ['splashSlogan', 'splashDestination']) {
  const re = new RegExp(`<[a-z0-9]+[^>]*data-brand-text="${key}"[^>]*>([^<]*)</[a-z0-9]+>`, 'i');
  const m = html.match(re);
  if (!m) { fail(`could not find data-brand-text="${key}" element in index.html`); continue; }
  if (m[1].trim() === '') ok(`data-brand-text="${key}" element is empty pre-JS`);
  else fail(`data-brand-text="${key}" element still has literal text pre-JS: "${m[1]}"`);
}

if (failures === 0) {
  console.log('E2A FIRST-PAINT SOURCE TEST: ALL PASSED');
  process.exit(0);
} else {
  console.error(`E2A FIRST-PAINT SOURCE TEST: FAILED (${failures})`);
  process.exit(1);
}
