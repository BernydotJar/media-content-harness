# WEB021 — Liquid-glass navigation and simpler menus

## Owner observation
The immersive V4 direction is right and the product is now sufficiently simple, but the navigation still feels visually odd and the menus do not yet express the “Liquid glass nav bar” reference strongly enough.

Reference inspected:
- https://www.inspora.design/posts/liquid-glass — “Liquid glass nav bar”.

The reference is direction only. Do not copy artwork or implementation.

## Scope

1. **Simplify the Create menu**
   - With exactly one brand, “Crear” must open direct actions for that brand: “Crear con mis palabras”, “Planear una semana”, and “Crear una escena”.
   - Do not force a redundant second-level brand submenu when there is only one brand.
   - Preserve the existing multi-brand submenu behavior when more than one brand exists.
   - Empty state still offers “Agregar una marca”.

2. **Simplify desktop navigation**
   - Keep the always-visible primary path small: Inicio, Crear, Revisar, Entregas.
   - Move brand setup utilities (Material, Estilo, Personajes y lugares) into one compact “Configurar marca” disclosure when inside a brand workspace.
   - Keep “Marcas” available only when it adds value (multiple brands or explicit brand management route).
   - Admin remains permission-bound and visually secondary.
   - The current brand should be a small liquid-glass identity capsule, not a heavy section header.

3. **Liquid-glass visual behavior**
   - Navigation surfaces should read as floating translucent glass rather than opaque dark cards.
   - Use layered transparency, backdrop blur, saturation, thin luminous rim, top highlight, internal refraction/glow and a restrained active-state lens.
   - Create dropdown and nested submenu use the same material language.
   - Avoid excessive borders or stacked capsules that make the UI look busy.

4. **Top bar**
   - Remove the odd double-banner feeling.
   - Keep a compact context label on the left and approval assurance + Create on the right.
   - Do not compete visually with the hero.

5. **Accessibility / mobile**
   - Keyboard navigation, Escape focus restore and safe diagonal submenu behavior remain valid for multi-brand users.
   - Single-brand direct menu gets keyboard/touch coverage.
   - Mobile 390px remains horizontally safe.
   - Reduced-motion keeps the glass material but removes transform animation.

## Acceptance
- One-brand Create menu has no redundant nested brand selection.
- Two-brand E2E preserves submenu accessibility.
- Sidebar primary navigation is visibly simpler.
- Brand setup remains reachable in one disclosure.
- Liquid-glass menu CSS has blur/saturation, layered rim/highlight/refraction, and reduced-motion handling.
- Exact clean typecheck, build, browser E2E, full tests and non-test FIRMES completion pass.
- Signed release target remains https://media-factory.textilesdemedellin.com.
