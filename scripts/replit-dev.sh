#!/bin/bash
export BASE_PATH=/

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ROOT_DIR="$(cd "$SCRIPT_DIR/.." && pwd)"

echo "Starting artifact router (manages all services)..."
exec "$REPLIT_ARTIFACT_ROUTER"
