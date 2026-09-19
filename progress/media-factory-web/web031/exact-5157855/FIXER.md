# WEB031 Fixer record

Two non-hidden review loops were preserved.

## F1 — browser fixture route mismatch

The first clean browser run failed in the new spend-approval fixture because the Playwright interceptor covered `GET /api/v1/jobs/:id` but not the child `POST /api/v1/jobs/:id/approve-provider-spend` route. The application correctly returned `Production job was not found` for the synthetic fixture ID. This was a test-harness defect, not a product endpoint defect.

Fix: route the approval child endpoint explicitly in the browser fixture. The next clean exact browser journey passed.

## F2 — output DNS validation / download TOCTOU

Source review after the first candidate identified a real hardening issue: validating a media hostname with DNS and then calling generic `fetch()` allowed a second DNS lookup during the actual connection. A DNS-rebinding attacker could theoretically change the resolved destination between check and use.

Fix: provider media download now resolves and validates all addresses, then pins the actual Node HTTPS socket to one validated address while preserving the original hostname for TLS. Every redirect repeats the same validation and pinning process. Additional tests verify unsafe DNS failure and the pinned address passed to the media transport.

The exact final product SHA after this Fixer is `515785504c3dbb4d68492cd34dd360cce992be21`.
