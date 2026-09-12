# Media Factory deployment recovery

Read-only recovery performed 2026-09-12; no shared infrastructure was changed by this recovery.

## Verified state and authority

The media workspace exposes `/shared-auth/deployment`; the documented `/workspace/_shared/deployment` link is absent. Host backing path: `/Users/eduardosacahui/.cloud-sandbox-mcp-data/shared-auth/deployment`.

`python3 /shared-auth/deployment/productctl.py resolve 'Media Factory'` returned exit 42, `ONBOARD_AND_DEPLOY`, product key `media-factory`, registered false, suggested hostname `media-factory.textilesdemedellin.com`. The hostname did not resolve and the shared Caddy configuration contained no product route. These observations do not constitute a public deployment.

The installed `com.cloud-sandbox.host-deployment-reconciler` LaunchDaemon watches registry changes and reported last exit 0. Its idle state is normal for a scheduled reconciler. Direct Docker access by the local agent was denied; use the established privileged reconciler.

Canonical contracts: `/shared-auth/deployment/CONTROL_PLANE_CONTRACT.md`, `DEPLOYMENT_CONTRACT.md`, `MASTER_DEPLOYMENT_RECOVERY_CONTRACT.md`. Dispatcher and state: `productctl.py`, `registry.json`; host executor: `host-reconciler/host_reconciler.py`. Installed dispatcher lacks the documented `validate-registry` subcommand; do not report that check as passed.

## Existing release path

Clean exact-SHA release and tests → immutable archive plus SHA-256 → actual independent risk/rubric review and signed receipt → `productctl.py request-deploy` → existing host reconciler → Docker Compose/restart proof → shared Caddy → existing `cloud-sandbox-mac` tunnel and DNS → authenticated public HTTPS proof → persistent deployment evidence.

Reuse existing tunnel, edge, namespace, storage and host. Do not create paid resources, a new tunnel, public database ports, or a new domain. Host credentials remain host-only. This task did not inspect existing private signing directories.

The installed signing policy is `/shared-auth/deployment/host-reconciler/critic_finalizer.py`. It requires actual raw Ollama decisions for exact SHA and a detached RSA-SHA256 signature, with model `ibm/granite3.3:2b` and critic workspace `3b915109-6200-4890-a21b-78fc23fb471c`. Availability of the model was verified, not a review verdict. Never fabricate model output or a passing review. Any dedicated release signing provisioning must preserve reviewed authority and verifier compatibility.

## Runtime compatibility

The existing reconciler requires a Compose service named `frontend`, Node inside that container, port 3000, network `cloud-sandbox-edge`, and product alias `media-factory-frontend`. It proves restart recovery. No published host port is needed. Health JSON must equal exactly:

```json
{"status":"ok","product":"media-factory","release_sha":"<40-character release SHA>","deployment_class":"controlled_single_operator_preview"}
```

The current host environment uses legacy names `CAMPAIGNOS_RELEASE_SHA` and `CAMPAIGNOS_DEPLOYMENT_CLASS`; map these to neutral app variables in Compose. The release archive must contain `deploy/host_reconciler/critic_finalizer.py` with the exact hash declared by the receipt/request. Existing policy output filenames use a legacy `campaignos-` prefix; SHA binding defines authority.

Default access policy is `basic_auth_single_operator`. `form_session_single_operator` assumes particular login/session endpoints and requires compatibility work. Default availability is persistent, with supervision and healthcheck. App execution requires pinned Graph runtime revision `477bdcc3d390c30eb49d823e5c7fd105fee2cc4d`, exact software release identity, and FFmpeg/FFprobe for the local real-footage adapter.

Inspect `python3 /shared-auth/deployment/productctl.py request-deploy --help` before request construction. Required parameters include release SHA/archive/hash, Compose path, edge network/alias/port, receipt/signature paths and hashes, public-key/finalizer hashes, critic model/workspace, source repository and runbook. Archive/review paths are relative to deployment root; Compose path is relative to archive root.

## Execution truth

The product worker invokes the actual pinned `MediaGraphService`. Source upload accepts bounded binary MP4/MOV/WebM bytes for an already authorized source and never fetches arbitrary URLs. FFmpeg/FFprobe use explicit demuxers and local protocols; direct playlists are rejected. Every selected source contributes to the bounded draft, with original audio retained where present.

Creative, conceptual and final release decisions require authenticated humans and exact candidate hashes. Real production critic and independent-verifier actions require different authorized reviewers; no external review is fabricated. External providers remain unavailable until reviewed adapters are configured; automatic credit spending/social publication are blocked. The explicit test mode requires deployment class `test` and isolated `/tmp/` storage; all synthetic evidence/artifacts/releases are labeled test.

Declare deployment complete only after exact artifact identity, application checks, restart recovery and public verification pass. If the app is ready while a host gate remains unresolved, record `APP_READY_HOST_EDGE_PENDING` and the first failing layer.
