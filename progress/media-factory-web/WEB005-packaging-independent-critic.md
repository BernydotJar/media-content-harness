# WEB005 packaging independent critic

Date: 2026-09-12. Reviewer: deployment_recovery (independent of the packaging producer).

Verdict: PASS_FOR_BUILD_CANDIDATE. No unresolved material finding in the reviewed source packaging contract. This is permission to attempt the existing build and deployment mechanism, not evidence that an image or public deployment works. Production source files were not modified by this review.

## Reviewed candidate hashes

| File | SHA-256 |
| --- | --- |
| Dockerfile | d9b80e5f7eab6ea0e6f3c4776eef03b1a801497f8d880c3f8282a64c88a58e08 |
| compose.host.yml | ee51cd8eb7530af5d9ecb9fc52e1496f3062c1c9a4b293716bb4e0426353b792 |
| .dockerignore | 68c7032ab96f271ce46e1fb08391b15fa319b96f9b8c5e53c2175d531cd24536 |
| next.config.mjs | 6da410c2373245fbdd50015b29732645d43a8adabbcdc19f56c7e6e0dd9caec5 |
| deploy/host_reconciler/critic_finalizer.py | edff9a10ef314ca38473af0e741aa7121611764c90626ae2e2cf7f69c785fb82 |
| docs/MEDIA_FACTORY_WEB.md | b46a81c5327178f56d4e22b1ca7eb18d9e16a20ce111541ab779231dcf0009ce |

## Findings closed and checks

- The included finalizer is byte-identical by SHA-256 to `/shared-auth/deployment/host-reconciler/critic_finalizer.py`; Python AST parsing succeeds. No signature, receipt, or external review has been fabricated by this review.
- The Docker build runs the raw installed Next compiler. This is compatible with an immutable Git archive lacking `.git`; the repository build wrapper requires Git metadata. The existing host must still validate the archive hash, candidate commit, and actual signed review before building.
- Installed Next 16.3.5 `collect-build-traces.js` uses `picomatch(glob, { dot: true, contains: true })` for exclusion entry matching. The configured `**/*` matches the raw `instrumentation` entry and normalized API entries. The former `/*` would miss instrumentation. The new exclusion policy covers Git, runtime data, environment files, critic private directories, work, progress, tests, specs, scripts, and docs. A fresh build must separately inspect resulting trace and image contents; this source check does not claim that a new image was inspected.
- Docker context excludes runtime data, environment files, `.git`, `.critic*`, work, progress and test artifacts. Runtime uses standalone output, explicit static/schema/config/example copies, and explicitly copies `scripts/provision-operator.py` despite trace exclusions. Python, Git, certificates and FFmpeg are installed. Graph is checked out at exact pin `477bdcc3d390c30eb49d823e5c7fd105fee2cc4d` under `/opt/graph-harness`, configured safe for the non-root runtime user.
- Compose exposes the established `frontend` service on internal port 3000 without new public ports or a new tunnel. Host orchestration owns the external network and product alias. Runtime is non-root, read-only except the private persistent data volume and bounded `/tmp`, with dropped capabilities and no-new-privileges. The data directory is initialized mode 0700.
- Host legacy release/deployment variables map to `MEDIA_FACTORY_RELEASE_SHA` and `MEDIA_FACTORY_DEPLOYMENT_CLASS`. `/health` returns the exact host contract, including immutable SHA. Compose additionally checks `/api/v1/health` readiness, which covers storage, identity configuration and the actual Graph pin.
- Packaging documentation requires `form_session_single_operator`, which is necessary for the existing host to provide operator username, password verifier and public origin. Compose maps those three values to the server identity and origin settings, ensuring origin validation and secure sessions. Optional identity-file configuration must retain the intended operator when replacing the environment identity; distinct production reviewer identities remain an operator prerequisite. No credential values were read or included here.
- Existing preview protocol is compatible with the host probe: JSON login including locale/next, exact workspace-status object, logout 303 and revocation, with forward authentication handled by the existing Caddy route. A fresh independent run of `node --test tests/web-host-preview.test.mjs tests/web-operator.test.mjs` passed 2/2, zero failures or skips. It also verifies foreign-origin rejection, redirect rejection, secure HttpOnly cookie and private interoperable operator provisioning.

