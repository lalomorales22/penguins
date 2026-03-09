# Penguins

Penguins is a self-hosted AI gateway with built-in browser chat, a private
browser Control UI, and a CLI. Run one Gateway process on your machine or
server, then reach it locally or through a private tunnel such as Cloudflare
Tunnel + Access, SSH, or Tailscale.

Full docs: [docs.penguins.ai](https://docs.penguins.ai)

## What Penguins gives you

- One always-on Gateway process for browser chat, the Control UI, the CLI, sessions, tools, automations, and HTTP APIs
- A built-in browser chat and Control UI at `http://127.0.0.1:18789/`
- Agent tools, memory, skills, multi-agent support, and persistent sessions
- A single place to manage config, logs, sessions, cron, skills, and health checks
- Local, Cloudflare Tunnel, SSH-tunneled, Tailscale, and containerized deployment paths
- OpenAI-compatible HTTP API with streaming, tool calling, and structured responses
- Per-user API keys with role-based access (admin/operator/viewer)
- Usage quotas with monthly and daily token and request limits
- Circuit breaker for provider resilience with automatic recovery
- Backpressure-aware SSE streaming that handles slow clients gracefully
- Per-route request timeouts with configurable overrides
- WebSocket session resumption with event replay on reconnect
- Prometheus metrics at `/metrics` and health checks at `/health`
- Extension system with hook timeout enforcement
- Horizontal scaling with Redis-backed shared state and cron leader election
- CI/CD pipelines, security scanning, and automated Docker builds

## Built-in app surfaces

The core Penguins app ships with three built-in surfaces:

- Browser chat for day-to-day conversations with your agent
- Control UI for config, logs, sessions, cron, skills, and operator workflows
- CLI for setup, scripting, status, and automation tasks

Everything else should be treated as an optional integration layer you build on
top of the Gateway.

## Fastest way to get Penguins running

This is the shortest path from zero to a working local chat.

### Requirements

- Node.js 22 or newer
- macOS, Linux, or Windows via WSL2
- Credentials for at least one model provider

If you already have Node installed, check it with:

```bash
node --version
```

### Install

Recommended installer:

```bash
curl -fsSL https://penguins.ai/install.sh | bash
```

Windows PowerShell:

```powershell
iwr -useb https://penguins.ai/install.ps1 | iex
```

Alternative global install:

```bash
npm install -g penguins@latest
```

More install methods: [Install guide](https://docs.penguins.ai/install)

### Temporary installer on your own domain

If you want a one-line install before you publish Penguins to npm or stand up
the official installer host, this repo now includes temporary self-hostable
Git-based installers in `scripts/hosted-installers/`.

Serve these files over HTTPS from any domain you already own:

- `scripts/hosted-installers/install.sh`
- `scripts/hosted-installers/install.ps1`

Then run:

```bash
curl -fsSL https://your-domain.example/install.sh | bash
```

```powershell
iwr -useb https://your-domain.example/install.ps1 | iex
```

These temporary scripts clone the GitHub repo, build Penguins locally, and
write a `penguins` wrapper. They currently expect Git and Node 22.12+ to
already be installed. They prefer `corepack`, but can also fall back to
`pnpm` or `npx`.

### Run onboarding

```bash
penguins onboard --install-daemon
```

This guided flow sets up:

- your config file
- your workspace
- gateway auth
- model/provider auth
- optional remote access and skills
- a managed Gateway service

Wizard details: [Getting started](https://docs.penguins.ai/start/getting-started) and [CLI onboard](https://docs.penguins.ai/cli/onboard)

### Check that the Gateway is running

```bash
penguins gateway status
penguins status
```

Healthy baseline: the gateway is running and the RPC probe succeeds.

### Open Penguins

```bash
penguins dashboard
```

That opens the browser Control UI. You can also print the URL without launching a browser:

```bash
penguins dashboard --no-open
```

Default local URL:

```text
http://127.0.0.1:18789/
```

If the Control UI asks for auth, get the current token with:

```bash
penguins config get gateway.auth.token
```

Control UI docs: [Dashboard](https://docs.penguins.ai/web/dashboard) and [Control UI](https://docs.penguins.ai/web/control-ui)

## The commands you will use most

| Command                   | What it does                                  |
| ------------------------- | --------------------------------------------- |
| `penguins onboard`        | Full guided first-run setup                   |
| `penguins setup`          | Minimal config and workspace bootstrap        |
| `penguins configure`      | Re-open the config wizard later               |
| `penguins gateway`        | Run the Gateway in the foreground             |
| `penguins gateway status` | Check the Gateway service                     |
| `penguins dashboard`      | Open the browser Control UI                   |
| `penguins status`         | Show current gateway/runtime status           |
| `penguins logs --follow`  | Tail logs                                     |
| `penguins doctor`         | Diagnose config, auth, and environment issues |

CLI reference: [CLI index](https://docs.penguins.ai/cli)

## Manual local run in the foreground

If you do not want the managed service yet, you can run Penguins directly in one terminal and open
the UI from another.

### 1. Onboard without relying on the daemon

```bash
penguins onboard
```

### 2. Start the Gateway

```bash
penguins gateway --port 18789
```

Useful variants:

```bash
penguins gateway --verbose
penguins gateway --force
```

### 3. Verify it

```bash
penguins status
penguins gateway status
penguins logs --follow
```

### 4. Open the app

```bash
penguins dashboard
```

Or open the local URL manually:

```text
http://127.0.0.1:18789/
```

Gateway operations guide: [Gateway runbook](https://docs.penguins.ai/gateway)

## How Penguins is laid out

- The Gateway is the always-on service.
- The browser chat and Control UI talk directly to the Gateway on the same port.
- The CLI talks to the same Gateway for status, config, and automation tasks.
- Config lives on the gateway host.
- Session history and state also live on the gateway host.

The default Gateway port is `18789`.

## HTTP API

Penguins exposes OpenAI-compatible HTTP endpoints (when enabled in config):

| Endpoint                    | Description                                                     |
| --------------------------- | --------------------------------------------------------------- |
| `POST /v1/chat/completions` | OpenAI-compatible chat completion (streaming and non-streaming) |
| `POST /v1/responses`        | Structured response with tool calling                           |
| `POST /tools/invoke`        | Direct tool execution                                           |
| `POST /hooks/wake`          | Trigger agent wake event                                        |
| `POST /hooks/agent`         | Dispatch agent command                                          |
| `GET /health`               | Health check (returns `{"ok":true}`)                            |
| `GET /metrics`              | Prometheus metrics (connections, requests, latency, agent runs) |

All endpoints require `Authorization: Bearer <token>` or `X-Penguins-Token` header.

Per-route timeouts are enforced automatically (5 min for chat/responses, 5 s for health/metrics, 2 min default). Override timeouts in your config under `gateway.routeTimeouts`.

Full API spec: [docs/openapi.yaml](docs/openapi.yaml)

## Authentication and API keys

Penguins supports two authentication methods:

- **Shared token/password** — Set via config or `PENGUINS_GATEWAY_TOKEN` / `PENGUINS_GATEWAY_PASSWORD` env vars. Good for single-user setups.
- **Per-user API keys** — `pk_`-prefixed keys with SHA-256 hashed storage and role-based access control.

API key roles:

| Role       | Access                                          |
| ---------- | ----------------------------------------------- |
| `admin`    | Full access to all endpoints and config         |
| `operator` | Chat, tools, and hooks — no config changes      |
| `viewer`   | Read-only access to health, metrics, and status |

Keys support optional per-key rate limits. Rotate keys without downtime using the key rotation API.

## Usage quotas

Track and enforce token usage per user or API key:

- Monthly and daily token limits
- Daily request limits
- Automatic rollover on period boundaries
- Counters visible via the Control UI and metrics endpoint

Configure quotas in `gateway.quotas` or per API key.

## Provider resilience

The gateway protects against provider outages with a built-in circuit breaker:

- Tracks failures per provider (closed → open after threshold → half_open after cooldown → closed on success)
- Configurable failure threshold and reset timeout
- Provider-specific state visible via diagnostics
- Automatic recovery when the provider comes back online

SSE streaming responses use backpressure-aware writes that detect slow or disconnected clients and avoid buffering unbounded data in memory.

## WebSocket protocol

The Gateway uses a JSON-RPC-style WebSocket protocol for real-time communication between clients and the gateway.

- Protocol version negotiation on connect (`minProtocol`/`maxProtocol`)
- Challenge-based authentication handshake
- Heartbeat ticks to detect stale connections
- Session resumption with event replay — clients can reconnect and receive missed events via sequence-numbered ring buffers

Protocol reference: [docs/gateway-protocol.md](docs/gateway-protocol.md)

## Extensions

Penguins has a plugin system for adding tools, hooks, commands, and channels:

```
~/.penguins/extensions/my-extension/
  penguins.plugin.json    # metadata
  index.ts                # entry point
```

Extension hooks run with a configurable timeout (default 30 s) to prevent runaway handlers from blocking the gateway.

Extension developer guide: [docs/extensions.md](docs/extensions.md)

## Private remote access

Secure default:

- keep the Gateway bound to loopback
- keep gateway auth enabled
- expose it through Cloudflare Tunnel + Access, Tailscale Serve, or an SSH tunnel

### Cloudflare Tunnel note

If you want a public HTTPS hostname for the browser UI, use Cloudflare Tunnel +
Cloudflare Access with `gateway.auth.mode="trusted-proxy"`. The clean same-host
shape is:

- `gateway.bind: "loopback"`
- `gateway.trustedProxies: ["127.0.0.1", "::1"]`
- `gateway.auth.trustedProxy.userHeader: "cf-access-authenticated-user-email"`

Full guide: [Cloudflare Tunnel](https://docs.penguins.ai/gateway/cloudflare-tunnel)

### SSH tunnel example

```bash
ssh -N -L 18789:127.0.0.1:18789 user@host
```

Then open:

```text
http://127.0.0.1:18789/
```

and authenticate with the gateway token or password.

### Tailscale note

Tailscale Serve can satisfy the Control UI and Gateway WebSocket handshake for allowed users, but
privileged HTTP endpoints such as `/tools/invoke`, `/v1/chat/completions`, and `/v1/responses`
still require bearer auth.

Remote docs:

- [Remote access](https://docs.penguins.ai/gateway/remote)
- [Cloudflare Tunnel](https://docs.penguins.ai/gateway/cloudflare-tunnel)
- [Tailscale](https://docs.penguins.ai/gateway/tailscale)
- [Security](https://docs.penguins.ai/gateway/security)

## Security

The gateway ships with production security defaults:

- SSRF-protected outbound fetches (blocks private/loopback IPs, follows redirects safely)
- Security headers on all HTTP responses (CSP, HSTS, X-Content-Type-Options, X-Frame-Options)
- CORS configuration with configurable allowed origins
- Timing-safe token comparison to prevent timing attacks
- SHA-256 hashed API key storage
- Rate limiting (per-key and global)

Security model documentation: [docs/security.md](docs/security.md)

## Monitoring

Every gateway instance exposes a Prometheus-compatible `/metrics` endpoint:

- `penguins_ws_connections_active` — Current WebSocket connections
- `penguins_http_requests_total` — HTTP request counter by route and status
- `penguins_request_timeouts_total` — Timed-out requests
- `penguins_agent_runs_total` — Agent execution counter

The `/health` endpoint returns `{"ok":true}` for load balancer probes.

Use `penguins doctor` to diagnose config, auth, and environment issues locally.

## Docker

If you want a containerized deployment, the repo includes a Docker setup flow.

From the repo root:

```bash
./docker-setup.sh
```

That script builds the image, runs onboarding, starts Docker Compose, and generates a gateway token.

After startup:

```bash
docker compose run --rm penguins-cli dashboard --no-open
```

Then open the printed URL and paste the token into the Control UI if needed.

Docker guide: [Docker install](https://docs.penguins.ai/install/docker)

## Horizontal scaling

Run multiple gateway instances behind a load balancer for higher availability:

- nginx or HAProxy with sticky sessions (required for WebSocket affinity)
- Redis for shared rate limiting, session locking, and usage quota counters
- Automatic cron leader election — only one instance runs scheduled jobs
- Docker Compose and Kubernetes deployment examples included

Set `PENGUINS_REDIS_URL` on all instances to enable shared state.

Full guide: [docs/horizontal-scaling.md](docs/horizontal-scaling.md)

## From source

For contributors or anyone running from a local checkout:

```bash
git clone https://github.com/penguins/penguins.git
cd penguins
corepack enable
pnpm install
pnpm ui:build
pnpm build
```

Notes:

- `pnpm ui:build` builds the browser Control UI assets from the `ui/` workspace.
- `pnpm build` builds the CLI, Gateway, plugin SDK, and bundled runtime assets.
- On a fresh checkout, a quick smoke test is:

```bash
pnpm penguins --help
```

Run from source without a global install:

```bash
pnpm penguins --help
pnpm penguins onboard
pnpm penguins gateway --port 18789
pnpm penguins dashboard --no-open
```

Or link the CLI globally:

```bash
pnpm link --global
```

Development commands:

```bash
pnpm dev
pnpm ui:build
pnpm build
pnpm test
pnpm check
pnpm tsgo
```

### Load testing

The repo includes [k6](https://k6.io/) load tests for HTTP throughput and WebSocket connection stress:

```bash
PENGUINS_TOKEN=your-token k6 run test/load/http-endpoints.js
PENGUINS_TOKEN=your-token k6 run test/load/websocket-connections.js
```

See [test/load/README.md](test/load/README.md) for details and thresholds.

Contributor docs: [Install from source](https://docs.penguins.ai/install) and [Development setup](https://docs.penguins.ai/start/setup)

## CI/CD

The repo ships with GitHub Actions workflows:

| Workflow       | What it does                                   |
| -------------- | ---------------------------------------------- |
| `ci.yml`       | Lint, typecheck, and test on every push and PR |
| `security.yml` | Dependency audit and CodeQL analysis           |
| `release.yml`  | Automated npm publish on version tags          |
| `docker.yml`   | Build and push Docker images to GHCR           |

Dependabot is configured for automated dependency updates.

## Config, state, and workspace

Default locations:

- Config: `~/.penguins/penguins.json`
- State: `~/.penguins/`
- Workspace: `~/.penguins/workspace`
- API keys: `~/.penguins/api-keys.json`

Useful environment variables:

| Variable                     | What it controls                                 |
| ---------------------------- | ------------------------------------------------ |
| `PENGUINS_HOME`              | Base home directory for Penguins path resolution |
| `PENGUINS_STATE_DIR`         | Override mutable state directory                 |
| `PENGUINS_CONFIG_PATH`       | Override config file path                        |
| `PENGUINS_GATEWAY_TOKEN`     | Gateway shared token                             |
| `PENGUINS_GATEWAY_PASSWORD`  | Gateway shared password                          |
| `PENGUINS_REDIS_URL`         | Redis URL for multi-instance shared state        |
| `PENGUINS_EMBEDDING_BACKEND` | Embedding backend (`local` or `openai`)          |

Configuration docs: [Gateway configuration](https://docs.penguins.ai/gateway/configuration)

## Troubleshooting

Start with these:

```bash
penguins doctor
penguins status
penguins gateway status
penguins logs --follow
```

If `penguins` is not found after install, check your Node install and PATH:

- [Node setup](https://docs.penguins.ai/install/node)
- [Install troubleshooting](https://docs.penguins.ai/install)

If the Control UI says `unauthorized`:

```bash
penguins config get gateway.auth.token
```

Then paste that token into the Control UI settings and reconnect.

Full troubleshooting guide: [docs/troubleshooting.md](docs/troubleshooting.md)

## Migrating from OpenClaw

If you're upgrading from a previous OpenClaw installation:

- The `openclaw` CLI binary still works but prints a deprecation warning
- `OPENCLAW_*` environment variables are still recognized as fallbacks
- Storage paths and config format are unchanged
- Run `penguins doctor` to check for any migration issues

**Deprecation timeline:**

- `openclaw` binary alias: will be removed in v2.0 (target: September 2026)
- `OPENCLAW_*` env var fallbacks: will be removed in v2.0 (target: September 2026)
- `CLAWDBOT_*` env var fallbacks: already deprecated, removed in v2.0

## Docs

**In-repo documentation:**

- [API spec (OpenAPI)](docs/openapi.yaml) — HTTP endpoint schemas
- [Gateway protocol](docs/gateway-protocol.md) — WebSocket protocol reference
- [Extension guide](docs/extensions.md) — Build extensions
- [Security](docs/security.md) — Security model and hardening
- [Deployment](docs/deployment.md) — Production deployment options
- [Horizontal scaling](docs/horizontal-scaling.md) — Multi-instance deployment with Redis
- [Troubleshooting](docs/troubleshooting.md) — Common issues and solutions
- [Runbook](docs/runbook.md) — Incident response procedures
- [CI/CD](docs/ci.md) — Pipeline configuration

**External documentation:**

- [Getting started](https://docs.penguins.ai/start/getting-started)
- [Install](https://docs.penguins.ai/install)
- [Gateway runbook](https://docs.penguins.ai/gateway)
- [Dashboard](https://docs.penguins.ai/web/dashboard)
- [Remote access](https://docs.penguins.ai/gateway/remote)
- [Docker](https://docs.penguins.ai/install/docker)
- [CLI reference](https://docs.penguins.ai/cli)

## Contributing

See [CONTRIBUTING.md](CONTRIBUTING.md) for development setup, code style, and PR guidelines.

## License

MIT
