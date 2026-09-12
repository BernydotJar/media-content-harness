# WEB002 design addendum — independent Critic

Reviewer: deployment_recovery, independent of the producers of this design/metadata addendum. Scope is current source, focused executable checks and inspection of delivered image bytes. This report does not approve public deployment, final build identity, browser interaction or shared-control-plane changes.

## Current verdict

PASS_FOR_CANDIDATE_VERIFICATION: the bounded P2 text-contrast finding is closed by the independent recheck below. No open P0/P1/P2 finding remains in this reviewed scope. Final exact-candidate packaged browser verification and public release remain separate gates.

### P2 — small access text needs sufficient contrast

The help text explaining how to obtain an account uses #847b6d on #fcfbf7 at 10–11px: calculated sRGB contrast 4.028:1. The footer label uses #9d9383 on #fcfbf7 at 7px: 2.925:1. The placeholder uses #938b7e on #f4f1eb: 2.988:1. These textual controls/copy need at least 4.5:1; darken their colors, preserving the layout. The decorative section number is aria-hidden and excluded from this finding. Exact calculations use standard relative luminance (linearized sRGB, 0.2126/0.7152/0.0722) and the actual opaque CSS backgrounds.

## Verified source behavior

- StudioEntry reuses the shared API helper. Its login call is explicitly routed to /api/preview/login, which is the existing anonymous form-session entry contract; no login bypass or new authentication authority is introduced. Required username/password labels, autocomplete, busy prevention, accessible error and skip link remain present.
- Hero image alt text describes the abstract artwork. The visible caption calls it conceptual AI artwork, separating it from customer source evidence. Motion stops for reduced-motion preference, hidden tabs, offscreen visibility or explicit pause. The latest CSS gives the pause control a 44px minimum target and limits motion to visual transform/opacity layers. No measured frame-rate claim is made.
- CreativeActivity decorates the existing real Loading status only. Text remains authoritative, the canvas is aria-hidden, initial motion is paused, preference/visibility listeners are removed on unmount, and the installed thinking-orbs 0.3.1 implementation cancels its animation frame on pause. This adds no fake Graph, provider, generation or review state.
- QuickCreate links to existing authorized workspace Guided/Free routes. It does not start production or mutate plans. The maintained Radix 2.1.24 menu supplies keyboard, Escape, touch and pointer-grace behavior; the installed source contains its grace polygon checks and CSS uses data-highlighted rather than conflicting hover selection. Empty and loading workspace states have bounded navigation behavior.
- Metadata derives only from generic route descriptors and a validated operator origin. It does not load tenant names, job titles, source URLs or credentials, and does not trust incoming Host/forwarded headers. Private pages omit canonical and Open Graph page URLs; preview/test remains noindex/nofollow/noarchive with disallow-all robots and empty sitemap. Public indexing requires explicit production + HTTPS + opt-in and includes login only.
- The identified inherited-object-key route bug is fixed with Object.hasOwn on both lookup tables. constructor, toString and __proto__ root/workspace cases now return null; the catchall calls notFound instead of rendering malformed titles or throwing. Actual HTTP 404 at the final candidate remains covered by the separate browser gate.
- Current OG implementation is app/opengraph-image/route.ts plus server/social-image.tsx, force-static, using the social JPEG. Catchall metadata imports the committed PNG into /_next/static/media for the existing public static-asset edge contract. The source rejects arbitrary image URLs/path traversal. Exact final build must compare both generated route bytes and imported image bytes.

## Independent evidence

- node --test tests/web-site-metadata.test.mjs: PASS 7/7, zero skips; /tmp/media-design-critic-seo-final.log. Covers indexing, private identities, origin injection/infrastructure origins, inherited-key routes, generic discovery text and bounded imported-image path.
- pnpm typecheck: PASS; /tmp/media-design-critic-typecheck-final.log.
- node --check tests/e2e/creative-navigation.mjs and tests/e2e/studio-entry.mjs: PASS. Browser helpers were reviewed for real delayed-request loading, keyboard/pointer/touch navigation, pause/reduced-motion and visible error flows; syntax checks do not establish browser success.
- Inspected the actual 1200x630 PNG from /tmp/media-factory-browser-e2e-xn3OT0/opengraph-image.png visually and by PNG dimensions/SHA. SHA256 080c7262f16a947da959362480261851c050b3b5f1c79f5305bf9f0778a9d57d matches assets/media-factory-og.png. It contains the red glass artwork, warm neutral background, legible product text and no customer data. This is diagnostic artifact evidence predating the final static-import build.
- Original hero delivery was visually inspected. Its caption/alt and documented conceptual provenance are consistent with the image. The original imagegen generation hash/prompt is producer provenance documented in MEDIA_FACTORY_DESIGN.md, not an independently witnessed generation run by this reviewer.

