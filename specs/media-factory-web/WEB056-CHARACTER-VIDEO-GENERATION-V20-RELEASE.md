# WEB056 — Character Video Generation V20 Release

## Exact scope

Release only a candidate that contains WEB055 and preserves the existing authentication, tenant isolation, Q200 usage accounting, explicit spend approval, review, provenance and manual-publication boundaries.

## Required evidence

- WEB055 DONE.
- Production build PASS.
- Full automated suite PASS.
- Focused Gemini/Veo adapter and sticker-mode tests PASS.
- TypeScript PASS.
- Production dependency audit PASS.
- Browser E2E verifies the two user-visible modes are distinct.
- Independent critic verifies no silent generated-character/sticker fallback.
- Exact-SHA verifier confirms provider request shape contains the hash-bound character reference.

## Live acceptance

The controlled preview must demonstrate one of these terminal outcomes truthfully:

1. **PASS:** a configured and funded Gemini API credential submits an authorized 8-second character-reference job, provider status is observed, an MP4 is collected, and provenance binds the exact approved character SHA; or
2. **BLOCKED_EXTERNAL_CONFIGURATION:** no configured/funded credential is available, with the UI showing the actionable integration blocker and no fabricated generation claim.

Only outcome 1 permits the product to be described as live character-video generation ready.

## Sticker acceptance

The deterministic overlay route must remain available only as a separately labeled sticker/composite operation. Its artifact and provenance must not be presented as a generated-character scene.

## Deployment boundary

No changes to DNS, tunnel topology, auth policy, tenant membership rules, publication authority or political targeting/message logic.
