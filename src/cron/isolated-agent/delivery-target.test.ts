import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  loadSessionStore: vi.fn(() => ({})),
  resolveStorePath: vi.fn(() => "sessions.json"),
  resolveAgentMainSessionKey: vi.fn(() => "agent:main:main"),
  resolveMessageChannelSelection: vi.fn(),
  resolveOutboundTarget: vi.fn(({ to }: { to?: string }) => ({
    ok: true as const,
    to: to ?? "resolved-target",
  })),
}));

vi.mock("../../config/sessions.js", () => ({
  loadSessionStore: (...args: unknown[]) => mocks.loadSessionStore(...args),
  resolveStorePath: (...args: unknown[]) => mocks.resolveStorePath(...args),
  resolveAgentMainSessionKey: (...args: unknown[]) => mocks.resolveAgentMainSessionKey(...args),
}));

vi.mock("../../infra/outbound/channel-selection.js", () => ({
  resolveMessageChannelSelection: (...args: unknown[]) =>
    mocks.resolveMessageChannelSelection(...args),
}));

vi.mock("../../infra/outbound/targets.js", async () => {
  const actual = await vi.importActual<typeof import("../../infra/outbound/targets.js")>(
    "../../infra/outbound/targets.js",
  );
  return {
    ...actual,
    resolveOutboundTarget: (...args: unknown[]) => mocks.resolveOutboundTarget(...args),
  };
});

describe("resolveDeliveryTarget", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns an actionable error when no external route or channel selection exists", async () => {
    mocks.resolveMessageChannelSelection.mockRejectedValueOnce(
      new Error("Channel is required (no configured channels detected)."),
    );

    const { resolveDeliveryTarget } = await import("./delivery-target.js");
    const result = await resolveDeliveryTarget({} as never, "main", { channel: "last" });

    expect(result.channel).toBeUndefined();
    expect(result.to).toBeUndefined();
    expect(result.error?.message).toContain("existing external route");
  });

  it("uses the selected configured channel instead of a legacy default", async () => {
    mocks.resolveMessageChannelSelection.mockResolvedValueOnce({
      channel: "slack",
      configured: ["slack"],
    });

    const { resolveDeliveryTarget } = await import("./delivery-target.js");
    const result = await resolveDeliveryTarget({} as never, "main", {
      channel: "last",
      to: "#reports",
    });

    expect(result.channel).toBe("slack");
    expect(result.to).toBe("#reports");
    expect(result.error).toBeUndefined();
  });
});
