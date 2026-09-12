# MEDIA FACTORY WEB — MASTER PRODUCT COMPLETION PROMPT

You are the senior product architect, staff engineer, AI systems engineer, UX lead, infrastructure engineer, and release owner responsible for evolving the existing **Media Content Harness / Media Factory v1** into a complete, reusable, multi-tenant **Media Factory Web** product.

This is not a greenfield project.

You MUST recover, inspect, validate, and reuse the existing product, Graph Harness state, Media Harness contracts, schemas, tests, evidence, infrastructure, adapters, deployment conventions, and browser bridge before making architectural decisions.

Do not rewrite working components without a demonstrated reason.

---

# 1. PRIMARY PRODUCT VISION

Build a professional Web-based **AI Media Factory** that lets an organization continuously produce high-quality short-form videos from authorized assets, references, brand identity, creative patterns, and AI generation tools.

The system must support two primary user experiences:

## A. Guided Mode

A structured step-by-step workflow for users who want assistance through the entire production process.

Example:

```text
Select Workspace
↓
Select Week / Campaign / Production Batch
↓
Choose Authorized Sources
↓
Choose Reference Material
↓
Analyze Content DNA
↓
Generate Story Concepts
↓
Human Selects / Approves
↓
Director Treatment
↓
Choose Production Strategy
↓
Produce
↓
Critic
↓
Fixer
↓
Independent Verifier
↓
Preview
↓
Approve Release
```

The user should always know:

* what stage the production is in;
* what the system is doing;
* what evidence exists;
* what requires human approval;
* what provider/model is being used;
* what assets are source material;
* what assets are synthetic;
* what remains before release.

---

## B. Free Mode

A conversational creative workspace for experienced users.

The user should be able to type instructions such as:

> Create three cinematic vertical videos for this week using the authorized San Pedro album. Keep the tone warm, documentary, activity-first. Use the Content DNA but do not copy reference videos directly.

Or:

> Make this concept more cinematic. Keep the first two seconds visually strong, use ambient audio, and try a clearly stylized generated transition if needed.

Or:

> Produce the weekly batch for this tenant.

Free Mode must convert natural-language intent into the same structured Media Factory contracts used by Guided Mode.

Free Mode is NOT a separate execution engine.

Both modes MUST converge into:

```text
User Intent
↓
Validated Product Contracts
↓
Media Factory Services
↓
Graph Harness
↓
Production Adapters
↓
Evidence
↓
Release
```

There must be only one backend truth.

---

# 2. EXISTING PRODUCT AUTHORITY

Recover the current repository and persistent program state first.

Current repository:

```text
media-content-harness
```

Current Media Factory v1 capabilities already include:

* Graph Harness integration;
* real pinned Graph runtime;
* tenant media profiles;
* isolated tenant namespaces;
* authorized source contracts;
* read-only browser-reference policy;
* Chrome bridge support as an external authenticated surface;
* structured reference observations;
* Content DNA;
* copy-prevention policy;
* weekly production plans;
* human approval gates;
* production/reference source separation;
* Seedance synthetic-media policy;
* Director Treatment protocol;
* existing per-video Media Graph;
* Critic / Fixer / Independent Verifier lifecycle;
* release evidence and provenance.

Do not duplicate these capabilities.

Extend them.

---

# 3. GRAPH ENGINEERING IS BINDING

Use the installed Graph Engineer.

Execution:

```yaml
execution:
  mode: graph

reasoning:
  mode: engineering

governance:
  human_eval_frequency: gated
```

Recover and validate:

* execution graph;
* persistent event ledger;
* checkpoints;
* specifications;
* repository state;
* tests;
* evidence;
* open work;
* READY nodes;
* release candidate history.

Then execute continuously:

```text
Producer
→ Critic / Red Team
→ Fixer
→ Independent Verifier
→ Release Gate
→ Persistent Evidence
→ Next READY Node
```

This is a product-completion session.

Do NOT stop after:

* architecture;
* scaffolding;
* one page;
* one endpoint;
* one feature;
* one commit;
* one PR;
* one test;
* one milestone.

Continue until:

```text
COMPLETED
PARTIAL_WITH_DOCUMENTED_BLOCKERS
SAFETY_STOP
```

Prefer finishing existing work over opening unnecessary new work.

---

# 4. TARGET ARCHITECTURE

Build this architecture:

