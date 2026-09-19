# WEB029 Fixer

The Fixer closes two concrete verification/product issues discovered by Critic.

## F1 — first-run-aware multi-account verification

Added one shared browser helper for authenticated entry. Browser journeys now:

1. wait for either `/dashboard` or `/onboarding` after successful authentication;
2. when a genuinely new account receives the first-run guide, exercise the real `Saltar por ahora` action;
3. require `/dashboard` before continuing the role-specific workflow.

This preserves the owner-requested onboarding behavior instead of weakening the product to satisfy old tests. FIRMES, scene-generation, source-recovery, Ease and visual Ease verifiers use the shared contract.

## F2 — action feedback survives immediate Creation Room entry

Moved success feedback outside the `creatingNow` conditional in `JobDetail`. A supported review change can therefore transition immediately to QUEUED/Creation Room while still showing what the user just asked the system to do. A focused static regression test enforces the rendering order.

The FIRMES non-test journey now reaches the entire repair/review/release sequence again and verifies the same-job Caballito repair, separate Critic, separate Independent Verifier and final owner release.
