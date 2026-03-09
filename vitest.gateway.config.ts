import { defineConfig } from "vitest/config";
import baseConfig from "./vitest.config.ts";

const base = baseConfig as unknown as Record<string, unknown>;
const baseTest = (baseConfig as { test?: { exclude?: string[] } }).test ?? {};
const exclude = baseTest.exclude ?? [];

export default defineConfig({
  ...base,
  test: {
    ...baseTest,
    include: ["src/gateway/**/*.test.ts"],
    exclude,
    coverage: {
      provider: "v8",
      reporter: ["text", "lcov"],
      all: false,
      include: ["./src/gateway/**/*.ts"],
      exclude: [
        "src/gateway/**/*.test.ts",
        // Integration surfaces validated via e2e/manual tests.
        "src/gateway/control-ui.ts",
        "src/gateway/server-bridge.ts",
        "src/gateway/server-channels.ts",
        "src/gateway/server.ts",
        "src/gateway/client.ts",
        "src/gateway/call.ts",
        "src/gateway/protocol/**",
      ],
    },
  },
});
