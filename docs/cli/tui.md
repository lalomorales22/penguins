---
summary: "CLI reference for `penguins tui` (terminal UI connected to the Gateway)"
read_when:
  - You want a terminal UI for the Gateway (remote-friendly)
  - You want to pass url/token/session from scripts
title: "tui"
---

# `penguins tui`

Open the terminal UI connected to the Gateway.

Related:

- TUI guide: [TUI](/web/tui)

## Examples

```bash
penguins tui
penguins tui --url ws://127.0.0.1:18789 --token <token>
penguins tui --session main --deliver
```
