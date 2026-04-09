#!/bin/bash
export BASE_PATH=/
export API_SERVER_PORT="${API_SERVER_PORT:-3001}"

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ROOT_DIR="$(cd "$SCRIPT_DIR/.." && pwd)"

trap 'kill $(jobs -p) 2>/dev/null' EXIT

echo "Starting API server on port $API_SERVER_PORT..."
(cd "$ROOT_DIR/artifacts/api-server" && PORT=$API_SERVER_PORT NODE_ENV=development "$ROOT_DIR/artifacts/api-server/node_modules/.bin/tsx" ./src/index.ts 2>&1) &

echo "Waiting for services..."
sleep 2

echo "Starting artifact router..."
exec "$REPLIT_ARTIFACT_ROUTER"
