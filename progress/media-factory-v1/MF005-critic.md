# MF005 Critic / Red Team

## Findings

1. Reference-only material could initially be selected as production media. Fixed: jobs require tenant sources explicitly marked `purpose=source`.
2. The weekly builder did not enforce the tenant cadence. Fixed: `on-demand` tenants cannot enter the weekly planner.
3. `week_of` accepted any real date. Fixed: it must be a Monday, making weekly plan identity deterministic.
4. Runtime inputs could bypass schema-level uniqueness for DNA observation IDs/devices. Fixed with explicit runtime uniqueness checks.

## Final conclusion

PASS. Weekly plans are deterministic governance artifacts: authorized production sources only, Content-DNA-bounded devices, human-approved story concepts, Graph entry at `BRIEF`, and no external publication action.
