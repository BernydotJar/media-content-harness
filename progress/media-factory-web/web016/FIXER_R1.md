# WEB016 revision 1 — release evidence fixer

No product/runtime code was changed. The first Granite failure is preserved and the deployable exact candidate remains `20418c13e51cf07d2f068ba5144affd69f2a91b0`.

The repair is to the release evidence semantics only:

- split `open_material_findings` (empty) from `resolved_findings` (four exact controls already repaired and independently verified);
- make post-sign host reconciliation requirements explicit as `predeployment_conditions_not_defects` rather than ambiguous evidence gaps;
- bind each resolved finding to exact candidate code locations and named passing tests;
- state that the later `a696a45` verification commit changes only `graph/` and `progress/`, with no runtime-affecting path delta from the deployable candidate;
- preserve the first F/MATERIAL_FINDINGS raw response and diagnostic artifact instead of overwriting them.

Fresh Granite risk and ten-category rubric decisions are required. Any new FAIL remains blocking and no signature/deployment may be produced.
