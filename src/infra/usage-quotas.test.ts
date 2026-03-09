import { describe, it, expect, beforeEach } from "vitest";
import { UsageQuotaTracker } from "./usage-quotas.js";

describe("UsageQuotaTracker", () => {
  let tracker: UsageQuotaTracker;

  beforeEach(() => {
    tracker = new UsageQuotaTracker();
  });

  it("allows requests when no quota is set", () => {
    const result = tracker.check("user-1");
    expect(result.allowed).toBe(true);
  });

  it("tracks token usage", () => {
    tracker.record("user-1", 1000);
    tracker.record("user-1", 500);
    const usage = tracker.getUsage("user-1");
    expect(usage?.monthlyTokens).toBe(1500);
    expect(usage?.dailyTokens).toBe(1500);
    expect(usage?.dailyRequests).toBe(2);
  });

  it("rejects when monthly limit is exceeded", () => {
    const quota = { monthlyTokenLimit: 1000 };
    tracker.record("user-1", 1000);
    const result = tracker.check("user-1", quota);
    expect(result.allowed).toBe(false);
    expect(result.reason).toBe("monthly token limit exceeded");
  });

  it("rejects when daily token limit is exceeded", () => {
    const quota = { dailyTokenLimit: 500 };
    tracker.record("user-1", 500);
    const result = tracker.check("user-1", quota);
    expect(result.allowed).toBe(false);
    expect(result.reason).toBe("daily token limit exceeded");
  });

  it("rejects when daily request limit is exceeded", () => {
    const quota = { dailyRequestLimit: 2 };
    tracker.record("user-1", 100);
    tracker.record("user-1", 100);
    const result = tracker.check("user-1", quota);
    expect(result.allowed).toBe(false);
    expect(result.reason).toBe("daily request limit exceeded");
  });

  it("isolates usage between subjects", () => {
    const quota = { dailyTokenLimit: 1000 };
    tracker.record("user-1", 999);
    tracker.record("user-2", 100);

    expect(tracker.check("user-1", quota).allowed).toBe(true);
    expect(tracker.check("user-2", quota).allowed).toBe(true);

    tracker.record("user-1", 1);
    expect(tracker.check("user-1", quota).allowed).toBe(false);
    expect(tracker.check("user-2", quota).allowed).toBe(true);
  });

  it("allUsage returns all tracked subjects", () => {
    tracker.record("a", 10);
    tracker.record("b", 20);
    const all = tracker.allUsage();
    expect(all).toHaveLength(2);
    expect(all.map((e) => e.subject).toSorted()).toEqual(["a", "b"]);
  });

  it("reset clears all entries", () => {
    tracker.record("user-1", 100);
    tracker.reset();
    expect(tracker.getUsage("user-1")).toBeUndefined();
  });

  it("uses default quota from constructor", () => {
    const t = new UsageQuotaTracker({ monthlyTokenLimit: 50 });
    t.record("u", 50);
    expect(t.check("u").allowed).toBe(false);
  });
});
