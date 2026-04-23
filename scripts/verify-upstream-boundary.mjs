#!/usr/bin/env node

import { execSync } from "node:child_process";
import { readFileSync } from "node:fs";

const UPSTREAM_REF = process.env.HARBORDEX_UPSTREAM_REF?.trim() || "upstream/main";
const HEAD_REF = process.env.HARBORDEX_HEAD_REF?.trim() || "HEAD";
const ALLOWLIST_PATH =
  process.env.HARBORDEX_ALLOWLIST_PATH?.trim() || ".harbordex/upstream-allowlist.txt";
const INCLUDE_WORKTREE = process.env.HARBORDEX_INCLUDE_WORKTREE === "1";

const OVERLAY_PATH_PREFIXES = [
  "apps/mobile/",
  "docs/harbordex/",
  ".harbordex/",
  "packages/harbordex-",
];

function run(command) {
  return execSync(command, {
    encoding: "utf8",
    stdio: ["ignore", "pipe", "pipe"],
  }).trim();
}

function normalizePath(value) {
  return value.replaceAll("\\", "/").replace(/^\.\//, "");
}

function readAllowlist(path) {
  const text = readFileSync(path, "utf8");
  return text
    .split(/\r?\n/u)
    .map((line) => line.trim())
    .filter((line) => line.length > 0 && !line.startsWith("#"));
}

function escapeRegExp(text) {
  return text.replace(/[|\\{}()[\]^$+?.]/g, "\\$&");
}

function compilePattern(pattern) {
  const normalized = normalizePath(pattern);

  if (normalized.endsWith("/")) {
    return {
      pattern,
      test: (candidate) => normalizePath(candidate).startsWith(normalized),
    };
  }

  const chunks = normalized.split("**").map((part) =>
    part
      .split("*")
      .map((segment) => escapeRegExp(segment))
      .join("[^/]*"),
  );

  const regex = new RegExp(`^${chunks.join(".*")}$`);

  return {
    pattern,
    test: (candidate) => regex.test(normalizePath(candidate)),
  };
}

function isOverlayPath(filePath) {
  const normalized = normalizePath(filePath);
  return OVERLAY_PATH_PREFIXES.some((prefix) => normalized.startsWith(prefix));
}

function ensureUpstreamRefExists() {
  try {
    run(`git rev-parse --verify ${UPSTREAM_REF}`);
  } catch {
    console.error(`[harbordex] Missing upstream ref: ${UPSTREAM_REF}`);
    console.error(
      "[harbordex] Configure and fetch upstream first, e.g. `git remote add upstream https://github.com/pingdotgg/t3code.git && git fetch upstream main`.",
    );
    process.exit(1);
  }
}

function changedFiles() {
  const committedOutput = run(
    `git diff --name-only --diff-filter=ACMR ${UPSTREAM_REF}...${HEAD_REF}`,
  );
  const files = new Set();

  for (const line of committedOutput.split(/\r?\n/u)) {
    const normalized = normalizePath(line.trim());
    if (normalized.length > 0) {
      files.add(normalized);
    }
  }

  if (INCLUDE_WORKTREE) {
    const stagedOutput = run("git diff --name-only --diff-filter=ACMR --cached");
    for (const line of stagedOutput.split(/\r?\n/u)) {
      const normalized = normalizePath(line.trim());
      if (normalized.length > 0) {
        files.add(normalized);
      }
    }

    const unstagedOutput = run("git diff --name-only --diff-filter=ACMR");
    for (const line of unstagedOutput.split(/\r?\n/u)) {
      const normalized = normalizePath(line.trim());
      if (normalized.length > 0) {
        files.add(normalized);
      }
    }

    const untrackedOutput = run("git ls-files --others --exclude-standard");
    for (const line of untrackedOutput.split(/\r?\n/u)) {
      const normalized = normalizePath(line.trim());
      if (normalized.length > 0) {
        files.add(normalized);
      }
    }
  }

  return Array.from(files).sort();
}

function main() {
  ensureUpstreamRefExists();

  const allowlist = readAllowlist(ALLOWLIST_PATH).map(compilePattern);
  const files = changedFiles();

  const violations = files.filter((file) => {
    if (isOverlayPath(file)) {
      return false;
    }

    return !allowlist.some((entry) => entry.test(file));
  });

  if (violations.length > 0) {
    console.error("[harbordex] Upstream boundary violation detected.");
    console.error("[harbordex] The following upstream files changed without allowlist coverage:");
    for (const file of violations) {
      console.error(` - ${file}`);
    }
    console.error(
      `\n[harbordex] Add explicit entries to ${ALLOWLIST_PATH} only for intentional fork patches.`,
    );
    process.exit(1);
  }

  const touchedCoreFiles = files.filter((file) => !isOverlayPath(file));
  console.log(
    `[harbordex] Upstream boundary check passed (${touchedCoreFiles.length} allowlisted core changes, ${files.length - touchedCoreFiles.length} overlay-only changes).`,
  );
}

main();
