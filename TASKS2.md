# Penguins — Slim & Clean Plan

## Context

The original codebase was built for a specific person's exact setup (Apple Developer account,
iOS/Android publishing, ElevenLabs voice, Tailscale VPN, macOS companion apps, 38 messaging
channels). We're stripping it down to what's actually useful for the new direction:

**New direction (from README `# *update` notes):**
- Build our own chat app (not depend on third-party messaging as the primary surface)
- Use free Cloudflare Tunnel + subdomain instead of Tailscale
- Remove all platforms we can't build for or publish to

---

## What We're Keeping (Core)

| Category | Keep | Reason |
|---|---|---|
| **Gateway server** | `src/gateway/` | The entire control plane — non-negotiable |
| **CLI** | `src/cli/` | Primary interface |
| **Config** | `src/config/` | Core config system |
| **Agents** | `src/agents/` | AI agent runner |
| **Auto-reply** | `src/auto-reply/` | Core messaging logic |
| **WebChat UI** | `src/web/`, `ui/` | Primary chat surface (our own app) |
| **TUI** | `src/tui/` | Terminal chat UI |
| **Channels** | WhatsApp, Telegram, Discord, Slack, Google Chat | Most-used platforms |
| **Memory** | `src/memory/` | Useful persistence feature |
| **Canvas host** | `src/canvas-host/` | WebChat UI host |
| **Daemon** | `src/daemon/` | systemd/launchd service management |
| **Infra** | `src/infra/` (most of it) | Core utilities |
| **Docker** | `Dockerfile`, `Dockerfile.sandbox*` | Deployment |
| **Extensions** | discord, telegram, slack, whatsapp, googlechat, msteams, matrix, bluebubbles, memory-core, memory-lancedb, llm-task, diagnostics-otel | Core supported channels |

---

## What We're Deleting

### Phase A — Native Apps (BIGGEST WIN: ~1.8GB)

| Path | Reason | Size |
|---|---|---|
| `apps/ios/` | No Apple Developer account | ~2.3MB |
| `apps/android/` | No Google Play account | ~1.6MB |
| `apps/macos/` | No Apple Developer account, macOS signing required | **~1.8GB** (build cache) |
| `apps/shared/` | Shared iOS/macOS Swift code — nothing left to share | small |
| `Swabble/` | Standalone Swift utility library for iOS/macOS apps | ~160KB |

### Phase B — Voice & Mobile Features

| Path | Reason |
|---|---|
| `src/macos/` | macOS relay/daemon code — 0 imports in src/, only needed for macOS app |
| `src/node-host/` | Remote node execution for iOS/Android — 0 imports in src/ |
| `src/tts/` | Text-to-speech — ElevenLabs/Edge TTS, tied to voice features we're not supporting. NOTE: has 20 imports — needs careful cleanup |
| `extensions/voice-call/` | VoIP via Twilio/Telnyx/Plivo — paid telephony service |
| `extensions/talk-voice/` | Stub, only 2 files |

### Phase C — Channels We're Not Using

| Path | Reason |
|---|---|
| `src/line/` | LINE messenger — not a primary platform |
| `extensions/line/` | Same |
| `extensions/signal/` | Requires `signal-cli` Java install — painful to set up |
| `extensions/irc/` | IRC — legacy |
| `extensions/nostr/` | Niche decentralized network |
| `extensions/tlon/` | Obscure platform |
| `extensions/twitch/` | Streaming platform, not a personal AI assistant use case |
| `extensions/mattermost/` | Enterprise team chat — niche |
| `extensions/nextcloud-talk/` | Self-hosted niche |
| `extensions/feishu/` | Chinese enterprise platform |
| `extensions/zalo/` | Vietnamese platform |
| `extensions/zalouser/` | Same |
| `extensions/phone-control/` | Mobile phone control — needs native apps |
| `extensions/copilot-proxy/` | MS Copilot proxy — ties to Microsoft ecosystem |
| `extensions/lobster/` | Custom for original author (Molty the space lobster) |

### Phase D — Legacy Compat Packages

| Path | Reason |
|---|---|
| `packages/clawdbot/` | Compatibility shim — only needed if publishing to npm |
| `packages/moltbot/` | Compatibility shim — same |

### Phase E — Skills Cleanup

Keep only these skills (commonly useful, platform-independent):
- `github`, `notion`, `obsidian`, `apple-notes`, `apple-reminders`, `health-check`
- `model-usage`, `session-logs`, `weather`, `1password`, `himalaya`
- `coding-agent`, `skill-creator`, `nano-pdf`

