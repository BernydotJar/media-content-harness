# WEB005 final surface independent critic

Reviewer: deployment_recovery. Scope: final byte-range delivery, provider provenance, release snapshot display, operator-access/rollback documentation and the corrected requirements verification command. Production files are edited by other agents; this reviewer edits only this report.

## Initial assessment

HTTP Range: independent 6/6 tests passed with zero skips. `service.artifact` authenticates current identity/membership and verifies artifact integrity before `artifactResponse` interprets ranges or exposes ETag, Content-Length or Content-Range. Full and partial responses are private/no-store. Strong exact If-Range succeeds; weak, stale and date values fall back to full bytes. Closed/open/suffix ranges use bounded BigInt parsing; multipart/unknown units may return the full representation. Unauthenticated, cross-tenant and revoked identities cannot retrieve byte or validator metadata. No material Range finding.

Provenance projection: independent 4/4 tests passed with zero skips. Provider, source IDs and SHA-256 values are allowlisted, and private adapter paths/credential metadata are removed. Tests reject unaccounted, substituted, duplicate or relabeled sources; synthetic test origin stays explicit. Release queries enforce current tenant membership and serve the stored release snapshot, not mutable job metadata.

Two findings were sent to the producer for correction before final verification:

1. Provider provenance is added to the candidate hash by `waiting`, but the initially reviewed `approve` did not compare current provider metadata with `review_candidate.provider_execution_sha`. A provenance change with unchanged video must invalidate the stale human decision before recording approval or persisting release.
2. The initial JobDetail rendered all artifacts retained across repairs while showing the current candidate/provenance. The current artifact SHA must identify the video presented for review; older files must not silently appear as the current master.

Documentation: operator access points to the product-specific host-only credential path and correctly states create-or-reuse behavior, administrative local inspection, no secret sharing, and no implemented self-service rotation. Automatic rollback is correctly limited to edge configuration; previous signed software candidate and compatible persistent data are separate. The requirements command correction does not weaken acceptance requirements.

Final verdict pending producer corrections, targeted actual-Graph verification, and final file hashes. This report does not constitute an image, browser or public deployment release gate.

## Final recheck and disposition

Verdict: PASS_FOR_CANDIDATE_VERIFICATION for the surface changes and file hashes below. Both findings are closed. `assertReviewCurrent` compares the persisted candidate manifest with candidate_sha, verifies provider_execution against its scope hash and artifact SHA, and runs before approval, durable intent and final release snapshot persistence. The UI selects the current master by artifact_sha256. Repair clears current provenance/provider/note/review candidate while preserving historical artifact bytes.

Independent actual pinned Graph verification covered five scenarios: production media plus distinct human critic/verifier and immutable source/provenance/review release snapshot; identical media bytes with a fresh repaired candidate; provenance drift before approval; provenance drift during approval; repair clearing current provenance. Four initially passed and one failed only because its new test expected pending_review undefined instead of the established null contract. The producer corrected that assertion; independent rerun passed 1/1. All five selected behaviors are now independently passing, with zero skips. First run log: `/tmp/media-final-surface-independent-worker.log` (retains the initial assertion failure rather than overwriting it). These use the real Graph runtime pinned at 477bdcc3d390c30eb49d823e5c7fd105fee2cc4d; production-path test input is generated local fixture media, not a customer production or fabricated human session.

Provider capability correction was independently reviewed and tested 1/1: FFmpeg advertises only REAL_FOOTAGE, matching its actual adapter; hybrid/generative preferences fail validation. UI disables incompatible preferences and names supported strategies. Unconfigured providers remain unavailable. The source upload copy correctly says videos rather than implying photo support.

No unresolved material finding remains in this reviewed scope. Total independent focused coverage: byte ranges 6, public provenance 4, worker behaviors 5, provider capabilities 1. Full clean-candidate checks, packaged browser E2E, signed review and actual host/public release gates remain separate. Later public SEO/landing work is outside this surface review and requires its own verification.

| Reviewed file | SHA-256 |
| --- | --- |
| server/http.mjs | 6daceebda065e3ea85b6767fb3a7aaaf64682aae26b4dbd8c42b50271b252e5a |
| tests/web-artifact-range.test.mjs | 1b15bb8dbc86458dc5dfe02edebd6ef23f1e43d16fe9a4ffc6d48b57a1151c06 |
| server/media-projection.mjs | efa50672bcad1ef9858bc537c93fd7de6f05898558864fef6d5249e75e80637a |
| server/execution.mjs | a82e8b35674e6777c72cddc712688b0f9716dece86379c646cae710361d14373 |
| server/worker-adapters.mjs | 9cf7240c321ce2806f94bea121bd590ae87118a10183af13eea1bc5f06a745a1 |
| server/services.mjs | efd8f05d39928e0d86769bf1a66c6ee6a2f5606de35ab148e1845a8464c41d66 |
| tests/web-media-projection.test.mjs | 1389026629cde5bb56160b3813f6c3c487052dc69a6e18ee9320cc3ac7ebab36 |
| tests/web-execution.test.mjs | e4efbee65d21848f8c6e23b4653a190905e0f98162471506a9a5e8a355b916f2 |
| server/providers.mjs | 82aece6f35a254c49c7fbbd997a42ee6111ca4c93600b12a2d4ddfcdbca79ef7 |
| tests/web-provider-capabilities.test.mjs | f17b1dde3d484c5b30986156d1c327626dc99a66eb077b793196e848d21018c6 |
| components/jobs.tsx | 3376b9d2733aa11e2bab1b299662d003b95d6583be5eb426d49255dbb1b128de |
| components/planner.tsx | e02d2c1c96592b5092236bfb8fbba1b114c89518bc916b2e6d559f4150cde012 |
| components/ui.tsx | f559c220c9a6c520c9406fd07f2e9c897dcd319a0489a1e86da8422728a03b88 |
| app/globals.css | ae6b8be0645dc34fb5a0494a4315cfc80a2a24a5c0d70ede98b464f74010c51f |
| docs/MEDIA_FACTORY_WEB.md | 68eb9685aeaf2183375c7978185207bc1dac562b52f7cd173f40ce6f01722200 |
| specs/media-factory-web/requirements.md | 708c5a16ddd4e96a996faa6db82310826b4acca00789c266cd4d2f32982649d0 |
