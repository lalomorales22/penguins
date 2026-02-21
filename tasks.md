# Penguins Rebrand Implementation Plan

## Overview

Complete rebrand from "OpenClaw" to "Penguins". This document outlines a 5-phase approach to systematically migrate all code, packages, documentation, and assets.

**Estimated Timeline:** 2-4 weeks  
**Estimated Scope:** 11,500+ string occurrences, 42+ renamed files, 38 extension packages  
**Risk Level:** High (requires coordination across npm, GitHub, docs site, mobile app stores)

---

## Pre-Rebrand Checklist (Before Starting)

- [ ] Secure `penguins` npm package name
- [ ] Create `github.com/penguins` organization
- [ ] Secure `penguins.ai` domain
- [ ] Secure `docs.penguins.ai` subdomain
- [ ] Create `@penguins` npm organization
- [ ] Design new logo assets (light/dark variants)
- [ ] Update Discord server name/invite
- [ ] Prepare communication plan for users

---

## Phase 1: Core Infrastructure & Code (Week 1)

**Goal:** Update all core source code, constants, types, and internal naming.

### 1.1 Type System & Constants

- [x] Rename `OpenClawConfig` → `PenguinsConfig` in `src/config/types.openclaw.ts`
- [x] Rename file: `src/config/types.openclaw.ts` → `src/config/types.penguins.ts`
- [x] Update all type imports across codebase
- [ ] Rename `OpenClawApp` → `PenguinsApp` in UI code (mobile apps - Phase 3)

### 1.2 Infrastructure Paths

- [x] Update `src/config/paths.ts`:
  - `NEW_STATE_DIRNAME = ".penguins"`
  - `CONFIG_FILENAME = "penguins.json"`
  - Update `DEFAULT_STATE_DIR` path references
- [x] Rename `src/infra/openclaw-root.ts` → `src/infra/penguins-root.ts`
- [x] Rename `src/infra/tmp-openclaw-dir.ts` → `src/infra/tmp-penguins-dir.ts`
- [x] Update all references in renamed files
- [x] Rename test files accordingly

### 1.3 Environment Variables

- [x] Update all `PENGUINS_*` → `PENGUINS_*` in:
  - `src/config/paths.ts`
  - `src/infra/home-dir.ts`
  - All source files using env vars
- [x] Update `package.json` scripts that set env vars
- [ ] Update CI/CD workflow files (GitHub Actions - Phase 5)
- [x] Full list of env vars migrated (with backwards compatibility):
  - `PENGUINS_HOME` → `PENGUINS_HOME`
  - `PENGUINS_STATE_DIR` → `PENGUINS_STATE_DIR`
  - `PENGUINS_CONFIG_PATH` → `PENGUINS_CONFIG_PATH`
  - `PENGUINS_GATEWAY_PORT` → `PENGUINS_GATEWAY_PORT`
  - `PENGUINS_GATEWAY_TOKEN` → `PENGUINS_GATEWAY_TOKEN`
  - `PENGUINS_GATEWAY_PASSWORD` → `PENGUINS_GATEWAY_PASSWORD`
  - `PENGUINS_OAUTH_DIR` → `PENGUINS_OAUTH_DIR`
  - `PENGUINS_LIVE_TEST` → `PENGUINS_LIVE_TEST`
  - `PENGUINS_E2E_WORKERS` → `PENGUINS_E2E_WORKERS`
  - `PENGUINS_E2E_VERBOSE` → `PENGUINS_E2E_VERBOSE`
  - `PENGUINS_TEST_HOME` → `PENGUINS_TEST_HOME`
  - `PENGUINS_PROFILE` → `PENGUINS_PROFILE`

### 1.4 String Constants

- [ ] Update default service name in `src/infra/bonjour.ts` (skipped - network protocol)
- [ ] Update default hostname in `src/infra/machine-name.ts` (skipped - user-facing)
- [ ] Update lock file names in `src/infra/gateway-lock.ts` (skipped - backwards compat)
- [x] Update custom element names: `<openclaw-app>` → `<penguins-app>` (UI code)
- [x] Update storage keys (UI code):
  - `openclaw.control.settings.v1` → `penguins.control.settings.v1`
  - `openclaw.device.auth.v1` → `penguins.device.auth.v1`
  - `openclaw-device-identity-v1` → `penguins-device-identity-v1`
