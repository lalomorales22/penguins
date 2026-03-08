---
summary: "How the Gateway serves browser chat, the Control UI, CLI access, and optional integrations."
read_when:
  - You want a concise view of the Gateway networking model
title: "Network model"
---

Most operations flow through the Gateway (`penguins gateway`), a single long-running
process that owns the core Penguins app surfaces:

- browser chat
- the private Control UI
- the CLI control plane
- optional HTTP APIs, webhooks, nodes, and custom integrations

## Core rules

- One Gateway per host is recommended. Use multiple gateways only for strict isolation or separate profiles. See [Multiple gateways](/gateway/multiple-gateways).
- Loopback first: the Gateway defaults to `127.0.0.1:18789`, and the wizard generates gateway auth by default even for local use.
- One port serves the full app surface:
  - browser chat and Control UI
  - WebSocket control/RPC
  - optional HTTP APIs and webhook routes
  - optional canvas host assets
- Nodes connect to the Gateway WebSocket over LAN, tailnet, or SSH as needed.
- Canvas host is served by the Gateway HTTP server on the same port (default `18789`):
  - `/__penguins__/canvas/`
  - `/__penguins__/a2ui/`

  When `gateway.auth` is configured and the Gateway binds beyond loopback, these routes are protected by Gateway auth (loopback requests are exempt). See [Configuration](/gateway/configuration).

- Preferred remote browser path: [Cloudflare Tunnel](/gateway/cloudflare-tunnel) + Access.
- Private alternatives: [Remote access](/gateway/remote), [Tailscale](/gateway/tailscale), or SSH tunnels.

## Built-in surfaces

These are the product surfaces Penguins ships as part of the core app:

- [Control UI](/web/control-ui): browser admin surface for chat, config, logs, sessions, cron, and operations
- [WebChat](/web/webchat): browser chat flow over the Gateway WebSocket
- [CLI](/cli): setup, status, scripting, and operator workflows

## Optional surfaces

These are real but not the core user-facing app:

- HTTP APIs such as `/tools/invoke`, `/v1/chat/completions`, and `/v1/responses`
- Webhooks and plugin HTTP routes
- Nodes, canvas host, and browser automation helpers
- Custom integrations you build on top of the Gateway

The current product direction is web chat + Control UI + CLI first. If you add
other delivery or integration surfaces, treat them as optional extensions around
the Gateway, not the default Penguins experience.
