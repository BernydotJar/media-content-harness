# Single-Operator Review Autonomy V13

## Decision

Media Factory has two review policies. The policy is derived from the deployment class; it is not a user-controlled toggle.

### `controlled_single_operator_preview`

An authenticated tenant `owner` or `admin` may approve the same hash-bound artifact at `CRITIC` and `INDEPENDENT_VERIFIER` even when that person created the production or performed the prior review. Each durable approval and stage evidence is labeled `SINGLE_OPERATOR_PREVIEW`.

This removes the operational deadlock for the current one-person deployment while preserving all other controls: exact candidate SHA, current-stage binding, source snapshot checks, artifact SHA checks, Graph approval/gate history, role authorization, and final release evidence.

### `production` and multi-user deployments

Independence remains mandatory. The producer cannot approve `CRITIC`, and the critic cannot approve `INDEPENDENT_VERIFIER`. The prior `INDEPENDENT_REVIEW_REQUIRED` behavior remains fail-closed.

## Role authority

| Stage | Single-operator preview | Production |
|---|---|---|
| CRITIC | owner, admin, reviewer; owner/admin may self-review | owner or reviewer; producer must be different |
| INDEPENDENT_VERIFIER | owner/admin; owner/admin may be the prior critic | owner/admin; verifier must differ from producer and critic |
| RELEASE | owner/admin | owner/admin |

Reviewers do not gain single-operator authority merely because the deployment is a preview. The exception is limited to owner/admin operators.

## Evidence semantics

A self-review is not represented as independent verification. It is explicitly recorded as:

```text
review_policy = SINGLE_OPERATOR_PREVIEW
```

The UI also displays **Modo operador único activo** so the relaxed separation is visible rather than implicit.

## Migration

When Media Factory moves to a multi-user production deployment, changing the deployment class back to `production` immediately restores reviewer separation without migrating job data. Historical preview approvals retain their original `SINGLE_OPERATOR_PREVIEW` label.
