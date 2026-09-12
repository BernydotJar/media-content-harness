# Final release surface and provenance — Producer/Fixer checkpoint

Producer: graph_engineer_recovery, 2026-09-12. Base software commit: 83d7783ba860266e249691edd610f7086cffb733. These changes are not committed or self-approved; independent Critic/Verifier and a fresh immutable software candidate remain required.

## Delivered behavior

The release library and released job now show the actual stored aspect ratio, version, publication state, artifact SHA, candidate SHA, final approver, review history, provenance and authenticated master download. Test downloads and synthetic previews remain explicitly test-labeled. The job preview displays only the artifact matching its current artifact_sha256; an old file cannot be shown as the current repair candidate.

The worker captures only allowlisted adapter provenance, verifies every consumed source ID and SHA against the actual selected bytes, and distinguishes real editing from synthetic test output. New output metadata includes actual file size. provider_execution is bound into the review candidate; current manifest and provenance hashes are checked before approval, durable intent and final release persistence. The release stores independent snapshots of provider execution, source assets and review decisions. Later job edits cannot alter that released provenance.

A repair clears current provider metadata, output hash and review candidate while retaining historical artifact files. Production and test human gates, source authority and review-stage replay protections remain enforced. FFmpeg's registry now matches its actual REAL_FOOTAGE capability; incompatible preferred-provider choices are disabled. The real-footage UI promises supported video inputs, not unsupported photo uploads.

## Producer validation actually executed

- pnpm typecheck: PASS after final UI/provider edits.
- node --test tests/web-media-projection.test.mjs tests/web-provider-capabilities.test.mjs: 5/5 PASS, 0 skipped.
- Full pinned Graph worker suite: 21/22 PASS; the only failure was a new assertion expecting an absent pending_review rather than the actual persisted null after a previous completed approval. The implementation correctly rejected changed provenance and created no release. The assertion was corrected to null.
- Re-executed node --test --test-name-pattern='changed provider provenance' tests/web-execution.test.mjs against the pinned actual runtime: 1/1 PASS, 0 skipped. Every worker case was exercised successfully across those runs; this does not claim a fresh all-in-one exact-SHA full-suite result.
- git diff --check: PASS.

Adversarial coverage includes incorrect/missing/duplicate consumed-source provenance, private adapter metadata exclusion, cross-tenant release visibility, immutable release snapshots, metadata drift both before and during approval, and repair invalidation. The existing real-footage Graph test now also proves the actual uploaded source SHA, FFmpeg provenance, stable verifier/release candidate, four human review records and immutable source/provenance snapshots.

The first attempted worker run exceeded the tool's 50-second execution limit after 16 passing cases; it is not counted as a completed suite. The subsequent 180-second window completed in 69 seconds with the single assertion issue described above.

## Independent review handoff

baseline_audit and deployment_recovery separately identified the approval provenance recheck and stale repair metadata issues. Both fixes and their regression probes are persisted. They are independently rechecking this checkpoint. baseline_audit owns the expanded browser tests for release details, actual downloads and video byte-range seeking; browser/build/deployment success must be recorded by those executions, not inferred here.

## Scope and terminal assessment

The exact four-video Spanish Free request was independently verified at e37805e as four editable contracts: two real, one generative, one mascot. It is not evidence of four rendered customer videos. FFmpeg produces authorized uploaded real video; Seedance/Higgsfield/CapCut/Gemini remain unconfigured. Mascot rendering and arbitrary creative feedback remain blocked rather than silently exported as ordinary footage. Reference analysis is an evidence-backed observation workflow, and Free interpretation is bounded deterministic parsing.

The default deployed operator alone cannot satisfy production Critic plus Independent Verifier: administrators must configure distinct real identities privately. No customer identities, paid-provider spend approvals, real-media final approvals or social publication were created by this software session.

Until final immutable candidate validation, authorized deployment/HTTPS checks and WEB005/WEB006 evidence gates complete, no terminal completion is justified. Even after core preview delivery, an overall claim that the requested mixed batch can fully render would be false while generative/mascot capability remains unavailable. Document these operational blockers explicitly; do not invent external access or approvals.

## Reviewed file identities

```json
{
  "server/media-projection.mjs": "efa50672bcad1ef9858bc537c93fd7de6f05898558864fef6d5249e75e80637a",
  "server/execution.mjs": "a82e8b35674e6777c72cddc712688b0f9716dece86379c646cae710361d14373",
  "server/services.mjs": "efd8f05d39928e0d86769bf1a66c6ee6a2f5606de35ab148e1845a8464c41d66",
  "server/worker-adapters.mjs": "9cf7240c321ce2806f94bea121bd590ae87118a10183af13eea1bc5f06a745a1",
  "server/providers.mjs": "82aece6f35a254c49c7fbbd997a42ee6111ca4c93600b12a2d4ddfcdbca79ef7",
  "components/jobs.tsx": "3376b9d2733aa11e2bab1b299662d003b95d6583be5eb426d49255dbb1b128de",
  "components/planner.tsx": "e02d2c1c96592b5092236bfb8fbba1b114c89518bc916b2e6d559f4150cde012",
  "components/ui.tsx": "f559c220c9a6c520c9406fd07f2e9c897dcd319a0489a1e86da8422728a03b88",
  "app/globals.css": "ae6b8be0645dc34fb5a0494a4315cfc80a2a24a5c0d70ede98b464f74010c51f",
  "tests/web-media-projection.test.mjs": "1389026629cde5bb56160b3813f6c3c487052dc69a6e18ee9320cc3ac7ebab36",
  "tests/web-provider-capabilities.test.mjs": "f17b1dde3d484c5b30986156d1c327626dc99a66eb077b793196e848d21018c6",
  "tests/web-execution.test.mjs": "e4efbee65d21848f8c6e23b4653a190905e0f98162471506a9a5e8a355b916f2"
}
```
