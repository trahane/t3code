# Harbordex

Harbordex is a desktop-first coding workspace for agentic development.

Harbordex is a fork of t3code.

## Architecture

- `apps/desktop`: Electron shell and local backend process manager
- `apps/web`: shared renderer UI used by desktop and web
- `apps/server`: local backend and CLI runtime

`apps/web` is required for desktop and should not be removed.

## Installation

> [!WARNING]
> Harbordex currently supports Codex and Claude.
> Install and authenticate at least one provider before use:
>
> - Codex: install [Codex CLI](https://github.com/openai/codex) and run `codex login`
> - Claude: install Claude Code and run `claude auth login`

### Run without installing

```bash
npx t3
```

The CLI command remains `t3` in v2.0 for upstream compatibility.

### Desktop app

Install the latest desktop app from [GitHub Releases](https://github.com/trahane/t3code/releases), or from your package manager:

#### Windows (`winget`)

```bash
winget install T3Tools.T3Code
```

#### macOS (Homebrew)

```bash
brew install --cask t3-code
```

#### Arch Linux (AUR)

```bash
yay -S t3code-bin
```

## Compatibility And Defaults

- Internal identifiers remain t3-style in v2.0 (`@t3tools`, `T3CODE_*`, CLI package `t3`).
- Default local state path is `~/.harbordex`.
- `T3CODE_HOME` is still supported, and `HARBORDEX_HOME` is also accepted by desktop.

## Some notes

We are very very early in this project. Expect bugs.

We are not accepting contributions yet.

Observability guide: [docs/observability.md](./docs/observability.md)

## If you REALLY want to contribute still.... read this first

Before local development, prepare the environment and install dependencies:

```bash
# Optional: only needed if you use mise for dev tool management.
mise install
bun install .
```

Read [CONTRIBUTING.md](./CONTRIBUTING.md) before opening an issue or PR.

Need support? Join the [Discord](https://discord.gg/jn4EGJjrvv).
