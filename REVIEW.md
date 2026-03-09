# Penguins — Full Security & Software Engineering Review

**Date:** 2026-03-09
**Reviewer:** Claude Opus 4.6 (Security/SWE Audit Mode)
**Scope:** Complete codebase audit — architecture, security, testing, deployment, functionality

---

## Executive Summary

Penguins is a **self-hosted AI gateway** with browser UI, CLI, multi-channel integrations (Telegram, Slack, Discord, WhatsApp, Signal, iMessage, IRC, etc.), a plugin/extension system, memory/embeddings, TTS, cron scheduling, and multi-provider AI model support. The codebase is **~34,000+ lines** in the gateway alone, TypeScript strict mode, with 27 extensions and 16 skills.

### Verdict: **Architecturally Sound, Operationally Incomplete**

The core security posture is **strong** — timing-safe auth, path traversal protection, rate limiting, command injection defenses, and a built-in security audit framework. However, the project has **critical operational gaps** that prevent it from being production-ready: no CI/CD pipeline, no API documentation, incomplete rebrand artifacts, missing distributed-systems patterns, and several medium-severity bugs.

---

## Section 1: Security Assessment

### Grade: A-

#### What's Done Well

| Area              | Implementation                                                      | Location                                      |
| ----------------- | ------------------------------------------------------------------- | --------------------------------------------- |
| Auth              | Timing-safe comparison via `safeEqualSecret()`                      | `src/gateway/auth.ts:378,395`                 |
| Rate Limiting     | Sliding window, 10 attempts, 5-min lockout                          | `src/gateway/auth-rate-limit.ts`              |
| Path Traversal    | `O_NOFOLLOW`, symlink validation, inode checks                      | `src/infra/fs-safe.ts`                        |
| Secrets           | Env var preference over disk, 0o600 permissions                     | `src/config/io.ts:52-69,1004`                 |
| Command Injection | Blocklist for `LD_PRELOAD`, `NODE_OPTIONS`, `BASH_ENV`              | `src/agents/bash-tools.exec-runtime.ts:33-79` |
| CSRF              | Origin/Referer + `Sec-Fetch-Site` validation                        | `src/browser/csrf.ts:26-55`                   |
| Archive Safety    | Entry limits, byte limits, symlink blocking, path escape prevention | `src/infra/archive.ts`                        |
| Docker            | Non-root user, loopback binding by default                          | `Dockerfile:40,43-44`                         |
| Audit Framework   | Secret detection, hook hardening, sandbox config checks             | `src/security/audit-extra.sync.ts`            |

#### Security Concerns

1. **Rate limiter is in-memory only** — Bypassed in multi-instance deployments. No Redis/distributed backend.
2. **No Content-Security-Policy headers** on gateway HTTP responses.
3. **No dependency audit in CI** — `npm audit` / `pnpm audit` never runs automatically.
4. **OpenAI HTTP handler swallows error details** — Returns generic "internal error" string (`openai-http.ts:178`), making debugging impossible for consumers.
5. **No request body size limits visible** on raw HTTP handler — potential for large payload DoS.
6. **Session files lack advisory locks** — Concurrent access from CLI + gateway could corrupt session state.
7. **HTTPS not enforced at gateway level** — Relies on external reverse proxy (Cloudflare/nginx). No auto-redirect from HTTP to HTTPS.

---

## Section 2: Architecture & Code Quality

### Grade: B+

#### Strengths

- **TypeScript strict mode** with `no-explicit-any` enforced via oxlint
- **Clean separation of concerns**: gateway server split into 12+ modules (chat, browser, channels, cron, plugins, methods, tailscale, discovery, maintenance, TLS, health, WS)
- **Sophisticated model fallback system** distinguishing timeout vs. API error vs. context overflow vs. abort
- **Lane-based command queuing** (Main/Cron/Subagent) prevents interleaving with configurable concurrency
- **Event subscription model** cleanly decouples agent execution from HTTP/WS responses
- **Config hot-reload** without gateway restart
- **Enterprise-grade error handling**: fatal/config/transient categorization, graceful exit
- **Structured logging** via tslog with auto-redaction of secrets

#### Concerns

1. **Monolith file sizes**: `server.impl.ts` (726 lines), `openresponses-http.ts` (921 lines), `server-http.ts` (648 lines) — these should be decomposed
2. **No OpenAPI/Swagger documentation** — The WebSocket protocol has auto-generated schema, but HTTP endpoints (`/v1/chat/completions`, `/v1/responses`) lack formal API docs
3. **Plugin system is load-once** — No dynamic reload; requires full gateway restart to pick up new plugins
4. **File-based state** — No database, all state in `~/.penguins/` JSON files. Works for single-server but cannot scale horizontally
5. **91 gateway methods with growing complexity** — No versioning strategy for the gateway protocol
6. **Some legacy OpenClaw env var fallbacks still present** — Adds code paths that should eventually be removed
7. **Agent event subscription cleanup** uses `closed` flag pattern instead of try-finally — potential for leaked listeners on exceptions

---

## Section 3: Testing & Quality Assurance

### Grade: B

#### What Exists

| Suite      | Count     | Framework           | Config                        |
| ---------- | --------- | ------------------- | ----------------------------- |
| Unit       | 631       | Vitest              | `vitest.unit.config.ts`       |
| E2E        | 326       | Vitest              | `vitest.e2e.config.ts`        |
| UI         | 28        | Vitest + Playwright | `ui/vitest.config.ts`         |
| Live       | 10        | Vitest              | `vitest.live.config.ts`       |
| Extensions | 5         | Vitest              | `vitest.extensions.config.ts` |
| **Total**  | **1,001** |                     |                               |

