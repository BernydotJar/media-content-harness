# Login Municipality Boundary V14

## Problem

The departmental login UI displayed a municipality selector, but the selector was required only during registration. A configured local account could therefore submit credentials without a municipality. After authentication, a one-tenant shell could visually adopt its only available tenant, which made the experience look as if Media Factory had silently chosen Antigua Guatemala.

This was not a cross-tenant membership bypass for self-service accounts, but it was an unacceptable authority and UX ambiguity for departmental distribution.

## V14 rule

Departmental sign-in is municipality-bound.

- The public login form requires a municipality whenever the public municipality catalog is available.
- Client submit logic also fails closed with `MUNICIPALITY_REQUIRED` if a blank municipality reaches the handler.
- Self-service local accounts continue to require `tenant_id` server-side.
- Configured non-system-admin accounts now also require `tenant_id` server-side.
- A configured account may enter only a municipality represented by one of its memberships.
- `system_admin` remains the deliberate break-glass exception through the explicit `administrative_login` path and may authenticate without municipality for administrative recovery. This exception is not exposed as the normal departmental flow.
- A configured identity with zero memberships may still establish an unbound session for first-run onboarding or access-denied flows; it cannot enter any municipality because it has no membership. Once it has any membership, the normal backend path requires an explicit municipality.
- No code selects Antigua Guatemala, `caballito`, or the first membership as a login default.

## Distribution invariant

Pressing Enter on the public departmental login with the municipality left on “Selecciona tu municipio” must not create a session and must not navigate into a workspace.

The server independently enforces the same boundary for non-system departmental identities, so bypassing browser validation does not create an unbound departmental session.

## Host reconciler compatibility

The versioned departmental endpoint `/api/v1/auth/login` never infers administrative access. The legacy `/api/preview/login` adapter used by the controlled host reconciler may translate an old no-tenant probe into `administrative_login:true`. This translation is safe because the shared authentication service still requires `system_admin=true`; ordinary configured identities receive `FORBIDDEN`. This preserves the L9 form-session deployment probe without reopening the public departmental fallback.
