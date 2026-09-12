# Current Media Factory Web delivery

2026-09-12 — **software release COMPLETED; broader product PARTIAL_WITH_DOCUMENTED_BLOCKERS**.

Exact candidate `7f465d072f7faf05017b90e1da769e99a047674f` is deployed **active/converged** at https://media-factory.textilesdemedellin.com/login through the existing shared Mac host, Caddy edge and `cloud-sandbox-mac` Cloudflare tunnel.

The ease-of-creation release includes Guided Mode improvements, truthful production state, fictional character/place profiles, the authorized Firmes caballito as a reusable principal profile, Free Mode profile resolution, exact plan links, mobile navigation fixes and administrator-only API/integration configuration. Provider credentials remain distinct from provider operational state.

The exact SHA passed the IBM Granite release gate (`P/NONE`, 10/10 rubric PASS), received the canonical detached signature, and was deployed by the existing host reconciler. Host release/runtime/network/health/recovery/Caddy/tunnel/DNS-TLS-public/security/authorization layers all passed. Anonymous access to both `/admin/integrations` and `/api/v1/admin/integrations` returns `401`.

The append-only `graph/media-factory-web.events.jsonl` is authoritative: 113 events validate and all nodes `WEB001` through `WEB008` are `done` with no READY node.

See [`7f465d0-deployed/RELEASE_REPORT.md`](7f465d0-deployed/RELEASE_REPORT.md) and [`7f465d0-deployed/OPEN_BLOCKERS.json`](7f465d0-deployed/OPEN_BLOCKERS.json).

The remaining blocker most relevant to the requested creative workflow is explicit: configuring the caballito and saving provider APIs does not itself enable animation/compositing. A real generation/composition adapter (for example a future Seedance/Higgsfield implementation) must be added, verified and authorized before that production stage can become operational. No paid generation or social publication was performed by this release.
