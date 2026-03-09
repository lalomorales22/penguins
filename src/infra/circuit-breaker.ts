/**
 * Circuit breaker pattern for external service calls (AI providers, webhooks, etc.).
 *
 * States:
 * - CLOSED:    Requests flow normally. Failures are counted.
 * - OPEN:      Requests are rejected immediately. After `resetTimeoutMs` the
 *              breaker transitions to HALF_OPEN.
 * - HALF_OPEN: A single probe request is allowed through. If it succeeds the
 *              breaker closes; if it fails the breaker reopens.
 *
 * Usage:
 *   const breaker = new CircuitBreaker("openai", { failureThreshold: 5 });
 *   const result = await breaker.call(() => fetchFromProvider(url));
 */

export type CircuitBreakerState = "closed" | "open" | "half_open";

export class CircuitBreakerOpenError extends Error {
  constructor(
    public readonly breakerName: string,
    public readonly nextRetryMs: number,
  ) {
    super(`Circuit breaker "${breakerName}" is open — retry in ${Math.ceil(nextRetryMs / 1000)}s`);
    this.name = "CircuitBreakerOpenError";
  }
}

export type CircuitBreakerOptions = {
  /** Consecutive failures before opening the circuit. Default: 5 */
  failureThreshold?: number;
  /** Milliseconds the circuit stays open before allowing a probe. Default: 30 000 */
  resetTimeoutMs?: number;
  /** Optional predicate — return `true` if the error should count as a failure.
   *  Useful for ignoring 4xx client errors (only trip on 5xx / network). */
  isFailure?: (err: unknown) => boolean;
  /** Called on state transitions. */
  onStateChange?: (name: string, from: CircuitBreakerState, to: CircuitBreakerState) => void;
};

const DEFAULT_FAILURE_THRESHOLD = 5;
const DEFAULT_RESET_TIMEOUT_MS = 30_000;

export class CircuitBreaker {
  readonly name: string;

  private state: CircuitBreakerState = "closed";
  private failures = 0;
  private lastFailureTime = 0;
  private readonly failureThreshold: number;
  private readonly resetTimeoutMs: number;
  private readonly isFailure: (err: unknown) => boolean;
  private readonly onStateChange?: (
    name: string,
    from: CircuitBreakerState,
    to: CircuitBreakerState,
  ) => void;

  constructor(name: string, opts: CircuitBreakerOptions = {}) {
    this.name = name;
    this.failureThreshold = opts.failureThreshold ?? DEFAULT_FAILURE_THRESHOLD;
    this.resetTimeoutMs = opts.resetTimeoutMs ?? DEFAULT_RESET_TIMEOUT_MS;
    this.isFailure = opts.isFailure ?? (() => true);
    this.onStateChange = opts.onStateChange;
  }

  /** Execute `fn` through the circuit breaker. Rejects immediately when open. */
  async call<T>(fn: () => Promise<T>): Promise<T> {
    if (this.state === "open") {
      const elapsed = Date.now() - this.lastFailureTime;
      if (elapsed >= this.resetTimeoutMs) {
        this.transition("half_open");
      } else {
        throw new CircuitBreakerOpenError(this.name, this.resetTimeoutMs - elapsed);
      }
    }

    try {
      const result = await fn();
      this.onSuccess();
      return result;
    } catch (err) {
      if (this.isFailure(err)) {
        this.onFailure();
      }
      throw err;
    }
  }

  /** Current state. */
  getState(): CircuitBreakerState {
    return this.state;
  }

  /** Consecutive failure count. */
  getFailures(): number {
    return this.failures;
  }

  /** Manually reset the breaker to closed. */
  reset(): void {
    this.failures = 0;
    if (this.state !== "closed") {
      this.transition("closed");
    }
  }

  /** Snapshot for diagnostics / metrics. */
  toJSON(): {
    name: string;
    state: CircuitBreakerState;
    failures: number;
    lastFailureTime: number;
  } {
    return {
      name: this.name,
      state: this.state,
      failures: this.failures,
      lastFailureTime: this.lastFailureTime,
    };
  }

  // ── internals ──────────────────────────────────────────────────────────

  private onSuccess(): void {
    this.failures = 0;
    if (this.state !== "closed") {
      this.transition("closed");
    }
  }

  private onFailure(): void {
    this.failures += 1;
    this.lastFailureTime = Date.now();

    if (this.state === "half_open") {
      // Probe failed — reopen.
      this.transition("open");
    } else if (this.state === "closed" && this.failures >= this.failureThreshold) {
      this.transition("open");
    }
  }

  private transition(to: CircuitBreakerState): void {
    const from = this.state;
    if (from === to) {
      return;
    }
    this.state = to;
    this.onStateChange?.(this.name, from, to);
  }
}

// ── Registry for per-provider breakers ──────────────────────────────────

const breakers = new Map<string, CircuitBreaker>();

/**
 * Get or create a circuit breaker for a named service (e.g. `"openai"`, `"anthropic"`).
 *
 * Options are only applied when the breaker is first created; subsequent calls
 * with the same `name` return the existing instance.
 */
export function getCircuitBreaker(name: string, opts?: CircuitBreakerOptions): CircuitBreaker {
  let cb = breakers.get(name);
  if (!cb) {
    cb = new CircuitBreaker(name, opts);
    breakers.set(name, cb);
  }
  return cb;
}

/** Snapshot of all breakers for the /health or /metrics endpoint. */
export function allCircuitBreakers(): Array<ReturnType<CircuitBreaker["toJSON"]>> {
  return [...breakers.values()].map((cb) => cb.toJSON());
}

/** Reset all breakers (useful in tests). */
export function resetAllCircuitBreakers(): void {
  for (const cb of breakers.values()) {
    cb.reset();
  }
  breakers.clear();
}
