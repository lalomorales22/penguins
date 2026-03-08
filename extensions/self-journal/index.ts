/**
 * Penguins Self-Journal Extension
 *
 * Gives the AI a persistent identity file (SELF.md) that accumulates across conversations.
 * SELF.md lives in the memory directory so it's automatically indexed and recalled.
 *
 * What this does:
 *   - Creates SELF.md with a template on first run if it doesn't exist
 *   - After every N completed conversations, appends a dated session summary to SELF.md
 *   - Registers a `memory_self_reflect` tool the agent can call to write a reflection now
 *
 * SELF.md placement: {workspaceDir}/memory/SELF.md
 * The memory system automatically indexes all *.md files in the memory directory,
 * so no extra wiring is needed for the agent to recall its self-model.
 */

import type { PenguinsPluginApi } from "penguins/plugin-sdk";
import { Type } from "@sinclair/typebox";
import fsSync from "node:fs";
import fs from "node:fs/promises";
import path from "node:path";

// ─── Types ───────────────────────────────────────────────────────────────────

type SelfJournalConfig = {
  reflectEveryNTurns?: number;
  selfPath?: string;
};

// ─── Constants ───────────────────────────────────────────────────────────────

const DEFAULT_REFLECT_EVERY_N_TURNS = 10;

const SELF_MD_TEMPLATE = `# Self

_This file is maintained by the self-journal extension.
It is automatically indexed as part of the agent's memory.
The agent updates it periodically to reflect what it has learned._

Last updated: ${new Date().toISOString().split("T")[0]}

## What I know about myself

- I prefer to be concise and direct
- I ask clarifying questions before making large changes
- I track ongoing work to maintain continuity across conversations

## What I know about the user

- (Will be filled in as I learn more)

## What I've been working on recently

- (Will be filled in after conversations)

## My patterns and preferences

- (Will be filled in over time)
`;

// ─── Helpers ─────────────────────────────────────────────────────────────────

function resolveSelfPath(workspaceDir: string | undefined, customPath?: string): string | null {
  if (customPath?.trim()) {
    return customPath.trim();
  }
  if (!workspaceDir) {
    return null;
  }
  return path.join(workspaceDir, "memory", "SELF.md");
}

async function ensureSelfMd(selfPath: string): Promise<void> {
  const dir = path.dirname(selfPath);
  await fs.mkdir(dir, { recursive: true });
  if (!fsSync.existsSync(selfPath)) {
    await fs.writeFile(selfPath, SELF_MD_TEMPLATE, "utf-8");
  }
}

function extractTextFromMessages(messages: unknown[]): string {
  const lines: string[] = [];
  for (const msg of messages) {
    if (!msg || typeof msg !== "object") continue;
    const m = msg as Record<string, unknown>;
    if (m.role !== "user" && m.role !== "assistant") continue;
    const role = m.role === "user" ? "User" : "Assistant";
    if (typeof m.content === "string" && m.content.trim()) {
      lines.push(`${role}: ${m.content.trim().slice(0, 200)}`);
    } else if (Array.isArray(m.content)) {
      for (const block of m.content) {
        if (
          block &&
          typeof block === "object" &&
          (block as Record<string, unknown>).type === "text" &&
          typeof (block as Record<string, unknown>).text === "string"
        ) {
          const text = ((block as Record<string, unknown>).text as string).trim();
          if (text) {
            lines.push(`${role}: ${text.slice(0, 200)}`);
            break; // one text block per turn is enough for context
          }
        }
      }
    }
  }
  return lines.slice(-6).join("\n"); // last 3 exchanges
}

async function appendSessionNote(selfPath: string, sessionSummary: string): Promise<void> {
  const date = new Date().toISOString().split("T")[0];
  const note = `\n## Session note — ${date}\n\n${sessionSummary}\n`;
  await fs.appendFile(selfPath, note, "utf-8");
}

// ─── Plugin ──────────────────────────────────────────────────────────────────

let turnsSinceReflect = 0;

