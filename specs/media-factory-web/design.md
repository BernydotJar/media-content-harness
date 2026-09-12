# Decision record — Media Factory Web

Decision: preserve existing ESM plugins and pinned Python Graph runtime; add a Next.js TypeScript presentation layer over framework-neutral ESM server services. Route handlers adapt HTTP to services, never implement a second workflow engine. Provider registry carries capabilities/availability and policies; core jobs carry generic strategies and provider execution provenance.

Assumptions: shared Cloud Sandbox runs Node 22 and Python; MVP has one Web/worker process with durable mounted storage. Existing browser bridge is external and requires explicit source authorization. Third-party generators may not have executable configured adapters; display that state precisely.

Alternatives: PostgreSQL/object store deferred behind repository boundary; separate API daemon deferred to reduce infrastructure; React SPA without Next rejected because preferred stack fits current Node ecosystem. No copied Graph runtime; use installed pinned checkout. Deterministic provider is test-only, never presented as a generated production video.

Risk controls: exact schemas and allowlists, same-origin CSRF, HttpOnly session cookies, membership checks in services, sanitized projections, safe IDs and canonical filesystem confinement, bounded body/text sizes, server-only provider/worker APIs, source and Content DNA snapshots, lock/atomic persistence, same-candidate hashes for review and release. Dependency audit on exact installed versions. Existing media graphs may use historical provider-specific node names; adapter/project projection can generalize production stages while preserving legacy graph.

UI: restrained dark creative studio, warm accent, typographic hierarchy, useful artifact previews, horizontal stage progress, Spanish creation flows, distinct reference/source cards. No seeded production fixtures. Authentication unavailable state until operator configured. Integration test fixtures isolated in temporary storage and clearly marked.

Known release risks to investigate: configured login identity, actual source bytes, provider gateway capabilities, shared route registry, Web daemon lifetime and access to installed Graph runtime from deployed container.

Sources checked 2026-09-12: Next.js installation/deployment official documentation https://nextjs.org/docs/app/getting-started/installation and https://nextjs.org/docs/app/getting-started/deploying. Registry resolves next 16.3.5, react 19.3.0. Use exact versions, lockfile, production audit.

Execution scheduling clarification: service, studio and Graph runner producers use agreed interfaces and disjoint file ownership. They can be implemented independently; WEB004 integration validation depends on all three and is the first whole-product release gate. This avoids coupling producer work to UI readiness while retaining explicit verification dependencies.
