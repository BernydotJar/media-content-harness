# Weekly Media Factory

The weekly factory turns one validated tenant profile, one Content DNA contract, and a small set of human-approved story concepts into production jobs that enter the existing Media Graph at `BRIEF`.

A plan is deterministic about governance, not creativity. It snapshots authorized source IDs and technical targets, while the Director still creates the treatment for each job.

## Job invariants

Every job:

- belongs to exactly one tenant;
- cites one or more source IDs already authorized in that tenant profile;
- uses only story devices present in the tenant's Content DNA;
- inherits the tenant's aspect ratio and duration range;
- starts at `BRIEF` in `media-graph-v1`;
- requires human approval;
- has `publication_action: none`;
- remains `PLANNED` until the Graph lifecycle advances it.

The weekly factory does not log into social networks, publish posts, spend synthetic-generation credits, or bypass Director/Critic/Verifier gates. Those effects remain explicit downstream actions.