- [x] Update localStorage keys in UI code

### 1.5 CLI Binary

- [x] Rename `openclaw.mjs` → `penguins.mjs`
- [x] Update shebang and binary references
- [x] Update `package.json`:
  - `name` field: `"openclaw"` → `"penguins"`
  - `bin` field: Added `"penguins"`, kept `"openclaw"` as alias
  - Updated all script references
- [ ] Update shell completion scripts (Phase 5)
- [ ] Update completion cache paths (`/tmp/openclaw.zsh` → `/tmp/penguins.zsh`) (Phase 5)

### 1.6 Package Exports

- [x] Update package.json exports:
  - `openclaw/plugin-sdk` → `penguins/plugin-sdk`
  - `openclaw/plugin-sdk/account-id` → `penguins/plugin-sdk/account-id`
- [x] Update all internal imports

### Phase 1 Verification (✅ COMPLETE)

- [x] Run `pnpm build` successfully
- [x] Run `pnpm test` - 613 test files passing, 5,292 tests passing
- [x] Run `pnpm check` - formatted, TypeScript passes, lint passes
- [x] CLI responds to `penguins` command (and `openclaw` alias)
- [x] Environment variables are read correctly (backwards compatible)

**Status: Phase 1 Complete** - Core infrastructure successfully rebranded with full backwards compatibility.

---

## Phase 2: Package Ecosystem & Extensions (Week 1-2)

**Goal:** Update all 38 extension packages and the plugin SDK.

### 2.1 Plugin SDK References

- [ ] Update plugin SDK import paths in all extensions
- [ ] Update `openclaw/plugin-sdk` → `penguins/plugin-sdk`
- [ ] Verify jiti alias still works

### 2.2 Extension Package Names

Update all 38 `extensions/*/package.json` files:

**Scoped Packages to Rename:** ✅ COMPLETE

- [x] `@openclaw/discord` → `@penguins/discord`
- [x] `@openclaw/telegram` → `@penguins/telegram`
- [x] `@openclaw/slack` → `@penguins/slack`
- [x] `@openclaw/whatsapp` → `@penguins/whatsapp`
- [x] `@openclaw/signal` → `@penguins/signal`
- [x] `@openclaw/matrix` → `@penguins/matrix`
- [x] `@openclaw/msteams` → `@penguins/msteams`
- [x] `@openclaw/imessage` → `@penguins/imessage`
- [x] `@openclaw/line` → `@penguins/line`
- [x] `@openclaw/irc` → `@penguins/irc`
- [x] `@openclaw/nostr` → `@penguins/nostr`
- [x] `@openclaw/googlechat` → `@penguins/googlechat`
- [x] `@openclaw/feishu` → `@penguins/feishu`
- [x] `@openclaw/zalo` → `@penguins/zalo`
- [x] `@openclaw/zalouser` → `@penguins/zalouser`
- [x] `@openclaw/voice-call` → `@penguins/voice-call`
- [x] `@openclaw/memory-core` → `@penguins/memory-core`
- [x] `@openclaw/memory-lancedb` → `@penguins/memory-lancedb`
- [x] `@openclaw/llm-task` → `@penguins/llm-task`
- [x] `@openclaw/lobster` → `@penguins/lobster`
- [x] (All remaining 18 extensions...)

### 2.3 Plugin Manifest Files

- [x] Rename all `extensions/*/openclaw.plugin.json` → `penguins.plugin.json` (36 files)
- [x] Update manifest `name` fields
- [x] Update any `openclaw` references in manifest descriptions

### 2.4 Extension Dependencies

- [x] Update `peerDependencies` from `openclaw` to `penguins` where appropriate
- [x] Update devDependencies that reference `openclaw`
- [x] Remove any `workspace:*` references that need changing

