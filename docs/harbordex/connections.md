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

## Why This Filtering Exists

- The desktop app is the canonical host for the local backend in this milestone.
- Showing host desktop sessions in remote client lists made the Connections UI noisy and confusing.
- Filtering keeps the UI focused on paired remote clients (mobile/tablet/other external sessions).

Harbordex is a fork of t3code.
