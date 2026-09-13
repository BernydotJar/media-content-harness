# Media Factory FIRMES V3 — Release Report

Status: **COMPLETED** for the approved controlled-single-operator preview release.

Exact deployed candidate: `7e2ec3a420a58bfa987ab597d970a21f09cd64c3`.

Public entry: https://media-factory.textilesdemedellin.com/login

## Corrected product defects

- Blocked mascot/provider productions now present actionable repair choices instead of a retry-only dead end.
- Explicit `USE_REAL_FOOTAGE` and `REMOVE_MASCOT` repairs act on the same job, invalidate affected downstream Graph state, clear stale current-output provenance, increment repair revision and require a fresh creative review.
- Repair mutations are role-bound; viewer and unsupported-action tests fail closed.
- `/jobs/:id` now resolves its tenant for the outer Studio shell, so the job page no longer falls back to the generic theme.
- FIRMES burgundy `#8E2C2D` is the dominant primary interaction color. Gold `#BD9B60` is secondary. Quick Create, sidebar/navigation, primary CTA, warning card, stage state and focus treatment use tenant-aware tokens.
- Existing missing-source recovery, mobile 390 px behavior and reduced-motion behavior remain verified.

## Exact candidate verification

- 130/130 tests PASS, 0 skipped using the pinned Graph runtime.
- 13/13 contract/example validations PASS.
- TypeScript and production build PASS.
- Authenticated browser E2E with `MEDIA_FACTORY_TEST_MODE=false` PASS; computed job-route `--brand-primary` and `--accent` are both `#8e2c2d`.
- Runtime package: 0 forbidden entries, 0 external symlinks.
- Production dependency audit: no known vulnerabilities.

## Independent release authority

- IBM Granite `ibm/granite3.3:2b`: risk `P/NONE`; enterprise rubric 10/10 PASS.
- Signed receipt SHA-256: `c1195afb99d1864e922fab958dec4ceae536bc904fecfed128c3c9dad97fb58d`.
- Detached signature SHA-256: `b11ee237ebe35455ea58f8e5a301a608ba308ea1cc233953bd320692607fb7a1`.
- Canonical public-key SHA-256: `b61542031a4c61e9ccc270aac3ee2adb464508012d0b979eb40575da43d13e9e`.
- Canonical finalizer SHA-256: `edff9a10ef314ca38473af0e741aa7121611764c90626ae2e2cf7f69c785fb82`.
- Detached signature verification: PASS.

## Deployment

Request `0f2cb5b0-dc3f-4225-b48b-51eeb335c98a` converged to the exact candidate. Host layers L1/L2/L3/L4/L6/L7-L9/security/authorization are PASS. The reconciler proved login 200, authenticated workspace 200, logout 303 and revoked session 401.

No paid provider execution or social publication was performed.
