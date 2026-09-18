# WEB023 Fixer

Producer SHA `17e6574157a48bcb0a3bcfc4a056368934876afd` received a material Red Team FAIL with three findings:

1. Legacy identity-source cleanup could conflict with intentionally selected helmet/safety gear.
2. User hard constraints could contradict mandatory identity/FIRMES marker rules.
3. `avatar.critic_plan` accepted a self-hash-valid but stale authority contract.

Fixer SHA `8faa041ad66d23fce6aa141c9104847bdb72fd4b` repairs all three:
- source cleanup now distinguishes accidental source leakage from explicitly selected avatar items;
- hard constraints that remove FIRMES/red mane/white-horse identity fail closed;
- environment exclusions that contradict selected avatar gear fail closed;
- MCP critic-plan checks current tenant authority before generating a checklist;
- operator override is explicitly lower priority than avatar identity/outfit/add-on/marker/motion authority.

Additional adversarial tests cover each repaired path.
