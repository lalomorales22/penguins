# Penguins — 3-Phase Revamp, Upgrade & Launch Plan

**Created:** 2026-03-09
**Goal:** Get Penguins 100% operational, secure, tested, and shipped.

---

## Phase 1: Foundation — Fix Critical Gaps (Weeks 1-3)

> **Theme:** Make it safe to ship. CI/CD, critical bugs, security hardening.

### 1.1 CI/CD Pipeline (CRITICAL — Highest Priority)

- [ ] **Create `.github/workflows/ci.yml`** — Run on every PR and push to main
  - [ ] Lint check (`pnpm check` — oxlint + oxfmt + tsc)
  - [ ] Unit tests (`pnpm test`)
  - [ ] E2E tests (`pnpm test:e2e`)
  - [ ] Gateway tests (`pnpm test:gateway`)
  - [ ] Extension tests (`pnpm test:extensions`)
  - [ ] Build verification (`pnpm build && pnpm ui:build`)
  - [ ] Matrix: Ubuntu, macOS, (optional Windows)
  - [ ] Node 22.x
  - [ ] pnpm cache for fast installs
- [ ] **Create `.github/workflows/security.yml`** — Automated security scanning
  - [ ] `pnpm audit --audit-level=high`
  - [ ] detect-secrets scan (already has `.secrets.baseline`)
  - [ ] CodeQL or Semgrep for SAST
- [ ] **Create `.github/workflows/release.yml`** — Automated releases
  - [ ] Triggered on version tag (`v*`)
  - [ ] Build + test + publish to npm
  - [ ] Docker image build + push to GHCR
  - [ ] GitHub Release with changelog
- [ ] **Create `.github/workflows/docker.yml`** — Docker integration tests
  - [ ] Build Docker image
  - [ ] Run docker E2E suite (`pnpm test:docker:all`)
  - [ ] Push to registry on main branch

### 1.2 Critical Bug Fixes

- [ ] **Fix OpenAI HTTP handler error context** (`src/gateway/server-http.ts` / `openai-http.ts`)
  - Return structured error JSON with `{ error: { type, message, code } }` instead of bare "internal error" string
  - Log full error details server-side for debugging
- [ ] **Add request body size limits** to raw HTTP handler
  - Implement `express.json({ limit: '1mb' })` equivalent or manual Content-Length check
  - Reject oversized payloads with 413 status
- [ ] **Add advisory file locks for session state**
  - Use `proper-lockfile` or `fs-ext` flock for `sessions.json` and session files
  - Prevent CLI + gateway concurrent corruption
- [ ] **Fix agent event subscription cleanup**
  - Wrap event subscription in try-finally in both `openai-http.ts` and `openresponses-http.ts`
  - Guarantee `unsubscribe()` runs even if handler throws
- [ ] **Add Content-Security-Policy headers** to gateway HTTP responses
  - `default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline'`

### 1.3 Security Hardening

- [ ] **Add HTTP request body size limits** (1MB default, configurable)
- [ ] **Add CORS configuration** to gateway HTTP endpoints
  - Default: Same-origin only
  - Configurable allowed origins in `penguins.json`
- [ ] **Add HTTP-to-HTTPS redirect** when TLS is configured
- [ ] **Document security model** — Create `docs/security.md` covering:
  - Auth modes (token, password, tailscale, trusted-proxy)
  - Rate limiting configuration
  - Extension security boundaries
  - Network exposure recommendations
- [ ] **Add Dependabot or Renovate** config for automated dependency updates

### 1.4 Testing Gaps

- [ ] **Increase extension test coverage** — Each of the 27 extensions should have at least 1 test file
  - Priority: memory-core, memory-lancedb, self-journal, signal, copilot-proxy
- [ ] **Add gateway coverage to metrics** — Remove gateway exclusion from vitest coverage config
- [ ] **Add smoke test for `penguins onboard`** — Automated test of the full onboarding flow
- [ ] **Add smoke test for `penguins doctor`** — Verify diagnostic output format

---

## Phase 2: Polish — UX, Documentation, Operational Excellence (Weeks 4-6)

