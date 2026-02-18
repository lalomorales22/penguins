import { describe, expect, it } from "vitest";
import {
  buildParseArgv,
  getFlagValue,
  getCommandPath,
  getPrimaryCommand,
  getPositiveIntFlagValue,
  getVerboseFlag,
  hasHelpOrVersion,
  hasFlag,
  shouldMigrateState,
  shouldMigrateStateFromPath,
} from "./argv.js";

describe("argv helpers", () => {
  it("detects help/version flags", () => {
    expect(hasHelpOrVersion(["node", "penguins", "--help"])).toBe(true);
    expect(hasHelpOrVersion(["node", "penguins", "-V"])).toBe(true);
    expect(hasHelpOrVersion(["node", "penguins", "status"])).toBe(false);
  });

  it("extracts command path ignoring flags and terminator", () => {
    expect(getCommandPath(["node", "penguins", "status", "--json"], 2)).toEqual(["status"]);
    expect(getCommandPath(["node", "penguins", "agents", "list"], 2)).toEqual(["agents", "list"]);
    expect(getCommandPath(["node", "penguins", "status", "--", "ignored"], 2)).toEqual(["status"]);
  });

  it("returns primary command", () => {
    expect(getPrimaryCommand(["node", "penguins", "agents", "list"])).toBe("agents");
    expect(getPrimaryCommand(["node", "penguins"])).toBeNull();
  });

  it("parses boolean flags and ignores terminator", () => {
    expect(hasFlag(["node", "penguins", "status", "--json"], "--json")).toBe(true);
    expect(hasFlag(["node", "penguins", "--", "--json"], "--json")).toBe(false);
  });

  it("extracts flag values with equals and missing values", () => {
    expect(getFlagValue(["node", "penguins", "status", "--timeout", "5000"], "--timeout")).toBe(
      "5000",
    );
    expect(getFlagValue(["node", "penguins", "status", "--timeout=2500"], "--timeout")).toBe(
      "2500",
    );
    expect(getFlagValue(["node", "penguins", "status", "--timeout"], "--timeout")).toBeNull();
    expect(getFlagValue(["node", "penguins", "status", "--timeout", "--json"], "--timeout")).toBe(
      null,
    );
    expect(getFlagValue(["node", "penguins", "--", "--timeout=99"], "--timeout")).toBeUndefined();
  });

  it("parses verbose flags", () => {
    expect(getVerboseFlag(["node", "penguins", "status", "--verbose"])).toBe(true);
    expect(getVerboseFlag(["node", "penguins", "status", "--debug"])).toBe(false);
    expect(getVerboseFlag(["node", "penguins", "status", "--debug"], { includeDebug: true })).toBe(
      true,
    );
  });

  it("parses positive integer flag values", () => {
    expect(getPositiveIntFlagValue(["node", "penguins", "status"], "--timeout")).toBeUndefined();
    expect(
      getPositiveIntFlagValue(["node", "penguins", "status", "--timeout"], "--timeout"),
    ).toBeNull();
    expect(
      getPositiveIntFlagValue(["node", "penguins", "status", "--timeout", "5000"], "--timeout"),
    ).toBe(5000);
    expect(
      getPositiveIntFlagValue(["node", "penguins", "status", "--timeout", "nope"], "--timeout"),
    ).toBeUndefined();
  });

  it("builds parse argv from raw args", () => {
    const nodeArgv = buildParseArgv({
      programName: "penguins",
      rawArgs: ["node", "penguins", "status"],
    });
    expect(nodeArgv).toEqual(["node", "penguins", "status"]);

    const versionedNodeArgv = buildParseArgv({
      programName: "penguins",
      rawArgs: ["node-22", "penguins", "status"],
    });
    expect(versionedNodeArgv).toEqual(["node-22", "penguins", "status"]);

    const versionedNodeWindowsArgv = buildParseArgv({
      programName: "penguins",
      rawArgs: ["node-22.2.0.exe", "penguins", "status"],
    });
    expect(versionedNodeWindowsArgv).toEqual(["node-22.2.0.exe", "penguins", "status"]);

    const versionedNodePatchlessArgv = buildParseArgv({
      programName: "penguins",
      rawArgs: ["node-22.2", "penguins", "status"],
    });
    expect(versionedNodePatchlessArgv).toEqual(["node-22.2", "penguins", "status"]);

    const versionedNodeWindowsPatchlessArgv = buildParseArgv({
      programName: "penguins",
      rawArgs: ["node-22.2.exe", "penguins", "status"],
    });
    expect(versionedNodeWindowsPatchlessArgv).toEqual(["node-22.2.exe", "penguins", "status"]);

    const versionedNodeWithPathArgv = buildParseArgv({
      programName: "penguins",
      rawArgs: ["/usr/bin/node-22.2.0", "penguins", "status"],
    });
    expect(versionedNodeWithPathArgv).toEqual(["/usr/bin/node-22.2.0", "penguins", "status"]);

    const nodejsArgv = buildParseArgv({
      programName: "penguins",
      rawArgs: ["nodejs", "penguins", "status"],
    });
    expect(nodejsArgv).toEqual(["nodejs", "penguins", "status"]);

    const nonVersionedNodeArgv = buildParseArgv({
      programName: "penguins",
      rawArgs: ["node-dev", "penguins", "status"],
    });
    expect(nonVersionedNodeArgv).toEqual(["node", "penguins", "node-dev", "penguins", "status"]);

    const directArgv = buildParseArgv({
      programName: "penguins",
      rawArgs: ["penguins", "status"],
    });
    expect(directArgv).toEqual(["node", "penguins", "status"]);

    const bunArgv = buildParseArgv({
      programName: "penguins",
      rawArgs: ["bun", "src/entry.ts", "status"],
    });
    expect(bunArgv).toEqual(["bun", "src/entry.ts", "status"]);
  });

  it("builds parse argv from fallback args", () => {
    const fallbackArgv = buildParseArgv({
      programName: "penguins",
      fallbackArgv: ["status"],
    });
    expect(fallbackArgv).toEqual(["node", "penguins", "status"]);
  });

  it("decides when to migrate state", () => {
    expect(shouldMigrateState(["node", "penguins", "status"])).toBe(false);
    expect(shouldMigrateState(["node", "penguins", "health"])).toBe(false);
    expect(shouldMigrateState(["node", "penguins", "sessions"])).toBe(false);
    expect(shouldMigrateState(["node", "penguins", "config", "get", "update"])).toBe(false);
    expect(shouldMigrateState(["node", "penguins", "config", "unset", "update"])).toBe(false);
    expect(shouldMigrateState(["node", "penguins", "models", "list"])).toBe(false);
    expect(shouldMigrateState(["node", "penguins", "models", "status"])).toBe(false);
    expect(shouldMigrateState(["node", "penguins", "memory", "status"])).toBe(false);
    expect(shouldMigrateState(["node", "penguins", "agent", "--message", "hi"])).toBe(false);
    expect(shouldMigrateState(["node", "penguins", "agents", "list"])).toBe(true);
    expect(shouldMigrateState(["node", "penguins", "message", "send"])).toBe(true);
  });

  it("reuses command path for migrate state decisions", () => {
    expect(shouldMigrateStateFromPath(["status"])).toBe(false);
    expect(shouldMigrateStateFromPath(["config", "get"])).toBe(false);
    expect(shouldMigrateStateFromPath(["models", "status"])).toBe(false);
    expect(shouldMigrateStateFromPath(["agents", "list"])).toBe(true);
  });
});
