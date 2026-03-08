---
summary: "Overview of Penguins onboarding options and flows"
read_when:
  - Choosing an onboarding path
  - Setting up a new environment
title: "Onboarding Overview"
sidebarTitle: "Onboarding Overview"
---

# Onboarding Overview

Penguins currently has one recommended onboarding path: the CLI wizard. It
works on macOS, Linux, and Windows via WSL2, and it sets up the supported
web/CLI-first product surface.

## Recommended path

- **CLI wizard** for macOS, Linux, and Windows (via WSL2).
- After onboarding, use the local browser Control UI or put it behind a
  private tunnel such as Cloudflare Tunnel + Access.

## CLI onboarding wizard

Run the wizard in a terminal:

```bash
penguins onboard
```

Use the CLI wizard when you want full control of the Gateway, workspace, auth,
remote access, and skills. Docs:

- [Onboarding Wizard (CLI)](/start/wizard)
- [`penguins onboard` command](/cli/onboard)

## Custom Provider

If you need an endpoint that is not listed, including hosted providers that
expose standard OpenAI or Anthropic APIs, choose **Custom Provider** in the
CLI wizard. You will be asked to:

- Pick OpenAI-compatible, Anthropic-compatible, or **Unknown** (auto-detect).
- Enter a base URL and API key (if required by the provider).
- Provide a model ID and optional alias.
- Choose an Endpoint ID so multiple custom endpoints can coexist.

For detailed steps, follow the CLI onboarding docs above.
