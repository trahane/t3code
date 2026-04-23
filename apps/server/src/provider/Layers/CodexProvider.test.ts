import assert from "node:assert/strict";
import { resolve } from "node:path";

import { describe, it } from "vitest";

import { buildCodexInitializeParams, resolveCodexHomePath } from "./CodexProvider.ts";

describe("resolveCodexHomePath", () => {
  it("resolves relative paths against the provider cwd", () => {
    assert.equal(
      resolveCodexHomePath({
        homePath: ".codex-alt",
        cwd: "/tmp/project",
      }),
      resolve("/tmp/project", ".codex-alt"),
    );
  });
});

describe("buildCodexInitializeParams", () => {
  it("includes codexHome in initialize params", () => {
    const params = buildCodexInitializeParams({
      homePath: ".codex-alt",
      cwd: "/tmp/project",
    });

    assert.equal(params.codexHome, resolve("/tmp/project", ".codex-alt"));
    assert.equal(params.capabilities?.experimentalApi, true);
  });
});
