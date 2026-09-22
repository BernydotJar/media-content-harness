# Review UX V15 — decision first

## Problem

The job review page exposed editing tools, release authority labels, hashes, provider provenance, evidence and Graph stages at the same visual level as the actual user task: watch the piece and decide whether it is ready. Audio Finishing was especially disruptive because it appeared between the media preview and the approval decision even when the user did not intend to edit audio.

## Interaction model

The default review route is intentionally narrow:

1. See the current piece.
2. Approve and continue, or ask for a change.
3. Open Studio only when advanced editing is actually needed.

`/jobs/:id/studio` is a private editing surface. Audio Finishing lives there, not in normal review. The existing deterministic audio contract, picture-lock checks, authorization and review lifecycle are unchanged.

## Progressive disclosure

The former large “Detalles técnicos” surface is replaced by `Más información`, collapsed by default. The first expanded level summarizes state, tool, material count and review count. IDs, hashes, provenance, audio measurements, review history, evidence and internal stages require additional explicit disclosure.

## Authority language

Backend review policy is unchanged. The main decision surface no longer exposes implementation labels such as `SINGLE_OPERATOR_PREVIEW`. A collapsed `Quién puede aprobar esta etapa` disclosure explains authority in user language and preserves transparency without competing with the decision.

## UX invariants

- Normal review never renders Audio Finishing controls.
- Eligible editors see an optional `Abrir Studio` entry point.
- Studio does not render the approval decision panel.
- Returning from Studio restores the normal review surface.
- Technical and audit evidence remains available but is never expanded by default.
- Review actions still bind to the exact candidate SHA and existing server-side authorization.
- Review-ready jobs hide the four-step progress strip and operational status card so the media and decision dominate the viewport.
- Approval is one primary action; change request and Studio are visually secondary.
