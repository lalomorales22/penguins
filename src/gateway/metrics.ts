/**
 * Lightweight Prometheus-style metrics collector for the Penguins gateway.
 *
 * Exposes counters, gauges, and histograms in text/plain Prometheus exposition
 * format at `/metrics`. No external dependencies — this is a minimal built-in
 * implementation suitable for scraping by Prometheus, Grafana Agent, etc.
 */

// ── Counters ──────────────────────────────────────────────────────────

const counters = new Map<string, { value: number; help: string; labels: Map<string, number> }>();

function counterInc(name: string, labels?: Record<string, string>, delta = 1): void {
  let c = counters.get(name);
  if (!c) {
    c = { value: 0, help: "", labels: new Map() };
    counters.set(name, c);
  }
  if (labels) {
    const key = serializeLabels(labels);
    c.labels.set(key, (c.labels.get(key) ?? 0) + delta);
  } else {
    c.value += delta;
  }
}

// ── Gauges ────────────────────────────────────────────────────────────

const gauges = new Map<string, { value: number; help: string }>();

function gaugeSet(name: string, value: number): void {
  let g = gauges.get(name);
  if (!g) {
    g = { value: 0, help: "" };
    gauges.set(name, g);
  }
  g.value = value;
}

// ── Histograms ────────────────────────────────────────────────────────

const histogramBuckets = [0.005, 0.01, 0.025, 0.05, 0.1, 0.25, 0.5, 1, 2.5, 5, 10, 30, 60];

const histograms = new Map<
  string,
  { help: string; buckets: number[]; counts: number[]; sum: number; count: number }
>();

function histogramObserve(name: string, value: number): void {
  let h = histograms.get(name);
  if (!h) {
    h = {
      help: "",
      buckets: histogramBuckets,
      counts: Array.from({ length: histogramBuckets.length + 1 }, () => 0),
      sum: 0,
      count: 0,
    };
    histograms.set(name, h);
  }
  h.sum += value;
  h.count += 1;
  for (let i = 0; i < h.buckets.length; i++) {
    if (value <= h.buckets[i]) {
      h.counts[i] += 1;
    }
  }
  h.counts[h.buckets.length] += 1; // +Inf bucket
}

// ── Helpers ───────────────────────────────────────────────────────────

function serializeLabels(labels: Record<string, string>): string {
  return Object.entries(labels)
    .map(([k, v]) => `${k}="${v}"`)
    .join(",");
}

// ── Public API ────────────────────────────────────────────────────────

export const metrics = {
  /** Increment a counter. */
  inc(name: string, labels?: Record<string, string>, delta?: number) {
    counterInc(name, labels, delta);
  },

  /** Set a gauge value. */
  set(name: string, value: number) {
    gaugeSet(name, value);
  },

  /** Observe a histogram value (in seconds). */
  observe(name: string, valueSeconds: number) {
    histogramObserve(name, valueSeconds);
  },

  /** Record HTTP request metrics. */
  httpRequest(method: string, path: string, status: number, durationMs: number) {
    counterInc("penguins_http_requests_total", {
      method,
      path: normalizePath(path),
      status: String(status),
    });
    histogramObserve("penguins_http_request_duration_seconds", durationMs / 1000);
  },

  /** Record WebSocket connection count. */
  wsConnections(count: number) {
    gaugeSet("penguins_ws_connections_active", count);
  },

  /** Record agent execution. */
  agentRun(durationMs: number, success: boolean) {
    counterInc("penguins_agent_runs_total", { status: success ? "ok" : "error" });
    histogramObserve("penguins_agent_run_duration_seconds", durationMs / 1000);
  },

  /** Record cron job execution. */
  cronRun(jobId: string, status: string, durationMs: number) {
    counterInc("penguins_cron_runs_total", { job_id: jobId, status });
    histogramObserve("penguins_cron_run_duration_seconds", durationMs / 1000);
  },

  /** Serialize all metrics to Prometheus exposition format. */
  serialize(): string {
    const lines: string[] = [];

    // Counters
    for (const [name, c] of counters) {
      if (c.help) {
        lines.push(`# HELP ${name} ${c.help}`);
      }
      lines.push(`# TYPE ${name} counter`);
      if (c.labels.size > 0) {
        for (const [labelStr, val] of c.labels) {
          lines.push(`${name}{${labelStr}} ${val}`);
        }
      } else {
        lines.push(`${name} ${c.value}`);
      }
    }

    // Gauges
    for (const [name, g] of gauges) {
      if (g.help) {
        lines.push(`# HELP ${name} ${g.help}`);
      }
      lines.push(`# TYPE ${name} gauge`);
      lines.push(`${name} ${g.value}`);
    }

    // Histograms
    for (const [name, h] of histograms) {
      if (h.help) {
        lines.push(`# HELP ${name} ${h.help}`);
      }
      lines.push(`# TYPE ${name} histogram`);
      let cumulative = 0;
      for (let i = 0; i < h.buckets.length; i++) {
        cumulative += h.counts[i];
        lines.push(`${name}_bucket{le="${h.buckets[i]}"} ${cumulative}`);
      }
      lines.push(`${name}_bucket{le="+Inf"} ${h.counts[h.buckets.length]}`);
      lines.push(`${name}_sum ${h.sum}`);
      lines.push(`${name}_count ${h.count}`);
    }

    return lines.join("\n") + "\n";
  },
};

/** Normalize request path for metric labels (collapse IDs into placeholders). */
function normalizePath(path: string): string {
  // /v1/chat/completions → /v1/chat/completions
  // /hooks/agent → /hooks/agent
  // /__penguins__/canvas/abc123 → /__penguins__/canvas/:id
  return path.replace(/\/[0-9a-f]{8,}(?:-[0-9a-f]+)*/gi, "/:id").replace(/\/\d+/g, "/:id");
}
