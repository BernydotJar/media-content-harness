# SEO and studio entry — independent source and packaging review

Reviewer: graph_engineer_recovery, 2026-09-12. Producer files reviewed were authored by baseline_audit/root, not this reviewer. No application files were edited during this review. The separate CreativeActivity/QuickCreate test-helper cleanup was a producer fix and is not covered by this independent PASS.

## Conclusion

PASS for the repaired metadata/route privacy scope and inspected StudioEntry/OG source and asset packaging. Two initial findings were reproduced, accepted and fixed by the producer, then independently rechecked. Public host routing, full integrated browser completion, immutable software candidate release and final deployment remain separate gates.

## Resolved findings

1. P1: pageInfo initially rejected /jobs/:jobId/review, so the new catchall 404 gate removed a required existing review route. The producer added precisely that route shape, with a generic private title. Independent probe now resolves it, keeps noindex and does not include the supplied job identity in metadata.
2. P2: publicOrigin initially accepted private/internal service origins and could emit them in canonical/sitemap/OG metadata under production indexing. The producer rejects private/internal/loopback origins outside explicit test deployment. Independent probes rejected 10 concrete origins: loopback/CDP, single-label internal host, localhost, RFC1918 IPv4, link-local metadata address, IPv6 ULA/mapped loopback, .internal and .local. No canonical/OG/sitemap URL or public indexing survived those inputs. Explicit test mode remains an isolated testing exception and cannot enable production indexing.

## Independent execution

- node --test tests/web-site-metadata.test.mjs: 6/6 PASS, zero skipped.
- Additional direct module assertions: 10 private origins rejected; required review route generic/private; llmsText contains real newline-separated Markdown. No literal-backslash-newline defect was found.
- Source inspection: private pages do not interpolate tenant/job identities or source URLs. Only explicit production plus MEDIA_FACTORY_PUBLIC_INDEXING=1 may index public login. Unknown routes use semantic Next notFound. Discovery text describes general product behavior and does not expose private API/resource locators.
- StudioEntry uses the shared api('/auth/login') mapping to existing /api/preview/login, configured identity flow and current password autocomplete. It introduces no default credentials, new account store, provider execution or authorization bypass. No unsupported 419 claim is made.

## Actual assets and prepared runtime

- Hero WebP and social JPEG both decode through ffprobe as 1536x1024; no format tags were reported. Their SHA-256 identities are below. The hero is a compiled static import, available under the existing Next static asset namespace. The source manifest includes assets/.
- The OG route is force-static and the prepared runtime contains its already-generated PNG, so the runtime does not depend on the unshipped source JPEG to serve that artifact.
- Independently compared .next/server/app/opengraph-image.body with /tmp/media-factory-browser-e2e-xn3OT0/runtime/.next/server/app/opengraph-image.body: both 888,964 bytes, PNG dimensions 1200x630, SHA256 080c7262f16a947da959362480261851c050b3b5f1c79f5305bf9f0778a9d57d. This confirms packaging of that actual build artifact; it is not a fresh final candidate identity.
- StudioEntry labels the hero as conceptual AI artwork. Motion has explicit pause, reduced-motion, hidden-document and out-of-view controls; cleanup removes observers/listeners. The image has meaningful alt text, the form has visible labels, semantic headings and focus styling. Browser measurements belong to the integrated run.

## Remaining delivery evidence

The earlier integrated browser run aborted in the separately authored creative-navigation test helper after desktop/mobile submenu screenshots. It is not a completed E2E PASS. That helper now waits for its pending intercepted real requests before unregistering handlers and preserves the first test failure; the independent E2E executor must rerun it. The authenticated host edge's narrow discovery allowlist is reviewed and deployed separately. No public indexing or deployed route success is inferred from local metadata tests.

## Reviewed file identities

