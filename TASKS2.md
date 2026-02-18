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
| **Channels** | WhatsApp, Telegram, Discord, Slack, Google Chat, Teams, Matrix, BlueBubbles | Core supported platforms |
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

### Phase 1 — New GitHub Repo Setup ✅
- [x] Create new local git repo (initialized with fresh `git init`)
- [x] Initial commit with full codebase
- [x] Create GitHub repo (`lalomorales22/penguins`) and push
  ```bash
  git remote add origin https://github.com/lalomorales22/penguins.git
  git push -u origin main
  ```
- [ ] Set up branch protection, README badges, etc. (optional — defer)

### Phase 2 — Delete Native Apps ✅
- [x] `git rm -rf apps/`
- [x] `git rm -rf Swabble/`
- [x] Removed `apps/*` references from `package.json` scripts (android, ios, mac, swift)
- [x] Removed `format:swift`, `lint:swift`, `format:all`, `lint:all`, `mac:*`, `ios:*`, `android:*`, `protocol:gen:swift`, `protocol:check:swift` scripts

### Phase 3 — Delete src/macos/ and src/node-host/ ✅
- [x] `git rm -rf src/macos/`
- [x] `git rm -rf src/node-host/`
- [x] Verified 0 imports — no source changes needed

### Phase 4 — Remove Unused Extensions ✅
- [x] `git rm -rf extensions/voice-call/`
- [x] `git rm -rf extensions/talk-voice/`
- [x] `git rm -rf extensions/signal/`
- [x] `git rm -rf extensions/line/`
- [x] `git rm -rf extensions/irc/`
- [x] `git rm -rf extensions/nostr/`
- [x] `git rm -rf extensions/tlon/`
- [x] `git rm -rf extensions/twitch/`
- [x] `git rm -rf extensions/mattermost/`
- [x] `git rm -rf extensions/nextcloud-talk/`
- [x] `git rm -rf extensions/feishu/`
- [x] `git rm -rf extensions/zalo/`
- [x] `git rm -rf extensions/zalouser/`
- [x] `git rm -rf extensions/phone-control/`
- [x] `git rm -rf extensions/copilot-proxy/`
- [x] `git rm -rf extensions/lobster/`
- [x] Catalog is fully dynamic (no hardcoded list) — no registry changes needed

### Phase 5 — Remove src/line/ ✅
- [x] `git rm -rf src/line/`
- [x] Removed LINE from `plugins/runtime/index.ts` (18-line import block + `line: {}` return value)
- [x] Removed LINE from `plugin-sdk/index.ts` (Channel: LINE export block)
- [x] Deleted `src/auto-reply/reply/line-directives.ts`
- [x] Cleaned `src/auto-reply/reply/normalize-reply.ts` (removed LINE directive usage)
- [x] Cleaned `src/tts/tts.ts` (replaced `stripMarkdown` import from line/ with inline)
- [x] Added `PENGUINS_PLUGIN_CATALOG_PATHS` to `src/channels/plugins/catalog.ts` ENV_CATALOG_PATHS

### Phase 6 — Remove Legacy Compat Packages ✅
- [x] `git rm -rf packages/`
- [x] Removed workspace references in root `package.json`

### Phase 7 — Skills Cleanup ✅
Deleted 36+ niche skills, kept 15 core skills:
- Kept: `1password`, `apple-notes`, `apple-reminders`, `bear-notes`, `coding-agent`, `github`, `healthcheck`, `himalaya`, `model-usage`, `nano-pdf`, `notion`, `obsidian`, `session-logs`, `skill-creator`, `weather`
- Deleted: `clawhub`, `eightctl`, `gog`, `mcporter`, `openhue`, `sonoscli`, `spotify-player`, `twitch`, `songsee`, `camsnap`, `wacli`, `lobster`, `ordercli`, `food-order`, `blucli`, `oracle`, `sag`, `nano-banana-pro`, `openai-whisper`, `openai-whisper-api`, `openai-image-gen`, `goplaces`, `blogwatcher`, `imsg`, `discord` (skill), `slack` (skill), `telegram` (skill), `tlon`, `voice-call`, `peekaboo`, `gifgrep`, `tmux`, `canvas` (skill), `sherpa-onnx-tts`, and others

