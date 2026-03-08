# Penguins Handoff

Date: 2026-03-08

This file is the resume point for a fresh chat.
Read this first, then inspect the current worktree.

Truth order for the next chat:

1. `handoff.md`
2. current git worktree
3. `TASKS2.md`
4. older review/planning docs only as historical context

## Locked product decisions

These were explicitly decided during the current cleanup:

- Penguins is now **web + CLI only**.
- Native apps are out.
- Public remote access path is **Cloudflare Tunnel + Access**.
- No public API exposure is desired.
- No machine-to-machine access is needed.
- Each user is expected to set up their own Cloudflare tunnel and subdomain.
- `openclaw` / `clawdock` are not supposed to remain as active user-facing product names.
- Old integrations are not the long-term direction.
- If an old integration still exists in code, treat it as legacy debt to remove, not as a supported product surface.

## What was completed before this handoff

### Security + deployment hardening

This landed earlier in the current worktree:

- Privileged HTTP endpoints now require shared-secret auth even when Tailscale identity auth exists:
  - `POST /tools/invoke`
  - `POST /v1/chat/completions`
  - `POST /v1/responses`
- Added `gateway.auth.tailscaleAllowUsers`.
- Tailscale Serve startup now requires either:
  - password auth, or
  - an explicit Tailscale allowlist.
- Plugin HTTP registration was moved toward secure-by-default:
  - routes/handlers carry explicit auth metadata
  - default is gateway auth
  - public webhooks must opt in
- Plugin HTTP routes are blocked under reserved prefixes:
  - `/tools`
  - `/v1`
- Cloudflare Tunnel was added as a first-class deployment path.

Main files in that area:

- `src/gateway/auth.ts`
- `src/gateway/http-auth-helpers.ts`
- `src/gateway/server-http.ts`
- `src/gateway/server-runtime-config.ts`
- `src/gateway/tools-invoke-http.ts`
- `src/gateway/server/plugins-http.ts`
- `src/commands/configure.gateway.ts`
- `docs/gateway/cloudflare-tunnel.md`
- `docs/gateway/tailscale.md`
- `docs/gateway/remote.md`

### Rebrand and repo cleanup already landed

- `README.md` was rewritten as a real getting-started doc.
- Cloudflare deployment docs were added.
- `apps/` was removed.
- empty legacy `packages/` workspace residue was removed
- `pnpm-workspace.yaml` was reconciled
- user-facing `openclaw` / `clawdock` shims were removed from primary surfaces
- stale planning files were marked historical

### Legacy channel / extension cleanup already landed

This is the biggest repo-shape change in the current worktree:

- Deleted the entire `docs/channels/` tree.
- Deleted legacy CLI docs:
  - `docs/cli/channels.md`
  - `docs/cli/devices.md`
  - `docs/cli/node.md`
  - `docs/cli/nodes.md`
  - `docs/cli/pairing.md`
- Deleted `docs/gateway/pairing.md`.
- Removed top-level CLI registration for:
  - `channels`
  - `pairing`
  - `node`
  - `nodes`
  - `devices`
- Deleted legacy CLI wrapper files:
  - `src/cli/channels-cli.ts`
  - `src/cli/channel-auth.ts`
  - `src/cli/devices-cli.ts`
  - `src/cli/node-cli.ts`
  - `src/cli/nodes-cli.ts`
  - `src/cli/pairing-cli.ts`
  - related register files
- Deleted legacy extension packages:
  - `extensions/bluebubbles`
  - `extensions/discord`
  - `extensions/googlechat`
  - `extensions/imessage`
  - `extensions/matrix`
  - `extensions/msteams`
  - `extensions/slack`
  - `extensions/telegram`
  - `extensions/whatsapp`
- Deleted many old tests that only existed for those removed surfaces.

### Control UI cleanup that landed in the latest pass

This was the most recent completed work:

- Removed the visible `Channels` tab from the Control UI.
- Removed the agent-level `Channels` panel.
- Deleted dead channel-management UI files.
- Kept the internal `channels.status` snapshot fetch only where other surfaces still depend on it.
- Changed docs/help copy so users are no longer told to use removed `channels` commands.

Main files changed in this latest pass:

- `ui/src/ui/navigation.ts`
- `ui/src/ui/app-render.ts`
- `ui/src/ui/app-settings.ts`
- `ui/src/ui/app.ts`
- `ui/src/ui/app-view-state.ts`
- `ui/src/ui/views/agents.ts`
- `ui/src/ui/views/overview.ts`
- `ui/src/ui/views/config.ts`
- `ui/src/ui/views/config-form.render.ts`
- `ui/src/ui/controllers/channels.ts`
- `ui/src/ui/controllers/channels.types.ts`
- `ui/src/ui/views/agents-panels-status-files.ts`
- deleted:
  - `ui/src/ui/app-channels.ts`
  - `ui/src/ui/views/channels.ts`
  - all `ui/src/ui/views/channels.*.ts`

