import { describe, it, expect, afterEach } from "vitest";
import { WsResumeManager } from "./ws-resume.js";

describe("WsResumeManager", () => {
  let mgr: WsResumeManager;

  afterEach(() => {
    mgr?.dispose();
  });

  it("creates tokens and pushes events", () => {
    mgr = new WsResumeManager();
    const token = mgr.createToken();
    expect(token).toBeTruthy();

    const seq1 = mgr.push(token, { type: "a" });
    const seq2 = mgr.push(token, { type: "b" });
    expect(seq1).toBe(1);
    expect(seq2).toBe(2);
  });

  it("replays events since a given sequence", () => {
    mgr = new WsResumeManager();
    const token = mgr.createToken();
    mgr.push(token, { type: "a" });
    mgr.push(token, { type: "b" });
    mgr.push(token, { type: "c" });

    const events = mgr.getEventsSince(token, 1);
    expect(events).toHaveLength(2);
    expect(events![0].data).toEqual({ type: "b" });
    expect(events![1].data).toEqual({ type: "c" });
  });

  it("returns all events when lastSeq is 0", () => {
    mgr = new WsResumeManager();
    const token = mgr.createToken();
    mgr.push(token, "x");
    mgr.push(token, "y");

    const events = mgr.getEventsSince(token, 0);
    expect(events).toHaveLength(2);
  });

  it("returns null for unknown tokens", () => {
    mgr = new WsResumeManager();
    expect(mgr.getEventsSince("unknown", 0)).toBeNull();
    expect(mgr.push("unknown", "data")).toBeNull();
  });

  it("trims events to maxEvents", () => {
    mgr = new WsResumeManager({ maxEvents: 3 });
    const token = mgr.createToken();
    for (let i = 0; i < 10; i++) {
      mgr.push(token, i);
    }
    const events = mgr.getEventsSince(token, 0);
    expect(events).toHaveLength(3);
    expect(events![0].seq).toBe(8);
  });

  it("removes a buffer", () => {
    mgr = new WsResumeManager();
    const token = mgr.createToken();
    mgr.push(token, "x");
    mgr.remove(token);
    expect(mgr.getEventsSince(token, 0)).toBeNull();
    expect(mgr.size).toBe(0);
  });

  it("sweeps expired buffers", async () => {
    mgr = new WsResumeManager({ ttlMs: 50, sweepIntervalMs: 30 });
    const token = mgr.createToken();
    mgr.push(token, "data");
    expect(mgr.size).toBe(1);

    await new Promise((r) => setTimeout(r, 100));
    expect(mgr.size).toBe(0);
  });

  it("dispose clears everything", () => {
    mgr = new WsResumeManager();
    mgr.createToken();
    mgr.createToken();
    mgr.dispose();
    expect(mgr.size).toBe(0);
  });
});
