# Penguins Security and Architecture Review

Date: 2026-03-06

## Scope and method

This review started from `README.md`, `tasks.md`, and `tasks2.md`, then traced the security-critical runtime paths in the gateway, browser control, plugin HTTP, remote exposure, media/file handling, and plugin install flows.

Reviewed in detail:

- `README.md`
- `tasks.md`
- `tasks2.md`
- `src/gateway/*` auth, HTTP, WS, remote exposure, hooks, runtime config
- `src/browser/*` control auth and middleware
- `src/plugins/*` HTTP route registration and install/update paths
- `src/media/*` and `src/infra/*` SSRF / filesystem guards
- selected built-in webhook handlers in `extensions/googlechat` and `extensions/bluebubbles`

Verification performed:

- targeted tests: `pnpm test -- --run src/gateway/auth.test.ts src/gateway/server.plugin-http-auth.test.ts`
- result: `src/gateway/server.plugin-http-auth.test.ts` passed; `src/gateway/auth.test.ts` failed due to an unrelated broken regression test fixture in `src/gateway/auth.test.ts:37-50`

Not performed:

- full end-to-end penetration testing
- full dependency CVE sweep
- live remote deployment validation behind Tailscale / Cloudflare

## Executive summary

The highest-risk issue is the gateway's Tailscale Serve trust model. In current code, verified Tailscale identity is accepted as sufficient auth for the HTTP API path before shared-secret checks, and that includes `POST /tools/invoke`. In practice, that means a shared tailnet can become a shared admin surface. Because the HTTP-specific deny list does not block `exec` or `process`, the likely impact is host command execution or equivalent privileged tool access for any reachable tailnet principal, depending on configured tool policy.

The second major issue is architectural: plugin HTTP routes are public-by-default unless they happen to live under `/api/channels/*`. The framework leaves auth entirely to plugin authors, allows arbitrary path registration, and dispatches plugin routes before some core endpoints. Current built-in webhook handlers I spot-checked do authenticate themselves, but the platform contract is unsafe.

Separately, the repository and docs do not match the product story in `tasks2.md`. The README's remote-access guidance is wrong on ports and underspecified on auth. The cleanup plan says large surfaces were removed, but the current workspace still contains many of them, including old extensions, Tailscale code, stale helper scripts, and native-app residue. That is not just cosmetic drift; it keeps the attack surface and operator confusion much larger than advertised.

## Findings

### 1. Critical: Tailscale Serve users are treated as authenticated gateway API clients

Severity: Critical

Why this matters:

- `src/gateway/auth.ts:201-203` auto-enables `allowTailscale` when `tailscaleMode === "serve"` unless password or trusted-proxy auth is in use.
- `src/gateway/auth.ts:336-348` returns success on verified Tailscale identity before token/password checks.
- `src/gateway/tools-invoke-http.ts:147-159` uses that auth path for `POST /tools/invoke`.
- `src/gateway/http-endpoint-helpers.ts:28-35`, `src/gateway/openai-http.ts:149-155`, and `src/gateway/openresponses-http.ts:356-362` use the same bearer-auth helper for the OpenAI/OpenResponses HTTP endpoints.
- `src/gateway/server-runtime-config.ts:91-98` forces password auth only for Tailscale Funnel, not for Tailscale Serve.

Impact:

- Any reachable tailnet user can satisfy gateway HTTP auth without presenting the gateway token/password.
- This bypass is broader than the browser control UI path, which still relies on device identity and pairing.
- The exposed surface includes `POST /tools/invoke`, and may include `/v1/chat/completions` and `/v1/responses` when those endpoints are enabled.

Why the impact is potentially host-level:

- `src/security/dangerous-tools.ts:9-18` only denies `sessions_spawn`, `sessions_send`, `gateway`, and `whatsapp_login` over gateway HTTP by default.
- `src/agents/bash-tools.exec.ts:148-153` defines an `exec` tool for shell command execution.
- `src/agents/pi-tools.create-penguins-coding-tools.adds-claude-style-aliases-schemas-without-dropping-b.e2e.test.ts:54-58` asserts that `exec` and `process` are included by default in the coding tool set.

