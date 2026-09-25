# WEB059 — Creator Insight Discovery V22

## Goal

Extend Creator Content Insight from a single drafting form into a lightweight discovery workspace inspired by creator-search-insight product patterns: explore recorded topics, review content-gap signals, inspect simple analytics, and continue into content creation.

The feature must remain truthful about its data source. V22 has **no live TikTok connector**. It may summarize only signals explicitly recorded inside the tenant workspace.

## Product surface

The workspace shows:

- total recorded signals;
- content opportunities explicitly marked by the team;
- draft plan count;
- approved plan count;
- chronological signal cards;
- text search over topic, observation, idea, title, description and hashtags;
- filters for opportunity, draft/approved state and signal type;
- the existing six-stage Creator Insight graph;
- the content plan fields **idea, title, description and hashtags**;
- exact-hash human approval and existing Create handoff.

## Discovery contract

`GET /api/v1/tenants/:id/creator-insights/discovery` returns:

- `schema_version = creator-content-discovery.v1`
- `source_scope = workspace-recorded-signals`
- `live_platform_data = false`
- `ordering = created_at_desc`
- `overview.total_signals`
- `overview.content_gaps`
- `overview.draft_plans`
- `overview.approved_plans`
- counts by signal type
- the tenant-authorized insight list

## Truthfulness and neutrality

- Workspace counts are not represented as TikTok search volume, popularity, demand or trend scores.
- The list is chronological, not an algorithmic recommendation ranking.
- Content-gap status is a human-entered workspace signal, not an inferred platform metric.
- Nothing auto-publishes.
- Existing sensitive-trait and voter-microtargeting prohibitions remain active.
- Public-affairs workspaces remain limited to general-audience informational planning; this feature does not recommend a political actor, message, audience, campaign choice or content priority.

## Acceptance

1. Discovery projection is tenant-bound and fails closed for outsiders.
2. Projection counts exactly match stored tenant insights.
3. Projection declares workspace-only provenance and no live platform data.
4. UI presents four overview counts and neutral chronological discovery copy.
5. UI search and filters operate on the current tenant list without inventing metrics.
6. Idea, title, description and hashtags remain first-class editable plan fields.
7. Exact plan approval and Create handoff remain unchanged.
8. Schema/example, unit/API tests, browser E2E, TypeScript, build and Graph validation pass.
