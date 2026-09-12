# Host preview protocol — independent Critic and Verifier

Reviewer: graph_engineer_recovery. Date: 2026-09-12. Scope read-only: server/host-preview.mjs, app/api/preview/[...path]/route.ts, tests/web-host-preview.test.mjs and actual mounted /shared-auth/deployment/host-reconciler/host_reconciler.py. This reviewer authored the UI, not this server compatibility adapter or test. No adapter changes were made.

Result: PASS for the inspected application/host protocol contract. This is not evidence that a public deployment is already healthy.

## Host contract reconciliation

- `caddy_form_session_block` at line 776 permits unauthenticated GET/HEAD /login and static Next assets; POST /api/preview/login and logout are bounded to 2KB; other routes use internal forward_auth /api/preview/session. Direct public /api/preview/session* access is blocked before routing. Health retains existing separate Basic Auth.
- `resolved_form_session_workspace_probe` at line 1250 sends JSON username/password/locale=es/next=/es, requires login HTTP 200, requires exact workspace-status JSON `{authorized:true,scope:'controlled_single_operator_preview'}`, expects logout HTTP 303 and then revoked workspace HTTP 401. `public_form_session_workspace_probe` delegates to that exact probe rather than changing semantics.
- Adapter accepts the expected host fields, validates optional locale and next against small exact allowlists, discards navigation fields, and delegates credential/session/membership handling to the existing product API. No alternate identity/session store or trusted identity headers are introduced.
- Next route uses a one-argument wrapper, preventing its route-context object from being passed as the service injection argument.
- Form-session checks return only authorization status; actual tenant endpoints still enforce memberships independently. A memberless authenticated account does not gain tenant rights through workspace-status.

## Executed verification

`node --test tests/web-host-preview.test.mjs`: 1 passed, 0 failed. The real shared AuthService creates a Secure/HttpOnly session, host workspace JSON matches exactly, logout returns 303 /login, and the same session is then rejected.

Additional independent direct adapter probes against isolated temporary storage:

| Probe | Observed |
| --- | --- |
| Login without Origin | 403 |
| Correct Origin with Sec-Fetch-Site cross-site | 403 |
| Login JSON larger than 2KB | 413 |
| Protocol-relative next=//evil.example | 400 |
| Forged X-User-ID / X-Forwarded-User without cookie | 401 |
| Unauthenticated HTML session request | 303, Location /login |
| Unauthenticated JSON session request | 401, no Location |
| Duplicate session cookies | 401 |

The adapter preserves Origin/Fetch Metadata while remapping requests, removes obsolete content length, and uses bounded stream reads for login. Logout uses the shared API CSRF check and fixed relative redirect. Session and workspace-status GET checks do not change state. No open redirect or session/CSRF bypass found in inspected scope.

## Remaining deployment verification

Run the actual host reconciler/public HTTPS probe against the immutable deployed candidate. Application-level tests cannot prove shared Caddy routing, tunnel state, environment configuration, cookie transport, or public release identity. Preserve the fixed trusted public origin and existing host route permissions when deploying.