> **Theme:** Make it usable by others. Docs, monitoring, DX improvements.

### 2.1 API Documentation

- [ ] **Generate OpenAPI spec** for HTTP endpoints
  - `/v1/chat/completions` — Document request/response schema
  - `/v1/responses` — Document OpenResponses schema
  - `/health` — Document health check endpoint
- [ ] **Document WebSocket gateway protocol**
  - Create `docs/gateway-protocol.md` from `protocol.schema.json`
  - Include example messages for each of the 91 methods
  - Document authentication handshake flow
- [ ] **Create extension developer guide** (`docs/extensions.md`)
  - Plugin SDK API reference
  - Hook lifecycle documentation
  - Tool registration guide
  - Example extension walkthrough

### 2.2 Monitoring & Observability

- [ ] **Add Prometheus metrics endpoint** (`/metrics`)
  - Request count, latency histograms, error rates
  - Active WebSocket connections
  - Agent execution duration
  - Memory/embedding query latency
  - Queue depth per lane
- [ ] **Add structured health check details**
  - Per-channel health (connected/disconnected/error)
  - Per-provider health (reachable/unreachable)
  - Memory system health (embedding backend status)
  - Disk usage for state directory
- [ ] **Integrate OpenTelemetry into core** (not just optional extension)
  - Distributed tracing for request flow
  - Span context propagation through gateway → agent → provider
- [ ] **Add uptime monitoring config** — Document how to set up external health checks (UptimeRobot, Healthchecks.io, etc.)

### 2.3 User Experience

- [ ] **Enable HTTP endpoints by default** — `/v1/chat/completions` and `/v1/responses` should be on by default with auth required
- [ ] **Auto-detect embedding backend** — If `node-llama-cpp` available, use local; else try OpenAI; else warn
- [ ] **Add `penguins skills list`** CLI command — Discover available skills without reading files
- [ ] **Add `penguins export`** CLI command — Export state directory as tarball for migration
- [ ] **Add `penguins import`** CLI command — Import state from tarball
- [ ] **Add `penguins update`** CLI command — Check for updates and self-update
- [ ] **Add `penguins backup`** CLI command — Create timestamped backup of `~/.penguins/`
- [ ] **Add cron job retry logic** — Failed cron runs auto-retry with exponential backoff (max 3 retries)
- [ ] **Improve Control UI onboarding** — First-time setup wizard in browser
- [ ] **Add webhook receiver endpoint** — Allow external services to trigger actions via HTTP POST

### 2.4 Documentation

- [ ] **Rewrite README.md** — Clean, focused getting-started guide
  - Quick start (Docker, npm, binary)
  - Configuration overview
  - Channel setup guides
  - Link to full docs
- [ ] **Add individual README to each extension** — What it does, how to configure, example config
- [ ] **Create `docs/deployment.md`** — Production deployment guide
  - Docker Compose reference setup
  - Fly.io deployment walkthrough
  - Reverse proxy (nginx/Caddy) configuration
  - TLS/HTTPS setup
  - Tailscale integration
- [ ] **Create `docs/troubleshooting.md`** — Common issues and solutions
- [ ] **Create `CONTRIBUTING.md`** — How to contribute, code style, PR process
- [ ] **Create `docs/runbook.md`** — Incident response playbook
  - How to restart gracefully
  - How to recover corrupted state
  - How to rotate secrets
  - How to debug failed channels

### 2.5 Rebrand Cleanup

- [ ] **Set sunset date for `openclaw` bin alias** — Add deprecation timeline to README
- [ ] **Schedule removal of `OPENCLAW_*` env var fallbacks** — Target v2.0 or 6 months from now
- [ ] **Regenerate `pnpm-lock.yaml`** — Remove all `openclaw` references
- [ ] **Publish `@penguins/*` to npm** — Register the scope and publish initial packages
- [ ] **Rename GitHub repository** — `lalomorales22/penguins` → final org/repo name

---

## Phase 3: Scale — Production Hardening & Growth (Weeks 7-10) ✅

> **Theme:** Make it bulletproof. Scale, resilience, ecosystem.
>
> **Status:** Core items complete. Remaining items (Redis backends, full RBAC, extension sandboxing, binary releases) are deferred to post-launch iteration.

