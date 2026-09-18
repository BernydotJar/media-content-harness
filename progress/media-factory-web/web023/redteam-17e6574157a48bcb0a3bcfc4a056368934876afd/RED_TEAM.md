# WEB023 Red Team — Producer candidate 17e6574

Reviewed SHA: `17e6574157a48bcb0a3bcfc4a056368934876afd`

Verdict: **FAIL — material prompt-authority conflicts found**

## F1 — Character-source exclusions can contradict intentional avatar add-ons

The compiler currently emits the legacy `CHARACTER SOURCE EXCLUSIONS` instruction as “Ignore and delete” for hard hats, helmets, safety vests and other incidental source elements. The new construction and space avatar contracts can intentionally reintroduce exactly those semantic items. A provider therefore receives two authoritative-looking instructions and may remove a requested space helmet or construction safety vest.

Required repair: explicitly state that source exclusions apply only to accidental elements copied from the identity image and that an exact item intentionally selected by the structured avatar contract is allowed to be reintroduced. Keep environment leakage forbidden.

## F2 — User hard constraints can negate avatar identity / FIRMES brand-marker policy

A caller can supply `must_exclude` text such as “FIRMES logo” or “red mane” while the avatar contract simultaneously requires a visible FIRMES identifier and the canonical red mane. The compiler currently accepts both and emits a contradictory prompt.

Required repair: fail closed on hard constraints that explicitly negate mandatory brand-marker or core identity invariants. Operator override must also state that avatar identity, outfit/add-on, brand-marker and motion contracts are higher authority.

## F3 — MCP critic-plan tool accepts a hash-valid but stale avatar contract

`avatar.critic_plan` verifies the contract's self-hash, but it does not validate that the tenant's current identity pack/outfit/accessories/motion/scene authority still hashes to `avatar_authority_sha256`. A stale contract could therefore receive a critic checklist after catalog mutation.

Required repair: call the same `assertAvatarContractCurrent` authority check used by worker execution before returning the MCP critic plan.

## Non-findings

- Cross-tenant/unknown avatar IDs already fail closed.
- Missing turnaround views are represented as missing and are not fabricated.
- Existing generic tenants remain avatar-optional.
- The V1 model truthfully identifies motion as generative and does not claim a skeletal rig.
- No auth/provider/deployment/trust-root authority was added.