## Remaining release gate evidence

Actual Docker build, final traced files, container startup, volume permissions, pinned Graph readiness, controlled restart, exact release SHA, Caddy/DNS/TLS routing, authenticated public smoke and rollback evidence remain the host deployment verifier's responsibility. No public deployment readiness is claimed here. Sandbox Docker lacks the Compose plugin, so a sandbox `docker compose ... config --quiet` attempt could not validate Compose syntax; this is not counted as a pass and requires validation in the established host build path.

## Supersession: actual Turbopack trace failure and allowlisted delivery

The preceding PASS_FOR_BUILD_CANDIDATE and its exclusion-policy inference are superseded by the actual build failure: candidate f1ca865 retained 67 prohibited progress/spec/test entries in instrumentation NFT and standalone output. Checking that a glob matches an entry did not establish that the compiler applies it. Installed Next `build/index.js` excludes Turbopack from the JavaScript `collectBuildTraces` path, and `turbopack-build/impl.js` returns an undefined buildTraceContext. Therefore no assurance is now based on outputFileTracingExcludes.

Replacement verdict: PASS_FOR_RUNTIME_TEST. The delivery boundary is now `scripts/prepare-runtime.mjs`, which creates a fresh separate tree containing standalone server.js, package.json, node_modules and required .next runtime files, explicitly adds static files, schemas, config, examples and the operator provisioner, and omits NFT files, cache and nested standalone trees. Docker copies only this prepared tree. Browser verification invokes the same preparer and boots its server.js from the isolated runtime directory; it no longer serves the repository through next start. The preparer is included in production source hashing.

Independent review found one material omission: the initial audit rejected `.env` but allowed `.env.production`. The producer fixed the entire `.env*` family and added a negative fixture. Independent recheck of `node --test tests/web-runtime-package.test.mjs` passed 1/1 with zero skips after that change. Its assertions cover omission of evidence/traces, protection of an existing destination, rejection of environment files and rejection of dependency links escaping the runtime. Copy preserves internal pnpm links; audit verifies their resolved confinement and rejects unsupported file types. No source files were modified by this reviewer.

A separate independent execution of the final preparer against the available built standalone tree created `/tmp/media-runtime-independent-44bac527-c265-4ef0-8cfc-802e45ef9742`: 1392 file/link manifest entries, zero prohibited entries, zero external links, build ID `Z--clmsUthbya4n54BOmK`, manifest SHA-256 `6dca0df28edc56715c1c7b96b7fbf4f07c1c54b9239f6ae72d4e24edd0c75bbd`. A separate filesystem scan of the equivalent producer output also found no forbidden entries or external links. These are package-construction checks against the available build, not a claim that the new committed candidate or image has passed end-to-end operation.

| Final reviewed file | SHA-256 |
| --- | --- |
| scripts/prepare-runtime.mjs | ed43e104be117b3ebbed7d11f79ad4a8dd79686c8c6ac5848fa6f92821a5cbc5 |
| tests/web-runtime-package.test.mjs | 4fe87bb694a7601fa12643841bc45a11285054605114472aab84a645d43b83d6 |
| Dockerfile | f99eb75cb0495b13cf69d9e2ab54b84e68ad5f060b6c5e4951a8639f65a05d61 |
| scripts/test-e2e.mjs | 36ba9fbe359e80979dc2a9e23d1342904545b66c47d31dbb85d5b367f0838d6b |
| scripts/web-source-state.mjs | e31081b7635930265a1a691afa1c63b5bc8a722f34757d0b2e73813ba75ab8b4 |
| docs/MEDIA_FACTORY_WEB.md | 43ae4d226bb971c3a34819650bc245fcb3aaad3d9921f299dda8dc9743029926 |

There are no unresolved material findings for attempting the fresh candidate build and packaged-runtime E2E. Full E2E, real image startup/readiness, restart, signing and authenticated public deployment gates remain mandatory and are not passed by this source review.
