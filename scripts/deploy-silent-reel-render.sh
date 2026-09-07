#!/bin/zsh
# Deploy the silent-reel Modal render endpoint. Secrets are read from files and
# exported only into this shell; nothing is echoed.
set -euo pipefail
cd "$(dirname "$0")/.."
set -a; source ./.env; set +a
export SUPABASE_URL="https://ivhfuhxorppptyuofbgq.supabase.co"
export SUPABASE_SERVICE_ROLE_KEY="$(grep -E '^SUPABASE_SERVICE_ROLE_KEY=' "$HOME/Documents/Software/mediaposter-lite/.env.local" | head -1 | cut -d= -f2- | tr -d '"' | tr -d "'")"
[[ -n "${SUPABASE_SERVICE_ROLE_KEY:-}" ]] || { echo "SUPABASE_SERVICE_ROLE_KEY not found"; exit 1; }
[[ -n "${MODAL_SILENT_RENDER_AUTH_TOKEN:-}" ]] || { echo "MODAL_SILENT_RENDER_AUTH_TOKEN not in .env"; exit 1; }
modal deploy modal_silent_reel_render.py 2>&1 | grep -viE 'key=|token=|secret='
