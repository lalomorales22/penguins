/**
 * WebSocket Session Resumption
 *
 * Provides a lightweight event replay buffer so that clients reconnecting
 * after a brief disconnect can catch up on missed events without starting
 * a new agent run.
 *
 * How it works:
 * 1. The server assigns a `resumeToken` during the `hello-ok` handshake.
 * 2. Events sent to the client are buffered in a ring buffer keyed by the
 *    resume token.
 * 3. On reconnect the client sends `resume: { token, lastSeq }` in the
 *    `connect` frame.
 * 4. The server replays all events with `seq > lastSeq` and then resumes
 *    normal streaming.
 *
 * Buffers auto-expire after `ttlMs` of inactivity to prevent memory leaks
 * from abandoned sessions.
 */

import { randomUUID } from "node:crypto";

export type BufferedEvent = {
  seq: number;
  data: unknown;
  timestamp: number;
};

export type ResumeBuffer = {
  token: string;
  events: BufferedEvent[];
  lastSeq: number;
  lastActivityMs: number;
};

export type WsResumeManagerOptions = {
  /** Max events to keep per token. Default: 500. */
  maxEvents?: number;
  /** TTL in ms before a buffer is evicted. Default: 300 000 (5 min). */
  ttlMs?: number;
  /** How often to sweep expired buffers. Default: 60 000 (1 min). */
  sweepIntervalMs?: number;
};

const DEFAULT_MAX_EVENTS = 500;
const DEFAULT_TTL_MS = 5 * 60 * 1000;
const DEFAULT_SWEEP_MS = 60 * 1000;

export class WsResumeManager {
  private buffers = new Map<string, ResumeBuffer>();
  private maxEvents: number;
  private ttlMs: number;
  private sweepTimer: ReturnType<typeof setInterval> | null = null;

  constructor(opts: WsResumeManagerOptions = {}) {
    this.maxEvents = opts.maxEvents ?? DEFAULT_MAX_EVENTS;
    this.ttlMs = opts.ttlMs ?? DEFAULT_TTL_MS;

    const sweepInterval = opts.sweepIntervalMs ?? DEFAULT_SWEEP_MS;
    this.sweepTimer = setInterval(() => this.sweep(), sweepInterval);
    this.sweepTimer.unref();
  }

  /** Create a new resume buffer and return the token. */
  createToken(): string {
    const token = randomUUID();
    this.buffers.set(token, {
      token,
      events: [],
      lastSeq: 0,
      lastActivityMs: Date.now(),
    });
    return token;
  }

  /** Push an event into the buffer for a given token. */
  push(token: string, data: unknown): number | null {
    const buf = this.buffers.get(token);
    if (!buf) {
      return null;
    }

    buf.lastSeq += 1;
    buf.lastActivityMs = Date.now();

    buf.events.push({
      seq: buf.lastSeq,
      data,
      timestamp: Date.now(),
    });

    // Trim to ring buffer size.
    if (buf.events.length > this.maxEvents) {
      buf.events.splice(0, buf.events.length - this.maxEvents);
    }

    return buf.lastSeq;
  }

  /** Get events after `lastSeq` for replay. Returns null if token is unknown or expired. */
  getEventsSince(token: string, lastSeq: number): BufferedEvent[] | null {
    const buf = this.buffers.get(token);
    if (!buf) {
      return null;
    }

    buf.lastActivityMs = Date.now();
    return buf.events.filter((e) => e.seq > lastSeq);
  }

  /** Remove a buffer (client disconnected permanently). */
  remove(token: string): void {
    this.buffers.delete(token);
  }

  /** Sweep expired buffers. */
  private sweep(): void {
    const now = Date.now();
    for (const [token, buf] of this.buffers) {
      if (now - buf.lastActivityMs > this.ttlMs) {
        this.buffers.delete(token);
      }
    }
  }

  /** Number of active buffers (for diagnostics). */
  get size(): number {
    return this.buffers.size;
  }

  /** Stop the sweep timer (for clean shutdown). */
  dispose(): void {
    if (this.sweepTimer) {
      clearInterval(this.sweepTimer);
      this.sweepTimer = null;
    }
    this.buffers.clear();
  }
}
