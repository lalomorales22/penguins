---
summary: "Advanced setup and development workflows for Penguins"
read_when:
  - Setting up a new machine
  - You want “latest + greatest” without breaking your personal setup
title: "Setup"
---

# Setup

<Note>
If you are setting up for the first time, start with [Getting Started](/start/getting-started).
This page is for source checkouts, custom hosts, and private deployment workflows.
</Note>

Last updated: 2026-03-07

## TL;DR

- **Personal state lives outside the repo:** `~/.penguins/workspace` (workspace) + `~/.penguins/penguins.json` (config).
- **Recommended workflow:** install Penguins, run `penguins onboard --install-daemon`, then open the browser Control UI.
- **From source:** `pnpm install`, `pnpm build`, `pnpm penguins onboard`, and `pnpm penguins dashboard`.

## Prereqs (from source)

- Node `>=22`
- `pnpm`
- Docker (optional; only for containerized setup/e2e — see [Docker](/install/docker))

## Tailoring strategy (so updates don’t hurt)

If you want “100% tailored to me” _and_ easy updates, keep your customization in:

- **Config:** `~/.penguins/penguins.json` (JSON/JSON5-ish)
- **Workspace:** `~/.penguins/workspace` (skills, prompts, memories; make it a private git repo)

Bootstrap once:

```bash
penguins setup
```

From inside this repo, use the local CLI entry:

```bash
pnpm penguins setup
```

If you don’t have a global install yet, keep using `pnpm penguins ...` from the
repo checkout.

## Run the Gateway from this repo

After `pnpm build`, you can use the local CLI entry:

```bash
pnpm install
pnpm build
pnpm penguins onboard
pnpm penguins gateway --port 18789
pnpm penguins dashboard --no-open
```

## Development workflow

### 1) Install dependencies

```bash
pnpm install
```

### 2) Start the dev Gateway

```bash
pnpm gateway:watch
```

`gateway:watch` runs the gateway in watch mode and reloads on TypeScript changes.

### 3) Open the Control UI

In another terminal:

```bash
pnpm penguins dashboard --no-open
```

Then open the printed URL in your browser.

### 4) Keep remote access private

Recommended production shape:

- `gateway.bind: "loopback"`
- auth enabled
- Cloudflare Tunnel + Access, SSH, or Tailscale in front of the browser UI

Start with [Cloudflare Tunnel](/gateway/cloudflare-tunnel) if you want the
cleanest personal deployment.

## Credential storage map

Use this when debugging auth or deciding what to back up:

- **Gateway config**: `~/.penguins/penguins.json`
- **Gateway state**: `~/.penguins/`
- **Workspace**: `~/.penguins/workspace`
- **Sessions**: `~/.penguins/agents/<agentId>/sessions/`
- **Model auth profiles**: `~/.penguins/agents/<agentId>/agent/auth-profiles.json`
- **OAuth credentials**: `~/.penguins/credentials/oauth.json`
- **Logs**: `/tmp/penguins/`

More detail: [Security](/gateway/security#credential-storage-map).

## Updating (without wrecking your setup)

- Keep `~/.penguins/workspace` and `~/.penguins/` as “your stuff”; don’t put personal prompts/config into the `penguins` repo.
- Updating source: `git pull` + `pnpm install` (when lockfile changed) + keep using `pnpm gateway:watch`.

## Linux (systemd user service)

Linux installs use a systemd **user** service. By default, systemd stops user
services on logout/idle, which kills the Gateway. Onboarding attempts to enable
lingering for you (may prompt for sudo). If it’s still off, run:

```bash
sudo loginctl enable-linger $USER
```

For always-on or multi-user servers, consider a **system** service instead of a
user service (no lingering needed). See [Gateway runbook](/gateway) for the systemd notes.

## Related docs

- [Gateway runbook](/gateway) (flags, supervision, ports)
- [Gateway configuration](/gateway/configuration) (config schema + examples)
- [Cloudflare Tunnel](/gateway/cloudflare-tunnel) (private HTTPS setup)
- [Penguins assistant setup](/start/penguins)
