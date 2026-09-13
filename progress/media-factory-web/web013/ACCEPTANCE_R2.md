# WEB013 acceptance regression R2 — manual repair dead-end

Date: 2026-09-13

User acceptance evidence shows a deployed production at `PROVIDER_PRODUCTION` blocked by `MANUAL_REPAIR_REQUIRED` with the message:

> This creative edit requires a reviewed manual production adapter; it was not applied automatically

The only prominent CTA is **Ir a revisión humana**, which routes to the generic `/review` library rather than to an action that can resolve this exact blocker. Returning to the job reproduces the same blocker. This is an infinite navigation loop and violates the WEB013 requirement that blocking states expose an actionable repair path from the job.

Required repair:

1. `MANUAL_REPAIR_REQUIRED` must have a same-job mutation that can actually resolve the block without pretending the unsupported edit was applied.
2. The user must be able to explicitly withdraw the unsupported manual edit and continue using the already reviewed treatment/source, preserving history and provenance.
3. The user must also have an exact edit-story route for changing the plan if they still want the requested creative change.
4. The generic `/review` CTA must not be presented as the repair for `MANUAL_REPAIR_REQUIRED`.
5. The recovery action must clear the manual blocker, resume the same Graph, and remain fail-closed with respect to unsupported edits.
