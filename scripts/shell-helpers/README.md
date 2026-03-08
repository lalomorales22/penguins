# Penguins Docker Helpers <!-- omit in toc -->

> Optional shell shortcuts for repo-based Docker workflows.
> Recommended primary path: use `./docker-setup.sh`, plain `docker compose`,
> and `penguins dashboard`.

Stop typing repeated `docker compose` commands. Just type
`penguins-docker-start`.

Inspired by Simon Willison's [Running Penguins in Docker](https://til.simonwillison.net/llms/penguins-docker).

- [Quickstart](#quickstart)
- [Available Commands](#available-commands)
  - [Basic Operations](#basic-operations)
  - [Container Access](#container-access)
  - [Web UI \& Devices](#web-ui--devices)
  - [Setup \& Configuration](#setup--configuration)
  - [Maintenance](#maintenance)
  - [Utilities](#utilities)
- [Common Workflows](#common-workflows)
  - [Check Status and Logs](#check-status-and-logs)
  - [Run Advanced Commands in the Container](#run-advanced-commands-in-the-container)
  - [Troubleshooting Device Pairing](#troubleshooting-device-pairing)
  - [Fix Token Mismatch Issues](#fix-token-mismatch-issues)
  - [Permission Denied](#permission-denied)
- [Requirements](#requirements)

## Quickstart

Point your shell at the helper script inside your Penguins clone:

```bash
echo 'source ~/penguins/scripts/shell-helpers/penguins-docker-helpers.sh' >> ~/.zshrc && source ~/.zshrc
```

If your repo lives somewhere else, replace `~/penguins` with the actual path.

**See what you get:**

```bash
penguins-docker-help
```

On first command, the helper auto-detects your Penguins directory:

- Checks common paths (`~/penguins`, `~/workspace/penguins`, etc.)
- If found, asks you to confirm
- Saves to `~/.penguins/docker-helpers/config`

**First time setup:**

```bash
penguins-docker-start
```

```bash
penguins-docker-fix-token
```

```bash
penguins-docker-dashboard
```

If you see "pairing required":

```bash
penguins-docker-devices
```

And approve the request for the specific device:

```bash
penguins-docker-approve <request-id>
```

## Available Commands

### Basic Operations

| Command                   | Description                     |
| ------------------------- | ------------------------------- |
| `penguins-docker-start`   | Start the gateway               |
| `penguins-docker-stop`    | Stop the gateway                |
| `penguins-docker-restart` | Restart the gateway             |
| `penguins-docker-status`  | Check container status          |
| `penguins-docker-logs`    | View live logs (follows output) |

### Container Access

| Command                          | Description                                    |
| -------------------------------- | ---------------------------------------------- |
| `penguins-docker-shell`          | Interactive shell inside the gateway container |
| `penguins-docker-cli <command>`  | Run Penguins CLI commands                      |
| `penguins-docker-exec <command>` | Execute arbitrary commands in the container    |

### Web UI & Devices

| Command                        | Description                                |
| ------------------------------ | ------------------------------------------ |
| `penguins-docker-dashboard`    | Open web UI in browser with authentication |
| `penguins-docker-devices`      | List device pairing requests               |
| `penguins-docker-approve <id>` | Approve a device pairing request           |

### Setup & Configuration

| Command                     | Description                                       |
| --------------------------- | ------------------------------------------------- |
| `penguins-docker-fix-token` | Configure gateway authentication token (run once) |

### Maintenance

| Command                   | Description                                      |
| ------------------------- | ------------------------------------------------ |
| `penguins-docker-rebuild` | Rebuild the Docker image                         |
| `penguins-docker-clean`   | Remove all containers and volumes (destructive!) |

### Utilities

| Command                     | Description                               |
| --------------------------- | ----------------------------------------- |
| `penguins-docker-health`    | Run gateway health check                  |
| `penguins-docker-token`     | Display the gateway authentication token  |
| `penguins-docker-cd`        | Jump to the Penguins project directory    |
| `penguins-docker-config`    | Open the Penguins config directory        |
| `penguins-docker-workspace` | Open the workspace directory              |
| `penguins-docker-help`      | Show all available commands with examples |

## Common Workflows

### Check Status and Logs

**Restart the gateway:**

```bash
penguins-docker-restart
```

**Check container status:**

```bash
penguins-docker-status
```

**View live logs:**

```bash
penguins-docker-logs
```

### Run Advanced Commands in the Container

**Shell into the container:**

```bash
penguins-docker-shell
```

**Inside the container, use the built-in app and low-level CLI directly:**

```bash
penguins status
```

```bash
penguins dashboard --no-open
```

If you are building a custom integration and need the advanced outbound surface:

```bash
penguins message --help
```

### Troubleshooting Device Pairing

**Check for pending pairing requests:**

```bash
penguins-docker-devices
```

**Copy the Request ID from the "Pending" table, then approve:**

```bash
penguins-docker-approve <request-id>
```

Then refresh your browser.

### Fix Token Mismatch Issues

If you see "gateway token mismatch" errors:

```bash
penguins-docker-fix-token
```

This will:

1. Read the token from your `.env` file
2. Configure it in the Penguins config
3. Restart the gateway
4. Verify the configuration

### Permission Denied

**Ensure Docker is running and you have permission:**

```bash
docker ps
```

## Requirements

- Docker and Docker Compose installed
- Bash or Zsh shell
- Penguins project (from `docker-setup.sh`)

## Development

**Test with fresh config (mimics first-time install):**

```bash
unset PENGUINS_DOCKER_DIR && rm -f ~/.penguins/docker-helpers/config && source scripts/shell-helpers/penguins-docker-helpers.sh
```

Then run any command to trigger auto-detect:

```bash
penguins-docker-start
```
