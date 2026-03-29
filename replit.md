# Noor App (نور)

A cross-platform Islamic companion app built with React, Vite, and Express, supporting web and Android (via Capacitor).

## Project Structure

This is a pnpm monorepo workspace.

### Root (`/`)
- **React + Vite frontend** — the main web application
- Capacitor config for Android builds
- Entry: `src/main.tsx`, `index.html`

### `artifacts/api-server/`
- **Express backend** — handles `/api/*` routes
- Uses Drizzle ORM with PostgreSQL
- Built to `dist/index.cjs` for production

### `artifacts/mockup-sandbox/`
- Isolated Vite dev environment for UI component prototyping

### `lib/`
- `lib/db` — Drizzle ORM schema and database client
- `lib/api-spec` — OpenAPI spec (source of truth for API contracts)
- `lib/api-client-react` — Generated React Query hooks from OpenAPI spec
- `lib/api-zod` — Generated Zod schemas from OpenAPI spec

### `scripts/`
- `dev.sh` — starts both Vite (frontend) and api-server in dev mode

## Development

The "Start application" workflow runs:
```
PORT=19382 npm run dev
```

This executes `scripts/dev.sh` which:
1. Starts the API server on port 3001 (in background)
2. Starts Vite on `$PORT` (19382 in dev, forwarded to external 80)

Vite proxies `/api` requests to `localhost:3001`.

## Key Configuration

- **Frontend port (dev)**: 19382 (mapped to external port 80)
- **API server port (dev)**: 3001
- **Vite proxy**: `/api` → `http://localhost:3001`
- **Vite host**: `::` (binds to both IPv4 and IPv6)
- **Firebase**: Configured via `VITE_FIREBASE_*` environment variables in `.replit`

## Database

- PostgreSQL via Replit's built-in database
- Schema managed with Drizzle ORM in `lib/db/src/schema/`
- Push schema changes: `cd lib/db && pnpm run push`

## Production Build

```bash
npm run build
```

Builds frontend to `dist/public` and bundles api-server to `dist/index.cjs`. The server serves static frontend files in production.

## Features

- Quran reader
- Azkar (Islamic remembrances)
- Prayer times (Adhan)
- Qibla direction
- Community feature ("Sohba")
- Firebase authentication
