# Media Factory public metadata and discovery

Every supported studio screen has a generic page title and description. Metadata never reads tenant records, job titles, source URLs, or credentials. `/login` is the public product and sign-in surface; `/` remains the private dashboard. Unknown catchall routes call Next `notFound()` and return the custom semantic 404 page.

Canonical and social URLs use only the configured `MEDIA_FACTORY_PUBLIC_ORIGIN`, validated as a bare HTTP(S) origin, rejecting local/infrastructure addresses and the browser-debug port outside isolated tests. Incoming Host, forwarded headers, query parameters and tenant identifiers cannot change them. Private screens omit canonical and Open Graph page URLs and emit `noindex, nofollow, noarchive`. APIs and `/health` also emit `X-Robots-Tag` with these restrictions.

The controlled preview and test deployment classes disable all indexing. `/robots.txt` disallows crawling and `/sitemap.xml` contains no URLs. A future public deployment can explicitly set `MEDIA_FACTORY_PUBLIC_INDEXING=1` **and** `MEDIA_FACTORY_DEPLOYMENT_CLASS=production` with an HTTPS public origin to index `/login` only. Workspaces, jobs, review, releases and APIs never enter the sitemap. Robots metadata is a discovery policy; authentication remains enforced separately by the services.

`/opengraph-image` generates a static 1200×630 PNG brand card through Next `ImageResponse`; it contains no customer information. The actual Open Graph and Twitter tags use a compiled `/_next/static/media/` copy, which the existing edge already serves publicly. Browser tests compare both PNG byte sequences and the committed image to prevent drift. `/llms.txt` describes the public product, distinguishes configured providers from available capabilities, and links only to login. `/llm.txt` serves the same document as the explicitly requested alias. Neither file grants access to private resources.

## Existing host contract

The existing edge already serves `/login` and assets under `/_next/static/*`. The bounded discovery extension must pass unauthenticated GET requests for exactly `/robots.txt`, `/sitemap.xml`, `/llms.txt` and `/llm.txt`, preserving their MIME types. Do not broaden this to all `/_next/*` or private API routes. The application returns a semantic 404 for unknown routes when reached directly or with a valid edge session; anonymous unknown paths remain subject to the existing edge authentication policy. These application changes do not promise a public edge 404 or edit the host control plane. The host preview access policy and default `noindex` remain in force.

## Validation

`tests/web-site-metadata.test.mjs` covers preview/public indexing, exclusion of private identities, rejected origin injection, route validation and discovery text. Browser E2E additionally checks actual HTML titles/descriptions/canonical/robots, the PNG signature and dimensions, public discovery responses, and the visible semantic 404 with an HTTP 404 status.

Implementation follows the official Next.js [metadata API](https://nextjs.org/docs/app/api-reference/functions/generate-metadata), [metadata routes](https://nextjs.org/docs/app/api-reference/file-conventions/metadata), [ImageResponse](https://nextjs.org/docs/app/api-reference/functions/image-response), and [notFound](https://nextjs.org/docs/app/api-reference/functions/not-found) contracts.
