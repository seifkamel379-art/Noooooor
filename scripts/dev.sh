#!/bin/bash
export BASE_PATH=/

trap 'kill $(jobs -p) 2>/dev/null' EXIT

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ROOT_DIR="$(cd "$SCRIPT_DIR/.." && pwd)"

export PORT="${PORT:-5000}"
API_SERVER_PORT=3001

TSX_BIN=$(find "$ROOT_DIR" -name "tsx" -path "*/node_modules/.bin/tsx" 2>/dev/null | head -1)

echo "Using tsx: $TSX_BIN"
echo "Vite port: $PORT"

(PORT=$API_SERVER_PORT NODE_ENV=development "$TSX_BIN" "$ROOT_DIR/artifacts/api-server/src/index.ts") &

exec "$ROOT_DIR/node_modules/.bin/vite" --config "$ROOT_DIR/vite.config.ts"
