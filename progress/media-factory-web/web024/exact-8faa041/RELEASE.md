# WEB024 — Mascot Avatar System v1 exact release

Product release SHA: `8faa041ad66d23fce6aa141c9104847bdb72fd4b`

Public URL: `https://media-factory.textilesdemedellin.com`

## Signed release identity

- Release bundle SHA-256: `172dd7a67c91350f7718f144d7bc4b03495655b039d69bf8b32cba1306a15f21`
- Critic public-key SHA-256: `396f01f4a75d758a68833bfa4aead35a6c61da66ba21fddc8a44cf809cadb724`
- Critic receipt SHA-256: `6a4498e8d9dc2fca02704cd41d9a5fd943dab417a5127714c84ecb68fbb39d96`
- Critic signature SHA-256: `6c3222893d8d7443474a4cadf0258b94fadef357ece269a589687ab5124eaeb6`
- Canonical finalizer SHA-256: `edff9a10ef314ca38473af0e741aa7121611764c90626ae2e2cf7f69c785fb82`
- Critic model: `ibm/granite3.3:2b`

## Host reconciliation

The authorized shared host control plane accepted the exact signed bundle and converged with both `desired_release_sha` and `last_commit` equal to the product candidate. Runtime, edge networking, local health, recovery, Caddy/tunnel, DNS/TLS/public checks, security and authorization layers passed.

## Public confirmation

- `/login`: 200 over verified TLS;
- public discovery routes: 200;
- `/favicon.ico`: 200 and byte-exact with the candidate;
- anonymous `/api/v1/me`: 401;
- anonymous `/api/v1/tenants/firmes/avatar-catalog`: 401;
- anonymous `/health`: 401;
- public health: `PASS_HTTP_200`;
- process recovery: `PASS`;
- no failing layer and no last error.
