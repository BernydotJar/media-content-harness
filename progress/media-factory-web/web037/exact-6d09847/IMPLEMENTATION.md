# WEB037 — Sacatepéquez municipality catalog V11.1

Exact SHA: `6d0984758a511083bf6d8b5ff3028478c0caa37f`

The departmental access catalog now contains exactly 16 Sacatepéquez municipalities in the product-owner supplied order. The catalog is a strict allowlist rather than a projection of arbitrary tenants.

Existing municipality workspaces are reused by territory. The production Antigua workspace keeps its existing `caballito` tenant identity instead of being renamed or duplicated. Missing municipal workspaces are materialized lazily only when a registration request targets that trusted catalog entry; configured tenant-creation operators receive owner membership in that workspace in the same transaction.

The login selector displays municipality names only. Municipality selection is mandatory for self-registration, while configured administrative break-glass login remains compatible without a tenant selection. Self-service login still fails closed in the backend without a selected authorized municipality.