```text
┌──────────────────────────────────────────────┐
│              MEDIA FACTORY WEB               │
│                                              │
│ Guided Mode                                  │
│ Free Mode                                    │
│ Dashboard                                    │
│ Sources                                      │
│ Content DNA                                  │
│ Weekly Plans                                 │
│ Production Jobs                              │
│ Review / Approval                            │
│ Releases                                     │
│ Evidence                                     │
└──────────────────────┬───────────────────────┘
                       │ HTTPS
                       ▼
┌──────────────────────────────────────────────┐
│            MEDIA FACTORY API                 │
│                                              │
│ Authentication                               │
│ Tenant Context                               │
│ Authorization                                │
│ Input Validation                             │
│ Product API                                  │
│ Event Streaming                              │
│ Job Management                               │
└──────────────────────┬───────────────────────┘
                       │
        ┌──────────────┴───────────────┐
        ▼                              ▼
┌───────────────────┐        ┌──────────────────────┐
│ Media Factory     │        │ Graph Harness        │
│ Services          │        │                      │
│                   │        │ BRIEF                │
│ Tenants           │        │ SOURCE               │
│ Sources           │        │ INGEST               │
│ Content DNA       │        │ DIRECTOR_TREATMENT   │
│ Weekly Plans      │        │ CREATIVE_GATE        │
│ Jobs              │        │ PRODUCER             │
│ Releases          │        │ TECHNICAL_QA         │
└─────────┬─────────┘        │ CRITIC               │
          │                  │ FIXER                │
          │                  │ VERIFIER             │
          │                  │ COMPLIANCE           │
          │                  │ RELEASE              │
          │                  └──────────────────────┘
          ▼
┌──────────────────────────────────────────────┐
│            PRODUCTION ADAPTERS               │
│                                              │
│ CapCut                                       │
│ Gemini                                       │
│ Seedance                                     │
│ Higgsfield                                   │
│ ffmpeg / ffprobe                             │
│ Chrome Bridge                                │
│ Future Providers                             │
└──────────────────────────────────────────────┘
```

The Web application must NEVER talk directly to:

* Chrome CDP;
* CapCut;
* Seedance;
* Higgsfield;
* Graph Harness runtime;
* credentials;
* filesystem internals.

All access goes through server-side services and authorization boundaries.

---

# 5. FRONTEND

Preferred stack:

```text
Next.js
React
TypeScript
```

Reuse existing ecosystem unless repository evidence strongly justifies another choice.

The frontend must feel like a professional creative operations product, not an admin CRUD dashboard.

## Required application areas

### `/login`

Simple, premium authentication entry.

Architecture must support eventual:

* Google login;
* enterprise identity;
* tenant memberships.

Do not overbuild identity in MVP.

---

### `/dashboard`

Show:

* active workspace;
* current weekly batch;
* videos planned;
* videos producing;
* videos awaiting review;
* releases;
* blockers;
* recent activity.

Example:

```text
MEDIA FACTORY

FIRMES Antigua ▼

This Week
──────────────────────────────
5 planned
2 producing
2 awaiting review
1 released

[ Create Weekly Production ]

ACTIVE PRODUCTIONS

Torneo San Pedro
● CRITIC

San Felipe Community
● PRODUCER

Community Saturday
○ BRIEF
```

---

### `/workspaces`

Manage tenants/workspaces.

Each tenant includes:

* organization;
* territory;
* brand;
* authorized sources;
* browser context reference;
* Content DNA;
* production defaults;
* generated assets;
* releases.

Tenant credentials MUST NOT be stored in browser-visible state.

---

### `/workspace/:tenantId/sources`

Show:

* Production Sources;
* Reference Sources;
* status;
* authorization type;
* provenance;
* last inspection;
* hash/evidence where applicable.

Clearly distinguish:

```text
REFERENCE
```

from:

```text
PRODUCTION SOURCE
```

A reference must never automatically become production media.

---

### `/workspace/:tenantId/content-dna`

Visual representation of reusable creative language.

Example:

```text
Content DNA

Story Devices
─────────────
Activity-first Story
Place as Character
Human-scale Intimacy
Recurring Character Bridge
Participatory Brand Reveal

Visual Language
───────────────
Warm
Documentary
Natural movement
Low textual density

Avoid
───────────────
Generic templates
Shot-for-shot copying
Artificial political hero framing
Overproduced synthetic look
```

Content DNA MUST represent abstract creative language, not copied captions, scripts, frames, or audio.

---

