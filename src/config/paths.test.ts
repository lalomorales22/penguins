import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { describe, expect, it } from "vitest";
import {
  resolveDefaultConfigCandidates,
  resolveConfigPathCandidate,
  resolveConfigPath,
  resolveOAuthDir,
  resolveOAuthPath,
  resolveStateDir,
} from "./paths.js";

describe("oauth paths", () => {
  it("prefers PENGUINS_OAUTH_DIR over PENGUINS_STATE_DIR", () => {
    const env = {
      PENGUINS_OAUTH_DIR: "/custom/oauth",
      PENGUINS_STATE_DIR: "/custom/state",
    } as NodeJS.ProcessEnv;

    expect(resolveOAuthDir(env, "/custom/state")).toBe(path.resolve("/custom/oauth"));
    expect(resolveOAuthPath(env, "/custom/state")).toBe(
      path.join(path.resolve("/custom/oauth"), "oauth.json"),
    );
  });

  it("derives oauth path from PENGUINS_STATE_DIR when unset", () => {
    const env = {
      PENGUINS_STATE_DIR: "/custom/state",
    } as NodeJS.ProcessEnv;

    expect(resolveOAuthDir(env, "/custom/state")).toBe(path.join("/custom/state", "credentials"));
    expect(resolveOAuthPath(env, "/custom/state")).toBe(
      path.join("/custom/state", "credentials", "oauth.json"),
    );
  });
});

describe("state + config path candidates", () => {
  it("uses PENGUINS_STATE_DIR when set", () => {
    const env = {
      PENGUINS_STATE_DIR: "/new/state",
    } as NodeJS.ProcessEnv;

    expect(resolveStateDir(env, () => "/home/test")).toBe(path.resolve("/new/state"));
  });

  it("uses PENGUINS_HOME for default state/config locations", () => {
    const env = {
      PENGUINS_HOME: "/srv/penguins-home",
    } as NodeJS.ProcessEnv;

    const resolvedHome = path.resolve("/srv/penguins-home");
    expect(resolveStateDir(env)).toBe(path.join(resolvedHome, ".penguins"));

    const candidates = resolveDefaultConfigCandidates(env);
    expect(candidates[0]).toBe(path.join(resolvedHome, ".penguins", "penguins.json"));
  });

  it("prefers PENGUINS_HOME over HOME for default state/config locations", () => {
    const env = {
      PENGUINS_HOME: "/srv/penguins-home",
      HOME: "/home/other",
    } as NodeJS.ProcessEnv;

    const resolvedHome = path.resolve("/srv/penguins-home");
    expect(resolveStateDir(env)).toBe(path.join(resolvedHome, ".penguins"));

    const candidates = resolveDefaultConfigCandidates(env);
    expect(candidates[0]).toBe(path.join(resolvedHome, ".penguins", "penguins.json"));
  });

  it("orders default config candidates in a stable order", () => {
    const home = "/home/test";
    const resolvedHome = path.resolve(home);
    const candidates = resolveDefaultConfigCandidates({} as NodeJS.ProcessEnv, () => home);
    const expected = [
      path.join(resolvedHome, ".penguins", "penguins.json"),
      path.join(resolvedHome, ".penguins", "penguins.json"),
      path.join(resolvedHome, ".penguins", "clawdbot.json"),
      path.join(resolvedHome, ".penguins", "moldbot.json"),
      path.join(resolvedHome, ".penguins", "moltbot.json"),
      path.join(resolvedHome, ".penguins", "penguins.json"),
      path.join(resolvedHome, ".penguins", "penguins.json"),
      path.join(resolvedHome, ".penguins", "clawdbot.json"),
      path.join(resolvedHome, ".penguins", "moldbot.json"),
      path.join(resolvedHome, ".penguins", "moltbot.json"),
      path.join(resolvedHome, ".clawdbot", "penguins.json"),
      path.join(resolvedHome, ".clawdbot", "penguins.json"),
      path.join(resolvedHome, ".clawdbot", "clawdbot.json"),
      path.join(resolvedHome, ".clawdbot", "moldbot.json"),
      path.join(resolvedHome, ".clawdbot", "moltbot.json"),
      path.join(resolvedHome, ".moldbot", "penguins.json"),
      path.join(resolvedHome, ".moldbot", "penguins.json"),
      path.join(resolvedHome, ".moldbot", "clawdbot.json"),
      path.join(resolvedHome, ".moldbot", "moldbot.json"),
      path.join(resolvedHome, ".moldbot", "moltbot.json"),
      path.join(resolvedHome, ".moltbot", "penguins.json"),
      path.join(resolvedHome, ".moltbot", "penguins.json"),
      path.join(resolvedHome, ".moltbot", "clawdbot.json"),
      path.join(resolvedHome, ".moltbot", "moldbot.json"),
      path.join(resolvedHome, ".moltbot", "moltbot.json"),
    ];
    expect(candidates).toEqual(expected);
  });

  it("prefers ~/.penguins when it exists and legacy dir is missing", async () => {
    const root = await fs.mkdtemp(path.join(os.tmpdir(), "penguins-state-"));
    try {
      const newDir = path.join(root, ".penguins");
      await fs.mkdir(newDir, { recursive: true });
      const resolved = resolveStateDir({} as NodeJS.ProcessEnv, () => root);
      expect(resolved).toBe(newDir);
    } finally {
      await fs.rm(root, { recursive: true, force: true });
    }
  });

  it("CONFIG_PATH prefers existing config when present", async () => {
    const root = await fs.mkdtemp(path.join(os.tmpdir(), "penguins-config-"));
    try {
      const newDir = path.join(root, ".penguins");
      await fs.mkdir(newDir, { recursive: true });
      const configPath = path.join(newDir, "penguins.json");
      await fs.writeFile(configPath, "{}", "utf-8");

      const resolved = resolveConfigPathCandidate({} as NodeJS.ProcessEnv, () => root);
      expect(resolved).toBe(configPath);
    } finally {
      await fs.rm(root, { recursive: true, force: true });
    }
  });

  it("respects state dir overrides when config is missing", async () => {
    const root = await fs.mkdtemp(path.join(os.tmpdir(), "penguins-config-override-"));
    try {
      const legacyDir = path.join(root, ".penguins");
      await fs.mkdir(legacyDir, { recursive: true });
      const legacyConfig = path.join(legacyDir, "penguins.json");
      await fs.writeFile(legacyConfig, "{}", "utf-8");

      const overrideDir = path.join(root, "override");
      const env = { PENGUINS_STATE_DIR: overrideDir } as NodeJS.ProcessEnv;
      const resolved = resolveConfigPath(env, overrideDir, () => root);
      expect(resolved).toBe(path.join(overrideDir, "penguins.json"));
    } finally {
      await fs.rm(root, { recursive: true, force: true });
    }
  });
});
