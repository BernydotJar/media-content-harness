# Public production probe — Review UX V15

Public URL: `https://media-factory.textilesdemedellin.com`
Exact deployed SHA: `f21a08da32e4803b5aa93bab3e40a895cefbfde2`

Production checks after reconciliation:
- `GET /login` -> HTTP 200 with valid TLS.
- anonymous `GET /api/v1/me` -> HTTP 401.
- anonymous private job approval -> HTTP 401.
- host reconciliation: L1/L2/L3/L4/L6/L7-L8-L9/L9_SECURITY/L9_AUTHORIZATION all PASS.
- form-session authorization probe: login 200, workspace 200 PASS, logout 303, revoked session 401.

The private review UX was verified in the exact release artifact before deployment with clean-SHA browser E2E: review-ready jobs render media first, one primary approval action, a secondary change request, optional Studio link, no Audio Finishing controls on the normal review route, and no four-step dashboard chrome in the review-ready state. The deployed product identity is the same exact SHA.