Inference:

- Unless the operator has explicitly denied `exec` and similar tools through policy, an authenticated HTTP caller can likely reach shell-capable tooling through `/tools/invoke`.

What to change:

- Stop treating Tailscale network identity as equivalent to application auth for privileged HTTP endpoints.
- Require a shared secret for `/tools/invoke`, `/v1/chat/completions`, and `/v1/responses` even when Tailscale Serve is enabled.
- If Tailscale identity support remains, add an explicit allowlist such as `gateway.auth.tailscaleAllowUsers`, and fail closed when unset.
- Add regression tests covering shared-tailnet scenarios and privileged endpoint denial.

### 2. High: Plugin HTTP routes are public-by-default and can occupy arbitrary paths

Severity: High

Why this matters:

- `src/gateway/server-http.ts:501-519` only applies gateway auth automatically to plugin routes under `/api/channels/*`.
- The inline comment at `src/gateway/server-http.ts:502-504` explicitly states that non-channel plugin routes are plugin-owned and must enforce their own auth.
- `src/gateway/server.plugin-http-auth.test.ts:99-168` codifies this behavior: `/plugin/public` returns `200` without auth.
- `src/plugins/registry.ts:300-330` and `src/plugins/http-path.ts:1-14` allow plugins to register arbitrary unique paths with no reserved namespace enforcement.
- `src/gateway/server/plugins-http.ts:24-40` dispatches registered plugin routes directly; in `src/gateway/server-http.ts:501-534`, plugin handling runs before OpenResponses/OpenAI endpoint handling.

Impact:

- A plugin author can accidentally or intentionally expose an unauthenticated route on the main gateway listener.
- There is no platform-level guardrail preventing public routes on sensitive namespaces such as `/v1/*`, `/tools/*`, or other future core paths.
- This is a supply-chain and extension-boundary weakness even if the currently shipped handlers are mostly careful.

Balance:

- The current built-in webhook handlers I spot-checked do perform their own auth:
  - `extensions/googlechat/src/monitor.ts:225-245` verifies Google Chat requests before processing.
  - `extensions/bluebubbles/src/monitor.ts:477-507` requires a shared secret unless the request is direct loopback.
- That reduces immediate exposure from those specific handlers, but it does not fix the unsafe framework default.

What to change:

- Default all plugin HTTP routes to gateway-auth protected.
- Introduce an explicit `public: true` or `auth: "public"` opt-in for the rare cases that need anonymous ingress.
- Reserve core namespaces and reject plugin registrations under `/v1`, `/tools`, `/api`, control UI paths, hook base paths, and other first-party routes.
- Add plugin diagnostics that fail plugin load when a route is public without an explicit annotation.

### 3. Medium: Remote-access documentation is wrong on ports and unclear on auth boundaries

Severity: Medium

Why this matters:

- `README.md:68-78` recommends `cloudflared tunnel --url http://localhost:4000`.
- `README.md:117-122` recommends `docker run -p 4000:4000 ...`.
- The real default gateway port is `18789` in `src/config/paths.ts:234`.
- The checked-in compose file exposes `18789`, not `4000`, in `docker-compose.yml:14-28`.
- `README.md:128-142` also contradicts itself on config location, saying `~/.penguins/config.json` while the default filename in code is `penguins.json` (`src/config/paths.ts:23`).

Impact:

- Operators following the README will misconfigure tunnels and Docker exposure.
- The current docs do not clearly explain that transport exposure and application auth are separate concerns.
- Given the Tailscale auth behavior above, poor documentation here is a real security multiplier, not just a typo.

What to change:

- Rewrite the remote-access section around actual supported topologies:
  - loopback + reverse proxy / tunnel
  - trusted proxy auth
  - Tailscale Serve, with explicit warning about auth semantics
