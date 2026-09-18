# WEB025 — Human-centered review UX

## Owner observation

Three user-facing contradictions remain after Mascot Avatar System v1:

1. A story can say it uses the brand mascot while the protagonist selector still reads “Sin personaje”. The approved Caballito is also invisible in the story editor.
2. “Así se plantea esta versión” renders a deep technical object tree. The information is valuable but too long for a non-technical reviewer.
3. Human review asks for change text before the person has decided whether they want changes. Approval and revision intent are therefore presented at the same time instead of progressively.

## Product decisions

### 1. One source of truth for the story character

- `mascot=true` must never be visually represented as “Sin personaje”.
- For a tenant with a default brand mascot, the story editor shows the actual authorized avatar image and character name in a first-class choice card.
- The simple choice is “Sin personaje” vs the default authorized brand mascot.
- Selecting the mascot atomically sets `mascot=true`; selecting no character atomically sets `mascot=false` and clears `character_id`.
- If a principal creative-profile record exists, selecting the default mascot also binds that profile ID; if no creative profile exists, the first-class brand mascot remains valid through the existing brand-asset authority.
- Additional authorized fictional characters remain available through a secondary “Otro personaje” selector rather than competing with the default choice.
- The redundant checkbox “Incluir el personaje o mascota de la marca” is removed.

### 2. Review summary optimized for scanning

Replace the recursive object dump as the primary surface with a compact summary grid:

- Story: title + intention.
- Character: approved character/avatar with small authorized image when available.
- Place: selected place or “Sin lugar específico”.
- Creative resources: friendly labels/chips, not internal slugs.
- Material: count / authorized source names.
- Delivery: strategy, aspect ratio/resolution, duration.
- Character status: human-friendly “Personaje autorizado” / “Sin personaje”.

Technical fields remain available under a collapsed “Ver detalles técnicos” disclosure. Exact hashes remain in the existing technical panel and are not removed from evidence/release authority.

### 3. Progressive human-review decision

Primary question: **“¿Qué quieres hacer con esta versión?”**

Initial state exposes only two clear decisions:
- `Aprobar versión` / `Aprobar entrega`.
- `Quiero hacer cambios`.

Only after `Quiero hacer cambios`:
- show the textarea;
- show useful suggestion chips (“Agregar Caballito”, “Cambiar inicio”, “Usar otro clip”, “Más corto”, “Más emocional”);
- show `Solicitar cambios`;
- keep Critic guidance available and allow a rubric finding to open/populate the change composer;
- keep destructive rejection under “Más opciones”.

Approval must remain a hash-bound authenticated action and must not require change text. Change requests must still require non-empty text.

## Accessibility and responsive behavior

- Character choice is a real radiogroup/radio pattern with visible selected state.
- Avatar image has meaningful alt text.
- Review decision buttons expose pressed/expanded state where relevant.
- Change composer receives focus when opened.
- Keyboard and mobile 390px flow remain usable with no horizontal overflow.
- Reduced-motion behavior remains intact.

## Acceptance

- A FIRMES story with `mascot=true` visibly shows Caballito FIRMES and never “Sin personaje”.
- Default mascot preview uses the first-class authorized brand-asset endpoint, not a hardcoded PNG path.
- Removing mascot clears the relevant story state atomically.
- Compact review summary is the default; raw nested candidate data is hidden under one technical disclosure.
- Internal slugs such as `participatory-brand-reveal` are translated to friendly labels in the primary summary.
- Review textarea is absent initially and appears only after `Quiero hacer cambios`.
- Clicking a Critic rubric finding opens the change composer and populates it.
- Existing approve/request-changes/reject server contracts are unchanged.
- Browser E2E covers avatar visibility, summary hierarchy and progressive review behavior.
- Typecheck, production build, full suite, audit, scene/FIRMES E2E and fresh independent verification pass.
- Signed deployment target remains `https://media-factory.textilesdemedellin.com`.
