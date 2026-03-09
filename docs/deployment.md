# Deployment Guide

Production deployment options for Penguins.

## Quick Reference

| Method             | Best For           | Complexity |
| ------------------ | ------------------ | ---------- |
| npm global install | Single-user, local | Low        |
| Docker             | Self-hosted server | Medium     |
| Fly.io             | Cloud deployment   | Medium     |
| Systemd service    | Linux server       | Medium     |

## npm Global Install

```bash
npm install -g penguins
penguins onboard --install-daemon
penguins gateway
```

State is stored in `~/.penguins/`. The `--install-daemon` flag installs a systemd or launchd service for auto-start.

## Docker

### Docker Compose (Recommended)

```yaml
version: "3.8"
services:
  penguins:
    image: ghcr.io/lalomorales22/penguins:latest
    ports:
      - "18789:18789"
    volumes:
      - penguins-data:/data
    environment:
      - PENGUINS_STATE_DIR=/data
      - PENGUINS_GATEWAY_AUTH_MODE=token
      - PENGUINS_GATEWAY_TOKEN=your-secret-token
      - PENGUINS_BIND=lan
    restart: unless-stopped

volumes:
  penguins-data:
```

```bash
docker compose up -d
```

### Docker Run

```bash
docker run -d \
  --name penguins \
  -p 18789:18789 \
  -v penguins-data:/data \
  -e PENGUINS_STATE_DIR=/data \
  -e PENGUINS_GATEWAY_AUTH_MODE=token \
  -e PENGUINS_GATEWAY_TOKEN=your-secret-token \
  -e PENGUINS_BIND=lan \
  ghcr.io/lalomorales22/penguins:latest
```

### Build from Source

```bash
git clone https://github.com/lalomorales22/penguins.git
cd penguins
docker build -t penguins .
docker run -d -p 18789:18789 -v penguins-data:/data penguins
```

## Fly.io

The repo includes `fly.private.toml` for a hardened deployment with no public HTTP ingress — accessible only via `fly proxy` or WireGuard.

### Deploy

```bash
fly launch --config fly.private.toml
fly secrets set PENGUINS_GATEWAY_TOKEN=your-secret-token
fly deploy
```

### Access

```bash
# SSH tunnel
fly proxy 18789:3000

# Then open
open http://127.0.0.1:18789
```

### Persistent Storage

```bash
fly volumes create penguins_data --size 1 --region ord
```

The volume is mounted at `/data` in the container.

## Reverse Proxy

### Caddy (Recommended)

```
penguins.example.com {
    reverse_proxy localhost:18789
}
```

Caddy handles TLS automatically via Let's Encrypt.

### nginx

```nginx
server {
    listen 443 ssl;
    server_name penguins.example.com;

    ssl_certificate /etc/letsencrypt/live/penguins.example.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/penguins.example.com/privkey.pem;

    location / {
        proxy_pass http://127.0.0.1:18789;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_read_timeout 86400;
    }
}
```

**Important:** The `Upgrade` and `Connection` headers are required for WebSocket support.

## Tailscale

Penguins has built-in Tailscale support for zero-config secure access:

```bash
penguins configure
# Set auth mode to "tailscale"
# Set allowed users
```

Or via environment variables:

```bash
export PENGUINS_GATEWAY_AUTH_MODE=tailscale
export PENGUINS_TAILSCALE_ALLOWED_USERS=user@example.com
export PENGUINS_BIND=tailnet
penguins gateway
```

## Systemd Service

### Install

```bash
penguins onboard --install-daemon
```

This creates `/etc/systemd/system/penguins-gateway.service` (or user service).

### Manual Setup

```ini
[Unit]
Description=Penguins AI Gateway
After=network.target

[Service]
Type=simple
User=penguins
Environment=PENGUINS_STATE_DIR=/var/lib/penguins
Environment=PENGUINS_GATEWAY_AUTH_MODE=token
Environment=PENGUINS_GATEWAY_TOKEN=your-secret-token
Environment=PENGUINS_BIND=lan
ExecStart=/usr/local/bin/penguins gateway
Restart=always
RestartSec=5

[Install]
WantedBy=multi-user.target
```

```bash
sudo systemctl enable penguins-gateway
sudo systemctl start penguins-gateway
```

## macOS launchd

```bash
penguins onboard --install-daemon
```

Creates a launchd plist at `~/Library/LaunchAgents/ai.penguins.gateway.plist`.

## Environment Variables

| Variable                     | Default       | Description                                          |
| ---------------------------- | ------------- | ---------------------------------------------------- |
| `PENGUINS_STATE_DIR`         | `~/.penguins` | State directory                                      |
| `PENGUINS_GATEWAY_TOKEN`     | —             | Gateway auth token                                   |
| `PENGUINS_GATEWAY_AUTH_MODE` | `token`       | Auth mode: token, password, tailscale, trusted-proxy |
| `PENGUINS_BIND`              | `loopback`    | Bind mode: loopback, lan, tailnet, auto              |
| `PENGUINS_PORT`              | `18789`       | Gateway port                                         |
| `PENGUINS_LOG_LEVEL`         | `info`        | Log level: debug, info, warn, error                  |
| `PENGUINS_EMBEDDING_BACKEND` | `auto`        | Embedding backend: local, openai, auto               |
| `PENGUINS_TTS_PREFS`         | —             | TTS preferences                                      |

## Security Checklist

- [ ] Set a strong gateway token (32+ random characters)
- [ ] Use `loopback` bind unless remote access is needed
- [ ] Put a reverse proxy with TLS in front for remote access
- [ ] Enable rate limiting (on by default)
- [ ] Review `penguins doctor` output for warnings
- [ ] Set `PENGUINS_STATE_DIR` permissions to 700
- [ ] Use Tailscale or SSH tunnels instead of exposing to public internet

## Monitoring

The gateway exposes health information via the `health` WebSocket method and the `/health` HTTP endpoint (when enabled). See [docs/runbook.md](runbook.md) for operational procedures.

### Health Check

```bash
curl http://127.0.0.1:18789/health
```

### Logs

```bash
# Follow logs
penguins logs --follow

# Or via systemd
journalctl -u penguins-gateway -f
```
