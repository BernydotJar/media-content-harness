# WEB020 — Immersive V4 exact release

Release SHA: 5efaab0c4c6239c2c2586b756c64e245d01cb0c6
Public URL: https://media-factory.textilesdemedellin.com

## Signed release identity
- Release bundle SHA-256: 13991104a71cf17d325db876897f6be3c8c876a446c7a128911d5acb83b5ccf6
- Critic public-key SHA-256: 396f01f4a75d758a68833bfa4aead35a6c61da66ba21fddc8a44cf809cadb724
- Critic receipt SHA-256: b723b3c6414eacd90852c8a5bd7556515908d9cc16d3411fadcc0694a87b0128
- Critic signature SHA-256: 3892d0e844716c9eebff47695e792338fbd0160d124011235ae7d39b74fd4db2
- Canonical finalizer SHA-256: edff9a10ef314ca38473af0e741aa7121611764c90626ae2e2cf7f69c785fb82

## Host reconciliation
The shared host control plane converged with desired_release_sha and last_commit both equal to the exact V4 candidate. Public health and process recovery passed; there is no failing layer and no last error.

## Public confirmation
- /login: 200 over verified TLS
- public discovery routes: 200
- /favicon.ico: 200 and byte-exact with the V4 candidate
- anonymous /api/v1/me: 401
- anonymous /health: 401

The product destination is the persistent textiles domain. No temporary trycloudflare URL is the release target.
