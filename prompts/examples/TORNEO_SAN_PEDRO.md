# EXAMPLE PROMPT — Torneo San Pedro Cinematic Short

Use the Media Content Harness master prompt as binding policy.

Run this as a real production, not a planning exercise.

## Task

Create one world-class vertical cinematic short from this explicitly authorized Google Photos album:

https://photos.google.com/share/AF1QipOvoND6vHKrPXKNmTtAMsk33pkjtqfCOQkCRUuPMGh4mvw-w8rvLZ7FnF7zwv6gWQ?key=RlBqekdwNkh0TEU1QTFhakQwb1dSdkF3cTFkeDJB

Working title:

`Torneo San Pedro — El juego nos encuentra`

The piece should feel like a premium sports/community documentary compressed into 9–13 seconds.

Do not make it look like a campaign commercial.

Do not search outside the exact authorized album.

Do not reuse previously used assets silently; inspect the global ledger first.

## Human-facing treatment behavior

Before editing, present a concise Director's Treatment in this style:

> Pienso abrir con el gesto deportivo más fuerte que encontremos, sin título, porque el primer segundo debe vender movimiento y no contexto. Después quiero cortar a una imagen que amplíe el espacio y deje claro que no es una jugada aislada sino un torneo. El tercer beat debe introducir equipo: varias personas relacionadas por la misma acción, no una pose individual. A partir de ahí quiero aumentar escala hacia comunidad y cerrar con una imagen que respire, dejando que el sonido complete la resolución.
>
> En audio quiero empezar con un impacto real del lugar o un transient deportivo, mantener una cama corta de ambiente y usar sólo dos o tres acentos fuertes. Si la fuente no tiene audio útil, prefiero un diseño original mínimo a una canción épica. No quiero que cada corte grite.
>
> Visualmente voy a trabajar los retratos con push-ins muy leves y los horizontales con profundidad ambiental, no con crop brutal. Las transiciones sólo se justifican por dirección de movimiento, composición o beat. Nada de cube, spin, page-turn o template evidente.
>
> Lo que busco que quede en la memoria no es una persona: es la sensación de juego, equipo y encuentro comunitario.

Then produce and persist the synchronized `media-treatment.v1` execution contract.

## Creative contract

