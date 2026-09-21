# WEB044 first deployment attempt — blocked

Candidate `dbbce5c5050a66d066bac7b4921e193bcb581396` passed product tests, browser verification, detached verification and independent critique, but host reconciliation blocked at `L9_AUTHORIZATION`.

Root cause: the controlled host reconciler still probes the legacy `/api/preview/login` form-session adapter with username/password and no municipality. V14 correctly made normal configured identities with memberships require an explicit municipality, so the legacy probe received HTTP 400 before it could verify the workspace session.

Repair scope: preserve the strict versioned departmental login while making only the legacy host-preview adapter translate its no-tenant reconciliation probe to explicit administrative login. Shared auth must continue to require `system_admin=true`, so ordinary configured users remain denied.
