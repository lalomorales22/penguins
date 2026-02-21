# Penguins

A self-hosted personal AI assistant gateway. Run one process on your own server or machine and
reach your AI from WhatsApp, Telegram, Discord, Slack, Google Chat, Teams, Matrix, BlueBubbles —
or the built-in WebChat interface.

---

## What it does

- **WebChat** — first-class browser UI, no third-party messaging required
- **8 messaging channels** — connect the platforms you actually use
- **Gateway server** — one process, all channels, persistent sessions
- **AI agent loop** — tool use, multi-agent, memory, session management
- **Skills** — extend with GitHub, Notion, Obsidian, Apple Notes, and more
- **CLI** — manage everything from the terminal

---

## Supported channels

| Channel | Status |
|---|---|
| WhatsApp | ✅ Supported |
| Telegram | ✅ Supported |
| Discord | ✅ Supported |
| Slack | ✅ Supported |
| Google Chat | ✅ Supported |
| Microsoft Teams | ✅ Supported |
| Matrix | ✅ Supported |
| BlueBubbles | ✅ Supported |
| WebChat (built-in) | ✅ Primary surface |

---

## Quick start

### Requirements

- Node.js ≥ 22.12.0
- pnpm ≥ 10
- An Anthropic or OpenAI API key

### Install

```bash
npm install -g penguins
```

Or run directly:

```bash
npx penguins setup
```

### First run

```bash
penguins setup        # interactive onboarding wizard
penguins gateway      # start the gateway server
penguins             # open the TUI / WebChat
```

---

## Remote access

To reach your gateway from anywhere without a static IP:

**Cloudflare Tunnel** (free, recommended):

```bash
# Install cloudflared, then:
cloudflared tunnel --url http://localhost:4000
```

Cloudflare gives you a public HTTPS URL pointing to your local gateway. No port forwarding,
no VPN, no cost.

---

## Supported AI providers

- Anthropic (Claude)
- OpenAI (GPT-4, etc.)
- Ollama (local models)
- OpenRouter
- AWS Bedrock
- Vercel AI Gateway
- And more — see `penguins models`

---

## Skills

Extend your assistant with built-in skills:

| Skill | What it does |
|---|---|
| `github` | Search repos, open issues, read PRs |
| `notion` | Read and write Notion pages |
| `obsidian` | Read and search your Obsidian vault |
| `apple-notes` | Read and create Apple Notes |
| `apple-reminders` | Manage Apple Reminders |
| `weather` | Current weather via Open-Meteo |
| `himalaya` | Read and send email via Himalaya |
| `1password` | Fetch secrets from 1Password |
| `nano-pdf` | Read PDFs |
| `coding-agent` | Launch a sub-agent for coding tasks |
| `skill-creator` | Create new skills from the chat |
| `model-usage` | Track API usage and costs |
| `session-logs` | Browse session history |
| `health-check` | Check gateway health |

---

## Docker

```bash
docker pull ghcr.io/penguins/penguins:latest
docker run -p 4000:4000 -v ~/.penguins:/home/node/.penguins ghcr.io/penguins/penguins:latest
```

---

## Configuration

Config lives at `~/.penguins/config.json` by default. Use the interactive wizard:

```bash
penguins setup
```

Or edit manually — see `penguins configure --help` for all options.

**Key env vars:**

| Variable | Description |
|---|---|
| `PENGUINS_STATE_DIR` | Override state/data directory (default: `~/.penguins`) |
| `PENGUINS_CONFIG_PATH` | Override config file path (default: `~/.penguins/penguins.json`) |
| `PENGUINS_GATEWAY_TOKEN` | Gateway auth token |
| `PENGUINS_GATEWAY_PASSWORD` | Gateway auth password |
| `PENGUINS_LOAD_SHELL_ENV` | Load env from login shell (`1` to enable) |
| `PENGUINS_EMBEDDING_BACKEND` | Force embedding backend: `local` or `openai` |

---

## CLI reference

```
penguins             Start the agent / TUI
penguins gateway     Start the gateway server
penguins setup       Interactive onboarding wizard
penguins configure   Edit configuration
penguins channels    Manage channel connections
penguins skills      List and manage skills
penguins doctor      Diagnose configuration issues
penguins status      Show gateway status
penguins logs        View gateway logs
penguins update      Update to latest version
penguins --help      Full command list
```

---

## Development

```bash
git clone https://github.com/lalopenguin/penguins
cd penguins
pnpm install
pnpm dev            # run in dev mode
pnpm build          # build all packages
pnpm test           # run tests
pnpm check          # lint + types + format check
```

---

## Migrating from OpenClaw

If you were using the old `openclaw` CLI:

```bash
# Both commands work — openclaw shows a deprecation warning
openclaw     # works, warns: use "penguins" instead
penguins     # preferred
```

**Env vars:** Rename any `OPENCLAW_*` variables in your shell profile or `.env` files to `PENGUINS_*`:

```bash
# Old                          New
OPENCLAW_GATEWAY_TOKEN      → PENGUINS_GATEWAY_TOKEN
OPENCLAW_GATEWAY_PASSWORD   → PENGUINS_GATEWAY_PASSWORD
OPENCLAW_STATE_DIR          → PENGUINS_STATE_DIR
OPENCLAW_CONFIG_PATH        → PENGUINS_CONFIG_PATH
```

**Config and state directories** are unchanged — no data migration needed. Your existing `~/.penguins/` directory and config work as-is.

---

## License

MIT
