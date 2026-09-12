# WEB005 final deployment Critic / Red Team

Verdict: **PASS for the deployed controlled single-operator preview**. No open material deployment finding is identified in the reviewed evidence. This is not a claim that every future provider integration or customer production capability is complete.

Reviewer: deployment_recovery. This review is read-only and uses existing receipts, independent source reviews, test records, installed-file hashes, registry state and host/public verification evidence. No new HTTP request, test, model evaluation, deployment request, restart, credential/cookie/private-key access, graph edit or commit was performed for this review. The reviewer authored the bounded controller proposal earlier; independent controller/helper source acceptance is supplied by graph_engineer_recovery's recorded Critic and adversarial tests, not self-approval in this report.

## Exact deployment identity

- Product: media-factory.
- Origin: https://media-factory.textilesdemedellin.com.
- Immutable software SHA: `c648711cd2cf53d6371c1de5504165f4b423eda8`.
- Reconcile request: `3f932cee-be65-4206-8460-3e442b08c355`.
- Registry: `status=active`, `reconciliation_state=converged`, `last_result=DEPLOYED_CONTROLLED_SINGLE_OPERATOR_PREVIEW`.
- Requested SHA, applied request, registry last_commit and host evidence release_sha agree exactly. Host evidence completed at 2026-09-12T21:34:31.234833+00:00.
- Policy: `form_session_single_operator`; deployment class: `controlled_single_operator_preview`.

## Existing evidence reviewed

1. Host evidence `/shared-auth/deployment/evidence/media-factory-host-reconcile-20260912T213431Z.json`, SHA256 `8e7d01e024c904e4aa0574adeaa26b156f6dc9dac6141b43b806260257f9d937`, result DEPLOYED. All recorded layers PASS: L1_RELEASE, L2_RUNTIME, L2_EDGE_NETWORK, L3_LOCAL_HEALTH, L3_RECOVERY, L4_CADDY, L6_TUNNEL, L7_DNS_L8_TLS_L9_PUBLIC, L9_SECURITY and L9_AUTHORIZATION. This includes the existing host-managed restart/recovery proof; no manual restart was added.
2. Public verification `/tmp/media-final-public-verification.json`, SHA256 `dfed4b92c218045a51ed27aa326c952acd11319b44aeecb46adb0c36d9e475fb`, result PASS for the exact software SHA. It reports credentials_used=false. The detailed existing response records support the public/authentication findings below.
3. Signed receipt in `staging/media-factory/c648711cd2cf53d6371c1de5504165f4b423eda8/campaignos-c648711cd2cf53d6371c1de5504165f4b423eda8-final.json`, SHA256 `5511aabe4421630eb094e9bc126b601d34ffdf6aa9e22bc3d54a61678656871e`. The legacy filename prefix is a finalizer naming detail: reviewed_sha identifies this exact Media Factory candidate. Receipt model is ibm/granite3.3:2b, verdict PASS, material_findings_open=0, all ten rubric categories PASS, authorized Critic workspace3b915109-6200-4890-a21b-78fc23fb471c. Recorded at2026-09-12T21:29:21.639520+00:00. Detached-signature hash is `941e632bee3d731feca3429ee46e692ab92b5ff84bf667f08d1ded3ec0e10738`; host L1 already performed signature verification. This review compares existing authority/hash evidence and does not rerun the model or cryptographic gate.
4. Existing exact-candidate delta report `/tmp/media-final-delta-verification.json`: PASS, clean candidate, BUILD_ID `7IagWKzhHleMRfc7un59u`, production source SHA256 `fe96cbc3e1e21ef01db97d59aef15e2debe050b1eb69763da66b6c64ca5a9ec1`. Prepared runtime has1450 entries, zero forbidden entries and zero external symlinks, manifest SHA256 `63d58a695dba6ce5a8b8d101bdc2ff32e003e0b889e6361b753e0fcaf7790373`. Exact delta checks cover prepared startup, rendered OG/Twitter static path, equality of generated/compiled/committed image bytes and corrected text contrast. It explicitly reuses the earlier33-check diagnostic browser run and records seven source-path changes/61 unchanged files. The full workflow was not rerun at this exact SHA, and this report does not relabel that earlier dirty-tree diagnostic run as an exact-candidate full-suite pass.
5. Previous independent source/fixture evidence remains applicable within its documented scope: WEB002 design Critic with closed contrast finding; WEB005 packaging and provenance/range reviews; public discovery/helper independent Critic with31 passing isolated tests and closed parent-directory TOCTOU/post-review drift findings. These records are reused, not executed again.