**Coverage targets**: 70% lines, 70% functions, 55% branches, 70% statements (v8 provider)

#### Critical Gaps

1. **NO CI/CD PIPELINE** — Zero GitHub Actions workflows. No `.github/workflows/` directory. All validation is local pre-commit hooks only. This is the single biggest operational risk.
2. **Extension tests are sparse** — Only 5 tests for 27 extensions. Most extensions have zero test coverage.
3. **Coverage excludes critical paths** — Gateway, channels, agents, plugins, providers, media-understanding all explicitly excluded from coverage metrics.
4. **No load/stress testing** — No k6, Artillery, or similar load test configs.
5. **No visual regression testing** for the Control UI beyond 28 basic tests.
6. **Pre-commit hooks are the only safety net** — Can be bypassed with `--no-verify`.

---

## Section 4: Deployment & Operations

### Grade: B-

#### What's Ready

- Docker (Dockerfile with non-root user, multi-stage)
- Docker Compose (gateway + CLI services)
- Fly.io (fly.toml with volume mounts, HTTPS enforcement)
- Podman support (scripts/podman/)
- systemd/launchd daemon management
- PWA (service worker, offline caching, installable)
- Graceful shutdown (17-step teardown sequence)
- Health checks with caching and on-demand probes

#### What's Missing

1. **No CI/CD deployment pipeline** — Manual `npm publish`, manual Docker push, manual Fly deploy
2. **No monitoring/alerting** — No Prometheus metrics, no Grafana dashboards, no PagerDuty/OpsGenie integration
3. **No distributed tracing** — OpenTelemetry extension exists but is optional and not integrated into core
4. **No backup/restore strategy** — `~/.penguins/` state directory has no automated backup
5. **No blue-green or canary deployment** support
6. **npm package not published** — `@penguins/*` packages don't exist on npm yet
7. **GitHub repository not renamed** — Still referenced as `lalomorales22/penguins`, not `penguins/penguins`
8. **No app store submissions** — iOS/Android listed as future, PWA is the only mobile path
9. **No runbook/playbook** for incident response
10. **No SLA/uptime monitoring** — No external health check service configured

---

## Section 5: Functionality Gaps

### What Works

- Multi-provider AI gateway (OpenAI, Anthropic, Google, local models)
- WebSocket-based real-time communication
- OpenAI-compatible HTTP endpoint
- Multi-channel messaging (Telegram, Slack, Discord, WhatsApp, Signal, iMessage, IRC, LINE, etc.)
- Plugin/extension system with 27 extensions
- Memory system with local + remote embeddings
- TTS with voice preferences per channel
- Cron scheduling for automated agent tasks
- Device pairing and node management
- Execution approval workflow
- Session management with history
- Config hot-reload
- Security audit framework

### What's Broken or Incomplete

1. **OpenAI HTTP endpoint disabled by default** — Users must manually enable in config. No documentation on how.
2. **OpenResponses endpoint disabled by default** — Same issue.
3. **Extensions lack individual README files** — Many extensions have no documentation at all.
4. **Skills directory has no discovery mechanism** from the CLI — Users must know skill names.
5. **No user onboarding flow validation** — `penguins onboard` exists but no automated test of the full flow.
6. **Memory system requires manual embedding backend selection** — No auto-detection of available backends.
7. **TTS limited to OpenAI provider** — No fallback to local TTS (e.g., Piper, espeak).
8. **No built-in update mechanism** — Users must manually update via npm/Docker.
9. **Control UI has no user management** — Single-user assumption baked in.
10. **No webhook support** — Can't receive webhooks from external services (GitHub, Stripe, etc.).
11. **Cron jobs lack retry logic** — Failed cron runs are not automatically retried.
12. **No data export/import** — Can't migrate state between instances.

---

## Section 6: Rebrand Residue

Items from the OpenClaw → Penguins rebrand that remain:

1. **`package.json` bin alias** `"openclaw"` — Intentional for backwards compat but should have sunset date
2. **`cli-name.ts` legacy detection regex** — Deprecation warning works but adds code complexity
3. **`doctor-platform-notes.ts` legacy env detection** — Both `CLAWDBOT_*` and `OPENCLAW_*` still checked
4. **`shell-env.ts` fallback chain** — `PENGUINS_*` → `OPENCLAW_*` fallback in every env var read
5. **CHANGELOG.md historical entries** — Fine to keep but should be clearly marked as pre-rebrand
6. **`pnpm-lock.yaml`** — Will regenerate but currently contains `openclaw` references
7. **npm not published under `@penguins/*`** — Packages still reference old scope

---

## Risk Matrix

| Risk                                        | Severity     | Likelihood                    | Impact               |
| ------------------------------------------- | ------------ | ----------------------------- | -------------------- |
| No CI/CD → broken code ships                | **Critical** | High                          | Production outage    |
| Session file corruption (concurrent access) | **High**     | Medium                        | Data loss            |
| Rate limiter bypass (multi-instance)        | **High**     | Low (single-instance typical) | Auth bypass          |
| No monitoring → silent failures             | **High**     | High                          | Extended outage      |
| Extension security (no sandbox)             | **Medium**   | Low                           | Privilege escalation |
| No backup → state loss                      | **Medium**   | Medium                        | Data loss            |
| OpenAI handler error swallowing             | **Medium**   | High                          | Poor DX              |
| No request body size limit                  | **Medium**   | Low                           | DoS                  |
| Legacy env var fallbacks → confusion        | **Low**      | Medium                        | Misconfiguration     |
| File-based state → no horizontal scaling    | **Low**      | Low (design choice)           | Scaling limit        |
