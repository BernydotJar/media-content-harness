# Media Content Harness

A plugin-first media-production operating system built on DeepSeek Harness and governed by Graph Harness SDLC.

Media Content Harness turns an agent runtime into a durable production system for cinematic social content: explicit source authorization, asset provenance, Director Treatments, CapCut/Gemini orchestration, critic/fixer/verifier loops, deterministic media QA, compliance gates, release manifests, and dashboard-ready state.

## Runtime strategy

This repository does **not** fork or patch the DeepSeek agent loop and does **not** copy the Graph Harness runtime.

- [DeepSeek Harness](https://github.com/deepseek-ai/deepseek-harness) is the plugin/session/model/tool runtime.
- [Graph Harness SDLC](https://github.com/BernydotJar/Graph-harness-sdlc) is the lifecycle authority: READY-node scheduling, evidence, gates, checkpoints, revisions, localized repair, and terminal states.
- Media Content Harness supplies the media-specific plugins, policies, adapters, schemas, prompts, and projections.

See [Graph Orchestration](docs/GRAPH_ORCHESTRATION.md) and [Architecture](docs/ARCHITECTURE.md).

## Creative control model

Every substantial piece begins with two synchronized artifacts:

1. **Director's Treatment** — a human-readable explanation of what the director wants to do and why: opening, sequence, camera/composition, audio, transitions, emotional objective, and deliberate exclusions.
2. **Autonomous Execution Contract** — a structured `media-treatment.v1` object that the graph can execute and audit without relying on chat memory.

See [Director's Treatment Protocol](docs/CREATIVE_TREATMENT_PROTOCOL.md) and [`schemas/media-treatment.schema.json`](schemas/media-treatment.schema.json).

## Default production graph

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

A failed gate invalidates only the causally affected subgraph. Stale evidence cannot satisfy a repaired node revision.

## Sources of truth

1. Graph Harness project + append-only event ledger.
2. Media project manifest.
3. Global asset/provenance ledger.
4. Binary artifacts by SHA-256.
5. DeepSeek durable session transcript.
6. Dashboard projection.
7. CapCut/Gemini/browser state is ephemeral execution state only.

## Creative surfaces

- **Chat** — command center and human creative conversation.
- **Gemini Pro** — Director, Critic/Red Team, Independent Verifier.
- **CapCut Pro** — primary finishing room.
- **Seedance** — optional clearly synthetic augmentation only.
- **Cloud Sandbox** — ffmpeg/ffprobe, hashes, contact sheets, QA, manifests, reproducible execution.
- **Chrome CDP** — authenticated browser bridge when source scope is explicitly authorized.

## Production principles

- Chat is the command center; the dashboard is observability, not a second chat.
- CapCut is a finishing room, not authoritative project state.
- No asset is production-eligible without explicit provenance.
- Original masters are preferred; proxies/transport derivatives are labeled explicitly.
- A technically valid render is not automatically publication-ready.
- Critic and verifier gates fail closed.
- Seedance 2.5 generation is credit-gated and synthetic-by-provenance; it may augment a story but never impersonate documentary source evidence.
- Verifier and release must refer to the same candidate hash.
- No synthetic media may be presented as documentary fact.
- Public-affairs/political content defaults to general-public documentary framing and does not use sensitive-trait voter microtargeting.

## Prompts

- [`prompts/MASTER_MEDIA_PRODUCTION.md`](prompts/MASTER_MEDIA_PRODUCTION.md) — master runtime prompt.
- [`prompts/examples/TORNEO_SAN_PEDRO.md`](prompts/examples/TORNEO_SAN_PEDRO.md) — concrete end-to-end test prompt.

## Status

Foundation in active development.

Current foundation includes:

- DeepSeek out-of-tree bundle layer;
- fail-closed media foundation plugin;
- Graph Harness integration design;
- Director Treatment protocol;
- treatment schema;
- production master prompt;
- concrete cinematic-video example prompt.

## License

MIT. DeepSeek Harness and Graph Harness SDLC remain separately licensed by their respective repositories.

## Executable graph service

The `media-graph` plugin exposes the pinned Graph Harness runtime as `ctx.mediaGraph`. It provides typed status, READY-node discovery, evidence/gate recording, validated transitions, optimistic concurrency, checkpoints, and localized repair while keeping Graph Harness outside this repository.

Configure the runtime checkout with `GRAPH_HARNESS_RUNTIME_ROOT`. See `docs/MEDIA_GRAPH_ADAPTER.md` and `examples/media-production.graph.json`.
