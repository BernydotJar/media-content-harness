# MF004 Critic / Red Team

## Findings

1. A deterministic tag-to-DNA generator would freeze creative judgment into code. The implementation was corrected to keep DNA generation in the existing Director/Critic creative layer and make the repository own the durable schema contract.
2. `story_devices` initially accepted arbitrary strings, which could carry copied source language under an abstraction label. The schema now uses a controlled versioned vocabulary.
3. Observation provenance and DNA abstraction are intentionally separate: the observation owns authorization, locator, and evidence SHA; DNA owns only observation IDs and abstract devices.

## Final conclusion

PASS. The reference layer is provenance-backed but does not become a transcript/caption store. Content DNA forbids direct text reuse, shot-for-shot copying, and source-audio reuse, and remains general-audience.
