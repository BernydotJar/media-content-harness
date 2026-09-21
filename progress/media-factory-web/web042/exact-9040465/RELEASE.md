# WEB042 — Single-Operator Review Autonomy V13 release

Exact deployed SHA: `9040465de55b2a9924e6d8699fbe3a47059d4d0b`
Public URL: `https://media-factory.textilesdemedellin.com`

Media Factory now allows an authenticated tenant owner/admin to complete Critic and Independent Verifier review on their own hash-bound production when the deployment class is explicitly `controlled_single_operator_preview`.

This is not represented as independent review. Durable approvals/evidence use `SINGLE_OPERATOR_PREVIEW`, and the UI displays `Modo operador único activo`.

`production` keeps the original separation: producer self-review fails closed, and verifier separation remains mandatory. Candidate SHA, stage binding, role authorization, source snapshot verification, artifact hash checks, Graph gates and release evidence remain intact.

IBM Granite 3.3 2B exact-SHA review: risk `P/NONE`, rubric 10/10 PASS. Release bundle was cryptographically finalized and deployed by the controlled host reconciler.
