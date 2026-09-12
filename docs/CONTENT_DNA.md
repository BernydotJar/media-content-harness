# Reference Observations and Content DNA

Reference analysis is intentionally split into two durable records.

## 1. Reference observation

A `reference-observation.v1` record belongs to one tenant and one authorized source. It stores provenance (`authorization_id`, public locator, evidence SHA-256) and structured observations such as format, pacing, branding level, and controlled visual/story elements.

It is not a transcript store. Source captions, quotations, scripts, verbatim dialogue, and copied audio are outside this contract.

## 2. Content DNA

A `content-dna.v1` record cites observation IDs rather than carrying the source itself. The Director abstracts transferable creative principles into story devices such as activity-first storytelling, place-as-character, participatory brand reveal, recurring character bridges, or human-scale intimacy.

Content DNA is a design language, not a clone recipe. Every record is general-audience and carries immutable copying constraints:

- no direct source-text reuse;
- no shot-for-shot copying;
- no source-audio reuse.

## Director rule

When a reference page inspires a pattern, describe the reusable mechanism rather than the exact scene. For example, an observed handmade brand moment becomes a participatory brand reveal; it does not become an instruction to reproduce the same person, prop, framing, caption, or sequence.

## Provenance rule

Reference observations retain authorization and evidence hashes. Content DNA retains only observation IDs plus abstractions. This separation lets the factory learn a visual grammar without turning reference material into undocumented production assets.
