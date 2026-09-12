# Media Factory Web — independent final release review

**Decision: PASS for delivery of the controlled software release; overall product terminal state `PARTIAL_WITH_DOCUMENTED_BLOCKERS`.** The supplied evidence permits closing WEB005 deployment and WEB006 release/evidence for this bounded delivery. It does not justify claiming that the full generative/mascot production vision is COMPLETED. No SAFETY_STOP condition is established.

Reviewer: graph_engineer_recovery. Review date: 2026-09-12. This final pass read existing repository, specifications, registry and evidence only. It ran no tests, model inference, browser requests, deployment, restart, signature operation or credentials inspection, and changed no repository/Graph files. This report is the sole new file and is written under /tmp for the release owner to preserve.

## Candidate and deployed identity

- Software released: `c648711cd2cf53d6371c1de5504165f4b423eda8`.
- Repository main observed: `71e28fe7c970f373e84c937e297d69aa4bd48a30`. Diff from the released software consists of Graph ledger and release evidence files, not software implementation. The runtime must continue to identify c648711, rather than relabeling its build as the evidence-only main commit.
- Public product: `https://media-factory.textilesdemedellin.com/login`.
- Health: `https://media-factory.textilesdemedellin.com/health`, deliberately authentication protected.
- Registry read directly: `status=active`, `reconciliation_state=converged`, `last_result=DEPLOYED_CONTROLLED_SINGLE_OPERATOR_PREVIEW`, desired/last software SHA both c648711. Request `3f932cee-be65-4206-8460-3e442b08c355`; deployed at `2026-09-12T21:34:31.239826+00:00`.

The host evidence records PASS for release, runtime, private edge network, local health, restart recovery, Caddy, existing tunnel, DNS/TLS/public HTTPS, security and authorization. Authenticated public health returned 200; anonymous returned 401. Form login and workspace returned 200, logout303 and revoked session401. The separate public verification records PASS over 26 anonymous requests in five groups: actual login metadata/OG asset, GET/HEAD of robots/sitemap/llms/llm, private pages/API denial, discovery POST denial, and blocked public session/authenticated health. The public PNG hash equals the exact committed candidate image. These are existing actual observations, not fresh probes by this reviewer.

The installed controller evidence says APPLIED and all three installed hashes match the reviewed host/dispatcher payloads. Desired state opts in exactly four discovery document routes; OG is served through its existing public compiled static-asset URL. The proposal's five-path maximum allowlist does not imply five paths were opted in. Public evidence correctly proves the actual four documents plus the referenced OG asset.

The final canonical receipt names c648711, model `ibm/granite3.3:2b`, `verdict=PASS`, ten rubric PASS values and zero open material findings. Receipt/signature hashes match the current registry fields; host release verification subsequently passed. No new cryptographic verification or model review was performed in this final reading.

## What the delivered release supports

The accepted MVP has one backend shared by Guided and Free modes, membership-based authorization, source/reference separation, Content DNA abstraction, editable weekly plans, explicit human concept selection, asynchronous pinned Graph jobs, SSE product state, hash-bound review and bounded repair, and immutable release/provider/source/approval provenance. Existing evidence covers isolation, integrity, real FFmpeg execution over authorized supplied bytes in isolated tests, deterministic paid-provider substitutes, review/download/ranges, and the studio's critical desktop/mobile flow. A test-produced media release remains a test artifact, not a customer release.

The UI has the actual generic strategy/preferred-provider boundary. An integration-required provider is visible as unavailable, so the domain does not depend on Seedance, Higgsfield or CapCut. The exact mixed Free request becomes four editable story contracts; two are REAL_FOOTAGE, one is generative and the fourth carries the mascot intent. This is verified planning coverage, not evidence of four completed customer videos.

The visual/discovery addendum is delivered within the preview's privacy policy: original hero/OG, controlled motion and reduced-motion/pause behavior, actual loading component, accessible quick creation, private generic page metadata, canonical login, custom application404, robots, empty preview sitemap, llms/llm and public OG. Anonymous private/unknown pages remain subject to authentication. Preview noindex is intentional, not a deployment failure.

Verification was reused transparently under the user's instruction not to repeat passing tests. The signed dossier distinguishes its retained 33-check dirty/test-only browser run from candidate-specific OG/contrast/package delta checks and the later actual deployment/public checks. Do not advertise the retained browser run as a new clean full E2E of c648711. The later evidence closes the dossier's historically pending deployment condition; that pre-deployment statement should remain historical rather than be rewritten as though known earlier.

## Remaining blockers and boundaries

