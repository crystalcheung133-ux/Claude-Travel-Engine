# VN RC12 — Device Identity + UI Refinement Contract

Build: Saigon Companion RC12 · Travel Engine 25.3.9

## Engine-level changes

- Traveller identity is now trip-scoped in localStorage.
- First launch on a device for a trip requires an explicit traveller selection.
- The required selection modal cannot be dismissed until a valid traveller is chosen.
- Later launches of the same trip reuse the saved traveller automatically.
- The top-right identity pill shows both emoji and traveller name and reopens the selector.
- Browser portability smoke now validates first-launch selection, persistence surface, and header selector clickability.
- Legacy RC11 feature regression test no longer hard-codes an obsolete release identity.

## UI refinements

- Homepage hero uses a warmer ivory/champagne/terracotta layered gradient with softer premium depth.
- Date and destination metadata use rounded chips consistent with the rest of the Companion.
- Mobile custom expense split rows preserve full traveller names instead of truncating them.

## Validation

Static/runtime gates passed locally: JS syntax, HTML structure, entity integrity, guide address integrity, timeline integrity, UX contract, portability runtime, runtime integrity, VN reference integration, dual currency, RC8/RC9/RC10/RC11/RC12 contracts.

Release integrity: 64/64 checksums PASS; production manifest PASS.

Browser Playwright remains the GitHub CI gate for the final device-interaction check.
