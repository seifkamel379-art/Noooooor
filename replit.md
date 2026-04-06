# Noor App (نور)

A cross-platform Islamic companion app built with React, Vite, and Express, supporting web and Android (via Capacitor).

## Features (v2.1+)
- **القرآن الكريم** — Quran reader with tafsir, word-by-word audio, bookmarks, and Moshaf PDF downloader (8 types)
- **التاريخ الإسلامي** — 2637 Islamic history events across 5 eras (up to Abbasid Caliphate)
- **الاختبارات الإسلامية** — 5820 MCQ questions across 6 Islamic science categories, 3 levels each
- **سنن النبي ﷺ** — Prophetic Sunnah browser across 5 categories with hadith sources
- **الأذكار** — Morning/evening and daily adhkar with progress tracking
- **التسبيح** — Digital tasbih counter
- **الأذان** — Prayer times with notifications
- **القبلة** — Smart Qibla compass
- **الصحبة** — Community leaderboard and global dhikr tracker
- **الإذاعات الإسلامية** — Live Islamic radio (Quran + Sunnah channels)

## Static Data Strategy (Vercel Optimization)
All large content is in `public/data/` and lazy-fetched on page visit:
- `public/data/history.json` — 5.3MB, 2637 history events
- `public/data/quizzes.json` — 4.4MB, full quiz data
- `public/data/sunnah.json` — 40KB, prophetic sunnah
- `public/data/moshaf.json` — 3.3KB, moshaf PDF links

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
pnpm -w run dev
```

This executes `scripts/dev.sh` which:
1. Starts the API server on port 3001 via `pnpm --filter @workspace/api-server run dev` (in background)
2. Starts Vite on `$PORT` (defaults to 5000, the Replit-compatible port)

Vite proxies `/api` requests to `localhost:3001`.

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
