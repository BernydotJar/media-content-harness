# Media Factory v1 — Product Completion Requirements

## Product objective

Turn Media Content Harness from a production-policy foundation into a reusable, tenant-aware media factory that can safely inspect explicitly authorized reference pages, abstract reusable creative patterns, and prepare weekly production work without coupling the implementation to one organization or one browser profile.

Video production remains the primary outcome. Reusability is a product constraint, not a replacement for production quality.

## Required guarantees

1. The pinned Graph Harness runtime must execute in integration tests; a missing runtime may skip the optional integration test, but a configured valid runtime must never be silently ignored.
2. Chrome CDP access must be read-only, bounded to explicitly authorized page locators, and must not expose or persist browser credentials, cookies, messages, notifications, or unrelated tabs.
3. Tenant configuration must isolate source authority and browser-profile references. Cookies and raw credentials are never tenant-manifest data.
4. Reference analysis must store observations and provenance separately from abstract `Content DNA`. The system must not copy a reference piece shot-for-shot or present synthetic media as documentary evidence.
5. Public-affairs/political tenants are supported only in general-audience, non-microtargeted mode. Sensitive-trait voter segmentation and individualized political persuasion are out of scope.
6. Weekly production planning must require explicit source authorization per story and emit machine-readable production work that can enter the existing media graph.
7. Release is fail-closed on tests, schema validation, graph validation, or evidence mismatch.

## Completion criteria

- all Media Factory v1 graph nodes are `done` or a terminal blocker is persistently documented;
- `pnpm run check` passes;
- configured real Graph Harness integration runs and passes against the pinned revision;
- browser bridge unit tests pass and a live read-only discovery smoke test passes when the authorized Chrome bridge is available;
- examples and schemas validate;
- the final commit is independently reviewed and a release checkpoint records the exact candidate SHA.