1. **Generative and hybrid execution still needs engineering integration.** Seedance, Higgsfield, CapCut and Gemini are declared interchangeable integration-required providers, not operational generation/finishing services. Production currently runs the local FFmpeg REAL_FOOTAGE path. Paid execution remains explicitly blocked until a reviewed integration handles capability, cost/approval and real provider state. Supplying an API key alone is insufficient. This does not invalidate the implemented adapter contract; it limits what can actually be produced today.
2. **Mascot compositing is unimplemented.** The authorized character source can be configured and planned, but the worker explicitly returns MASCOT_RENDER_UNAVAILABLE. Completing a caballito output needs a compositing/generation adapter, authorized source material and the required human gates. It must not be described as merely a missing mascot upload.
3. **Creative instructions have a bounded supported set.** Free Mode is a Spanish/English draft interpreter, not arbitrary conversational directing. FFmpeg currently assembles equal-duration portions of selected footage with source audio/padding. Automatic repairs support constrained duration changes; other creative feedback requires a reviewed manual/production adapter and returns MANUAL_REPAIR_REQUIRED. The product does not yet automatically execute every cinematic or shot-level request in the master examples.
4. **Customer production activation requires real inputs and independent actors.** The host preview supplies one operator. Production review requires separate producer, Critic and independent-verifier identities configured by the administrator, authorized customer footage/reference evidence, and actual story/treatment/final release decisions. This session did not provision invented reviewers or manufacture customer approvals. These are operational prerequisites, distinct from the implementation gaps above.

Google/enterprise identity, distributed persistence, additional MCP surfaces and social publishing are future extensions, not newly discovered mandatory work for this MVP. Lack of a prior application version on first onboarding prevents claiming previous-version rollback was exercised; the recorded container restart and shared-edge recovery are the actual current guarantees. None of these points calls for reopening completed work or repeating tests in this session.

## Graph/terminal assessment

The six delivery nodes describe the controlled software, its validation, publication and truthful terminal evidence. They may all reach DONE once the release owner attaches this independent report and the actual deployment/public proofs, records the release gate and persists the terminal checkpoint through the existing Graph runtime. This is compatible with overall `PARTIAL_WITH_DOCUMENTED_BLOCKERS`: DONE for those delivery nodes must not be presented as completion of every broad master capability or as approval of a customer media job.

No unresolved material source/security finding in the delivered controlled release was identified by this read-only final pass. The former signing-key mismatch, controller promotion, runtime publication and public discovery are no longer blockers according to the reviewed current evidence. Closing WEB006 is justified; broad `COMPLETED` is not. The useful next work belongs to explicit future activation/integration decisions, especially one reviewed production adapter and genuine reviewer/asset configuration, rather than more general audits of this release.

## Evidence integrity read in this review

| Evidence | SHA256 |
| --- | --- |
| Host reconcile evidence media-factory-host-reconcile-20260912T213431Z.json | `8e7d01e024c904e4aa0574adeaa26b156f6dc9dac6141b43b806260257f9d937` |
| c648711-deployed/host-observation.json | `a86ce9f71b5474294b019fe9b1faca328103a9b5e561cdee69980003b41a492e` |
| c648711-deployed/public-verification.json | `dfed4b92c218045a51ed27aa326c952acd11319b44aeecb46adb0c36d9e475fb` |
| /tmp/media-controller-promotion-evidence.json | `25538a99676e418faf6e9ccb8698a84b957e62feb2534b011a18b1eb36e934ce` |
| c648711 final signed receipt JSON | `5511aabe4421630eb094e9bc126b601d34ffdf6aa9e22bc3d54a61678656871e` |
| c648711 final detached signature | `941e632bee3d731feca3429ee46e692ab92b5ff84bf667f08d1ded3ec0e10738` |
| c648711 release-dossier.json | `8d589d080f655f92deb128e41c78bf5085ed92d60c36d90b1dbcf6118294c2f5` |
| MASTER_PRODUCT_PROMPT.md | `80f7620273548240185e83f383b31a9a0efc32fec271449853640d7d01db1278` |
| requirements.md | `708c5a16ddd4e96a996faa6db82310826b4acca00789c266cd4d2f32982649d0` |
| DESIGN_AND_DISCOVERY_ADDENDUM.md | `12824707b07a150d3423c773826aec4fb5aaedfcf918d7dbf9e5470d027aaa45` |

Installed host source: `aa40a01781d11f1857382b37037e6806bda6c5dd1235253ad9bafc45868716eb`; installed source/active dispatcher: `46ba8e16972806a6668cf37a39e91c48ddbae046379bfca041e52d0a43dde5b4`. Reviewed promotion package digest remains `cc2967edaaf00d356c5eaafd3757865bd6d5c6d297fb541069b20ae1582e5e42`. Public/candidate OG PNG: `080c7262f16a947da959362480261851c050b3b5f1c79f5305bf9f0778a9d57d`.

## Final delivery-document cross-check

Also read the release owner's new `c648711-deployed/RELEASE_REPORT.md`, `OPEN_BLOCKERS.json` and `current.md`. Their PARTIAL terminal claim, controlled active deployment, provider availability, retained-versus-new evidence labels, customer approval boundary and highest-value next step agree with the reviewed evidence and code limits. In particular, OPEN_BLOCKERS correctly distinguishes missing implementation from account configuration; it does not claim that entering provider credentials enables generative or mascot production. No material corrective finding is open against these document claims. They support closing the existing software/evidence node without asserting the master vision is complete. Actual final node transitions and terminal checkpoint still belong to the release owner's Graph operation.

Reviewed document hashes: RELEASE_REPORT.md `6f459a93f572eea334f8911b43e9589823ff942a9ad0ffe46b16e6b0ffea702d`; OPEN_BLOCKERS.json `89a12efa909a8ecd09d6bc25e096ac0686995584a39030c001a5d78faab2db1e`; current.md `d1fa9994cb9868f2e9688037e9c8b73c983ff09225df7b168d6cd7890c50f0f6`.
