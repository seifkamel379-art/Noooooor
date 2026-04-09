# Noor App (نور)

A cross-platform Islamic companion app built with React, Vite, and Express, supporting web and Android (via Capacitor).

## Features (v2.1+)
- **القرآن الكريم** — Quran reader with tafsir, word-by-word audio, bookmarks, and Moshaf PDF downloader (8 types)
- **التاريخ الإسلامي** — 4975 Islamic history events across 5 eras (Seerah → Ottoman), lazy-loaded per era with pagination
- **الاختبارات الإسلامية** — 5820 MCQ questions across 6 Islamic science categories, 3 levels each
- **سنن النبي ﷺ** — Prophetic Sunnah browser across 5 categories with hadith sources
- **الأذكار** — Morning/evening and daily adhkar with progress tracking
- **التسبيح** — Digital tasbih counter
- **الأذان** — Prayer times with notifications
- **القبلة** — Smart Qibla compass
- **الصحبة** — Community leaderboard and global dhikr tracker
- **الإذاعات الإسلامية** — Live Islamic radio (Quran + Sunnah channels)
- **القنوات الإسلامية** — Live Islamic TV channels (HLS streams) with hls.js support

## Static Data Strategy (Vercel Optimization)
All large content is in `public/data/` and lazy-fetched on page visit:
- `public/data/history-seerah.json` — 317KB, 128 events (lazy-loaded per era)
- `public/data/history-rashidun.json` — 269KB, 126 events
- `public/data/history-umayyad.json` — 416KB, 223 events
- `public/data/history-abbasid.json` — 4.6MB, 2160 events
- `public/data/history-ottoman.json` — 4.8MB, 2338 events
- `public/data/quizzes.json` — 4.4MB, full quiz data
- `public/data/sunnah.json` — 40KB, prophetic sunnah
- `public/data/moshaf.json` — 3.3KB, moshaf PDF links

### Vercel Free Tier Capacity Estimate
- Bandwidth: 100GB/month
- Average session bandwidth: ~500KB-1MB (depending on which era is browsed)
- Estimated capacity: 100,000–200,000 page sessions/month
- Abbasid/Ottoman eras are the largest files (~4.6-4.8MB each) but only load on demand

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
- `replit-dev.sh` — starts the dev API server (port 3001) then launches the Replit artifact router
- `dev.sh` — alternative simple dev mode using Vite dev server (port 5000) + dev API server (port 3001)
- `start.js` — Node.js alternative launcher for the dev stack
- `proxy.js` — HTTP proxy helper (port forwarding)

## Development

The "Start application" workflow runs:
```
bash scripts/replit-dev.sh
```

This starts:
1. **Dev API server** on port 3001 — tsx live-reload Express server for backend development
2. **Replit artifact router** — reads `artifact.toml` configs and starts services, listens on port 8000 locally
3. **Production api-server** on port 19382 (started by the artifact router) — serves built frontend + API routes

The workflow uses `waitForPort: 19382` which is the production api-server port (registered in `.replit` ports mapping `localPort=19382 → externalPort=80`).

**Port Architecture**:
- External port 80 → Replit proxy → `localhost:19382` (production server serves both frontend + API)
- `localhost:3001` — Dev API server (tsx live-reload for backend development)
- `localhost:8000` — Artifact router (internal routing)

**Important**: After making frontend code changes, rebuild with `pnpm exec vite build --config vite.config.ts` to update `dist/public/`. The production api-server serves the built static files.

## Firebase

Single Firebase project: **noooooor-app** (projectId: `noooooor-app`)
- Config hardcoded in `src/lib/firebase.ts` as fallback values, also in `vercel.json` env vars
- Used for: Global Counter (Firestore), Active Sessions presence, Leaderboard
- Login is manual name entry only (no Google sign-in)
- `firebaseSignOut` in `src/lib/firebase.ts` is still exported for MoreMenu logout button

### Firestore Collections
- `globalCounter/main` — total tasbeeh count, incremented atomically with `increment()`
- `activeSessions/{sessionId}` — tracks users actively pressing tasbeeh (TTL: 3 min). Updated on every button press via `recordTasbeehPress()` in Tasbih.tsx
- `sohbaLeaderboard/{userId}` — per-user leaderboard entries, only queried when `isPublic=true`

### Required Firestore Rules (noooooor-app project)
```
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /{document=**} {
      allow read, write: if true;
    }
  }
}
```

## Key Configuration

- **Frontend port (dev)**: 5000 (Replit-compatible port)
- **API server port (dev)**: 3001
- **Vite proxy**: `/api` → `http://localhost:3001`
- **Vite host**: `0.0.0.0` (binds to all interfaces)
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

## Database Auto-Init

`artifacts/api-server/src/db-init.ts` runs `CREATE TABLE IF NOT EXISTS` at startup (before listening). No manual migration needed — tables are created automatically on any fresh pull/deploy.

## UI Design System

- **Primary color**: `#C19A6B` / `hsl(var(--primary))` — gold/amber
- **Fonts**: `"Tajawal"` for UI text, `"Amiri"/"Scheherazade New"` for Arabic calligraphy
- **NoorIcons**: Custom 3D-style SVG icon library at `src/components/NoorIcons.tsx` using `currentColor` for theming

### Recent UI Improvements (March 2026)

- **SplashScreen**: Full 3D Islamic star animation with gold particles, ambient glow blobs, and beautiful Basmala reveal
- **Home.tsx**: Custom 3D clock SVG icon (`Clock3DIcon`) next to prayer times header
- **HomeTracker**: Redesigned daily prayers section from circles → table-style rows with unique 3D prayer icons (Fajr/Dhuhr/Asr/Maghrib/Isha each have custom SVG with depth effects); all colors use CSS variables
- **Azkar.tsx**: Category tabs redesigned to be taller with larger icons (20px), icon containers with background, and visible completion badges
- **GlobalCounter leaderboard**: Star icon (Sparkles) replaced with TasbihIcon from NoorIcons for the tasbeeh count display
- **MoreMenu About section**: Icon gradients unified to deep harmonious palette (Islamic greens, navies, golds, purples) instead of rainbow neon colors
