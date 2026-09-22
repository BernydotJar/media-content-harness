# WEB048 — Audio File Input V16 release

Exact deployed product SHA: `2ddfd159e3f4f585b2c4b88162701adf2a179c49`
Public URL: `https://media-factory.textilesdemedellin.com`
Reconcile request: `1ac799fb-9a6a-45ec-a2ff-7db6bd05a74d`

V16 is released as part of the cumulative V16+V17 candidate. Studio soundtrack upload now accepts bounded, magic-checked MP3, WAV and M4A/MP4 inputs while preserving private storage, existing role authority, deterministic Audio Finishing, picture lock and measured QA.

Release proof:
- canonical Granite receipt/signature for the exact SHA;
- host reconciler L1–L9 PASS;
- public health PASS_HTTP_200 and process recovery PASS;
- `/login` public 200; discovery routes 200; anonymous `/health` 401; anonymous `/api/v1/me` 401;
- full exact suite 249 tests / 248 PASS / 0 FAIL / 1 pre-existing SKIP;
- detached clean build/browser verification PASS.