## Installed controller and trust boundary

Installed controller SHA256 is `aa40a01781d11f1857382b37037e6806bda6c5dd1235253ad9bafc45868716eb`. Source and active dispatcher both equal `46ba8e16972806a6668cf37a39e91c48ddbae046379bfca041e52d0a43dde5b4`, matching the independently reviewed proposal. The externally reviewed promotion-package digest is `cc2967edaaf00d356c5eaafd3757865bd6d5c6d297fb541069b20ae1582e5e42`. The recorded promotion backup is `/Users/eduardosacahui/.cloud-sandbox-mcp-data/shared-auth/deployment/control-plane-backups/media-discovery-20260912T213125Z-75c0175b48f246429ddc1e52878f9738`.

The canonical finalizer remains unchanged at SHA256 `edff9a10ef314ca38473af0e741aa7121611764c90626ae2e2cf7f69c785fb82`; the host public-key PEM remains `b61542031a4c61e9ccc270aac3ee2adb464508012d0b979eb40575da43d13e9e`, matching registry and receipt. No key rotation or verifier-policy replacement is needed to explain the successful deployment. The correct existing authorized signer was recovered rather than changing host trust.

The registry opts into exactly four text routes: /robots.txt, /sitemap.xml, /llms.txt and /llm.txt. The reviewed implementation admits only exact known paths, only for media-factory with this access policy, and only through the GET/HEAD matcher. No wildcard API/public-dashboard exception is installed. The independent source review establishes that existing blocked-path precedence, health Basic Auth, session forward-auth and POST login/logout exceptions are preserved. Empty opt-in keeps legacy behavior for other products; no new smoke against unrelated products was performed in this review.

## Public results and attempted boundary crossings

- Anonymous /login returns200 with product metadata. Its compiled `/_next/static/media/media-factory-og.2caqiraunec0r.png` returns200 image/png and exact SHA256 `080c7262f16a947da959362480261851c050b3b5f1c79f5305bf9f0778a9d57d`, matching the1200x630 committed/generated image. The `/opengraph-image` generator itself was not opted into the public edge; public social tags use the verified static asset.
- GET and HEAD for each of the four text discovery routes return200 with the expected MIME. Existing public verification confirms preview disallow/noindex behavior and an empty sitemap without private resource URLs. llms.txt and llm.txt are byte-identical and emit noindex.
- Anonymous dashboard, workspaces, workspace planning, job/review and releases requests return303 only to same-origin /login with no private body. Anonymous versioned tenants/jobs/releases APIs return401. POST to all four discovery paths returns401, so the public GET/HEAD exception does not widen mutation access.
- The public session-validation endpoint returns404; anonymous health returns401. Existing host proof records authenticated HTTPS health200 and the form-session lifecycle login200, workspace200/bodyPASS, logout303, revoked-session401. Secrets were handled by the established host verifier and are absent from this review.
- Private metadata and robots policy supplement authentication; they are not presented as access control. Anonymous unknown paths remain subject to the edge gate. The custom application404 was covered in earlier application evidence; no general public-edge404 promise is made.

## Material limitations and delivery classification

The deployment is successful within the declared controlled preview scope. It supplies one host-managed operator by default, not automatic public enrollment or a fully staffed independent media-review organization. Real production media gates still require the explicitly configured distinct reviewer identities described in the runbook. No customer media approval, social publication or paid-provider execution is inferred from software deployment.

Unconfigured paid/generative/hybrid providers, unsupported mascot execution and unsupported free-form repair requests remain explicit product capability blockers. Missing authorized source bytes or required reviewer roles must continue to block the corresponding jobs. These limitations do not turn this verified application deployment into a deployment failure, and they do not justify marking those capabilities complete.

This is the first Media Factory deployment. Host restart/recovery and edge security are evidenced; a rollback to an earlier Media Factory software version is not claimed because no previous release existed. Controller backup/journal recovery and software rollback are separate mechanisms; durable product data must be preserved.

Final classification for WEB005: **PASS — DEPLOYED_CONTROLLED_SINGLE_OPERATOR_PREVIEW**, with the above product-scope limitations documented. This report does not independently assign the overall program terminal state or modify the execution graph.
