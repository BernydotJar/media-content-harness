# WEB049 — Weekly Usage Budget V17

Exact candidate SHA: `2ddfd159e3f4f585b2c4b88162701adf2a179c49`

V17 makes the Q200 weekly paid-generation allowance an enforceable server-side policy rather than descriptive copy.

Default policy:
- Q200 hard weekly cap per tenant, `America/Guatemala`;
- Q154 maximum allocation for new paid generations;
- Q46 protected repair reserve;
- one new paid AI video per local day, max Q22 estimated;
- up to two reviewed paid repairs per week, max Q23 each;
- no daily or weekly rollover and no automatic overage.

Authority/integrity:
- USD estimates are converted to a policy-bound GTQ quote (reference rate 7.63 for this policy version);
- spend scope hashes job revision, provider/model, prompt/request, estimate, inputs, policy version, category and GTQ amount;
- owner/admin approval recomputes the quote and reserves budget atomically in the same repository transaction as approval;
- two concurrent approvals cannot consume the same daily slot;
- a changed scope releases only an unsubmitted reservation;
- provider submission commits the reservation; successful collection settles the estimate;
- committed provider spend is not fabricated back without authoritative final-cost evidence;
- an in-flight first provider request stays `NEW_GENERATION` during recovery and is never reclassified into a repair;
- paid repair requires both a prior paid attempt and a later human-reviewed repair revision;
- local FFmpeg, authorized local composition and Audio Finishing do not consume the paid-generation ledger.

UX:
- `Q200 incluidos` is presented as a protected creation week, not an open credit wallet;
- user sees `1 video IA hoy`, protected weekly capacity and protected repair capacity;
- spend approval uses GTQ as the primary value and keeps provider USD as secondary reference;
- the browser E2E verifies the Q14.81 six-second Seedance upper-bound example and exact-scope approval.

Exact evidence:
- V17 policy tests: 8/8 PASS;
- exact focused release suite: 19/19 PASS;
- full repository suite: 249 tests / 248 PASS / 0 FAIL / 1 pre-existing SKIP;
- detached verifier: 23/23 focused PASS, build PASS, browser E2E PASS, dirty=0;
- primary browser E2E: 44 checks PASS including GTQ budget UX;
- typecheck, 13 contracts and production dependency audit PASS.