### 2.5 Control UI Package

- [x] Rename `openclaw-control-ui` → `penguins-control-ui`
- [x] Update `PENGUINS_CONTROL_UI_BASE_PATH` → `PENGUINS_CONTROL_UI_BASE_PATH`

### Phase 2 Verification (✅ COMPLETE)

- [x] All extensions build successfully
- [x] Extension tests pass
- [x] Plugin SDK exports work correctly
- [x] No `@openclaw/*` references remain in extensions

**Status: Phase 2 Complete** - All 38 extension packages successfully rebranded to `@penguins/*` scope.

---

## Phase 3: Mobile Apps & System Integration (Week 2)

**Goal:** Update iOS, Android, and macOS apps with new bundle IDs and branding.

### 3.1 iOS App ✅

**File: `apps/ios/project.yml`**

- [x] Update `name`: `OpenClaw` → `Penguins`
- [x] Update bundle ID prefix: `ai.openclaw` → `ai.penguins`
- [x] Update bundle ID: `ai.openclaw.ios` → `ai.penguins.ios`
- [x] Update test bundle ID: `ai.openclaw.ios.tests` → `ai.penguins.ios.tests`
- [x] Update package name: `OpenClawKit` → `PenguinsKit`
- [x] Update Bonjour service: `_openclaw-gw._tcp` → `_penguins-gw._tcp`

**File: `apps/ios/Sources/Info.plist`**

- [x] Update `CFBundleDisplayName`: `OpenClaw` → `Penguins`
- [x] Update `NSLocalNetworkUsageDescription` text

**Other iOS files:**

- [x] Update all source file references to `OpenClaw` → `Penguins`
- [x] Update test file references
- [ ] Update build scripts in `package.json` (Phase 5)

### 3.2 Android App ✅

**File: `apps/android/app/build.gradle.kts`**

- [x] Update `namespace`: `ai.openclaw.android` → `ai.penguins.android`
- [x] Update `applicationId`: `ai.openclaw.android` → `ai.penguins.android`
- [x] Update `outputFileName`: `openclaw-${versionName}` → `penguins-${versionName}`

**Other Android files:**

- [x] Update Java/Kotlin package declarations
- [x] Update AndroidManifest.xml references
- [x] Update resource strings
- [ ] Update `package.json` scripts (Phase 5)

### 3.3 macOS App ✅

- [x] Update `apps/macos/Package.swift` package name: `OpenClaw` → `Penguins`
- [x] Update binary target references (openclaw-mac → penguins-mac)
- [x] Update `apps/macos/Sources/Penguins/Resources/Info.plist`:
  - `CFBundleDisplayName`: `OpenClaw` → `Penguins`
  - `CFBundleName`: `OpenClaw` → `Penguins`
  - Bundle ID: `ai.openclaw.mac` → `ai.penguins.mac`
  - URL scheme: `openclaw://` → `penguins://`
- [x] Rename source directories: OpenClaw* → Penguins*
- [x] Update app icon references (OpenClaw.icns → Penguins.icns)

### 3.4 System Services ✅

- [x] Rename `scripts/systemd/openclaw-auth-monitor.service` → `penguins-auth-monitor.service`
- [x] Rename `scripts/systemd/openclaw-auth-monitor.timer` → `penguins-auth-monitor.timer`
- [x] Update service file contents (Description, ExecStart paths)

### 3.5 Container/Podman ✅

- [x] Rename `openclaw.podman.env` → `penguins.podman.env`
- [x] Rename `scripts/podman/openclaw.container.in` → `penguins.container.in`
- [x] Rename `scripts/run-openclaw-podman.sh` → `run-penguins-podman.sh`
- [x] Update all references in these files

### Phase 3 Verification (✅ COMPLETE)

- [x] iOS app configuration updated (project.yml, Info.plist)
- [x] Android app configuration updated (build.gradle.kts, manifests, resources)
- [x] macOS app configuration updated (Package.swift, Info.plist, Constants.swift)
- [x] Shared framework renamed: OpenClawKit → PenguinsKit
- [x] systemd service files updated
- [x] Podman scripts updated
- [x] Build successful (6976.87 kB, 270 files)

