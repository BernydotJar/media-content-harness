# Independent critic — WEB044 repair revision 1

IBM Granite 3.3 2B reviewed exact repaired SHA `c4b9d4fe8d02c8ebd45572ec4efe46e8d2ff0252` after the first release attempt exposed the legacy host-reconciler compatibility issue.

The reviewed delta is intentionally narrow: `/api/preview/login`, which exists for the controlled host reconciler, translates a legacy no-tenant probe to `administrative_login:true`. The shared authentication service remains authoritative and accepts that path only when `system_admin=true`; ordinary configured identities receive `FORBIDDEN`. The public versioned departmental login does not infer administrative mode.

Canonical risk: `P / NONE`.
Canonical enterprise rubric: 10/10 `P`.
