---
summary: "Gateway dashboard (Control UI) access and auth"
read_when:
  - Changing dashboard authentication or exposure modes
title: "Dashboard"
---

# Dashboard (Control UI)

The Gateway dashboard is the browser Control UI served at `/` by default
(override with `gateway.controlUi.basePath`).

Quick open (local Gateway):

- [http://127.0.0.1:18789/](http://127.0.0.1:18789/) (or [http://localhost:18789/](http://localhost:18789/))

Key references:

- [Control UI](/web/control-ui) for usage and UI capabilities.
- [Tailscale](/gateway/tailscale) for Serve/Funnel automation.
- [Web surfaces](/web) for bind modes and security notes.

Authentication is enforced at the WebSocket handshake via `connect.params.auth`
(token or password). See `gateway.auth` in [Gateway configuration](/gateway/configuration).

Security note: the Control UI is an **admin surface** (chat, config, exec approvals).
Do not expose it casually. The UI stores the token in `localStorage` after
first load. Prefer localhost, Cloudflare Tunnel + Access, Tailscale Serve, or
an SSH tunnel.

## Fast path (recommended)

- After onboarding, the CLI auto-opens the dashboard and prints a clean (non-tokenized) link.
- Re-open anytime: `penguins dashboard` (copies link, opens browser if possible, shows SSH hint if headless).
- If the UI prompts for auth, paste the token from `gateway.auth.token` (or `PENGUINS_GATEWAY_TOKEN`) into Control UI settings.

## Token basics (local vs remote)

- **Localhost**: open `http://127.0.0.1:18789/`.
- **Token source**: `gateway.auth.token` (or `PENGUINS_GATEWAY_TOKEN`); the UI stores a copy in localStorage after you connect.
- **Not localhost**: use [Cloudflare Tunnel](/gateway/cloudflare-tunnel),
  Tailscale Serve, tailnet bind with a token, or an SSH tunnel. If you use
  Serve identity auth, also set `gateway.auth.tailscaleAllowUsers`; keep the
  token/password for remote CLI and privileged HTTP endpoints. If you use
  Cloudflare Access + `trusted-proxy`, keep `allowUsers` tight because that
  identity applies to the Gateway surfaces on that hostname. See
  [Web surfaces](/web).

## If you see “unauthorized” / 1008

- Ensure the gateway is reachable (local: `penguins status`; remote: SSH tunnel `ssh -N -L 18789:127.0.0.1:18789 user@host` then open `http://127.0.0.1:18789/`).
- Retrieve the token from the gateway host: `penguins config get gateway.auth.token` (or generate one: `penguins doctor --generate-gateway-token`).
- In the dashboard settings, paste the token into the auth field, then connect.
