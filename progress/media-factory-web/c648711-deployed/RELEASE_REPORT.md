# Media Factory Web — verified delivery, 2026-09-12

FINAL STATE: **PARTIAL_WITH_DOCUMENTED_BLOCKERS**. A working controlled-access Web product is delivered; the complete generative creative-production vision is not claimed complete.

| Field | Verified value |
| --- | --- |
| Product URL | https://media-factory.textilesdemedellin.com/login |
| Health URL | https://media-factory.textilesdemedellin.com/health — authenticated 200; anonymous 401 by policy |
| Repository | https://github.com/BernydotJar/media-content-harness |
| Branch | main |
| Software release SHA | c648711cd2cf53d6371c1de5504165f4b423eda8 |
| Deployment | active / converged; controlled_single_operator_preview |
| Host request | 3f932cee-be65-4206-8460-3e442b08c355 |
| Graph | Actual pinned runtime 477bdcc3d390c30eb49d823e5c7fd105fee2cc4d; final event ledger and terminal checkpoint are authoritative |
| Executable production provider | FFmpeg, REAL_FOOTAGE; deterministic provider remains test-only |
| External providers | Seedance, Higgsfield, CapCut and Gemini: INTEGRATION_REQUIRED |

## Delivered behavior

The reusable studio provides authenticated workspaces, authorized uploaded video sources, reference observations and Content DNA, Guided and Free draft planning, asynchronous real Graph jobs, progress, distinct-role human review and immutable media-release snapshots. Sources, reviews and hashes belong to each release. During repair the preview shows only the current candidate; earlier delivered versions remain accessible from release history. Provider selection remains separate from the core domain.

The entry page uses original red/amber artwork with controlled dramatic motion, a pause control and reduced-motion behavior. Metadata has separate titles/descriptions, canonical URLs, Open Graph/Twitter image, semantic HTML and custom 404. Public robots.txt, sitemap.xml, llms.txt and llm.txt work through the existing shared host. This private preview deliberately remains noindex with an empty sitemap. Anonymous unknown private paths still redirect to login rather than exposing workspace routing.

The design implementation reviewed [Appllama](https://github.com/Appllama/appllama-skills), uses actual [Libraries.dev Thinking Orbs](https://libraries.dev/orbs), and uses Radix submenu pointer grace consistent with [safe triangles](https://www.smashingmagazine.com/2023/08/better-context-menus-safe-triangles/). The original image-generation prompt and asset provenance are in docs/MEDIA_FACTORY_DESIGN.md.

## Verification without repetition

Passing baseline evidence is retained: 89 tests, 13 contracts, typecheck/build and production dependency audit at 83d7783. Later focused tests cover worker/provenance, ranges, provider capability, metadata and controller/promotion changes. These sets overlap and are not summed as unique tests.

The integrated browser walkthrough passed 33 checks on an explicitly labeled dirty-tree diagnostic build. Exact per-file hashes demonstrate reuse for unchanged production behavior. It is not relabeled as a fresh clean-candidate run. The final clean c648711 build passed four new OG/contrast/runtime checks and an independent 1,450-file package audit (zero forbidden files or external symlinks). See ../TEST_REUSE_CHECKPOINT.md and ../c648711/.

Two actual IBM Granite3.3:2b reviews passed against the exact candidate dossier (risk P, rubric 10/10 P); the unchanged authorized finalizer issued the detached signed receipt. The existing host reconciler deployed the immutable signed source archive and passed release, runtime, network, local health, restart recovery, Caddy, tunnel, DNS/TLS/public access, security and authorization layers. Its session proof records login200, workspace200, logout303 and revoked401.

Independent public verification ran once after deployment: five groups / 26 anonymous requests passed, including public OG identity, GET/HEAD discovery routes, MIME/indexing, private-route denial, discovery POST denial, blocked public session endpoint and protected health. Existing app suites, browser workflows and host smoke were not rerun.

## Boundaries and next step

See OPEN_BLOCKERS.json for owners and concrete remaining work. Generative/hybrid execution, mascot compositing, arbitrary creative repairs, automated browser reference observation and unrestricted creative conversation are not delivered capabilities. Missing external adapters require implementation as well as authorized account configuration. The live preview has one operator; production media review requires separately provisioned real reviewers. No customer media approval, paid generation, or social publication occurred.

Highest-value next step: provision distinct production reviewers and provide authorized footage for the working FFmpeg path. Then connect one agreed generative/mascot finishing provider with its account, cost limit and licensed creative inputs.

The host owns private operator credentials; access instructions are in docs/MEDIA_FACTORY_WEB.md. No credentials are included in this report. Recovery preserves durable media state. Container restart is verified; a rollback to a previous Media Factory application release is not claimed on first onboarding.

All host/public records in this directory are persistent, hash-manifested evidence. Software c648711 remains the deployed signed candidate; later main commits carry audit and Graph completion records only.
