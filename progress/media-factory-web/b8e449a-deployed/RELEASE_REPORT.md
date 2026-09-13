# Media Factory FIRMES V2 — Release Report

## Terminal software state

**COMPLETED** for the approved V2 controlled-single-operator release.

Exact deployed candidate: `b8e449ab57af2706171a556cc8f820b712ed8c6c`.

Public entry: `https://media-factory.textilesdemedellin.com/login`.

## Delivered scope

- Directed resolution for `SOURCE_BYTES_REQUIRED`: blocked jobs expose the exact missing authorized source, deep-link to that source, accept the upload, freeze the source SHA, and resume the same Graph/job.
- Tenant-scoped FIRMES V2 visual language derived from the private July 2026 manual, without shipping the PDF or font binaries.
- Purposeful Gooey UI motion with reduced-motion support and no new dependency.
- Authenticated browser E2E with `MEDIA_FACTORY_TEST_MODE=false`, including mobile 390 px verification.
- First playable neutral FIRMES Izabal proof: 11s, 1080x1920, 30fps H264, real authorized footage, output SHA `e439c5cd0f6cc60e9463c6973ea9c4f860733ae110822d94eac37f8a3d188a5a`. No automatic publication occurred.

## Independent release authority

- IBM Granite model: `ibm/granite3.3:2b`.
- Risk gate: `P / NONE`.
- Enterprise rubric: 10/10 categories PASS.
- Canonical signed receipt SHA-256: `33dfa42083126137113c976499abfe64bc7c4ca9294d9f997bb041512ced4c05`.
- Detached signature SHA-256: `18c66b039a83a97ae43917b1121b489250aa94cb4cf83dd2ba1279c9dd6fe89d`.
- Critic public-key SHA-256: `b61542031a4c61e9ccc270aac3ee2adb464508012d0b979eb40575da43d13e9e`.
- Canonical finalizer SHA-256: `edff9a10ef314ca38473af0e741aa7121611764c90626ae2e2cf7f69c785fb82`.
- Signature verification: PASS.

## Verification

The repair revision passed the exact candidate verifier with 128/128 tests, 0 skips, 13/13 contract/example validations, TypeScript PASS, production audit clean, real pinned Graph integration, runtime package with 0 forbidden entries and 0 external symlinks, and authenticated test-mode-off source recovery E2E.

## Host deployment

Deployment request: `0f303386-3183-40ae-a536-1e6e1e07b72a`.

Host evidence: `evidence/media-factory-host-reconcile-20260913T010352Z.json`. All recorded host layers PASS. Registry desired and actual release both equal `b8e449ab57af2706171a556cc8f820b712ed8c6c` and state is `converged`.

Anonymous HTTPS checks: `/login` 200; admin UI/API 401; `/health` 401 by form-session policy; robots/sitemap/llms discovery routes 200. The host reconciler separately proved login 200, authenticated workspace 200, logout 303 and revoked session 401.

## Explicit capability limit

The reusable fictional mascot/caballito can be configured and taken through human treatment/review. Actual mascot animation/compositing remains unavailable until a separately authorized operational generation/composition adapter is implemented. This limitation does not block the delivered V2 software scope or the real-footage first-video proof.
