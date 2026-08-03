#!/usr/bin/env node
/* Stage E2A — static residue scan.
   Fails if Engine-owned HTML/JS contains a *fallback* occurrence of the
   literals this pack was tasked with removing. The NZ Trip Package's own
   canonical config/data files legitimately contain this Trip's real data
   (that's the whole point of TRIP_CONFIG/data.js) — those files are
   excluded by name, exactly as the contract specifies: "Do not fail merely
   because the NZ Trip Package itself correctly contains NZ data."

   Comments are stripped before scanning so explanatory prose referencing
   the old fallback values (e.g. this repo's own commit-message-style
   comments describing what was fixed) doesn't produce false positives —
   only literal values reachable at runtime are flagged. */
'use strict';
const fs = require('fs');
const path = require('path');

const REPO_ROOT = path.join(__dirname, '..');

// These files ARE the Trip Package for this deploy (trip identity, theme,
// assets, and the trip's own itinerary/booking/party data) — not Engine
// fallback code. A future build step is expected to swap these per Trip;
// their content is out of scope for E2A.
const TRIP_PACKAGE_FILES = new Set([
  'trip-config.js',
  'theme-config.js',
  'asset-config.js',
  'locale-config.js',
  'money-config.js',
  'data.js'
]);

// Known residue explicitly deferred because the owning behaviour is on the
// E2A "DO NOT MODIFY" list (Complete Trip behaviour). Left here — not
// silently dropped — so the deferral is visible rather than the test just
// not looking. Tracked as known remaining work for a later stage.
const DEFERRED_OUT_OF_SCOPE = new Set([
  'complete-runtime.js'
]);

const RESIDUE_LITERALS = [
  'Lee', 'Fowlers', 'Yau',
  'MEL · Lee',
  'MEL · CHC · ZQN',
  'Rental Cars 247 · ASX',
  'nz-family-2026',
  'ADVENTURE AWAITS',
  'NEW ZEALAND 2026',
  'nz-adventure-logo.png'
];

function stripComments(source, ext) {
  if (ext === '.js') {
    // Strip /* ... */ and // ... comments. Good enough for a residue scan
    // (not a real parser) — string literals containing "//" inside this
    // codebase's simple string usage aren't a concern for these specific
    // literals.
    return source
      .replace(/\/\*[\s\S]*?\*\//g, '')
      .replace(/(^|[^:])\/\/.*$/gm, '$1');
  }
  if (ext === '.html') {
    return source.replace(/<!--[\s\S]*?-->/g, '');
  }
  return source;
}

function scanFile(file) {
  const ext = path.extname(file);
  const source = fs.readFileSync(path.join(REPO_ROOT, file), 'utf8');
  const scanned = stripComments(source, ext);
  const hits = [];
  for (const literal of RESIDUE_LITERALS) {
    if (scanned.includes(literal)) hits.push(literal);
  }
  return hits;
}

function main() {
  const allFiles = fs.readdirSync(REPO_ROOT).filter(f => /\.(html|js)$/.test(f));
  let failures = 0;

  for (const file of allFiles) {
    if (TRIP_PACKAGE_FILES.has(file)) continue;
    if (DEFERRED_OUT_OF_SCOPE.has(file)) {
      const hits = scanFile(file);
      if (hits.length) console.warn(`KNOWN (deferred, not E2A scope): ${file} — ${hits.join(', ')}`);
      continue;
    }
    const hits = scanFile(file);
    if (hits.length) {
      failures++;
      console.error(`FAIL: ${file} contains Engine fallback residue: ${hits.join(', ')}`);
    }
  }

  if (failures === 0) {
    console.log(`PASS: no Engine-owned file (${allFiles.length - TRIP_PACKAGE_FILES.size} scanned, ${TRIP_PACKAGE_FILES.size} Trip Package files excluded) contains residue literals.`);
    process.exit(0);
  } else {
    console.error(`E2A STATIC RESIDUE SCAN: FAILED (${failures} file(s))`);
    process.exit(1);
  }
}

main();
