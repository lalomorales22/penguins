#!/usr/bin/env bash
# Penguins Docker Helpers
# Preferred path for repo-based Docker workflows.
# For new installs, prefer ./docker-setup.sh, plain docker compose, and
# penguins dashboard.

# =============================================================================
# Colors
# =============================================================================
_CLR_RESET='\033[0m'
_CLR_BOLD='\033[1m'
_CLR_DIM='\033[2m'
_CLR_GREEN='\033[0;32m'
_CLR_YELLOW='\033[1;33m'
_CLR_BLUE='\033[0;34m'
_CLR_MAGENTA='\033[0;35m'
_CLR_CYAN='\033[0;36m'
_CLR_RED='\033[0;31m'

# Styled command output (green + bold)
_clr_cmd() {
  echo -e "${_CLR_GREEN}${_CLR_BOLD}$1${_CLR_RESET}"
}

# Inline command for use in sentences
_cmd() {
  echo "${_CLR_GREEN}${_CLR_BOLD}$1${_CLR_RESET}"
}

# =============================================================================
# Config
# =============================================================================
PENGUINS_DOCKER_HELPERS_HOME="${HOME}/.penguins/docker-helpers"
PENGUINS_DOCKER_CONFIG="${PENGUINS_DOCKER_HELPERS_HOME}/config"
PENGUINS_DOCKER_DIR="${PENGUINS_DOCKER_DIR:-}"

# Common paths to check for Penguins
PENGUINS_DOCKER_COMMON_PATHS=(
  "${HOME}/penguins"
  "${HOME}/workspace/penguins"
  "${HOME}/projects/penguins"
  "${HOME}/dev/penguins"
  "${HOME}/code/penguins"
  "${HOME}/src/penguins"
)

_penguins_docker_filter_warnings() {
  grep -v "^WARN\|^time="
}

_penguins_docker_trim_quotes() {
  local value="$1"
  value="${value#\"}"
  value="${value%\"}"
  printf "%s" "$value"
}

_penguins_docker_read_config_dir_from() {
  local config_path="$1"
  if [[ ! -f "$config_path" ]]; then
    return 1
  fi
  local raw
  raw=$(sed -n 's/^PENGUINS_DOCKER_DIR=//p' "$config_path" | head -n 1)
  if [[ -z "$raw" ]]; then
    return 1
  fi
  _penguins_docker_trim_quotes "$raw"
}

_penguins_docker_read_config_dir() {
  local config_dir
  config_dir=$(_penguins_docker_read_config_dir_from "$PENGUINS_DOCKER_CONFIG")
  if [[ -n "$config_dir" ]]; then
    printf "%s" "$config_dir"
    return 0
  fi

  return 1
}

_penguins_docker_save_config() {
  if [[ ! -d "$PENGUINS_DOCKER_HELPERS_HOME" ]]; then
    /bin/mkdir -p "$PENGUINS_DOCKER_HELPERS_HOME"
  fi
  echo "PENGUINS_DOCKER_DIR=\"$PENGUINS_DOCKER_DIR\"" > "$PENGUINS_DOCKER_CONFIG"
  echo "✅ Saved to $PENGUINS_DOCKER_CONFIG"
}

