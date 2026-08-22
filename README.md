# Media Content Harness

A plugin-first media production harness built on the architecture of DeepSeek Harness.

This repository turns an agent harness into a durable media-production operating system for cinematic social content: explicit source authorization, asset provenance, narrative planning, external editor orchestration, critic/fixer/verifier loops, compliance gates, release manifests, and dashboard-ready state.

The project treats [DeepSeek Harness](https://github.com/deepseek-ai/deepseek-harness) as an upstream runtime rather than copying its core. Media-specific behavior is implemented as out-of-tree plugins/bundles so upstream updates remain consumable.

## Status

Foundation in progress.

## Principles

- Chat is the command center.
- The production filesystem and ledger are the source of truth.
- CapCut is a finishing room, not project state.
- Model-visible creative decisions must be traceable.
- No asset is production-eligible without explicit provenance.
- Critic and verifier gates fail closed.
- A technically valid render is not automatically publication-ready.

## License

MIT. DeepSeek Harness remains separately licensed by its upstream authors under MIT.
