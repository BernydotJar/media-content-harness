# Architecture

Media Content Harness is an out-of-tree production layer for DeepSeek Harness.

It follows the upstream principle that everything is a plugin. The media system does not patch the DeepSeek agent loop. It composes media-specific services, policies, tools, and projections around documented extension points.

## Runtime map

```text
User / Chat
    |
    v
DeepSeek Harness session
    |
    +--> Media production policy
    +--> Media project state
    +--> Asset/provenance ledger
    +--> Graph lifecycle controller
    +--> External creative gateways
    |      +--> Google Photos via authenticated browser bridge
    |      +--> Gemini Pro Director/Critic/Verifier
    |      +--> CapCut Pro finishing
    |      +--> Seedance 2.5 for governed synthetic generation
    |
    +--> Sandbox execution
    |      +--> ffmpeg / ffprobe
    |      +--> deterministic QA
    |      +--> hashes / manifests
    |
    +--> Release gate
           +--> READY_TO_PUBLISH
           +--> PARTIAL_WITH_DOCUMENTED_BLOCKERS
           +--> SAFETY_STOP
```

## Sources of truth

1. Durable harness/session events describe decisions and lifecycle changes.
2. The media project manifest describes current project state.
3. The global asset ledger describes provenance and asset reuse/history.
4. Binary artifacts are addressed by SHA-256.

CapCut projects, browser tabs, and model conversations are execution surfaces, not authoritative project state.

## Core domains

### Source authorization

A source is production-eligible only when its authorization is explicit. Authentication access alone does not imply authorization.

### Asset provenance

Every material source asset receives a stable media key, SHA-256 when bytes are available, source locator, authorization evidence, narrative role, and lifecycle status.

### Production graph

Default lifecycle:

```text
SOURCE
-> INGEST
-> DIRECTOR
-> PRODUCER
-> CRITIC
-> FIXER
-> VERIFIER
-> RELEASE
```

A node may be skipped only through an explicit recorded decision. Failed creative or technical gates never silently become PASS.

### External creative gateways

Gemini, CapCut, and Seedance are adapters. Seedance 2.5 is modeled as a separate capability behind a human credit-spend gate and synthetic-provenance contract; it is not allowed to silently replace documentary source evidence. See `SEEDANCE_2_5_CAPABILITY.md`.

Gemini and CapCut are adapters. A provider can be replaced without changing the project model.

Gateway calls persist request metadata, selected model/mode, result state, and evidence references. Credentials and signed URLs are never persisted in project state.

### Release

Release is fail-closed. A project enters `READY_TO_PUBLISH` only when required gates pass and the promoted artifact hash is known.

## Dashboard

The dashboard is a projection of durable project state. It is intentionally not a second editor and not a second source of truth.

Recommended views:

- pipeline overview;
- next-to-publish;
- project detail and preview;
- asset ledger;
- compliance;
- critic/verifier evidence;
- release artifacts;
- content calendar.

## Upstream strategy

DeepSeek Harness is currently developer-preview software. This project therefore keeps upstream as an external runtime and pins tested revisions for production profiles. Media-specific packages remain in this repository so upstream can be upgraded independently.
