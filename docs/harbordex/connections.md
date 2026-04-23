# Harbordex Connections Behavior

Harbordex keeps a single desktop-hosted backend and presents connection state in the **Connections** settings panel.

## Runtime and Diagnostics

- Desktop runtime status is read-only (backend status, endpoint, exposure mode).
- Network diagnostics include local URLs plus Tailscale diagnostics when available.
- Network diagnostics support manual refresh from the card header.

## Client Visibility Rules

- Desktop host sessions are hidden from authorized client lists.
- Desktop host sessions are hidden from the runtime **Connected clients** count.
- Connected client totals represent non-desktop sessions only.
- Mobile-focused lists continue to derive from the same session metadata store (no second trusted-device registry).

## Mobile Authorization Lifetime

- Mobile pairing QR/token credentials are intentionally short-lived and one-time use.
- After pairing, mobile bearer sessions are long-lived by default (10 years) and are expected to persist unless manually revoked.
- Session revocation remains the operator control point in **Connections** (individual revoke or revoke others).

## Why This Filtering Exists

- The desktop app is the canonical host for the local backend in this milestone.
- Showing host desktop sessions in remote client lists made the Connections UI noisy and confusing.
- Filtering keeps the UI focused on paired remote clients (mobile/tablet/other external sessions).

Harbordex is a fork of t3code.
