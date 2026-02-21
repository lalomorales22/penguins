# Penguins — Developer Handoff

_Exact implementation guide for the 5 next tasks. Written for a fresh Claude instance
that has not seen the codebase. Read WHAT_I_THINK.md first for context and motivation._

---

## Codebase at a Glance

```
src/
  memory/          ← Hybrid vector + BM25 search, embedding providers, sync
  gateway/         ← Core server, agent loop, auth, boot, prompt assembly
  agents/          ← Agent execution
  auto-reply/      ← Tool/command registry, message dispatch
  cron/            ← Scheduled job system
  plugins/         ← Plugin lifecycle hooks and types
  config/          ← Config types and schema (Zod)

extensions/
  memory-lancedb/  ← LanceDB vector store plugin (has memory_store/recall/forget tools)
  memory-core/     ← Builtin memory search tools (memory_search, memory_get)

ui/
  src/ui/          ← WebChat frontend (Lit/TypeScript, no framework)
  public/          ← Static assets served with the build
  vite.config.ts   ← Vite build config (no PWA plugin yet)

skills/            ← Slash-command skills (github, notion, weather, etc.)
```

**Stack:** TypeScript (ESM), Node.js ≥ 22, pnpm, Lit (UI), Zod (config), sqlite-vec (vector),
LanceDB (optional), Vitest (tests).

---

## Task 1 — Local Embeddings

**Goal:** Let embeddings run locally via `node-llama-cpp` instead of calling OpenAI.
Zero API calls for memory indexing and search.

### What already exists

`src/memory/embeddings.ts` already has a `"local"` provider path:

```typescript
// src/memory/embeddings.ts
export type EmbeddingProviderId = "openai" | "local" | "gemini" | "voyage";
export type EmbeddingProviderRequest = EmbeddingProviderId | "auto";

export async function createEmbeddingProvider(
  options: EmbeddingProviderOptions,
): Promise<EmbeddingProviderResult>
```

The `"auto"` path tries local first (if a model file exists), then falls back to OpenAI.
The local path calls `createLocalEmbeddingProvider()` in the same file (lines ~89–135),
which lazy-imports `node-llama-cpp` via:

```typescript
// src/memory/node-llama.ts  ← stub file, only does:
export async function importNodeLlamaCpp() {
  return import("node-llama-cpp");
}
```

The local provider is **already implemented** — it creates a `LlamaEmbeddingContext` and
exposes `embedQuery(text)` and `embedBatch(texts)`. The default model path:

```typescript
const DEFAULT_LOCAL_MODEL =
  "hf:ggml-org/embeddinggemma-300m-qat-q8_0-GGUF/embeddinggemma-300m-qat-Q8_0.gguf";
```

### What's missing

There's no config knob to explicitly select the local provider without hacking the "auto"
path. The embedding provider is resolved deep in `src/memory/manager.ts` using:

```typescript
cfg.agents?.defaults?.memorySearch?.provider  // or the global config
```

### What to build

**Option A (Easiest — 2 hours):** Add `PENGUINS_EMBEDDING_BACKEND` env var support in
`src/memory/embeddings.ts` inside `createEmbeddingProvider()`:

```typescript
// Before the existing provider selection logic, add:
const envOverride = process.env.PENGUINS_EMBEDDING_BACKEND?.trim();
if (envOverride === "local") {
  return createLocalEmbeddingProvider(options);
}
if (envOverride === "openai") {
  return createOpenAiEmbeddingProvider(options);
}
// fall through to existing "auto" logic
```

**Option B (Proper — 1 day):** Add `embedding.backend` to the config schema:

```typescript
// src/config/types.memory.ts — add to MemoryConfig:
export type MemoryConfig = {
  backend?: MemoryBackend;
  citations?: MemoryCitationsMode;
  embedding?: {
    backend?: "auto" | "local" | "openai";
    localModelPath?: string;   // optional override
    localModelDims?: number;   // 768 for nomic-embed-text
  };
  qmd?: MemoryQmdConfig;
};
```

