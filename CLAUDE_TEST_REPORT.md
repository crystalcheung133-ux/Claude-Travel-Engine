# CLAUDE_TEST_REPORT — VN Companion RC29.138

All commands run from the project root in the authoring sandbox (Chromium available, WebKit NOT installed). External services were mocked; nothing contacted production Supabase.

## Commands and exit codes
| Command | Exit | Result |
|---|---|---|
| `BROWSER_SKIP_WEBKIT=1 sh ci-tests/run-all.sh` | **0** | `MASTER CI SUITE PASSED` — 160 PASS lines, 0 FAILED, 0 WARN. Includes the real-browser gate (Chromium) |
| `sh ci-tests/run-all.sh` (default) | **1** | Fails ONLY at the WebKit launch (`Executable doesn't exist … webkit`) — by design; the GitHub workflow installs WebKit |
| `ALLOW_BROWSER_SKIP=1 sh ci-tests/run-all.sh` | **3** | static suites pass, "BROWSER GATE NOT RUN - NOT A RELEASE PASS" |
| `node ci-tests/test-migration-fixtures.js` | 0 | 294 checks |
| `node ci-tests/test-approved-itinerary.js` | 0 | 43 checks |
| `python3 ci-tests/test-browser-migration-render.py` | 0 | 149 checks, ~760 external requests mocked, none sent |
| `python3 ci-tests/test-browser-save-sync.py` | 0 | persistence across real reloads, externals mocked |
| `python3 ci-tests/test-browser-release-smoke.py` (`BROWSER_SKIP_WEBKIT=1`) | 0 | Chromium desktop 1280×800 + mobile 390×844 PASS; **WebKit NOT TESTED** |
| `sha256sum -c SHA256SUMS.txt` | 0 | 78/78 OK |
| negative control (approved Running Bean time changed to 09:30 in a copy) | **1** | CI fails at checksums, fixtures and the approved-itinerary test |
| new tests run against the previous (unfixed) build | fail | migration test fails at "no obsolete Day 2 Pizza"; browser test 26/147 failures incl. E1/E2 (R1) |

Critical tests are gating: `run-all.sh` ends with a single failure gate; registry contract enforces registration; the CI cannot return 0 after a failed critical test (negative control above).

## Migration test matrix (real Chromium, DOM-level; Node fixtures use browser-shaped globals)
| Fixture | Structure | Notes/times | Deletions | Idempotent |
|---|---|---|---|---|
| Fresh install | PASS | n/a | n/a | n/a |
| Saved Override + baseline | PASS | PASS (all moved/merged notes and times) | honoured | PASS |
| Legacy Saved Override (no baseline) | PASS | PASS | NOT knowable → restored (documented) | PASS |
| Legacy flat store | PASS | PASS | same limitation | PASS |
| Legacy unedited defaults | no obsolete cards resurrected | n/a | n/a | PASS |
| Pending Draft + baseline | PASS | PASS | honoured | PASS |
| Legacy Pending Draft | PASS | PASS | limitation | PASS |
| Current-revision draft w/o baseline | upgraded in place | PASS | honoured | PASS |
| Saved + Pending together | PASS | PASS; newer saved edit not masked | honoured | PASS |
| Same-revision publication | PASS, note in rendered DOM | PASS | n/a | PASS |
| Old-revision publication (valid itineraryBase) | PASS, 5 days | PASS | honoured | PASS (rebase of its own output is a no-op) |
| Save & Sync payload | baseline non-empty, revision correct, `itineraryBase` for 5 days, never `{}` | | | PASS |
| Booking overrides (old revision), earlier probe | structural fields from Master | notes/handoff/time preserved | deletion preserved | |

## Itinerary and navigation (real browser)
Day 2/4/5 verified exactly as specified (see `test-approved-itinerary.js` + browser test A): Running Bean 09:00, Garmentory first stop, Quán Cua Cà Mau 13:00–13:45, Grab → Qspa 14:30, no Day 2 Pizza; Pink Church → Push Push; Push Push Navigate opens Push Push and Directions go to Pizza 4P's 44 Trần Ngọc Diện; shopping order In The Mood → Grade B → YouOn → Vina → dakao → Aurora → Wicky → OHQUAO; Mộc Hương 15:30–17:30; 0123 17:45–18:40; AUM 19:00; Day 5 exactly eight cards.

## NOT tested
- **Production migration: NOT TESTED** (no authorized read-only snapshot of project `dafgbqygccvctifrevpa` / trip `ccmv-vietnam-2026`, v546+). Fixture results are not a substitute.
- **WebKit and real mobile devices: NOT TESTED** in this sandbox (run in GitHub CI, which installs WebKit).
- **Guide Notes migration:** covered only by the existing CI invariants, not re-tested in a browser.
- Old-master defaults used by fixtures were reconstructed from the exported itinerary; the real previous master was not available.
