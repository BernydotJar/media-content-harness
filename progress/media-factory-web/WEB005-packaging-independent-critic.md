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