Then thread `cfg.memory?.embedding` through `src/memory/manager.ts` into
`createEmbeddingProvider(options)`.

### Recommended local model

For CPU, no GPU required:
```
nomic-embed-text-v1.5.Q8_0.gguf   — 768 dims, excellent quality, ~300MB
```

Download from HuggingFace: `nomic-ai/nomic-embed-text-v1.5-GGUF`

Set `localModelPath` to the absolute path to the `.gguf` file.

### Verification

After wiring:
```bash
PENGUINS_EMBEDDING_BACKEND=local penguins memory sync
# Should sync without any OpenAI API calls
```

Check `src/memory/status-format.ts` — the status output shows which provider is active.

---

## Task 2 — SELF.md Self-Journal

**Goal:** The agent writes a persistent self-model after meaningful conversations.
It gets injected into the system prompt at session start.

### How the system prompt is assembled today

Boot sequence in `src/gateway/boot.ts`:
1. `runBootOnce(params)` is called at gateway startup
2. It loads `BOOT.md` from the workspace root
3. Runs the agent with a boot prompt: "Follow BOOT.md instructions"
4. BOOT.md is a markdown file the user writes, e.g. "Check if there are any reminders"

Memory injection happens separately — the memory system indexes all `.md` files under
`~/.penguins/memory/` (or workspace root `MEMORY.md`). Before each agent response,
relevant memory snippets are retrieved and injected as context.

The `before_agent_start` lifecycle hook is the injection point for custom context.

### Lifecycle hooks

Defined in `src/plugins/types.ts`:

```typescript
// Hook: called before the agent runs — inject context here
"before_agent_start": (event: PluginHookBeforeAgentStartEvent, ctx: PluginHookAgentContext)
  => Promise<void> | void

// Hook: called after the agent completes — write self-reflection here
"agent_end": (event: PluginHookAgentEndEvent, ctx: PluginHookAgentContext)
  => Promise<void> | void
```

`agent_end` event:
```typescript
type PluginHookAgentEndEvent = {
  messages: unknown[];   // full conversation
  success: boolean;
  error?: string;
  durationMs?: number;
};
```

`ctx`:
```typescript
type PluginHookAgentContext = {
  agentId?: string;
  sessionKey?: string;
  sessionId?: string;
  workspaceDir?: string;     // ← use this to find ~/.penguins/
  messageProvider?: string;
};
```

### What to build

**Step 1:** Create a new extension `extensions/self-journal/` with:

```typescript
// extensions/self-journal/index.ts
import fs from "node:fs/promises";
import path from "node:path";
import type { PenguinsPluginApi } from "penguins/plugin-sdk";

let turnsSinceReflect = 0;
const REFLECT_EVERY_N_TURNS = 10; // configurable

export default {
  id: "self-journal",
  name: "Self Journal",
  register(api: PenguinsPluginApi) {

    // Inject SELF.md into context before each session
    api.on("before_agent_start", async (_event, ctx) => {
      if (!ctx.workspaceDir) return;
      const selfPath = path.join(ctx.workspaceDir, "memory", "SELF.md");
      try {
        const content = await fs.readFile(selfPath, "utf-8");
        // Memory system will pick this up automatically if it's in the memory dir
        // Alternatively, inject via api.injectContext() if that API exists
      } catch {
        // File doesn't exist yet — that's fine
      }
    });

    // After a turn, maybe write a reflection
    api.on("agent_end", async (event, ctx) => {
      if (!event.success || !ctx.workspaceDir) return;
      turnsSinceReflect++;
      if (turnsSinceReflect < REFLECT_EVERY_N_TURNS) return;
      turnsSinceReflect = 0;

      const selfPath = path.join(ctx.workspaceDir, "memory", "SELF.md");
      // Ask the agent to reflect on what it learned about itself
      // Write the output to selfPath
      // The memory indexer will pick it up on next sync
    });
  },
};
```

