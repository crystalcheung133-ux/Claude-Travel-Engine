const fs=require('fs'),assert=require('assert');
const b=fs.readFileSync('ci-tests/test-browser-release-smoke.py','utf8');
assert(b.includes("context.route('https://api.frankfurter.dev/**',mock_fx)"),'browser gate must intercept primary FX provider');
assert(b.includes("context.route('https://latest.currency-api.pages.dev/**',mock_fx)"),'browser gate must intercept fallback FX provider');
assert(b.includes("route.fulfill(status=200"),'FX interception must return deterministic data rather than ignore errors');
assert(!b.includes("errors.append(str(e)) if 'currency-api'"),'currency CORS errors must not be hidden from pageerror assertions');
console.log('RC29.88 BROWSER FX ISOLATION: PASS');
