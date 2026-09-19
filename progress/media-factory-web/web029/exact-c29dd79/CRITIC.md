# WEB029 Final Critic / Red Team — exact `c29dd79cac99e15371d8344868f62a8b1b670112`

## Verdict: PASS

The exact Fixer candidate closes both findings from the Producer cycle and preserves existing authority boundaries.

### F1 closed — first-run-aware verifier contract

All multi-account browser verifier login helpers now treat `/onboarding` as a legitimate first-login state. When it appears they exercise the actual `Saltar por ahora` action, then require `/dashboard` before continuing. This preserves the product contract and allows owner/critic/verifier role-switching flows to remain exact end-to-end verification rather than bypassing onboarding.

### F2 closed — accepted changes remain explicit during immediate creation

Success feedback is rendered outside the `creatingNow` branch. When a supported review change immediately re-queues the same job, the user sees both the confirmation of what was accepted and the Creation Room showing what is now happening. A focused regression test enforces this rendering order. The FIRMES non-test journey verifies the same-job Caballito repair still returns to Critic and later passes separate Critic, Independent Verifier and owner release.

### V8 product review

- A genuinely new account receives a private, persistent first-run guide.
- Existing active actors are classified `RETURNING`, so rollout does not force-onboard the installed active user base.
- A new user with no brand or only an unprepared brand is guided automatically; a new user added to a mature workspace gets a compact dashboard callout instead of a disruptive forced detour.
- `GET/POST /me/onboarding` is authenticated, POST is same-origin/CSRF protected, and no caller-supplied user ID is accepted.
- Onboarding state is keyed only to the resolved authenticated user and is independent of tenant membership state.
- Tenant summaries are limited to the resolved user's memberships and expose only safe brand facts.
- `Nueva marca` is shown only when `can_create_tenants=true`; the server-side create-tenant authority remains unchanged.
- New tenants land on `/workspace/:id/start`, which uses the existing authoritative journey endpoint and exposes no fabricated percentage.
- User-facing language says Marca/Espacio de marca; internal `tenant_id` remains in contracts and Advanced Options.
- `/onboarding` and `/workspace/:id/start` are private/noindex metadata routes.

### Exact regression evidence

- Full Node suite: 188 discovered / 187 PASS / 0 FAIL / 1 pre-existing SKIP.
- Focused onboarding + Creation Room: 16/16 PASS.
- TypeScript: PASS.
- Production build: PASS.
- Contracts/examples: 13/13 PASS.
- Production audit: no known vulnerabilities.
- Generic browser E2E: PASS on clean exact SHA, including onboarding desktop/mobile screenshots and no horizontal overflow.
- FIRMES non-test completion E2E: PASS on clean exact SHA.
- Source recovery E2E: PASS on clean exact SHA.
- Scene-generation E2E: PASS on clean exact SHA.
- Ease E2E: PASS on clean exact SHA.
- Runtime package: 1,481 files, zero forbidden entries, zero external symlinks.

No material findings remain.
