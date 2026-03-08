---
summary: "Network hub: gateway surfaces, discovery, remote access, and security"
read_when:
  - You need the network architecture + security overview
  - You are debugging local vs tailnet or Cloudflare access
  - You want the canonical list of networking docs
title: "Network"
---

# Network hub

This hub links the core docs for how Penguins connects, tunnels, and secures
operator access across localhost, LAN, and tailnet.

## Core model

- [Gateway architecture](/concepts/architecture)
- [Gateway protocol](/gateway/protocol)
- [Gateway runbook](/gateway)
- [Web surfaces + bind modes](/web)

## Identity + access

- [Gateway security](/gateway/security)
- [Remote access](/gateway/remote)
- [Cloudflare Tunnel](/gateway/cloudflare-tunnel)
- [Trusted proxy auth](/gateway/trusted-proxy-auth)

## Discovery + transports

- [Discovery & transports](/gateway/discovery)
- [Bonjour / mDNS](/gateway/bonjour)
- [Remote access (SSH)](/gateway/remote)
- [Tailscale](/gateway/tailscale)
- [Cloudflare Tunnel](/gateway/cloudflare-tunnel)

## Security

- [Security overview](/gateway/security)
- [Gateway config reference](/gateway/configuration)
- [Troubleshooting](/gateway/troubleshooting)
- [Doctor](/gateway/doctor)
