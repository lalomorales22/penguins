---
summary: "Install Penguins declaratively with Nix"
read_when:
  - You want reproducible, rollback-able installs
  - You're already using Nix/NixOS/Home Manager
  - You want everything pinned and managed declaratively
title: "Nix"
---

# Nix Installation

The recommended way to run Penguins with Nix is via **[nix-penguins](https://github.com/penguins/nix-penguins)** — a batteries-included Home Manager module.

## Quick Start

Paste this to your AI agent (Claude, Cursor, etc.):

```text
I want to set up nix-penguins on my Mac.
Repository: github:penguins/nix-penguins

What I need you to do:
1. Check if Determinate Nix is installed (if not, install it)
2. Create a local flake at ~/code/penguins-local using templates/agent-first/flake.nix
3. Set up secrets (Anthropic key or other model key) - plain files at ~/.secrets/ is fine
4. Fill in the template placeholders and run home-manager switch
5. Verify: launchd running and the dashboard opens

Reference the nix-penguins README for module options.
```

> **📦 Full guide: [github.com/penguins/nix-penguins](https://github.com/penguins/nix-penguins)**
>
> The nix-penguins repo is the source of truth for Nix installation. This page is just a quick overview.

## What you get

- Gateway + browser Control UI + tools — all pinned
- Launchd service that survives reboots
- Plugin system with declarative config
- Instant rollback: `home-manager switch --rollback`

---

## Nix Mode Runtime Behavior

When `PENGUINS_NIX_MODE=1` is set (automatic with nix-penguins):

Penguins supports a **Nix mode** that makes configuration deterministic and disables auto-install flows.
Enable it by exporting:

```bash
PENGUINS_NIX_MODE=1
```

### Config + state paths

Penguins reads JSON5 config from `PENGUINS_CONFIG_PATH` and stores mutable data in `PENGUINS_STATE_DIR`.
When needed, you can also set `PENGUINS_HOME` to control the base home directory used for internal path resolution.

- `PENGUINS_HOME` (default precedence: `HOME` / `USERPROFILE` / `os.homedir()`)
- `PENGUINS_STATE_DIR` (default: `~/.penguins`)
- `PENGUINS_CONFIG_PATH` (default: `$PENGUINS_STATE_DIR/penguins.json`)

When running under Nix, set these explicitly to Nix-managed locations so runtime state and config
stay out of the immutable store.

### Runtime behavior in Nix mode

- Auto-install and self-mutation flows are disabled
- Missing dependencies surface Nix-specific remediation messages
- UI surfaces a read-only Nix mode banner when present

## Related

- [nix-penguins](https://github.com/penguins/nix-penguins) — full setup guide
- [Wizard](/start/wizard) — non-Nix CLI setup
- [Docker](/install/docker) — containerized setup
