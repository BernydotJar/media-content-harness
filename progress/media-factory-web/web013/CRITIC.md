# WEB013 Critic / Red Team

Result: PASS after fixes.

Findings reviewed:
- Job routes previously lost tenant context in the outer Studio shell; FIRMES styling only survived inside JobDetail. Fixed by resolving the tenant from the current job on `/jobs/:id`.
- FIRMES V2 previously assigned the global accent token to gold. Fixed so burgundy `#8E2C2D` is the primary interaction signal; gold remains secondary/focus emphasis.
- Quick Create had hard-coded generic gold/green styling. It now consumes a tenant-aware FIRMES token set.
- `MASCOT_RENDER_UNAVAILABLE` previously offered only a retry that could not change the blocking condition. The product now exposes explicit repair actions and a role-gated provider-configuration path.
- Explicit `USE_REAL_FOOTAGE` / `REMOVE_MASCOT` repairs are server mutations, not cosmetic navigation. They invalidate downstream Graph state from DIRECTOR_TREATMENT, clear stale candidate/current-output provenance, increment repair revision, preserve upstream ingest, requeue the same job, and require a fresh CREATIVE_GATE.
- Viewer repair attempts and unknown repair actions fail closed.
- No repair path silently changes a mascot job; user intent is explicit and recorded.
- No provider credits, paid generation, social publishing, or new external dependency were introduced.

Non-blocking note: the provider-config CTA lands on the real admin integrations page. Query parameters are advisory and the integrations page does not yet visually focus a provider card; this does not prevent configuration or either direct repair action.
