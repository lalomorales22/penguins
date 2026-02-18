---
summary: "CLI reference for `penguins reset` (reset local state/config)"
read_when:
  - You want to wipe local state while keeping the CLI installed
  - You want a dry-run of what would be removed
title: "reset"
---

# `penguins reset`

Reset local config/state (keeps the CLI installed).

```bash
penguins reset
penguins reset --dry-run
penguins reset --scope config+creds+sessions --yes --non-interactive
```
