# WEB017 — Creative Studio redesign and guided autosave

Exact product candidate: c2af008c854bcb7493b4aa0a73cd31dd05b93c28

## User-visible repair

The guided flow no longer asks the user to manually save a draft before approval. At the final preview step, Continue calls the existing draft persistence contract, waits for success, then moves to the explicit approval screen. It does not approve concepts and it does not launch production. The server contracts remain separate:

createPlan -> DRAFT -> approvePlan -> APPROVED -> launchPlan -> jobs.

## Visual redesign

- Floating liquid-glass navigation and top controls.
- Dimensional 3D media cards for review, deliveries, and recent dashboard work.
- Actual authenticated video/image previews are used whenever a job exposes an authorized artifact URL; gradient art is only a fallback.
- Dashboard hero uses a layered three-card media composition with the authorized FIRMES Caballito in the center card.
- The large FIRMES product banner is reduced to a compact brand capsule.
- The guided workflow uses a sticky glass action dock.
- End-user vocabulary is Material, Estilo, Crear, Revisar, Entregas; support/request identifiers are collapsed into optional details.
- Favicon/app icons remain derived from the authorized Caballito asset.
- Reduced-motion and 390px mobile overflow protections remain active.

No provider authority, authentication contract, artifact authorization, dependencies, Docker/Compose, deployment control plane, or trust roots changed in this candidate.
