# WEB035 — Local User Registration V11

Exact product SHA: `2e5eeb7607dd09697f0120c9791c330a4314e5a1`

Implemented municipality-scoped self-registration with name, email, Guatemalan DPI identifier and password. Registration is invitation/request state only: it creates no tenant membership and remains `PENDING_APPROVAL` until `owner` or `admin` approves inside the requested municipality and chooses an existing non-owner role.

DPI plaintext is never persisted or returned. Authentication stores a keyed HMAC-SHA256 lookup plus last four digits; the HMAC pepper is private durable state under the Media Factory data root. Passwords use salted scrypt verifiers. Duplicate registration responses are generic to prevent identity enumeration. Existing V10 Google access and configured administrative identities remain compatible.