### `/workspace/:tenantId/weekly`

Guided weekly production wizard.

Steps:

```text
1 Sources
2 References
3 Story Ideas
4 Select Concepts
5 Creative Direction
6 Production Strategy
7 Review Plan
8 Launch
```

At Story Ideas:

AI may propose multiple concepts.

Human explicitly approves the concepts entering production.

---

### `/jobs/:jobId`

This is one of the most important screens.

Display the Graph lifecycle visually:

```text
✓ BRIEF
✓ SOURCE
✓ INGEST
✓ DIRECTOR TREATMENT
✓ CREATIVE GATE
● PRODUCER
○ TECHNICAL QA
○ CRITIC
○ FIXER
○ INDEPENDENT VERIFIER
○ COMPLIANCE
○ RELEASE
```

Show:

* current node;
* elapsed state;
* evidence;
* provider/model used;
* artifacts;
* source assets;
* generated assets;
* Critic findings;
* Fixer actions;
* verifier result;
* release candidate hash.

Do not expose raw Graph Harness internals unnecessarily.

Translate graph state into understandable product language.

---

### `/jobs/:jobId/review`

Human review surface.

Must support:

```text
Preview
Approve
Request Changes
Reject
```

Optional feedback:

```text
Opening is too slow.
Use more ambient sound.
Logo is too visible.
Shot 3 does not fit the story.
```

Feedback should generate a bounded repair cycle.

Do NOT restart unaffected graph nodes.

---

### `/releases`

List released artifacts with:

* tenant;
* title;
* date;
* version;
* aspect ratio;
* SHA;
* provenance;
* approval;
* downloadable master;
* publication state.

---

# 6. FREE MODE UX

Provide a conversational creative workspace.

Example UI:

```text
┌─────────────────────────────────────────┐
│ What do you want to create?             │
│                                         │
│ "Create this week's community videos…"  │
└─────────────────────────────────────────┘
```

Free Mode must:

1. interpret intent;
2. determine tenant;
3. determine allowed sources;
4. retrieve Content DNA;
5. construct a draft production plan;
6. display proposed actions;
7. request required human gates;
8. submit structured jobs into Graph Harness.

Do NOT allow chat text to bypass:

* authorization;
* source provenance;
* human approval;
* tenant isolation;
* synthetic-media policy;
* Graph lifecycle.

Free Mode may be flexible in expression.

Execution remains deterministic and governed.

---

# 7. BACKEND API

Implement a versioned product API.

Suggested surface:

```text
GET    /api/v1/me

GET    /api/v1/tenants
POST   /api/v1/tenants
GET    /api/v1/tenants/:tenantId

GET    /api/v1/tenants/:tenantId/sources
POST   /api/v1/tenants/:tenantId/sources

GET    /api/v1/tenants/:tenantId/content-dna
POST   /api/v1/tenants/:tenantId/content-dna/analyze

GET    /api/v1/tenants/:tenantId/weekly-plans
POST   /api/v1/tenants/:tenantId/weekly-plans

GET    /api/v1/jobs
GET    /api/v1/jobs/:jobId
POST   /api/v1/jobs/:jobId/approve
POST   /api/v1/jobs/:jobId/request-changes
POST   /api/v1/jobs/:jobId/start

GET    /api/v1/jobs/:jobId/events
GET    /api/v1/jobs/:jobId/evidence

GET    /api/v1/releases
GET    /api/v1/releases/:releaseId
```

Use HTTP semantics properly.

Long-running production MUST use asynchronous jobs.

Example:

```http
POST /api/v1/jobs
```

returns:

```http
202 Accepted
```

with:

```json
{
  "jobId": "mf_...",
  "status": "BRIEF"
}
```

Never hold a browser HTTP request open for the full production lifecycle.

---

# 8. LIVE STATUS

Implement server-sent events or equivalent server-side event streaming.

Preferred MVP:

```text
SSE
```

because production events are primarily server → client.

Example:

```text
BRIEF_COMPLETED
SOURCE_VALIDATED
DIRECTOR_TREATMENT_READY
PRODUCER_STARTED
PRODUCER_COMPLETED
CRITIC_FAILED
FIXER_STARTED
VERIFIER_PASS
RELEASE_READY
```

The UI should update without polling every few seconds.

Do not expose raw event-ledger internals as the public protocol.

Create a Product Event projection.

---

# 9. DOMAIN MODEL

At minimum support:

