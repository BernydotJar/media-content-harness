# WEB004 — independent review of root-authored documentation and verification tools

Reviewer: graph_engineer_recovery. Date: 2026-09-12. No root-authored implementation or test files modified by this reviewer. The review covered the API/operations documentation, operator provisioning, build/source identity controls, browser runner and browser checks. UI implementation was not independently approved by its own producer.

Result: PASS for this bounded review after the fixes below. A successful end-to-end browser run and clean immutable release verification remain separate required gates; this report does not assert they have passed.

## Findings and independently checked fixes

1. **P1: dirty/stale source could be labeled as exact HEAD.** The previous browser runner always emitted candidate_sha=HEAD, including dirty sources, and injected the same value into health. It did not prove which sources produced the running build. The fixed build wrapper hashes a sorted production manifest before and after compilation and rejects source/commit changes; it writes a marker with commit, source digest, dirty state and actual build ID. The browser runner requires that current source digest matches the build marker and actual .next/BUILD_ID matches the marker. It marks dirty verification candidate_sha=null and `--require-clean` requires clean matching commit/build state. It rechecks commit, source digest, immutable-clean state and actual BUILD_ID after the browser run. The guards were inspected directly; the final clean browser execution is still a separate root gate.

2. **P1: a Playwright exception could disclose the generated fixture password.** The previous runner printed raw error.message even though locator call logs can contain fill values. A shared exact-secret redactor is now applied to console failure messages, persisted server logs and persisted failure DOM. The isolated fixture password is random hex, so exact replacement covers its direct and JSON/URL-safe representation. `tests/web-test-evidence.test.mjs` verifies repeated secret occurrences in a representative locator.fill failure. The test passed. Screenshots occur before login or with a password input; there is no plaintext credential display or stored Playwright trace.

3. **P2: provisioning accepted duplicate normalized identifiers.** The prior check compared an untrimmed argument but stored its trimmed value. An independent temporary-directory probe created two identities with one canonical login. The fixed code normalizes once and compares against either configured email or username, case-insensitively. Repeating whitespace and uppercase/username collision probes now exits with code 2 and preserves the original file byte-for-byte. The existing interoperability/private-mode test also passes. Only synthetic local test material was used.

4. **P2: browser download lacked independent byte hashing.** The browser test now SHA-256 hashes actual downloaded bytes and compares the result to the artifact projection, then compares release artifact_sha256 as well. It separately checks review candidate SHA binding. Static inspection confirms the independent byte assertion; its execution belongs to the full browser gate.

## Executed checks

- `node --test tests/web-test-evidence.test.mjs tests/web-operator.test.mjs`: 2 passed, 0 failed.
- Independent provisioning duplicate probes: whitespace-normalized duplicate rejected; existing username/case collision rejected; original identity bytes preserved in both cases.
- Read-only consistency review against current HTTP/services/worker/provider code and the separately verified host form-session protocol.

## Documentation accuracy

The API document distinguishes transport projections, membership roles, current provider availability, actual uploaded source/reference bytes, human-backed Content DNA, the bounded deterministic intent parser, and test-only media. The operations document explicitly limits JSON storage to one process, describes the separate pinned Graph runtime, preserves human review/release boundaries and does not equate builds with deployment. Neither document claims an implemented MCP transport, Google/enterprise login, automatic browser observation, paid provider execution or social publication.

The current FFmpeg behavior is described as editing existing source clips, fitting the selected frame and retaining source audio where present; unsupported generation/character/creative-repair capabilities are explicitly blocked. Future transport/provider extensions are presented as future work. Remaining human/provider/real-source blockers must still be carried into the final release report.

## Reviewed artifact hashes

| Artifact | SHA-256 |
| --- | --- |
| docs/MEDIA_FACTORY_WEB_API.md | 0bb19c9fdc604e22b94103466262fc6d60d5155c3bd73764917f94fe5196a993 |
| docs/MEDIA_FACTORY_WEB.md | c604d00bebb1641cd57a0030be721e448402339b9e4deaad48215d07bd97a8eb |
| scripts/provision-operator.py | 80090ef887512afdf04ef0dd4b7bdd58edcd65f1df84eb68c83258f32097ce2c |
| scripts/test-e2e.mjs | 46ddc7ccf32b642389062b35939cf43b6745000923730c4e5e8c4e6bc04ec279 |
| scripts/build-web.mjs | 9c490ea7d60341880ec6822503be42ca66010234f7615183ed319adc53cb2f71 |
| scripts/web-source-state.mjs | 67df89cd348967f9c4bd00031bea43509d86e71ca1bb35a60535090e26c5fc3d |
| scripts/redact-test-output.mjs | 9dd52b6d9c06a7803ae0dcae0c1854607dce1c786c7b234d775106dc6c7b5f82 |
| tests/e2e/studio.mjs | 8fb46a6ac2c24ca7e36dc9a0d0fe671c9d557fe1ad2bcf2610425c2f60b00e48 |
| tests/web-test-evidence.test.mjs | 37aae190cea1c6645b2b33dae15eb65b1fb3f0dae3791de4772893d017f97330 |
| tests/web-operator.test.mjs | 8d3067f153e8e0dfcf6d690c5135ad6cda0dfaadf1d69166699c36f77ef22ced |

Subsequent substantive edits to these artifacts require an appropriately scoped recheck. Final exact-commit/build browser evidence must be generated after all candidate changes are frozen.
