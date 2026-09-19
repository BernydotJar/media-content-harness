# WEB029 Critic / Red Team — exact `b002ebe6431e2c8d24ad34bde0e6161583b37b5d`

## Verdict: FAIL — verifier repair required

The product implementation satisfies the core V8 intent and the exact full suite is green: 187 tests discovered / 186 PASS / 0 FAIL / 1 pre-existing SKIP. TypeScript, production build, contracts, audit, focused onboarding tests and the generic exact browser journey all pass. The generic browser journey verifies desktop/mobile first-run guidance, a new tenant landing on its brand summary, V7 Creation Room continuity, explicit review/release, tenant switching and no uncaught browser errors.

A Red Team pass found one release-blocking verifier mismatch:

### F1 — mature multi-account E2E login helpers assume every successful login must land directly on `/dashboard`

The new product contract intentionally sends a genuinely new account to `/onboarding`, while active legacy actors are recognized as `RETURNING` and are not force-onboarded. The FIRMES completion E2E logs in an account with no prior user activity and therefore correctly lands on `/onboarding`; its helper still asserts `/dashboard` immediately and fails before exercising FIRMES production. Scene/source-recovery/Ease helpers contain the same stale assumption.

This is not evidence that the product should bypass onboarding. Reverting the product would defeat the owner-requested first-run guidance. The verifier must understand the new contract: after successful authentication, accept either `/dashboard` or `/onboarding`; if onboarding is shown, explicitly dismiss or complete it through the real UI and then require `/dashboard` before continuing. This also makes multi-role verification exercise the persisted onboarding state rather than silently bypassing it.

## Additional Red Team checks

- Tenant creation authority is still server-enforced through `can_create_tenants`; the UI now stops advertising `Nueva marca` to unauthorized users.
- `GET/POST /me/onboarding` is authenticated and POST remains same-origin/CSRF protected.
- The POST contract accepts no caller-supplied user ID; state is keyed to the resolved authenticated user.
- Onboarding tenant summaries are membership-bound and omit runtime/browser execution identities.
- Existing actors with historical actions resolve as `RETURNING`, preventing the V8 rollout from force-onboarding the active installed base.
- `/onboarding` and `/workspace/:id/start` remain private/noindex routes.
- Brand progress is sourced from the existing authoritative journey endpoint and does not invent a percentage.

## Required Fixer action

Update all exact browser verifier login helpers to explicitly settle the first-run onboarding state, then rerun FIRMES, source-recovery, scene-generation and generic browser E2E on a new exact commit. No product-authority expansion is required.
