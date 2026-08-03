#!/usr/bin/env node
/* generate-manifest.js — Stage E2A-4.
   Deterministically builds manifest.webmanifest from the Engine's existing
   canonical config modules (trip-config.js / theme-config.js /
   asset-config.js) instead of maintaining a second, hand-authored copy of
   the same branding values. Run this any time trip identity, theme colours
   or icon assets change, and commit the regenerated manifest.webmanifest
   alongside that change.

   Usage:
     node generate-manifest.js                 # writes manifest.webmanifest in the repo root
     node generate-manifest.js --check          # verifies manifest.webmanifest already matches config (used by CI)
     node generate-manifest.js --root <dir>     # generate for a different config root (e.g. a test fixture)
*/
'use strict';
const fs = require('fs');
const path = require('path');
const vm = require('vm');

function loadConfig(root) {
  // asset-config.js, theme-config.js and locale-config.js must all load
  // before trip-config.js, the same order the Engine's own <script> tags
  // use, since trip-config.js reads root.ASSET_CONFIG/THEME_CONFIG/
  // LOCALE_CONFIG at parse time.
  const sandbox = { document: undefined, console };
  sandbox.globalThis = sandbox;
  vm.createContext(sandbox);
  for (const file of ['asset-config.js', 'theme-config.js', 'locale-config.js', 'trip-config.js']) {
    const p = path.join(root, file);
    const source = fs.readFileSync(p, 'utf8');
    vm.runInContext(source, sandbox, { filename: file });
  }
  const { TRIP_CONFIG, THEME_CONFIG, ASSET_CONFIG } = sandbox;
  if (!TRIP_CONFIG || !THEME_CONFIG || !ASSET_CONFIG) {
    throw new Error('Could not load TRIP_CONFIG/THEME_CONFIG/ASSET_CONFIG — config file structure may have changed');
  }
  return { TRIP_CONFIG, THEME_CONFIG, ASSET_CONFIG };
}

function buildManifest({ TRIP_CONFIG, THEME_CONFIG, ASSET_CONFIG }) {
  const bg = THEME_CONFIG.colors && THEME_CONFIG.colors.background;
  if (!bg) throw new Error('THEME_CONFIG.colors.background is required to generate manifest.webmanifest');
  const icon192 = ASSET_CONFIG.icons && ASSET_CONFIG.icons.icon192;
  const icon512 = ASSET_CONFIG.icons && ASSET_CONFIG.icons.icon512;
  if (!icon192 || !icon512) throw new Error('ASSET_CONFIG.icons.icon192/icon512 are required to generate manifest.webmanifest');
  if (!TRIP_CONFIG.tripName || !TRIP_CONFIG.shortName) throw new Error('TRIP_CONFIG.tripName/shortName are required to generate manifest.webmanifest');

  return {
    name: TRIP_CONFIG.tripName,
    short_name: TRIP_CONFIG.shortName,
    start_url: './index.html?coldLaunch=1',
    scope: './',
    display: 'standalone',
    background_color: bg,
    theme_color: bg,
    icons: [
      { src: icon192, sizes: '192x192', type: 'image/png' },
      { src: icon512, sizes: '512x512', type: 'image/png' }
    ]
  };
}

function main() {
  const args = process.argv.slice(2);
  const checkOnly = args.includes('--check');
  const rootIdx = args.indexOf('--root');
  const root = rootIdx !== -1 ? args[rootIdx + 1] : path.join(__dirname);
  const outPath = path.join(root, 'manifest.webmanifest');

  const cfg = loadConfig(root);
  const manifest = buildManifest(cfg);
  const json = JSON.stringify(manifest, null, 2) + '\n';

  if (checkOnly) {
    const current = fs.existsSync(outPath) ? fs.readFileSync(outPath, 'utf8') : null;
    if (current !== json) {
      console.error('FAIL: manifest.webmanifest does not match the values generated from TRIP_CONFIG/THEME_CONFIG/ASSET_CONFIG.');
      console.error('Run: node generate-manifest.js');
      process.exit(1);
    }
    console.log('PASS: manifest.webmanifest matches generated config values.');
    return;
  }

  fs.writeFileSync(outPath, json);
  console.log('Wrote ' + outPath);
}

if (require.main === module) {
  try {
    main();
  } catch (e) {
    console.error('FAIL: ' + e.message);
    process.exit(1);
  }
}

module.exports = { loadConfig, buildManifest };
