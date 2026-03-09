# Security Model

Penguins takes security seriously. This document describes the authentication,
authorization, and hardening measures built into the gateway.

## Authentication Modes

The gateway supports multiple authentication modes configured via
`gateway.auth` in `penguins.json` or environment variables.

### Token Authentication

Set `PENGUINS_GATEWAY_TOKEN` or configure `gateway.auth.token` in config.
All HTTP and WebSocket requests must include the token as a Bearer token:

```
Authorization: Bearer <token>
```

### Password Authentication

Set `PENGUINS_GATEWAY_PASSWORD` or configure `gateway.auth.password`.
The Control UI prompts for the password on first connect.

**Best practice:** Prefer environment variables over storing passwords in
`penguins.json`. The built-in security audit warns if passwords are found
on disk.

### Tailscale Authentication

When exposed via Tailscale Serve, the gateway validates the client identity
using Tailscale headers and IP ranges. No additional token is needed for
authenticated Tailscale users.

### Trusted Proxy (Cloudflare)

For deployments behind Cloudflare Access or similar proxies, configure
`gateway.trustedProxies` with the proxy IP ranges. The gateway validates
the `Cf-Access-Jwt-Assertion` header.

## Rate Limiting

The gateway includes sliding-window rate limiting for authentication attempts:

- **Window:** 60 seconds (configurable)
- **Max attempts:** 10 per window (configurable)
- **Lockout:** 5 minutes after exceeding the limit
- **Loopback exempt:** Local CLI connections skip rate limiting

Rate limiting is in-memory. For multi-instance deployments, use an external
rate limiter (e.g., nginx `limit_req` or Cloudflare WAF).

## Network Security

### Bind Modes

| Mode        | Binds to            | Use case             |
| ----------- | ------------------- | -------------------- |
| `loopback`  | `127.0.0.1`         | Local-only (default) |
| `lan`       | `0.0.0.0`           | LAN access           |
| `tailscale` | Tailscale interface | Remote via Tailscale |
| `auto`      | Best available      | Auto-detection       |

### HTTPS/TLS

Configure TLS certificates in `penguins.json`:

```json
{
  "gateway": {
    "tls": {
      "cert": "/path/to/cert.pem",
      "key": "/path/to/key.pem"
    }
  }
}
```

For production, use a reverse proxy (nginx, Caddy) with automatic HTTPS
or Cloudflare Tunnel.

### Security Headers

All HTTP responses include:

- `X-Content-Type-Options: nosniff`
- `X-Frame-Options: DENY`
- `Referrer-Policy: no-referrer`

The Control UI additionally sets a Content Security Policy:

```
default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline';
img-src 'self' data: https:; connect-src 'self' ws: wss:;
frame-ancestors 'none'; object-src 'none'; base-uri 'none'
```

## File System Safety

### Path Traversal Protection

All file operations use `fs-safe.ts` which:

- Validates paths stay within allowed boundaries
- Uses `O_NOFOLLOW` to block symlink attacks
- Verifies inodes match after open to catch TOCTOU races
- Strips dangerous paths from archive extraction

### Config File Permissions

Config files are written with `0o600` permissions (owner read/write only).

## Command Execution Safety

The agent bash tool blocks dangerous environment variables from being
set or inherited:

- `LD_PRELOAD`, `LD_LIBRARY_PATH`
- `NODE_OPTIONS`, `NODE_PATH`
- `BASH_ENV`, `ENV`, `BASH_FUNC_*`
- `PYTHONSTARTUP`, `PERL5OPT`, `RUBYOPT`

## Hook Security

Webhook endpoints require authentication via `X-Penguins-Token` or
`Authorization: Bearer <token>`. Query parameter tokens are rejected.

Hook tokens must be at least 24 characters and cannot reuse the gateway
token.

## Extension Security

Extensions are loaded at gateway startup from the `extensions/` directory.
They have access to:

- The plugin SDK API (`penguins/plugin-sdk`)
- Hook lifecycle events
- Tool registration

Extensions do **not** have:

- Direct access to gateway internals
- Ability to modify other extensions
- Automatic filesystem access beyond their workspace

## Security Audit

Run `penguins doctor` to get a security audit that checks for:

- Passwords stored on disk (should use env vars)
- Weak or short tokens
- Dangerous Docker/sandbox configurations
- Insecure hook token configuration
- Small models susceptible to prompt injection
- Missing API keys for enabled features

## Reporting Vulnerabilities

If you discover a security vulnerability, please report it responsibly.
Do not open a public issue. Instead, email security concerns directly.
