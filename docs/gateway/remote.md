---
summary: "Remote access using SSH tunnels (Gateway WS) and tailnets"
read_when:
  - Running or troubleshooting remote gateway setups
title: "Remote Access"
---

# Remote access (Cloudflare, SSH, and tailnets)

This repo supports “remote over SSH” by keeping a single Gateway (the master) running on a dedicated host (desktop/server) and connecting clients to it.

- For **public browser access**: Cloudflare Tunnel + Cloudflare Access is the
  easiest hosted path.
- For **operators (you / the macOS app)**: SSH tunneling is the universal fallback.
- For **nodes (iOS/Android and future devices)**: connect to the Gateway **WebSocket** (LAN/tailnet or SSH tunnel as needed).

## The core idea

- The Gateway WebSocket binds to **loopback** on your configured port (defaults to 18789).
- For remote use, you either proxy that loopback port through Cloudflare
  Tunnel, forward it over SSH, or reach it over a tailnet/VPN.

## Common VPN/tailnet setups (where the agent lives)

Think of the **Gateway host** as “where the agent lives.” It owns sessions, auth profiles, channels, and state.
Your laptop/desktop (and nodes) connect to that host.

### 1) Public HTTPS hostname with Cloudflare Tunnel

Use this when you want a public URL for the Control UI without exposing the raw
Gateway port.

- Keep `gateway.bind: "loopback"`.
- Run `cloudflared` on the same host and route the hostname to
  `http://127.0.0.1:18789`.
- Set `gateway.auth.mode: "trusted-proxy"` and trust the Cloudflare proxy IP
  (`127.0.0.1` when `cloudflared` runs on the same host).
- Let Cloudflare Access handle browser login.

Runbook: [Cloudflare Tunnel](/gateway/cloudflare-tunnel).

### 2) Always-on Gateway in your tailnet (VPS or home server)

Run the Gateway on a persistent host and reach it via **Tailscale** or SSH.

- **Best UX:** keep `gateway.bind: "loopback"` and use **Tailscale Serve** for the Control UI.
- **Fallback:** keep loopback + SSH tunnel from any machine that needs access.
- **Examples:** [exe.dev](/install/exe-dev) (easy VM) or [Hetzner](/install/hetzner) (production VPS).

This is ideal when your laptop sleeps often but you want the agent always-on.

### 3) Home desktop runs the Gateway, laptop is remote control

The laptop does **not** run the agent. It connects remotely:

- Use the macOS app’s **Remote over SSH** mode (Settings → General → “Penguins runs”).
- The app opens and manages the tunnel, so WebChat + health checks “just work.”

Runbook: [macOS remote access](/platforms/mac/remote).

### 4) Laptop runs the Gateway, remote access from other machines

Keep the Gateway local but expose it safely:

- SSH tunnel to the laptop from other machines, or
- Tailscale Serve the Control UI and keep the Gateway loopback-only.

Guide: [Tailscale](/gateway/tailscale) and [Web overview](/web).

## Command flow (what runs where)

One gateway service owns state + channels. Nodes are peripherals.

Flow example (Telegram → node):

- Telegram message arrives at the **Gateway**.
- Gateway runs the **agent** and decides whether to call a node tool.
- Gateway calls the **node** over the Gateway WebSocket (`node.*` RPC).
- Node returns the result; Gateway replies back out to Telegram.

Notes:

- **Nodes do not run the gateway service.** Only one gateway should run per host unless you intentionally run isolated profiles (see [Multiple gateways](/gateway/multiple-gateways)).
- macOS app “node mode” is just a node client over the Gateway WebSocket.

## SSH tunnel (CLI + tools)

Create a local tunnel to the remote Gateway WS:

```bash
ssh -N -L 18789:127.0.0.1:18789 user@host
```

With the tunnel up:

- `penguins health` and `penguins status --deep` now reach the remote gateway via `ws://127.0.0.1:18789`.
- `penguins gateway {status,health,send,agent,call}` can also target the forwarded URL via `--url` when needed.

Note: replace `18789` with your configured `gateway.port` (or `--port`/`PENGUINS_GATEWAY_PORT`).
Note: when you pass `--url`, the CLI does not fall back to config or environment credentials.
Include `--token` or `--password` explicitly. Missing explicit credentials is an error.

## CLI remote defaults

You can persist a remote target so CLI commands use it by default:

```json5
{
  gateway: {
    mode: "remote",
    remote: {
      url: "ws://127.0.0.1:18789",
      token: "your-token",
    },
  },
}
```

When the gateway is loopback-only, keep the URL at `ws://127.0.0.1:18789` and open the SSH tunnel first.

## Chat UI over SSH

WebChat no longer uses a separate HTTP port. The SwiftUI chat UI connects directly to the Gateway WebSocket.

- Forward `18789` over SSH (see above), then connect clients to `ws://127.0.0.1:18789`.
- On macOS, prefer the app’s “Remote over SSH” mode, which manages the tunnel automatically.

## macOS app “Remote over SSH”

The macOS menu bar app can drive the same setup end-to-end (remote status checks, WebChat, and Voice Wake forwarding).

Runbook: [macOS remote access](/platforms/mac/remote).

## Security rules (remote/VPN)

Short version: **keep the Gateway loopback-only** unless you’re sure you need a bind.

- **Loopback + Cloudflare Tunnel/SSH/Tailscale Serve** is the safest default
  (no raw public gateway port).
- **Non-loopback binds** (`lan`/`tailnet`/`custom`, or `auto` when loopback is
  unavailable) must use auth tokens/passwords or an explicitly configured
  `trusted-proxy`.
- `gateway.remote.token` is **only** for remote CLI calls — it does **not** enable local auth.
- `gateway.remote.tlsFingerprint` pins the remote TLS cert when using `wss://`.
- **Cloudflare Tunnel + Access** works best with `gateway.auth.mode:
"trusted-proxy"` and a tight `gateway.auth.trustedProxy.allowUsers`.
- **Tailscale Serve** can satisfy the Gateway WebSocket / Control UI handshake via verified identity headers when `gateway.auth.allowTailscale: true`.
  If you use that mode, also set `gateway.auth.tailscaleAllowUsers`, or switch to `gateway.auth.mode: "password"`.
- Privileged HTTP endpoints still require an app-level secret over Tailscale
  Serve:
  `POST /tools/invoke`, `POST /v1/chat/completions`, `POST /v1/responses`, and protected plugin HTTP routes all require `Authorization: Bearer <token-or-password>`.
- In `trusted-proxy` mode, those same routes follow the proxy identity auth on
  the exposed hostname. Treat them like operator access and keep the Access /
  `allowUsers` policy narrow.
- Treat browser control like operator access: tailnet-only + deliberate node pairing.

Deep dive: [Security](/gateway/security).
