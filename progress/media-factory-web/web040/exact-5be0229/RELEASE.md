# WEB040 — Audio Finishing Engine V12 release

Exact deployed SHA: `5be0229f08dc280036c7379116ba3ced61eee744`
Public URL: `https://media-factory.textilesdemedellin.com`

Media Factory now contains a native deterministic Audio Finishing Engine. A reviewed video can receive an authenticated soundtrack, voice-priority ducking, explicit approved outro timecodes with echo/reverb, mastering, and exact A/V synchronization without changing the compressed picture stream.

Technical authority remains split deliberately:
- human / Director: creative intent and approved source fragment;
- deterministic FFmpeg engine: audio execution;
- Technical QA: decode, EBU R128, true peak, 48 kHz stereo, A/V duration and picture-stream hash;
- Critic / Independent Verifier: fresh review of the new artifact hash;
- Graph Harness: localized invalidation, evidence freshness and release authority.

Golden-reference evidence is the existing FIRMES master at 19.750 s, -13.5 LUFS, -1.9 dBTP, 48 kHz stereo, decode PASS. The binary remains outside source control.

IBM Granite 3.3 2B exact-SHA review: risk `P/NONE`, rubric 10/10 PASS. The release bundle was cryptographically finalized using the trusted critic key and accepted by the controlled host reconciler.
