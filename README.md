# VibeStump — Agentic Premier League

> **AI-powered IPL dashboard with live simulation, multi-agent intelligence, and offline-resilient architecture**

## Overview

VibeStump is a production-grade IPL live cricket dashboard that delivers real-time match data, AI-generated commentary, audience emotion tracking, team/player insights, and an interactive chatbot. The system is built with a **5-agent agentic architecture** and is designed to degrade gracefully in restricted corporate network environments (e.g., Zscaler proxy).

---

## Key Challenges & How We Solve Them

### Challenge 1 — Corporate Proxy (Zscaler) Blocks All External APIs

**Problem:** In many enterprise environments, Zscaler performs SSL inspection and blocks calls to:
- ESPN Cricinfo RSS (live scores)
- Google Gemini API (AI insights & chatbot)
- YouTube Data API (match highlights)
- Tenor API (memes)
- Wikipedia (team logos)

**Solution — Offline-First Agentic Architecture:**

```
External API Available?
        │
        ├─ YES → Use real data (Gemini, RSS, YouTube, Tenor)
        │
        └─ NO  → Fall back gracefully:
                  ├─ ScoreAgent     → LiveSimulator (ball-by-ball simulation)
                  ├─ CommentaryAgent → Offline template commentary strings
                  ├─ InsightsAgent  → Pre-written cricket insights library
                  ├─ MediaAgent    → Static highlight cards with YouTube links
                  └─ MemeAgent     → Emoji reactions shown in UI instead
```

Every agent wraps external calls in `try/except` and falls back to seeded demo data. The system runs fully without internet access.

---

### Challenge 2 — No Live Match Data Without RSS Feed

**Problem:** With Cricinfo RSS blocked, there is no stream of real ball-by-ball score updates.

**Solution — `LiveSimulator` Engine (`backend/agents.py`):**

```python
BALL_OUTCOMES = [0, 0, 0, 1, 1, 1, 2, 4, 4, 6, -1]  # -1 = wicket
WEIGHTS       = [20, 18, 12, 15, 12, 8, 6, 5, 2, 1, 1]
```

The `LiveSimulator` class advances all LIVE matches ball-by-ball on every agent cycle (10s):
- Realistic outcome distribution (dots most common, sixes/wickets rare)
- Generates `WICKET / SIX / FOUR / RUNS` events → triggers commentary + AudienceMood + event glow
- Stops at 20 overs automatically

**Seeded Demo Data (`backend/seed.py`) — IPL 2026:**
| Type | Count | Details |
|------|-------|---------|
| LIVE matches | 2 | CSK vs MI (Match 41), RCB vs KKR (Match 40) |
| Both innings | ✅ | MI first innings (171/6) + CSK chase (158/7) seeded |
| Completed matches | 3 | SRH vs GT, MI vs DC, RR vs PBKS |
| Points Table | 10 teams | Realistic NRR and form |
| Upcoming fixtures | 5 | May 15–18 schedule |
| Commentary events | ~40+ | Seeded with WICKET, SIX, FOUR events |

---

### Challenge 3 — Gemini API Unreachable (SSL Inspection)

**Problem:** Zscaler intercepts HTTPS to `generativelanguage.googleapis.com`.

**Solution:**
- All Gemini calls wrapped in `try/except` with clear fallbacks
- `InsightsAgent` → 8 pre-written cricket analytical insights
- `chat_with_stumpmind()` → returns offline mode message  
- `get_team_details_ai()` → static fallback text
- Team detail pages still show full **Playing XI + substitutes** from `tools.py`

---

### Challenge 4 — Empty Dashboard on First Load

**Problem:** Without live data the dashboard appeared blank, degrading the demo experience.

**Solution — Auto-Seed on Startup:**
`seed.py`'s `run_seed()` is called in the FastAPI lifespan before agents start. It populates the database with complete IPL 2026 data so the UI shows meaningful content immediately on first open — no manual data entry needed.

---

### Challenge 5 — YouTube Embeds Blocked

**Problem:** `react-player` YouTube embeds fail silently behind Zscaler proxy.

