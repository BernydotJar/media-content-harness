# Public production probe — Audio Finishing Engine V12

Public URL: `https://media-factory.textilesdemedellin.com`
Exact deployed SHA: `5be0229f08dc280036c7379116ba3ced61eee744`

Observed after host reconciliation:

- `GET /login` -> HTTP 200.
- direct external `GET /health` -> HTTP 401 because the public edge intentionally protects that path; authoritative host reconciliation separately reports `PASS_HTTP_200` for the internal health probe.
- anonymous `POST /api/v1/jobs/not-a-job/audio-finishing` -> HTTP 401.
- anonymous `GET /api/v1/me` -> HTTP 401.
- deployment registry `last_commit` equals the exact signed V12 SHA.
- reconciliation state is `converged`, process recovery is `PASS`, there is no failing layer and no last error.

The current Cloud Sandbox execution surface does not expose the host Docker daemon, so it cannot inspect the live container filesystem directly. Authenticated feature behavior is instead established by the detached exact-SHA browser verifier, which launched the packaged production build and exercised the Music / Voice / Final / Master UI, soundtrack upload contract, explicit outro IN/OUT and master submission. The reconciler then deployed that exact signed SHA.
