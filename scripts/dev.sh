#!/bin/bash
export BASE_PATH=/

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ROOT_DIR="$(cd "$SCRIPT_DIR/.." && pwd)"

API_SERVER_PORT="${API_SERVER_PORT:-3001}"
VITE_PORT=5000
PROXY_PORT="${PORT:-19382}"

echo "API server dev port: $API_SERVER_PORT"
echo "Vite port: $VITE_PORT"
echo "Proxy port: $PROXY_PORT"

cleanup() {
  echo "Shutting down..."
  kill $(jobs -p) 2>/dev/null
  wait
  exit 0
}
trap cleanup SIGTERM SIGINT

echo "Starting API server (dev) on port $API_SERVER_PORT..."
(cd "$ROOT_DIR/artifacts/api-server" && PORT=$API_SERVER_PORT NODE_ENV=development "$ROOT_DIR/artifacts/api-server/node_modules/.bin/tsx" ./src/index.ts 2>&1) &

echo "Starting Vite dev server on port $VITE_PORT..."
PORT=$VITE_PORT "$ROOT_DIR/node_modules/.bin/vite" --config "$ROOT_DIR/vite.config.ts" &

echo "Starting proxy on port $PROXY_PORT -> $VITE_PORT..."
PORT=$VITE_PORT PROXY_PORT=$PROXY_PORT node "$ROOT_DIR/scripts/proxy.js" &

wait