**Solution:**
- Highlights section replaced with card-based UI (no `<iframe>`)
- Each highlight card shows a team-colored gradient + cricket icon + match title
- "Watch on YouTube" external link button opens in a new tab
- `onError` handler hides broken thumbnail images gracefully

---

### Challenge 6 — Single-Innings Score Graph

**Problem:** Runs vs Overs chart only tracked the current batting innings.

**Solution:**
- Added `batting_team` column to `score_progression` table
- Both innings are seeded separately (MI and CSK) under the same `match_id`
- `RunsGraph` groups data points by `batting_team` and renders two colored lines with legend
- Each team's line uses their brand color from `TEAM_THEMES`

---

### Challenge 7 — Audience Emotion & Meme Board

**Problem:** The dashboard lacked any sense of the crowd's emotional state. Batting events (WICKET, SIX, FOUR) happened silently with no visible crowd reaction.

**Solution — `AudienceMood` Component (`frontend/components/AudienceMood.tsx`):**

The component reads `activeEvent` from the Zustand store, which is set whenever the Commentary feed receives a WICKET/SIX/FOUR event. It displays:

| Event | Color | Crowd Energy Bar | Mood Label |
|-------|-------|-----------------|------------|
| WICKET | 🔴 Red | 92% | 💀 Wicket! Drama in the Stadium! |
| SIX | 🟣 Purple | 100% | 🚀 SIX! The Crowd Goes Ballistic! |
| FOUR | 🟢 Green | 78% | 🏏 FOUR! Beautiful Cricket Shot! |
| Default | 🔵 Indigo | 42% | 🏟️ Stadium Atmosphere |

**Features:**
- **Crowd energy bar** — animated `motion.div` transitions smoothly to the event level
- **Floating emoji particles** — 8 emojis float up across the panel with staggered delays using Framer Motion
- **Meme image** — polls `GET /api/meme?event_type=WICKET` which tries Tenor API v2
- **Offline fallback** — if Tenor is blocked, a 3-emoji bouncing row is shown instead
- **Placement** — right column, between AgentCommentary and PointsTable (visible on every match)

**Event cascade flow:**
```
ScoreAgent detects run/wicket delta
  → CommentaryAgent writes event_type to DB
  → MemeAgent fetches Tenor GIF (or null) and stores it
  → Frontend polls /api/commentary every 5s
  → activeEvent set in Zustand store
  → AudienceMood reacts: color change + energy bar + particles + meme
  → SoundManager plays wicket/six/boundary audio cue
  → Scoreboard glows in team color
```

---

### Challenge 8 — `deploy.sh local` Fails in Zscaler-Protected Environments

**Problem:** `pip install` and `npm install` fail behind Zscaler SSL inspection because the proxy intercepts and re-signs certificates, causing SSL verification errors.

**Solution — Zscaler-Safe Install Flags in `deploy.sh`:**

**Backend (pip):**
```bash
pip install -r requirements.txt --quiet --prefer-binary \
    --trusted-host pypi.org \
    --trusted-host pypi.python.org \
    --trusted-host files.pythonhosted.org 2>/dev/null \
  || pip install -r requirements.txt --quiet 2>/dev/null \
  || echo "[WARN] pip install failed — using cached packages"
```
The `--trusted-host` flags bypass SSL verification for PyPI domains specifically. If that also fails, cached packages are used.

**Frontend (npm):**
```bash
npm install --silent --prefer-offline 2>/dev/null \
  || npm install --silent 2>/dev/null \
  || echo "[WARN] npm install failed — using existing node_modules"
```
`--prefer-offline` uses the local npm cache first; only fetches from registry if package is missing.

**Frontend standalone server (NOT `next start`):**
```bash
# After build, start with:
node .next/standalone/server.js
```
`next.config.mjs` sets `output: 'standalone'`, which produces a self-contained server bundle. `next start` will not work with this mode.

**Backend env var injection:**
```bash
nohup env GEMINI_API_KEY="$GEMINI_API_KEY" \
    YOUTUBE_API_KEY="$YOUTUBE_API_KEY" \
    TENOR_API_KEY="$TENOR_API_KEY" \
    uvicorn main:app --host 0.0.0.0 --port 8000 > /tmp/vibestump-backend.log 2>&1 &
```
Env vars are passed explicitly through `env` to avoid issues with `nohup` dropping the shell environment.