# Ensure PENGUINS_DOCKER_DIR is set and valid
_penguins_docker_ensure_dir() {
  # Already set and valid?
  if [[ -n "$PENGUINS_DOCKER_DIR" && -f "${PENGUINS_DOCKER_DIR}/docker-compose.yml" ]]; then
    return 0
  fi

  # Try loading from config
  local config_dir
  config_dir=$(_penguins_docker_read_config_dir)
  if [[ -n "$config_dir" && -f "${config_dir}/docker-compose.yml" ]]; then
    PENGUINS_DOCKER_DIR="$config_dir"
    return 0
  fi

  # Auto-detect from common paths
  local found_path=""
  for path in "${PENGUINS_DOCKER_COMMON_PATHS[@]}"; do
    if [[ -f "${path}/docker-compose.yml" ]]; then
      found_path="$path"
      break
    fi
  done

  if [[ -n "$found_path" ]]; then
    echo ""
    echo "🐧 Found Penguins at: $found_path"
    echo -n "   Use this location? [Y/n] "
    read -r response
    if [[ "$response" =~ ^[Nn] ]]; then
      echo ""
      echo "Set PENGUINS_DOCKER_DIR manually:"
      echo "  export PENGUINS_DOCKER_DIR=/path/to/penguins"
      return 1
    fi
    PENGUINS_DOCKER_DIR="$found_path"
  else
    echo ""
    echo "❌ Penguins not found in common locations."
    echo ""
    echo "Clone it first:"
    echo ""
    echo "  git clone https://github.com/penguins/penguins.git ~/penguins"
    echo "  cd ~/penguins && ./docker-setup.sh"
    echo ""
    echo "Or set PENGUINS_DOCKER_DIR if it's elsewhere:"
    echo ""
    echo "  export PENGUINS_DOCKER_DIR=/path/to/penguins"
    echo ""
    return 1
  fi

  _penguins_docker_save_config
  echo ""
  return 0
}

# Wrapper to run docker compose commands
_penguins_docker_compose() {
  _penguins_docker_ensure_dir || return 1
  command docker compose -f "${PENGUINS_DOCKER_DIR}/docker-compose.yml" "$@"
}

_penguins_docker_read_env_token() {
  _penguins_docker_ensure_dir || return 1
  if [[ ! -f "${PENGUINS_DOCKER_DIR}/.env" ]]; then
    return 1
  fi
  local raw
  raw=$(sed -n 's/^PENGUINS_GATEWAY_TOKEN=//p' "${PENGUINS_DOCKER_DIR}/.env" | head -n 1)
  if [[ -z "$raw" ]]; then
    return 1
  fi
  _penguins_docker_trim_quotes "$raw"
}

# Basic Operations
penguins-docker-start() {
  _penguins_docker_compose up -d penguins-gateway
}

penguins-docker-stop() {
  _penguins_docker_compose down
}

penguins-docker-restart() {
  _penguins_docker_compose restart penguins-gateway
}

penguins-docker-logs() {
  _penguins_docker_compose logs -f penguins-gateway
}

penguins-docker-status() {
  _penguins_docker_compose ps
}

# Navigation
penguins-docker-cd() {
  _penguins_docker_ensure_dir || return 1
  cd "${PENGUINS_DOCKER_DIR}"
}

penguins-docker-config() {
  cd ~/.penguins
}

penguins-docker-workspace() {
  cd ~/.penguins/workspace
}

# Container Access
penguins-docker-shell() {
  _penguins_docker_compose exec penguins-gateway \
    bash -c 'echo "alias penguins=\"./penguins.mjs\"" > /tmp/.bashrc_penguins && bash --rcfile /tmp/.bashrc_penguins'
}

penguins-docker-exec() {
  _penguins_docker_compose exec penguins-gateway "$@"
}

penguins-docker-cli() {
  _penguins_docker_compose run --rm penguins-cli "$@"
}

# Maintenance
penguins-docker-rebuild() {
  _penguins_docker_compose build penguins-gateway
}

penguins-docker-clean() {
  _penguins_docker_compose down -v --remove-orphans
}

# Health check
penguins-docker-health() {
  _penguins_docker_ensure_dir || return 1
  local token
  token=$(_penguins_docker_read_env_token)
  if [[ -z "$token" ]]; then
    echo "❌ Error: Could not find gateway token"
    echo "   Check: ${PENGUINS_DOCKER_DIR}/.env"
    return 1
  fi
  _penguins_docker_compose exec -e "PENGUINS_GATEWAY_TOKEN=$token" penguins-gateway \
    node dist/index.js health
}

