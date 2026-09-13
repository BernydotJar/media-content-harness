# WEB011 revision 1 — Critic / Red Team

Verdict: **FAIL -> bounded fixer required**.

Scope: current uncommitted acceptance repair after the user's live rejection. The critic reviewed the implementation diff, the read-only live Chrome-bridge evidence, the 133-case full suite, contract validation, production dependency audit, runtime package inspection, and the non-test three-reviewer browser completion run. The browser completion proof is materially stronger than the prior offline artifact proof, but two provenance/governance gaps remain before this revision can be accepted.

## What is already proven

- The live authenticated Chrome bridge is reachable read-only and captured the real blocked job `mf_76e0f9795197d32b4c854721de7833d3` without cookies, storage or secret material.
- That live job exposed the actual `SOURCE_TOO_SHORT` retry-only dead end that invalidated the prior completion claim.
- The repair implements a same-job `FIT_SOURCE_DURATION` path with fresh Graph treatment/review, plus exact-source replacement navigation.
- The legacy live tenant id `caballito` now activates FIRMES identity even though the old tenant display name is `La antigua guatemala`; new tenant contracts can persist an explicit `brand.identity_key`.
- The exact user-authorized manual-derived caballito image is present as a bounded runtime asset and is visibly used in dashboard/character UX.
- A non-test isolated production run generated an 8 s 1080x1920 MP4 from the exact authorized source SHA, passed separate producer/critic/verifier identities, and reached immutable release without social publication.
- Full tests: 133/133 PASS; contracts: 13/13; TypeScript PASS; production audit reports no known vulnerabilities; prepared runtime has 0 forbidden entries and 0 external symlinks.

## Material findings

### P1 — brand provenance is syntactically validated but not bound to the authorized runtime input

`captureProviderExecution()` verifies that `brand_assets` contains unique ids, valid hashes and `synthetic:false`, but unlike `used_sources` it does not compare those claims to the brand assets actually authorized for this job. A provider adapter could therefore report an arbitrary non-synthetic brand asset id/hash and still obtain accepted immutable provenance.

Required fixer: pass the exact authorized brand-asset input set into the projection boundary and require one-to-one id/hash agreement, including omission rejection when a brand asset was actually supplied and rejection of brand claims when none were authorized.

### P1 — human creative approval does not bind the exact caballito asset hash

The local provider resolves the exact caballito only at `PROVIDER_PRODUCTION`. The preceding `DIRECTOR_TREATMENT` / `CREATIVE_GATE` candidate says character composition requires an authorized adapter, but it does not include `firmes-caballito-manual-p42` and its immutable SHA. A human could approve a treatment and a later production step could resolve a different authorized asset without that asset identity having been in the approved candidate scope.

Required fixer: resolve the supported FIRMES brand asset during treatment construction without enabling unsupported mascots. Include a public immutable `{asset_id, sha256, synthetic:false}` snapshot and composition status in the treatment that is hash-bound to the creative gate. Provider production must independently re-resolve/re-hash the same asset and provenance must match that approved snapshot.

## Non-findings / preserved boundaries

- Do not weaken the authenticated Chrome bridge into navigation/click/script execution. It remains an independent read-only live verifier; application mutation belongs to approved API/UI/deployment paths.
- Do not edit historical release reports that truthfully described mascot composition as unavailable at those older SHAs.
- Do not claim the plush-horse character image is the official FIRMES vector imagotype. The current documentation correctly separates those uses.
- No paid provider, model-generated horse, automatic publication, voter microtargeting, or source authorization expansion is required or authorized by this repair.

The revision may return to verification after both P1 findings are closed and regression evidence demonstrates the approved treatment hash, provider execution and release snapshot all identify the same authorized caballito asset.
