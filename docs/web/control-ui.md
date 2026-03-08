---
summary: "Browser-based control UI for the Gateway (chat, config, and operations)"
read_when:
  - You want to operate the Gateway from a browser
  - You want Tailnet access without SSH tunnels
title: "Control UI"
---

# Control UI (browser)

The Control UI is a small **Vite + Lit** single-page app served by the Gateway:

- default: `http://<host>:18789/`
- optional prefix: set `gateway.controlUi.basePath` (e.g. `/penguins`)

It speaks **directly to the Gateway WebSocket** on the same port.

## Quick open (local)

If the Gateway is running on the same computer, open:

- [http://127.0.0.1:18789/](http://127.0.0.1:18789/) (or [http://localhost:18789/](http://localhost:18789/))

If the page fails to load, start the Gateway first: `penguins gateway`.

Auth is supplied during the WebSocket handshake via:

- `connect.params.auth.token`
- `connect.params.auth.password`
  The dashboard settings panel lets you store a token; passwords are not persisted.
  The onboarding wizard generates a gateway token by default, so paste it here on first connect.

With Tailscale Serve, verified identity headers can also satisfy this WebSocket
handshake when `gateway.auth.allowTailscale` is `true` and the user is listed
in `gateway.auth.tailscaleAllowUsers`. That shortcut only applies to the
Gateway WebSocket / Control UI connection. Privileged HTTP endpoints still
require `Authorization: Bearer <token-or-password>`.

With `gateway.auth.mode: "trusted-proxy"` (for example Cloudflare Access), the
browser can also connect without pasting a token/password when the request
arrives from a configured trusted proxy and includes the configured user
header. See [Cloudflare Tunnel](/gateway/cloudflare-tunnel) and
[Trusted Proxy Auth](/gateway/trusted-proxy-auth).

## First connection

The supported Control UI auth paths are:

- paste the gateway token in the UI settings
- use Tailscale Serve with `gateway.auth.allowTailscale`
- use trusted-proxy auth such as Cloudflare Access

If the UI says `unauthorized` or keeps reconnecting, verify the same gateway
auth settings you use for the CLI. See [Remote access](/gateway/remote),
[Cloudflare Tunnel](/gateway/cloudflare-tunnel), and
[Trusted Proxy Auth](/gateway/trusted-proxy-auth).

## What it can do (today)

- Chat with the model via Gateway WS (`chat.history`, `chat.send`, `chat.abort`, `chat.inject`)
- Stream tool calls + live tool output cards in Chat (agent events)
- Instances: presence list + refresh (`system-presence`)
- Sessions: list + per-session thinking/verbose overrides (`sessions.list`, `sessions.patch`)
- Cron jobs: list/add/run/enable/disable + run history (`cron.*`)
- Skills: status, enable/disable, install, API key updates (`skills.*`)
- Exec approvals: edit gateway allowlists + ask policy for local exec (`exec.approvals.*`)
- Config: view/edit `~/.penguins/penguins.json` (`config.get`, `config.set`)
- Config: apply + restart with validation (`config.apply`) and wake the last active session
- Config writes include a base-hash guard to prevent clobbering concurrent edits
- Config schema + form rendering (`config.schema`, including plugin schemas); Raw JSON editor remains available
- Debug: status/health/models snapshots + event log + manual RPC calls (`status`, `health`, `models.list`)
- Logs: live tail of gateway file logs with filter/export (`logs.tail`)
- Update: run a package/git update + restart (`update.run`) with a restart report

Cron jobs panel notes:

- For isolated jobs, delivery defaults to announce summary. You can switch to none if you want internal-only runs.
- Channel/target fields appear when announce is selected and are meant for advanced custom delivery integrations.
- New job form includes a **Notify webhook** toggle (`notify` on the job).
- Gateway webhook posting requires both `notify: true` on the job and `cron.webhook` in config.
- Set `cron.webhookToken` to send a dedicated bearer token, if omitted the webhook is sent without an auth header.

## Chat behavior

- `chat.send` is **non-blocking**: it acks immediately with `{ runId, status: "started" }` and the response streams via `chat` events.
- Re-sending with the same `idempotencyKey` returns `{ status: "in_flight" }` while running, and `{ status: "ok" }` after completion.
- `chat.inject` appends an assistant note to the session transcript and broadcasts a `chat` event for UI-only updates (no agent run, no outbound integration delivery).
- Stop:
  - Click **Stop** (calls `chat.abort`)
  - Type `/stop` (or `stop|esc|abort|wait|exit|interrupt`) to abort out-of-band
  - `chat.abort` supports `{ sessionKey }` (no `runId`) to abort all active runs for that session
- Abort partial retention:
  - When a run is aborted, partial assistant text can still be shown in the UI
  - Gateway persists aborted partial assistant text into transcript history when buffered output exists
  - Persisted entries include abort metadata so transcript consumers can tell abort partials from normal completion output

## Tailnet access (recommended)

### Integrated Tailscale Serve (preferred)

Keep the Gateway on loopback and let Tailscale Serve proxy it with HTTPS:

```bash
penguins gateway --tailscale serve
```

Open:

- `https://<magicdns>/` (or your configured `gateway.controlUi.basePath`)

By default, Serve requests can satisfy the Control UI / Gateway WebSocket
handshake via Tailscale identity headers (`tailscale-user-login`) when
`gateway.auth.allowTailscale` is `true`. Penguins verifies the identity by
resolving the `x-forwarded-for` address with `tailscale whois` and matching it
to the header, and only accepts these when the request hits loopback with
Tailscale’s `x-forwarded-*` headers.

If you use Serve identity auth, set `gateway.auth.tailscaleAllowUsers` to the
allowed Tailscale logins. If you want to require a token/password even for the
Control UI, set `gateway.auth.allowTailscale: false` (or force
`gateway.auth.mode: "password"`).

Privileged HTTP endpoints are stricter: `POST /tools/invoke`,
`POST /v1/chat/completions`, `POST /v1/responses`, and protected plugin HTTP
routes always require `Authorization: Bearer <token-or-password>`.

### Bind to tailnet + token

```bash
penguins gateway --bind tailnet --token "$(openssl rand -hex 32)"
```

Then open:

- `http://<tailscale-ip>:18789/` (or your configured `gateway.controlUi.basePath`)

Paste the token into the UI settings (sent as `connect.params.auth.token`).

## Insecure HTTP

If you open the dashboard over plain HTTP (`http://<lan-ip>` or `http://<tailscale-ip>`),
the browser runs in a **non-secure context** and blocks WebCrypto. By default,
Penguins **blocks** Control UI connections without device identity.

**Recommended fix:** use HTTPS (Tailscale Serve) or open the UI locally:

- `https://<magicdns>/` (Serve)
- `http://127.0.0.1:18789/` (on the gateway host)

**Downgrade example (token-only over HTTP):**

```json5
{
  gateway: {
    controlUi: { allowInsecureAuth: true },
    bind: "tailnet",
    auth: { mode: "token", token: "replace-me" },
  },
}
```

This disables stricter browser-side auth protections for the Control UI. Use
only if you trust the network.

See [Tailscale](/gateway/tailscale) for HTTPS setup guidance.

## Building the UI

The Gateway serves static files from `dist/control-ui`. Build them with:

```bash
pnpm ui:build # auto-installs UI deps on first run
```

Optional absolute base (when you want fixed asset URLs):

```bash
PENGUINS_CONTROL_UI_BASE_PATH=/penguins/ pnpm ui:build
```

For local development (separate dev server):

```bash
pnpm ui:dev # auto-installs UI deps on first run
```

Then point the UI at your Gateway WS URL (e.g. `ws://127.0.0.1:18789`).

## Debugging/testing: dev server + remote Gateway

The Control UI is static files; the WebSocket target is configurable and can be
different from the HTTP origin. This is handy when you want the Vite dev server
locally but the Gateway runs elsewhere.

1. Start the UI dev server: `pnpm ui:dev`
2. Open a URL like:

```text
http://localhost:5173/?gatewayUrl=ws://<gateway-host>:18789
```

Optional one-time auth (if needed):

```text
http://localhost:5173/?gatewayUrl=wss://<gateway-host>:18789&token=<gateway-token>
```

Notes:

- `gatewayUrl` is stored in localStorage after load and removed from the URL.
- `token` is stored in localStorage; `password` is kept in memory only.
- When `gatewayUrl` is set, the UI does not fall back to config or environment credentials.
  Provide `token` (or `password`) explicitly. Missing explicit credentials is an error.
- Use `wss://` when the Gateway is behind TLS (Tailscale Serve, HTTPS proxy, etc.).
- `gatewayUrl` is only accepted in a top-level window (not embedded) to prevent clickjacking.
- For cross-origin dev setups (e.g. `pnpm ui:dev` to a remote Gateway), add the UI
  origin to `gateway.controlUi.allowedOrigins`.

Example:

```json5
{
  gateway: {
    controlUi: {
      allowedOrigins: ["http://localhost:5173"],
    },
  },
}
```

Remote access setup details: [Remote access](/gateway/remote).