# Show gateway token
penguins-docker-token() {
  _penguins_docker_read_env_token
}

# Fix token configuration (run this once after setup)
penguins-docker-fix-token() {
  _penguins_docker_ensure_dir || return 1

  echo "🔧 Configuring gateway token..."
  local token
  token=$(penguins-docker-token)
  if [[ -z "$token" ]]; then
    echo "❌ Error: Could not find gateway token"
    echo "   Check: ${PENGUINS_DOCKER_DIR}/.env"
    return 1
  fi

  echo "📝 Setting token: ${token:0:20}..."

  _penguins_docker_compose exec -e "TOKEN=$token" penguins-gateway \
    bash -c './penguins.mjs config set gateway.remote.token "$TOKEN" && ./penguins.mjs config set gateway.auth.token "$TOKEN"' 2>&1 | _penguins_docker_filter_warnings

  echo "🔍 Verifying token was saved..."
  local saved_token
  saved_token=$(_penguins_docker_compose exec penguins-gateway \
    bash -c "./penguins.mjs config get gateway.remote.token 2>/dev/null" 2>&1 | _penguins_docker_filter_warnings | tr -d '\r\n' | head -c 64)

  if [[ "$saved_token" == "$token" ]]; then
    echo "✅ Token saved correctly!"
  else
    echo "⚠️  Token mismatch detected"
    echo "   Expected: ${token:0:20}..."
    echo "   Got: ${saved_token:0:20}..."
  fi

  echo "🔄 Restarting gateway..."
  _penguins_docker_compose restart penguins-gateway 2>&1 | _penguins_docker_filter_warnings

  echo "⏳ Waiting for gateway to start..."
  sleep 5

  echo "✅ Configuration complete!"
  echo -e "   Try: $(_cmd penguins-docker-devices)"
}

# Open dashboard in browser
penguins-docker-dashboard() {
  _penguins_docker_ensure_dir || return 1

  echo "🐧 Getting dashboard URL..."
  local output exit_status url
  output=$(_penguins_docker_compose run --rm penguins-cli dashboard --no-open 2>&1)
  exit_status=$?
  url=$(printf "%s\n" "$output" | _penguins_docker_filter_warnings | grep -o 'http[s]\?://[^[:space:]]*' | head -n 1)
  if [[ $exit_status -ne 0 ]]; then
    echo "❌ Failed to get dashboard URL"
    echo -e "   Try restarting: $(_cmd penguins-docker-restart)"
    return 1
  fi

  if [[ -n "$url" ]]; then
    echo "✅ Opening: $url"
    open "$url" 2>/dev/null || xdg-open "$url" 2>/dev/null || echo "   Please open manually: $url"
    echo ""
    echo -e "${_CLR_CYAN}💡 If you see 'pairing required' error:${_CLR_RESET}"
    echo -e "   1. Run: $(_cmd penguins-docker-devices)"
    echo "   2. Copy the Request ID from the Pending table"
    echo -e "   3. Run: $(_cmd 'penguins-docker-approve <request-id>')"
  else
    echo "❌ Failed to get dashboard URL"
    echo -e "   Try restarting: $(_cmd penguins-docker-restart)"
  fi
}

# List device pairings
penguins-docker-devices() {
  _penguins_docker_ensure_dir || return 1

  echo "🔍 Checking device pairings..."
  local output exit_status
  output=$(_penguins_docker_compose exec penguins-gateway node dist/index.js devices list 2>&1)
  exit_status=$?
  printf "%s\n" "$output" | _penguins_docker_filter_warnings
  if [ $exit_status -ne 0 ]; then
    echo ""
    echo -e "${_CLR_CYAN}💡 If you see token errors above:${_CLR_RESET}"
    echo -e "   1. Verify token is set: $(_cmd penguins-docker-token)"
    echo "   2. Try manual config inside container:"
    echo -e "      $(_cmd penguins-docker-shell)"
    echo -e "      $(_cmd 'penguins config get gateway.remote.token')"
    return 1
  fi

  echo ""
  echo -e "${_CLR_CYAN}💡 To approve a pairing request:${_CLR_RESET}"
  echo -e "   $(_cmd 'penguins-docker-approve <request-id>')"
}

