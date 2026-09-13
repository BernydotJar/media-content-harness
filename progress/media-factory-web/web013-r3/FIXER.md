# WEB013 revision 3 — Fixer report

## Defect reproduced

User acceptance exposed a real `MANUAL_REPAIR_REQUIRED` dead-end at `PROVIDER_PRODUCTION`. The product sent the operator to generic `/review`, but `/review` had no action capable of clearing `repair_requires_manual`; returning to the job reproduced the same blocker.

## Bounded repair

- Added an explicit same-job repair action: `WITHDRAW_MANUAL_CHANGE`.
- It is applicable only when the job is `BLOCKED`, the blocker is exactly `MANUAL_REPAIR_REQUIRED`, and `repair_requires_manual === true`.
- It clears the unsupported requested edit rather than claiming the edit was applied.
- It preserves the previously reviewed treatment, clears the stale current candidate/output/provenance, resumes the existing Graph from the already-invalidated provider-production branch, and records the withdrawal in repair history.
- It does not add a second Graph repair plan or silently convert strategy/mascot semantics.
- The public authenticated job projection now exposes only the bounded repair state needed by the UI: `repair_requires_manual`, `repair_instructions`, and `repair_controls`.
- The blocked-job UI now provides `Continuar sin aplicar este cambio` and the exact `Editar historia` route. It does not present generic `/review` as the repair for `MANUAL_REPAIR_REQUIRED`, and it excludes this blocker from generic retry.
- UI text explicitly states that the requested edit was not applied.

## Verification before immutable commit

- Focused execution suite: 29/29 PASS after introducing the recovery path.
- New regression specifically verifies same job identity, unchanged reviewed treatment, explicit withdrawal state, regenerated artifact, Graph continuation, and no false edit claim.
- TypeScript: PASS.
- Production build: PASS.
- Full repository suite: 135 PASS, 0 FAIL, 1 pre-existing SKIP out of 136 tests.
- Contracts/examples: 13/13 PASS.
- `pnpm audit --prod`: no known vulnerabilities.
- `git diff --check`: PASS.
- Production-mode FIRMES browser completion E2E: PASS with `MEDIA_FACTORY_TEST_MODE` disabled. The browser creates the manual blocker, verifies there is no `Ir a revisión humana` repair CTA, sees the exact same-job decision surface, withdraws the unsupported edit, returns to CRITIC review, and finishes through separate critic/verifier identities and final release.

The immutable exact-SHA verification is intentionally deferred until the code/evidence commit is created.
