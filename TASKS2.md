# Penguins Cleanup and Hardening Plan

Status: reconciled on 2026-03-06

This file replaces the earlier optimistic version of `tasks2.md`.
It is now a source-of-truth checklist, not a retrospective claim list.

## Current reality

Verified during review:

- Gateway, CLI, WebChat, plugins, and remote-exposure code are active and in use.
- Tailscale is still a real runtime path in code and docs.
- `apps/` has been removed; remaining cleanup is stale references and host-platform docs.
- `pnpm-workspace.yaml` still includes `packages/*`.
- Several extensions previously marked "removed" are still present in `extensions/`.
- The repo still contains legacy/rebrand leftovers (`moltbot`, migration-era markers, old docs/scripts).

This means cleanup is not finished. Security hardening must happen before broad deletion work.

## Work order

1. Security first
2. Repo truth and docs
3. Surface reduction
4. Optional product-direction cleanup

## Completed in this pass

- [x] Require shared-secret auth for privileged HTTP endpoints even when Tailscale identity auth exists.
- [x] Add `gateway.auth.tailscaleAllowUsers` and reject Tailscale Serve startup without password auth or an explicit allowlist.
- [x] Make plugin HTTP registrations carry explicit auth metadata; default routes/handlers to gateway auth and mark public webhooks explicitly.
- [x] Block plugin HTTP route registration under reserved core prefixes (`/tools`, `/v1`).
- [x] Fix `README.md` remote-access port, Docker port, config filename, and repo clone URL.
- [x] Fix the broken gateway auth regression test and add coverage for Tailscale allowlists / HTTP secret-only auth.
- [x] Remove the tracked Android build report artifact and ignore `apps/android/build/`.
- [x] Remove active `openclaw` / `clawdock` user-facing shims from the CLI and Docker helper surface.

## Phase 1: Immediate containment

Goal: make the running gateway safer before any large cleanup churn.

- [x] Lock down `/tools/invoke`, `/v1/chat/completions`, and `/v1/responses` so Tailscale identity alone is not enough.
- [x] Add a Tailscale Serve startup guard requiring password auth or `gateway.auth.tailscaleAllowUsers`.
- [x] Move plugin HTTP toward secure-by-default registration.
- [ ] Review other HTTP-exposed surfaces for the same "network identity vs app auth" confusion.
- [x] Update docs beyond `README.md`:
  - `docs/install/docker.md`
  - `docs/gateway/remote.md`
  - `docs/gateway/tailscale.md`
  - onboarding / configure docs

## Phase 2: Repo truth and documentation cleanup

Goal: make the repository describe the product that actually exists.

- [ ] Remove or rewrite stale product claims in docs and task files.
- [x] Archive or clearly label stale planning/audit files that no longer match repo truth:
  - `tasks.md`
  - `MINIMAX_REVIEW.md`
- [x] Decide whether the project is Tailscale-first, Cloudflare-first, or reverse-proxy-first.
  - Public browser access: Cloudflare Tunnel + Access is now the primary documented path.
  - Private/operator access: Tailscale and SSH remain supported.
- [ ] Delete or archive stale operational docs/scripts that reference:
  - `clawdock`
  - `moltbot`
  - `lalopenguin`
  - old launchd labels and old tunnel flows
- [x] Audit remaining `README.md` sections for rebrand leftovers and compatibility-only guidance.
- [x] Label compatibility shims clearly if kept (`openclaw`, `clawdbot`, `moltbot` references).
- [x] Fix the remaining obvious docs/ops leftovers that still surfaced during this pass:
  - `docs/install/railway.mdx` no longer points at `clawdbot-railway-template`
  - `scripts/shell-helpers/*` now use `penguins-docker-*` only

## Phase 3: Surface reduction

Goal: reduce unsupported or low-value code so the hardening burden shrinks.

### Native-app residue

- [x] Decide whether `apps/ios`, `apps/android`, `apps/macos`, `apps/shared`, and `Swabble/` are in or out.
- [x] Remove them cleanly from the repo and workspace instructions.
- [ ] If any stay, remove build caches and document ownership.

### Workspace/package cleanup

- [x] Reconcile `pnpm-workspace.yaml` with the real package list.
- [x] Remove the empty legacy-only `packages/` workspace residue and its glob entry.
- [x] Remove empty or legacy-only workspace shells under `packages/` if they are no longer published/used.
- [ ] Sweep tracked build artifacts and generated residue.

### Extension cleanup

Extensions still present that were previously listed for removal should be re-evaluated one by one:

- [ ] `extensions/copilot-proxy`
- [ ] `extensions/feishu`
- [ ] `extensions/irc`
- [ ] `extensions/line`
- [ ] `extensions/lobster`
- [ ] `extensions/mattermost`
- [ ] `extensions/nextcloud-talk`
- [ ] `extensions/nostr`
- [ ] `extensions/signal`
- [ ] `extensions/tlon`
- [ ] `extensions/twitch`
- [ ] `extensions/voice-call`
- [ ] `extensions/zalo`
- [ ] `extensions/zalouser`

For each one:

- [ ] confirm whether it is still supported
- [ ] confirm whether docs still reference it
- [ ] either harden and keep, or delete and remove from docs/tests/config help

## Phase 4: Optional direction changes

These are not cleanup items. They are product decisions.

- [x] If Cloudflare Tunnel is the target direction, implement it as a first-class deployment path.
- [ ] If Tailscale remains supported, document it as supported and secure it accordingly.
- [ ] If WebChat is the primary surface, remove or de-emphasize flows that assume third-party messaging is the main UX.

## Notes

- `REVIEW3-6-26.md` is the security audit that explains why the work order changed.
- Do not mark large deletions as complete until the repo tree, docs, and workspace config all agree.
