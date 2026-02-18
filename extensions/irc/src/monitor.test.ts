import { describe, expect, it } from "vitest";
import { resolveIrcInboundTarget } from "./monitor.js";

describe("irc monitor inbound target", () => {
  it("keeps channel target for group messages", () => {
    expect(
      resolveIrcInboundTarget({
        target: "#penguins",
        senderNick: "alice",
      }),
    ).toEqual({
      isGroup: true,
      target: "#penguins",
      rawTarget: "#penguins",
    });
  });

  it("maps DM target to sender nick and preserves raw target", () => {
    expect(
      resolveIrcInboundTarget({
        target: "penguins-bot",
        senderNick: "alice",
      }),
    ).toEqual({
      isGroup: false,
      target: "alice",
      rawTarget: "penguins-bot",
    });
  });

  it("falls back to raw target when sender nick is empty", () => {
    expect(
      resolveIrcInboundTarget({
        target: "penguins-bot",
        senderNick: " ",
      }),
    ).toEqual({
      isGroup: false,
      target: "penguins-bot",
      rawTarget: "penguins-bot",
    });
  });
});
