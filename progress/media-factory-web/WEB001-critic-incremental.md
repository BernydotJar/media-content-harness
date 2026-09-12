# Incremental Critic — services

Reviewer: root coordinator, separate from services Producer. Review before candidate freeze; this document is not an acceptance gate.

- Auth login passed password through boundedText, trimming whitespace; the operator provisioner preserves password bytes. A valid configured password with leading/trailing spaces would fail. Producer asked to preserve exact password and validate only type/length.
- Per-identifier attempt map eviction can reset brute-force budget after enough distinct identities. Producer asked to add a global bounded attempt budget/backpressure as well as per-identifier limits.
- Durable store malformed structure must fail through a controlled error; never treat corruption as empty data. Producer asked for regression coverage.

Earlier dependency audit: AJV8.17.1 has GHSA-2g4f-4pwh-qvx6, fixed in >=8.18; producer tasked with current patched pin and re-audit.

Remaining: review complete HTTP authorization/CSRF, contracts/source authority, idempotency and full execution integration once persisted. No PASS claimed yet.

Integration review:
- launchPlan queued jobs without started=true while the runner required it; per-job source snapshots also contained other stories' sources. Producer asked to reconcile queue start and per-story snapshots.
- Public projection omitted treatment/current review candidate and used incompatible evidence/approval fields. The human approval UI must receive the concrete candidate it approves. Release records and projection also needed one agreed schema with hashes/downloads.
- Schema file loading via import.meta URL required adaptation for bundled Next standalone runtime.
- Free Mode policy must reject unsupported audience targeting directives rather than preserve them as raw objectives; add multilingual adversarial tests.
