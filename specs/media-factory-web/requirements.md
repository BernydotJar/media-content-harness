# Media Factory Web — authorized completion scope

Authority: user supplied MEDIA FACTORY WEB master prompt and explicit 2026-09-12 instruction to implement, test, repair, document, commit and publish via authorized mechanisms. Execution graph, engineering reasoning artifacts, gated human evaluations. This extends completed media-factory-v1 at 67f011aa7ec9565c59942fb7c77fb256cab30c6d; it does not replace its ledger. Scope includes interchangeable provider strategy (AUTO/REAL_FOOTAGE/HYBRID/GENERATIVE, preferred provider AUTO) and Spanish Free Mode mixed batches including recurring mascot.

## Acceptance
- Next.js/React/TypeScript studio plus a single server-side product service reused by Guided, Free and API.
- Cookie sessions, server memberships and role checks, no client-declared identity or implicit tenant authority. Server-only bootstrap identity configuration; no default credentials.
- Durable repository with atomic writes and serialized mutations; explicit single-process MVP limit; no database required.
- Tenant profiles/source contracts/reference observations/Content DNA reuse current validators and schema; production sources never inferred from references. Source management must preserve isolated browser context.
- Draft plans and per-story strategies, visible human concept approval, immutable source/DNA snapshot idempotency, asynchronous jobs and actual pinned Graph integration.
- Paid/unconfigured providers fail closed. Available provider registry accurately distinguishes executable vs integration required. Deterministic test adapter only under explicit test configuration. No provider secret in product response.
- Spanish/English intent creates editable draft contracts without approval; unsupported/ambiguous intent requests clarification. Exact mixed batch request remains 4 stories, two REAL_FOOTAGE, one GENERATIVE/HYBRID, one mascot.
- Dashboard/workspaces/sources/DNA/weekly/free/jobs/review/releases with real loading/empty/denied/failure states, desktop/mobile accessibility and SSE product projection.
- Hash-bound review/changes/release and bounded localized graph repair; no social publication.
- Security, contracts, concurrency/idempotency, actual Graph integration, browser E2E, typecheck/build and dependency audit.
- Reuse existing shared Caddy and Cloudflare tunnel deployment only; release on verified immutable candidate. Record blockers for missing external credentials/provider source media/final human gate without inventing success.

## Delivery graph reconciliation
No equivalent Web nodes exist in v1. Six cohesive execution nodes cover the master prompt suggested WEB001–WEB017, avoiding artificial page-only deliveries:
1. WEB001-SERVICES: foundation, auth/tenant, contracts/API/services, providers (suggested 001/002/003/012).
2. WEB002-STUDIO: Next.js studio surfaces, Guided/Free draft/review screens (004–009/011/013 UI). Independent UI implementation against agreed API; release depends on integration.
3. WEB003-EXECUTION: actual asynchronous Graph jobs, product streaming, artifact evidence, human review/release (009–014 backend).
4. WEB004-VALIDATION: full integration, adversarial repairs, docs and independent browser verification (015).
5. WEB005-DEPLOYMENT: runtime image, health, shared route, HTTPS smoke (016).
6. WEB006-RELEASE: immutable independent verifier, release gate, persistent terminal checkpoint (017).

Every node requires Producer -> separate Critic -> Fixer as needed -> Independent Verifier -> Release Gate -> persisted evidence. Only actual runtime commands mutate the ledger. Root owns graph and documentation; producers never self-approve. Evidence includes actual files/hashes, candidate commit and executor identity.

## Verification commands
GRAPH_HARNESS_RUNTIME_ROOT=/home/agent/.cache/media-content-harness/graph-harness-sdlc pnpm check
pnpm typecheck
pnpm build
pnpm test:e2e
pnpm audit --prod
GRAPH_HARNESS_RUNTIME_ROOT=/home/agent/.cache/media-content-harness/graph-harness-sdlc node scripts/verify-web-evidence.mjs

## Human gates
The current request authorizes implementation and software deployment within established mechanisms. This is not approval of future story concepts, paid generations, real-media final release, or social publication. Such actions must remain explicit product gates. No fabricated human approvals.
