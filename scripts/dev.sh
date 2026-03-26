#!/bin/bash
export PORT=5000
export BASE_PATH=/
exec /home/runner/workspace/node_modules/.bin/vite --config /home/runner/workspace/vite.config.ts --host 0.0.0.0 --port 5000