Delete everything else (gaming, Sonos, Spotify, LINE-specific, ClawHub, etc.):
- `clawhub`, `eightctl`, `gog`, `mcporter`, `openhue`, `sonoscli`, `spotify-player`
- `twitch`, `songsee`, `camsnap`, `wacli`, `lobster`, `ordercli`, `food-order`
- `blucli`, `oracle`, `sag`, `nano-banana-pro`, `openai-whisper`, `openai-whisper-api`
- `openai-image-gen`, `goplaces`, `blogwatcher`, `imsg`, `discord` (skill), `slack` (skill), `telegram` (skill)
- `tlon`, `voice-call`, `peekaboo`, `gifgrep`, `tmux`, `canvas` (skill)

### Phase F — Docs Cleanup

| Path | Reason |
|---|---|
| `docs/zh-CN/` | Chinese docs — not maintaining i18n in the new repo |
| `docs/ja-JP/` | Japanese docs — same |
| `docs/.i18n/` | i18n config/glossaries |
| `docs/platforms/ios.md` | No iOS app |
| `docs/platforms/android.md` | No Android app |
| `docs/platforms/macos.md` | No macOS app |
| `docs/nodes/` | Node docs (camera, voice wake, etc.) — all mobile |
| Any channel docs for channels being removed (signal, irc, nostr, tlon, feishu, zalo, line, twitch) | |

### Phase G — Tailscale (replace with Cloudflare Tunnel)

This is more involved because Tailscale is wired into the gateway. Don't delete yet — plan:
- `src/infra/tailscale.ts` — replace behavior with Cloudflare Tunnel equivalent
- `src/gateway/server-tailscale.ts` — stub out / remove
- Update wizard/onboarding to guide Cloudflare Tunnel setup instead
- Update all docs references from Tailscale → Cloudflare

### Phase H — Bonjour/mDNS (optional, defer)

