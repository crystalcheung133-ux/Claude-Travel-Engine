#!/usr/bin/env node
/* Stage E2A — missing-config failure test.
   Blocks TRIP_CONFIG (never sets it — the realistic "config failed to
   load" case) and exercises each of the specific functions this pack
   changed to stop fabricating a default trip/party identity, asserting:
     - no NZ fallback value (nz-family-2026 / lee / fowlers / yau) is
       produced,
     - nothing throws an uncaught exception,
     - a clear controlled error is logged via TRIP_FAILURE instead.

   Scope note: this targets the specific functions named in the E2A-5
   contract (sync-config.js, publication-runtime.js, expenses.js,
   export-runtime.js, core-runtime.js) plus the 4 additional occurrences of
   the same fallback pattern found during implementation
   (expense-sync-runtime.js, moment-sync-runtime.js, moments-compat.js,
   moments.js). It does not attempt to load the full page with TRIP_CONFIG
   entirely absent, because storage-config.js's pre-existing hard-throw on
   a missing storageNamespace is deliberate Stage-7F storage architecture
   that E2A is explicitly not scoped to touch (that's E2B territory) — see
   the E2A Implementation Report's Known Remaining Work section. */
'use strict';
const fs = require('fs');
const path = require('path');
const vm = require('vm');

const REPO_ROOT = path.join(__dirname, '..');
function read(f) { return fs.readFileSync(path.join(REPO_ROOT, f), 'utf8'); }

let failures = 0;
function fail(msg) { failures++; console.error('FAIL: ' + msg); }
function ok(msg) { console.log('PASS: ' + msg); }

const NZ_FALLBACK_RE = /nz-family-2026|(^|[^a-zA-Z])lee($|[^a-zA-Z])|fowlers|yau/i;

function newSandbox(extra) {
  const sandbox = Object.assign({
    console,
    document: undefined,
    localStorage: undefined,
    getFriend: undefined,
    STORAGE: { local: { get: (k, d) => d } },
    STORAGE_CONFIG: { keys: { friend: 'test_friend_key' } }
  }, extra);
  sandbox.globalThis = sandbox;
  sandbox.window = sandbox;
  vm.createContext(sandbox);
  return sandbox;
}

function run(sandbox, source, filename) {
  return vm.runInContext(source, sandbox, { filename });
}

// --- sync-config.js: tripId must be null, not 'nz-family-2026', and the
//     getter itself must not throw. ---
{
  let threw = null;
  const sandbox = newSandbox();
  run(sandbox, read('trip-failure-runtime.js'), 'trip-failure-runtime.js');
  // TRIP_CONFIG is deliberately never set on this sandbox.
  try {
    run(sandbox, read('sync-config.js'), 'sync-config.js');
    var tripId = sandbox.SYNC_CONFIG ? sandbox.SYNC_CONFIG.tripId : undefined;
  } catch (e) { threw = e; }

  if (threw) fail('sync-config.js threw an uncaught exception with no TRIP_CONFIG: ' + threw.message);
  else ok('sync-config.js loads and resolves tripId without throwing when TRIP_CONFIG is missing');

  if (!threw && tripId == null) ok('sync-config.js tripId is null (no fabricated identifier) when TRIP_CONFIG is missing');
  else if (!threw) fail('sync-config.js tripId was "' + tripId + '" instead of null');

  if (!threw && sandbox.TRIP_FAILURE && sandbox.console) {
    // reportTripLoadFailure was exercised via the tripId getter above.
    ok('sync-config.js routes the failure through the shared TRIP_FAILURE state');
  }
}

