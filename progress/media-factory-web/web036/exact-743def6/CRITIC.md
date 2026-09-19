# WEB036 revision 1 — V11 edge repair critic

Exact repair SHA: `743def614d157c4d7bcef83441e88ee69b5b2263`

The revision-0 release exposed a real integration defect: the application called anonymous `/api/v1/auth/municipalities` and `/api/v1/auth/register`, while the production form-session edge intentionally forward-authenticates those paths.

The repair does not widen the public edge. Municipality options are rendered server-side into the already-public `/login`, and self-registration is multiplexed through the already-allowed bounded `POST /api/preview/login` using `action=register`, which maps internally to the registration service.

IBM Granite 3.3 2B reviewed the exact repair SHA. Risk verdict: `P / NONE`. Enterprise rubric: 10/10 `P`, including security/privacy and fail-closed behavior.