Docs / CLI copy changed in this pass:

- `src/commands/agents.commands.list.ts`
- `docs/gateway/index.md`
- `docs/gateway/troubleshooting.md`
- `docs/help/troubleshooting.md`
- `docs/automation/troubleshooting.md`
- `docs/help/faq.md`
- `docs/logging.md`
- `docs/plugins/zalouser.md`

## Current worktree state

The worktree is intentionally dirty.
Do not reset it and do not restore deleted legacy files unless the user explicitly asks.

Important current-state facts:

- Many legacy docs are deleted on purpose.
- Many legacy extension packages are deleted on purpose.
- Many UI channel-management files are deleted on purpose.
- There are also unrelated modified files already present in the repo.
- `docs/gateway/cloudflare-tunnel.md` exists as a new file and is intentional.

### Important unresolved worktree issue

`pnpm-lock.yaml` is stale relative to the deleted extension workspaces.

Evidence:

- `pnpm-lock.yaml` still contains importer entries for:
  - `extensions/bluebubbles`
  - `extensions/discord`
  - `extensions/googlechat`
  - `extensions/imessage`
  - `extensions/matrix`
  - `extensions/msteams`
  - `extensions/slack`
  - `extensions/telegram`
  - `extensions/whatsapp`

Why it is stale:

- an earlier `pnpm install --lockfile-only --ignore-scripts` attempt failed because registry access was blocked in this environment
- the reported failure was a registry DNS/network failure

This means the next chat should refresh `pnpm-lock.yaml` once network access is available.

## Verification already run

These checks passed in the current worktree:

```bash
git diff --check
pnpm format:docs:check
pnpm docs:check-links
pnpm exec oxfmt --check <targeted files>
```

Docs link audit result at last run:

- `checked_internal_links=1211`
- `broken_links=0`

UI verification that passed:

```bash
pnpm --dir ui test -- src/ui/navigation.test.ts src/ui/navigation.browser.test.ts src/ui/focus-mode.browser.test.ts
```

Result at last run:

- 26 UI test files passed
- 242 UI tests passed

Important note:

- running the `ui/` browser tests inside the sandbox initially failed with a local listen `EPERM`
- rerunning with escalation worked
- if that happens again, it is an environment restriction, not necessarily an app failure

Earlier targeted tests from the previous cleanup pass also passed:

```bash
pnpm exec vitest run --config vitest.e2e.config.ts \
  src/cli/program/register.subclis.e2e.test.ts \
  src/cli/program.smoke.e2e.test.ts \
  src/commands/agent.e2e.test.ts \
  src/commands/configure.wizard.e2e.test.ts

pnpm exec vitest run \
  src/wizard/onboarding.test.ts \
  src/plugins/source-display.test.ts
```

## What is still not done

The biggest remaining work is **backend removal of legacy messaging/runtime surfaces**.

### 1. Remove the backend `channels.*` RPC surface

This is the next most logical hard cleanup step.

Still active:

- `src/gateway/server-methods/channels.ts`
- `src/gateway/server-methods.ts`
- `src/gateway/server-methods-list.ts`
- `src/gateway/protocol/schema/channels.ts`
- tests around `channels.status` / `channels.logout`

Still referencing `channels.status` directly:

- `src/commands/doctor-gateway-health.ts`
- `src/commands/status.scan.ts`
- `src/commands/status-all.ts`
- `src/gateway/server.health.e2e.test.ts`
- `src/gateway/server.channels.e2e.test.ts`
- `src/commands/channels/status.ts`

If this is removed, the next chat must decide what replaces those health/status paths.

### 2. Remove the legacy runtime modules themselves

Still present:

- `src/channels`
- `src/telegram`
- `src/discord`
- `src/slack`
- `src/signal`
- `src/imessage`
- `src/pairing`

This is the true remaining legacy backend footprint.

### 3. Decide the new delivery model

This is the most important product question hidden inside the cleanup.

Right now the codebase still assumes replies can be delivered to third-party messaging channels.
If Penguins is really web chat + CLI only, these areas need to be rewritten or removed:

- `src/cli/deps.ts`
- `docs/cli/message.md`
- `docs/gateway/heartbeat.md`
- `src/infra/outbound/*`
- `src/commands/message-format.ts`
- `src/commands/agent-via-gateway.ts`

The next chat should not start deleting randomly until this is answered:

