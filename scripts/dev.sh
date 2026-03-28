#!/bin/bash
export BASE_PATH=/

trap 'kill $(jobs -p) 2>/dev/null' EXIT

API_PORT=3001 PORT=3001 NODE_ENV=development /home/runner/workspace/artifacts/api-server/node_modules/.bin/tsx /home/runner/workspace/artifacts/api-server/src/index.ts &

exec /home/runner/workspace/node_modules/.bin/vite --config /home/runner/workspace/vite.config.ts --host 0.0.0.0 --port "${PORT:-5000}"
