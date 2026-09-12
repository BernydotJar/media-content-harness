# Authenticated Browser Bridge

Media Content Harness treats authenticated browser access as an external execution adapter, never as authoritative product state.

## Boundary

Chrome CDP remains private to the local host/bridge. It must not be exposed through a public hostname or persisted as a credential-bearing endpoint. The product consumes only sanitized observations produced under `media-browser-policy`.

Authentication does not imply source authorization. Every browser operation requires an explicit authorization record containing an ID, an exact or bounded-prefix locator, and a declared purpose (`reference` or `source`).

## Read-only contract

Allowed product operations are intentionally semantic rather than raw CDP commands:

- `discover-authorized-page`;
- `inspect-main-content`;
- `capture-main-evidence`.

The policy explicitly denies navigation, script evaluation, clicking, typing, submission, downloads, cookie/storage reads, messages, comments, reactions, and publishing.

A bridge implementation may use the browser's accessibility tree and a clipped screenshot of the public `main` region. It must not return account navigation, cookies, storage, unrelated tabs, private messages, notifications, or websocket debugger URLs as production evidence.

## Evidence handoff

A sanitized observation contains only:

- authorization ID;
- authorized public locator;
- bounded visible text;
- bounded article text observations;
- optional SHA-256 of separately stored visual evidence.

Browser state itself remains ephemeral. The Graph ledger records the authorization and sanitized evidence artifact, not the authenticated session.

## macOS / Docker Desktop

The already-established local bridge may keep Chrome bound privately on port `9222`. Docker Desktop can reach the Mac host through its host bridge, while Chrome stays outside public routing. If Chrome rejects a non-localhost HTTP Host header, the bridge layer must normalize that request locally rather than exposing CDP to the Internet.
