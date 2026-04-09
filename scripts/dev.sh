#!/bin/bash
export BASE_PATH=/

ROOT_DIR="$(cd "$(dirname "$0")/.." && pwd)"

API_SERVER_PORT="${API_SERVER_PORT:-3001}"

# If Replit sets PORT (artifact context), use it for Vite directly.
# Otherwise fall back to 5000 for local dev.
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

echo "Starting API server (dev) on port $API_SERVER_PORT..."
(cd "$ROOT_DIR/artifacts/api-server" && PORT=$API_SERVER_PORT NODE_ENV=development pnpm exec tsx ./src/index.ts 2>&1) &

echo "Starting Vite dev server on port $VITE_PORT..."
cd "$ROOT_DIR" && exec env VITE_PORT=$VITE_PORT pnpm exec vite --config "$ROOT_DIR/vite.config.ts"
