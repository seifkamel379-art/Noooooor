# نُور - Noor Islamic App

A comprehensive Arabic Islamic mobile-first web app built with React + Vite in a pnpm monorepo.

## Architecture

- **Frontend**: `artifacts/noor-app` - React + Vite + TypeScript + Tailwind CSS
- **Routing**: Wouter (path-based)
- **State**: localStorage via `useLocalStorage` hook
- **Data fetching**: TanStack React Query
- **Animations**: Framer Motion
- **UI**: Custom Radix UI components + Tailwind CSS
- **Fonts**: Amiri (Quran text), Tajawal (UI), Scheherazade
- **Direction**: RTL throughout

## Features

### Pages
- **Home** (`/`): Prayer times grid, next prayer countdown, notification settings with adhan reciter selection
- **Quran** (`/quran`): Full Quran with 114 surahs, sound mode (Ahmad Al-Ajami), tafsir mode (Al-Jalalayn), bookmarks, memorization tracking, Juz/Hizb display while scrolling
- **Azkar** (`/azkar`): Morning/Evening azkar with progress counters, source citations, daily reset via `azkar_YYYY-MM-DD` localStorage key
- **Tasbih** (`/tasbih`): Electronic tasbih counter with 6 dhikr types, neumorphic button, haptic feedback
- **More Menu** (`/more`): Navigation to Qibla, Asma, Reciters; dark mode toggle
- **Qibla** (`/qibla`): Compass with Kaaba SVG icon using DeviceOrientationEvent, alignment detection
- **Asma Al-Husna** (`/asma`): All 99 names with Arabic meanings (static local data), search, modal detail view
- **Reciters** (`/reciters`): 50+ reciters from mp3quran.net API with search, play Al-Fatiha sample

### Key Systems
- **NotificationsManager**: Checks prayer times every 15s, plays adhan audio or shows browser notification
- **Prayer Time API**: `api.aladhan.com` with geolocation
- **Quran API**: `api.alquran.cloud` (text), `everyayah.com` (Ahmad Al-Ajami audio)
- **Tafsir API**: `api.quran.com/api/v4/tafsirs/16` (Al-Jalalayn, Arabic)
- **Adhan Audio**: `islamicfinder.org/prayer/` with 12 reciters

## Design System
- **Primary**: `#C19A6B` (Islamic gold)
- **Background**: `#FDFBF0` (warm cream)
- **Dark mode**: supported via `document.documentElement.classList`
- **Islamic pattern**: background texture from `public/images/islamic-pattern.png`

## localStorage Keys
- `azkar_YYYY-MM-DD`: Daily azkar progress (auto-reset each day)
- `tasbih_count`: Current tasbih count
- `tasbih_total`: Total tasbih across all sessions
- `tasbih_type_idx`: Selected dhikr type
- `quran_bookmark`: `{surah, ayah}` object
- `quran_memorized`: Array of `surah:ayah` keys
- `notification_pref`: `'off' | 'text' | 'adhan'`
- `adhan_reciter`: Adhan reciter ID
- `theme`: `'light' | 'dark'`

## External APIs
- Prayer times: `https://api.aladhan.com/v1/timings/`
- Quran text: `https://api.alquran.cloud/v1/surah/{n}/quran-uthmani`
- Tafsir: `https://api.quran.com/api/v4/tafsirs/16/by_ayah/{s}:{a}`
- Reciters: `https://mp3quran.net/api/v3/reciters?language=ar`
- Quran audio: `https://everyayah.com/data/Ahmed_ibn_Ali_al_Ajamy_128kbps/`
- Adhan audio: `https://www.islamicfinder.org/prayer/adhan/`
