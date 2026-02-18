import type {
  AnyAgentTool,
  PenguinsPluginApi,
  PenguinsPluginToolFactory,
} from "../../src/plugins/types.js";
import { createLobsterTool } from "./src/lobster-tool.js";

export default function register(api: PenguinsPluginApi) {
  api.registerTool(
    ((ctx) => {
      if (ctx.sandboxed) {
        return null;
      }
      return createLobsterTool(api) as AnyAgentTool;
    }) as PenguinsPluginToolFactory,
    { optional: true },
  );
}
