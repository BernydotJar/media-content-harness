# Director's Treatment Protocol

The Media Content Harness separates creative intent from autonomous execution.

Before expensive or irreversible creative work, the Director produces two synchronized artifacts:

1. a **Director's Treatment** written for a human;
2. an **Autonomous Execution Contract** written for the harness.

They describe the same piece at different levels.

## 1. Human-facing Director's Treatment

The treatment should sound like a director explaining a real creative decision, not like a checklist.

Use this structure:

### What I think the piece should be

State the core idea in one or two sentences.

### Why this opening

Explain the first visual and why it earns attention.

### How the story moves

Describe the intended sequence beat by beat in plain language:

- first this;
- then this;
- then the turn;
- then the payoff;
- then the release.

### Camera and composition logic

Explain the desired angle, crop, movement, scale changes, and why each matters.

### Sound logic

Explain what the viewer should hear first, what should carry across cuts, where silence or impact matters, and whether music is necessary.

### Motion / transition logic

Explain which transitions are motivated by action or composition. Explicitly reject effects that would feel like a template.

### Emotional objective

Name the intended non-targeted human response: attention, curiosity, recognition, relief, energy, dignity, belonging, surprise, etc.

Do not claim neurological certainty or manipulate a protected/sensitive audience. For political/public-affairs material, do not target voter subgroups or personalize persuasion using sensitive traits.

### What I will deliberately avoid

Examples:

- hero grammar;
- fake continuity across dates;
- synthetic documentary facts;
- generic transition packs;
- accidental CTA;
- over-branding;
- dead air;
- unreadable captions.

### Expected finish

Describe duration, aspect ratio, visual texture, audio character, and release variants.

## 2. Autonomous Execution Contract

The contract must be machine-readable and sufficiently precise to run without relying on conversational memory.

Recommended YAML form:

```yaml
schema_version: media-treatment.v1
project_id: example-project
mode: SHIP
human_eval_frequency: gated

intent:
  title: Example title
  content_type: cinematic-short
  objective: Documentary short showing collective activity.
  audience_scope: general-public
  target_duration_seconds: [9, 13]
  aspect_ratio: "9:16"

source:
  authorization: explicit
  locator: "<exact authorized album/url>"
  scope_rule: exact-source-only
  temporal_policy: single-event-or-explicit-retrospective

creative_hypothesis:
  hook: "Open on the strongest action, not a title card."
  arc: [HOOK, ACTION, TEAM, COMMUNITY, RELEASE]
  emotional_goal: "energy and collective recognition"
  visual_language: "documentary, cinematic, restrained"
  sound_language: "diegetic-first, continuous ambience, selective impacts"

beats:
  - id: b01
    role: HOOK
    source_asset: null
    desired_action: "strongest meaningful motion or gesture"
    duration_seconds: [0.3, 0.8]
    crop_intent: "subject/action legible with no hero framing"
    audio_intent: "impact or diegetic transient"
  - id: b02
    role: ACTION
    duration_seconds: [1.2, 2.5]
  - id: b03
    role: TEAM
    duration_seconds: [1.2, 2.5]
  - id: b04
    role: COMMUNITY
    duration_seconds: [1.2, 2.5]
  - id: b05
    role: RELEASE
    duration_seconds: [0.8, 1.8]

capcut_plan:
  source_policy: originals-first
  stabilization: evaluate-per-clip
  keyframes: evaluate-per-clip
  reframe: composition-aware
  speed: only-if-motivated
  color: restrained-documentary
  masks: only-if-needed
  transitions: motivated-only
  motion_blur: only-if-needed
  audio_cleanup: evaluate-per-clip
  ambience: continuous-when-needed
  sfx: selective
  seedance: disabled-unless-explicitly-justified

quality_contract:
  hook_works_muted: true
  no_false_temporal_continuity: true
  no_hero_grammar: true
  no_unverified_claims: true
  no_accidental_affiliation_cta: true
  technical:
    width: 1080
    height: 1920
    fps: 30
    codec: h264
    audio_rate_hz: 48000
    true_peak_max_dbtp: -1.5

critic_contract:
  adversarial: true
  minimum_score: 8.5
  exact_hash_required_for_verifier: true

release:
  cinematic_master: true
  trend_ready_master: true
  cover: true
  caption: true
  ledger_update: true
  sha256_manifest: true
```

## 3. Synchronization invariant

The human treatment and execution contract must not disagree.

If the human treatment says "no music" while the machine contract requests a music bed, the creative gate must block.

If the treatment says "single date" while ingest discovers multiple event dates, the graph returns to `DIRECTOR_TREATMENT` or requires an explicit retrospective decision.

## 4. Treatment approval

Under gated governance, the treatment becomes a human gate only when one of these is true:

- the user asked to approve the concept before editing;
- the treatment departs materially from the user's concept;
- there are several materially different creative directions with different meanings;
- synthetic media is proposed;
- factual/temporal interpretation is ambiguous.

Otherwise the treatment is logged and autonomous execution proceeds.

## 5. Autonomous reasoning after the gate

After treatment approval or autonomous admission, the agent may independently choose:

- exact in/out frames;
- crop coordinates;
- micro-timing;
- loudness repair;
- transition duration;
- selective SFX;
- technical export settings;
- localized fixes requested by the critic.

Those choices remain evidence-backed and reversible through Graph Harness localized repair.
