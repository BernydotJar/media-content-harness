# Media Graph Adapter

`plugins/media-graph.mjs` exposes the tested `Graph-harness-sdlc` runtime to DeepSeek/Cordis as `ctx.mediaGraph`.

Graph Harness stays upstream. Media Content Harness owns the media-domain project graph, evidence kinds, and orchestration policy. The tested revisions live in `config/upstreams.json`.

## Runtime contract

Set `GRAPH_HARNESS_RUNTIME_ROOT` to the checked-out Graph Harness repository. The adapter verifies `git rev-parse HEAD` against the pinned revision before every command and fails closed on drift.

The service exposes:

```text
ctx.mediaGraph.validate()
ctx.mediaGraph.status()
ctx.mediaGraph.readyNodes()
ctx.mediaGraph.recordApproval()
ctx.mediaGraph.recordEvidence()
ctx.mediaGraph.evaluateGate()
ctx.mediaGraph.transition()
ctx.mediaGraph.failAndRepair()
ctx.mediaGraph.checkpoint()
```

## Integrity controls

- Commands use `execFile()` argv arrays, not a shell.
- `projectPath` and `eventsPath` are confined below `projectRoot`.
- Evidence writes require an explicit SHA-256.
- `expectedLastEventId` is passed through for optimistic concurrency.
- The upstream runtime retains append-only event sequencing, hash-chain validation, revision-scoped evidence, gates, checkpoints, and localized repair.

## Media graph

`examples/media-production.graph.json` encodes:

```text
BRIEF
-> SOURCE
-> INGEST
-> DIRECTOR_TREATMENT
-> CREATIVE_GATE
-> SEEDANCE_DECISION
-> PRODUCER_CAPCUT
-> TECHNICAL_QA
-> CRITIC
-> FIXER
-> INDEPENDENT_VERIFIER
-> COMPLIANCE
-> RELEASE
```

`CREATIVE_GATE` is intentionally `spec_ready`: current-revision creative evidence and explicit human approval are required before production can continue.

A `critic_report` gate means a valid adversarial report exists. It does not lie by treating every report as a creative PASS. The media controller uses the report verdict to decide whether FIXER is a no-op or a real repair.
