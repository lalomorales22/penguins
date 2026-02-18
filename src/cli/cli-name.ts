import path from "node:path";

export const DEFAULT_CLI_NAME = "penguins";

const KNOWN_CLI_NAMES = new Set([DEFAULT_CLI_NAME]);
const LEGACY_CLI_NAMES = new Set(["openclaw", "clawdbot"]);
const CLI_PREFIX_RE = /^(?:((?:pnpm|npm|bunx|npx)\s+))?(penguins|openclaw|clawdbot)\b/;

export function resolveCliName(argv: string[] = process.argv): string {
  const argv1 = argv[1];
  if (!argv1) {
    return DEFAULT_CLI_NAME;
  }
  const base = path.basename(argv1).trim();
  if (KNOWN_CLI_NAMES.has(base)) {
    return base;
  }
  if (LEGACY_CLI_NAMES.has(base)) {
    process.stderr.write(
      `[penguins] Warning: "${base}" is deprecated. Use "penguins" instead.\n`,
    );
    return DEFAULT_CLI_NAME;
  }
  return DEFAULT_CLI_NAME;
}

export function replaceCliName(command: string, cliName = resolveCliName()): string {
  if (!command.trim()) {
    return command;
  }
  if (!CLI_PREFIX_RE.test(command)) {
    return command;
  }
  return command.replace(CLI_PREFIX_RE, (_match, runner: string | undefined) => {
    return `${runner ?? ""}${cliName}`;
  });
}
