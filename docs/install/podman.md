---
summary: "Run Penguins in a rootless Podman container"
read_when:
  - You want a containerized gateway with Podman instead of Docker
title: "Podman"
---

# Podman

Run the Penguins gateway in a **rootless** Podman container. Uses the same image as Docker (build from the repo [Dockerfile](https://github.com/penguins/penguins/blob/main/Dockerfile)).

## Requirements

- Podman (rootless)
- Sudo for one-time setup (create user, build image)

## Quick start

**1. One-time setup** (from repo root; creates user, builds image, installs launch script):

```bash
./setup-podman.sh
```

This also creates a minimal `~penguins/.penguins/penguins.json` (sets `gateway.mode="local"`) so the gateway can start without running the wizard.

By default the container is **not** installed as a systemd service, you start it manually (see below). For a production-style setup with auto-start and restarts, install it as a systemd Quadlet user service instead:

```bash
./setup-podman.sh --quadlet
```

(Or set `OPENCLAW_PODMAN_QUADLET=1`; use `--container` to install only the container and launch script.)

**2. Start gateway** (manual, for quick smoke testing):

```bash
./scripts/run-penguins-podman.sh launch
```

**3. Onboarding wizard** (e.g. to add channels or providers):

```bash
./scripts/run-penguins-podman.sh launch setup
```

Then open `http://127.0.0.1:18789/` and use the token from `~penguins/.penguins/.env` (or the value printed by setup).

## Systemd (Quadlet, optional)

If you ran `./setup-podman.sh --quadlet` (or `OPENCLAW_PODMAN_QUADLET=1`), a [Podman Quadlet](https://docs.podman.io/en/latest/markdown/podman-systemd.unit.5.html) unit is installed so the gateway runs as a systemd user service for the penguins user. The service is enabled and started at the end of setup.

- **Start:** `sudo systemctl --machine penguins@ --user start penguins.service`
- **Stop:** `sudo systemctl --machine penguins@ --user stop penguins.service`
- **Status:** `sudo systemctl --machine penguins@ --user status penguins.service`
- **Logs:** `sudo journalctl --machine penguins@ --user -u penguins.service -f`

The quadlet file lives at `~penguins/.config/containers/systemd/penguins.container`. To change ports or env, edit that file (or the `.env` it sources), then `sudo systemctl --machine penguins@ --user daemon-reload` and restart the service. On boot, the service starts automatically if lingering is enabled for penguins (setup does this when loginctl is available).

To add quadlet **after** an initial setup that did not use it, re-run: `./setup-podman.sh --quadlet`.

## The penguins user (non-login)

`setup-podman.sh` creates a dedicated system user `penguins`:

- **Shell:** `nologin` — no interactive login; reduces attack surface.
- **Home:** e.g. `/home/penguins` — holds `~/.penguins` (config, workspace) and the launch script `run-penguins-podman.sh`.
- **Rootless Podman:** The user must have a **subuid** and **subgid** range. Many distros assign these automatically when the user is created. If setup prints a warning, add lines to `/etc/subuid` and `/etc/subgid`:

  ```text
  penguins:100000:65536
  ```

  Then start the gateway as that user (e.g. from cron or systemd):

  ```bash
  sudo -u penguins /home/penguins/run-penguins-podman.sh
  sudo -u penguins /home/penguins/run-penguins-podman.sh setup
  ```

- **Config:** Only `penguins` and root can access `/home/penguins/.penguins`. To edit config: use the Control UI once the gateway is running, or `sudo -u penguins $EDITOR /home/penguins/.penguins/penguins.json`.

## Environment and config

- **Token:** Stored in `~penguins/.penguins/.env` as `OPENCLAW_GATEWAY_TOKEN`. `setup-podman.sh` and `run-penguins-podman.sh` generate it if missing (uses `openssl`, `python3`, or `od`).
- **Optional:** In that `.env` you can set provider keys (e.g. `GROQ_API_KEY`, `OLLAMA_API_KEY`) and other Penguins env vars.
- **Host ports:** By default the script maps `18789` (gateway) and `18790` (bridge). Override the **host** port mapping with `OPENCLAW_PODMAN_GATEWAY_HOST_PORT` and `OPENCLAW_PODMAN_BRIDGE_HOST_PORT` when launching.
- **Paths:** Host config and workspace default to `~penguins/.penguins` and `~penguins/.penguins/workspace`. Override the host paths used by the launch script with `OPENCLAW_CONFIG_DIR` and `OPENCLAW_WORKSPACE_DIR`.

## Useful commands

- **Logs:** With quadlet: `sudo journalctl --machine penguins@ --user -u penguins.service -f`. With script: `sudo -u penguins podman logs -f penguins`
- **Stop:** With quadlet: `sudo systemctl --machine penguins@ --user stop penguins.service`. With script: `sudo -u penguins podman stop penguins`
- **Start again:** With quadlet: `sudo systemctl --machine penguins@ --user start penguins.service`. With script: re-run the launch script or `podman start penguins`
- **Remove container:** `sudo -u penguins podman rm -f penguins` — config and workspace on the host are kept

## Troubleshooting

- **Permission denied (EACCES) on config or auth-profiles:** The container defaults to `--userns=keep-id` and runs as the same uid/gid as the host user running the script. Ensure your host `OPENCLAW_CONFIG_DIR` and `OPENCLAW_WORKSPACE_DIR` are owned by that user.
- **Gateway start blocked (missing `gateway.mode=local`):** Ensure `~penguins/.penguins/penguins.json` exists and sets `gateway.mode="local"`. `setup-podman.sh` creates this file if missing.
- **Rootless Podman fails for user penguins:** Check `/etc/subuid` and `/etc/subgid` contain a line for `penguins` (e.g. `penguins:100000:65536`). Add it if missing and restart.
- **Container name in use:** The launch script uses `podman run --replace`, so the existing container is replaced when you start again. To clean up manually: `podman rm -f penguins`.
- **Script not found when running as penguins:** Ensure `setup-podman.sh` was run so that `run-penguins-podman.sh` is copied to penguins’s home (e.g. `/home/penguins/run-penguins-podman.sh`).
- **Quadlet service not found or fails to start:** Run `sudo systemctl --machine penguins@ --user daemon-reload` after editing the `.container` file. Quadlet requires cgroups v2: `podman info --format '{{.Host.CgroupsVersion}}'` should show `2`.

## Optional: run as your own user

To run the gateway as your normal user (no dedicated penguins user): build the image, create `~/.penguins/.env` with `OPENCLAW_GATEWAY_TOKEN`, and run the container with `--userns=keep-id` and mounts to your `~/.penguins`. The launch script is designed for the penguins-user flow; for a single-user setup you can instead run the `podman run` command from the script manually, pointing config and workspace to your home. Recommended for most users: use `setup-podman.sh` and run as the penguins user so config and process are isolated.
