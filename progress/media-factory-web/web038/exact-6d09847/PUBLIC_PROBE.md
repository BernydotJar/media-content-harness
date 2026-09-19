# Public production probe — Sacatepéquez municipality catalog

Public URL: `https://media-factory.textilesdemedellin.com`
Exact deployed SHA: `6d0984758a511083bf6d8b5ff3028478c0caa37f`

`GET /login` returned HTTP 200 with TLS verification success and rendered exactly these 16 municipality options, in this order:

1. Antigua Guatemala
2. Jocotenango
3. Pastores
4. Sumpango
5. Santo Domingo Xenacoj
6. Santiago Sacatepéquez
7. San Bartolomé Milpas Altas
8. San Lucas Sacatepéquez
9. Santa Lucía Milpas Altas
10. Magdalena Milpas Altas
11. Santa María de Jesús
12. Ciudad Vieja
13. San Miguel Dueñas
14. Alotenango
15. San Antonio Aguas Calientes
16. Santa Catarina Barahona

The comparison against the product-owner supplied list returned `exact_order_match=True` and `municipality_count=16`.

Compatibility and isolation observations:
- Antigua Guatemala keeps tenant value `caballito`.
- Sumpango advertises the canonical lazy tenant value `firmes-sumpango` without materializing it merely by reading the login page.
- `POST /api/preview/login` with `action=register` reaches product validation (HTTP 400 `INVALID_INPUT` for intentionally incomplete input), proving the public registration channel remains available.
- Anonymous direct `/api/v1/auth/municipalities`, `/api/v1/auth/register`, and `/api/v1/me` each remain protected with HTTP 401.
- No production user was created by the probe.
