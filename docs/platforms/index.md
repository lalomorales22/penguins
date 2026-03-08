---
summary: "Platform support overview for the Penguins gateway host and browser UI."
read_when:
  - Looking for OS support or install paths
  - Deciding where to run the Gateway
title: "Platforms"
---

# Platforms

Penguins core is written in TypeScript. **Node is the recommended runtime**.
Bun is not recommended for the Gateway (WhatsApp/Telegram bugs).

Penguins is a **web/CLI-first** product. Run the Gateway on a host machine, then
use the built-in browser Control UI locally or through a private tunnel.

## Choose where to host it

- macOS: use [Getting Started](/start/getting-started) or [Setup](/start/setup)
- Windows: [Windows](/platforms/windows)
- Linux: [Linux](/platforms/linux)
- Raspberry Pi: [Raspberry Pi](/platforms/raspberry-pi)

## VPS & hosting

- VPS hub: [VPS hosting](/vps)
- Fly.io: [Fly.io](/install/fly)
- Hetzner (Docker): [Hetzner](/install/hetzner)
- GCP (Compute Engine): [GCP](/install/gcp)
- exe.dev (VM + HTTPS proxy): [exe.dev](/install/exe-dev)

## Access model

- Local browser on the gateway host: [Dashboard](/web/dashboard)
- Private HTTPS: [Cloudflare Tunnel](/gateway/cloudflare-tunnel)
- Tailnet and SSH options: [Remote access](/gateway/remote)

## Common links

- Install guide: [Getting Started](/start/getting-started)
- Gateway runbook: [Gateway](/gateway)
- Gateway configuration: [Configuration](/gateway/configuration)
- Service status: `penguins gateway status`

## Gateway service install (CLI)

Use one of these (all supported):

- Wizard (recommended): `penguins onboard --install-daemon`
- Direct: `penguins gateway install`
- Configure flow: `penguins configure` → select **Gateway service**
- Repair/migrate: `penguins doctor` (offers to install or fix the service)

The service target depends on OS:

- macOS: LaunchAgent (`ai.penguins.gateway` or `ai.penguins.<profile>`)
- Linux/WSL2: systemd user service (`penguins-gateway[-<profile>].service`)
