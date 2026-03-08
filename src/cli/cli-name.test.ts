import { describe, expect, it } from "vitest";
import { DEFAULT_CLI_NAME, replaceCliName, resolveCliName } from "./cli-name.js";

describe("resolveCliName", () => {
  it("defaults to penguins when argv is missing a program name", () => {
    expect(resolveCliName(["node"])).toBe(DEFAULT_CLI_NAME);
  });

  it("keeps penguins when invoked directly", () => {
    expect(resolveCliName(["node", "/usr/local/bin/penguins"])).toBe(DEFAULT_CLI_NAME);
  });

  it("falls back to penguins for unknown binary names", () => {
    expect(resolveCliName(["node", "openclaw"])).toBe(DEFAULT_CLI_NAME);
  });
});

describe("replaceCliName", () => {
  it("rewrites penguins-prefixed commands", () => {
    expect(replaceCliName("pnpm penguins doctor", "penguins-dev")).toBe("pnpm penguins-dev doctor");
  });

  it("leaves unrelated command prefixes untouched", () => {
    expect(replaceCliName("pnpm openclaw doctor", "penguins-dev")).toBe("pnpm openclaw doctor");
  });
});
