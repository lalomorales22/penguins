import { Command } from "commander";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const { acpAction, registerAcpCli } = vi.hoisted(() => {
  const action = vi.fn();
  const register = vi.fn((program: Command) => {
    program.command("acp").action(action);
  });
  return { acpAction: action, registerAcpCli: register };
});

const { gatewayAction, registerGatewayCli } = vi.hoisted(() => {
  const action = vi.fn();
  const register = vi.fn((program: Command) => {
    const gateway = program.command("gateway");
    gateway.command("status").action(action);
  });
  return { gatewayAction: action, registerGatewayCli: register };
});

vi.mock("../acp-cli.js", () => ({ registerAcpCli }));
vi.mock("../gateway-cli.js", () => ({ registerGatewayCli }));

const { registerSubCliByName, registerSubCliCommands } = await import("./register.subclis.js");

describe("registerSubCliCommands", () => {
  const originalArgv = process.argv;
  const originalEnv = { ...process.env };

  beforeEach(() => {
    process.env = { ...originalEnv };
    delete process.env.PENGUINS_DISABLE_LAZY_SUBCOMMANDS;
    registerAcpCli.mockClear();
    acpAction.mockClear();
    registerGatewayCli.mockClear();
    gatewayAction.mockClear();
  });

  afterEach(() => {
    process.argv = originalArgv;
    process.env = { ...originalEnv };
  });

  it("registers only the primary placeholder and dispatches", async () => {
    process.argv = ["node", "penguins", "acp"];
    const program = new Command();
    registerSubCliCommands(program, process.argv);

    expect(program.commands.map((cmd) => cmd.name())).toEqual(["acp"]);

    await program.parseAsync(process.argv);

    expect(registerAcpCli).toHaveBeenCalledTimes(1);
    expect(acpAction).toHaveBeenCalledTimes(1);
  });

  it("registers placeholders for all subcommands when no primary", () => {
    process.argv = ["node", "penguins"];
    const program = new Command();
    registerSubCliCommands(program, process.argv);

    const names = program.commands.map((cmd) => cmd.name());
    expect(names).toContain("acp");
    expect(names).toContain("gateway");
    expect(registerAcpCli).not.toHaveBeenCalled();
  });

  it("re-parses argv for lazy subcommands", async () => {
    process.argv = ["node", "penguins", "gateway", "status"];
    const program = new Command();
    program.name("penguins");
    registerSubCliCommands(program, process.argv);

    expect(program.commands.map((cmd) => cmd.name())).toEqual(["gateway"]);

    await program.parseAsync(["gateway", "status"], { from: "user" });

    expect(registerGatewayCli).toHaveBeenCalledTimes(1);
    expect(gatewayAction).toHaveBeenCalledTimes(1);
  });

  it("replaces placeholder when registering a subcommand by name", async () => {
    process.argv = ["node", "penguins", "acp", "--help"];
    const program = new Command();
    program.name("penguins");
    registerSubCliCommands(program, process.argv);

    await registerSubCliByName(program, "acp");

    const names = program.commands.map((cmd) => cmd.name());
    expect(names.filter((name) => name === "acp")).toHaveLength(1);

    await program.parseAsync(["acp"], { from: "user" });
    expect(registerAcpCli).toHaveBeenCalledTimes(1);
    expect(acpAction).toHaveBeenCalledTimes(1);
  });
});
