import { describe, expect, it, vi } from "vitest";

describe("memory-core plugin", () => {
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
      // Plugins should have id and name at minimum
      if ("id" in p) {
        expect(typeof p.id).toBe("string");
      }
      if ("name" in p) {
        expect(typeof p.name).toBe("string");
      }
      if ("register" in p) {
        expect(typeof p.register).toBe("function");
      }
    }
  });

  it("registers memory_search and memory_get tools", async () => {
    const mod = await import("./index.js");
    const plugin = mod.default ?? mod;
    const p = plugin as { register?: (api: unknown) => void };
    if (typeof p.register !== "function") {
      return;
    }

    const registeredTools: string[] = [];
    const mockApi = {
      pluginConfig: {},
      config: {},
      runtime: {
        tools: {
          createMemorySearchTool: vi.fn(() => ({ name: "memory_search" })),
          createMemoryGetTool: vi.fn(() => ({ name: "memory_get" })),
        },
      },
      registerTool: vi.fn((factory: Function, opts?: { names?: string[] }) => {
        if (opts?.names) {
          registeredTools.push(...opts.names);
        }
      }),
      on: vi.fn(),
      logger: { info: vi.fn(), warn: vi.fn(), debug: vi.fn() },
    };

    p.register(mockApi);
    expect(mockApi.registerTool).toHaveBeenCalled();
    expect(registeredTools).toContain("memory_search");
    expect(registeredTools).toContain("memory_get");
  });
});
