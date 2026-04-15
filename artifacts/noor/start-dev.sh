#!/bin/bash
# Workflow: artifacts/noor: web
# Starts a standalone Vite dev server on the platform-assigned port (8080).
# Uses a separate API server port (3002) to avoid conflicts with "Start application".

ARTIFACT_DIR="$(cd "$(dirname "$0")" && pwd)"
ROOT_DIR="$(cd "$ARTIFACT_DIR/../.." && pwd)"
TARGET_PORT="${PORT:-8080}"
API_PORT=3002

cleanup() {
  kill $(jobs -p) 2>/dev/null
  wait
  exit 0
}
trap cleanup SIGTERM SIGINT

export BASE_PATH=/

# Start API server on a separate port to avoid conflict with "Start application"
echo "Starting API server on port $API_PORT..."
(cd "$ROOT_DIR/artifacts/api-server" && PORT=$API_PORT NODE_ENV=development \
  "$ROOT_DIR/artifacts/api-server/node_modules/.bin/tsx" ./src/index.ts 2>&1) &

# Start Vite on the artifact port
echo "Starting Vite on port $TARGET_PORT..."
cd "$ARTIFACT_DIR" && exec env PORT=$TARGET_PORT API_SERVER_PORT=$API_PORT \
  "$ROOT_DIR/node_modules/.bin/vite" --config vite.config.ts