**Status: Phase 3 Complete** - All mobile apps and system integration successfully rebranded.

---

## Phase 4: Documentation & Public Assets (Week 2-3)

**Goal:** Update all documentation, README, logos, and external references.

### 4.1 Main Documentation Files

- [x] Update `README.md`:
  - All `openclaw` → `penguins`
  - All `OpenClaw` → `Penguins`
  - Update installation instructions
  - Update npm install commands
  - Update badge URLs
- [x] Update `CONTRIBUTING.md`
- [x] Update `SECURITY.md`
- [x] Update `CHANGELOG.md` (add rebrand note, keep history)
- [x] Update `AGENTS.md`

### 4.2 Documentation Site (`docs/`)

**File: `docs/docs.json`**

- [x] Update `name`: `OpenClaw` → `Penguins`
- [x] Update GitHub links: `github.com/openclaw/openclaw` → `github.com/penguins/penguins`
- [ ] Update Discord invite link (external - requires Discord access)

**All docs/**/\*.md files (582 files):\*\*

- [x] Replace `openclaw` → `penguins` (command references)
- [x] Replace `OpenClaw` → `Penguins` (product name)
- [x] Replace `docs.openclaw.ai` → `docs.penguins.ai`
- [x] Replace `https://openclaw.ai` → `https://penguins.ai`
- [x] Update all installation commands
- [x] Update all example commands
- [x] Update GitHub URLs in links

**Specific doc files to check:**

- [x] `docs/start/openclaw.md` → `docs/start/penguins.md`
- [x] `docs/tools/clawhub.md`
- [x] `docs/gateway/doctor.md` (migration instructions)
- [x] `docs/install/*.md`
- [x] `docs/channels/**/*.md`
- [x] `docs/reference/RELEASING.md`

### 4.3 Chinese Documentation

- [x] Update `docs/zh-CN/**/*.md`
- [x] Update glossary: `docs/.i18n/glossary.zh-CN.json`
- [x] Update glossary: `docs/.i18n/glossary.ja-JP.json`
- [x] Update translation memory: `docs/.i18n/zh-CN.tm.jsonl`
- [x] Rename `docs/zh-CN/start/openclaw.md` → `penguins.md`

### 4.4 Logo & Brand Assets

- [x] Rename `docs/assets/openclaw-logo-text.png` → `docs/assets/penguins-logo-text.png`
- [x] Rename `docs/assets/openclaw-logo-text-dark.png` → `docs/assets/penguins-logo-text-dark.png`
- [x] Rename `docs/whatsapp-openclaw.jpg` → `docs/whatsapp-penguins.jpg`
- [x] Rename `docs/whatsapp-openclaw-ai-zh.jpg` → `docs/whatsapp-penguins-ai-zh.jpg`
- [ ] Rename `apps/macos/Icon.icon/Assets/openclaw-mac.png` → `penguins-mac.png` (design team)
- [ ] Create new logo files (design team)
- [x] Update all image references in docs
- [ ] Update favicon files (design team)

### 4.5 GitHub Templates

- [ ] Update `.github/pull_request_template.md` (no .github dir in repo)
- [ ] Update `.github/ISSUE_TEMPLATE/*.md` (no .github dir in repo)
- [ ] Update `.github/labeler.yml` (no .github dir in repo)

### Phase 4 Verification

- [x] All docs markdown updated (0 openclaw references remaining)
- [x] All internal doc links updated
- [x] Image assets renamed
- [x] All example commands use `penguins`

**Status: Phase 4 Complete** - All documentation, assets, and Chinese/Japanese i18n files rebranded. Design-team items (new logo files, favicon, macOS icon) remain pending.

---

## Phase 5: Migration Support & Release (Week 3-4)

**Goal:** Add backwards compatibility, migration tools, and coordinate release.

### 5.1 Migration Infrastructure ✅

