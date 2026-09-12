# Incremental Critic — execution

Reviewer: root coordinator, separate from execution Producer. Pre-candidate review; not a PASS gate.

- Graph human nodes initially approved but recordApproval requires spec_ready. Fix actual human-gate transitions, including localized repair revisions and explicit test-only stage semantics.
- FFmpeg first pass hardcoded360x640/silent output and treated duration range as Number(array), yielding NaN. Respect target resolution, aspect ratio and duration; preserve ambient audio when present.
- Uploaded media demuxer autodetection could interpret a playlist and access unintended protocols/files. Restrict accepted containers/demuxers/protocols for ffprobe and ffmpeg, with malicious-playlist regression coverage.
- Actual used source bytes must be snapshot-bound and truthful in provenance; do not claim all sources when only first source was consumed.
- Remove duplicate provider registry and capability IDs. Capability/paid status must reflect actual configured adapter and estimate.
- Evidence artifact paths must resolve to actual stored files for independent verification. Production release requires immutable software release identity.

Producer is repairing findings; final exact-candidate review and tests remain required.