## Public-edge boundary and concrete controller proposal

The existing form-session renderer permits anonymous GET/HEAD only for /login, /favicon.ico and /_next/static/*. The imported OG image can use that existing contract. App robots/sitemap/llms/llm paths still require an explicit controlled extension before claiming anonymous public delivery. Unknown anonymous routes continue through authentication, so application 404 does not imply a public edge 404.

An uninstalled proposal is isolated in /tmp/media-public-discovery-proposal/: host_reconciler.py and productctl.py copies, unified patches, README.md, test_public_discovery.py and tests.log. It adds an explicit repeatable --public-get-path / public_get_paths field, independently validated by dispatcher and host. Nonempty values are allowed only for media-factory + form_session_single_operator and only the five exact paths /robots.txt, /sitemap.xml, /llms.txt, /llm.txt, /opengraph-image. The field can opt into the four text routes while OG uses the existing static-asset path. Default empty preserves legacy behavior. Wildcards, APIs, traversal, query values, duplicates, wrong types/products/policies fail closed; no POST/auth/health/session behavior widens.

Six isolated proposal tests pass, including byte-identical legacy renderings for both access policies and other products, exact scope, invalid inputs, method/auth preservation and validation before release work. These are producer tests of a proposal, not independent control-plane approval, actual Caddy execution or public smoke.

Canonical authority remains /shared-auth/deployment/host-reconciler/host_reconciler.py; dispatcher source is host-reconciler/productctl.py and active dispatcher /shared-auth/deployment/productctl.py. Host backing directory is /Users/eduardosacahui/.cloud-sandbox-mcp-data/shared-auth/deployment. The existing system/com.cloud-sandbox.host-deployment-reconciler LaunchDaemon executes that controller on a 60-second schedule and registry changes. There is no productctl controller-update command. The documented installer installs/restarts launchd and copies the dispatcher, so it must not be rerun during active reconciliation. Shipping controller files inside a product archive does not install the shared authority.

No shared controller, registry, Caddy, tunnel, credential, signing key or daemon was modified by this reviewer. Canonical hashes remained host 074cfea8afb469c112c87724e892862ffd8dfb2e52863d160349eb8509ee69bd and source/active dispatcher f282304749348053bec91fc9607dd1b06f844cb0c9c1c2fc05e475ab5cb8ab69 after proposal preparation. Promotion requires reviewed versioned source, hash comparison, reversible backups, atomic replacement respecting the existing lock, then normal reconciler-driven Caddy generation and signed release/security/restart/public smoke gates. Only those later gates establish public discovery delivery.

## References inspected

- https://libraries.dev/orbs and installed thinking-orbs source/types (the installed API uses theme).
- https://www.smashingmagazine.com/2023/08/better-context-menus-safe-triangles/
- https://www.radix-ui.com/primitives/docs/components/dropdown-menu and installed Radix menu source.
- Appllama source is identified in producer design provenance; this reviewer does not claim a separate skill execution.

## Reviewed source snapshot

Captured UTC 2026-09-12T20:25:19.126759+00:00

| File | SHA256 |
| --- | --- |
| components/StudioEntry.tsx | 4c93801f45dc2266acc07925dd499348a6abcec5211f283b7882da8f55c0cbbe |
| components/StudioEntry.module.css | 8fa5dd6695b398550d4735ff2b276624edb3fb00262c244783df3ebbccefef00 |
| components/CreativeActivity.tsx | 8ab31bc37fd0d20d5d0116e630b400a0c547940d8824b0faab480195e659afeb |
| components/CreativeActivity.module.css | 431bbaefe0d7e94f743f0e904cc3cda6158c21d2f097ddd72f216564f1ff491f |
| components/QuickCreate.tsx | dd30e3175ebac85f7d88569151d8c5f799f1f1c09d6fff44528f4a2b382bd07f |
| components/QuickCreate.module.css | 94a6a671c85688e7bcff17b97041d1130e9eb5c7e117f95ef8629009e4754d0b |
| components/ui.tsx | 94d94723a8774a1ea8f579e76bd98cfb9c02e75cd3d5cab94b578104a6bcf263 |
| components/studio.tsx | f1e44df8cc2153dc8faa0ab72bb8a406abb22141fea3369ac77580194e2c9e3c |
| server/site-metadata.mjs | d0b5e3365fab4467897a5b56f2a479e7c264737d3718abec5da795f75c678b59 |
| server/social-image.tsx | f637658e6c761bc9b6b081369cc00dd0ce555ff3845c2756af9f75d10e845cde |
| app/opengraph-image/route.ts | 995a398726919d96314f2d909e29ef10441c22cbb27836239f87bb63797b8023 |
| app/[[...segments]]/page.tsx | 4eb472d3644574c8f94406de774c8df356ca5b7aa21390ff64008b55a83c6066 |
| app/layout.tsx | cb82c941dc4c24988239730fef0a87f834ebb50bc25d1da90fa92e9480a2ebb7 |
| app/not-found.tsx | 3981a4b0c06d07dc988be1fff6edf711301bb6787a83f209a3895c63c57cfb44 |
| app/robots.ts | 648ae9058cb6985466915a95b8cb6a004ebd7dc5f4197a1b13aff00822a7b2ae |
| app/sitemap.ts | 57b3e3dc6a69e58a92a07692c44dc396131fc3ca958a69e12c6656a1d44e6f1e |
| app/llms.txt/route.ts | a7259ad2338a4359640f8eada73e38f7dbe0b463085f083da86858fefdc107fc |
| app/llm.txt/route.ts | dd22ba5b06e6036bad3c8f22e3a881da3234f23c2e48766db55ed054faa155e5 |
| app/globals.css | d6069190d941352b5d3fce782234a6124facd015196b72306fe26cc4cc674cda |
| next.config.mjs | 74a17a39182f237ba04e5f31e171ccd750a89991dc3f91dbab5d7d7ba3848e6e |
| assets/media-factory-hero.webp | 3c478e2f764c37a605092db2fc528431be23dda219c7a6d21841f220e732b406 |
| assets/media-factory-social.jpg | 4aeece7f3b290fc3b67504b328119a57291d056d33892931b7b6fad83662148d |
| assets/media-factory-og.png | 080c7262f16a947da959362480261851c050b3b5f1c79f5305bf9f0778a9d57d |
| docs/MEDIA_FACTORY_DESIGN.md | ca47fd0aaa8ab5e5b8578c599de62c4ff35c72e1038822da9aaf365e792ce92f |
| docs/MEDIA_FACTORY_SEO.md | 1b3ff77f23757de16e67e7ce1e02dc44b23f05dca8c7e350961d53601847e478 |
| tests/web-site-metadata.test.mjs | f443cc4e7edae8dbf725bae72874f587603c1d8c683fb59af9c4416694aa5354 |
| tests/e2e/creative-navigation.mjs | 37995f87c9ff3504e974b93b2c99c905a0c055a74b2fe19db43026bb34f78582 |
| tests/e2e/studio-entry.mjs | 15dc8c06a2dd5669e60e3769bb202d8d48c211f27be0f32f9aea4dd677f7dc42 |
| tests/e2e/studio.mjs | a415f2679765e4b0a10a6b185101d2f296843a78b0fba2777780e89ec0258ee1 |
| scripts/web-source-state.mjs | 602a879af22534cf49ed3f390ce57346d1c28d9550e4a30d0cef5c6c210c61e4 |
| package.json | 9675e044d4543b99290b7ae6ada537544afe0c87eaa470cd653075659c6f6de5 |
| pnpm-lock.yaml | cd3046725222c734208abe031078b404e2e97bcfeb314479ca9abded0ed84fb8 |
| specs/media-factory-web/DESIGN_AND_DISCOVERY_ADDENDUM.md | 12824707b07a150d3423c773826aec4fb5aaedfcf918d7dbf9e5470d027aaa45 |

## Independent Fixer recheck — contrast closure

The producer changed exactly the three affected text colors to #70685b. Re-read selectors and absence of the previous colors pass. Computed contrast is now 5.309:1 over #fcfbf7 and 4.876:1 over #f4f1eb, exceeding 4.5:1. This closes the P2 without changing layout or behavior; no broader tests are needed for this CSS-only correction.

Superseding StudioEntry.module.css SHA256: 5c35a0d2ebe8910134687d29f6844b95775acb53680c3aae7d0ae4b697b73086