Bonjour is used for LAN device discovery (finding the gateway from mobile apps we're removing).
Without iOS/Android/macOS apps, mDNS discovery has no clients. However, it's also useful for
local-network discovery in general. Decision: **stub it to no-op** rather than full delete for now.

---

## Implementation Phases

### Phase 1 — New GitHub Repo Setup
- [ ] Create new GitHub repo (`lalopenguin/penguins` or `penguins/penguins`)
- [ ] Copy current codebase (without git history from the fork)
  ```bash
  # Option A: fresh copy
  cp -r /Users/minibrain/Desktop/penguins /tmp/penguins-clean
  cd /tmp/penguins-clean && rm -rf .git && git init && git add . && git commit -m "initial: penguins clean start"

  # Option B: keep history but cut the remote
  git remote remove origin
  git remote add origin https://github.com/YOUR_USERNAME/penguins.git
  git push -u origin main
  ```
- [ ] Decide: keep git history or start fresh (fresh = cleaner, history = useful for blame)
- [ ] Set up branch protection, README badges, etc.

### Phase 2 — Delete Native Apps (do first, biggest size win)
- [ ] `git rm -rf apps/`
- [ ] `git rm -rf Swabble/`
- [ ] Remove any `apps/*` or `Swabble` references from:
  - `package.json` scripts
  - `scripts/` folder (codesign, notarize, dmg, build-mac-* scripts)
  - `readme.md`
  - `tasks.md` / `TASKS2.md`
- [ ] Run `pnpm build` to verify nothing breaks

### Phase 3 — Delete src/macos/ and src/node-host/
- [ ] `git rm -rf src/macos/`
- [ ] `git rm -rf src/node-host/`
- [ ] Remove from any `index.ts` barrel exports if present
- [ ] Run `pnpm build` — should be clean (0 imports confirmed)

### Phase 4 — Remove Unused Extensions
In order of safest-first:

- [ ] `git rm -rf extensions/voice-call/`
- [ ] `git rm -rf extensions/talk-voice/`
- [ ] `git rm -rf extensions/signal/`
- [ ] `git rm -rf extensions/line/`
- [ ] `git rm -rf extensions/irc/`
- [ ] `git rm -rf extensions/nostr/`
- [ ] `git rm -rf extensions/tlon/`
- [ ] `git rm -rf extensions/twitch/`
- [ ] `git rm -rf extensions/mattermost/`
- [ ] `git rm -rf extensions/nextcloud-talk/`
- [ ] `git rm -rf extensions/feishu/`
- [ ] `git rm -rf extensions/zalo/`
- [ ] `git rm -rf extensions/zalouser/`
- [ ] `git rm -rf extensions/phone-control/`
- [ ] `git rm -rf extensions/copilot-proxy/`
- [ ] `git rm -rf extensions/lobster/`
- [ ] Remove all deleted extension names from `src/channels/plugins/catalog.ts` (or equivalent registry)
- [ ] Run `pnpm build`

### Phase 5 — Remove src/line/
- [ ] `git rm -rf src/line/`
- [ ] Remove line channel from config schema types
- [ ] Remove line from channel catalog/registry
- [ ] Run `pnpm build`

### Phase 6 — Remove Legacy Compat Packages
- [ ] `git rm -rf packages/`
- [ ] Remove any workspace references in root `package.json`

### Phase 7 — Skills Cleanup
- [ ] Delete skills listed in Phase E above
- [ ] Keep: `github`, `notion`, `obsidian`, `apple-notes`, `apple-reminders`, `health-check`, `model-usage`, `session-logs`, `weather`, `1password`, `himalaya`, `coding-agent`, `skill-creator`, `nano-pdf`
- [ ] Run `pnpm build`

### Phase 8 — TTS Removal (careful — 20 imports)
TTS is deeply wired in. Options:
- **Option A (recommended):** Keep TTS but remove ElevenLabs/Edge providers, keep only OpenAI TTS. Simplifies without breaking everything.
- **Option B:** Stub TTS to no-op, remove config keys, clean up all 20 import sites.

For now: **do Option A** — remove `elevenlabs` and `edge-tts` providers from `src/tts/tts.ts`,
keep OpenAI TTS only (most users already have an OpenAI key).

- [ ] Edit `src/tts/tts.ts` to remove ElevenLabs and Edge TTS providers
- [ ] Remove related config keys from `src/config/types.ts`
- [ ] Update docs

### Phase 9 — Tailscale → Cloudflare Tunnel
This is new feature work, not just deletion.

- [ ] Research Cloudflare Tunnel SDK/CLI integration
- [ ] Stub out `src/gateway/server-tailscale.ts` to no-op
- [ ] Add `src/gateway/server-cloudflare.ts` with tunnel setup
- [ ] Update wizard (`src/wizard/onboarding.gateway-config.ts`) to offer Cloudflare Tunnel
- [ ] Update `src/commands/configure.gateway.ts`
- [ ] Update docs: remove Tailscale guides, add Cloudflare Tunnel guide

### Phase 10 — Docs Cleanup
- [ ] `git rm -rf docs/zh-CN/`
- [ ] `git rm -rf docs/ja-JP/`
- [ ] `git rm -rf docs/.i18n/`
- [ ] `git rm -f docs/platforms/ios.md docs/platforms/android.md docs/platforms/macos.md`
- [ ] `git rm -rf docs/nodes/`
- [ ] Remove docs for deleted channels
- [ ] Rewrite README.md from scratch — simpler, focused on new direction
- [ ] Remove Tailscale docs, add Cloudflare Tunnel docs

### Phase 11 — Build Scripts Cleanup
Delete macOS-specific build scripts that no longer apply:
- [ ] `scripts/build-and-run-mac.sh`
- [ ] `scripts/codesign-mac-app.sh`
- [ ] `scripts/notarize-mac-artifact.sh`
- [ ] `scripts/create-dmg.sh`
- [ ] `scripts/package-mac-*.sh` (any mac packaging scripts)
- [ ] `scripts/sync-moonshot-docs.ts` (third-party sync)
- [ ] `scripts/update-clawtributors.ts` (contributor tracking for old project)
- [ ] Remove corresponding `package.json` scripts

### Phase 12 — Final README Rewrite
The current README is 500 lines of detailed setup docs for Peter's exact setup. Rewrite it:

- [ ] New header — Penguins as a personal AI assistant gateway
- [ ] Highlight: WebChat as primary surface + Cloudflare Tunnel for access
- [ ] Supported channels: WhatsApp, Telegram, Discord, Slack, Google Chat, Teams, Matrix, BlueBubbles
- [ ] Clean install instructions
- [ ] Remove all references to deleted platforms/features
- [ ] Remove "Molty the space lobster" + steipete.me + soul.md references

---

## Risk / Order Notes

- **Do Phases 1-3 first** (no code changes, just deletions with confirmed 0 imports)
- **Phase 4-6** are safe deletions (extension plugins load dynamically, removing them won't break the core)
- **Phase 7** (skills) is safe — skills are fully optional
- **Phase 8** (TTS) needs care — do last of the deletion phases
- **Phase 9** (Cloudflare) is additive new feature — do after all cleanup is done
- **Run `pnpm build` and `pnpm check` after each phase**

---

## Expected Outcome

| Metric | Before | After |
|---|---|---|
| apps/ size | ~1.8GB | 0 |
| extensions/ count | 37 | ~12 |
| skills/ count | 56 | ~14 |
| Supported channels | 15+ | 8 core |
| Docs languages | EN + ZH + JA | EN only |
| Native apps | iOS + Android + macOS | None (WebChat is primary) |
| VPN | Tailscale | Cloudflare Tunnel |
| TTS providers | ElevenLabs + Edge + OpenAI | OpenAI only |

---

_Created: 2026-02-17_
_Status: Planning — awaiting user approval to begin Phase 1_
