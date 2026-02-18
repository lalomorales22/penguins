import type { PenguinsConfig } from "../config/config.js";

export function applyOnboardingLocalWorkspaceConfig(
  baseConfig: PenguinsConfig,
  workspaceDir: string,
): PenguinsConfig {
  return {
    ...baseConfig,
    agents: {
      ...baseConfig.agents,
      defaults: {
        ...baseConfig.agents?.defaults,
        workspace: workspaceDir,
      },
    },
    gateway: {
      ...baseConfig.gateway,
      mode: "local",
    },
  };
}
