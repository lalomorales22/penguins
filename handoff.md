# Penguins Rebrand - Phase 4 Handoff

## Current Status

**Phases 1, 2, and 3 are COMPLETE** ✅

The rebrand from "Penguins" to "Penguins" is now 75% complete. All core infrastructure, extension packages, mobile apps, and system integration have been successfully rebranded.

---

## What Was Completed

### Phase 1: Core Infrastructure ✅
- Type system: `PenguinsConfig` → `PenguinsConfig`
- File renames: `types.penguins.ts`, `penguins-root.ts`, `tmp-penguins-dir.ts` → penguins equivalents
- CLI binary: `penguins.mjs` → `penguins.mjs` (with `penguins` alias preserved)
- Package name: `penguins` → `penguins`
- Config locations: `~/.penguins/` → `~/.penguins/`
- Environment variables: All `PENGUINS_*` with fallback to `OPENCLAW_*`

### Phase 2: Extension Ecosystem ✅
- All 38 extensions updated: `@penguins/*` → `@penguins/*`
- Plugin manifests renamed: `penguins.plugin.json` → `penguins.plugin.json` (36 files)
- No remaining `@penguins` references in extensions
- Build successful

### Phase 3: Mobile Apps & System Integration ✅

**iOS:**
- `project.yml`: Bundle IDs `ai.penguins.ios` → `ai.penguins.ios`, app name `Penguins` → `Penguins`
- Bonjour service: `_penguins-gw._tcp` → `_penguins-gw._tcp`
- `Info.plist`: Display name, usage descriptions updated

**Android:**
- `build.gradle.kts`: Namespace and applicationId `ai.penguins.android` → `ai.penguins.android`
- Package directories renamed: `ai/penguins/android` → `ai/penguins/android`
- Resources updated: app name, theme, network security config

**macOS:**
- `Package.swift`: Package name, targets, products updated
- Source directories renamed: `Penguins*` → `Penguins*`
- `Info.plist`: Bundle ID `ai.penguins.mac` → `ai.penguins.mac`, URL scheme `penguins://` → `penguins://`
- `Constants.swift`: All defaults keys, launchd labels updated

**Shared Framework:**
- Renamed: `PenguinsKit/` → `PenguinsKit/`
- Libraries renamed: `PenguinsKit`, `PenguinsProtocol`, `PenguinsChatUI` → `PenguinsKit`, `PenguinsProtocol`, `PenguinsChatUI`

**System Services:**
- systemd: `penguins-auth-monitor.*` → `penguins-auth-monitor.*`
- Podman: `penguins.podman.env` → `penguins.podman.env`, container.in, run script

---

## Phase 4: Documentation & Public Assets

### Goal
Update all documentation, README files, logos, and external references from Penguins to Penguins.

### Where to Start

**Primary Directory:** `docs/` and root documentation files

### Step-by-Step Approach

#### Step 1: Root Documentation Files
Update these files in the repo root:

1. `README.md`
   - Replace `penguins` → `penguins` (CLI commands)
   - Replace `Penguins` → `Penguins` (product name)
   - Update npm install commands: `npm install -g penguins` → `npm install -g penguins`
   - Update badge URLs if any

2. `CONTRIBUTING.md`
   - Update all references to the project name

3. `SECURITY.md`
   - Update contact information and project name

4. `CHANGELOG.md`
   - Add rebrand note at top (keep all history)

5. `AGENTS.md`
   - Update project name references

#### Step 2: Documentation Site (`docs/`)

**Key files to update:**

1. `docs/docs.json` (Mintlify config)
   - Update `name`: `Penguins` → `Penguins`
   - Update GitHub links: `github.com/penguins/penguins` → `github.com/penguins/penguins`
   - Update Discord invite

2. All `docs/**/*.md` files (100+ files)
   - Replace `penguins` → `penguins` (commands)
   - Replace `Penguins` → `Penguins` (product)
   - Replace `docs.penguins.ai` → `docs.penguins.ai`
   - Replace `https://penguins.ai` → `https://penguins.ai`
   - Update installation commands
   - Update example commands
   - Update GitHub URLs

**Specific doc files to check:**
- `docs/start/penguins.md` → rename to `docs/start/penguins.md`
- `docs/tools/clawhub.md`
- `docs/refactor/clawnet.md`
- `docs/gateway/doctor.md` (migration instructions)
- `docs/install/*.md`
- `docs/configuration/*.md`
- `docs/channels/**/*.md`
- `docs/reference/RELEASING.md`

#### Step 3: Chinese Documentation
- `docs/zh-CN/**/*.md` (or regenerate via i18n pipeline)
- `docs/.i18n/glossary.zh-CN.json`

#### Step 4: Logo & Brand Assets
- Rename `docs/assets/penguins-logo-text.png` → `docs/assets/penguins-logo-text.png`
- Rename `docs/assets/penguins-logo-text-dark.png` → `docs/assets/penguins-logo-text-dark.png`
- Rename `docs/whatsapp-penguins.jpg` → `docs/whatsapp-penguins.jpg`
- Update all image references in docs

### Verification Commands

```bash
# Check for remaining penguins references in docs
grep -r "penguins" docs/ --include="*.md" --include="*.json" | grep -v "zh-CN" | head -20

# Check for remaining Penguins references in docs
grep -r "Penguins" docs/ --include="*.md" --include="*.json" | grep -v "zh-CN" | head -20

# Check root documentation files
grep -l "penguins\|Penguins" *.md

# Build docs (if Mintlify is configured)
cd docs && mintlify dev
```

---

## Important Notes

### What NOT to Touch Yet
The following are deferred to Phase 5:
- CI/CD workflows (`.github/workflows/` - you mentioned these were deleted)
- External services (Discord, website, etc.)
- npm publishing (requires securing npm package names)
- GitHub repository migration

### Backwards Compatibility Maintained
- All old environment variables still work
- Old config directories are recognized as legacy
- CLI `penguins` command still works (alias to `penguins`)

---

## Quick Reference

### Changed So Far
| Old | New |
|-----|-----|
| `penguins` (npm) | `penguins` |
| `@penguins/*` | `@penguins/*` |
| `~/.penguins/` | `~/.penguins/` |
| `penguins.json` | `penguins.json` |
| `ai.penguins.ios` | `ai.penguins.ios` |
| `ai.penguins.android` | `ai.penguins.android` |
| `ai.penguins.mac` | `ai.penguins.mac` |
| `PenguinsKit` | `PenguinsKit` |
| `_penguins-gw._tcp` | `_penguins-gw._tcp` |

### Files You Will Touch in Phase 4
```
README.md
CONTRIBUTING.md
SECURITY.md
CHANGELOG.md
AGENTS.md
docs/docs.json
docs/**/*.md (100+ files)
docs/assets/* (logo files)
```

---

## Next Steps

1. **Read this handoff** to understand what's been done
2. **Check `tasks.md`** for the full Phase 4 checklist
3. **Start with root docs**: Update `README.md`, `CONTRIBUTING.md`, etc.
4. **Move to docs/**: Update `docs.json` then all `.md` files
5. **Rename logo assets** in `docs/assets/`
6. **Build docs** to verify
7. **Check for any missed references**

---

## Full Context

For complete rebrand plan and all phases, see:
- **`tasks.md`** - Master rebrand implementation plan with all 5 phases
- **`handoff.md`** (this file) - Current status and next steps

---

_Last Updated: 2026-02-15_  
_Completed: Phases 1, 2, 3_  
_Next: Phase 4 - Documentation_