---

## Architecture

```
┌─────────────────────────────────────────────────────────────┐
│  USER (IPL Fan — Browser)                                   │
└──────────────────┬──────────────────────────────────────────┘
                   │ HTTP
                   ▼
┌─────────────────────────────────────────────────────────────┐
│  FRONTEND (Next.js 15 — Port 3000)                          │
│                                                             │
│  Header: [Stumps] VibeStump : Agentic Premier League [IPL]  │
│                                                             │
│  MatchSelector: 🔴 Today | ⏮ Previous (filtered by status) │
│                                                             │
│  Scoreboard ──────────────── TeamsGrid (box-in-box layout)  │
│                                                             │
│  ┌── LEFT (2/3) ─────────┐  ┌── RIGHT (1/3) ─────────────┐ │
│  │ LiveVideoPlayer       │  │ AgentCommentary (AI insights)│ │
│  │ RunsGraph (2 innings) │  │ AudienceMood / Memes        │ │
│  │ Commentary Feed       │  │ Points Table                │ │
│  │ Highlights (no embed) │  │ Upcoming Matches            │ │
│  └───────────────────────┘  └─────────────────────────────┘ │
│                                                             │
│  StumpMind Chat (global floating — all pages)               │
└──────────────────┬──────────────────────────────────────────┘
                   │ /api/* proxy (Next.js route handler)
                   ▼
┌─────────────────────────────────────────────────────────────┐
│  BACKEND (FastAPI — Port 8000)                              │
│                                                             │
│  5 Background Agents (asyncio, 10s cycle)                   │
│  ├─ ScoreAgent    → Cricinfo RSS ──OR── LiveSimulator       │
│  ├─ CommentaryAgent → Score delta → template events         │
│  ├─ InsightsAgent → Gemini 2.5 Flash ──OR── offline library │
│  ├─ MediaAgent   → YouTube API ──OR── static cards          │
│  └─ MemeAgent    → Tenor API ──OR── emoji reactions (UI)    │
│                                                             │
│  REST Endpoints: /api/matches, /api/live-score,             │
│  /api/score-progression, /api/commentary, /api/insights,    │
│  /api/highlights, /api/meme, /api/points-table,             │
│  /api/upcoming-matches, /api/teams, /api/teams/{code},      │
│  /api/players/{name}, POST /api/chat                        │
└──────────────────┬──────────────────────────────────────────┘
                   │ read / write
                   ▼
┌─────────────────────────────────────────────────────────────┐
│  SQLite (WAL mode) — vibestump.db                           │
│  matches | live_scores | score_progression (batting_team)   │
│  commentary | highlights | insights | memes                 │
│  points_table | upcoming_matches                            │
└──────────────────┬──────────────────────────────────────────┘
                   │ polled best-effort (graceful fallback)
                   ▼
┌─────────────────────────────────────────────────────────────┐
│  EXTERNAL APIs (all optional — system works without them)   │
│  ESPN Cricinfo RSS | Google Gemini 2.5 Flash                │
│  YouTube Data API v3 | Tenor API v2 | Google Search         │
└─────────────────────────────────────────────────────────────┘
```

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Backend framework | FastAPI ≥ 0.115, Python 3.12 |
| Database | SQLite WAL mode |
| AI engine | Google Gemini 2.5 Flash (`google-genai`) |
| Live data | ESPN Cricinfo RSS + LiveSimulator fallback |
| Frontend | Next.js 15, React 19, TypeScript 5.6+ |
| Styling | Tailwind CSS v4 (glassmorphism) |
| State management | Zustand 5 |
| Animation | Framer Motion 12 |
| Charts | Recharts 2.12 |

---

## Feature Matrix

