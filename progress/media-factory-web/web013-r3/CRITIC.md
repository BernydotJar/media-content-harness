# WEB013 revision 3 — Critic / red-team review

Verdict: **PASS for commit candidate; exact-SHA release verification still required after commit.**

## Attack questions

1. **Can a user still be sent in a loop to `/review` for `MANUAL_REPAIR_REQUIRED`?**
   No in the changed UI path. `MANUAL_REPAIR_REQUIRED` is separated from `HUMAN_APPROVAL_REQUIRED`; the manual blocker renders an in-place mutation plus an edit-story link. The browser E2E asserts `Ir a revisión humana` is absent in this state.

2. **Can withdrawal falsely represent the unsupported edit as applied?**
   No. The action is named `WITHDRAW_MANUAL_CHANGE`, the UI says `Continuar sin aplicar este cambio`, the persisted reason states that the unsupported edit was withdrawn, and the regression verifies the reviewed treatment digest is unchanged.

3. **Can this action be applied to an unrelated blocker?**
   No. Backend applicability requires `BLOCKED`, `MANUAL_REPAIR_REQUIRED`, and `repair_requires_manual === true`; other blocker classes keep their existing resolution branches.

4. **Does recovery fork or replace the production?**
   No. Regression and browser E2E verify the same job ID/Graph is retained. The prior `requestChanges` operation remains the Graph invalidation authority; withdrawal does not create a duplicate repair plan.

5. **Does the repair bypass review?**
   No. The resumed provider-production branch regenerates/verifies output and stops at the next human CRITIC stage. The production-mode E2E then requires distinct critic and verifier identities before release.

6. **Does exposing repair state leak credentials/secrets?**
   The new projected fields contain bounded user-authored repair text and finite repair controls only. No credential, session, provider secret, filesystem path, or browser material is exposed by the change.

## Residual observations

- The read-only live Chrome bridge cannot be used to mutate or reload the user's authenticated tab. A fresh deployed-browser proof must therefore come from the exact clean browser E2E plus exact host release identity, unless the user's browser naturally reloads after deployment.
- No external model critic is claimed for this revision. This report is a red-team review of the implementation and executed evidence; exact independent release verification remains a separate gate.

Material findings open: **0**.
