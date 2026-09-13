# WEB013 — Repair UX + FIRMES Brand V3

User-visible defects to close:

1. `MASCOT_RENDER_UNAVAILABLE` and equivalent provider blockers must expose real remediation actions from the blocked job screen. Explicit user actions may switch the same job to real footage or remove the mascot, but the product must never silently downgrade the creative intent.
2. `/jobs/:id` must resolve its tenant and apply FIRMES branding to the entire studio shell. Burgundy `#8E2C2D` is the dominant primary; charcoal `#3C3C3B` structures surfaces; gold `#BD9B60` is secondary; warm white `#FEFBF6` is text.
3. Primary CTA, sidebar/nav active state, blocked card, stage indicator, focus state and Quick Create must use tenant-aware brand tokens.
4. Admin-only provider setup remains privilege-aware. Non-admin users must not be offered an action they cannot perform.
5. Repair mutations invalidate affected downstream Graph state, clear stale candidate/output provenance, increment repair revision and resume the same job.