### Phase 8 — TTS Simplification ✅
Kept OpenAI TTS only, removed ElevenLabs and Edge TTS providers:
- [x] `src/config/types.tts.ts` — `TtsProvider` narrowed to `"openai"` only
- [x] `src/config/zod-schema.core.ts` — `TtsProviderSchema` → `z.enum(["openai"])`
- [x] `src/tts/tts-core.ts` — removed `edgeTTS`, `elevenLabsTTS`, `inferEdgeExtension`, all ElevenLabs validators
- [x] `src/tts/tts.ts` — simplified all dispatch functions to OpenAI only
- [x] `src/auto-reply/reply/commands-tts.ts` — updated help text and validation
- [x] `src/auto-reply/commands-registry.data.ts` — updated provider description
- [x] `src/gateway/server-methods/tts.ts` — removed elevenlabs/edge from status responses

### Phase 9 — Build Scripts Cleanup ✅
- [x] Deleted macOS/iOS scripts: `build-and-run-mac.sh`, `codesign-mac-app.sh`, `notarize-mac-artifact.sh`, `create-dmg.sh`, `package-mac-app.sh`, `package-mac-dist.sh`, `restart-mac.sh`, `ios-team-id.sh`, `build_icon.sh`, `make_appcast.sh`, `mobile-reauth.sh`, `protocol-gen-swift.ts`
- [x] Deleted stale scripts: `sync-moonshot-docs.ts`, `update-clawtributors.ts`, `update-clawtributors.types.ts`, `clawtributors-map.json`
- [x] Deleted `src/types/node-edge-tts.d.ts` (Edge TTS removed)
- [x] Cleaned `package.json`: removed all android/ios/mac/swift scripts, removed duplicate entries, removed `node-edge-tts`, `@larksuiteoapi/node-sdk`, `@line/bot-sdk` dependencies, cleaned legacy `OPENCLAW_*` env var prefixes from gateway scripts

### Phase 10 — Docs Cleanup ✅
- [x] `git rm -rf docs/zh-CN/` — full Chinese translation
- [x] `git rm -rf docs/ja-JP/` — partial Japanese translation
- [x] `git rm -rf docs/.i18n/` — i18n glossaries and translation memory
- [x] `git rm -rf docs/nodes/` — mobile/audio hardware nodes
- [x] `git rm -f docs/platforms/ios.md docs/platforms/android.md docs/platforms/macos.md`
- [x] `git rm -rf docs/platforms/mac/` — macOS companion app docs
- [x] Removed channel docs: feishu, line, irc, nostr, tlon, twitch, mattermost, nextcloud-talk, signal, zalo, zalouser, imessage
- [x] Updated `docs/docs.json`: removed zh-Hans + ja language blocks, cleaned Channels/Platforms/Tools nav, cleaned stale redirects

### Phase 11 — README Rewrite ✅
- [x] Rewritten README focused on new direction (WebChat primary, Cloudflare Tunnel)
- [x] TASKS2.md updated with completion status

### Phase 12 — Tailscale → Cloudflare Tunnel ⏳ (future work)
This is new feature work, not just deletion. Defer until cleanup is fully settled.

- [ ] Research Cloudflare Tunnel SDK/CLI integration
- [ ] Stub out `src/gateway/server-tailscale.ts` to no-op
- [ ] Add `src/gateway/server-cloudflare.ts` with tunnel setup
- [ ] Update wizard (`src/wizard/onboarding.gateway-config.ts`) to offer Cloudflare Tunnel
- [ ] Update `src/commands/configure.gateway.ts`
- [ ] Update docs: remove Tailscale guides, add Cloudflare Tunnel guide

---

## Risk / Order Notes

- **Phases 2-10 are complete** — deletions done, verified build-safe
- **Phase 12** (Cloudflare) is additive new feature — do after all cleanup is done
- **Run `pnpm build` and `pnpm check` after each phase**

---

## Expected Outcome

| Metric | Before | After |
|---|---|---|
| apps/ size | ~1.8GB | 0 (deleted) |
| extensions/ count | 37 | ~12 |
| skills/ count | 56 | ~15 |
| Supported channels | 15+ | 8 core |
| Docs languages | EN + ZH + JA | EN only |
| Native apps | iOS + Android + macOS | None (WebChat is primary) |
| VPN | Tailscale | Cloudflare Tunnel (planned) |
| TTS providers | ElevenLabs + Edge + OpenAI | OpenAI only |

---

_Created: 2026-02-17_
_Status: Phases 1–11 complete. Phase 12 (Cloudflare) is future work._
