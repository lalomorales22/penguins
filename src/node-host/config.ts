export type NodeHostConfig = {
  gateway?: {
    host?: string;
    port?: number;
    tls?: boolean;
    tlsFingerprint?: string;
  };
  node?: {
    id?: string;
    displayName?: string;
  };
};

export async function loadNodeHostConfig(): Promise<NodeHostConfig | null> {
  try {
    const fs = await import("node:fs/promises");
    const path = await import("node:path");
    const os = await import("node:os");
    const configPath = path.join(os.homedir(), ".penguins", "node.json");
    const content = await fs.readFile(configPath, "utf-8");
    return JSON.parse(content) as NodeHostConfig;
  } catch {
    return null;
  }
}

export type RunNodeHostOptions = {
  gatewayHost: string;
  gatewayPort: number;
  gatewayTls?: boolean;
  gatewayTlsFingerprint?: string;
  nodeId?: string;
  displayName?: string;
};

export async function runNodeHost(_options: RunNodeHostOptions): Promise<never> {
  throw new Error(
    "node-host module not implemented. The headless node host feature needs to be re-implemented. This feature allows running 'penguins node run' to connect to a gateway as a remote execution node.",
  );
}
