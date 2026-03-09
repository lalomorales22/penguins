import type { IncomingMessage, ServerResponse } from "node:http";
import type { GatewayAuthResult } from "./auth.js";
import { readJsonBody } from "./hooks.js";

export function sendJson(res: ServerResponse, status: number, body: unknown) {
  res.statusCode = status;
  res.setHeader("Content-Type", "application/json; charset=utf-8");
  res.end(JSON.stringify(body));
}

export function sendText(res: ServerResponse, status: number, body: string) {
  res.statusCode = status;
  res.setHeader("Content-Type", "text/plain; charset=utf-8");
  res.end(body);
}

export function sendMethodNotAllowed(res: ServerResponse, allow = "POST") {
  res.setHeader("Allow", allow);
  sendText(res, 405, "Method Not Allowed");
}

export function sendUnauthorized(res: ServerResponse) {
  sendJson(res, 401, {
    error: { message: "Unauthorized", type: "unauthorized" },
  });
}

export function sendRateLimited(res: ServerResponse, retryAfterMs?: number) {
  if (retryAfterMs && retryAfterMs > 0) {
    res.setHeader("Retry-After", String(Math.ceil(retryAfterMs / 1000)));
  }
  sendJson(res, 429, {
    error: {
      message: "Too many failed authentication attempts. Please try again later.",
      type: "rate_limited",
    },
  });
}

export function sendGatewayAuthFailure(res: ServerResponse, authResult: GatewayAuthResult) {
  if (authResult.rateLimited) {
    sendRateLimited(res, authResult.retryAfterMs);
    return;
  }
  sendUnauthorized(res);
}

export function sendInvalidRequest(res: ServerResponse, message: string) {
  sendJson(res, 400, {
    error: { message, type: "invalid_request_error" },
  });
}

export async function readJsonBodyOrError(
  req: IncomingMessage,
  res: ServerResponse,
  maxBytes: number,
): Promise<unknown> {
  const body = await readJsonBody(req, maxBytes);
  if (!body.ok) {
    if (body.error === "payload too large") {
      sendJson(res, 413, {
        error: { message: "Payload too large", type: "invalid_request_error" },
      });
      return undefined;
    }
    if (body.error === "request body timeout") {
      sendJson(res, 408, {
        error: { message: "Request body timeout", type: "invalid_request_error" },
      });
      return undefined;
    }
    sendInvalidRequest(res, body.error);
    return undefined;
  }
  return body.value;
}

export function writeDone(res: ServerResponse) {
  res.write("data: [DONE]\n\n");
}

export function setSseHeaders(res: ServerResponse) {
  res.statusCode = 200;
  res.setHeader("Content-Type", "text/event-stream; charset=utf-8");
  res.setHeader("Cache-Control", "no-cache");
  res.setHeader("Connection", "keep-alive");
  res.flushHeaders?.();
}

// ── Backpressure-aware SSE writing ──────────────────────────────────────

/** High-water mark in bytes. If `res.writableLength` exceeds this, we
 *  wait for the kernel buffer to drain before writing more data. */
const SSE_HIGH_WATER_MARK = 64 * 1024; // 64 KiB

/**
 * Write an SSE chunk with backpressure check.
 *
 * Returns `false` when the client has disconnected or the response is
 * no longer writable (caller should unsubscribe from the event source).
 */
export function sseWrite(res: ServerResponse, chunk: string): boolean {
  if (res.destroyed || res.writableEnded) {
    return false;
  }
  res.write(chunk);
  return true;
}

/**
 * Check whether the SSE buffer is above the high-water mark.
 * Callers can use this to decide whether to drop non-critical events
 * while the kernel buffer drains.
 */
export function sseIsBackpressured(res: ServerResponse): boolean {
  return res.writableLength >= SSE_HIGH_WATER_MARK;
}

/**
 * Wait for the writable buffer to drain if it's above the high-water mark.
 * Returns a promise that resolves when it's safe to write again, or rejects
 * if the response closes.
 */
export function sseDrainIfNeeded(res: ServerResponse): Promise<void> {
  if (res.destroyed || res.writableEnded) {
    return Promise.reject(new Error("response closed"));
  }
  if (res.writableLength < SSE_HIGH_WATER_MARK) {
    return Promise.resolve();
  }
  return new Promise<void>((resolve, reject) => {
    const onDrain = () => {
      cleanup();
      resolve();
    };
    const onClose = () => {
      cleanup();
      reject(new Error("response closed"));
    };
    const cleanup = () => {
      res.removeListener("drain", onDrain);
      res.removeListener("close", onClose);
    };
    res.once("drain", onDrain);
    res.once("close", onClose);
  });
}
