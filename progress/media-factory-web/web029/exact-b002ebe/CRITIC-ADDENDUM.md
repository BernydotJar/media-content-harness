# WEB029 Critic addendum — second finding exposed during Fixer verification

## F2 — success feedback was hidden when a requested change immediately re-entered the Creation Room

After repairing the first-run login contract in multi-account E2Es, the FIRMES verifier progressed farther and exposed a real UX defect inherited from V7.

`request-changes` correctly detects the supported `ADD_FIRMES_MASCOT` repair and immediately moves the same job to `QUEUED`. That makes `creatingNow=true`. The success message (`Listo: agregaremos el Caballito FIRMES...`) was rendered only inside the non-Creation-Room branch, so the user was immediately shown the Creation Room but lost the confirmation of what change had just been accepted.

This violates the product principle behind both V7 and WEB025: when a user takes an action, the next screen must make it clear what happened and what is now being created.

**Required repair:** render action success feedback outside the `creatingNow` branch so it stays visible above both the Creation Room and the regular review/status surface. Add a focused regression test proving the feedback precedes the Creation Room branch. Keep the same-job repair and Graph state semantics unchanged.
