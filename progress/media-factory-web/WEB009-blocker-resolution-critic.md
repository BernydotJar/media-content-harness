# WEB009 — Critic / Red Team

Scope: directed recovery for `SOURCE_BYTES_REQUIRED` without changing media authority or publication behavior.

## Findings

1. **P2 — auto-resume query integrity.** The first Producer version accepted a syntactically valid `resume` job id from the query string and started it after an upload. Server authorization prevented privilege escalation, but a crafted link could requeue an unrelated job the same operator already controls. **Fixed:** fetch the target job first and require `job.tenant_id === current tenant` and `source_ids` contains the just-uploaded source before auto-resume.
2. **P2 — motion preference.** Focus recovery always used smooth scrolling. **Fixed:** `prefers-reduced-motion: reduce` uses `behavior: auto`.
3. **PASS — server authority.** Missing source IDs come only from the immutable job authorization snapshot and are filtered again before projection. No local path, cookie, credential, locator, or source bytes enter blocker metadata.
4. **PASS — no open redirect.** `return` is accepted only for `/jobs/<safe-id>`; all other values are discarded.
5. **PASS — same Graph resumes.** Uploading a source does not rebuild the plan/job. Focused execution evidence proves a blocked INGEST transitions through the same Graph to `CREATIVE_GATE` with an immutable source asset snapshot.

No material finding remains after the two fixes.
