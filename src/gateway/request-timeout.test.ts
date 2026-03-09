import { describe, it, expect } from "vitest";
import { resolveTimeout } from "./request-timeout.js";

describe("resolveTimeout", () => {
  it("returns built-in timeout for known routes", () => {
    expect(resolveTimeout("/v1/chat/completions")).toBe(300_000);
    expect(resolveTimeout("/v1/responses")).toBe(300_000);
    expect(resolveTimeout("/health")).toBe(5_000);
    expect(resolveTimeout("/metrics")).toBe(5_000);
    expect(resolveTimeout("/tools/invoke")).toBe(120_000);
  });

  it("returns default timeout for unknown routes", () => {
    expect(resolveTimeout("/unknown/path")).toBe(120_000);
  });

  it("uses user config overrides over built-in defaults", () => {
    const config = { routes: { "/v1/chat/completions": 60_000 } };
    expect(resolveTimeout("/v1/chat/completions", config)).toBe(60_000);
  });

  it("uses user default when no route matches", () => {
    const config = { defaultMs: 30_000 };
    expect(resolveTimeout("/unknown", config)).toBe(30_000);
  });

  it("user route overrides take priority over user default", () => {
    const config = { defaultMs: 10_000, routes: { "/health": 2_000 } };
    expect(resolveTimeout("/health", config)).toBe(2_000);
    expect(resolveTimeout("/other", config)).toBe(10_000);
  });
});