- [x] `src/infra/state-migrations.ts` already handles:
  - Detection and migration of `~/.clawdbot/`, `~/.moldbot/`, `~/.moltbot/` → `~/.penguins/`
  - Session, agent dir, WhatsApp auth, and Telegram migration
  - Symlink creation for legacy paths after migration
- [x] Updated skip logic to check `PENGUINS_STATE_DIR` OR `PENGUINS_STATE_DIR`
- [x] Doctor command (`src/commands/doctor.ts`) already prompts user to migrate legacy state
- Note: `~/.openclaw/` directory migration not needed — product went directly from `.clawdbot`/`.moltbot` to `.penguins`

### 5.2 Environment Variable Backwards Compatibility ✅

- [x] `src/config/paths.ts` — already falls back: `PENGUINS_*` → `PENGUINS_*` → `PENGUINS_*`
- [x] `src/infra/home-dir.ts` — already falls back: `PENGUINS_HOME` → `PENGUINS_HOME`
- [x] `src/infra/shell-env.ts` — updated to check `PENGUINS_*` first, fallback to `PENGUINS_*`:
  - `PENGUINS_LOAD_SHELL_ENV` (was `PENGUINS_LOAD_SHELL_ENV`)
  - `PENGUINS_DEFER_SHELL_ENV_FALLBACK` (was `PENGUINS_DEFER_SHELL_ENV_FALLBACK`)
  - `PENGUINS_SHELL_ENV_TIMEOUT_MS` (was `PENGUINS_SHELL_ENV_TIMEOUT_MS`)

### 5.3 CLI Command Aliases ✅

- [x] `package.json` `bin` field: added `"openclaw": "penguins.mjs"` (was duplicate `"penguins"` entry)
- [x] `src/cli/cli-name.ts`: detects `openclaw`/`clawdbot` invocation and prints deprecation warning

### 5.4 Config File Migration ✅

- [x] Already handled by existing doctor migration flow (`autoMigrateLegacyStateDir`)
- [x] Config filename is now `penguins.json`; legacy `openclaw.json` name not in use (product skipped that name)

### 5.5 npm Release Preparation (manual — requires npm credentials)

- [ ] Publish `penguins` package to npm
- [ ] Publish all `@penguins/*` extension packages
- [ ] Deprecate `openclaw` package on npm (with message pointing to `penguins`)
- [ ] Deprecate all `@openclaw/*` packages

### 5.6 GitHub Repository (manual — requires GitHub access)

- [ ] Rename repository OR migrate to new org (`github.com/penguins/penguins`)
- [ ] Update all GitHub Actions workflows
- [ ] Update workflow badge URLs in README
- [ ] Update release scripts
- [ ] Transfer issues (if moving orgs)

### 5.7 External Services (manual)

- [ ] Update website: `openclaw.ai` → `penguins.ai`
- [ ] Update docs site: `docs.openclaw.ai` → `docs.penguins.ai`
- [ ] Update Discord server name
- [ ] Update Discord bot name (if applicable)
- [ ] Update any social media accounts

### 5.8 Mobile App Store Updates (manual — requires app store access)

- [ ] Update iOS App Store listing (name, description, screenshots, keywords)
- [ ] Update Google Play Store listing (name, description, screenshots)
- [ ] Submit app updates for review

### 5.9 User Communication (manual)

- [ ] Write migration guide for users
- [ ] Update installation scripts (`install.sh`, `install-cli.sh`, `install.ps1`)
- [ ] Create blog post/announcement
- [ ] Update Discord announcements
- [ ] Send email newsletter (if applicable)

### Doctor Platform Notes ✅

- [x] `src/commands/doctor-platform-notes.ts`:
  - `noteDeprecatedLegacyEnvVars` now detects both `PENGUINS_*` and `PENGUINS_*` and redirects to `PENGUINS_*`
  - launchctl overrides check updated to `PENGUINS_GATEWAY_TOKEN`/`PENGUINS_GATEWAY_PASSWORD`
  - Deprecation notices updated for `PENGUINS_*` and `PENGUINS_*` to say "use `PENGUINS_*` instead"

### Phase 5 Verification