- Fix the default port, Docker examples, and config filename everywhere.
- Add a short "minimum secure deployment" section with one recommended pattern and one alternate pattern.

### 4. Medium: Cleanup claims in `tasks2.md` do not match the current repository/workspace state

Severity: Medium

Why this matters:

- `tasks2.md:141-183` says native apps, packages, and many extensions were removed.
- `tasks2.md:205-217` says docs cleanup and README rewrite are complete.
- `tasks2.md:233-255` claims Phases 1-11 are complete and the repo is slimmed down.

Current state observed during review:

- `apps/` still exists locally and occupies about `2.4G`.
- A native-app build artifact is still tracked: `apps/android/build/reports/problems/problems-report.html`.
- `pnpm-workspace.yaml:1-5` still includes `packages/*`.
- Many extensions that `tasks2.md` says were removed still exist in the workspace, including `extensions/voice-call`, `extensions/nostr`, `extensions/line`, `extensions/irc`, `extensions/lobster`, `extensions/twitch`, `extensions/mattermost`, `extensions/nextcloud-talk`, `extensions/feishu`, `extensions/zalo`, `extensions/zalouser`, `extensions/tlon`, `extensions/copilot-proxy`, and `extensions/signal`.
- Tailscale is still a first-class code path, not a stub or placeholder: `src/gateway/server-tailscale.ts`, `src/infra/tailscale.ts`, and `docs/gateway/tailscale.md` are still present.

Impact:

- Security review scope is much larger than the repo narrative suggests.
- Operators and maintainers cannot trust the roadmap/status documents as a source of truth.
- Deprecated or supposedly removed code tends to miss hardening, ownership, and testing.

What to change:

- Make `tasks2.md` truthful or remove it.
- Separate "completed cleanup", "planned cleanup", and "not yet touched" into different sections.
- Remove tracked build residue and delete/archive unsupported surfaces instead of leaving them half-present.

### 5. Medium: Plugin install scanning is warn-only even for critical findings

Severity: Medium

Why this matters:

- `src/plugins/install.ts:157-179` explicitly says dangerous-code scanning is warn-only and never blocks install.
- Critical findings are logged, but installation continues.
- `src/plugins/install.ts:398-456` supports installing plugins from registry specs via `npm pack`, which avoids lifecycle scripts during pack but still results in arbitrary package code being loaded after install.

Impact:

- Supply-chain defense is advisory, not enforced.
- For a gateway that loads plugins into the control plane, that is too weak as a default posture.

What to change:

- Block installs on critical scanner findings unless the operator passes an explicit unsafe override.
- Record install provenance and exact version pins in config.
- Consider signed allowlists or a trusted plugin catalog for non-local installs.

### 6. Low: Test and maintenance drift are already visible in security-adjacent files

Severity: Low

Evidence:

- The targeted auth test run failed because `src/gateway/auth.test.ts:37-50` is mislabeled and currently asserts the opposite of what its fixture provides.
- `src/config/paths.ts:15` and `src/config/paths.ts:280-281` contain obvious duplicated env-var checks, which look like mechanical rebrand leftovers.

Impact:

- This does not directly create exposure, but it reduces confidence in security regressions and config-path correctness.

What to change:

- Fix the failing regression test immediately.
- Sweep for duplicated env-var fallbacks and other mechanical rebrand edits.

## Old, unnecessary, or stale surfaces

These are not all vulnerabilities, but they are strong candidates for removal, archival, or explicit compatibility labeling:

