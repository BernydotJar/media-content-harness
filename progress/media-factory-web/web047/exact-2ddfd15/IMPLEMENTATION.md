# WEB047 — Audio File Input V16

Exact cumulative candidate SHA: `2ddfd159e3f4f585b2c4b88162701adf2a179c49`
V16 implementation lineage includes `f23f7af` and `1299358`; the candidate above is the exact cumulative release candidate independently verified with V17.

V16 closes the soundtrack input gap in Studio without widening audio-finishing authority:

- accepts real MP3, WAV and M4A/MP4 soundtrack uploads in addition to MP4;
- MIME is allowlisted and bytes are magic-checked before inspection;
- unsupported or MIME-disguised input fails closed;
- upload remains bounded to 40 MB;
- stored soundtrack bytes remain private durable job assets;
- mutation remains restricted to `owner/admin/editor`;
- the finishing contract still binds an exact approved soundtrack asset ID, picture-lock SHA and deterministic FFmpeg execution;
- output QA still verifies picture stream identity, duration lock, loudness/peak and 48 kHz stereo output.

Exact evidence:
- full repository suite: 249 tests / 248 PASS / 0 FAIL / 1 pre-existing SKIP;
- focused release suite: 19/19 PASS;
- detached verifier suite covering Audio Finishing, provider spend, V17 budget and runtime packaging: 23/23 PASS;
- primary and detached production builds PASS;
- primary and detached browser E2E PASS;
- typecheck, 13 contract examples and production dependency audit PASS.
