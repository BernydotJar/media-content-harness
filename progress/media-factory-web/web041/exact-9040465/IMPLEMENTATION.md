# WEB041 — Single-Operator Review Autonomy V13

Exact product SHA: `9040465de55b2a9924e6d8699fbe3a47059d4d0b`

V13 removes the current one-person operational deadlock without deleting reviewer separation globally.

Policy:
- `controlled_single_operator_preview`: tenant owner/admin may approve CRITIC and INDEPENDENT_VERIFIER on their own hash-bound production; admin is also admitted at CRITIC in this deployment class.
- `production`: the prior independent-review rules remain fail-closed. Producer cannot approve CRITIC; INDEPENDENT_VERIFIER must differ from producer and critic.
- reviewer role does not gain self-review autonomy merely because the deployment is a preview.
- the deployment class is server-controlled; there is no end-user toggle to bypass review separation.

Evidence semantics:
- self-review approvals are explicitly labeled `SINGLE_OPERATOR_PREVIEW` in durable job/release review history and stage evidence;
- UI explicitly displays `Modo operador único activo` and does not describe those decisions as independent;
- changing the deployment class back to production restores separation without migrating data.

Unchanged controls include exact candidate SHA, stage binding, role authentication, source snapshot checks, artifact SHA checks, Graph approval/gate history, and final release evidence.