const selfJournalPlugin = {
  id: "self-journal",
  name: "Self Journal",
  description: "Gives the AI a persistent self-model (SELF.md) that grows with experience",
  kind: "utility",

  register(api: PenguinsPluginApi) {
    const cfg = (api.config ?? {}) as SelfJournalConfig;
    const reflectEvery = cfg.reflectEveryNTurns ?? DEFAULT_REFLECT_EVERY_N_TURNS;

    // ── Lifecycle: ensure SELF.md exists before each session ────────────────
    api.on("before_agent_start", async (_event, ctx) => {
      const selfPath = resolveSelfPath(ctx.workspaceDir, cfg.selfPath);
      if (!selfPath) return;
      try {
        await ensureSelfMd(selfPath);
      } catch (err) {
        api.logger.warn(`self-journal: could not ensure SELF.md: ${String(err)}`);
      }
    });

    // ── Lifecycle: after session ends, maybe append a note ───────────────────
    api.on("agent_end", async (event, ctx) => {
      if (!event.success) return;

      const selfPath = resolveSelfPath(ctx.workspaceDir, cfg.selfPath);
      if (!selfPath) return;

      turnsSinceReflect++;
      if (turnsSinceReflect < reflectEvery) return;
      turnsSinceReflect = 0;

      try {
        await ensureSelfMd(selfPath);
        const snippet = extractTextFromMessages((event.messages ?? []) as unknown[]);
        const summary = snippet
          ? `Completed a conversation. Recent exchange:\n\n${snippet}\n\n_Reflection: Review this and update the sections above as needed._`
          : `Completed a conversation (no text preview available). Review and update the sections above.`;
        await appendSessionNote(selfPath, summary);
        api.logger.info("self-journal: appended session note to SELF.md");
      } catch (err) {
        api.logger.warn(`self-journal: could not write session note: ${String(err)}`);
      }
    });

    // ── Tool: memory_self_reflect ────────────────────────────────────────────
    // The agent can call this mid-conversation to write a deliberate reflection.
    api.registerTool(
      (ctx) => {
        const selfPath = resolveSelfPath(ctx.workspaceDir, cfg.selfPath);
        if (!selfPath) return null;

        return {
          name: "memory_self_reflect",
          label: "Self Reflection",
          description:
            "Write a reflection about what you learned in this conversation to your persistent self-model (SELF.md). " +
            "Use this when the user shares something important about themselves or their preferences, " +
            "or when you notice something significant about your own patterns. " +
            "The reflection is appended to SELF.md and will be recalled in future sessions.",
          parameters: Type.Object({
            reflection: Type.String({
              description:
                "What you learned or want to remember. Written in first person. " +
                "Be specific: prefer 'User prefers TypeScript over JS' to 'User has preferences'.",
            }),
            section: Type.Optional(
              Type.Union(
                [
                  Type.Literal("self"),
                  Type.Literal("user"),
                  Type.Literal("work"),
                  Type.Literal("patterns"),
                ],
                {
                  description:
                    "Which section to update: 'self' (about me), 'user' (about the user), " +
                    "'work' (recent work), 'patterns' (habits and preferences). Default: 'user'.",
                },
              ),
            ),
          }),
          execute: async (_toolCallId, params) => {
            try {
              await ensureSelfMd(selfPath);

              const sectionLabel: Record<string, string> = {
                self: "What I know about myself",
                user: "What I know about the user",
                work: "What I've been working on recently",
                patterns: "My patterns and preferences",
              };
              const section = (params.section as string | undefined) ?? "user";
              const label = sectionLabel[section] ?? "What I know about the user";
              const date = new Date().toISOString().split("T")[0];
              const entry = `\n## Reflection — ${label} (${date})\n\n- ${params.reflection as string}\n`;

              await fs.appendFile(selfPath, entry, "utf-8");

              return {
                content: [
                  {
                    type: "text" as const,
                    text: `Saved to SELF.md (section: ${label}): "${(params.reflection as string).slice(0, 80)}..."`,
                  },
                ],
                details: {
                  action: "saved",
                  section,
                  label,
                  path: selfPath,
                },
              };
            } catch (err) {
              return {
                content: [
                  {
                    type: "text" as const,
                    text: `Failed to write reflection: ${String(err)}`,
                  },
                ],
                details: {
                  action: "error",
                  path: selfPath,
                  error: String(err),
                },
                isError: true,
              };
            }
          },
        };
      },
      { names: ["memory_self_reflect"] },
    );
  },
};

export default selfJournalPlugin;
