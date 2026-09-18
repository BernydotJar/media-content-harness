# WEB019 — Immersive Creative Studio V4

## User problem

The previous visual pass still reads too close to a conventional admin dashboard, and Guided creation still exposes the notion of manually saving a draft. The product must feel like a media studio, not a control panel.

## Design references

Use the principles, not copied assets, from:
- Inspora “3D gradient cards”: glowing 3D glossy cards that warp/tilt and make visual media the dominant object.
- Inspora “Liquid glass”: translucent floating navigation surfaces with refractive highlights and depth.

## Required product changes

1. True automatic draft persistence
   - When the last editable Guided step is complete and the user presses Continue, persist the DRAFT before showing the weekly preview.
   - Do not expose a manual “Guardar borrador” requirement in Guided mode.
   - Approval and launch remain explicit, separate human actions.
   - A failed autosave must keep the user on the editable step and explain the actual issue.

2. Real media as the primary UI
   - Dashboard hero should prefer real authenticated recent video/image artifacts instead of purely decorative mock cards.
   - Review and Deliveries should be a visual media gallery with 9:16 objects, layered depth, hover lift/tilt, playable video where appropriate, and concise metadata.
   - Fallback gradient art is acceptable only when no authorized preview exists.

3. Liquid-glass navigation
   - Sidebar/top context/wizard controls should visibly read as floating translucent glass with depth, highlights and active-state refraction.
   - Preserve keyboard navigation, reduced-motion behavior and mobile ergonomics.

4. Reduce dashboard/admin feel
   - De-emphasize tables, counters and long technical labels.
   - Use editorial grouping, media shelves and concise status chips.
   - Keep operational truth available but secondary.

5. FIRMES identity
   - Preserve the authorized Caballito as the default brand character.
   - Keep burgundy/gold identity but allow softer iridescent gradients for media surfaces.
   - No copied Inspora artwork or third-party assets.

## Acceptance

- Exact browser E2E proves Guided Continue auto-saves before preview and still requires explicit approval.
- No “Guarda el borrador antes…” state remains reachable in Guided happy path.
- Actual media renders in review/delivery/dashboard cards when authorized artifact URLs exist.
- Mobile 390px has no horizontal overflow.
- Reduced-motion disables dimensional hover/ambient transforms.
- Full tests, typecheck, build, security audit and non-test FIRMES flow pass.
- Release target remains https://media-factory.textilesdemedellin.com, never a temporary trycloudflare URL.
