---
summary: "Health check steps for the Gateway, browser surfaces, and CLI access"
read_when:
  - Diagnosing gateway or browser access problems
title: "Health Checks"
---

# Health Checks (CLI)

Short guide to verify the Gateway, Control UI, browser chat, and CLI connectivity without guessing.

## Quick checks

- `penguins gateway status` — supervised service state.
- `penguins status` — local summary: gateway reachability/mode, update hint, sessions, and recent activity.
- `penguins status --all` — full local diagnosis (read-only, color, safe to paste for debugging).
- `penguins status --deep` — also probes the running Gateway.
- `penguins health --json` — asks the running Gateway for a full health snapshot.
- `penguins dashboard --no-open` — prints the browser URL you should be able to open.
- `penguins logs --follow` — live logs for startup, auth, WebSocket, cron, and automation issues.

## Browser checks

- Can you open the Control UI URL?
- Does the browser connect without an auth loop?
- Can the chat tab load session history?
- Can the sessions/config/cron tabs load data?
- If you use remote access, does your Cloudflare/Tailscale/SSH path land on the same Gateway you expect?

## Useful command ladder

Run these in order:

```bash
penguins gateway status
penguins status
penguins status --deep
penguins health --json
penguins logs --follow
```

## When something fails

- Gateway unreachable: start it with `penguins gateway --port 18789` (use `--force` if the port is busy).
- Control UI says `unauthorized`: get the token with `penguins config get gateway.auth.token`, then paste it into the Control UI settings.
- Remote browser access fails: verify [Cloudflare Tunnel](/gateway/cloudflare-tunnel), [Remote access](/gateway/remote), or [Tailscale](/gateway/tailscale) config before debugging the app itself.
- Browser chat is stale or reconnecting: check `penguins logs --follow` and `penguins status --deep` for gateway/auth failures.
- If you only use the built-in web chat, Control UI, and CLI surfaces, you do not need channel login/logout or QR pairing flows.

## Dedicated `health` command

`penguins health --json` asks the running Gateway for its health snapshot over the
Gateway connection. It reports gateway timing, session-store summary, agent
heartbeat state, and any configured integration summaries the Gateway still
knows about. It exits non-zero if the Gateway is unreachable or the probe
fails/times out. Use `--timeout <ms>` to override the 10s default.
