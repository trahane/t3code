# Harbordex Overlay Architecture

Harbordex v2 is implemented as a fork-first overlay architecture.

## Goals

- Keep upstream core (`pingdotgg/t3code`) mostly untouched.
- Build Harbordex-specific behavior in Harbordex-owned overlays.
- Keep upstream wire contracts unchanged for rebase safety.

## Runtime Topology

- Desktop and web share the same renderer code in `apps/web`.
- Desktop development loads the Vite server from `apps/web`.
- Packaged desktop serves and loads the built web UI from the local backend.
- `apps/web` must stay in-tree for desktop to run.

## Workspace Ownership

Harbordex-owned overlays:

- `apps/mobile/`
- `packages/harbordex-*`
- `docs/harbordex/`
- `.harbordex/`

Upstream core (read-only by default):

- Existing `apps/desktop`, `apps/server`, `apps/web`, `apps/marketing`
- Existing `packages/*` that do not start with `harbordex-`

## Core Patch Policy

Core patches are allowed only when one of these is true:

1. Branding or attribution must change in user-facing surfaces.
2. Security/privacy requires disabling user tracking paths.
3. Build/test/release guardrails are required to enforce fork boundaries.
4. Mobile/native enablement requires minimal compatibility wiring.

Every intentional core patch must be recorded in `fork-patch-ledger.md`.

## Enforcement

Boundary enforcement is automated by `scripts/verify-upstream-boundary.mjs`.

- Overlay directories are always allowed.
- Core file changes must match `.harbordex/upstream-allowlist.txt`.
- CI fails if non-allowlisted core files are modified.

## Attribution

All user-facing surfaces should identify the product as Harbordex and include attribution:

> Harbordex is a fork of t3code.
