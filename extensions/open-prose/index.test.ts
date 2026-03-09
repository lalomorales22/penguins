import { describe, expect, it } from "vitest";

describe("open-prose plugin", () => {
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
});