| Feature | Online | Offline (Zscaler) |
|---------|--------|-------------------|
| Live scoreboard | ✅ Real RSS data | ✅ LiveSimulator |
| Ball-by-ball events | ✅ Real events | ✅ Simulated events |
| Commentary feed | ✅ Gemini-written | ✅ Template strings |
| AI insights | ✅ Gemini analysis | ✅ Pre-written facts |
| StumpMind chat | ✅ Gemini + Search | ✅ Offline message |
| Highlights | ✅ YouTube API | ✅ Card + external link |
| Memes | ✅ Tenor GIFs | ✅ Emoji reactions |
| AudienceMood | ✅ Tenor meme image | ✅ Emoji + crowd bar |
| Points table | ✅ Real standings | ✅ Seeded IPL 2026 |
| Team Playing XI | ✅ Seeded squads | ✅ Seeded squads |
| Runs vs Overs chart | ✅ Both innings | ✅ Both innings |

---

## Quick Start

### One-Command Setup
```bash
# First-time: installs deps, builds frontend, seeds DB
bash deploy.sh local

# Start both services
bash deploy.sh start
# Open: http://localhost:3000
```

> **Note:** The frontend uses Next.js standalone output. After `deploy.sh local`,
> the start command runs `node .next/standalone/server.js` — NOT `next start`.

### Environment Variables (`.env` in project root)
```bash
GEMINI_API_KEY=your_key   # Optional — system works without it
YOUTUBE_API_KEY=your_key  # Optional — static highlights shown without it
TENOR_API_KEY=your_key    # Optional — emoji reactions shown without it
```

### Cloud Deploy (GCP Cloud Run)
```bash
bash deploy.sh setup      # First-time GCP setup
bash deploy.sh backend    # Deploy backend only
bash deploy.sh frontend   # Deploy frontend only
bash deploy.sh status     # Show live URLs
```

---

## Project Structure

```
VibeStump-main/
├── backend/
│   ├── main.py           # FastAPI app + agent lifecycle
│   ├── database.py       # SQLite CRUD helpers
│   ├── agents.py         # 5 agents + LiveSimulator class
│   ├── tools.py          # Team metadata + SQUAD_DATA (Playing XI)
│   └── seed.py           # Startup data seeder (IPL 2026)
│
├── frontend/
│   ├── app/
│   │   ├── layout.tsx        # Root layout — mounts global StumpMind chat
│   │   ├── page.tsx          # Main dashboard
│   │   ├── team/[teamId]/    # Team detail: Playing XI + Bench
│   │   ├── player/[playerId]/# Player stats
│   │   └── api/[...path]/    # Next.js → FastAPI proxy
│   │
│   ├── components/
│   │   ├── AudienceMood.tsx      # Crowd emotion + meme + emoji reactions
│   │   ├── ClientProviders.tsx   # Global wrapper — mounts StumpMindChat on all pages
│   │   ├── MatchSelector.tsx     # Today/Previous match dropdowns
│   │   ├── TeamsGrid.tsx         # Box-in-box 10-team panel
│   │   ├── RunsGraph.tsx         # Dual-innings Recharts line chart
│   │   ├── PointsTable.tsx       # IPL 2026 standings
│   │   ├── UpcomingMatches.tsx   # Fixtures schedule
│   │   ├── Highlights.tsx        # Card-based highlight UI (no iframe)
│   │   ├── Scoreboard.tsx        # Live score + event glow animation
│   │   ├── Commentary.tsx        # Ball-by-ball event feed
│   │   ├── AgentCommentary.tsx   # AI insights panel
│   │   └── StumpMindChat.tsx     # Floating chatbot (mounted via ClientProviders)
│   │
│   └── lib/
│       ├── store.ts          # Zustand store + TEAM_THEMES + activeEvent
│       ├── api.ts            # Typed fetch helpers
│       └── SoundManager.ts   # Audio cues
│
├── architecture.puml     # PlantUML system diagram
├── deploy.sh             # Local + GCloud deploy script
└── requirements.md       # Original product requirements
```

---

## Design Principles

1. **Offline-first** — Every external API call has a fallback; never shows a blank dashboard
2. **Agentic data flow** — External APIs → Agents → SQLite → FastAPI → Frontend (clean separation)
3. **Progressive enhancement** — Base experience works without any API key
4. **Event-driven UI** — WICKET/SIX/FOUR cascade: glow animation → sound → crowd mood → meme
5. **No broken UI** — All external images use `onError` fallbacks; no silent failures
