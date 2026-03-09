#!/usr/bin/env bash
set -euo pipefail

DEFAULT_REPO_URL="https://github.com/penguins/penguins.git"
DEFAULT_BRANCH="main"
DEFAULT_GIT_DIR="${HOME}/penguins"
DEFAULT_BIN_DIR="${HOME}/.local/bin"
DEFAULT_PNPM_VERSION="10.23.0"

REPO_URL="${PENGUINS_GIT_REPO:-$DEFAULT_REPO_URL}"
BRANCH="${PENGUINS_GIT_BRANCH:-$DEFAULT_BRANCH}"
GIT_DIR="${PENGUINS_GIT_DIR:-$DEFAULT_GIT_DIR}"
BIN_DIR="${PENGUINS_BIN_DIR:-$DEFAULT_BIN_DIR}"
GIT_UPDATE="${PENGUINS_GIT_UPDATE:-1}"
DRY_RUN="${PENGUINS_DRY_RUN:-0}"
ONBOARD=1

if [[ "${PENGUINS_NO_ONBOARD:-0}" == "1" ]]; then
  ONBOARD=0
fi

usage() {
  cat <<'EOF'
Temporary Penguins git installer

This script clones Penguins from GitHub, builds it locally, and writes a
wrapper to ~/.local/bin/penguins by default. It is meant for self-hosted
testing on your own HTTPS domain before npm publish exists.

Usage:
  curl -fsSL https://your-domain.example/install.sh | bash
  curl -fsSL https://your-domain.example/install.sh | bash -s -- --no-onboard

Options:
  --repo-url <url>    Git repository to clone
  --branch <name>     Git branch to clone/update
  --git-dir <path>    Checkout directory
  --bin-dir <path>    Wrapper install directory
  --no-git-update     Skip git pull for an existing checkout
  --onboard           Run `penguins onboard --install-daemon` after install
  --no-onboard        Skip onboarding
  --dry-run           Print actions without applying changes
  --help              Show this help

Environment variables:
  PENGUINS_GIT_REPO
  PENGUINS_GIT_BRANCH
  PENGUINS_GIT_DIR
  PENGUINS_BIN_DIR
  PENGUINS_GIT_UPDATE=0
  PENGUINS_NO_ONBOARD=1
  PENGUINS_DRY_RUN=1

Requirements:
  - Git
  - Node.js 22.12+
EOF
}

log() {
  printf '==> %s\n' "$*"
}

warn() {
  printf 'warning: %s\n' "$*" >&2
}

fail() {
  printf 'error: %s\n' "$*" >&2
  exit 1
}

print_command() {
  local arg
  printf '+'
  for arg in "$@"; do
    printf ' %q' "$arg"
  done
  printf '\n'
}

run() {
  if [[ "$DRY_RUN" == "1" ]]; then
    print_command "$@"
    return 0
  fi
  "$@"
}

require_command() {
  local name="$1"
  command -v "$name" >/dev/null 2>&1 || fail "missing required command: $name"
}

require_node() {
  local version major minor
  version="$(node -p 'process.versions.node')"
  major="${version%%.*}"
  minor="${version#*.}"
  minor="${minor%%.*}"
  if (( major < 22 || (major == 22 && minor < 12) )); then
    fail "Node.js 22.12+ is required; found $version"
  fi
}

resolve_pnpm_runner() {
  if command -v corepack >/dev/null 2>&1; then
    PNPM_RUNNER=(corepack pnpm)
    return
  fi
  if command -v pnpm >/dev/null 2>&1; then
    PNPM_RUNNER=(pnpm)
    return
  fi
  if command -v npx >/dev/null 2>&1; then
    PNPM_RUNNER=(npx --yes "pnpm@${DEFAULT_PNPM_VERSION}")
    return
  fi
  fail "missing pnpm runner: install corepack, pnpm, or npm/npx"
}

run_pnpm() {
  run "${PNPM_RUNNER[@]}" --dir "$GIT_DIR" "$@"
}

write_wrapper() {
  local wrapper_path="$BIN_DIR/penguins"
  if [[ "$DRY_RUN" == "1" ]]; then
    log "Would write wrapper to $wrapper_path"
    return 0
  fi

  mkdir -p "$BIN_DIR"
  cat >"$wrapper_path" <<EOF
#!/usr/bin/env sh
exec node "$GIT_DIR/penguins.mjs" "\$@"
EOF
  chmod +x "$wrapper_path"
}

while [[ $# -gt 0 ]]; do
  case "$1" in
    --repo-url)
      [[ $# -ge 2 ]] || fail "missing value for --repo-url"
      REPO_URL="$2"
      shift 2
      ;;
    --branch)
      [[ $# -ge 2 ]] || fail "missing value for --branch"
      BRANCH="$2"
      shift 2
      ;;
    --git-dir|--dir)
      [[ $# -ge 2 ]] || fail "missing value for --git-dir"
      GIT_DIR="$2"
      shift 2
      ;;
    --bin-dir)
      [[ $# -ge 2 ]] || fail "missing value for --bin-dir"
      BIN_DIR="$2"
      shift 2
      ;;
    --no-git-update)
      GIT_UPDATE=0
      shift
      ;;
    --onboard)
      ONBOARD=1
      shift
      ;;
    --no-onboard)
      ONBOARD=0
      shift
      ;;
    --dry-run)
      DRY_RUN=1
      shift
      ;;
    --help|-h)
      usage
      exit 0
      ;;
    *)
      fail "unknown argument: $1"
      ;;
  esac
done

require_command git
require_command node
require_node
resolve_pnpm_runner

export SHARP_IGNORE_GLOBAL_LIBVIPS="${SHARP_IGNORE_GLOBAL_LIBVIPS:-1}"

if [[ -d "$GIT_DIR" && ! -d "$GIT_DIR/.git" ]]; then
  fail "checkout directory exists but is not a git repo: $GIT_DIR"
fi

if [[ ! -d "$GIT_DIR/.git" ]]; then
  log "Cloning Penguins into $GIT_DIR"
  run git clone --branch "$BRANCH" --single-branch "$REPO_URL" "$GIT_DIR"
else
  log "Using existing checkout at $GIT_DIR"
  run git -C "$GIT_DIR" checkout "$BRANCH"
  if [[ "$GIT_UPDATE" != "0" ]]; then
    run git -C "$GIT_DIR" fetch origin "$BRANCH"
    run git -C "$GIT_DIR" pull --ff-only origin "$BRANCH"
  fi
fi

log "Installing dependencies"
run_pnpm install --frozen-lockfile

log "Building browser UI"
run_pnpm ui:build

log "Building Penguins"
run_pnpm build

log "Writing penguins wrapper"
write_wrapper

if [[ "$DRY_RUN" != "1" ]]; then
  "$BIN_DIR/penguins" doctor --non-interactive >/dev/null 2>&1 || true
fi

if [[ "$ONBOARD" == "1" ]]; then
  log "Running onboarding"
  run "$BIN_DIR/penguins" onboard --install-daemon
else
  log "Skipping onboarding"
fi

case ":$PATH:" in
  *":$BIN_DIR:"*)
    ;;
  *)
    warn "add $BIN_DIR to your PATH if \`penguins\` is not found in a new shell"
    ;;
esac

log "Penguins is installed from git at $GIT_DIR"
log "Wrapper path: $BIN_DIR/penguins"
