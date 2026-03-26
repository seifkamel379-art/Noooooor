#!/bin/bash
set -e
npm run build
pnpm --filter @workspace/api-server build
