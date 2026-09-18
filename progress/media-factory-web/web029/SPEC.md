# WEB029 — New-user and tenant/brand onboarding V8

## Product problem

Media Factory has strong creation/review flows, but a newly admitted user can still land in a mature studio without understanding three essential things:

1. what Media Factory is asking them to do first;
2. which brand/workspace they are currently operating in;
3. the difference between a user account, a brand workspace (tenant), and that workspace's material/style/production state.

The current `/workspaces` screen also exposes a `+ Nueva marca` control even to users whose server authority cannot create tenants, causing avoidable 403 UX. New tenants jump directly to Material without a small orientation moment.

## Product vocabulary

- User-facing language: **Marca** and **Espacio de marca**.
- Technical/internal language may remain `tenant_id` in contracts, storage, tests and advanced settings.
- A brand workspace is isolated: its material, style, characters, plans, jobs and releases do not bleed into another brand.
- Roles remain authoritative server-side; UI only explains current authority and never grants it.

## Scope

### A. Persistent first-run guide

Add a private `/onboarding` route and a reusable first-run welcome surface.

The guide must answer, in plain language:

1. **Elige tu marca** — what workspace the user is operating in.
2. **Trae material** — upload/authorize source media.
3. **Define el estilo** — establish creative identity from authorized references.
4. **Crea y revisa** — create content, then explicitly approve/revise it.

Behavior:

- first-run completion is stored server-side per authenticated user;
- `GET /api/v1/me/onboarding` returns only that user's onboarding state and safe tenant summary;
- `POST /api/v1/me/onboarding` accepts an explicit completion action and records it atomically;
- login may send a not-yet-completed user to `/onboarding`; the page always offers `Saltar por ahora`/`Entrar al estudio`, so onboarding is guidance, not a lockout;
- `/onboarding` remains manually reachable later as `Guía rápida` even after completion;
- no localStorage-only authority or onboarding state.

### B. Brand/tenant clarity

Improve `/workspaces` so the product never asks a user to perform an action the server will reject:

- only users with `can_create_tenants=true` see `+ Nueva marca`;
- users without creation authority see their assigned brands and a clear explanation that membership is managed by their organization;
- zero-brand users with creation authority get a direct `Crear mi primera marca` path;
- zero-brand users without creation authority get `Aún no tienes una marca asignada` and instructions to contact the responsible person;
- workspace cards show the user's role with friendly language;
- tenant creation explains that the new brand is isolated from other brands;
- internal `tenant_id` stays under Advanced Options only.

### C. Brand start page

Add private `/workspace/:tenant_id/start`.

It is a compact orientation/overview for one brand and uses existing authoritative `/tenants/:id/journey` data rather than inventing progress.

It shows:

- brand name and role;
- `Tu espacio está listo` / context-aware heading;
- progress cards for Material → Style → Create → Delivery using journey facts;
- the authoritative **next action** from `journey.next`;
- a short explanation that this brand's material/style/characters/productions remain isolated from other brands;
- no fabricated percentage;
- if a brand has just been created, route there first instead of dropping directly into the Material form.

The sidebar brand chip should open this brand start page. `Configurar marca` should include a `Resumen` entry before Material/Style/Characters.

### D. Dashboard welcome without disruption

For authenticated users whose onboarding is incomplete, Dashboard shows a compact `Nuevo por aquí` callout linking to `/onboarding`. It must not cover or replace active production/review information.

## Security / authority invariants

- onboarding state is keyed only by resolved authenticated `user.id`;
- no caller-supplied user ID accepted;
- completing onboarding changes only onboarding metadata;
- tenant membership checks remain unchanged;
- creating a tenant still requires `can_create_tenants` server-side;
- onboarding summary may expose only tenants already present in the resolved user's memberships;
- no cross-tenant job/material/style data is added to onboarding payloads;
- no auth, review, release or provider authority is expanded.

## Accessibility / responsive behavior

- onboarding steps use semantic ordered-list/navigation structure;
- brand choice uses labeled links/select where needed;
- buttons/links retain visible focus;
- mobile 390px has no horizontal overflow;
- reduced-motion behavior remains intact;
- role labels are text, not color-only.

## Acceptance

- New authenticated user can understand the product in under one screen and reach the authoritative next step.
- User with no brand cannot confuse account access with tenant membership.
- User without tenant-creation authority never sees a working-looking `Nueva marca` CTA.
- New tenant creation lands at `/workspace/:id/start`.
- Brand chip and brand setup menu expose `Resumen`.
- Journey progress remains fact-based; no fake percent.
- User onboarding completion persists across sessions and is tenant-independent.
- Tenant isolation and role checks remain unchanged and covered by tests.
- Existing Creation Room V7, review flow, autosave, avatar and release behavior remain green.
- Exact full suite, typecheck, production build, contracts, audit and browser E2E pass before release.