```text
User
Tenant
Membership
BrandProfile
SourceAuthorization
ReferenceObservation
ContentDNA
WeeklyProductionPlan
ProductionJob
GraphExecution
Artifact
Evidence
HumanApproval
Release
ProviderExecution
```

Do not prematurely introduce dozens of database tables.

Model contracts first.

Persistence implementation comes second.

---

# 10. PERSISTENCE

Design repository/services so they can initially work with current Media Factory artifacts and later move to managed persistence.

Recommended evolution:

```text
MVP
filesystem / existing durable stores
        ↓
PostgreSQL
        ↓
object storage for binaries
```

Do not make the first Web MVP dependent on unnecessary infrastructure.

Use interfaces such as:

```text
TenantRepository
JobRepository
ArtifactRepository
ReleaseRepository
```

so storage is replaceable.

---

# 11. PROVIDER / MODEL ADAPTER SYSTEM

Provider choice must be modular.

Define a contract conceptually similar to:

```ts
interface VideoGenerationAdapter {
  capabilities()
  estimate()
  prepare()
  generate()
  poll()
  collect()
  provenance()
}
```

Potential adapters:

```text
Seedance
Higgsfield
CapCut
Gemini
Future Provider
```

Do not hard-wire business logic to one provider.

A production strategy might be:

```text
Documentary source footage
+
CapCut finishing
+
Seedance transition
```

or:

```text
Reference image
+
Higgsfield stylized insert
+
ffmpeg finishing
```

or:

```text
100% authorized real footage
+
no synthetic generation
```

The Director/Planner should choose a strategy based on:

* available source material;
* creative objective;
* cost;
* duration;
* capabilities;
* provenance requirements;
* tenant policy;
* human approval.

---

# 12. GENERATIVE MEDIA SAFETY AND PROVENANCE

Synthetic media must be explicit in internal provenance.

Maintain current policy:

* do not fabricate documentary events;
* do not synthesize real people as factual evidence;
* generated material cannot silently become source evidence;
* generated artifacts receive provenance records;
* reference-guided generation must remain distinguishable internally;
* credit-spending providers require the configured human gate.

The final artistic result can be polished and natural.

Internal provenance must remain precise.

---

# 13. POLITICAL / PUBLIC-AFFAIRS TENANTS

The product is general-purpose and may support public-affairs/community organizations.

For those tenants:

* general-audience communication only;
* no sensitive-trait targeting;
* no political microtargeting;
* no voter profiling;
* no optimization for manipulating specific voter segments.

Community documentation, public activities, culture, transparency, authorized organizational media, brand consistency, accessibility, and general-audience storytelling are valid use cases.

Enforce this at tenant policy and planning boundaries.

---

# 14. CHROME BRIDGE

Reuse the existing Chrome bridge design.

Chrome/CDP remains an external authenticated execution surface.

Rules:

```text
CDP != public API
```

Never expose port 9222 to the Internet.

Never proxy raw CDP through the public Web application.

Browser integration must remain:

* explicitly authorized;
* tenant-scoped;
* read-only unless a future separately authorized workflow requires mutation;
* credential-free in persisted Media Factory contracts.

Do not store:

* cookies;
* tokens;
* session secrets;
* raw DevTools WebSocket URLs;
* unrelated tab data.

---

# 15. GUIDED PRODUCTION STRATEGY SELECTION

In Guided Mode allow the user to choose:

```text
AUTO
REAL FOOTAGE
HYBRID
GENERATIVE
```

Meaning:

## AUTO

Director selects best production strategy.

## REAL FOOTAGE

Use only authorized real source assets plus editing/graphics/audio.

## HYBRID

Authorized source footage plus clearly governed synthetic augmentation.

## GENERATIVE

Primarily generated material where appropriate and authorized.

Provider selection remains server-side.

---

# 16. COST / PROVIDER VISIBILITY

Do not hide paid generation.

Before a credit-bearing action show:

```text
Provider: Seedance
Estimated generations: 2
Expected duration: 8 sec each
Human approval required
```

Or equivalent for another provider.

Architecture should support future:

```text
cost estimate
actual cost
credits consumed
provider job ID
generation duration
```

Do not hard-code undocumented provider pricing.

---

# 17. INFRASTRUCTURE

Reuse the user's established local-cloud infrastructure.

Current preferred architecture:

```text
macOS
↓
Docker
↓
shared Caddy
↓
Cloudflare Tunnel
↓
HTTPS
```

