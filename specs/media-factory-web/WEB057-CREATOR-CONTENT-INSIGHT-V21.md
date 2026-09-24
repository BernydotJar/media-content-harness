# WEB057 — Creator Content Insight V21

## Goal

Add a creator-discovery surface inspired by the **workflow shape** of creator search-insight products: capture a topic signal, make its provenance status explicit, identify a possible content gap, and turn it into a human-reviewed content plan.

This is not a TikTok clone and does not claim access to TikTok search analytics without an authorized connector.

## Runtime graph

```text
SIGNAL_CAPTURE
      ↓
TOPIC_SYNTHESIS
      ↓
CONTENT_GAP_REVIEW
      ↓
PLAN_DRAFT
  ┌───────────────┬──────────────┬─────────────────┬──────────┐
  │ idea          │ title        │ description     │ hashtags │
  └───────────────┴──────────────┴─────────────────┴──────────┘
      ↓
HUMAN_REVIEW
      ↓
READY_TO_CREATE
      ↓
Existing Media Factory creation flow
```

The machine-readable Graph Harness definition is `graph/creator-content-insight-v1.project.json`.

## Content-plan contract

Every plan contains:

- `idea`
- `title`
- `description`
- `hashtags[]`
- `purpose = informational`
- `audience_mode = general-audience`
- `automatic_publish = false`
- exact `plan_sha`

## Truthfulness and safety

- `signal.live_platform_data` remains `false` until a real authorized platform connector exists.
- User-provided URLs are references, not proof of platform analytics.
- Existing sensitive-trait targeting and voter microtargeting prohibitions remain enforced.
- For `public-affairs` tenants, Creator Insight is restricted to general-audience informational planning and rejects direct electoral persuasion or calls to vote.
- Human approval is required before the insight becomes `READY_TO_CREATE`.
- Approval is bound to the exact `plan_sha`; stale plans cannot be approved.
- Nothing publishes automatically.

## Acceptance

1. Create/list/get creator insights are tenant-bound.
2. A topic signal produces a deterministic editable draft with idea, title, description and hashtags.
3. UI shows the six-stage graph and source truthfulness.
4. Human can edit the draft and approve only the current plan hash.
5. Approved insight can seed the existing Free Create prompt.
6. Public-affairs direct electoral persuasion is rejected.
7. Tests cover tenant isolation, stale approval, API routing, graph shape and UI copy.
