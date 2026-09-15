# WEB017 Fixer R1

Exact clean browser verification on `4c823c2a336039a75afbd3c781d2a7f1d29ba298` passed, including byte-exact favicon/app-icon delivery.

The exact FIRMES completion E2E then failed before the requested repair step because its new precondition was internally contradictory: the weekly-plan contract intentionally treats a non-null `character_id` as `mascot=true`, even when the raw fixture also supplied `mascot:false`. The first produced artifact therefore already contained the Caballito and the assertion expecting no brand assets was invalid.

Fix: keep the initial story genuinely mascot-free by setting `character_id:null`. The repair under test must then add the first-class tenant default Caballito from the authenticated review request. No production implementation behavior was weakened or changed by this fixture repair.
