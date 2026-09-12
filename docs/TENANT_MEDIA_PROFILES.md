# Tenant Media Profiles

Media Factory is multi-tenant by contract. A tenant profile contains reusable brand and production metadata but never browser credentials or authenticated session material.

Each tenant owns a unique `tenant_id`, `runtime_namespace`, and opaque `browser_context_ref`. The browser reference is an identifier only; filesystem profile paths, cookies, storage state, tokens, passwords, websocket debugger URLs, and similar material are rejected.

Source authority is also tenant-local. Every source record declares an ID, public locator, authorization state, exact/prefix scope, and purpose (`reference` or `source`). A public locator may appear in more than one tenant only through a separate authorization record in each tenant; browser/runtime namespaces may never be shared.

## Audience boundary

The factory supports community, public-affairs, commercial, nonprofit, and media contexts. The reusable contract is deliberately `general-audience` only. Sensitive-trait targeting and voter microtargeting are represented as hard `false` invariants, not feature flags.

## Production defaults

Profiles can set aspect ratio, weekly/on-demand cadence, and a duration range. Story-specific treatments still own the final creative decision and source authorization.
