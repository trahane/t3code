# Harbordex Mobile RPC

Harbordex mobile uses native t3 contracts directly.

## Authentication and Connection Flow

1. Resolve pairing target (`pairing-url` or `host + pairing code`).
2. Exchange pairing credential at `/api/auth/bootstrap/bearer`.
3. Issue websocket token at `/api/auth/ws-token`.
4. Connect WebSocket RPC at `/ws?wsToken=...`.

## Supported orchestration flows

- Turn start (`thread.turn.start`)
- Approval respond (`thread.approval.respond`)
- Structured input respond (`thread.user-input.respond`)
- Turn interrupt (`thread.turn.interrupt`)
- Thread stream subscription (`orchestration.subscribeThread`)

## Notes

- No compatibility bridge protocol is introduced in v2.
- Existing wire contracts remain unchanged for upstream compatibility.
