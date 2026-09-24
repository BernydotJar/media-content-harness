# Media Factory Web API and execution

## Product boundary

The Node service factory in `server/services.mjs` is the single product boundary for Web and future MCP callers. `server/http.mjs` exposes versioned HTTP projections. Tenant profiles, reference observations, Content DNA and weekly plans reuse the existing plugin validators and JSON schemas. An MCP transport is not implemented and must use these services if introduced.

`AtomicRepository` persists one private JSON product state through serialized transactions, fsync and atomic replacement. Binaries live in private tenant directories with server-calculated SHA-256. This deployment runs one Node process. It is not safe to scale JSON transactions across replicas; a future database-backed repository must supply equivalent transaction and concurrency semantics. Per-job filesystem leases additionally serialize worker operations and preserve crash recovery journals.

Users resolve from a private identity verifier file or the host's operator verifier. A session resolves the current identity and tenant memberships on every request. Roles: owner/admin/editor create content; owner/admin/reviewer approve; viewer reads. Creating a workspace grants ownership only of that workspace. All source access, jobs, SSE, evidence and artifact reads require membership. Google and enterprise identity providers remain future integrations.

## Transport contract

JSON responses use `{ "data": ... }`. Errors use `{ "error": { "code", "message", "request_id" } }`. Mutations require the exact configured Origin and JSON Content-Type except bounded raw-byte uploads. Session cookies are HttpOnly, SameSite Strict and Secure on HTTPS. Do not persist bearer tokens, browser cookies or DevTools URLs in product contracts.

| Route | Methods | Input / behavior |
| --- | --- | --- |
| `/api/v1/auth/login` | POST | `email` or `username`, `password`; sets session cookie |
| `/api/v1/auth/logout` | POST | `{}`; revokes server session |
| `/api/v1/me` | GET | Current actor and memberships |
| `/api/v1/providers` | GET | Declared capability and actual configured availability |
| `/api/v1/tenants` | GET, POST | List memberships; create friendly onboarding or validated `profile` |
| `/api/v1/tenants/:id` | GET | Authorized workspace projection |
| `/api/v1/tenants/:id/dashboard` | GET | Actual plans, job counts, releases, blockers and activity |
| `/api/v1/tenants/:id/sources` | GET, POST | Add exact explicitly authorized `source` or `reference` locator |
| `/api/v1/tenants/:id/sources/:sourceId/upload` | POST | Actual MP4/MOV/WebM bytes, maximum 40 MB |
| `/api/v1/tenants/:id/sources/:sourceId/evidence` | POST | Reference proof bytes, maximum 8 MB; returns server SHA |
| `/api/v1/tenants/:id/mascot` | POST | `source_id`; explicitly binds the character to authorized production material |
| `/api/v1/tenants/:id/content-dna` | GET | Current abstract narrative identity and revision |
| `/api/v1/tenants/:id/content-dna/analyze` | POST | Validated `observations` referencing uploaded proof hashes |
| `/api/v1/tenants/:id/free-draft` | POST | `text`, Monday `week_of`, optional `source_ids` |
| `/api/v1/tenants/:id/weekly-plans` | GET, POST | `week_of`, `mode`, structured `stories`; saves unapproved draft |
| `/api/v1/tenants/:id/weekly-plans/:plan/approve` | POST | Explicit `story_ids`; content remains unproduced |
| `/api/v1/tenants/:id/weekly-plans/:plan/launch` | POST | `{}`; idempotent jobs, 202 Accepted |
| `/api/v1/jobs` | GET | Optional authorized `tenant_id` filter |
| `/api/v1/jobs/:job` | GET | Product projection of actual graph, review and artifact state |
| `/api/v1/jobs/:job/start` | POST | `{}`; queue/recheck, 202 Accepted |
| `/api/v1/jobs/:job/approve` | POST | Current `candidate_sha` and `review_stage` |
| `/api/v1/jobs/:job/request-changes` | POST | Same review binding plus bounded `reason` |
| `/api/v1/jobs/:job/reject` | POST | Same review binding plus bounded `reason` |
| `/api/v1/jobs/:job/events` | GET | SSE `product-state` snapshots plus heartbeat; revalidates auth |
| `/api/v1/jobs/:job/evidence` | GET | Product evidence records |
| `/api/v1/jobs/:job/artifacts/:artifact` | GET | Authenticated bytes with verified artifact SHA |
| `/api/v1/releases` | GET | Optional authorized `tenant_id` filter |
| `/api/v1/releases/:release` | GET | Immutable release projection |
| `/health` | GET | Exact deployment identity; host edge requires operator authentication |
| `/api/v1/health` | GET | Service readiness, including actual pinned Graph runtime |

The existing host edge uses `/api/preview/login`, `/api/preview/logout`, an internal-only `/api/preview/session` forward-auth check and `/api/preview/workspace-status`. `host-preview.mjs` adapts this protocol to the same product authentication. It does not add another identity store or trust identity headers. External Caddy blocks direct session-probe access. Health uses the host's established authenticated monitoring contract.

## Plans and provider strategy