Do NOT create:

* a new VPS;
* a new Cloudflare tunnel;
* Kubernetes;
* an unnecessary new infrastructure stack.

Reuse shared infrastructure.

Follow the existing deployment contract:

```text
ONBOARD AND DEPLOY <PRODUCT>
```

Detect:

* stack;
* health endpoint;
* tests;
* runtime;
* port;
* Docker requirements;
* shared routing.

Default hostname can be:

```text
media-factory.textilesdemedellin.com
```

unless existing deployment registry evidence indicates another canonical hostname.

Use the existing named Cloudflare tunnel.

No new tunnel.

No public CDP endpoint.

---

# 18. CONTAINERS

Prefer existing Cloud Sandbox and shared runtime.

Only create a new runtime container if required by the application boundary.

Do NOT create containers simply because a new module exists.

A likely deployment shape is:

```text
media-factory-web
```

containing Web/API runtime,

while Graph/shared infrastructure remains reusable.

Do not duplicate:

* Graph Harness;
* Caddy;
* tunnel;
* shared deployment tools.

---

# 19. AUTHENTICATION / AUTHORIZATION

MVP should support:

```text
User
→ Membership
→ Tenant
```

Every server-side request must resolve tenant context.

Never trust tenant ID supplied by client without authorization verification.

Conceptually:

```text
request
↓
session
↓
membership
↓
tenant authorization
↓
service call
```

No cross-tenant reads.

No cross-tenant writes.

No shared browser-context references.

---

# 20. UI DESIGN

The visual language should feel like a premium creative/AI production studio.

Not:

* enterprise legacy dashboard;
* bootstrap admin;
* developer console;
* generic Tailwind template.

Desired qualities:

* cinematic;
* modern;
* restrained;
* visual;
* high information density when appropriate;
* clear progress states;
* beautiful artifact previews;
* minimal friction.

Prioritize:

```text
creation
progress
review
evidence
```

over configuration.

---

# 21. EMPTY / FAILURE STATES

Every major screen needs:

* loading;
* empty;
* unavailable;
* permission denied;
* validation error;
* provider failure;
* partial production;
* Graph repair required.

Do not fake data.

Fail closed.

Example:

```text
Production source temporarily unavailable.

No production was generated from unverified material.
```

---

# 22. OBSERVABILITY

Track:

```text
request_id
tenant_id
job_id
graph_node
provider
provider_job_id
artifact_hash
release_hash
error_class
duration
```

Do not log secrets or browser credentials.

Product UI should have human-readable activity logs.

Infrastructure logs remain separate.

---

# 23. ANALYTICS

Product analytics should measure workflow effectiveness, not political persuasion.

Examples:

```text
weekly batches created
video jobs created
production completion rate
median production time
human intervention count
critic repair count
provider failure rate
release rate
average revisions per video
average cost per completed artifact
```

For media performance where authorized:

```text
views
completion
shares
saves
comments
```

Do not build voter-persuasion scoring or sensitive audience profiling.

---

# 24. TESTING

Add deterministic tests for:

## Frontend

* critical page rendering;
* mode switching;
* tenant switching;
* authorization failures;
* loading/empty/error states;
* job progression projection.

## Backend

* tenant isolation;
* invalid source access;
* source/reference separation;
* Free Mode cannot bypass contracts;
* human approval;
* Graph transitions;
* job idempotency;
* provider errors;
* release candidate integrity.

## Security

Test:

* cross-tenant access;
* arbitrary path traversal;
* malicious provider inputs;
* secret leakage;
* raw browser credential persistence;
* unauthorized Graph transitions;
* direct adapter access;
* API input validation.

## E2E

At minimum execute:

```text
login
↓
select tenant
↓
create weekly plan
↓
select production source
↓
approve concept
↓
create production job
↓
Graph begins at BRIEF
↓
observe state
↓
human review
↓
release candidate
```

Use deterministic/mock provider adapters where generation would otherwise consume paid credits.

---

# 25. HUMAN EVALS

Human gates remain required for:

* approved story selection;
* paid generation where configured;
* major Director Treatment approval where required;
* final release.

Do not request human approval for trivial internal transitions unnecessarily.

---

# 26. IDEMPOTENCY

Creating a plan/job must be idempotent.

Use:

```text
tenant
+
week
+
approved story definition
+
source authorization snapshot
+
Content DNA revision
```

