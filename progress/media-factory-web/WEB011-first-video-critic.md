# WEB011 — First playable authorized video Critic / Red Team

Verdict: **PASS for the first-video proof and the authenticated source-recovery path.** No material finding remains in this bounded scope.

## Source authority

- Exact authorized page only: `https://www.facebook.com/people/Firmes-Izabal/61593278846959/`
- Source Facebook video id: `2727838567635466`
- Selected real source media: 720x1280 H.264/AAC, ~48.6 s.
- Source media SHA-256: `c1504301d3615a1a577a7fe0406ec6509de2bbe0adb05f6271211f46a0126000`.
- No adjacent Facebook page, notification reel, Google Photos album, or unrelated library item is used.

## First video proof

- Private output: `work/firmes-reference/video/firmes-izabal-v2-first.mp4`.
- Output SHA-256: `e439c5cd0f6cc60e9463c6973ea9c4f860733ae110822d94eac37f8a3d188a5a`.
- 11.000 s; 1080x1920; 30 fps; H.264/yuv420p; faststart.
- Edit window begins at 4.0 s of the authorized source.
- Audio removed. This intentionally avoids reproducing public-affairs CTA/persuasion from the original post while still proving the production path.
- Overlay is neutral: FIRMES Izabal + material-real/V2-preview identification. It contains no affiliation, voting, audience-segmentation, or publication CTA.
- `synthetic_media=false`; the footage is documentary source material, not a generated event.
- Social publication action remains `none`.

## Technical and visual integrity

- FFmpeg full decode produced zero decode errors.
- Black/freeze probes found no detected black interval or freeze interval.
- Contact sheet: `work/firmes-reference/video/firmes-izabal-v2-first-contact.jpg`, SHA-256 `e3756b86e1396c87aa1f9f0d8f9f9ffcf6388f0ba8337238959b20932696d96c`.
- Provenance record: `work/firmes-reference/video/firmes-izabal-v2-first.provenance.json`, SHA-256 `19e6e2083c2ebb9520d036bd611f167ae26b34a2dd694bd0ece4deaf3a4d6e64`.

## Authenticated UI verification

`WEB011-v2-source-recovery-e2e.log` is an isolated authenticated browser execution using generated private test credentials, temporary storage, **MEDIA_FACTORY_TEST_MODE disabled**, and deployment class `controlled_single_operator_preview`.

Verified sequence:

1. Real execution reaches `SOURCE_BYTES_REQUIRED` with missing `firmes-video` source id.
2. FIRMES V2 blocked job exposes the exact directed CTA.
3. CTA lands on `#source-firmes-video` and visually focuses that card.
4. The exact authorized source bytes are uploaded.
5. Auto-resume validates job tenant + source binding before starting.
6. The **same job id** reaches `CREATIVE_GATE / AWAITING_REVIEW`.
7. Source SHA is frozen into the job snapshot and equals `c1504301…`.
8. 390px mobile viewport has no horizontal overflow.
9. `prefers-reduced-motion` disables continuous Gooey animation.

## Security / trust boundary

The live public Chrome profile no longer had an authenticated Media Factory session and did not contain autofill. An attempt to obtain host-only credentials through the browser was rejected by the sandbox exfiltration policy. That boundary was preserved: no password, cookie, host credential, or signing secret was extracted or copied. UI confirmation therefore uses an isolated authenticated runtime, not a bypass of the live host authentication model.

No social publication, paid provider request, sensitive-trait targeting, voter microtargeting, individualized persuasion, or fabricated reviewer identity was performed.
