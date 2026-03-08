---
summary: "Integrated Tailscale Serve/Funnel for the Gateway dashboard"
read_when:
  - Exposing the Gateway Control UI outside localhost
  - Automating tailnet or public dashboard access
title: "Tailscale"
---

# Tailscale (Gateway dashboard)

Penguins can auto-configure Tailscale **Serve** (tailnet) or **Funnel** (public) for the
Gateway dashboard and WebSocket port. This keeps the Gateway bound to loopback while
Tailscale provides HTTPS, routing, and (for Serve) identity headers.

## Modes

- `serve`: Tailnet-only Serve via `tailscale serve`. The gateway stays on `127.0.0.1`.
- `funnel`: Public HTTPS via `tailscale funnel`. Penguins requires a shared password.
- `off`: Default (no Tailscale automation).

## Auth

Set `gateway.auth.mode` to control the handshake:

- `token` (default when `PENGUINS_GATEWAY_TOKEN` is set)
- `password` (shared secret via `PENGUINS_GATEWAY_PASSWORD` or config)

When `tailscale.mode = "serve"` and `gateway.auth.allowTailscale` is `true`,
valid Serve proxy requests can satisfy the Gateway WebSocket / Control UI
handshake via Tailscale identity headers (`tailscale-user-login`) without
supplying a token/password. Penguins verifies the identity by resolving the
`x-forwarded-for` address via the local Tailscale daemon (`tailscale whois`)
and matching it to the header before accepting it. Penguins only treats a
request as Serve when it arrives from loopback with Tailscale’s
`x-forwarded-for`, `x-forwarded-proto`, and `x-forwarded-host` headers.

This does **not** replace bearer auth for privileged HTTP endpoints. Even over
Serve, `POST /tools/invoke`, `POST /v1/chat/completions`,
`POST /v1/responses`, and protected plugin HTTP routes still require
`Authorization: Bearer <token-or-password>`.

Serve startup is also stricter now:

- If you want Serve identity auth, configure `gateway.auth.tailscaleAllowUsers`
  with the allowed Tailscale logins.
- If you want one shared secret for everything, use password auth instead.
- To require explicit credentials on Serve while keeping token auth, set
  `gateway.auth.allowTailscale: false`.

## Config examples

### Tailnet-only (Serve + allowlisted Tailscale users)

```json5
{
  gateway: {
    bind: "loopback",
    auth: {
      mode: "token",
      token: "your-token",
      allowTailscale: true,
      tailscaleAllowUsers: ["you@example.com"],
    },
    tailscale: { mode: "serve" },
  },
}
```

Open: `https://<magicdns>/` (or your configured `gateway.controlUi.basePath`)

Allowlisted Serve users can open the Control UI without pasting the token, but
keep the token for remote CLI calls and privileged HTTP endpoints.

### Tailnet-only (Serve + explicit secret only)

```json5
{
  gateway: {
    bind: "loopback",
    auth: {
      mode: "token",
      token: "your-token",
      allowTailscale: false,
    },
    tailscale: { mode: "serve" },
  },
}
```

Use this if you want Serve for HTTPS only and still require the token/password
everywhere.

### Tailnet-only (bind to Tailnet IP)

Use this when you want the Gateway to listen directly on the Tailnet IP (no Serve/Funnel).

```json5
{
  gateway: {
    bind: "tailnet",
    auth: { mode: "token", token: "your-token" },
  },
}
```

Connect from another Tailnet device:

- Control UI: `http://<tailscale-ip>:18789/`
- WebSocket: `ws://<tailscale-ip>:18789`

Note: loopback (`http://127.0.0.1:18789`) will **not** work in this mode.

### Public internet (Funnel + shared password)

```json5
{
  gateway: {
    bind: "loopback",
    tailscale: { mode: "funnel" },
    auth: { mode: "password", password: "replace-me" },
  },
}
```

Prefer `PENGUINS_GATEWAY_PASSWORD` over committing a password to disk.

## CLI examples

```bash
# Requires gateway.auth.password or gateway.auth.tailscaleAllowUsers in config.
penguins gateway --tailscale serve
penguins gateway --tailscale funnel --auth password
```

## Notes

- Tailscale Serve/Funnel requires the `tailscale` CLI to be installed and logged in.
- `tailscale.mode: "funnel"` refuses to start unless auth mode is `password` to avoid public exposure.
- `tailscale.mode: "serve"` refuses to start if Serve identity auth is enabled but neither `gateway.auth.password` nor `gateway.auth.tailscaleAllowUsers` is configured.
- Set `gateway.tailscale.resetOnExit` if you want Penguins to undo `tailscale serve`
  or `tailscale funnel` configuration on shutdown.
- `gateway.bind: "tailnet"` is a direct Tailnet bind (no HTTPS, no Serve/Funnel).
- `gateway.bind: "auto"` prefers loopback; use `tailnet` if you want Tailnet-only.
- Serve/Funnel only expose the **Gateway control UI + WS**. Nodes connect over
  the same Gateway WS endpoint, so Serve can work for node access.

## Browser control (remote Gateway + local browser)

If you run the Gateway on one machine but want to drive a browser on another machine,
run a **node host** on the browser machine and keep both on the same tailnet.
The Gateway will proxy browser actions to the node; no separate control server or Serve URL needed.

Avoid Funnel for browser control; treat node pairing like operator access.

## Tailscale prerequisites + limits

- Serve requires HTTPS enabled for your tailnet; the CLI prompts if it is missing.
- Serve injects Tailscale identity headers; Funnel does not.
- Funnel requires Tailscale v1.38.3+, MagicDNS, HTTPS enabled, and a funnel node attribute.
- Funnel only supports ports `443`, `8443`, and `10000` over TLS.
- Funnel on macOS requires the open-source Tailscale app variant.

## Learn more

- Tailscale Serve overview: [https://tailscale.com/kb/1312/serve](https://tailscale.com/kb/1312/serve)
- `tailscale serve` command: [https://tailscale.com/kb/1242/tailscale-serve](https://tailscale.com/kb/1242/tailscale-serve)
- Tailscale Funnel overview: [https://tailscale.com/kb/1223/tailscale-funnel](https://tailscale.com/kb/1223/tailscale-funnel)
- `tailscale funnel` command: [https://tailscale.com/kb/1311/tailscale-funnel](https://tailscale.com/kb/1311/tailscale-funnel)
