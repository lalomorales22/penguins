/**
 * Per-route request timeout enforcement for the Penguins gateway.
 *
 * Wraps HTTP request handling with a configurable timeout that sends a
 * 504 Gateway Timeout if the handler doesn't complete in time.
 */

import type { IncomingMessage, ServerResponse } from "node:http";
import { logWarn } from "../logger.js";
import { metrics } from "./metrics.js";

export type RouteTimeoutConfig = {
  /** Default timeout for all routes (ms). Default: 120 000 (2 min). */
  defaultMs?: number;
  /** Per-path overrides. The first matching prefix wins. */
  routes?: Record<string, number>;
};

const DEFAULT_TIMEOUT_MS = 120_000; // 2 minutes

/** Sensible defaults for the built-in routes. */
const BUILT_IN_ROUTE_TIMEOUTS: Record<string, number> = {
  "/v1/chat/completions": 300_000, // 5 min — streaming agent responses can be long
  "/v1/responses": 300_000,
  "/tools/invoke": 120_000,
  "/hooks/agent": 120_000,
  "/hooks/wake": 30_000,
  "/health": 5_000,
  "/metrics": 5_000,
};

export function resolveTimeout(path: string, config?: RouteTimeoutConfig): number {
  // User config overrides first.
  if (config?.routes) {
    for (const [prefix, ms] of Object.entries(config.routes)) {
      if (path.startsWith(prefix)) {
        return ms;
      }
    }
  }
  // Built-in route defaults.
  for (const [prefix, ms] of Object.entries(BUILT_IN_ROUTE_TIMEOUTS)) {
    if (path.startsWith(prefix)) {
      return ms;
    }
  }
  return config?.defaultMs ?? DEFAULT_TIMEOUT_MS;
}

/**
 * Wrap an HTTP handler with timeout enforcement.
 *
 * If the handler hasn't called `res.end()` within the timeout window a
 * 504 response is sent and the request is aborted.
 */
export function withTimeout(
  handler: (req: IncomingMessage, res: ServerResponse) => Promise<void> | void,
  config?: RouteTimeoutConfig,
): (req: IncomingMessage, res: ServerResponse) => void {
  return (req: IncomingMessage, res: ServerResponse) => {
    const path = new URL(req.url ?? "/", "http://localhost").pathname;
    const timeoutMs = resolveTimeout(path, config);

    let timedOut = false;
    const timer = setTimeout(() => {
      timedOut = true;
      if (!res.headersSent) {
        res.statusCode = 504;
        res.setHeader("Content-Type", "application/json; charset=utf-8");
        res.end(JSON.stringify({ error: { message: "Gateway Timeout", type: "timeout" } }));
      } else if (!res.writableEnded) {
        // Headers already sent (e.g. SSE streaming) — just close the connection.
        res.end();
      }
      metrics.inc("penguins_request_timeouts_total", { path });
      logWarn(`request-timeout: ${req.method} ${path} timed out after ${timeoutMs}ms`);
    }, timeoutMs);

    // Clear the timer when the response finishes normally.
    res.on("close", () => clearTimeout(timer));

    try {
      const result = handler(req, res);
      if (result && typeof result.catch === "function") {
        result.catch((err: unknown) => {
          clearTimeout(timer);
          if (!timedOut && !res.headersSent) {
            res.statusCode = 500;
            res.setHeader("Content-Type", "application/json; charset=utf-8");
            res.end(
              JSON.stringify({ error: { message: "Internal Server Error", type: "server_error" } }),
            );
          }
          logWarn(`request-timeout: unhandled error in ${req.method} ${path}: ${String(err)}`);
        });
      }
    } catch (err) {
      clearTimeout(timer);
      if (!timedOut && !res.headersSent) {
        res.statusCode = 500;
        res.setHeader("Content-Type", "application/json; charset=utf-8");
        res.end(
          JSON.stringify({ error: { message: "Internal Server Error", type: "server_error" } }),
        );
      }
      logWarn(`request-timeout: sync error in ${req.method} ${path}: ${String(err)}`);
    }
  };
}