A story includes `id`, `title`, `objective`, `source_ids`, `story_devices`, `strategy`, `preferred_provider` and `mascot`. Strategies are `AUTO`, `REAL_FOOTAGE`, `HYBRID`, `GENERATIVE`; preferred provider is `AUTO` or a registered provider ID. Unknown fields are rejected. The plan key includes tenant, week, normalized story definitions, authorization snapshot and Content DNA revision. Launch is idempotent per approved plan/story.

Free Mode currently uses a bounded deterministic Spanish/English interpreter, not an undisclosed language-model service. It creates editable concepts and asks for clarification when it cannot safely map a request. It does not execute arbitrary chat commands. Guided and Free drafts converge on identical plan validation and approval methods. Content DNA is derived from explicit, evidence-backed human observations; automatic browser observation or multimodal analysis is not configured.

Provider adapters implement `capabilities`, `estimate`, `prepare`, `generate`, `poll`, `collect`, `provenance`. FFmpeg executes authorized uploaded-video editing and technical inspection; when it composites the approved Caballito PNG, provenance identifies the result as `STICKER_OVERLAY`, not generated embodiment. Higgsfield currently executes text-to-video only and rejects jobs that require character-reference upload. Gemini/Veo 3.1 Fast executes reference-video jobs when its encrypted server-side credential is configured: the exact approved reference bytes are sent inline, the request is bound to an eight-second `9:16` or `16:9` contract, and the collected MP4 records `REFERENCE_VIDEO`, model, prompt SHA and reference SHA. Credit-bearing adapters still require documented estimate, exact spend approval, durable submission reconciliation and the configured weekly-usage gate before submission. Declaring a provider in the registry alone never makes it executable, and unsupported capability combinations fail visibly rather than falling back to another mode.

The deterministic provider is restricted to deployment class `test` and `/tmp` storage. Its low-resolution synthetic fixture is always marked test, including release and browser previews. It is used to exercise orchestration without credits; it is not production media.

## Graph and release invariants

The worker calls the external Graph runtime pinned in `config/upstreams.json`. Stages are BRIEF, SOURCE, INGEST, DIRECTOR_TREATMENT, CONCEPT_REVIEW when applicable, CREATIVE_GATE, PROVIDER_PRODUCTION, TECHNICAL_QA, CRITIC, FIXER, INDEPENDENT_VERIFIER, COMPLIANCE and RELEASE. Web events project these states without exposing raw ledgers or runtime paths.

Approvals bind the current candidate and review stage. Production Critic and Independent Verifier require separate authenticated actors, distinct from the producer and each other. Final release is another explicit decision. Source hashes, authorization and DNA are checked again before release. Released artifacts keep their hash, version, provenance and approval; no social publication is performed.

A repair reopens only the affected graph descendants. The implemented bounded FFmpeg repair command is `duration: N`, within the approved duration range; it reopens creative treatment review. Other feedback is retained as `MANUAL_REPAIR_REQUIRED` and is not silently reported as applied. A new repair revision invalidates prior approval bindings even when produced bytes are identical.

## Recovery and observability

The singleton starts recovery on Node startup. Durable approval/repair journals and exclusive job leases let recovery reconcile the existing graph before resuming. Never remove a job ledger or edit it to force success. Resolve source availability, missing provider capability or reviewer authorization and retry through the product action. Unknown paid submissions must be reconciled with the provider before retry support is added.

Product activity carries tenant/job/stage/event/timestamps. Internal request failures log request ID, error class and safe code, excluding raw input, passwords, cookies and stack paths. Evidence and artifact hashes remain available through tenant-authorized projections. Workflow counts use operational production events; no persuasion scores, voter profiles or sensitive audience analytics are collected.

## Current media and immutable release provenance

A job projects `provider_execution` only for its current produced candidate. It contains the executed provider, completion status, artifact SHA-256, explicit test/synthetic flags, zero-credit estimate and allowlisted consumed source IDs/hashes. Private adapter paths and credential metadata are never projected. `source_assets` exposes authorized media metadata and hashes; it does not mean every authorized asset was used by a synthetic test fixture.

Critic, independent verification and release bind the same current artifact and provider-execution digest. The worker revalidates that digest both before human approval and in the final repository transaction. A changed provenance record produces `PROVENANCE_CHANGED`; an existing approval cannot silently authorize it. Repair clears the current artifact/provenance display and requests a fresh candidate. Previous release records retain their own artifact, provider, source and review snapshots.

Release responses include `version`, `aspect_ratio`, `candidate_sha`, `artifact_sha256`, `provider_execution`, `source_assets`, `reviews`, final `approval`, downloadable artifact URLs and `publication_state`. The library displays those snapshots. `READY_FOR_MANUAL_PUBLISH` means approved for manual handoff; it does not mean a social account has published the file.

## Authorized media byte ranges

`GET /api/v1/jobs/:jobId/artifacts/:artifactId` supports one HTTP byte range after current authentication, tenant authorization and complete artifact-integrity validation. Closed, open-ended and suffix ranges return 206 with exact `Content-Range`, `Content-Length` and strong SHA-derived ETag. Invalid or unsatisfiable byte ranges return 416. A matching strong `If-Range` permits a partial response; other validators, unknown units and valid multiple ranges return the full representation. Every response remains private/no-store. Range metadata never bypasses membership or file-integrity checks.