**Step 2:** Since `SELF.md` lives in `~/.penguins/memory/`, the memory system already
indexes it as part of normal memory search. No extra wiring needed for recall.

**Step 3:** For the reflection call, use the cron system (Task 5) to schedule a
weekly `agentTurn` that says:
> "Review SELF.md and update it with what you've learned about yourself, your preferences,
> and your patterns in the past week. Be specific and honest."

This is simpler than triggering mid-session because it runs in an isolated context.

### SELF.md format (suggested)

```markdown
# Self

Last updated: 2026-02-18

## What I know about myself
- I prefer concise answers when helping with code
- I tend to ask clarifying questions before large changes

## What I know about the user
- Prefers TypeScript over JavaScript
- Works late evenings (UTC-5)
- Currently building a local AI assistant called Penguins

## What I've been working on
- Completed rebrand from OpenClaw → Penguins (2026-02-17)
- Removed iOS/Android/macOS native apps
```

---

## Task 3 — memory:save Tool

**Goal:** The agent can call a tool mid-conversation to deliberately store a memory.

### The pattern already exists — look here first

`extensions/memory-lancedb/index.ts` already has `memory_store` (lines ~354–415):

```typescript
api.registerTool(
  {
    name: "memory_store",
    description: "Save important information in long-term memory",
    parameters: Type.Object({
      text: Type.String({ description: "Information to remember" }),
      importance: Type.Optional(Type.Number()),  // 0-1, default 0.7
      category: Type.Optional(Type.Unsafe<MemoryCategory>({
        type: "string",
        enum: ["fact", "preference", "event", "relationship", "skill", "context", "other"],
      })),
    }),
    async execute(_toolCallId, params) {
      const vector = await embeddings.embed(params.text);
      const entry = await db.store({
        text: params.text,
        vector,
        importance: params.importance ?? 0.7,
        category: params.category ?? "other",
      });
      return {
        content: [{ type: "text", text: `Stored: "${params.text.slice(0, 100)}..."` }],
        details: { action: "created", id: entry.id },
      };
    },
  },
  { name: "memory_store" },
);
```

**This tool already exists in the LanceDB extension.** The issue is that it's only
available when `memory-lancedb` is installed, and it requires the LanceDB backend.

### What to build for the builtin memory system

The builtin memory system (`extensions/memory-core/`) uses file-based markdown memory.
To add a `memory:save` tool there:

```typescript
// In extensions/memory-core/index.ts, add:
api.registerTool(
  async (ctx) => {
    const workspaceDir = ctx.config?.workspaceDir ?? process.env.HOME + "/.penguins";
    const memDir = path.join(workspaceDir, "memory");

    return {
      name: "memory_save",
      label: "Save to Memory",
      description:
        "Permanently save a piece of information to your long-term memory file. " +
        "Use for things the user explicitly wants remembered, or that are clearly important.",
      parameters: Type.Object({
        content: Type.String({ description: "What to remember" }),
        category: Type.Optional(
          Type.Enum({ fact: "fact", preference: "preference", note: "note" })
        ),
      }),
      async execute(_id, params) {
        const date = new Date().toISOString().split("T")[0];
        const line = `- [${params.category ?? "note"}] ${params.content} (${date})\n`;

        // Append to MEMORY.md — the memory watcher picks it up automatically
        const memFile = path.join(memDir, "MEMORY.md");
        await fs.appendFile(memFile, line, "utf-8");

        return {
          content: [{ type: "text", text: `Saved to memory: "${params.content}"` }],
        };
      },
    };
  },
  { names: ["memory_save"] },
);
```

The memory watcher in `src/memory/manager.ts` watches `~/.penguins/memory/*.md`
and re-indexes on file changes. The write-back loop closes automatically.

---

## Task 4 — PWA (Progressive Web App)

**Goal:** The WebChat UI becomes installable on any device from your Cloudflare URL.
No App Store. Works offline. Push notifications possible.

### Current UI setup