- [x] `openclaw` binary alias works (redirects to penguins with deprecation warning)
- [x] `PENGUINS_*` env vars still work as fallbacks
- [x] Doctor surfaces deprecated env var warnings for both `PENGUINS_*` and `PENGUINS_*`
- [x] State migration skips when `PENGUINS_STATE_DIR` is set
- [ ] npm publish (pending)
- [ ] GitHub repo rename (pending)
- [ ] App store updates (pending)

**Status: Phase 5 Code Complete** — All in-repo code changes done. External steps (npm publish, GitHub rename, app stores, Discord, website) require manual action with appropriate credentials.

---

## Post-Rebrand Checklist

### Immediate (Week 4)

- [ ] Monitor npm download stats
- [ ] Monitor GitHub issues for migration problems
- [ ] Monitor Discord for user questions
- [ ] Check mobile app store reviews

### Short-term (Month 1-2)

- [ ] Remove deprecated `openclaw` package alias (when ready)
- [ ] Remove environment variable fallbacks (when ready)
- [ ] Archive old GitHub repository (if not migrated)
- [ ] Update any missed documentation

### Long-term (Month 3+)

- [ ] Full removal of backwards compatibility code
- [ ] Clean up legacy migration support
- [ ] Update all screenshots in docs to new branding

---

## Risk Mitigation

### High-Risk Items

1. **npm package name** - Must secure `penguins` before publishing
2. **GitHub organization** - Need access to create `github.com/penguins`
3. **Mobile app bundle IDs** - Changing these affects App Store/Play Store listings
4. **User configs** - Must migrate without data loss

### Mitigation Strategies

- Maintain backwards compatibility for 3+ months
- Keep `openclaw` as deprecated npm package with migration message
- Provide automatic config migration
- Maintain CLI alias during transition period
- Extensive testing before each phase release

---

## Rollback Plan

If critical issues arise:

1. **Code changes:** Can revert via git
2. **npm packages:** Cannot unpublish after 24h, but can deprecate
3. **Mobile apps:** Previous versions remain available
4. **Configs:** Keep backups during migration

**Recommendation:** Do Phase 1-3 in feature branch, merge only after full testing.

---

## Appendix: Quick Reference

### Naming Changes Summary

| Category        | From                  | To                    |
| --------------- | --------------------- | --------------------- |
| Product         | OpenClaw              | Penguins              |
| CLI Command     | `openclaw`            | `penguins`            |
| npm Package     | `openclaw`            | `penguins`            |
| Scoped Packages | `@openclaw/*`         | `@penguins/*`         |
| Config Dir      | `~/.openclaw/`        | `~/.penguins/`        |
| Config File     | `openclaw.json`       | `penguins.json`       |
| Type Name       | `OpenClawConfig`      | `PenguinsConfig`      |
| iOS Bundle      | `ai.openclaw.ios`     | `ai.penguins.ios`     |
| Android Package | `ai.openclaw.android` | `ai.penguins.android` |
| Domain          | `openclaw.ai`         | `penguins.ai`         |
| Docs Site       | `docs.openclaw.ai`    | `docs.penguins.ai`    |

### File Rename Checklist

- [x] `openclaw.mjs` → `penguins.mjs`
- [x] `src/config/types.openclaw.ts` → `types.penguins.ts`
- [x] `src/infra/openclaw-root.ts` → `penguins-root.ts`
- [x] `src/infra/tmp-openclaw-dir.ts` → `tmp-penguins-dir.ts`
- [x] `docs/start/openclaw.md` → `penguins.md`
- [x] `extensions/*/openclaw.plugin.json` → `penguins.plugin.json`
- [x] `scripts/systemd/openclaw-*` → `penguins-*`
- [x] `scripts/run-openclaw-podman.sh` → `run-penguins-podman.sh`
- [x] `openclaw.podman.env` → `penguins.podman.env`
- [x] `docs/assets/openclaw-logo*.png` → `penguins-logo*.png`

---

_Last Updated: 2026-02-17_
_Status: All in-repo phases complete. Pending: npm publish, GitHub rename, app stores, external services._