# Approve device pairing request
penguins-docker-approve() {
  _penguins_docker_ensure_dir || return 1

  if [[ -z "$1" ]]; then
    echo -e "❌ Usage: $(_cmd 'penguins-docker-approve <request-id>')"
    echo ""
    echo -e "${_CLR_CYAN}💡 How to approve a device:${_CLR_RESET}"
    echo -e "   1. Run: $(_cmd penguins-docker-devices)"
    echo "   2. Find the Request ID in the Pending table (long UUID)"
    echo -e "   3. Run: $(_cmd 'penguins-docker-approve <that-request-id>')"
    echo ""
    echo "Example:"
    echo -e "   $(_cmd 'penguins-docker-approve 6f9db1bd-a1cc-4d3f-b643-2c195262464e')"
    return 1
  fi

  echo "✅ Approving device: $1"
  _penguins_docker_compose exec penguins-gateway \
    node dist/index.js devices approve "$1" 2>&1 | _penguins_docker_filter_warnings

  echo ""
  echo "✅ Device approved! Refresh your browser."
}

# Show all available Penguins Docker helper commands
penguins-docker-help() {
  echo -e "\n${_CLR_BOLD}${_CLR_CYAN}🐧 Penguins Docker Helpers${_CLR_RESET}\n"

  echo -e "${_CLR_BOLD}${_CLR_MAGENTA}⚡ Basic Operations${_CLR_RESET}"
  echo -e "  $(_cmd penguins-docker-start)       ${_CLR_DIM}Start the gateway${_CLR_RESET}"
  echo -e "  $(_cmd penguins-docker-stop)        ${_CLR_DIM}Stop the gateway${_CLR_RESET}"
  echo -e "  $(_cmd penguins-docker-restart)     ${_CLR_DIM}Restart the gateway${_CLR_RESET}"
  echo -e "  $(_cmd penguins-docker-status)      ${_CLR_DIM}Check container status${_CLR_RESET}"
  echo -e "  $(_cmd penguins-docker-logs)        ${_CLR_DIM}View live logs (follows)${_CLR_RESET}"
  echo ""

  echo -e "${_CLR_BOLD}${_CLR_MAGENTA}🐚 Container Access${_CLR_RESET}"
  echo -e "  $(_cmd penguins-docker-shell)       ${_CLR_DIM}Shell into container (penguins alias ready)${_CLR_RESET}"
  echo -e "  $(_cmd penguins-docker-cli)         ${_CLR_DIM}Run CLI commands (e.g., penguins-docker-cli status)${_CLR_RESET}"
  echo -e "  $(_cmd penguins-docker-exec) ${_CLR_CYAN}<cmd>${_CLR_RESET}  ${_CLR_DIM}Execute command in gateway container${_CLR_RESET}"
  echo ""

  echo -e "${_CLR_BOLD}${_CLR_MAGENTA}🌐 Web UI & Devices${_CLR_RESET}"
  echo -e "  $(_cmd penguins-docker-dashboard)   ${_CLR_DIM}Open web UI in browser ${_CLR_CYAN}(auto-guides you)${_CLR_RESET}"
  echo -e "  $(_cmd penguins-docker-devices)     ${_CLR_DIM}List device pairings ${_CLR_CYAN}(auto-guides you)${_CLR_RESET}"
  echo -e "  $(_cmd penguins-docker-approve) ${_CLR_CYAN}<id>${_CLR_RESET} ${_CLR_DIM}Approve device pairing ${_CLR_CYAN}(with examples)${_CLR_RESET}"
  echo ""

  echo -e "${_CLR_BOLD}${_CLR_MAGENTA}⚙️  Setup & Configuration${_CLR_RESET}"
  echo -e "  $(_cmd penguins-docker-fix-token)   ${_CLR_DIM}Configure gateway token ${_CLR_CYAN}(run once)${_CLR_RESET}"
  echo ""

  echo -e "${_CLR_BOLD}${_CLR_MAGENTA}🔧 Maintenance${_CLR_RESET}"
  echo -e "  $(_cmd penguins-docker-rebuild)     ${_CLR_DIM}Rebuild Docker image${_CLR_RESET}"
  echo -e "  $(_cmd penguins-docker-clean)       ${_CLR_RED}⚠️  Remove containers & volumes (nuclear)${_CLR_RESET}"
  echo ""

  echo -e "${_CLR_BOLD}${_CLR_MAGENTA}🛠️  Utilities${_CLR_RESET}"
  echo -e "  $(_cmd penguins-docker-health)      ${_CLR_DIM}Run health check${_CLR_RESET}"
  echo -e "  $(_cmd penguins-docker-token)       ${_CLR_DIM}Show gateway auth token${_CLR_RESET}"
  echo -e "  $(_cmd penguins-docker-cd)          ${_CLR_DIM}Jump to penguins project directory${_CLR_RESET}"
  echo -e "  $(_cmd penguins-docker-config)      ${_CLR_DIM}Open config directory (~/.penguins)${_CLR_RESET}"
  echo -e "  $(_cmd penguins-docker-workspace)   ${_CLR_DIM}Open workspace directory${_CLR_RESET}"
  echo ""

  echo -e "${_CLR_BOLD}${_CLR_CYAN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${_CLR_RESET}"
  echo -e "${_CLR_BOLD}${_CLR_GREEN}🚀 First Time Setup${_CLR_RESET}"
  echo -e "${_CLR_CYAN}  1.${_CLR_RESET} $(_cmd penguins-docker-start)          ${_CLR_DIM}# Start the gateway${_CLR_RESET}"
  echo -e "${_CLR_CYAN}  2.${_CLR_RESET} $(_cmd penguins-docker-fix-token)      ${_CLR_DIM}# Configure token${_CLR_RESET}"
  echo -e "${_CLR_CYAN}  3.${_CLR_RESET} $(_cmd penguins-docker-dashboard)      ${_CLR_DIM}# Open web UI${_CLR_RESET}"
  echo -e "${_CLR_CYAN}  4.${_CLR_RESET} $(_cmd penguins-docker-devices)        ${_CLR_DIM}# If pairing needed${_CLR_RESET}"
  echo -e "${_CLR_CYAN}  5.${_CLR_RESET} $(_cmd penguins-docker-approve) ${_CLR_CYAN}<id>${_CLR_RESET}   ${_CLR_DIM}# Approve pairing${_CLR_RESET}"
  echo ""

  echo -e "${_CLR_BOLD}${_CLR_GREEN}🧪 Advanced CLI / Custom Integrations${_CLR_RESET}"
  echo -e "  $(_cmd penguins-docker-shell)"
  echo -e "    ${_CLR_BLUE}>${_CLR_RESET} $(_cmd 'penguins status')"
  echo -e "    ${_CLR_BLUE}>${_CLR_RESET} $(_cmd 'penguins dashboard --no-open')"
  echo -e "    ${_CLR_BLUE}>${_CLR_RESET} $(_cmd 'penguins message --help')"
  echo ""

  echo -e "${_CLR_BOLD}${_CLR_CYAN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${_CLR_RESET}"
  echo ""

  echo -e "${_CLR_CYAN}💡 All commands guide you through next steps!${_CLR_RESET}"
  echo -e "${_CLR_BLUE}📚 Docs: ${_CLR_RESET}${_CLR_CYAN}https://docs.penguins.ai${_CLR_RESET}"
  echo ""
}
