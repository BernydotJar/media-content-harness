# WEB005 release provenance — independent Critic and verifier

Reviewer: baseline_audit. Producer: graph_engineer_recovery. Base commit: 83d7783ba860266e249691edd610f7086cffb733; reviewed files remain working-tree changes awaiting a new immutable candidate.

Verdict: PASS for the bounded backend provenance and release projection changes at the file hashes below. The two initial findings are resolved. This is not a release gate, browser verification, deployment result, or a claim that unconfigured providers can produce customer media.

## Findings resolved

- P1: merely including provider metadata in a candidate did not prevent mutable metadata from being copied into a release after approval. execution.mjs now verifies the complete review manifest digest and current provider-execution digest before approval, in the durable-intent transaction, and immediately before release persistence. Regression tests alter provenance before approval and during Graph completion: both reject with PROVENANCE_CHANGED and create no release.
- P2: repairs retained the previous output's provider metadata, and the preview preferred historical files over a new treatment. requestChanges now clears current provider, note, manifest and output identity while retaining history. The UI filters preview files by the current artifact SHA, so old files do not masquerade as the pending candidate.

## Independent evidence executed

GRAPH_HARNESS_RUNTIME_ROOT=/home/agent/.cache/media-content-harness/graph-harness-sdlc node --test tests/web-media-projection.test.mjs tests/web-execution.test.mjs completed 26/26 PASS, zero failures/skips, exit0. Transcript: WEB005-provenance/worker-and-projection-tests.log. The actual Graph pin is 477bdcc3d390c30eb49d823e5c7fd105fee2cc4d.

The separate provider capability regression completed1/1 PASS, zero skips: WEB005-provenance/provider-capabilities-tests.log. FFmpeg advertises REAL_FOOTAGE; unsupported explicit combinations are rejected before rendering.

The full worker run independently exercises actual uploaded source bytes, ffmpeg output and actual pinned Graph transitions; producer, critic and verifier identities remain separate. The current artifact manifest stays equal through Critic, Independent Verifier and Release. It verifies consumed source SHA, four review records, immutable released provenance, cross-tenant denial, metadata allowlisting, crash recovery for all three human decisions, stale-stage rejection and explicit unsupported-capability blockers.

The release snapshot copies provider/source/review data rather than reading it from a mutable job. The independent run changes the job afterward and confirms released source provenance remains intact. Public projections exclude local paths and adapter credential fields. Synthetic fixture output remains explicitly marked, and its provenance does not claim it consumed customer footage.

## Remaining verification

Expanded browser checks were authored for visible release fields, actual master download SHA, video Range206/seek, and mobile release details. They still require a fresh build and execution after all concurrent product/SEO edits freeze. External provider connections, mascot rendering, arbitrary creative repair and real customer approvals remain explicitly outside this verified capability. The Graph release gate must use the later immutable software candidate and its actual browser evidence.

## File identities

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
  "tests/web-media-projection.test.mjs": "1389026629cde5bb56160b3813f6c3c487052dc69a6e18ee9320cc3ac7ebab36",
  "tests/web-provider-capabilities.test.mjs": "f17b1dde3d484c5b30986156d1c327626dc99a66eb077b793196e848d21018c6",
  "tests/web-execution.test.mjs": "e4efbee65d21848f8c6e23b4653a190905e0f98162471506a9a5e8a355b916f2"
}
```
