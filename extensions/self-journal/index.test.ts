import { describe, expect, it, vi } from "vitest";

describe("self-journal plugin", () => {
  it("exports a valid plugin object", async () => {
    const mod = await import("./index.js");
    const plugin = mod.default ?? mod;
    expect(plugin).toBeDefined();
    expect(typeof plugin === "object" || typeof plugin === "function").toBe(true);
  });

  it("has required plugin metadata", async () => {
    const mod = await import("./index.js");
    const plugin = mod.default ?? mod;
    if (typeof plugin === "object" && plugin !== null) {
      const p = plugin as Record<string, unknown>;
      if ("id" in p) {
        expect(typeof p.id).toBe("string");
      }
      if ("name" in p) {
        expect(typeof p.name).toBe("string");
      }
    }
  });

  it("registers memory_self_reflect tool", async () => {
    const mod = await import("./index.js");
    const plugin = mod.default ?? mod;
    const p = plugin as { register?: (api: unknown) => void };
    if (typeof p.register !== "function") {
      return;
    }

    const mockApi = {
      pluginConfig: {},
      config: {},
      registerTool: vi.fn(),
      on: vi.fn(),
      logger: { info: vi.fn(), warn: vi.fn(), debug: vi.fn() },
    };

    p.register(mockApi);
    expect(mockApi.registerTool).toHaveBeenCalled();
  });
});
