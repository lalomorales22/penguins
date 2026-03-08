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
- Optional APIs, webhooks, nodes, and custom integrations around the core app surfaces

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

Contributor docs: [Install from source](https://docs.penguins.ai/install) and [Development setup](https://docs.penguins.ai/start/setup)

## Config, state, and workspace

Default locations:

- Config: `~/.penguins/penguins.json`
- State: `~/.penguins/`
- Workspace: `~/.penguins/workspace`

Useful environment variables:

| Variable                    | What it controls                                 |
| --------------------------- | ------------------------------------------------ |
| `PENGUINS_HOME`             | Base home directory for Penguins path resolution |
| `PENGUINS_STATE_DIR`        | Override mutable state directory                 |
| `PENGUINS_CONFIG_PATH`      | Override config file path                        |
| `PENGUINS_GATEWAY_TOKEN`    | Gateway shared token                             |
| `PENGUINS_GATEWAY_PASSWORD` | Gateway shared password                          |

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

## Docs worth bookmarking

- [Getting started](https://docs.penguins.ai/start/getting-started)
- [Install](https://docs.penguins.ai/install)
- [Gateway runbook](https://docs.penguins.ai/gateway)
- [Dashboard](https://docs.penguins.ai/web/dashboard)
- [Remote access](https://docs.penguins.ai/gateway/remote)
- [Docker](https://docs.penguins.ai/install/docker)
- [CLI reference](https://docs.penguins.ai/cli)

## License

MIT
