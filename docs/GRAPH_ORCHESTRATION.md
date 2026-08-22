# Graph Orchestration

Media Content Harness uses two complementary runtimes rather than reimplementing either one.

- **DeepSeek Harness** owns the agent/plugin runtime, tool registry, model adapters, durable session transcript, UI surface, and capability composition.
- **Graph Harness SDLC** owns production lifecycle state, dependency readiness, evidence freshness, quality gates, checkpoints, localized repair, and terminal-state semantics.

The media harness composes them. It does not patch the DeepSeek agent loop and it does not copy the Graph Harness Python runtime.

## Authority model

The authoritative order is:

1. `graph-harness.project.v1` + append-only `graph-harness.event.v1` ledger — lifecycle authority.
2. Media project manifest — domain snapshot for one content piece.
3. Global asset ledger — provenance, reuse, narrative role, and derivative history.
4. Binary artifacts addressed by SHA-256.
5. DeepSeek session log — reconstructable execution/model transcript.
6. Dashboard — projection only; never an independent source of truth.
7. CapCut/Gemini/browser UI state — ephemeral execution surfaces.

If two surfaces disagree, fail closed and reconcile against the higher authority.

## Default media graph

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

`FIXER` may be a no-op only when the critic explicitly passes the candidate. A failed critic or verifier invalidates the affected node and its descendants; preserved upstream evidence remains valid unless its revision changes.

## Suggested node semantics

| Node | Purpose | Required evidence examples |
|---|---|---|
| `BRIEF` | Normalize user intent and constraints | `brief`, `creative_constraints` |
| `SOURCE` | Prove exact authorization scope | `source_authorization` |
| `INGEST` | Inventory masters and provenance | `asset_manifest`, `hash_manifest` |
| `DIRECTOR_TREATMENT` | Human-readable creative rationale + machine contract | `director_treatment`, `edl_draft` |
| `CREATIVE_GATE` | Optional human approval under gated governance | `human_approval` or `autonomy_decision` |
| `PRODUCER_CAPCUT` | Build the candidate in CapCut from verified source assets | `capcut_export`, `feature_accounting` |
| `TECHNICAL_QA` | Deterministic media validation | `ffprobe`, `decode`, `loudness`, `frame_qa` |
| `CRITIC` | Adversarial creative review | `critic_report` |
| `FIXER` | Localized correction in the same creative surface | `fix_log`, `fixed_export` |
| `INDEPENDENT_VERIFIER` | Fresh-context verification of exact candidate hash | `verifier_report` |
| `COMPLIANCE` | Legal/editorial/brand policy gate | `compliance_report` |
| `RELEASE` | Promote exact verified hash and emit manifest | `release_manifest`, `sha256_manifest` |

## Ready-node scheduling

Only execute a node when:

- every dependency is `done`;
- the node is at the required approved/ready state;
- required current-revision gates pass;
- required tools/credentials are available;
- the source scope permits the operation.

The orchestrator continuously selects the highest-priority READY node. It does not continue downstream when a gate fails.

## Localized repair

Use Graph Harness repair semantics rather than rebuilding the complete piece by default.

Examples:

- bad crop -> invalidate `PRODUCER_CAPCUT` and descendants, preserve source/ingest/treatment;
- wrong source date -> invalidate `INGEST` and all descendants;
- loudness failure only -> preserve picture lock and repair audio/export;
- critic rejects narrative arc -> invalidate treatment/producer descendants;
- verifier hash mismatch -> invalidate release path, not source inventory.

Every repair increments the affected node revision so stale evidence cannot satisfy a new gate.

## Dual evidence model

Every meaningful decision should produce both:

1. **human evidence** — concise explanation of what was decided and why;
2. **machine evidence** — structured fields, artifact path, SHA-256, tool/model/mode, and result.

The human view explains the movie. The machine view proves what was executed.

## Gated human evaluation

`human_eval_frequency: gated` means human interaction is requested only when it changes authority or creative intent, for example:

- source authorization is ambiguous;
- a treatment materially changes the user's stated concept;
- the system proposes synthetic imagery that could be mistaken for documentary evidence;
- legal/compliance interpretation requires a human decision;
- publication itself is an external action requiring approval.

Ordinary crop fixes, loudness repairs, deterministic QA, and evidence bookkeeping proceed autonomously.

## External creative surfaces

### Gemini Pro

Use for Director, Critic, and Independent Verifier roles. A response is valid only when required attachments are verifiably loaded and the requested model/mode is confirmed.

### CapCut Pro

CapCut is the primary finishing room. Work from original masters or explicitly logged transport derivatives. Creative fixes should return to CapCut rather than silently substituting an external render pipeline.

Track feature accounting explicitly: `used`, `attempted_unavailable`, `reverted`, `not_needed`, or `blocked` for stabilization, keyframes, masks, speed, color, denoise, SFX, transitions, AI tools, and export.

### Seedance

Use only for clearly synthetic or abstract inserts when they improve the piece. Do not synthesize documentary facts, people, crowds, infrastructure, or actions and present them as captured reality.

## Dashboard projection

The dashboard projects graph + media state into views such as:

- READY / IN PRODUCTION / REVIEW / BLOCKED;
- next READY node;
- Director Treatment;
- timeline/beat map;
- asset lineage;
- current candidate hash;
- critic/verifier evidence;
- compliance state;
- release artifacts.

It should not provide a second task-state database and should not attempt to replace CapCut as an editor.
