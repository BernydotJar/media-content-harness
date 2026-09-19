# WEB039 — Audio Finishing Engine V12

Exact product SHA: `5be0229f08dc280036c7379116ba3ced61eee744`

V12 adds an explicit, deterministic audio-finishing capability after picture lock. It is not implemented as conditional clutter inside the existing video adapter.

The engine accepts a versioned `audio-finishing.v1` contract covering soundtrack start/gain, source-voice preservation and delay, sidechain ducking, an explicit human-approved outro IN/OUT with optional echo/reverb, mastering target, limiter/compressor policy, and exact duration lock.

Security and integrity invariants:
- soundtrack upload is authenticated, tenant-scoped and limited to owner/admin/editor;
- reviewers cannot mutate the master;
- media is bounded and magic-checked before use;
- semantic lyric markers are rejected: production requires explicit approved timecodes;
- the existing provider artifact is the immutable picture lock;
- FFmpeg stream-copies video and SHA-256 hashes the compressed video stream before/after; mismatch fails closed;
- finished audio is decoded and measured with EBU R128, true peak, 48 kHz stereo and A/V duration checks;
- audio finishing invalidates only `TECHNICAL_QA` and downstream;
- a later visual repair clears the prior audio master/execution while retaining the uploaded soundtrack as reusable input;
- review and release evidence bind original provider lineage plus audio-finishing lineage and output SHA.

The product UI exposes the capability as Music / Voice / Final / Master. No FFmpeg syntax is shown to end users.
