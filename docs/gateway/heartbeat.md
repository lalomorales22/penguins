---
summary: "Heartbeat runs background agent turns on a schedule."
read_when:
  - Adjusting heartbeat cadence or messaging
  - Deciding between heartbeat and cron for scheduled tasks
title: "Heartbeat"
---

# Heartbeat (Gateway)

> **Heartbeat vs Cron?** See [Cron vs Heartbeat](/automation/cron-vs-heartbeat) for guidance on when to use each.

Heartbeat runs periodic agent turns in the main session so the model can surface
anything that needs attention without requiring a live browser tab or manual CLI
run.

Troubleshooting: [/automation/troubleshooting](/automation/troubleshooting)

## Quick start

1. Leave heartbeats enabled (default is `30m`, or `1h` for Anthropic OAuth/setup-token) or set your own cadence.
2. Create a tiny `HEARTBEAT.md` checklist in the agent workspace (optional but recommended).
3. For the built-in Penguins app, set `target: "none"` so heartbeat stays an internal background run.
4. Open the browser chat, sessions view, or logs when you want to inspect what the heartbeat surfaced.
5. Optional: enable heartbeat reasoning delivery for transparency.
6. Optional: restrict heartbeats to active hours (local time).

Example config:

```json5
{
  agents: {
    defaults: {
      heartbeat: {
        every: "30m",
        target: "none",
        // activeHours: { start: "08:00", end: "24:00" },
        // includeReasoning: true,
      },
    },
  },
}
```

## Built-in app guidance

The supported built-in Penguins surfaces are:

- browser chat
- the Control UI
- the CLI

That means heartbeat is best treated as a background automation feature, not a
built-in push delivery surface.

- Use `target: "none"` for the core app.
- Review results in chat history, sessions, logs, or the Control UI.
- If you configure custom outbound integrations, `target: "last"` or an explicit
  channel id still exists as an advanced path, but that is not the core product
  flow anymore.

## Defaults

- Interval: `30m` (or `1h` when Anthropic OAuth/setup-token is the detected auth mode). Set `agents.defaults.heartbeat.every` or per-agent `agents.list[].heartbeat.every`; use `0m` to disable.
- Prompt body (configurable via `agents.defaults.heartbeat.prompt`):
  `Read HEARTBEAT.md if it exists (workspace context). Follow it strictly. Do not infer or repeat old tasks from prior chats. If nothing needs attention, reply HEARTBEAT_OK.`
- The heartbeat prompt is sent verbatim as the user message. The system prompt includes a Heartbeat section and the run is flagged internally.
- Active hours (`heartbeat.activeHours`) are checked in the configured timezone. Outside the window, heartbeats are skipped until the next tick inside the window.

## What the heartbeat prompt is for

The default prompt is intentionally broad:

- Background tasks: review follow-ups, reminders, queued work, and anything urgent.
- Human check-in: do a lightweight “anything you need?” pass during active hours when nothing else is pending.

If you want a heartbeat to do something specific, set `agents.defaults.heartbeat.prompt`
or `agents.list[].heartbeat.prompt` to a custom body.

## Response contract

- If nothing needs attention, reply with `HEARTBEAT_OK`.
- During heartbeat runs, Penguins treats `HEARTBEAT_OK` as an ack when it appears at the start or end of the reply.
- The token is stripped and the reply is dropped if the remaining content is less than or equal to `ackMaxChars` (default `300`).
- If `HEARTBEAT_OK` appears in the middle of a reply, it is not treated specially.
- For alerts, do not include `HEARTBEAT_OK`; return only the alert text.

Outside heartbeats, stray `HEARTBEAT_OK` at the start/end of a message is stripped
and logged; a message that is only `HEARTBEAT_OK` is dropped.

## Config

```json5
{
  agents: {
    defaults: {
      heartbeat: {
        every: "30m", // default: 30m (0m disables)
        model: "anthropic/claude-opus-4-6",
        includeReasoning: false,
        target: "none", // recommended built-in setting; advanced: last | <channel id>
        to: "custom-target", // optional advanced override for custom integrations
        accountId: "ops-bot", // optional advanced account id
        prompt: "Read HEARTBEAT.md if it exists (workspace context). Follow it strictly. Do not infer or repeat old tasks from prior chats. If nothing needs attention, reply HEARTBEAT_OK.",
        ackMaxChars: 300,
      },
    },
  },
}
```

### Scope and precedence

- `agents.defaults.heartbeat` sets global heartbeat behavior.
- `agents.list[].heartbeat` merges on top; if any agent has a heartbeat block, only those agents run heartbeats.
- Lower-level channel visibility overrides still exist for advanced custom integrations, but they are not required for the built-in app.

### Per-agent heartbeats

If any `agents.list[]` entry includes a `heartbeat` block, only those agents run
heartbeats. The per-agent block merges on top of `agents.defaults.heartbeat`.

Example: two agents, only the second agent runs heartbeats.

