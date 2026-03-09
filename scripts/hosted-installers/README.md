# Temporary self-hosted installers

These files are for testing a one-line install before you publish Penguins to
npm or stand up the official `penguins.ai` installer host.

They default to a Git-based install:

- clone or update `https://github.com/penguins/penguins.git`
- install dependencies with `pnpm` through `corepack`, `pnpm`, or `npx`
- run `ui:build` and `build`
- install a local `penguins` wrapper

They do not try to provision Node for you. For now, they expect:

- Git
- Node.js 22.12+

The scripts prefer `corepack`, but they can also run with `pnpm` or `npx`.

## Host on your own domain

Serve these two files over HTTPS from any domain you already own:

- `install.sh`
- `install.ps1`

Example commands once hosted:

```bash
curl -fsSL https://your-domain.example/install.sh | bash
```

```powershell
iwr -useb https://your-domain.example/install.ps1 | iex
```

## Useful overrides

Shell:

```bash
curl -fsSL https://your-domain.example/install.sh | bash -s -- --branch main --git-dir "$HOME/penguins-test" --no-onboard
```

PowerShell:

```powershell
& ([scriptblock]::Create((iwr -useb https://your-domain.example/install.ps1))) -Branch main -GitDir "$HOME\penguins-test" -NoOnboard
```

Environment variables:

- `PENGUINS_GIT_REPO`
- `PENGUINS_GIT_BRANCH`
- `PENGUINS_GIT_DIR`
- `PENGUINS_BIN_DIR`
- `PENGUINS_GIT_UPDATE=0`
- `PENGUINS_NO_ONBOARD=1`
- `PENGUINS_DRY_RUN=1`
