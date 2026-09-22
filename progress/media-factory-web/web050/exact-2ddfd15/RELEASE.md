# WEB050 — Weekly Usage Budget V17 release

Exact deployed product SHA: `2ddfd159e3f4f585b2c4b88162701adf2a179c49`
Public URL: `https://media-factory.textilesdemedellin.com`
Reconcile request: `1ac799fb-9a6a-45ec-a2ff-7db6bd05a74d`

V17 is live with server-enforced weekly paid-generation governance:
- Q200 hard weekly cap per tenant;
- Q154 maximum for new paid generations;
- Q46 protected repair reserve;
- one new paid AI video per local day, max Q22 estimate;
- up to two reviewed paid repairs per week, max Q23 each;
- no rollover and no automatic overage;
- atomic owner/admin reservation, exact spend scope, fail-closed recovery and no fabricated refund of committed provider spend;
- GTQ-first approval UX with provider USD retained only as secondary reference.

Release proof:
- canonical Granite receipt/signature for exact SHA, verdict PASS, zero material findings, 10/10 rubric PASS;
- host reconciler L1–L9 PASS;
- public health PASS_HTTP_200 and process recovery PASS;
- public `/login` and discovery routes PASS, anonymous private/auth endpoints remain denied;
- exact full suite 249 tests / 248 PASS / 0 FAIL / 1 pre-existing SKIP;
- primary browser E2E 44 checks PASS, including Q14.81 exact-scope spend approval;
- detached clean build/browser verification PASS.
