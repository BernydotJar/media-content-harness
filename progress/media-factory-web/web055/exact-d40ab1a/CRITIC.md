# WEB055 V20 — Critic Review

## Candidate

Exact product candidate: `d40ab1a01ba7310eebb45dc7d957a5127d3c5378`

## Verdict

**PASS for implementation quality.** No critical, high, or medium implementation finding remains in the reviewed V20 scope.

## Review focus

The review examined the character-reference video path rather than political messaging: provider request construction, credential isolation, reference-byte integrity, paid-spend approval, duplicate-spend recovery, output URL handling, provenance, sticker/generated-character semantics, provider availability, regression coverage, and truthful release claims.

## Findings

1. **Provider contract — PASS.** The Gemini/Veo adapter requires an approved character reference, uses the exact compiled prompt, constrains reference-video requests to supported 8-second `9:16` or `16:9` video output, and binds provider-model identity into provenance.
2. **Credential handling — PASS.** The API key resolves from the encrypted integration vault at execution time and is not included in job/product state or public provenance. Provider discovery is credential-aware before scene creation.
3. **Redirect/SSRF boundary — PASS.** Provider API URLs are fixed to the Google Generative Language host; media collection validates HTTPS Google media hosts and deliberately omits the API key on redirected media requests.
4. **Spend governance — PASS.** Credit-bearing generation still uses the existing scope-hashed human spend approval and weekly Q200 policy. Provider submission cannot occur before approval. Existing recovery coverage rejects blind retries after ambiguous submission or terminal moderation/provider failure.
5. **Reference integrity — PASS.** Character/environment references are re-read from controlled storage and verified against the prompt compilation SHA before provider execution. The spend scope includes those hashes.
6. **Provenance semantics — PASS.** Generated character video is labeled `REFERENCE_VIDEO`; deterministic FFmpeg mascot composition is labeled `STICKER_OVERLAY`. The product does not silently represent a sticker as model-generated character embodiment.
7. **Backward compatibility — PASS.** Existing real-footage, manual-external, provider-gateway, media-projection, audio-finishing, tenant/review and browser flows remain green in the full suite.
8. **Release truthfulness — PASS with explicit external boundary.** Mocks prove the execution contract but not live-provider readiness. The implementation spec correctly keeps WEB056 blocked until one authorized real Gemini/Veo reference-video request is executed on the controlled preview.

## Evidence

- Clean exact production build: PASS.
- Full suite: 263 tests, 262 pass, 0 fail, 1 skipped.
- Exact generic browser E2E: PASS.
- Exact scene browser E2E: PASS.
- TypeScript: PASS.
- Contract examples: PASS.
- Production dependency audit: no known vulnerabilities.
- Graph validation: PASS.

## Non-blocking note

The Next.js/Turbopack build still reports the existing dynamic-filesystem tracing warnings in `server/services.mjs` and `server/singleton.mjs`. They predate the provider-contract change and do not invalidate V20 functionality, but they remain an operations cleanup item.
