# Public production probe — Municipality Login V14.1

Public URL: `https://media-factory.textilesdemedellin.com`
Exact deployed SHA: `c4b9d4fe8d02c8ebd45572ec4efe46e8d2ff0252`

Post-reconciliation observations:
- `GET /login` -> HTTP 200 with valid TLS.
- public HTML contains exactly 17 municipality select options: one blank disabled selected placeholder plus the exact 16 Sacatepéquez municipalities.
- the municipality select carries the HTML `required` attribute.
- none of the 16 municipality options has `selected`; Antigua Guatemala is first by catalog order only, not a default selection.
- public copy includes `Debes elegir tu municipio antes de entrar.` and the separate `Acceso administrativo de contingencia` control.
- anonymous `GET /api/v1/me` -> HTTP 401.
- anonymous private job approval -> HTTP 401.
- anonymous empty versioned auth login -> HTTP 401 at the edge.
- host reconciliation passed the form-session L9 workspace authorization probe using the system-admin-only compatibility path, including login, workspace authorization, logout and revoked-session verification.
