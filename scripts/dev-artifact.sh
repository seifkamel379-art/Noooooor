#!/bin/bash
# This script is run by Replit's artifact infrastructure.
# PORT is set by Replit to the artifact's localPort (19382).
# We start Vite on PORT and the API server on API_SERVER_PORT.

export BASE_PATH=/

ROOT_DIR="$(cd "$(dirname "$0")/.." && pwd)"

VITE_PORT="${PORT:-19382}"
API_SERVER_PORT="${API_SERVER_PORT:-3001}"

echo "Root dir: $ROOT_DIR"
echo "Vite port: $VITE_PORT"
echo "API server port: $API_SERVER_PORT"

cleanup() {
  echo "Shutting down..."
  kill $(jobs -p) 2>/dev/null
  wait
  exit 0
}
trap cleanup SIGTERM SIGINT

echo "Starting API server on port $API_SERVER_PORT..."
(cd "$ROOT_DIR/artifacts/api-server" && PORT=$API_SERVER_PORT NODE_ENV=development pnpm exec tsx ./src/index.ts 2>&1) &

echo "Starting Vite on port $VITE_PORT..."
cd "$ROOT_DIR" && exec env VITE_PORT=$VITE_PORT pnpm exec vite --config "$ROOT_DIR/vite.config.ts"
