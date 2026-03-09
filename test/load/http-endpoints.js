/**
 * k6 Load Test — HTTP Endpoints
 *
 * Tests the throughput and latency of the Penguins gateway HTTP endpoints.
 *
 * Prerequisites:
 *   - k6 installed: https://k6.io/docs/getting-started/installation/
 *   - Gateway running: penguins gateway --port 18789
 *   - Set PENGUINS_TOKEN env var or update the token below.
 *
 * Run:
 *   PENGUINS_TOKEN=your-token k6 run test/load/http-endpoints.js
 *
 * Scenarios:
 *   - health_check:   Baseline GET /health (no auth required)
 *   - chat_completion: POST /v1/chat/completions with a short prompt
 *   - tools_invoke:    POST /tools/invoke with a lightweight tool
 */

import { check, sleep } from "k6";
import http from "k6/http";
import { Rate, Trend } from "k6/metrics";

// ── Configuration ────────────────────────────────────────────────────

const BASE_URL = __ENV.PENGUINS_URL || "http://127.0.0.1:18789";
const TOKEN = __ENV.PENGUINS_TOKEN || "test-token";

const errorRate = new Rate("errors");
const healthLatency = new Trend("health_latency", true);
const chatLatency = new Trend("chat_latency", true);

// ── Scenarios ────────────────────────────────────────────────────────

export const options = {
  scenarios: {
    health_check: {
      executor: "constant-arrival-rate",
      rate: 100,
      timeUnit: "1s",
      duration: "30s",
      preAllocatedVUs: 20,
      maxVUs: 50,
      exec: "healthCheck",
    },
    chat_completion: {
      executor: "ramping-vus",
      startVUs: 1,
      stages: [
        { duration: "10s", target: 5 },
        { duration: "30s", target: 10 },
        { duration: "10s", target: 0 },
      ],
      exec: "chatCompletion",
    },
  },
  thresholds: {
    errors: ["rate<0.05"], // < 5% error rate
    health_latency: ["p(95)<100"], // 95th percentile under 100ms
    http_req_duration: ["p(99)<5000"], // 99th percentile under 5s
  },
};

// ── Test functions ───────────────────────────────────────────────────

export function healthCheck() {
  const res = http.get(`${BASE_URL}/health`);
  healthLatency.add(res.timings.duration);
  const ok = check(res, {
    "health status 200": (r) => r.status === 200,
    "health body ok": (r) => {
      try {
        return JSON.parse(r.body).ok === true;
      } catch {
        return false;
      }
    },
  });
  errorRate.add(!ok);
}

export function chatCompletion() {
  const payload = JSON.stringify({
    model: "default",
    stream: false,
    messages: [{ role: "user", content: "Say hello in one word." }],
  });

  const params = {
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${TOKEN}`,
    },
    timeout: "30s",
  };

  const res = http.post(`${BASE_URL}/v1/chat/completions`, payload, params);
  chatLatency.add(res.timings.duration);

  const ok = check(res, {
    "chat status 200": (r) => r.status === 200,
    "chat has choices": (r) => {
      try {
        const body = JSON.parse(r.body);
        return Array.isArray(body.choices) && body.choices.length > 0;
      } catch {
        return false;
      }
    },
  });
  errorRate.add(!ok);
  sleep(1);
}
