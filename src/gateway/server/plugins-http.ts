import type { IncomingMessage, ServerResponse } from "node:http";
import type { createSubsystemLogger } from "../../logging/subsystem.js";
import type { PluginRegistry } from "../../plugins/registry.js";

type SubsystemLogger = ReturnType<typeof createSubsystemLogger>;

export type PluginHttpRequestHandler = (
  req: IncomingMessage,
  res: ServerResponse,
  opts?: {
    authorizeGatewayRequest?: () => Promise<boolean>;
  },
) => Promise<boolean>;

function matchesHandlerPaths(params: { req: IncomingMessage; paths?: string[] }): boolean {
  const { paths } = params;
  if (!paths || paths.length === 0) {
    return true;
  }
  const url = new URL(params.req.url ?? "/", "http://localhost");
  return paths.includes(url.pathname);
}

async function authorizeOrReply(params: {
  res: ServerResponse;
  authorizeGatewayRequest?: () => Promise<boolean>;
}): Promise<boolean> {
  if (!params.authorizeGatewayRequest) {
    params.res.statusCode = 500;
    params.res.setHeader("Content-Type", "text/plain; charset=utf-8");
    params.res.end("Plugin auth misconfigured");
    return false;
  }
  return await params.authorizeGatewayRequest();
}

export function createGatewayPluginRequestHandler(params: {
  registry: PluginRegistry;
  log: SubsystemLogger;
}): PluginHttpRequestHandler {
  const { registry, log } = params;
  return async (req, res, opts) => {
    const routes = registry.httpRoutes ?? [];
    const handlers = registry.httpHandlers ?? [];
    if (routes.length === 0 && handlers.length === 0) {
      return false;
    }

    if (routes.length > 0) {
      const url = new URL(req.url ?? "/", "http://localhost");
      const route = routes.find((entry) => entry.path === url.pathname);
      if (route) {
        if (route.auth !== "public") {
          const authorized = await authorizeOrReply({
            res,
            authorizeGatewayRequest: opts?.authorizeGatewayRequest,
          });
          if (!authorized) {
            return true;
          }
        }
        try {
          await route.handler(req, res);
          return true;
        } catch (err) {
          log.warn(`plugin http route failed (${route.pluginId ?? "unknown"}): ${String(err)}`);
          if (!res.headersSent) {
            res.statusCode = 500;
            res.setHeader("Content-Type", "text/plain; charset=utf-8");
            res.end("Internal Server Error");
          }
          return true;
        }
      }
    }

    const orderedHandlers = [
      ...handlers.filter((entry) => entry.auth === "public"),
      ...handlers.filter((entry) => entry.auth !== "public"),
    ];
    for (const entry of orderedHandlers) {
      if (!matchesHandlerPaths({ req, paths: entry.paths })) {
        continue;
      }
      if (entry.auth !== "public") {
        const authorized = await authorizeOrReply({
          res,
          authorizeGatewayRequest: opts?.authorizeGatewayRequest,
        });
        if (!authorized) {
          return true;
        }
      }
      try {
        const handled = await entry.handler(req, res);
        if (handled) {
          return true;
        }
      } catch (err) {
        log.warn(`plugin http handler failed (${entry.pluginId}): ${String(err)}`);
        if (!res.headersSent) {
          res.statusCode = 500;
          res.setHeader("Content-Type", "text/plain; charset=utf-8");
          res.end("Internal Server Error");
        }
        return true;
      }
    }
    return false;
  };
}
