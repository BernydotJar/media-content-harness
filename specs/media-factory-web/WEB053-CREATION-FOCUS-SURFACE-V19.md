# WEB053 — Creation Focus Surface V19

## Product intent

Make **Crear con mis palabras** feel like one calm creation surface: the user's idea is the dominant object, weekly usage is visible without reading like a billing dashboard, and secondary tools remain reachable without competing with the prompt.

This is a presentation and interaction increment. It does **not** change content policy, campaign logic, targeting, provider selection policy, approval authority, weekly spend accounting, source authorization, or generation semantics.

## Evidence entering scope

Real authenticated Mac Chrome QA through the existing private `9223` bridge observed on `/workspace/caballito/free`:

- the weekly usage surface is present;
- `Q200 incluidos`, the daily `1 video IA hoy` allowance, the protected weekly balance, and the protected repair reserve are visible;
- the free-form creation prompt is present and operationally separate from the usage surface.

Repository inspection shows `/workspace/:tenant/start` is a brand start surface and does not own the usage component. The root Dashboard receives a compact `UsageBudgetCard` through `DashboardActivity`, while `/workspace/:tenant/free` and `/weekly` receive the budget through `Planner`. Therefore V19 treats **Dashboard + Crear** as the decision surfaces for weekly usage; it does not add budget chrome to `/start`.

## Visual direction

Three references inform the direction without copying their artwork:

1. **Focused composer:** a simple, centered prompt experience with generous negative space and secondary controls visually demoted.
2. **Dimensional media:** glossy 3D gradient treatment for video placeholders while real media remains the primary artifact when available.
3. **Luminous glass containers:** refractive and glass cues are appropriate for large containers, but V19 will use the existing CSS stack rather than introduce a new WebGL runtime dependency.

Animated 3D icon generation is explicitly **out of runtime scope** for V19. Generated transparent WebP icons may be introduced later as versioned brand assets behind the existing icon interface; no paid generation provider is added here.

## Acceptance criteria

1. `/workspace/:tenant/free` renders a `free-create-focus-v19` surface with a centered creation header and one visually dominant prompt composer.
2. The free-create usage indicator keeps the exact weekly policy legible in its collapsed state: included amount, today's new-video availability, and current remaining amount.
3. Repair reserve, daily rule, and the non-accumulation and Audio Finishing explanation remain available through progressive disclosure.
4. The character/place shortcut is subordinate to the composer and no longer interrupts the path from header → weekly allowance → prompt.
5. Guided weekly planning retains the existing full weekly budget card and existing stepper flow.
6. Dashboard retains its compact weekly budget card and recent media shelf; no `/start` budget requirement is introduced.
7. Media placeholders and video cards keep accessible real-media-first behavior and use only CSS dimensional treatment in this increment.
8. Desktop and mobile layouts remain usable; `prefers-reduced-motion` disables nonessential motion.
9. Typecheck, focused V17/V19 tests, full test suite, and production build pass before review.
10. Authenticated bridge QA must verify the actual `/workspace/caballito/free` DOM after deployment; a release is not complete from source inspection alone.

## Non-goals

- no new persuasion, audience-targeting, voter profiling, or political-message functionality;
- no change to Q200 accounting or provider costs;
- no paid 3D-icon generation in the application runtime;
- no Plasma UI/WebGL dependency in this increment;
- no browser session material is captured as QA evidence.
