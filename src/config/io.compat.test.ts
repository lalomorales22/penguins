import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { describe, expect, it } from "vitest";
import { createConfigIO } from "./io.js";

async function withTempHome(run: (home: string) => Promise<void>): Promise<void> {
  const home = await fs.mkdtemp(path.join(os.tmpdir(), "penguins-config-"));
  try {
    await run(home);
  } finally {
    await fs.rm(home, { recursive: true, force: true });
  }
}

async function writeConfig(
  home: string,
  dirname: ".penguins" | ".penguins",
  port: number,
  filename: string = "penguins.json",
) {
  const dir = path.join(home, dirname);
  await fs.mkdir(dir, { recursive: true });
  const configPath = path.join(dir, filename);
  await fs.writeFile(configPath, JSON.stringify({ gateway: { port } }, null, 2));
  return configPath;
}

describe("config io paths", () => {
  it("uses ~/.penguins/penguins.json when config exists", async () => {
    await withTempHome(async (home) => {
      const configPath = await writeConfig(home, ".penguins", 19001);
      const io = createConfigIO({
        env: {} as NodeJS.ProcessEnv,
        homedir: () => home,
      });
      expect(io.configPath).toBe(configPath);
      expect(io.loadConfig().gateway?.port).toBe(19001);
    });
  });

  it("defaults to ~/.penguins/penguins.json when config is missing", async () => {
    await withTempHome(async (home) => {
      const io = createConfigIO({
        env: {} as NodeJS.ProcessEnv,
        homedir: () => home,
      });
      expect(io.configPath).toBe(path.join(home, ".penguins", "penguins.json"));
    });
  });

  it("uses PENGUINS_HOME for default config path", async () => {
    await withTempHome(async (home) => {
      const io = createConfigIO({
        env: { PENGUINS_HOME: path.join(home, "svc-home") } as NodeJS.ProcessEnv,
        homedir: () => path.join(home, "ignored-home"),
      });
      expect(io.configPath).toBe(path.join(home, "svc-home", ".penguins", "penguins.json"));
    });
  });

  it("honors explicit PENGUINS_CONFIG_PATH override", async () => {
    await withTempHome(async (home) => {
      const customPath = await writeConfig(home, ".penguins", 20002, "custom.json");
      const io = createConfigIO({
        env: { PENGUINS_CONFIG_PATH: customPath } as NodeJS.ProcessEnv,
        homedir: () => home,
      });
      expect(io.configPath).toBe(customPath);
      expect(io.loadConfig().gateway?.port).toBe(20002);
    });
  });

  it("falls back to ~/.penguins/penguins.json for backwards compatibility", async () => {
    await withTempHome(async (home) => {
      // Create a config in the legacy location
      const legacyDir = path.join(home, ".penguins");
      await fs.mkdir(legacyDir, { recursive: true });
      const legacyConfig = path.join(legacyDir, "penguins.json");
      await fs.writeFile(legacyConfig, JSON.stringify({ gateway: { port: 18001 } }, null, 2));

      const io = createConfigIO({
        env: {} as NodeJS.ProcessEnv,
        homedir: () => home,
      });
      expect(io.configPath).toBe(legacyConfig);
      expect(io.loadConfig().gateway?.port).toBe(18001);
    });
  });
});
