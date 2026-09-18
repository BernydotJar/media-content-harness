# WEB024 Release Independent Verifier

Verdict: **PASS**.

Independent public/control-plane checks confirm:
- `desired_release_sha == last_commit == 8faa041ad66d23fce6aa141c9104847bdb72fd4b`;
- reconciliation state `converged`;
- result `DEPLOYED_CONTROLLED_SINGLE_OPERATOR_PREVIEW`;
- public health `PASS_HTTP_200`;
- process recovery `PASS`;
- no failing layer and no last error;
- TLS verification succeeds;
- public login/discovery routes return 200;
- anonymous private API, avatar catalog and health return 401;
- deployed FIRMES favicon bytes match the exact candidate.
