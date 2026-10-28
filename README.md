# Yugito — Anime Streaming & Discovery Platform

Yugito is a modern, responsive anime discovery and viewing web application inspired by the cinematic presentation of **Crunchyroll** and the efficient, low-friction browsing of **AnimePahe**.

---

## 🎨 Brand & Visual Identity

- **Main Background:** `#0B0B10`
- **Secondary Background:** `#12121A`
- **Elevated Surfaces / Cards:** `#191923`
- **Primary Accent:** `#8B5CF6` (Vibrant Violet)
- **Secondary Accent:** `#A78BFA` (Soft Violet)
- **Primary Text:** `#F5F5FA`
- **Secondary Text:** `#A1A1B5`
- **Borders:** Subtle Dark Gray (`#262635`)

---

## 🚀 Key Features

1. **Cinematic Featured Hero:**
   - Landscape artwork with deep vignette overlays.
   - Title, Romaji/Native titles, synopsis, genres, score, format, and Sub/Dub badges.
   - Quick **Watch Now** and **View Details** actions.
   - Interactive carousel controls with auto-rotation (pauses on hover).

2. **Continue Watching Row:**
   - Seamlessly tracks watching progress with timestamps and progress bars.
   - Persisted locally via `localStorage`.
   - Displays only when viewing history exists.

3. **Explore & Search:**
   - Debounced title search (400ms) with request cancellation for stale queries.
   - Multi-filter dropdowns: **Genre**, **Format**, **Status**, and **Sort By**.
   - Responsive card grid with loading skeletons and empty states.

4. **Anime Details & Episode Browser:**
   - Banner backdrop, poster, studios, score, and expandable synopsis.
   - Multi-status Watchlist button (**Watching**, **Plan to Watch**, **Completed**, **Dropped**).
   - Episode list with search filter and range pagination (1–25, 26–50) for long series.
   - Related anime & recommendations.

5. **Advanced HLS Video Player:**
   - Custom overlay controls powered by `hls.js` with native Safari fallback.
   - Play/pause, scrubbing slider, volume/mute, fullscreen.
   - Playback speed selection (`0.5x`, `0.75x`, `1x`, `1.25x`, `1.5x`, `2x`).
   - Subtitle track selector (multi-language `.ass` and `.vtt` tracks).
   - Video quality level selector (Auto, 1080p, 720p, etc.).
   - Skip Intro action (+85s standard anime opening jump).
   - Resume playback prompt with saved position jump.
   - Auto-next episode playback.
   - Keyboard shortcuts: `Space`/`K` (Play/Pause), `M` (Mute), `F` (Fullscreen), `Left`/`Right` (±10s Seek), `N` (Next Episode), `/` (Instant Search).
   - Server & Provider switcher (**AniZone**, **ReAnime**, **AniKoto**, **AniWaves**, **MKissa**).
   - Subtitle / English Dub audio switcher.

6. **Simulcast Release Schedule:**
   - Weekly broadcast calendar grouped by day (Monday to Sunday).
   - Airing countdowns and episode numbers.

7. **Watchlist & Viewing History:**
   - Device-local storage with reactive state updates.
   - Filter tabs: All, Watching, Plan to Watch, Completed, Dropped.
   - Quick resume and clear history options.

---

## 🛠️ Tech Stack & Architecture

- **Frontend:** Next.js 14 App Router, React 18, TypeScript, Tailwind CSS, Lucide Icons, `hls.js`
- **Metadata Catalog:** AniList GraphQL API (`https://graphql.anilist.co`) — fast, keyless, zero rate-limit issues
- **Streaming Aggregator:** Self-hosted Anivexa Multi-Provider API (`/backend`) supporting AniZone, ReAnime, AniKoto, AniWaves, MKissa, etc.

---

## 📦 Getting Started

### 1. Prerequisites
- **Node.js:** v18+ (v22 recommended)
- **npm:** v9+

### 2. Installation
Dependencies are already installed in both the root application and the backend service:
```bash
# Root frontend dependencies
npm install

# Backend aggregator dependencies
cd backend && npm install && cd ..
```

### 3. Running the Application

You can launch both the backend streaming aggregator (port `4000`) and the Next.js frontend (port `3001`) with a single command:

```bash
npm run dev:all
```

Alternatively, run each service independently:

```bash
# Terminal 1: Start Backend API (Port 4000)
npm run api

# Terminal 2: Start Frontend (Port 3001)
npm run dev
```

Visit **`http://localhost:3001`** in your browser.

---

## ⚙️ Environment Variables

Create or edit `.env.local`:
```env
# URL where the self-hosted streaming aggregator is running
YUGITO_API_BASE_URL=http://localhost:4000

# Base URL of the frontend application
NEXT_PUBLIC_APP_URL=http://localhost:3001
```

---

## 🧪 Production Build

To test or build for production:
```bash
npm run build
npm start
```
