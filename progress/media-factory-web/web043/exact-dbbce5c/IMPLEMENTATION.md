# WEB043 — Login Municipality Boundary V14

Exact candidate SHA: `dbbce5c5050a66d066bac7b4921e193bcb581396`

V14 removes the ambiguous unbound departmental-login path that could visually fall into Antigua when an already-authorized account had only one visible municipality.

Distribution invariants:
- the public departmental login renders the exact 16-municipality Sacatepéquez catalog with a disabled blank option and no default municipality;
- pressing Enter with valid credentials while the municipality is blank emits zero `/api/v1/auth/login` requests and stays on `/login`;
- self-service accounts require `tenant_id` server-side and the matching active membership;
- configured identities with one or more memberships require an explicit `tenant_id` server-side;
- configured identities with zero memberships may hold an unbound session but cannot enter a municipality because they have no membership;
- wrong-tenant login is denied with `ACCESS_NOT_APPROVED`;
- system administrative recovery is a separate explicit UI mode, `Acceso administrativo de contingencia`, which sends `administrative_login:true`;
- the backend accepts that flag only for `system_admin`, rejects it for self-service/ordinary accounts, and rejects combining it with a municipality;
- normal login code does not select Antigua, `caballito`, the first catalog item, or the first membership.
