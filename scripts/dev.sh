#!/bin/bash
# Main dev script for the "Start application" workflow.
# Starts API server and Vite dev server together.
export BASE_PATH=/

ROOT_DIR="$(cd "$(dirname "$0")/.." && pwd)"

API_SERVER_PORT="${API_SERVER_PORT:-3001}"
VITE_PORT="${PORT:-5000}"

echo "Root dir: $ROOT_DIR"
echo "API server dev port: $API_SERVER_PORT"
echo "Vite port: $VITE_PORT"

cleanup() {
  echo "Shutting down..."
  kill $(jobs -p) 2>/dev/null
  wait
  exit 0
}
trap cleanup SIGTERM SIGINT

# Start the API server in the background
echo "Starting API server (dev) on port $API_SERVER_PORT..."
(cd "$ROOT_DIR/artifacts/api-server" && PORT=$API_SERVER_PORT NODE_ENV=development \
  "$ROOT_DIR/artifacts/api-server/node_modules/.bin/tsx" ./src/index.ts 2>&1) &

# Start Vite in the foreground
echo "Starting Vite dev server on port $VITE_PORT..."
cd "$ROOT_DIR" && exec env VITE_PORT=$VITE_PORT PORT=$VITE_PORT \
  "$ROOT_DIR/node_modules/.bin/vite" --config "$ROOT_DIR/vite.config.ts"
