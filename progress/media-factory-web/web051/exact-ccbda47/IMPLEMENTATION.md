# WEB051 — Short-Clip Audio QA V18

Exact product SHA: `ccbda476f59cc3dd27837c54c6dd77095cba8f7d`

## Real acceptance finding

A real 4.8-second authorized FIRMES job (`mf_67c8b0fa506f858690cf404623ce7668`) reached Audio Finishing with the real extracted soundtrack. The first master correctly failed technical QA because integrated loudness missed the -14 LUFS target.

V18 adds a bounded one-pass audio correction path while preserving the exact picture stream and introduces a retry action for technical audio-QA blockers. It also prevents a stale source-duration repair message from overriding the active audio blocker.

## Verified behavior

- same job and same picture lock are preserved;
- retry does not restart provider production or consume paid-generation budget;
- resulting master is 4.8 s, 48 kHz stereo, -14.0 LUFS and -1.4 dBTP;
- output SHA `5d13c46a3fc76b042a4b26e6fe677b0cb31c64affac24f6f8df8406a947c704e`;
- Audio Finishing returns the job to Critic with zero blockers;
- Q200 weekly ledger remains at Q0 for this local real-footage/audio demo;
- date selection `2026-09-23` normalizes to Monday `2026-09-21` before submit;
- Dashboard and Create both expose the weekly usage card after hydration.

## Verification

Detached exact-SHA verifier: 45/45 targeted PASS, TypeScript PASS, build PASS, browser PASS, contracts PASS, dependency audit PASS.
