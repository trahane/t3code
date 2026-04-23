# Harbordex Mobile RPC

Harbordex mobile uses native t3 contracts directly.

## Authentication and Connection Flow

1. Resolve pairing target (`pairing-url` or `host + pairing code`).
2. Exchange pairing credential at `/api/auth/bootstrap/bearer`.
3. Issue websocket token at `/api/auth/ws-token`.
4. Connect WebSocket RPC at `/ws?wsToken=...`.

## Token Lifetime Policy

- Pairing credentials remain short-lived by default (5 minutes) and are one-time use.
- WebSocket bootstrap tokens remain short-lived by default (5 minutes).
- Mobile bearer sessions are now issued as long-lived credentials (10 years) so paired mobile clients stay authorized across network changes until manually revoked from **Connections**.
- Mobile clients do not locally invalidate stored bearer sessions based on cached expiry timestamps; they always attempt server validation first.

## Supported orchestration flows

- Turn start (`thread.turn.start`)
- Approval respond (`thread.approval.respond`)
- Structured input respond (`thread.user-input.respond`)
- Turn interrupt (`thread.turn.interrupt`)
- Thread stream subscription (`orchestration.subscribeThread`)

## Notes

- No compatibility bridge protocol is introduced in v2.
- Existing wire contracts remain unchanged for upstream compatibility.