- Are replies only supposed to go to:
  - web chat sessions
  - control UI
  - CLI users
  - node/device surfaces
  - or some new Penguins-native integration?

### 4. Do the large remaining docs purge

The docs are much cleaner than before, but there is still a lot of historical messaging content.

Most obvious remaining docs to rewrite or reduce:

- `docs/help/faq.md`
- `docs/gateway/configuration.md`
- `docs/gateway/security/index.md`
- `docs/gateway/health.md`
- `docs/gateway/network-model.md`
- `docs/gateway/configuration-examples.md`
- `docs/cli/message.md`
- `docs/gateway/heartbeat.md`

These still contain many references to:

- WhatsApp
- Telegram
- Discord
- Slack
- Signal
- iMessage
- BlueBubbles
- `/channels/*` docs links

### 5. Clean remaining old helper scripts / install docs

Still visibly old-integration-oriented:

- `scripts/shell-helpers/README.md`
- `scripts/shell-helpers/penguins-docker-helpers.sh`

They still talk about WhatsApp setup and similar legacy flows.

### 6. Reconcile `TASKS2.md`

`TASKS2.md` is helpful, but it is now partially stale again.

Examples:

- it still says `pnpm-workspace.yaml` includes `packages/*`, which has already been fixed
- it does not yet reflect the latest Control UI channel-surface removal
- it does not yet reflect the latest docs/help cleanup

The next chat should update `TASKS2.md` after the next real deletion pass, not before.

### 7. Re-evaluate remaining extensions one by one

Open extension cleanup items still listed in `TASKS2.md`:

- `extensions/copilot-proxy`
- `extensions/feishu`
- `extensions/irc`
- `extensions/line`
- `extensions/lobster`
- `extensions/mattermost`
- `extensions/nextcloud-talk`
- `extensions/nostr`
- `extensions/signal`
- `extensions/tlon`
- `extensions/twitch`
- `extensions/voice-call`
- `extensions/zalo`
- `extensions/zalouser`

If the rule is "only our new integrations", most of these probably need deletion, not just doc cleanup.

### 8. Optional but important: decide whether nodes/devices stay

These are still first-class:

- `src/gateway/server-methods/nodes.ts`
- `src/gateway/server-methods/devices.ts`
- `ui/src/ui/views/nodes.ts`
- `src/infra/node-pairing.ts`
- `src/infra/device-pairing.ts`

If the product is:

- private Cloudflare-hosted web chat
- CLI
- personal use

then nodes/devices may still make sense.
But they are now one of the largest remaining product-surface areas after channels.

## Recommended next work order

This is the best next sequence from here:

1. Remove backend `channels.status` / `channels.logout` and related CLI/status usage.
2. Decide and implement the replacement delivery model for `message` / heartbeat / session delivery.
3. Delete or rewrite the large remaining channel-heavy docs.
4. Remove old helper script messaging setup flows.
5. Reconcile `TASKS2.md`.
6. Refresh `pnpm-lock.yaml` when network access is available.
7. Then evaluate remaining extensions and optional node/device scope.

## Suggested starting files for the next chat

If the next chat starts the backend removal:

- `src/gateway/server-methods/channels.ts`
- `src/gateway/server-methods.ts`
- `src/gateway/server-methods-list.ts`
- `src/gateway/protocol/schema/channels.ts`
- `src/commands/status-all.ts`
- `src/commands/status.scan.ts`
- `src/commands/doctor-gateway-health.ts`
- `src/commands/channels/status.ts`

If the next chat starts the docs purge:

- `docs/help/faq.md`
- `docs/gateway/configuration.md`
- `docs/gateway/security/index.md`
- `docs/gateway/health.md`
- `docs/gateway/network-model.md`
- `docs/cli/message.md`
- `docs/gateway/heartbeat.md`

## Constraints / gotchas

- Do not revert unrelated changes.
- Do not restore deleted legacy docs/extensions/UI files unless explicitly asked.
- Do not switch branches unless explicitly asked.
- The current UI no longer exposes channel management; keep that direction.
- The backend still contains legacy channel runtime, so deleting docs/UI was only the first half.
- `channelsSnapshot` is still being fetched for remaining internal UI consumers like cron metadata.
- If removing the backend channel subsystem, watch for cron/status/help flows that still expect channel labels/order.
- `TASKS2.md` is useful, but this handoff is more current.

## Suggested first prompt for a fresh chat

Use something like:

> Read `handoff.md` and continue the Penguins cleanup from the current worktree. Keep the new web/CLI-only and Cloudflare-first product direction. Start with removing the backend `channels.*` RPC/status surface, then identify what must replace legacy message delivery assumptions before deleting more runtime code.
