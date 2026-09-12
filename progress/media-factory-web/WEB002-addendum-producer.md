# WEB002 addendum — metadata and browser Producer/Fixer checkpoint

Producer/Fixer: baseline_audit. Independent critics: deployment_recovery and graph_engineer_recovery. No commit or self-approval is made in this report.

Supported pages now have generic titles/descriptions without private record reads. Login alone has a public canonical; private routes and APIs are noindex. Preview/test remains nonindexable, and a future public production login requires explicit operator indexing configuration and a validated HTTPS origin. Infrastructure, private IPs, local hostnames and debug port 9222 cannot become a production canonical. Loopback remains allowed solely for isolated test deployment.

Strict server-side route recognition invokes the custom semantic 404 for unknown paths, including inherited JavaScript property names; `/jobs/:id/review` remains a recognized private review surface. Private IDs never enter metadata strings. The default 404 and login use semantic main/heading/navigation structure; browser tests check the real HTTP404 status.

Robots and sitemap honor preview indexing restrictions. llms.txt and its requested llm.txt alias describe only public product facts. The Open Graph image is generated from local brand assets, without external fetches. Social metadata uses the committed PNG imported into Next's existing public static-assets route; a regular force-static `/opengraph-image` route preserves the generator without Next metadata-file precedence overriding that static URL. E2E compares the generated PNG, imported PNG response and committed PNG bytes.

## Validation and fixes

- Final focused SEO tests: 7/7 PASS, zero skipped; typecheck PASS. Logs in WEB002-addendum/seo-tests.log and seo-typecheck.log.
- Independent Critic found prototype-property route lookup, missing job review route, and unsafe infrastructure origins. All were reproduced or located, repaired and covered by adversarial regressions.
- The first addendum browser diagnostic reached the new surfaces but failed in the delayed-network test helper with an unhandled route-continuation error; it is not counted as a completed pass. Its producer repaired waiting/cleanup and error preservation.
- The second diagnostic completed typecheck, build and 33 browser checks with exit 0. It executed an allowlisted runtime package, including actual generated hero bytes, pause/reduced-motion behavior, visible/keyboard/touch navigation, pointer diagonal submenu handling, actual video Range 206 and seek, release provenance, real download SHA, mobile layouts and SEO/404 responses. The diagnostic JSON is WEB002-addendum/diagnostic-browser.json.
- Diagnostic buildID eO9WwJNfynweo0veAMHCu; production source SHA 1ea358cb50aa95d25eab40064df4621c7abc5c3aa0c437c8757b56490a90e3f1; candidate_sha=null and working_tree_dirty=true. Its package 1453 files had zero forbidden entries or external symlinks. Artifact and browser download SHA both 0fe5ea45fda5a9cadb8ce1e623c0db288ca849b1d53415539fd8aa4d682c9af1; video sought to 0.5 s with readyState 4 and no error.
- Login desktop/mobile and released library mobile were inspected. The latest hero has readable captions, a 44 px pause control and an intact mobile form. Final release-mobile screenshot setup now resets scroll/focus before capture so fixed-header positioning reflects the top of the page.

## Pending exact-candidate verification

The static public OG route adjustment and screenshot setup change were added after the 33-check diagnostic. Only focused tests/typecheck cover those final deltas so far; the next clean immutable candidate must be rebuilt and run with --require-clean. The diagnostic is not exact-SHA release evidence. No third diagnostic is required absent a newly observed failure.

The existing edge serves login/static assets. Only robots.txt, sitemap.xml, llms.txt and llm.txt require a bounded public GET extension. Anonymous unknown paths remain subject to existing host authentication; application 404 is verified directly or with an edge session. This change does not modify the host control plane.

## Final checkpoint file identities

```json
{
  "app/layout.tsx": "cb82c941dc4c24988239730fef0a87f834ebb50bc25d1da90fa92e9480a2ebb7",
  "app/[[...segments]]/page.tsx": "4eb472d3644574c8f94406de774c8df356ca5b7aa21390ff64008b55a83c6066",
  "app/not-found.tsx": "3981a4b0c06d07dc988be1fff6edf711301bb6787a83f209a3895c63c57cfb44",
  "app/robots.ts": "648ae9058cb6985466915a95b8cb6a004ebd7dc5f4197a1b13aff00822a7b2ae",
  "app/sitemap.ts": "57b3e3dc6a69e58a92a07692c44dc396131fc3ca958a69e12c6656a1d44e6f1e",
  "app/llms.txt/route.ts": "a7259ad2338a4359640f8eada73e38f7dbe0b463085f083da86858fefdc107fc",
  "app/llm.txt/route.ts": "dd22ba5b06e6036bad3c8f22e3a881da3234f23c2e48766db55ed054faa155e5",
  "app/opengraph-image/route.ts": "995a398726919d96314f2d909e29ef10441c22cbb27836239f87bb63797b8023",
  "server/site-metadata.mjs": "d0b5e3365fab4467897a5b56f2a479e7c264737d3718abec5da795f75c678b59",
  "server/social-image.tsx": "f637658e6c761bc9b6b081369cc00dd0ce555ff3845c2756af9f75d10e845cde",
  "assets/media-factory-og.png": "080c7262f16a947da959362480261851c050b3b5f1c79f5305bf9f0778a9d57d",
  "tests/web-site-metadata.test.mjs": "f443cc4e7edae8dbf725bae72874f587603c1d8c683fb59af9c4416694aa5354",
  "tests/e2e/studio.mjs": "a415f2679765e4b0a10a6b185101d2f296843a78b0fba2777780e89ec0258ee1",
  "tests/e2e/studio-entry.mjs": "15dc8c06a2dd5669e60e3769bb202d8d48c211f27be0f32f9aea4dd677f7dc42"
}
```
