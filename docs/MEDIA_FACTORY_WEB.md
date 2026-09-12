# Media Factory Web

The Web extension uses the existing Media Content Harness contracts and pinned Graph Harness runtime. `specs/media-factory-web/MASTER_PRODUCT_PROMPT.md` preserves the requested product scope. Acceptance and execution state are recorded in `graph/media-factory-web.*`, with actual evidence in `progress/media-factory-web/`.

## Local development

Requirements: Node matching package.json, pnpm 11.7.0, Python 3.11+, and the separate Graph Harness checkout at the revision in config/upstreams.json. Install using `pnpm install --frozen-lockfile`. Set `GRAPH_HARNESS_RUNTIME_ROOT` to the actual pinned checkout; do not disable pin validation or copy/modify the runtime source.

Configure durable private storage with `MEDIA_FACTORY_DATA_ROOT`. Configure identities through `MEDIA_FACTORY_IDENTITY_FILE`. Provision a local operator with:

```sh
python3 scripts/provision-operator.py --identity-file .media-factory/identities.json --id local-operator --email operator@example.org --name 'Local operator' --can-create-tenants
```

The operator types their password directly into the hidden terminal prompt. Never put it in shell arguments, repository files, browser storage, screenshots or chat. The resulting verifier file must stay private and outside tracked source. Tenant memberships are explicit; creating one tenant does not grant access to any other tenant.

`pnpm dev` serves the studio. For a production build use `pnpm build` then `pnpm start`. Runtime `/health` requires a real `MEDIA_FACTORY_RELEASE_SHA` and deployment class; a missing release identity produces unavailable rather than a false successful release report.

## One execution boundary

Guided and Free Mode both prepare draft story contracts. The server resolves membership, selected tenant sources and Content DNA. Approval is an explicit actor action. Jobs are submitted asynchronously and the browser observes product events over SSE. Raw Graph ledgers, filesystem paths and credentials are not browser protocols.

A preferred provider is a constraint handled by the server, separate from the generic AUTO, REAL_FOOTAGE, HYBRID and GENERATIVE strategy. An unconfigured provider is unavailable. Availability does not mean that every requested capability is supported or that generation is approved. Cost-bearing actions require the configured approval and cost estimate; no undocumented pricing is assumed.

Reference observations describe permitted abstractions. Reference media never automatically becomes production footage. Content DNA revision and production authorization snapshots participate in idempotency and review integrity. Tests use only isolated fixtures; fixtures are not production releases.

## Authentication deployment

The established host reconciler supports a form-session operator verifier without exposing the password. The deployment adapter maps its host-owned preview verifier and username into the server's neutral operator configuration. External Google/enterprise identity is an extension point; it is not claimed as implemented. The MVP deploys one service process with durable storage. Multi-process/distributed storage requires a repository implementation with a shared transactional lock before scaling.

## Verification and evidence

```sh
GRAPH_HARNESS_RUNTIME_ROOT=/path/to/pinned/graph-harness-sdlc pnpm check
pnpm typecheck
pnpm build
GRAPH_HARNESS_RUNTIME_ROOT=/path/to/pinned/graph-harness-sdlc pnpm test:e2e
pnpm audit --prod
GRAPH_HARNESS_RUNTIME_ROOT=/path/to/pinned/graph-harness-sdlc node scripts/verify-web-evidence.mjs
```

Browser tests start an isolated production Next server with temporary identities/storage and the system Chromium binary. Secrets never enter reports. `scripts/verify-web-evidence.mjs` independently checks the actual evidence file hashes and commit references in addition to the runtime's event-chain validation. Use `--require-done` only for a claim that every graph node is complete.

## Deployment and recovery

Reuse the existing productctl/host reconciler, Caddy edge and Cloudflare named tunnel. See `MEDIA_FACTORY_DEPLOYMENT_RECOVERY.md` for the live recovered mechanism. A release requires exact-SHA tests, independent critic review, the existing signed receipt, immutable release archive, host reconciliation and public HTTPS verification. A successful build alone is not a deployment.

Do not erase the durable job store to recover a failed provider. Preserve its request ID, source snapshot, graph ledger and evidence. Resume only the affected Graph subgraph after resolving the documented failure; never mark an unknown paid submission failed-and-retry without reconciling its actual provider state. Approvals and independent verification refer to the immutable candidate; modifying bytes requires a new verification and approval cycle.

This document describes the intended operating contract. Consult the latest persisted release report for verified coverage and remaining blockers; it is not itself evidence of completion.
