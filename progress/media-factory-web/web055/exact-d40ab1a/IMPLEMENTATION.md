# WEB055 V20 — Implementation Evidence

## Exact candidate

- Commit: `d40ab1a01ba7310eebb45dc7d957a5127d3c5378`
- Production source SHA-256: `4d058bf6c995139d0f7560c6e12c35a04560dca0be2ba6fc69357541e1a0312e`
- Exact build ID: `yok_cpbcdmpDSrb0b4R6q`
- Branch candidate: `feature/web055-character-video-v20`
- Working tree at exact verification: clean

## Implemented gap closure

WEB055 closes the implementation gap between the existing reusable Caballito identity contract and executable in-product character-reference video generation. The exact candidate:

1. adds a server-side Gemini / Veo 3.1 Fast adapter for hash-bound reference-video generation;
2. sends approved reference bytes inline and preserves the reference SHA, prompt SHA, provider model, and synthetic provenance;
3. keeps the encrypted Gemini credential server-side and makes provider availability credential-aware before job creation;
4. reuses the existing explicit paid-provider approval, Q200 usage policy, durable provider-attempt lifecycle, no-duplicate-spend recovery, and manual publication boundary;
5. makes `REFERENCE_VIDEO` and deterministic `STICKER_OVERLAY` distinct provenance modes with no silent fallback;
6. updates Scene Builder to present “Crear video con personaje” and “Agregar como sticker” as separate operations; and
7. preserves the reviewed manual-external path when no API execution is available.

## Exact verification matrix

| Check | Result | Exact evidence |
| --- | --- | --- |
| Production build | PASS | `logs/build.log` |
| TypeScript | PASS | `logs/typecheck.log` |
| Full automated suite | PASS — 263 total, 262 pass, 0 fail, 1 skipped | `logs/full-tests.log` |
| Generic browser E2E, `--require-clean` | PASS, exact candidate SHA | `logs/browser-e2e.log` |
| Scene browser E2E, `--require-clean` | PASS, exact candidate SHA | `logs/scene-e2e.log` |
| Contract examples | PASS — 13 valid | `logs/validate-examples.log` |
| Production dependency audit | PASS — no known vulnerabilities | `logs/audit-prod.log` |
| Graph validation | PASS | `logs/graph-validate.log` |

The browser package generated from the exact clean candidate reports runtime manifest SHA-256 `f5d4766fb78650d335aba68839e50ba96ccd84ae10d4e37b98cdf82a83cfc323` and build ID `yok_cpbcdmpDSrb0b4R6q`.

## Provider-contract and spend evidence

`tests/web-character-video-v20.test.mjs` proves, without spending provider credits, that the adapter request includes the exact approved character bytes, requires the 8-second reference-video contract, refuses unsupported square output, polls the same durable provider request, collects an MP4, preserves character and prompt hashes, and does not leak the API key across a Google media redirect. The gateway test additionally proves that an executable adapter is not user-selectable until a credential is configured, and that provider submission remains at zero until the exact spend scope is explicitly approved.

Existing Higgsfield recovery tests remain green and verify that ambiguous paid submission, moderation failure, crash-after-collection recovery, and changed spend-bound inputs do not create duplicate provider spend.

## Truthful release boundary

No funded/configured Gemini API credential is present in the controlled local product data used for this verification. Therefore this evidence establishes **implementation completeness**, not a live provider-generation claim. WEB056 must remain pending/blocked until one authorized real reference-video request is executed on the controlled preview and its collected MP4/provenance are verified. No mock result is accepted as live-provider evidence.

## Build warnings

The production build passes with the two pre-existing Turbopack dynamic-filesystem tracing warnings in `server/services.mjs` and `server/singleton.mjs`. They are warnings, not build failures, and are unrelated to the V20 provider contract.