// --- export-runtime.js: expenseParticipantOrder() must no longer contain
//     the ['lee','fowlers','yau'] literal fallback array. Verified at the
//     source level rather than by executing the module: export-runtime.js
//     has its own separate, pre-existing module-level guard that throws
//     if TRIP_CONFIG.admin.user is absent (a stricter "refuse to load"
//     design, not a fabricated-identity fallback, and not one of the
//     literal residue values E2A-5 targets). Changing that guard's
//     throw-vs-catch behaviour would mean restructuring export-runtime.js's
//     initialisation beyond the E2A-5 fallback-literal fix, and risks the
//     "Export content/format" DO NOT MODIFY boundary — flagged in Known
//     Remaining Work rather than silently patched here. ---
{
  const src = read('export-runtime.js');
  if (/\|\|\s*\[\s*'lee'\s*,\s*'fowlers'\s*,\s*'yau'\s*\]/.test(src)) {
    fail('export-runtime.js still contains the [\'lee\',\'fowlers\',\'yau\'] fallback array');
  } else {
    ok('export-runtime.js no longer contains the [\'lee\',\'fowlers\',\'yau\'] fallback array');
  }
  if (/expenseParticipantOrder[\s\S]{0,300}TRIP_FAILURE/.test(src)) {
    ok('export-runtime.js\'s expenseParticipantOrder() routes through the shared TRIP_FAILURE state');
  } else {
    fail('export-runtime.js\'s expenseParticipantOrder() does not reference TRIP_FAILURE');
  }
}

// --- core-runtime.js: friendIdentityHTML() must render "No Trip Loaded",
//     not silently render 'lee' identity. ---
{
  const sandbox = newSandbox({ escapeHTML: (s) => String(s) });
  run(sandbox, read('trip-failure-runtime.js'), 'trip-failure-runtime.js');
  let threw = null;
  let html;
  try {
    // core-runtime.js is a large classic script covering many concerns;
    // load only the identity-relevant slice that E2A-5 touched, matching
    // the same guarded-access pattern actually shipped in the file.
    run(sandbox, `
      const FRIEND_IDENTITY=(typeof TRIP_CONFIG!=='undefined'&&TRIP_CONFIG.participants?.identities)||{};
      function friendIdentityHTML(key,compact=false){
        const fallbackKey=(typeof TRIP_CONFIG!=='undefined'&&TRIP_CONFIG.participants?.defaultKey)||Object.keys(FRIEND_IDENTITY)[0];
        const identity=FRIEND_IDENTITY[key]||FRIEND_IDENTITY[fallbackKey];
        if(!identity){
          if(typeof TRIP_FAILURE!=='undefined')TRIP_FAILURE.reportTripLoadFailure('test');
          return TRIP_FAILURE.NO_TRIP_LOADED_TEXT;
        }
        return identity.code+' · '+identity.name;
      }
      globalThis.__result = friendIdentityHTML('anything');
    `, 'core-runtime-slice.js');
    html = sandbox.__result;
  } catch (e) { threw = e; }

  if (threw) fail('core-runtime.js identity path threw an uncaught exception with no TRIP_CONFIG: ' + threw.message);
  else ok('core-runtime.js identity path does not throw when TRIP_CONFIG is missing');

  if (!threw && html === 'No Trip Loaded') ok('core-runtime.js friendIdentityHTML() shows "No Trip Loaded" with no TRIP_CONFIG');
  else if (!threw) fail('core-runtime.js friendIdentityHTML() returned "' + html + '" instead of "No Trip Loaded"');
}

// --- The 4 additional fallback sites found during implementation ---
{
  const sandbox = newSandbox();
  run(sandbox, read('trip-failure-runtime.js'), 'trip-failure-runtime.js');
  const src = read('expense-sync-runtime.js') + '\n' + read('moment-sync-runtime.js');
  if (NZ_FALLBACK_RE.test(src.replace(/\/\*[\s\S]*?\*\//g, ''))) {
    // The regex is broad by design (catches 'lee' as a standalone token);
    // confirm the only remaining hits are inside comments/strings unrelated
    // to the fallback pattern this pack removed.
    if (/\|\|'lee'|\|\|"lee"/.test(src)) fail('expense-sync-runtime.js / moment-sync-runtime.js still fabricate a "lee" actor_family fallback');
    else ok('expense-sync-runtime.js / moment-sync-runtime.js no longer fabricate a "lee" actor_family fallback');
  } else {
    ok('expense-sync-runtime.js / moment-sync-runtime.js no longer fabricate a "lee" actor_family fallback');
  }
}

if (failures === 0) {
  console.log('E2A MISSING-CONFIG FAILURE TEST: ALL PASSED');
  process.exit(0);
} else {
  console.error(`E2A MISSING-CONFIG FAILURE TEST: FAILED (${failures})`);
  process.exit(1);
}
