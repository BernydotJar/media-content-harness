# FIRMES — Brand Memory V2

Status: derived operating memory for Media Factory. The source manual remains a private reference and is **not** committed to Git.

## Source authority

- Original user-authorized file: `/Users/eduardosacahui/Downloads/Manual_firmes_julio_260812_184318.pdf`
- Private workspace copy: `work/firmes-reference/Manual_firmes_julio_260812_184318.pdf`
- SHA-256: `5f1a384df3da3aa3d36b6efe85142e72d4b633ac7ba6796ddb845579987569d9`
- Document: *Manual de Identidad Gráfica / FIRMES*, July 2026, 57 pages.
- The binary PDF, rendered pages, and any font files remain private and outside tracked source. Do not redistribute font binaries.

## Identity rules derived from the manual

### Mark

The official imagotype is organized from a regular hexagon and a horse symbol. Preserve its proportions, symmetry, clear space, and original color applications. Do not stretch, recolor outside the institutional palette, crowd the clear-space area, or redraw the official horse in published media.

Media Factory V2 uses a **UI-only identity cue** (hexagonal monogram + FIRMES wordmark) when the exact official vector is not available as an authorized production asset. It must never be represented as the canonical official imagotype. Published media should use an authorized exact logo asset when supplied.

### Institutional palette

| Role | Manual value | Digital use |
| --- | --- | --- |
| Primary burgundy | Pantone 7623 C / `#8E2C2D` | Major brand fields, primary actions, selected state |
| Charcoal | Pantone Black 7 C / `#3C3C3B` | Structure, typography, neutral backgrounds |
| Warm gold | Pantone 7562 C / `#BD9B60` | Secondary accent, labels, small emphasis |
| Warm white | RGB 254/251/246 / `#FEFBF6` | High-contrast text and breathing space |

The manual also permits controlled 80%, 50%, and 20% tonal variants. V2 uses burgundy as the dominant brand signal; gold is supporting, not a competing primary accent.

### Typography

- **Primary/display:** Anton Regular, preferably uppercase for short display phrases.
- **Complementary:** Aleo and Guttery.
- Runtime policy: Media Factory does not distribute or embed font files from this manual. When Anton is not available in the environment, the UI uses a condensed system fallback stack (`Impact`, `Haettenschweiler`, `Arial Narrow Bold`, sans-serif) while preserving hierarchy and spacing. Body text stays legible and neutral.

### Motion

Motion is a product affordance, not decoration. FIRMES V2 may use a restrained Gooey/morph cue for a next action, active status, or brand reveal. It must:

- never obscure the semantic button or text;
- complete interaction transitions in roughly 300 ms or less;
- stop under `prefers-reduced-motion: reduce`;
- not imply that blocked production is actively rendering;
- never replace explicit status/error copy.

The V2 implementation studies Gooey mechanics internally rather than adding the very new `liquid-gooey` dependency to the production supply chain.

## Content boundary

This memory is for general-audience creative/brand consistency. It does not authorize sensitive-trait targeting, voter microtargeting, individualized political persuasion, automatic publication, or fabrication of documentary events. Synthetic or composited media must be clearly labeled in provenance.

## Authorized caballito production asset

The manual contains separate horse references for brand identity and character applications. Media Factory does **not** reinterpret the UI-only hexagonal monogram as the official horse mark. For the product's fictional-character workflow, the user-authorized manual supplies an exact plush-horse image on PDF page 42 (`CABALLO DE PELUCHE`). That embedded image is tracked as a bounded production asset with its original alpha mask:

- Runtime asset: `config/brand-assets/firmes-caballito.png`
- Asset ID: `firmes-caballito-manual-p42`
- Asset SHA-256: `b17c55ffb0eec46bfa719128ee68a9f18475c45afb90d6d73ce9d82567938397`
- Source document SHA-256: `5f1a384df3da3aa3d36b6efe85142e72d4b633ac7ba6796ddb845579987569d9`
- Source page: 42
- Provenance record: `config/brand-assets/firmes-caballito.provenance.json`
- Classification: authorized fictional-character reference, non-synthetic.

The local zero-credit FFmpeg adapter may composite this exact authorized caballito over authorized real footage when the job's immutable character snapshot is the rights-confirmed `Caballito de Firmes`. The output provenance records both the consumed source-video hashes and the exact caballito asset hash. Any other mascot remains fail-closed with `MASCOT_RENDER_UNAVAILABLE` unless a separately approved adapter is available.

This support does **not** authorize a model to redraw the official FIRMES imagotype, does not fabricate documentary events, and does not automatically publish to social networks. The exact official vector logo is still required for uses that claim the canonical imagotype.