```yaml
schema_version: media-treatment.v1
project_id: torneo-san-pedro-cinematic-test
mode: SHIP
human_eval_frequency: gated

intent:
  title: "Torneo San Pedro — El juego nos encuentra"
  content_type: cinematic-short
  objective: "Show sport as shared activity and community through a concise documentary arc."
  audience_scope: general-public
  target_duration_seconds: [9, 13]
  aspect_ratio: "9:16"

source:
  authorization: explicit
  locator: "https://photos.google.com/share/AF1QipOvoND6vHKrPXKNmTtAMsk33pkjtqfCOQkCRUuPMGh4mvw-w8rvLZ7FnF7zwv6gWQ?key=RlBqekdwNkh0TEU1QTFhakQwb1dSdkF3cTFkeDJB"
  scope_rule: exact-source-only
  temporal_policy: single-event-block-preferred

creative_hypothesis:
  hook: "Start on meaningful sport/action or a visually strong gesture; no title card first."
  arc: [HOOK, GAME, TEAM, COMMUNITY, RELEASE]
  emotional_goal: "energy, belonging, recognition"
  visual_language: "sports documentary, restrained cinematic movement, premium social pacing"
  sound_language: "diegetic-first, selective impacts, continuous acoustic world"

selection_rules:
  prefer_motion_if_available: true
  minimum_distinct_narrative_roles: 5
  reject_redundant_pose_sequences: true
  reject_hero_grammar: true
  verify_source_dates: true
  check_global_asset_ledger: true

beats:
  - id: b01
    role: HOOK
    target_duration_seconds: [0.35, 0.8]
    intent: "strongest meaningful sporting gesture or tension"
  - id: b02
    role: GAME
    target_duration_seconds: [1.2, 2.2]
    intent: "make the sport/event legible"
  - id: b03
    role: TEAM
    target_duration_seconds: [1.4, 2.4]
    intent: "show coordinated/shared presence"
  - id: b04
    role: COMMUNITY
    target_duration_seconds: [1.5, 2.6]
    intent: "expand human scale without turning into a hero shot"
  - id: b05
    role: RELEASE
    target_duration_seconds: [1.0, 1.8]
    intent: "clean emotional release; optional brief FIRMES signature only if composition supports it"

capcut_plan:
  source_policy: originals-first
  stabilization: evaluate-per-clip
  keyframes: subtle-only
  reframe: composition-aware
  speed: only-if-motion-benefits
  color: natural-documentary
  masks: only-if-needed-for-depth
  transitions:
    - hard-cut
    - match-cut
    - directional-whip-if-motivated
    - micro-flash-max-2-frames-if-motivated
  motion_blur: only-if-transition-requires
  audio_cleanup: evaluate-per-clip
  ambience: continuous
  sfx: selective
  text: minimal
  seedance: disabled-by-default

sound_plan:
  music: optional
  diegetic_priority: true
  max_major_impacts: 3
  no_accidental_dead_air: true
  use_j_l_cuts_if_source_supports: true
  trend_ready_variant: true

compliance:
  public_information_documentary_frame: true
  targeted_voter_persuasion: false
  prohibit_vote_cta: true
  prohibit_support_cta: true
  prohibit_donation_cta: true
  prohibit_candidate_hero_grammar: true
  prohibit_accidental_affiliation_cta: true

quality_contract:
  hook_works_muted: true
  temporal_truthfulness: required
  documentary_authenticity: required
  no_template_aesthetic: true
  no_redundant_images: true
  technical:
    width: 1080
    height: 1920
    fps: 30
    codec: h264
    pixel_format: yuv420p
    audio_rate_hz: 48000
    true_peak_max_dbtp: -1.5

critic_contract:
  adversarial: true
  minimum_score: 8.5
  reject_if:
    - "first second is weak"
    - "looks like a slideshow/template"
    - "one person dominates the narrative without editorial reason"
    - "horizontal crop hides the action"
    - "audio contains accidental dead air"
    - "timeline implies false chronology"
    - "branding damages the release"

release:
  cinematic_master: true
  trend_ready_master: true
  cover: true
  caption: true
  capcut_recipe: true
  critic_report: true
  verifier_report: true
  ledger_update: true
  sha256_manifest: true
```

## Execution graph

Instantiate and execute:

```text
BRIEF
-> SOURCE
-> INGEST
-> DIRECTOR_TREATMENT
-> CREATIVE_GATE
-> PRODUCER_CAPCUT
-> TECHNICAL_QA
-> CRITIC
-> FIXER
-> INDEPENDENT_VERIFIER
-> COMPLIANCE
-> RELEASE
```

Use Graph Harness SDLC as lifecycle authority.

The DeepSeek/agent session may explain and execute, but graph state determines what is READY, what evidence is current, what must be repaired, and whether release is legal.

## Special CapCut test goals

For this test, deliberately verify and account for these capabilities instead of assuming them:

- source ingest from originals;
- exact timeline order after upload/transcode;
- portrait motion/keyframes or a documented native alternative;
- landscape-to-vertical composition;
- stabilization when useful;
- audio noise reduction when useful;
- layered ambience/SFX;
- motivated transition(s);
- export at 1080p / high quality / 30 fps / MP4.

If a feature is unavailable, record `attempted_unavailable` and continue without pretending it was used.

If a feature harms quality or export reliability, revert it and record `reverted`.

## Critic behavior

The Critic must see the actual exported candidate.

It should be willing to say `REPAIR` or `BLOCK` even when technical QA passes.

If Critic passes, Fixer writes an explicit no-op decision rather than inventing extra changes.

If Critic fails, return to CapCut and repair only the smallest causally sufficient surface.

## Independent verifier

Use a fresh context and verify the exact SHA intended for release.

Do not reveal the producer's defense of the edit.

## Deliverables

Create a project directory with:

```text
00_LISTO_PARA_SUBIR/
01_COPY/
02_ASSETS/
03_EDL/
04_CAPCUT/
05_CRITIC/
06_VERIFIER/
99_INTERNO/
```

Final release should contain:

- `TorneoSanPedro_Cinematic_FINAL.mp4`
- `TorneoSanPedro_CapCut_TrendReady_FINAL.mp4`
- `TorneoSanPedro_Portada.jpg`
- `UPLOAD_READY.md`
- `SHA256.txt`

The release is complete only when graph state is terminal and the promoted hashes equal the hashes that passed required verification.
