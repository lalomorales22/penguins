import { captureEnv } from "../test-utils/env.js";

export function snapshotStateDirEnv() {
  return captureEnv(["PENGUINS_STATE_DIR", "PENGUINS_STATE_DIR"]);
}

export function restoreStateDirEnv(snapshot: ReturnType<typeof snapshotStateDirEnv>): void {
  snapshot.restore();
}

export function setStateDirEnv(stateDir: string): void {
  process.env.PENGUINS_STATE_DIR = stateDir;
  delete process.env.PENGUINS_STATE_DIR;
}