to prevent accidental duplicate production.

Do not silently generate the same paid job twice.

---

# 27. RELEASE MODEL

Verifier and Release Gate must reference the same immutable candidate.

Never:

```text
verify SHA A
modify
release SHA B
```

without re-verification.

Persist:

```text
candidate_sha
artifact hashes
evidence IDs
approvals
provider provenance
release state
```

---

# 28. MCP / AGENT ACCESS

The Web/API must not eliminate agentic access.

Design Media Factory so the same backend can later expose MCP tools such as:

```text
media_factory.list_tenants
media_factory.create_weekly_plan
media_factory.list_jobs
media_factory.get_job
media_factory.approve_job
media_factory.request_changes
media_factory.list_releases
```

Web and MCP must share the same services.

Never implement separate business logic for each interface.

Architecture:

```text
              Web
               │
               ▼
        Product Services
          ▲          ▲
          │          │
         API        MCP
```

---

# 29. REQUIRED DELIVERY SEQUENCE

Do not randomly build screens.

Recommended graph:

```text
WEB001 — Application foundation
↓
WEB002 — Auth + tenant context
↓
WEB003 — Product API
↓
WEB004 — Dashboard
↓
WEB005 — Sources
↓
WEB006 — Content DNA
↓
WEB007 — Guided Mode
↓
WEB008 — Free Mode
↓
WEB009 — Production Job UX
↓
WEB010 — Streaming Graph status
↓
WEB011 — Human Review
↓
WEB012 — Provider adapters
↓
WEB013 — Releases
↓
WEB014 — Observability
↓
WEB015 — End-to-end validation
↓
WEB016 — Deployment
↓
WEB017 — Final release
```

Use the actual recovered graph state as authority.

If equivalent nodes already exist, reconcile rather than duplicate.

---

# 30. PRODUCT COMPLETION DEFINITION

The product is not complete merely because the Web page renders.

COMPLETED requires all of the following:

### Product

* Guided Mode works.
* Free Mode works.
* Multi-tenant workspace switching works.
* Sources are manageable.
* Reference vs production authority is visible.
* Content DNA is visible.
* Weekly plans can be created.
* Jobs can be launched.
* Graph state is visible.
* Human approvals work.
* Release artifacts are visible.

### Backend

* Product API works.
* Tenant authorization works.
* asynchronous jobs work;
* Graph adapter works;
* provider adapter contract works;
* state projection works;
* evidence retrieval works.

### Infrastructure

* health endpoint works;
* Docker/runtime works;
* Caddy route works;
* shared Cloudflare tunnel works;
* HTTPS public preview works;
* no new unnecessary infrastructure exists.

### Quality

* automated tests pass;
* deterministic provider tests pass;
* browser walkthrough passes;
* multi-tenant isolation passes;
* Graph Harness validates;
* Critic passes;
* Independent Verifier passes;
* release candidate and release hash match policy.

### Documentation

Document:

* local development;
* architecture;
* API;
* provider adapter interface;
* tenant model;
* deployment;
* browser bridge;
* failure recovery;
* Graph lifecycle.

---

# 31. FINAL OUTPUT REQUIRED

At the end provide:

```text
FINAL STATE

COMPLETED
or
PARTIAL_WITH_DOCUMENTED_BLOCKERS
or
SAFETY_STOP
```

And report:

```text
Product URL
Health URL
Repository
Branch
Release SHA
Graph state
Tests
E2E result
Provider adapters available
Known blockers
Highest-value next step
```

Do not claim completion unless these are evidenced.

---

# 32. NON-NEGOTIABLE PRINCIPLES

1. Reuse the existing Media Factory.
2. Graph Harness remains lifecycle authority.
3. Web is a control plane, not the source of truth.
4. Guided and Free Mode share one backend.
5. Tenant isolation is mandatory.
6. Reference material is not automatically production material.
7. Content DNA abstracts; it does not clone.
8. Paid AI generation remains gated.
9. Provider adapters are replaceable.
10. Chrome CDP is never public.
11. No secrets in persisted media contracts.
12. No automatic publication in MVP unless explicitly introduced through a separate approved graph node.
13. No political microtargeting or sensitive-trait targeting.
14. No synthetic media presented internally as documentary evidence.
15. Verifier and Release operate on the same immutable candidate.
16. Prefer product completion over endless architecture changes.

The objective is to finish and deliver **Media Factory Web** as a real reusable product, not a demo.
