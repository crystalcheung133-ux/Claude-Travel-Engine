#!/usr/bin/env node
/* Stage E2A — manifest generation test.
   Verifies generate-manifest.js derives correct values from a Trip's own
   config for both the real NZ config and a synthetic non-NZ fixture, and
   that icon paths referenced by the generated manifest exist on disk. */
'use strict';
const fs = require('fs');
const path = require('path');
const os = require('os');

const REPO_ROOT = path.join(__dirname, '..');
const { buildManifest, loadConfig } = require(path.join(REPO_ROOT, 'generate-manifest.js'));

let failures = 0;
function fail(msg) { failures++; console.error('FAIL: ' + msg); }
function ok(msg) { console.log('PASS: ' + msg); }

// --- NZ fixture: generate from the real repo root ---
{
  const cfg = loadConfig(REPO_ROOT);
  const manifest = buildManifest(cfg);
  if (manifest.name === 'New Zealand Family Companion') ok('NZ fixture: manifest.name matches TRIP_CONFIG.tripName');
  else fail('NZ fixture: manifest.name was "' + manifest.name + '"');
  if (manifest.short_name === 'NZ Family') ok('NZ fixture: manifest.short_name matches TRIP_CONFIG.shortName');
  else fail('NZ fixture: manifest.short_name was "' + manifest.short_name + '"');
  if (manifest.background_color === cfg.THEME_CONFIG.colors.background && manifest.theme_color === cfg.THEME_CONFIG.colors.background)
    ok('NZ fixture: manifest colours match THEME_CONFIG.colors.background');
  else fail('NZ fixture: manifest colours do not match THEME_CONFIG');
  for (const icon of manifest.icons) {
    if (fs.existsSync(path.join(REPO_ROOT, icon.src))) ok(`NZ fixture: icon file exists on disk: ${icon.src}`);
    else fail(`NZ fixture: icon file referenced by manifest does not exist: ${icon.src}`);
  }
}

// --- non-NZ fixture: synthetic fixture directory with different config ---
{
  const fixtureDir = fs.mkdtempSync(path.join(os.tmpdir(), 'e2a-manifest-fixture-'));
  for (const f of ['asset-config.js', 'locale-config.js']) {
    fs.copyFileSync(path.join(REPO_ROOT, f), path.join(fixtureDir, f));
  }
  fs.writeFileSync(path.join(fixtureDir, 'theme-config.js'), `
    (function(root){ root.THEME_CONFIG = Object.freeze({ name:'Japan Onsen', colors: Object.freeze({ background:'#112233' }) }); })(globalThis);
  `);
  fs.writeFileSync(path.join(fixtureDir, 'trip-config.js'), `
    (function(root){ root.TRIP_CONFIG = Object.freeze({
      tripName:'Japan Onsen Companion', shortName:'Onsen'
    }); })(globalThis);
  `);
  fs.copyFileSync(path.join(REPO_ROOT, 'icon-192.png'), path.join(fixtureDir, 'icon-192.png'));
  fs.copyFileSync(path.join(REPO_ROOT, 'icon-512.png'), path.join(fixtureDir, 'icon-512.png'));

  const cfg = loadConfig(fixtureDir);
  const manifest = buildManifest(cfg);
  if (manifest.name === 'Japan Onsen Companion' && manifest.short_name === 'Onsen')
    ok('non-NZ fixture: manifest reflects its own fixture trip name/short name');
  else fail('non-NZ fixture: manifest did not reflect fixture values: ' + JSON.stringify(manifest));
  if (manifest.background_color === '#112233')
    ok('non-NZ fixture: manifest reflects its own fixture theme colour');
  else fail('non-NZ fixture: manifest colour was "' + manifest.background_color + '"');
  if (manifest.name !== 'New Zealand Family Companion' && manifest.short_name !== 'NZ Family')
    ok('non-NZ fixture: manifest does not leak NZ trip name/short name');
  else fail('non-NZ fixture: manifest leaked NZ identity');

  fs.rmSync(fixtureDir, { recursive: true, force: true });
}

if (failures === 0) {
  console.log('E2A MANIFEST GENERATION TEST: ALL PASSED');
  process.exit(0);
} else {
  console.error(`E2A MANIFEST GENERATION TEST: FAILED (${failures})`);
  process.exit(1);
}
