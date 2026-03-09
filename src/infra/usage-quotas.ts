/**
 * Token usage quota enforcement.
 *
 * Tracks token usage per API key (or per-session fallback) and rejects
 * requests that exceed configurable monthly/daily limits.
 *
 * Storage: in-memory counters per billing period. Resets automatically
 * when the period rolls over. For persistence across restarts the
 * counters can be flushed to / loaded from the state directory.
 */

export type QuotaConfig = {
  /** Max tokens per calendar month. 0 = unlimited. */
  monthlyTokenLimit?: number;
  /** Max tokens per calendar day. 0 = unlimited. */
  dailyTokenLimit?: number;
  /** Max requests per calendar day. 0 = unlimited. */
  dailyRequestLimit?: number;
};

export type QuotaEntry = {
  /** Tokens consumed in the current month. */
  monthlyTokens: number;
  /** Month key "YYYY-MM". */
  monthKey: string;
  /** Tokens consumed today. */
  dailyTokens: number;
  /** Requests made today. */
  dailyRequests: number;
  /** Day key "YYYY-MM-DD". */
  dayKey: string;
};

export type QuotaCheckResult = {
  allowed: boolean;
  reason?: string;
  /** Current usage snapshot. */
  usage: QuotaEntry;
};

function monthKey(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
}

function dayKey(): string {
  return new Date().toISOString().slice(0, 10);
}

export class UsageQuotaTracker {
  private entries = new Map<string, QuotaEntry>();
  private defaultQuota: QuotaConfig;

  constructor(defaultQuota: QuotaConfig = {}) {
    this.defaultQuota = defaultQuota;
  }

  /** Get or create a fresh entry for `subject`, rolling over periods as needed. */
  private getEntry(subject: string): QuotaEntry {
    let entry = this.entries.get(subject);
    const mk = monthKey();
    const dk = dayKey();

    if (!entry) {
      entry = { monthlyTokens: 0, monthKey: mk, dailyTokens: 0, dailyRequests: 0, dayKey: dk };
      this.entries.set(subject, entry);
      return entry;
    }

    // Roll over month.
    if (entry.monthKey !== mk) {
      entry.monthlyTokens = 0;
      entry.monthKey = mk;
    }

    // Roll over day.
    if (entry.dayKey !== dk) {
      entry.dailyTokens = 0;
      entry.dailyRequests = 0;
      entry.dayKey = dk;
    }

    return entry;
  }

  /** Check whether a request is allowed before executing it. */
  check(subject: string, quota?: QuotaConfig): QuotaCheckResult {
    const q = quota ?? this.defaultQuota;
    const entry = this.getEntry(subject);

    if (
      q.monthlyTokenLimit &&
      q.monthlyTokenLimit > 0 &&
      entry.monthlyTokens >= q.monthlyTokenLimit
    ) {
      return { allowed: false, reason: "monthly token limit exceeded", usage: { ...entry } };
    }
    if (q.dailyTokenLimit && q.dailyTokenLimit > 0 && entry.dailyTokens >= q.dailyTokenLimit) {
      return { allowed: false, reason: "daily token limit exceeded", usage: { ...entry } };
    }
    if (
      q.dailyRequestLimit &&
      q.dailyRequestLimit > 0 &&
      entry.dailyRequests >= q.dailyRequestLimit
    ) {
      return { allowed: false, reason: "daily request limit exceeded", usage: { ...entry } };
    }

    return { allowed: true, usage: { ...entry } };
  }

  /** Record usage after a successful request. */
  record(subject: string, tokens: number): void {
    const entry = this.getEntry(subject);
    entry.monthlyTokens += tokens;
    entry.dailyTokens += tokens;
    entry.dailyRequests += 1;
  }

  /** Get usage for a subject (read-only). */
  getUsage(subject: string): QuotaEntry | undefined {
    return this.entries.get(subject);
  }

  /** Snapshot of all subjects. */
  allUsage(): Array<{ subject: string; usage: QuotaEntry }> {
    return [...this.entries.entries()].map(([subject, usage]) => ({
      subject,
      usage: { ...usage },
    }));
  }

  /** Clear all tracked usage (useful in tests). */
  reset(): void {
    this.entries.clear();
  }
}

/** Singleton instance for the gateway. */
let globalTracker: UsageQuotaTracker | null = null;

export function getUsageQuotaTracker(defaultQuota?: QuotaConfig): UsageQuotaTracker {
  if (!globalTracker) {
    globalTracker = new UsageQuotaTracker(defaultQuota);
  }
  return globalTracker;
}

export function resetUsageQuotaTracker(): void {
  globalTracker?.reset();
  globalTracker = null;
}
