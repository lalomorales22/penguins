---
summary: "CLI reference for `penguins agents` (list/add/delete/set identity)"
read_when:
  - You want multiple isolated agents (workspaces + routing + auth)
title: "agents"
---

# `penguins agents`

Manage isolated agents (workspaces + auth + routing).

Related:

- Multi-agent routing: [Multi-Agent Routing](/concepts/multi-agent)
- Agent workspace: [Agent workspace](/concepts/agent-workspace)

## Examples

```bash
penguins agents list
penguins agents add work --workspace ~/.penguins/workspace-work
penguins agents set-identity --workspace ~/.penguins/workspace --from-identity
penguins agents set-identity --agent main --avatar avatars/penguins.png
penguins agents delete work
```

## Identity files

Each agent workspace can include an `IDENTITY.md` at the workspace root:

- Example path: `~/.penguins/workspace/IDENTITY.md`
- `set-identity --from-identity` reads from the workspace root (or an explicit `--identity-file`)

Avatar paths resolve relative to the workspace root.

## Set identity

`set-identity` writes fields into `agents.list[].identity`:

- `name`
- `theme`
- `emoji`
- `avatar` (workspace-relative path, http(s) URL, or data URI)

Load from `IDENTITY.md`:

```bash
penguins agents set-identity --workspace ~/.penguins/workspace --from-identity
```

Override fields explicitly:

```bash
penguins agents set-identity --agent main --name "Penguins" --emoji "🦞" --avatar avatars/penguins.png
```

Config sample:

```json5
{
  agents: {
    list: [
      {
        id: "main",
        identity: {
          name: "Penguins",
          theme: "space lobster",
          emoji: "🦞",
          avatar: "avatars/penguins.png",
        },
      },
    ],
  },
}
```
