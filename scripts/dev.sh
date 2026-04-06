#!/bin/bash
export BASE_PATH=/

trap 'kill $(jobs -p) 2>/dev/null' EXIT

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ROOT_DIR="$(cd "$SCRIPT_DIR/.." && pwd)"

export PORT="${PORT:-5000}"
API_SERVER_PORT=3001

echo "Vite port: $PORT"
echo "API server port: $API_SERVER_PORT"

(PORT=$API_SERVER_PORT pnpm --filter @workspace/api-server run dev) &

"$ROOT_DIR/node_modules/.bin/vite" --config "$ROOT_DIR/vite.config.ts"