- **Framework:** Lit/TypeScript, no React/Vue
- **Build:** Vite (config at `ui/vite.config.ts`)
- **Output:** `dist/control-ui/` — served statically by the gateway
- **Entry:** `ui/index.html` → `ui/src/main.ts` → `ui/src/ui/app.ts`
- **Icons already exist:** `ui/public/` has `favicon.svg`, `apple-touch-icon.png`, `favicon-32.png`

### Step 1: Install vite-plugin-pwa

```bash
cd ui
pnpm add -D vite-plugin-pwa
```

### Step 2: Update vite.config.ts

```typescript
// ui/vite.config.ts
import { defineConfig } from "vite";
import { VitePWA } from "vite-plugin-pwa";
import path from "node:path";

const here = path.dirname(new URL(import.meta.url).pathname);

export default defineConfig(() => {
  const envBase = process.env.PENGUINS_CONTROL_UI_BASE_PATH?.trim();
  const base = envBase ? normalizeBase(envBase) : "./";
  return {
    base,
    publicDir: path.resolve(here, "public"),
    plugins: [
      VitePWA({
        registerType: "autoUpdate",
        includeAssets: ["favicon.svg", "favicon-32.png", "apple-touch-icon.png"],
        manifest: {
          name: "Penguins",
          short_name: "Penguins",
          description: "Your personal AI assistant",
          theme_color: "#000000",
          background_color: "#000000",
          display: "standalone",
          orientation: "portrait",
          start_url: "/",
          scope: "/",
          icons: [
            { src: "favicon-32.png", sizes: "32x32", type: "image/png" },
            { src: "apple-touch-icon.png", sizes: "180x180", type: "image/png" },
            // Add a 512x512 icon for full PWA compliance
            { src: "icon-512.png", sizes: "512x512", type: "image/png", purpose: "any maskable" },
          ],
        },
        workbox: {
          globPatterns: ["**/*.{js,css,html,ico,png,svg}"],
          // Don't cache API calls
          navigateFallback: null,
        },
      }),
    ],
    build: {
      outDir: path.resolve(here, "../dist/control-ui"),
      emptyOutDir: true,
      sourcemap: true,
    },
    server: {
      host: true,
      port: 5173,
      strictPort: true,
    },
  };
});
```

### Step 3: Add 512x512 icon

The PWA spec requires a 512x512 icon for installation. Add `ui/public/icon-512.png`.
Use the existing penguin/logo artwork, or generate one from `favicon.svg`:

```bash
# If you have sharp installed:
node -e "require('sharp')('ui/public/favicon.svg').resize(512,512).png().toFile('ui/public/icon-512.png')"
```

### Step 4: Register service worker in main.ts

`vite-plugin-pwa` auto-generates the service worker and injects the registration script.
No manual changes to `main.ts` needed when using `registerType: "autoUpdate"`.

### Step 5: Test

```bash
pnpm ui:build
# Open dist/control-ui/index.html
# Chrome DevTools → Application → Service Workers → should show registered
# Chrome → address bar → install icon should appear
```

### Push notifications (bonus, after basic PWA works)

Push notifications require a VAPID key pair and a push endpoint on the gateway.
See: https://web.dev/notifications/ — defer this until after basic PWA is working.

---

## Task 5 — Memory Compression Job

**Goal:** A weekly cron job that finds near-duplicate memories, synthesizes them,
and removes the redundant ones. Keeps memory lean and useful long-term.

### Cron job system

Jobs are stored persistently and run by `src/cron/service.ts`.

**Create a job:**
```typescript
import { CronService } from "src/cron/service.js";

const job = await cronService.add({
  name: "Memory Compression",
  description: "Deduplicate and compress long-term memories",
  enabled: true,
  notify: false,
  sessionTarget: { kind: "isolated" },  // isolated session, no user context
  wakeMode: "next-heartbeat",
  schedule: { kind: "every", everyMs: 7 * 24 * 60 * 60 * 1000 }, // weekly
  payload: {
    kind: "agentTurn",
    message: `You are running a memory maintenance task.

