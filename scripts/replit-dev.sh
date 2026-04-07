#!/bin/bash
export BASE_PATH=/
export PORT="${PORT:-5000}"
export API_SERVER_PORT="${API_SERVER_PORT:-3001}"
PROXY_PORT="${PROXY_PORT:-19382}"

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ROOT_DIR="$(cd "$SCRIPT_DIR/.." && pwd)"

trap 'kill $(jobs -p) 2>/dev/null' EXIT

echo "Starting API server on port $API_SERVER_PORT..."
(cd "$ROOT_DIR/artifacts/api-server" && PORT=$API_SERVER_PORT NODE_ENV=development "$ROOT_DIR/artifacts/api-server/node_modules/.bin/tsx" ./src/index.ts) &

echo "Starting Vite dev server on port $PORT..."
(PORT=$PORT "$ROOT_DIR/node_modules/.bin/vite" --config "$ROOT_DIR/vite.config.ts") &

echo "Starting proxy on port $PROXY_PORT -> $PORT..."
exec node "$ROOT_DIR/scripts/proxy.js"
