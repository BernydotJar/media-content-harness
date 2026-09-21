# Public production probe — Single-Operator Review Autonomy V13

Public URL: `https://media-factory.textilesdemedellin.com`
Exact deployed SHA: `9040465de55b2a9924e6d8699fbe3a47059d4d0b`

Observed after host reconciliation:
- `GET /login` -> HTTP 200.
- direct external `GET /health` -> HTTP 401 because the public edge intentionally protects that path; authoritative host reconciliation reports `PASS_HTTP_200` internally.
- anonymous `GET /api/v1/me` -> HTTP 401.
- anonymous `POST /api/v1/jobs/not-a-job/approve` -> HTTP 401.
- deployment registry `last_commit` equals the exact signed V13 SHA.
- reconciliation is `converged`, process recovery is `PASS`, with no failing layer and no last error.

Authenticated single-operator behavior is established by exact-SHA policy tests and detached browser verification: owner/admin receive `SINGLE_OPERATOR_PREVIEW` only under `controlled_single_operator_preview`; production retains `INDEPENDENT_REVIEW_REQUIRED`.
