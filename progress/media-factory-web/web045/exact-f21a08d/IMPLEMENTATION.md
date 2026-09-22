# WEB045 — Review UX Simplification V15

Exact candidate SHA: `f21a08da32e4803b5aa93bab3e40a895cefbfde2`

V15 makes review decision-first instead of dashboard-first.

Primary review surface:
- centered media is the dominant visual element;
- no four-step progress strip or operational status card once a job is review-ready;
- one primary action: `Aprobar y continuar` (or `Aprobar entrega` at release);
- one secondary action: `Pedir un cambio`;
- optional tertiary entry: `Abrir Studio` for owner/admin/editor only when a video is reviewable.

Studio separation:
- Audio Finishing does not render on normal `/jobs/:id` review;
- audio controls render on private `/jobs/:id/studio`;
- Studio does not render approval controls;
- server-side audio mutations remain restricted to exact tenant roles `owner/admin/editor`;
- review approval remains on the existing exact-candidate server authorization path.

Progressive disclosure:
- implementation label `SINGLE_OPERATOR_PREVIEW` is removed from the primary decision surface;
- `Quién puede aprobar esta etapa` explains authority in user language;
- IDs, hashes, provenance, audio QA, review history, evidence and Graph stages remain under collapsed `Más información` disclosures.

Blocked and recovery states retain their explicit recovery action and progress context; only review-ready states remove operational chrome.
