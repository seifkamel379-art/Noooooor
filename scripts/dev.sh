#!/bin/bash
export BASE_PATH=/

trap 'kill $(jobs -p) 2>/dev/null' EXIT

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ROOT_DIR="$(cd "$SCRIPT_DIR/.." && pwd)"

API_SERVER_PORT=3001

(PORT=$API_SERVER_PORT NODE_ENV=development "$ROOT_DIR/artifacts/api-server/node_modules/.bin/tsx" "$ROOT_DIR/artifacts/api-server/src/index.ts") &

exec "$ROOT_DIR/node_modules/.bin/vite" --config "$ROOT_DIR/vite.config.ts"
