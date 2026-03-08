---
summary: "Browser chat surface over the Gateway WebSocket"
read_when:
  - Debugging or configuring WebChat access
title: "WebChat"
---

# WebChat (Gateway WebSocket UI)

WebChat is the browser chat surface that talks directly to the Gateway WebSocket.

## What it is

- A browser chat experience for the Gateway
- Uses the same sessions and routing rules as the Control UI chat tab
- Replies stay in the same WebChat/Control UI conversation

The supported product surface is web + CLI only. There is no separate native
macOS/iOS WebChat app in the current product direction.

## Quick start

1. Start the gateway.
2. Open the Control UI chat tab, or any thin browser client that speaks the same Gateway chat methods.
3. Ensure gateway auth is configured (required by default, even on loopback).

## How it works

- The browser connects to the Gateway WebSocket and uses `chat.history`, `chat.send`, and `chat.inject`.
- `chat.inject` appends an assistant note directly to the transcript and broadcasts it to the UI (no agent run).
- Aborted runs can keep partial assistant output visible in the UI.
- Gateway persists aborted partial assistant text into transcript history when buffered output exists, and marks those entries with abort metadata.
- History is always fetched from the gateway (no local file watching).
- If the gateway is unreachable, WebChat is read-only.

## Remote use

Use the same remote path as the Control UI:

- [Cloudflare Tunnel](/gateway/cloudflare-tunnel)
- [Remote access](/gateway/remote)
- [Tailscale](/gateway/tailscale)

You do not need to run a separate WebChat server.

## Configuration reference

Full configuration: [Configuration](/gateway/configuration)

There is no dedicated `webchat.*` block. WebChat uses the gateway endpoint and
auth settings below.

Related global options:

- `gateway.port`, `gateway.bind`: Gateway host/port
- `gateway.auth.mode`, `gateway.auth.token`, `gateway.auth.password`: browser auth (token/password)
- `gateway.auth.mode: "trusted-proxy"`: reverse-proxy auth for browser clients. See [Trusted Proxy Auth](/gateway/trusted-proxy-auth)
- `gateway.controlUi.basePath`: browser URL prefix when the UI is not served at `/`
- `gateway.remote.url`, `gateway.remote.token`, `gateway.remote.password`: remote gateway target
- `session.*`: session storage and main key defaults