```json5
{
  agents: {
    defaults: {
      heartbeat: {
        every: "30m",
        target: "none",
      },
    },
    list: [
      { id: "main", default: true },
      {
        id: "ops",
        heartbeat: {
          every: "1h",
          target: "none",
          prompt: "Read HEARTBEAT.md if it exists (workspace context). Follow it strictly. Do not infer or repeat old tasks from prior chats. If nothing needs attention, reply HEARTBEAT_OK.",
        },
      },
    ],
  },
}
```

### Active hours example

Restrict heartbeats to business hours in a specific timezone:

```json5
{
  agents: {
    defaults: {
      heartbeat: {
        every: "30m",
        target: "none",
        activeHours: {
          start: "09:00",
          end: "22:00",
          timezone: "America/New_York",
        },
      },
    },
  },
}
```

Outside this window, heartbeats are skipped until the next tick inside the window.

### Field notes

- `every`: heartbeat interval (duration string; default unit = minutes).
- `model`: optional model override for heartbeat runs (`provider/model`).
- `includeReasoning`: when enabled, also deliver the separate `Reasoning:` message when available.
- `session`:
  - `main` (default): agent main session.
  - explicit session key: copy from `penguins sessions --json` or the [sessions CLI](/cli/sessions).
  - session key formats: see [Sessions](/concepts/session).
- `target`:
  - `none`: recommended for the built-in app; run the heartbeat without outbound delivery.
  - `last`: use the last deliverable external destination from session state if one exists.
  - explicit channel id: advanced custom integration hook.
- `to`: optional advanced recipient override for a custom integration target.
- `accountId`: optional advanced account id. If it does not match the resolved integration target, delivery is skipped.
- `prompt`: overrides the default prompt body (not merged).
- `ackMaxChars`: max chars allowed after `HEARTBEAT_OK` before delivery.
- `activeHours`: restricts heartbeat runs to a time window with `start`, `end`, and optional `timezone`.

## Delivery behavior

- Heartbeats run in the agent’s main session by default (`agent:<id>:<mainKey>`), or `global` when `session.scope = "global"`.
- `session` only affects the run context; delivery is controlled by `target` and `to`.
- With `target: "none"`, the run still happens and the results stay in session history.
- With `target: "last"`, Penguins only delivers if that session has a valid deliverable external destination recorded.
- To deliver to a specific custom integration destination, set `target` + `to`.
- If the main queue is busy, the heartbeat is skipped and retried later.
- If `target` resolves to no external destination, the run still happens but no outbound message is sent.
- Heartbeat-only replies do not keep the session alive; the last `updatedAt` is restored so idle expiry behaves normally.

## Visibility controls

By default, `HEARTBEAT_OK` acknowledgments are suppressed while real alert
content is kept. This keeps browser chat and the Control UI readable.

- `showOk`: show pure OK acknowledgments.
- `showAlerts`: show non-OK heartbeat content.
- `useIndicator`: emit status indicators for UI surfaces.

If you are only using the built-in web chat, Control UI, and CLI surfaces, the
default behavior is usually what you want.

## HEARTBEAT.md (optional)

If a `HEARTBEAT.md` file exists in the workspace, the default prompt tells the
agent to read it. Think of it as your heartbeat checklist: small, stable, and
safe to include every 30 minutes.

If `HEARTBEAT.md` exists but is effectively empty (only blank lines and markdown
headers like `# Heading`), Penguins skips the heartbeat run to save API calls.
If the file is missing, the heartbeat still runs and the model decides what to do.

Keep it tiny (short checklist or reminders) to avoid prompt bloat.

Example `HEARTBEAT.md`:

```md
# Heartbeat checklist

- Quick scan: anything urgent in inboxes?
- If it’s daytime, do a lightweight check-in if nothing else is pending.
- If a task is blocked, write down what is missing and ask later.
```

### Can the agent update `HEARTBEAT.md`?

Yes. It is a normal file in the agent workspace, so you can ask the assistant to
update it like any other file.

Safety note: do not put secrets into `HEARTBEAT.md`; it becomes part of the
prompt context.

## Manual wake (on-demand)

You can enqueue a system event and trigger an immediate heartbeat with:

```bash
penguins system event --text "Check for urgent follow-ups" --mode now
```

If multiple agents have `heartbeat` configured, a manual wake runs each of those
agent heartbeats immediately.

Use `--mode next-heartbeat` to wait for the next scheduled tick.

## Reasoning delivery (optional)

By default, heartbeats deliver only the final answer payload.

If you want transparency, enable:

- `agents.defaults.heartbeat.includeReasoning: true`

When enabled, heartbeats also deliver a separate `Reasoning:` message when available.

## Cost awareness

Heartbeats run full agent turns. Shorter intervals burn more tokens. Keep
`HEARTBEAT.md` small and consider a cheaper `model` or `target: "none"` if you
only want internal state updates.