1. Call memory_search with query "similar" to find groups of related memories
2. For any group of 3+ memories that are clearly about the same topic:
   a. Call memory_store to save one synthesized, comprehensive fact
   b. Call memory_forget for each of the originals (use their IDs)
3. For any memory with importance < 0.3 and age > 90 days, call memory_forget
4. Report how many memories were merged and deleted.

Be conservative. Only merge when you're confident the memories are truly redundant.`,
    timeoutSeconds: 120,
    deliver: false,  // don't send output to any channel
  },
  delivery: { mode: "none" },
});
```

### Register the job at gateway startup

Find where other startup tasks are registered — look in `src/gateway/boot.ts` or
`src/gateway/call.ts` for the initialization sequence. Add:

```typescript
// After gateway initializes, register the compression job if not already present
const existingJobs = await cronService.list();
const hasCompressionJob = existingJobs.some(j => j.name === "Memory Compression");
if (!hasCompressionJob) {
  await cronService.add(compressionJobDefinition);
}
```

### Memory search API (for manual/programmatic use)

```typescript
import { getMemorySearchManager } from "src/memory/search-manager.js";

const result = await getMemorySearchManager({
  cfg,
  agentId: "compression-agent",
});

if (result.ok) {
  const manager = result.manager;
  // Search for similar memories
  const results = await manager.search("duplicate similar redundant", {
    maxResults: 50,
    minScore: 0.7,
  });
  // results: Array<{ path, startLine, endLine, score, snippet, source, citation }>
}
```

### Cosine similarity clustering (for direct LanceDB access)

If using LanceDB backend, you can query the table directly for vector clustering.
See `extensions/memory-lancedb/index.ts` — the `db` object has a `table` property
(LanceDB Table) that supports direct queries:

```typescript
// Get all memories ordered by vector similarity to a centroid
const allEntries = await db.table.query().toArray();
// Then cluster by cosine similarity > 0.92 in JS
```

---

## How to Add a New Extension

For Tasks 2 and 3 (self-journal, memory-save), if building as extensions:

1. Create `extensions/your-name/`
2. Add `package.json`:
```json
{
  "name": "@penguins/your-name",
  "version": "1.0.0",
  "type": "module",
  "main": "index.js"
}
```
3. Add `penguins.plugin.json`:
```json
{
  "id": "your-name",
  "name": "Your Extension Name",
  "kind": "utility",
  "entry": "./index.js"
}
```
4. Add `index.ts` implementing the plugin API (see `memory-lancedb/index.ts` for a full example)
5. The catalog (`src/channels/plugins/catalog.ts`) auto-discovers extensions in `extensions/`

---

## Key Config Paths

| What | Where |
|---|---|
| Memory config | `~/.penguins/config.json` → `memory.*` |
| Memory files (indexed) | `~/.penguins/memory/*.md` |
| Session files (indexed) | `~/.penguins/sessions/` |
| BOOT.md | `~/.penguins/BOOT.md` or workspace root |
| SELF.md (proposed) | `~/.penguins/memory/SELF.md` |
| Gateway state | `~/.penguins/state.json` |
| Cron jobs | `~/.penguins/cron/jobs.json` |

---

## Key Types to Know

```typescript
// Plugin registration
import type { PenguinsPluginApi } from "penguins/plugin-sdk";

// Tool definition
api.registerTool({ name, description, parameters, execute }, opts)

// Lifecycle hooks
api.on("agent_end", handler)
api.on("before_agent_start", handler)

// Memory search
import { getMemorySearchManager } from "src/memory/search-manager.js";

// Cron
import { CronService } from "src/cron/service.js";
```

---

## What NOT to touch

- `src/memory/manager.ts` — complex, has many edge cases, avoid unless necessary
- `src/gateway/auth.ts` — auth is working, don't break it
- `pnpm-lock.yaml` — auto-generated, never edit manually
- `dist/` — build output, never edit

---

_Handoff written 2026-02-18. Read WHAT_I_THINK.md for the strategic context._
_Codebase: /Users/minibrain/Desktop/penguins_
