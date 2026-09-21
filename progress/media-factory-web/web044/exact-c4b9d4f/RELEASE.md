# WEB044 — Municipality Login Boundary V14.1 release

Exact deployed SHA: `c4b9d4fe8d02c8ebd45572ec4efe46e8d2ff0252`
Public URL: `https://media-factory.textilesdemedellin.com`

Distribution state: controlled departmental distribution ready.

Normal departmental access is municipality-bound at both browser and server boundaries. No municipality is implicitly selected. The only no-municipality administrative path is explicit system-admin contingency; the legacy host-reconciler adapter may infer that administrative flag for its own no-tenant probe, but shared authentication still requires system-admin authority.

The first V14 release attempt at `dbbce5c...` was transparently blocked at L9 because that probe lacked the explicit administrative marker. Graph recorded the failure and localized the repair. V14.1 preserves the product boundary and restores host-reconciler compatibility without widening tenant access.
