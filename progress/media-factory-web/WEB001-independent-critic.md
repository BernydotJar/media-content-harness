# WEB001 Independent Critic — services, HTTP, identity and intent

Reviewer: graph_engineer_recovery, independent of the server-services producer. Review performed 2026-09-12. Scope: server/auth.mjs, repository.mjs, contracts.mjs, services.mjs, http.mjs, intent.mjs and providers.mjs. No server code modified by this reviewer.

Outcome: CHANGES_REQUIRED. Existing unit coverage passes, but additional adversarial probes expose intent and login-concurrency gaps.

## Findings

1. **P1 — explicit no-AI request produces generative draft.** `interpretDraft({text:'Hazme dos videos sin usar IA.',week_of:'2026-09-14'}, tenantWithAuthorizedSource, dna)` returned two GENERATIVE stories, `ready_to_save:true`, zero clarifications. The `noAI` regex handles 'sin IA' but not the common 'sin usar IA' phrasing. This violates explicit production intent. Recognize negation reliably; whenever the constrained parser cannot resolve the instruction, return a clarification and prevent save until the user revises it. Preserve the literal request in the draft and add regression coverage.

2. **P2 — unsupported mixed counts silently become ready.** 'Hazme cuatro videos: dos con IA y dos con material real.' returned REAL_FOOTAGE, REAL_FOOTAGE, GENERATIVE, AUTO. 'Hazme cuatro videos. Uno real y tres usando IA.' returned four GENERATIVE stories. Both were marked ready with no clarification. The special four-story pattern should be exact enough to preserve the accepted two-real, one-AI, one-mascot request without claiming to interpret unrelated mixed distributions. Either implement explicit count extraction or fail closed with actionable clarification for unsupported distributions.

3. **P2 — login concurrency reservation occurs after an await.** AuthService checks `activeLogins < 4` before awaiting `identities()`, then increments after it returns. Twelve concurrent calls with a delayed identity read all passed the gate and `activeLogins` became 12. Reserve a slot synchronously before the first awaited operation and release it in finally, including configuration failures. Keep global and per-identifier attempt bounds.

## Checks and evidence

- `node --test tests/web-services.test.mjs tests/web-operator.test.mjs`: 16 passed, 0 failed.
- Independent read-only runtime probe imports AuthService, replaces identities with a barrier, sends 12 distinct dummy login identifiers, releases barrier and samples activeLogins at setImmediate. Expected <=4, observed 12. No valid credentials or real identities used.
- Independent direct interpretDraft probes above used one local in-memory authorized source and available Content DNA; observed distributions are recorded verbatim in findings.
- Membership checks exist in both HTTP-facing service and execution boundary. Configured identity roles override persisted membership, and session resolution reloads identities and verifies the credential digest.
- Mutation CSRF requires exact public origin and rejects cross-site requests. Cookies are HttpOnly, SameSite=Strict, Secure under HTTPS. JSON and media bodies have bounded stream reads; SSE authenticates initially and rechecks membership on updates.
- Repository writes serialize by canonical file path in the documented single-process deployment, fsync the file, rename atomically and fsync directory. Symlink state is rejected. Cross-process database semantics are explicitly outside current MVP capability.
- Evidence hashes are verified against actual uploaded reference proof bytes, exact source authorization and tenant identity before DNA generation. Production sources cannot be inferred from references.
- Provider registry is independent of domain strategy, with unconfigured paid providers unavailable. Full provider execution was assigned to WEB003 independent review.

## Guided/Free usability with evidence requirement

The UI uploads selected reference evidence before analyze and uses the returned server hash. No user must type a hash or understand graph contracts. A reference without proof does not satisfy DNA gates. Guided mode exposes all eight stages and useful links to missing source/DNA setup. Free mode starts with the tenant's authorized production sources selected and returns editable concepts. Source-linked mascot setup is now available, but the actual provider must still honor or explicitly block character work.

The server errors and clarifications remain English at this checkpoint, while the studio is Spanish. This is a user-experience gap; localize known error/clarification codes and messages without hiding the specific reason for the failure. Reference upload accept types should match the server allowlist to avoid an avoidable failed submit.

Fixes must be independently re-run against the probes above before WEB001 closure. This document is a critic report, not release approval.

## Independent verification of fixes — 2026-09-12

Current verdict: PASS for the three blocking findings above. The original findings remain as the review history. The services producer made the fixes; this independent reviewer only re-ran validation.

Executed the same independent AuthService barrier probe against the fixed code: 12 concurrent distinct dummy logins yielded activeLogins=4, eight RATE_LIMITED rejections, and activeLogins=0 after completion. This verifies reservation before asynchronous identity loading and eventual release.

Executed direct interpretDraft assertions:

- `Hazme dos videos sin usar IA.` → REAL_FOOTAGE, REAL_FOOTAGE; ready=true.
- `Hazme cuatro videos: dos con IA y dos con material real.` → GENERATIVE, GENERATIVE, REAL_FOOTAGE, REAL_FOOTAGE; ready=true.
- `Hazme cuatro videos. Uno real y tres usando IA.` → REAL_FOOTAGE, GENERATIVE, GENERATIVE, GENERATIVE; ready=true.
- Exact accepted four-video request with two real, one AI and the caballito → REAL_FOOTAGE, REAL_FOOTAGE, GENERATIVE, AUTO; ready=true; original intended distribution preserved.
- `Hazme cinco videos: dos con IA y otro de material real.` → ready=false with explicit clarification that per-video strategy counts are ambiguous.

Re-ran `node --test tests/web-services.test.mjs tests/web-operator.test.mjs`: 21 passed, 0 failed. This includes current reference-evidence tamper detection, source-bound mascot setup, cross-bundle ProductError identity, indirect AI negations, alternative count distributions and the login-cap regression.

No UI or backend production code changed during this verification. Spanish localization of remaining service messages is still a nonblocking UX limitation; it does not alter the verified authorization/intent/evidence behavior. This verifies WEB001 service behavior within inspected scope, not public deployment or final product release.
