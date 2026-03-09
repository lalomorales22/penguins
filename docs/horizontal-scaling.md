# Horizontal Scaling

Guide for running multiple Penguins gateway instances behind a load balancer.

## Architecture Overview

```
                 ┌──────────────┐
  Clients ──────►│ Load Balancer│
                 │ (nginx/HAProxy)│
                 └──────┬───────┘
                   ┌────┴────┐
                   │         │
              ┌────▼──┐ ┌───▼───┐
              │  GW 1 │ │  GW 2 │   ← Gateway instances
              └───┬───┘ └───┬───┘
                  │         │
              ┌───▼─────────▼───┐
              │   Shared State  │   ← Redis / SQLite / NFS
              └─────────────────┘
```

## Prerequisites

Horizontal scaling requires moving shared state out of the local filesystem:

| Component       | Single instance                | Multi-instance                  |
| --------------- | ------------------------------ | ------------------------------- |
| Sessions        | `~/.penguins/sessions/` (file) | Redis or SQLite (shared)        |
| Rate limiting   | In-memory Map                  | Redis (shared)                  |
| Config          | `~/.penguins/penguins.json`    | Shared volume or env vars       |
| API keys        | `~/.penguins/api-keys.json`    | Shared volume or Redis          |
| Cron scheduler  | In-memory                      | Leader election (one runs cron) |
| Device pairings | `~/.penguins/devices.json`     | Shared volume or Redis          |

## Load Balancer Configuration

### WebSocket Affinity

WebSocket connections are long-lived and stateful. The load balancer **must**
use sticky sessions (session affinity) to route all frames from one client to
the same gateway instance.

#### nginx

```nginx
upstream penguins_gateways {
    ip_hash;  # sticky sessions by client IP
    server 10.0.0.1:18789;
    server 10.0.0.2:18789;
}

server {
    listen 443 ssl;
    server_name penguins.example.com;

    location / {
        proxy_pass http://penguins_gateways;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_read_timeout 86400;  # 24h for WebSocket
    }
}
```

#### HAProxy

```haproxy
frontend penguins_front
    bind *:443 ssl crt /etc/ssl/penguins.pem
    default_backend penguins_back

backend penguins_back
    balance source    # sticky by source IP
    option httpchk GET /health
    server gw1 10.0.0.1:18789 check
    server gw2 10.0.0.2:18789 check
    timeout server 86400s
    timeout tunnel 86400s
```

## Shared State with Redis

Set the `PENGUINS_REDIS_URL` environment variable on all gateway instances:

```bash
export PENGUINS_REDIS_URL=redis://redis.internal:6379/0
```

When configured, the following subsystems use Redis instead of local state:

- **Rate limiting** — Sliding window counters are stored in Redis with TTL
- **Session locking** — Advisory locks via Redis `SET NX EX` instead of file locks
- **Usage quotas** — Token counters shared across instances

## Cron Leader Election

Only one gateway instance should run cron jobs to avoid duplicate execution.
When Redis is configured, gateways use a simple leader election:

1. Each instance attempts `SET penguins:cron:leader <instance-id> NX EX 60`
2. The instance that succeeds is the leader for 60 seconds
3. The leader renews the lock every 30 seconds
4. If the leader dies, another instance acquires the lock after expiry

No additional configuration is needed — this is automatic when `PENGUINS_REDIS_URL` is set.

## Health Checks

Each gateway exposes `/health` for the load balancer to probe:

```bash
curl http://10.0.0.1:18789/health
# {"ok":true}
```

The load balancer should remove unhealthy instances from the pool.

## Deployment Patterns

### Docker Compose (2 instances)

```yaml
services:
  redis:
    image: redis:7-alpine
    ports: ["6379:6379"]

  gateway-1:
    build: .
    environment:
      PENGUINS_REDIS_URL: redis://redis:6379/0
      PENGUINS_BIND: lan
    ports: ["18789:18789"]
    depends_on: [redis]

  gateway-2:
    build: .
    environment:
      PENGUINS_REDIS_URL: redis://redis:6379/0
      PENGUINS_BIND: lan
    ports: ["18790:18789"]
    depends_on: [redis]

  nginx:
    image: nginx:alpine
    volumes:
      - ./nginx.conf:/etc/nginx/nginx.conf:ro
    ports: ["443:443"]
    depends_on: [gateway-1, gateway-2]
```

### Kubernetes

```yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: penguins-gateway
spec:
  replicas: 3
  selector:
    matchLabels:
      app: penguins-gateway
  template:
    metadata:
      labels:
        app: penguins-gateway
    spec:
      containers:
        - name: gateway
          image: ghcr.io/penguins/penguins:latest
          command: ["penguins", "gateway"]
          ports:
            - containerPort: 18789
          env:
            - name: PENGUINS_REDIS_URL
              valueFrom:
                secretKeyRef:
                  name: penguins-secrets
                  key: redis-url
            - name: PENGUINS_BIND
              value: lan
          readinessProbe:
            httpGet:
              path: /health
              port: 18789
            periodSeconds: 10
          livenessProbe:
            httpGet:
              path: /health
              port: 18789
            periodSeconds: 30
---
apiVersion: v1
kind: Service
metadata:
  name: penguins-gateway
spec:
  sessionAffinity: ClientIP # sticky sessions
  sessionAffinityConfig:
    clientIP:
      timeoutSeconds: 10800
  ports:
    - port: 443
      targetPort: 18789
  selector:
    app: penguins-gateway
```

## Monitoring Multi-Instance Deployments

Each instance exposes its own `/metrics` endpoint. Use a Prometheus scrape config
to collect from all instances:

```yaml
scrape_configs:
  - job_name: penguins
    static_configs:
      - targets:
          - "10.0.0.1:18789"
          - "10.0.0.2:18789"
```

Key metrics to watch across instances:

- `penguins_ws_connections_active` — Should be balanced across instances
- `penguins_http_requests_total` — Verify even distribution
- `penguins_request_timeouts_total` — Identify overloaded instances
- `penguins_agent_runs_total` — Check for stuck agents

## Limitations

- **Memory/embeddings** — The local embedding index is per-instance. If you use
  local embeddings, each instance builds its own index. Use the OpenAI embedding
  backend for shared state: `PENGUINS_EMBEDDING_BACKEND=openai`.
- **File uploads** — The workspace directory must be on shared storage (NFS, EFS)
  for uploads to be accessible across instances.
- **Cron history** — Cron run history is stored in the leader's memory. Use the
  `/metrics` endpoint for cross-instance monitoring.