```json
{
  "server/site-metadata.mjs": "c746f34c9edc47da1cd1c22dee2533e41439a9da3b6a5a71ab334894293d8da0",
  "app/[[...segments]]/page.tsx": "25a8abfd5b209800bb643ac26e5db91a0cba2610dde1d13c0cacef3d921a6a6d",
  "app/layout.tsx": "cb82c941dc4c24988239730fef0a87f834ebb50bc25d1da90fa92e9480a2ebb7",
  "app/not-found.tsx": "3981a4b0c06d07dc988be1fff6edf711301bb6787a83f209a3895c63c57cfb44",
  "app/robots.ts": "648ae9058cb6985466915a95b8cb6a004ebd7dc5f4197a1b13aff00822a7b2ae",
  "app/sitemap.ts": "57b3e3dc6a69e58a92a07692c44dc396131fc3ca958a69e12c6656a1d44e6f1e",
  "app/llms.txt/route.ts": "a7259ad2338a4359640f8eada73e38f7dbe0b463085f083da86858fefdc107fc",
  "app/llm.txt/route.ts": "dd22ba5b06e6036bad3c8f22e3a881da3234f23c2e48766db55ed054faa155e5",
  "app/opengraph-image.tsx": "5809b5f7cdec8ee957373e5ee534a332280f7eb06a7bd821762ac1249ad54fc8",
  "components/StudioEntry.tsx": "4c93801f45dc2266acc07925dd499348a6abcec5211f283b7882da8f55c0cbbe",
  "components/StudioEntry.module.css": "8fa5dd6695b398550d4735ff2b276624edb3fb00262c244783df3ebbccefef00",
  "assets/media-factory-hero.webp": "3c478e2f764c37a605092db2fc528431be23dda219c7a6d21841f220e732b406",
  "assets/media-factory-social.jpg": "4aeece7f3b290fc3b67504b328119a57291d056d33892931b7b6fad83662148d",
  "tests/web-site-metadata.test.mjs": "320f7c54583dcbbfed4abe26b471e5b5deda6b7534fca41abaac4f3584e51ef8"
}
```

## Static OG follow-up — 2026-09-12

Independently rechecked the subsequent SEO change by baseline_audit: the image generator now lives at `server/social-image.tsx`, called by the explicit force-static GET route `app/opengraph-image/route.ts`. There is no longer an App Router special metadata filename that can override the page's explicit imported image. The catchall passes the compiled `assets/media-factory-og.png` URL to `pageMetadata`; it is constrained to a local PNG under `/_next/static/media/`. URL origins, protocol-relative values, traversal with slashes and query injection are rejected. OG and Twitter both use that same controlled image URL when an authorized public origin exists. Private page identity/canonical protections remain intact. This resolves the crawler path through the already permitted static-asset route without broadening private route access.

Focused independent rerun: `node --test tests/web-site-metadata.test.mjs` **7/7 PASS**. Source inspection confirms the route is statically generated and the imported PNG is the previously reviewed 1200x630 output. The committed asset and current compiled `.next/server/app/opengraph-image.body` have the same SHA256 `080c7262f16a947da959362480261851c050b3b5f1c79f5305bf9f0778a9d57d`. Full browser and deployed public image gates remain separate; no fresh browser result is claimed in this follow-up.

| Updated source | SHA256 |
| --- | --- |
| server/site-metadata.mjs | `d0b5e3365fab4467897a5b56f2a479e7c264737d3718abec5da795f75c678b59` |
| server/social-image.tsx | `f637658e6c761bc9b6b081369cc00dd0ce555ff3845c2756af9f75d10e845cde` |
| app/opengraph-image/route.ts | `995a398726919d96314f2d909e29ef10441c22cbb27836239f87bb63797b8023` |
| app/[[...segments]]/page.tsx | `4eb472d3644574c8f94406de774c8df356ca5b7aa21390ff64008b55a83c6066` |
| assets/media-factory-og.png | `080c7262f16a947da959362480261851c050b3b5f1c79f5305bf9f0778a9d57d` |
| tests/web-site-metadata.test.mjs | `f443cc4e7edae8dbf725bae72874f587603c1d8c683fb59af9c4416694aa5354` |
