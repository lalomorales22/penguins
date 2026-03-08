import type { PenguinsPluginApi } from "penguins/plugin-sdk";
import { Type } from "@sinclair/typebox";
import fsSync from "node:fs";
import fs from "node:fs/promises";
import path from "node:path";
import { emptyPluginConfigSchema } from "penguins/plugin-sdk";

const MEMORY_CATEGORIES = ["fact", "preference", "note", "event", "skill"] as const;
type MemoryCategory = (typeof MEMORY_CATEGORIES)[number];

const memoryCorePlugin = {
  id: "memory-core",
  name: "Memory (Core)",
  description: "File-backed memory search tools and CLI",
  kind: "memory",
  configSchema: emptyPluginConfigSchema(),
  register(api: PenguinsPluginApi) {
    api.registerTool(
      (ctx) => {
        const memorySearchTool = api.runtime.tools.createMemorySearchTool({
          config: ctx.config,
          agentSessionKey: ctx.sessionKey,
        });
        const memoryGetTool = api.runtime.tools.createMemoryGetTool({
          config: ctx.config,
          agentSessionKey: ctx.sessionKey,
        });
        if (!memorySearchTool || !memoryGetTool) {
          return null;
        }
        return [memorySearchTool, memoryGetTool];
      },
      { names: ["memory_search", "memory_get"] },
    );

    // memory_save — lets the agent deliberately write a memory mid-conversation.
    // Appends to MEMORY.md in the workspace memory directory.
    // The memory watcher picks up the change and re-indexes automatically.
    api.registerTool(
      (ctx) => {
        const workspaceDir = ctx.workspaceDir;
        if (!workspaceDir) return null;

        const memDir = path.join(workspaceDir, "memory");
        const memFile = path.join(memDir, "MEMORY.md");

        return {
          name: "memory_save",
          label: "Save to Memory",
          description:
            "Permanently save a piece of information to long-term memory (MEMORY.md). " +
            "Use when the user explicitly asks to remember something, or when you learn " +
            "something clearly important about the user's preferences, facts, or ongoing work. " +
            "Do NOT use for trivial details — only save things worth recalling in future sessions.",
          parameters: Type.Object({
            content: Type.String({
              description:
                "What to remember. Be specific and self-contained so the fact is useful without context. " +
                "Example: 'User prefers TypeScript over JavaScript for all new projects'",
            }),
            category: Type.Optional(
              Type.Union(
                MEMORY_CATEGORIES.map((c) => Type.Literal(c)),
                {
                  description:
                    "Category: 'fact' (objective info), 'preference' (user likes/dislikes), " +
                    "'note' (general note), 'event' (something that happened), 'skill' (capability or tool). " +
                    "Default: 'note'",
                },
              ),
            ),
          }),
          execute: async (_toolCallId, params) => {
            try {
              await fs.mkdir(memDir, { recursive: true });

              // Create MEMORY.md with a header if it doesn't exist yet
              if (!fsSync.existsSync(memFile)) {
                await fs.writeFile(
                  memFile,
                  "# Memory\n\n_Auto-maintained by the agent. Review periodically._\n\n",
                  "utf-8",
                );
              }

              const category: MemoryCategory = (params.category as MemoryCategory) ?? "note";
              const date = new Date().toISOString().split("T")[0];
              const line = `- [${category}] ${params.content as string} (${date})\n`;

              await fs.appendFile(memFile, line, "utf-8");

              return {
                content: [
                  {
                    type: "text" as const,
                    text: `Saved to memory [${category}]: "${(params.content as string).slice(0, 100)}"`,
                  },
                ],
                details: {
                  action: "saved",
                  category,
                  path: memFile,
                },
              };
            } catch (err) {
              return {
                content: [
                  {
                    type: "text" as const,
                    text: `Failed to save memory: ${String(err)}`,
                  },
                ],
                details: {
                  action: "error",
                  path: memFile,
                  error: String(err),
                },
                isError: true,
              };
            }
          },
        };
      },
      { names: ["memory_save"] },
    );

    api.registerCli(
      ({ program }) => {
        api.runtime.tools.registerMemoryCli(program);
      },
      { commands: ["memory"] },
    );
  },
};

export default memoryCorePlugin;
