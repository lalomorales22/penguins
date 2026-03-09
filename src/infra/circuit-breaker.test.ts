import { describe, it, expect, beforeEach } from "vitest";
import {
  CircuitBreaker,
  CircuitBreakerOpenError,
  getCircuitBreaker,
  resetAllCircuitBreakers,
} from "./circuit-breaker.js";

describe("CircuitBreaker", () => {
  beforeEach(() => {
    resetAllCircuitBreakers();
  });

  it("starts closed and passes calls through", async () => {
    const cb = new CircuitBreaker("test");
    const result = await cb.call(async () => 42);
    expect(result).toBe(42);
    expect(cb.getState()).toBe("closed");
  });

  it("opens after reaching failure threshold", async () => {
    const cb = new CircuitBreaker("test", { failureThreshold: 3 });

    for (let i = 0; i < 3; i++) {
      await expect(
        cb.call(async () => {
          throw new Error("fail");
        }),
      ).rejects.toThrow("fail");
    }

    expect(cb.getState()).toBe("open");
    expect(cb.getFailures()).toBe(3);
  });

  it("rejects immediately when open", async () => {
    const cb = new CircuitBreaker("test", { failureThreshold: 1, resetTimeoutMs: 60_000 });

    await expect(
      cb.call(async () => {
        throw new Error("fail");
      }),
    ).rejects.toThrow("fail");
    expect(cb.getState()).toBe("open");

    await expect(cb.call(async () => 42)).rejects.toThrow(CircuitBreakerOpenError);
  });

  it("transitions to half_open after reset timeout", async () => {
    const cb = new CircuitBreaker("test", { failureThreshold: 1, resetTimeoutMs: 100 });

    await expect(
      cb.call(async () => {
        throw new Error("fail");
      }),
    ).rejects.toThrow();
    expect(cb.getState()).toBe("open");

    await new Promise((r) => setTimeout(r, 120));

    const result = await cb.call(async () => "recovered");
    expect(result).toBe("recovered");
    expect(cb.getState()).toBe("closed");
  });

  it("reopens if half_open probe fails", async () => {
    const cb = new CircuitBreaker("test", { failureThreshold: 1, resetTimeoutMs: 50 });

    await expect(
      cb.call(async () => {
        throw new Error("fail");
      }),
    ).rejects.toThrow();
    await new Promise((r) => setTimeout(r, 60));

    await expect(
      cb.call(async () => {
        throw new Error("still broken");
      }),
    ).rejects.toThrow();
    expect(cb.getState()).toBe("open");
  });

  it("respects isFailure predicate — ignores non-matching errors", async () => {
    const cb = new CircuitBreaker("test", {
      failureThreshold: 2,
      isFailure: (err) => err instanceof Error && err.message.includes("5xx"),
    });

    // Client error — should NOT trip the breaker.
    await expect(
      cb.call(async () => {
        throw new Error("4xx not found");
      }),
    ).rejects.toThrow();
    expect(cb.getFailures()).toBe(0);

    // Server errors — should trip.
    await expect(
      cb.call(async () => {
        throw new Error("5xx internal");
      }),
    ).rejects.toThrow();
    await expect(
      cb.call(async () => {
        throw new Error("5xx gateway");
      }),
    ).rejects.toThrow();
    expect(cb.getState()).toBe("open");
  });

  it("calls onStateChange callback", async () => {
    const changes: Array<{ from: string; to: string }> = [];
    const cb = new CircuitBreaker("test", {
      failureThreshold: 1,
      resetTimeoutMs: 50,
      onStateChange: (_name, from, to) => changes.push({ from, to }),
    });

    await expect(
      cb.call(async () => {
        throw new Error("fail");
      }),
    ).rejects.toThrow();
    expect(changes).toEqual([{ from: "closed", to: "open" }]);

    await new Promise((r) => setTimeout(r, 60));
    await cb.call(async () => "ok");
    expect(changes).toEqual([
      { from: "closed", to: "open" },
      { from: "open", to: "half_open" },
      { from: "half_open", to: "closed" },
    ]);
  });

  it("manual reset works", async () => {
    const cb = new CircuitBreaker("test", { failureThreshold: 1 });
    await expect(
      cb.call(async () => {
        throw new Error("fail");
      }),
    ).rejects.toThrow();
    expect(cb.getState()).toBe("open");

    cb.reset();
    expect(cb.getState()).toBe("closed");
    expect(cb.getFailures()).toBe(0);
  });

  it("toJSON returns diagnostics", () => {
    const cb = new CircuitBreaker("my-service");
    const snap = cb.toJSON();
    expect(snap).toEqual({
      name: "my-service",
      state: "closed",
      failures: 0,
      lastFailureTime: 0,
    });
  });
});

describe("getCircuitBreaker registry", () => {
  beforeEach(() => {
    resetAllCircuitBreakers();
  });

  it("returns the same instance for the same name", () => {
    const a = getCircuitBreaker("openai");
    const b = getCircuitBreaker("openai");
    expect(a).toBe(b);
  });

  it("returns different instances for different names", () => {
    const a = getCircuitBreaker("openai");
    const b = getCircuitBreaker("anthropic");
    expect(a).not.toBe(b);
  });
});
