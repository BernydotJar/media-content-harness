# WEB013 revision 3 — exact-candidate Critic

Candidate: `c4d5d47db4c4c23244785cf7a16b9c2c8de0a9e7`

Verdict: **PASS**.

The candidate was rebuilt and exercised from a clean tree that matched `origin/main`. The production-mode browser flow reproduces the exact acceptance regression (`MANUAL_REPAIR_REQUIRED`) and verifies that the repair surface is now local to the blocked job:

- no generic `Ir a revisión humana` CTA is present for this blocker;
- `Continuar sin aplicar este cambio` performs a bounded, authorized same-job mutation;
- `Editar historia` resolves to the exact plan/story route with a return link to the blocked job;
- the unsupported edit remains unapplied and is explicitly withdrawn rather than silently synthesized;
- the same job/Graph proceeds to CRITIC and then through separate critic/verifier identities before release;
- no automatic social publication occurs.

Backend red-team checks confirm the withdrawal action is rejected unless the job is `BLOCKED` with both `MANUAL_REPAIR_REQUIRED` and `repair_requires_manual === true`. Other blocker resolution paths remain distinct.

Fresh exact verification: build PASS, typecheck PASS, 135 tests PASS / 0 fail / 1 existing skip, 13/13 contracts PASS, production audit clean, exact production-mode E2E PASS, runtime package 0 forbidden entries / 0 external symlinks.

Material findings open: **0**.
