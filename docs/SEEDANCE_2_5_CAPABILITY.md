# Seedance 2.5 capability

Seedance 2.5 is modeled as a separate creative capability inside the CapCut gateway, not as generic post-processing.

## Confirmed product capability

The CapCut UI available to this project exposes Seedance 2.5 inside Video Studio. CapCut's current product documentation describes native clips up to 30 seconds, native 4K generation, multimodal references, synchronized stereo audio, R2V motion control, and Intelligent Edit Mode.

These product capabilities are provider facts, not assumptions about what every account/session exposes. Before each paid generation, the gateway must verify the actual UI/model mode visible in the authenticated CapCut session.

## Harness role

Seedance may be considered at the Director stage and executed only after a dedicated synthetic-media gate.

```text
DIRECTOR_TREATMENT
  -> SEEDANCE_DECISION
       -> not_needed
       -> proposed
            -> HUMAN_CREDIT_GATE
            -> SEEDANCE_GENERATE
            -> SYNTHETIC_PROVENANCE
            -> CREATIVE_QA
  -> PRODUCER_CAPCUT
```

The main documentary edit must remain usable when Seedance is `not_needed` or unavailable.

## Allowed use classes

- abstract transitions;
- water/light textures;
- particles;
- motion graphics;
- clearly stylized non-documentary inserts;
- reference-guided B-roll that is explicitly synthetic and cannot reasonably be mistaken for event evidence.

## Prohibited documentary substitutions

Seedance must not create synthetic people, crowds, infrastructure, public-service activity, event actions, or factual moments and then present those generations as documentary evidence from the authorized source.

A source weakness is not permission to fabricate a stronger factual shot.

## Credit/spend gate

Generation consumes an external provider resource. Media Content Harness therefore requires an explicit human approval before paid/credit-consuming generation.

The approval evidence should bind:

- project id;
- treatment revision;
- intended use class;
- selected model/mode;
- expected generation count;
- expected or observed credit cost when available;
- reference asset hashes;
- prompt hash.

A general approval to edit a project is not automatically approval to spend credits.

## Provenance

Every generated artifact must record at least:

```yaml
kind: synthetic-media
provider: capcut
model: seedance-2.5
surface: video-studio
project_id: ...
treatment_revision: ...
use_class: abstract-transition
prompt_sha256: ...
reference_asset_sha256:
  - ...
generated_artifact_sha256: ...
credit_gate_event_id: ...
disclosure: explicitly-synthetic
```

Never persist authentication cookies, signed URLs, or provider secrets in the ledger.

## Director decision

The Director must answer before generation:

1. What precise problem would Seedance solve?
2. Why can CapCut-native editing or authentic source footage not solve it better?
3. Could the result be mistaken for documentary reality?
4. What reference assets are needed?
5. What maximum generated duration is necessary?
6. What happens if the generation is rejected?

If these questions do not produce a clear benefit, mark Seedance `not_needed`.

## Creative QA

A Seedance artifact is not accepted because generation succeeded. It must pass:

- visual continuity;
- temporal consistency;
- no uncanny subject behavior;
- no unintended text/logos;
- no misleading documentary implication;
- compositional usefulness in the locked EDL;
- source/reference fidelity where applicable.

Rejected generations remain evidence but never enter the release timeline.

## Dashboard projection

Expose:

- Seedance status: `not_needed | proposed | approved | generated | used | rejected | blocked`;
- model/mode;
- generated duration;
- credit approval state;
- prompt/reference hashes;
- synthetic disclosure;
- generated artifact hashes;
- which timeline beat consumes the generation.
