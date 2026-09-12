# Execution tasks and boundaries

MODE: SHIP; execution: graph; reasoning: engineering; governance: gated.
SOURCE OF TRUTH: graph/media-factory-web.project.json + append-only events, extending completed graph/media-factory-v1.*. Requirements and design in this directory. No status is inferred from chat or a rendered page.

FILES YOU MAY READ: current Media Content Harness and installed pinned Graph runtime; established shared deployment contracts and non-secret evidence.
FILES YOU MAY TOUCH: node allowed_paths with producer ownership below; shared deployment state only through productctl/reconciler and exact-SHA finalizer after release checks.
FILES YOU MUST NOT TOUCH: unrelated product repositories, old v1 ledger/history, browser credential stores, upstream Graph runtime source, unrelated deployment registry entries, existing critic private key contents.

- Services Producer: server/** except execution.mjs/worker*.mjs, tests/web-services*.test.mjs. Immutable domain snapshots, identity/membership, source/reference/DNA, provider registry, shared plans and bounded natural-language compiler, HTTP mapping.
- Studio Producer: app/**, components/**, package files, Next/TypeScript configuration, instrumentation. No service logic duplicated in UI.
- Execution Producer: server/execution.mjs, server/worker*.mjs, tests/web-execution*.test.mjs. Pinned runtime projection, actual event/evidence lifecycle, safe provider interface, durable async work and immutable review.
- Coordinator: specs, graph, progress, documentation, independent integration/E2E harness, deployment packaging when READY. Separate Critic and Independent Verifier results must exist before marking nodes done.

Verification sequence: unit/contracts and true Graph tests -> typecheck -> production build -> security regression and concurrency -> independent browser E2E -> exact commit -> critic and independent verification -> same-candidate signed deployment receipt -> established host reconciliation -> local/public health and product smoke -> persistent terminal checkpoint.

Stop: only COMPLETED after all evidence, PARTIAL_WITH_DOCUMENTED_BLOCKERS after all useful unlocked work, or SAFETY_STOP for concrete integrity/safety failure. Do not call unconfigured external providers available or test fixtures released production media. Record paid/source/creative/release human gates at the product boundary.
