# Load Tests

Performance and stress tests for the Penguins gateway using [k6](https://k6.io/).

## Prerequisites

1. Install k6: https://k6.io/docs/getting-started/installation/
2. Start the gateway: `penguins gateway --port 18789`
3. Set your gateway token: `export PENGUINS_TOKEN=your-token`

## Running Tests

### HTTP endpoint throughput

```bash
PENGUINS_TOKEN=your-token k6 run test/load/http-endpoints.js
```

Tests `/health` at 100 req/s and `/v1/chat/completions` with up to 10 concurrent VUs.

### WebSocket connection stress

```bash
PENGUINS_TOKEN=your-token k6 run test/load/websocket-connections.js
```

Ramps up to 100 concurrent WebSocket connections, authenticates, and holds them open.

## Configuration

| Environment Variable | Default                  | Description      |
| -------------------- | ------------------------ | ---------------- |
| `PENGUINS_URL`       | `http://127.0.0.1:18789` | Gateway base URL |
| `PENGUINS_TOKEN`     | `test-token`             | Auth token       |

## Thresholds

- HTTP error rate < 5%
- `/health` p95 latency < 100ms
- Overall HTTP p99 latency < 5s
- WebSocket error rate < 10%
