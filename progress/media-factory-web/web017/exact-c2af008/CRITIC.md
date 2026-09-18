# WEB017 Exact Critic

Reviewed SHA: c2af008c854bcb7493b4aa0a73cd31dd05b93c28

The first Granite risk pass returned F / MATERIAL_FINDINGS because the supplied dossier did not explicitly prove that autosave stops before approval/launch. That non-passing result is preserved as granite-risk-r1-response.json; it was not overridden.

The follow-up diagnostic asked for explicit evidence of the state boundaries. The exact implementation and tests were then supplied:

- createPlan persists DRAFT with approved:false and creates no jobs.
- approvePlan is a distinct mutation and creates no jobs.
- launchPlan is a distinct mutation that rejects a plan unless its status is APPROVED or LAUNCHED.
- Client autosave calls saveDraft({automatic:true}) and moves only to the approval UI.
- Exact browser E2E observes the autosave confirmation and then the still-required Aprobar estos 1 conceptos control.
- The service test rejects launch before approval.

Granite risk R2: P / NONE.

Granite enterprise rubric: all ten categories P.

The earlier R1 failure is retained as part of the audit trail.
