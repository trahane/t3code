# Upstream Sync Workflow

Harbordex tracks upstream `pingdotgg/t3code` and rebases fork patches regularly.

## One-time setup

```bash
git remote add upstream https://github.com/pingdotgg/t3code.git
git fetch upstream main
```

## Sync local main to upstream

```bash
git checkout main
git pull --ff-only origin main
git fetch upstream main
git merge --ff-only upstream/main
git push origin main
```

## Rebase an active Harbordex branch

```bash
git checkout <feature-branch>
git fetch upstream main
git rebase upstream/main
```

If conflicts occur, prefer preserving overlay modules and minimizing core patch drift.

## Boundary validation

Run before opening a PR:

```bash
node scripts/verify-upstream-boundary.mjs
```

To validate unstaged local edits too:

```bash
HARBORDEX_INCLUDE_WORKTREE=1 node scripts/verify-upstream-boundary.mjs
```