- `README.md:170-199` still points at `https://github.com/lalopenguin/penguins` and retains an `OpenClaw` migration section.
- `scripts/shell-helpers/README.md` and `scripts/shell-helpers/clawdock-helpers.sh` are still branded `clawdock`, write into `~/.clawdock`, and manipulate old Docker-era flows.
- `docs/gateway/remote-gateway-readme.md` still uses the launchd label `bot.molt.ssh-tunnel`.
- `package.json:10` still exposes an `openclaw` bin alias. This may be intentional compatibility, but it should be clearly documented as such if retained.
- `pnpm-workspace.yaml:1-5` still includes `packages/*` even though `packages/` is effectively legacy residue.
- Native-app residue remains in the workspace under `apps/`, with a tracked artifact at `apps/android/build/reports/problems/problems-report.html`.
- Tailscale remains deeply integrated across code and docs despite `tasks2.md` positioning Cloudflare as the new direction.

## Three-phase remediation plan

### Phase 1: Immediate containment

Goal: remove the most dangerous remote-exposure paths within days, not weeks.

- Change gateway HTTP auth so Tailscale Serve never bypasses shared-secret checks for `/tools/invoke`, `/v1/chat/completions`, or `/v1/responses`.
- Add a hard startup guard: if `tailscale.mode=serve` is enabled, require either password auth or an explicit Tailscale user allowlist.
- Change plugin HTTP defaults so all plugin routes require gateway auth unless explicitly declared public.
- Reserve core URL namespaces and reject conflicting plugin route registrations.
- Fix the README/Docker remote-access examples immediately.
- Remove the tracked Android build report and clean obvious workspace residue (`apps/*` caches, stale `packages/*` shells) from active development environments.
- Repair the broken auth regression test so security-related test signal is trustworthy again.

Exit criteria:

- shared tailnet users cannot call `/tools/invoke` without a gateway secret
- unauthenticated plugin routes are impossible unless explicitly opted into
- README no longer documents the wrong port or config file name

### Phase 2: Structural hardening

Goal: replace ad hoc trust with explicit security boundaries.

- Introduce principal-aware remote auth:
  - Tailscale allowlist support
  - strong trusted-proxy recipes for Cloudflare Access / Pomerium style headers
  - per-endpoint auth policy rather than one blanket auth interpretation
- Strengthen `/tools/invoke`:
  - deny `exec`, `process`, filesystem mutation, and other high-risk tools over HTTP by default
  - require explicit operator opt-in for any mutation-capable tool
- Harden plugin installs:
  - block on critical scanner findings by default
  - record exact source/version
  - add "unsafe install" audit events when overrides are used
- Expand regression coverage:
  - Tailscale Serve auth matrix
  - plugin route shadowing
  - public-route registration denial
  - HTTP tool exposure policy tests

Exit criteria:

- remote auth behavior is explicit, documented, and regression-tested
- public plugin ingress is opt-in and namespaced
- plugin supply-chain controls are enforceable rather than advisory

### Phase 3: Surface reduction and repo truthfulness

Goal: make the codebase match the claimed product and reduce long-term security burden.

- Decide whether the real remote strategy is Tailscale or Cloudflare. Then delete the losing path from product docs, onboarding, and helper scripts.
- Remove or archive deprecated extensions that are no longer in product scope.
- Stop shipping or referencing native-app residue if the product is now web-first only.
- Drop stale workspace globs and legacy package shells from `pnpm-workspace.yaml`.
- Sweep docs/scripts for `clawdock`, `moltbot`, `clawdbot`, `lalopenguin`, and other rebrand leftovers; keep only deliberate compatibility shims.
- Publish one canonical deployment guide and one canonical cleanup/status document so operators are not reading contradictory sources.

Exit criteria:

- the repository tree matches the supported product surface
- roadmap/status docs are accurate
- stale branding and dead operational scripts are either removed or clearly labeled compatibility-only

## Bottom line

If this project is going to remain an "agentic orchestration" gateway with remote ingress and executable tools, the current Tailscale Serve auth model has to be fixed first. That is the one issue that can most directly turn a shared network trust boundary into privileged host access.

After that, the plugin HTTP contract and the repo/documentation drift should be treated as the next priorities. Right now the codebase is harder to secure than it needs to be because it still behaves like several different products at once.
