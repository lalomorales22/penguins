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
