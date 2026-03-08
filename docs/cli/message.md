---
summary: "Advanced outbound command for custom integrations and low-level delivery workflows"
read_when:
  - Adding or modifying message CLI actions
  - Changing outbound channel behavior
title: "message"
---

# `penguins message`

`penguins message` is the advanced outbound command surface for custom
integrations and low-level delivery workflows.

It is not required for the built-in Penguins app. The supported built-in
surfaces are:

- browser chat
- the Control UI
- the CLI

For normal use, prefer:

- [Control UI](/web/control-ui) or [WebChat](/web/webchat) for chat
- `penguins agent --message ...` for one-off CLI runs
- `penguins dashboard`, `penguins status`, and `penguins logs` for operator workflows

## When to use it

- You are building a custom integration around the Gateway.
- You want an explicit outbound send from a script or operator workflow.
- You are testing provider- or plugin-specific delivery behavior.

## Discover the current surface locally

Because this command depends on the current compatibility layer and any installed
plugins, local help is the source of truth:

```bash
penguins message --help
penguins message send --help
penguins message broadcast --help
```

The exact channel ids, targets, and subcommands available depend on what is
configured locally and which plugins are installed.

## Common command shape

```bash
penguins message <subcommand> [flags]
```

## Common flags

- `--channel <name>`
- `--account <id>`
- `--target <dest>`
- `--targets <dest>` (repeat; broadcast only)
- `--json`
- `--dry-run`
- `--verbose`

## Typical usage patterns

- `send`: send a direct outbound message to an explicit target
- `broadcast`: send to multiple explicit targets
- `poll`, `react`, `read`, `edit`, `delete`, and other subcommands: available when the configured integration supports them
- provider-specific admin or moderation commands: only when the relevant plugin/provider exposes them

## Stability note

This command is intentionally lower-level than the built-in app surfaces. Expect
provider-specific flags and subcommands to evolve as compatibility code is
removed or moved behind plugins.

## Examples

See the currently supported local shape:

```bash
penguins message --help
penguins message send --help
```

Send a test payload to an explicit integration target:

```bash
penguins message send \
  --channel <integration> \
  --target <target> \
  --message "hi"
```

Run a dry-run broadcast:

```bash
penguins message broadcast \
  --channel <integration> \
  --targets <target-a> \
  --targets <target-b> \
  --message "scheduled update" \
  --dry-run
```
