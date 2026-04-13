#!/bin/bash
ARTIFACT_DIR="$(cd "$(dirname "$0")" && pwd)"
ROOT_DIR="$(cd "$ARTIFACT_DIR/../.." && pwd)"

cleanup() {
  kill $(jobs -p) 2>/dev/null
  wait
  exit 0
}
trap cleanup SIGTERM SIGINT

echo "Starting API server on port 3001..."
(cd "$ROOT_DIR/artifacts/api-server" && PORT=3001 NODE_ENV=development \
  "$ROOT_DIR/artifacts/api-server/node_modules/.bin/tsx" ./src/index.ts 2>&1) &

echo "Starting Vite on port ${PORT:-24247}..."
cd "$ARTIFACT_DIR" && exec "$ROOT_DIR/node_modules/.bin/vite" --config vite.config.ts