### 3.1 Distributed Systems Readiness

- [ ] **Add Redis backend for rate limiting** — Configurable: in-memory (default) or Redis _(deferred — requires Redis dependency)_
  - Support `PENGUINS_REDIS_URL` env var
  - Shared rate limit state across multiple gateway instances
- [ ] **Add Redis/SQLite session store option** — Move sessions from filesystem to DB _(deferred — requires storage abstraction)_
  - Atomic operations, no file lock issues
  - Configurable: `file` (default), `sqlite`, `redis`
- [ ] **Add database migration system** — For when/if SQL storage is introduced _(deferred — blocked on session store)_
  - Use `umzug` or similar lightweight migration runner
- [x] **Add horizontal scaling docs** — `docs/horizontal-scaling.md`
  - nginx/HAProxy config, Docker Compose, Kubernetes manifests, Redis shared state, cron leader election

### 3.2 Performance & Resilience

- [x] **Add load testing suite** — `test/load/http-endpoints.js`, `test/load/websocket-connections.js` (k6)
  - HTTP endpoint throughput + WebSocket connection storm scenarios
- [ ] **Add connection pooling** for external API calls _(deferred — Node 22 undici already pools)_
- [x] **Add circuit breaker pattern** for provider calls — `src/infra/circuit-breaker.ts`
  - Per-provider failure tracking, open/half-open/closed states, configurable thresholds
  - Registry: `getCircuitBreaker(name)` for named per-service breakers
  - Full test suite: `src/infra/circuit-breaker.test.ts`
- [x] **Add request timeout enforcement** at gateway level — `src/gateway/request-timeout.ts`
  - Per-route configurable timeouts (built-in defaults + user overrides)
  - 504 response on timeout, metrics tracking, SSE-safe handling
  - Test suite: `src/gateway/request-timeout.test.ts`
- [ ] **Decompose large files** _(deferred — low priority, existing files are well-structured)_
- [x] **Add backpressure handling** for SSE streaming — `src/gateway/http-common.ts`
  - `sseWrite()` — checks `res.destroyed`/`res.writableEnded` before writes
  - `sseIsBackpressured()` — high-water mark check (64 KiB)
  - `sseDrainIfNeeded()` — async drain with close detection
  - Updated `writeSse()` in `openai-http.ts` and `writeSseEvent()` in `openresponses-http.ts`

### 3.3 Extension Ecosystem

- [x] **Add extension hook timeout enforcement** — `src/plugins/hooks.ts`
  - `hookTimeoutMs` option (default 30s) wraps every hook handler in a timeout race
  - Applied to both `runVoidHook` (parallel) and `runModifyingHook` (sequential)
  - Configurable via `HookRunnerOptions.hookTimeoutMs`
- [ ] **Add extension sandboxing** — Worker thread / VM contexts _(deferred — significant effort)_
- [ ] **Add extension marketplace/registry** _(deferred — post-launch)_
- [ ] **Add dynamic extension loading** _(deferred — post-launch)_
- [ ] **Add extension configuration UI** _(deferred — post-launch)_

### 3.4 Multi-User & Access Control

- [ ] **Add multi-user support** to Control UI _(deferred — requires OAuth/OIDC integration)_
- [ ] **Add role-based access control (RBAC)** _(deferred — API key roles provide initial foundation)_
- [x] **Add API key management** — `src/gateway/api-keys.ts`
  - Per-user API keys with `pk_` prefix, SHA-256 hashed storage
  - Roles: admin / operator / viewer (foundation for RBAC)
  - Create, list, revoke, delete, rotate operations
  - Timing-safe authentication, file permission 0o600
  - Full test suite: `src/gateway/api-keys.test.ts`

### 3.5 Advanced Features

