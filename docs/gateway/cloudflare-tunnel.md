---
summary: "Cloudflare Tunnel + Access for a public Penguins dashboard hostname"
read_when:
  - You want a public HTTPS hostname for Penguins
  - You want browser login via Cloudflare Access instead of SSH or Tailscale
title: "Cloudflare Tunnel"
---

# Cloudflare Tunnel (dashboard + WebSocket)

Use Cloudflare Tunnel when you want a public HTTPS hostname for Penguins
without exposing the gateway port directly.

Recommended topology:

- Penguins stays on `127.0.0.1`
- `cloudflared` runs on the same host and proxies to `http://127.0.0.1:18789`
- Cloudflare Access authenticates the browser
- Penguins uses `gateway.auth.mode: "trusted-proxy"` to accept the Access
  identity header

This works for both the Control UI and the Gateway WebSocket because they share
the same origin.

## Recommended Penguins config

```json5
{
  gateway: {
    bind: "loopback",
    trustedProxies: ["127.0.0.1", "::1"],
    auth: {
      mode: "trusted-proxy",
      trustedProxy: {
        userHeader: "cf-access-authenticated-user-email",
        requiredHeaders: ["cf-access-jwt-assertion", "x-forwarded-proto", "x-forwarded-host"],
        allowUsers: ["you@example.com"],
      },
    },
  },
}
```

Notes:

- If `cloudflared` runs in another container or on another host, replace
  `gateway.trustedProxies` with that proxy IP instead of loopback.
- If you use `penguins configure`, choose `Trusted Proxy` and then the
  `Cloudflare Access` preset.
- Device pairing still applies for new browsers. See [Control UI](/web/control-ui).

## Cloudflare side

1. Install `cloudflared` on the gateway host.
2. Create a tunnel and route a hostname such as `penguins.example.com`.
3. Point that hostname at `http://127.0.0.1:18789`.
4. Create a Cloudflare Access self-hosted application for the same hostname.
5. Allow only the email addresses or groups that should operate Penguins.

Minimal locally-managed tunnel config:

```yaml
tunnel: <tunnel-id>
credentials-file: /home/user/.cloudflared/<tunnel-id>.json

ingress:
  - hostname: penguins.example.com
    service: http://127.0.0.1:18789
  - service: http_status:404
```

Then run:

```bash
cloudflared tunnel run <tunnel-name>
```

For service-based installs or remotely-managed tunnels, follow Cloudflare's
normal `cloudflared` setup and keep the origin target at
`http://127.0.0.1:18789`.

## Open Penguins

Open:

- `https://penguins.example.com/`

If you set `gateway.controlUi.basePath`, open that path instead.

The browser signs in with Cloudflare Access first. After that, Penguins applies
its normal device pairing rules for the browser.

## Security notes

- Do not combine `trusted-proxy` auth with `tailscale.mode: "serve"` or
  `"funnel"`. Penguins disables Tailscale automation in this mode.
- Keep `gateway.bind: "loopback"` unless you have a concrete reason not to.
- In `trusted-proxy` mode, the authenticated proxy user can access the Gateway
  surfaces served on that hostname. Keep `allowUsers` tight.
- If you expose `/tools/invoke`, `/v1/chat/completions`, or `/v1/responses` on
  the same hostname, authenticated Cloudflare Access users can reach them too.
  If you want machine-to-machine API auth instead, use token/password auth or a
  separate hostname.
- Run `penguins security audit` after you expose the tunnel.

## Troubleshooting

### `1008 unauthorized`

Check:

- `gateway.trustedProxies`
- `gateway.auth.trustedProxy.userHeader`
- `gateway.auth.trustedProxy.requiredHeaders`
- Cloudflare Access policy membership

### Cloudflare login works but Penguins still rejects the browser

Make sure the origin request reaching Penguins still includes:

- `cf-access-authenticated-user-email`
- `cf-access-jwt-assertion`

and that the request source IP matches one of `gateway.trustedProxies`.

### Localhost works but the public hostname does not

Check the tunnel target, restart `cloudflared`, then run:

```bash
penguins security audit
penguins gateway status --deep
```

## Related

- [Remote access](/gateway/remote)
- [Trusted Proxy Auth](/gateway/trusted-proxy-auth)
- [Dashboard](/web/dashboard)
- [Security](/gateway/security)
