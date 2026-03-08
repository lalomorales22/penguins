import { describe, expect, it, vi } from "vitest";
import type { RuntimeEnv } from "../runtime.js";

const mocks = vi.hoisted(() => ({
  text: vi.fn(),
  select: vi.fn(),
  confirm: vi.fn(),
  resolveGatewayPort: vi.fn(),
  buildGatewayAuthConfig: vi.fn(),
  note: vi.fn(),
  randomToken: vi.fn(),
}));

vi.mock("../config/config.js", async (importActual) => {
  const actual = await importActual<typeof import("../config/config.js")>();
  return {
    ...actual,
    resolveGatewayPort: mocks.resolveGatewayPort,
  };
});

vi.mock("./configure.shared.js", () => ({
  text: mocks.text,
  select: mocks.select,
  confirm: mocks.confirm,
}));

vi.mock("../terminal/note.js", () => ({
  note: mocks.note,
}));

vi.mock("./configure.gateway-auth.js", () => ({
  buildGatewayAuthConfig: mocks.buildGatewayAuthConfig,
}));

vi.mock("../infra/tailscale.js", () => ({
  findTailscaleBinary: vi.fn(async () => undefined),
}));

vi.mock("./onboard-helpers.js", async (importActual) => {
  const actual = await importActual<typeof import("./onboard-helpers.js")>();
  return {
    ...actual,
    randomToken: mocks.randomToken,
  };
});

import { promptGatewayConfig } from "./configure.gateway.js";

describe("promptGatewayConfig", () => {
  it("generates a token when the prompt returns undefined", async () => {
    mocks.resolveGatewayPort.mockReturnValue(18789);
    const selectQueue = ["loopback", "token", "off"];
    mocks.select.mockImplementation(async () => selectQueue.shift());
    const textQueue = ["18789", undefined];
    mocks.text.mockImplementation(async () => textQueue.shift());
    mocks.randomToken.mockReturnValue("generated-token");
    mocks.buildGatewayAuthConfig.mockImplementation(({ mode, token, password }) => ({
      mode,
      token,
      password,
    }));

    const runtime: RuntimeEnv = {
      log: vi.fn(),
      error: vi.fn(),
      exit: vi.fn(),
    };

    const result = await promptGatewayConfig({}, runtime);
    expect(result.token).toBe("generated-token");
  });
  it("does not set password to literal 'undefined' when prompt returns undefined", async () => {
    vi.clearAllMocks();
    mocks.resolveGatewayPort.mockReturnValue(18789);
    // Flow: loopback bind → password auth → tailscale off
    const selectQueue = ["loopback", "password", "off"];
    mocks.select.mockImplementation(async () => selectQueue.shift());
    // Port prompt → OK, then password prompt → returns undefined (simulating prompter edge case)
    const textQueue = ["18789", undefined];
    mocks.text.mockImplementation(async () => textQueue.shift());
    mocks.randomToken.mockReturnValue("unused");
    mocks.buildGatewayAuthConfig.mockImplementation(({ mode, token, password }) => ({
      mode,
      token,
      password,
    }));

    const runtime: RuntimeEnv = {
      log: vi.fn(),
      error: vi.fn(),
      exit: vi.fn(),
    };

    await promptGatewayConfig({}, runtime);
    const call = mocks.buildGatewayAuthConfig.mock.calls[0]?.[0];
    expect(call?.password).not.toBe("undefined");
    expect(call?.password).toBe("");
  });

  it("prompts for Cloudflare trusted-proxy configuration and keeps loopback bind", async () => {
    vi.clearAllMocks();
    mocks.resolveGatewayPort.mockReturnValue(18789);
    // Flow: loopback bind → trusted-proxy auth → tailscale off → Cloudflare preset
    const selectQueue = ["loopback", "trusted-proxy", "off", "cloudflare-access"];
    mocks.select.mockImplementation(async () => selectQueue.shift());
    // Port prompt, userHeader, requiredHeaders, allowUsers, trustedProxies
    const textQueue = [
      "18789",
      "cf-access-authenticated-user-email",
      "cf-access-jwt-assertion,x-forwarded-proto,x-forwarded-host",
      "nick@example.com",
      "127.0.0.1,::1",
    ];
    mocks.text.mockImplementation(async () => textQueue.shift());
    mocks.buildGatewayAuthConfig.mockImplementation(({ mode, trustedProxy }) => ({
      mode,
      trustedProxy,
    }));

    const runtime: RuntimeEnv = {
      log: vi.fn(),
      error: vi.fn(),
      exit: vi.fn(),
    };

    const result = await promptGatewayConfig({}, runtime);
    const call = mocks.buildGatewayAuthConfig.mock.calls[0]?.[0];

    expect(call?.mode).toBe("trusted-proxy");
    expect(call?.trustedProxy).toEqual({
      userHeader: "cf-access-authenticated-user-email",
      requiredHeaders: ["cf-access-jwt-assertion", "x-forwarded-proto", "x-forwarded-host"],
      allowUsers: ["nick@example.com"],
    });
    expect(result.config.gateway?.bind).toBe("loopback");
    expect(result.config.gateway?.trustedProxies).toEqual(["127.0.0.1", "::1"]);
  });

  it("handles trusted-proxy with no optional fields", async () => {
    vi.clearAllMocks();
    mocks.resolveGatewayPort.mockReturnValue(18789);
    const selectQueue = ["loopback", "trusted-proxy", "off", "generic"];
    mocks.select.mockImplementation(async () => selectQueue.shift());
    // Port prompt, userHeader (only required), empty requiredHeaders, empty allowUsers, trustedProxies
    const textQueue = ["18789", "x-remote-user", "", "", "10.0.0.1"];
    mocks.text.mockImplementation(async () => textQueue.shift());
    mocks.buildGatewayAuthConfig.mockImplementation(({ mode, trustedProxy }) => ({
      mode,
      trustedProxy,
    }));

    const runtime: RuntimeEnv = {
      log: vi.fn(),
      error: vi.fn(),
      exit: vi.fn(),
    };

    const result = await promptGatewayConfig({}, runtime);
    const call = mocks.buildGatewayAuthConfig.mock.calls[0]?.[0];

    expect(call?.mode).toBe("trusted-proxy");
    expect(call?.trustedProxy).toEqual({
      userHeader: "x-remote-user",
      // requiredHeaders and allowUsers should be undefined when empty
    });
    expect(result.config.gateway?.bind).toBe("loopback");
    expect(result.config.gateway?.trustedProxies).toEqual(["10.0.0.1"]);
  });

  it("forces tailscale off when trusted-proxy is selected", async () => {
    vi.clearAllMocks();
    mocks.resolveGatewayPort.mockReturnValue(18789);
    const selectQueue = ["loopback", "trusted-proxy", "serve", "cloudflare-access"];
    mocks.select.mockImplementation(async () => selectQueue.shift());
    const textQueue = ["18789", "cf-access-authenticated-user-email", "", "", "127.0.0.1"];
    mocks.text.mockImplementation(async () => textQueue.shift());
    mocks.confirm.mockResolvedValue(true);
    mocks.buildGatewayAuthConfig.mockImplementation(({ mode, trustedProxy }) => ({
      mode,
      trustedProxy,
    }));

    const runtime: RuntimeEnv = {
      log: vi.fn(),
      error: vi.fn(),
      exit: vi.fn(),
    };

    const result = await promptGatewayConfig({}, runtime);
    expect(result.config.gateway?.bind).toBe("loopback");
    expect(result.config.gateway?.tailscale?.mode).toBe("off");
    expect(result.config.gateway?.tailscale?.resetOnExit).toBe(false);
  });
});