- [ ] **Add local TTS fallback** _(deferred — Piper integration is standalone effort)_
- [ ] **Add voice input (STT)** _(deferred — Whisper integration is standalone effort)_
- [x] **Add Gateway protocol versioning** — Already existed: `PROTOCOL_VERSION = 3`, `minProtocol`/`maxProtocol` negotiation in connect handshake
- [x] **Add WebSocket reconnection protocol** — `src/gateway/ws-resume.ts`
  - `WsResumeManager`: per-connection ring buffer with sequence numbers
  - `createToken()` / `push()` / `getEventsSince()` for event replay
  - Auto-sweep of expired buffers (configurable TTL, default 5 min)
  - Full test suite: `src/gateway/ws-resume.test.ts`
- [ ] **Add multi-model routing** _(deferred — requires config schema design)_
- [x] **Add usage tracking and quotas** — `src/infra/usage-quotas.ts`
  - `UsageQuotaTracker`: per-subject monthly/daily token + request limits
  - Auto-rollover on month/day boundaries
  - `check()` before request, `record()` after
  - Full test suite: `src/infra/usage-quotas.test.ts`
- [ ] **Add plugin dependency resolution** _(deferred — low priority)_

### 3.6 Release & Distribution

- [ ] **Create binary releases** _(deferred — requires CI pipeline)_
- [ ] **Create Homebrew formula** _(deferred — post npm publish)_
- [ ] **Create Docker Hub images** _(CI workflow created in Phase 1: `.github/workflows/docker.yml`)_
- [ ] **Create Flathub/Snap packages** _(deferred)_
- [ ] **Set up docs site** _(deferred — comprehensive in-repo docs created in Phase 2)_
- [ ] **Create demo/playground** _(deferred)_

---

## Priority Matrix

| Task                             | Phase | Priority | Effort | Impact                 |
| -------------------------------- | ----- | -------- | ------ | ---------------------- |
| CI/CD Pipeline                   | 1     | **P0**   | Medium | Blocks everything      |
| OpenAI error context fix         | 1     | **P0**   | Small  | Major DX improvement   |
| Request body size limits         | 1     | **P1**   | Small  | Security               |
| Session file locking             | 1     | **P1**   | Medium | Data integrity         |
| Extension test coverage          | 1     | **P1**   | Large  | Quality assurance      |
| API documentation                | 2     | **P1**   | Medium | Adoption               |
| Prometheus metrics               | 2     | **P1**   | Medium | Operational visibility |
| README rewrite                   | 2     | **P1**   | Small  | First impressions      |
| npm publish                      | 2     | **P1**   | Small  | Distribution           |
| Enable HTTP endpoints by default | 2     | **P2**   | Small  | UX                     |
| Redis rate limiting              | 3     | **P2**   | Medium | Scale                  |
| Load testing                     | 3     | **P2**   | Medium | Confidence             |
| Extension sandboxing             | 3     | **P2**   | Large  | Security               |
| Multi-user support               | 3     | **P3**   | Large  | Growth                 |
| Binary releases                  | 3     | **P3**   | Medium | Distribution           |

---

## Success Criteria

### Phase 1 Complete When:

- [ ] Every PR runs automated tests before merge
- [ ] Security scanning catches vulnerabilities automatically
- [ ] Critical bugs (error context, body limits, session locking) are fixed
- [ ] Extension test coverage > 50%

### Phase 2 Complete When:

- [ ] New users can go from `npm install` to running gateway in < 5 minutes using README alone
- [ ] API endpoints have formal documentation (OpenAPI + protocol docs)
- [ ] Prometheus metrics endpoint is live and documented
- [ ] `@penguins/*` packages are published on npm
- [ ] Runbook exists for common incidents

### Phase 3 Complete When:

- [ ] Gateway can run behind a load balancer with shared state
- [ ] Load tests prove 1000+ concurrent WebSocket connections
- [ ] Extensions run in sandboxed environments
- [ ] Binary releases available for all major platforms
- [ ] Documentation site is live at docs.penguins.ai

---

## Quick Wins (Can Do Today)

1. Create `.github/workflows/ci.yml` with basic lint + test + build
2. Add `pnpm audit` to pre-commit hooks
3. Fix the OpenAI error handler (10-line change)
4. Add CSP headers (5-line change)
5. Create `CONTRIBUTING.md` from existing code style configs
6. Regenerate `pnpm-lock.yaml` to clear OpenClaw references
