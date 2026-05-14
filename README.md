# VibeStump — Agentic Premier League

> AI-powered real-time IPL 2026 dashboard — 6-agent backend, ESPN Cricinfo RSS + Cricbuzz live data, Next.js 15 frontend.

---

## Key Challenges & How We Solve Them

### Challenge 1 — Reliable Real-Time Cricket Data Without Premium APIs

**Problem:** Live cricket score APIs are either paywalled, rate-limited, or blocked in restricted network environments.

**Solution — Cricbuzz + ESPN RSS as Primary Data Sources:**

```
ScoreAgent cycle (every 10s):
    1. ESPN Cricinfo RSS        → parse IPL match titles + scores
                                  Title format: "Punjab Kings 200/8 v Mumbai Indians 53 *"
    2. Fallback: preserve DB    → display last known score until refresh

DataFetchAgent (on startup + every ~5 min):
    Cricbuzz series page scrape (series ID 9241 — IPL 2026)
    → RSC JSON extraction → structured JSON
    → upsert points_table, upcoming_matches, match_results

    Fallback: verified hardcoded seed data (Matches 55–63)
    → ensures dashboard always shows real, meaningful data even if scrape fails
```

Every agent wraps external calls in `try/except`. On full failure, the last known data is preserved and displayed until the next successful refresh.

---

### Challenge 2 — Score Parsing for Variable RSS Title Formats

**Problem:** ESPN Cricinfo RSS titles use inconsistent formats. The batting team's score appears as `"53 *"` (no wicket separator `/`) when no wickets have fallen, while completed innings appear as `"200/8"`. Naïve regex expecting `/` returned `0/0` for the batting team.

**Solution — Flexible Score Parser in `tools.py`:**

`parse_match_title` uses a two-phase regex:
1. Detect `"v"` or `"vs"` to split the title into two sides
2. For each side, match `(\d+(?:\/\d+)?)\s*\*?` — the `(?:\/\d+)?` makes wickets optional
3. The `*` suffix (batting team indicator) drives which side is `batting_team`

```python
# "Punjab Kings 200/8 v Mumbai Indians 53 *"
# → batting_team="Mumbai Indians", runs=53, wickets=0
# → bowling_team="Punjab Kings", completed_score="200/8"
```

Overs default to `""` (not `"0.0"`) since RSS titles never include overs. The frontend renders `"—"` in that case.

---

### Challenge 3 — YouTube Embeds Blocked or Unavailable

**Problem:** `react-player` YouTube embeds can fail silently in restricted environments.

**Solution:**
- Highlights section uses card-based UI (no `<iframe>`)
- Each highlight card shows a team-colored gradient + cricket icon + match title
- "Watch on YouTube" external link opens in a new tab
- `MediaAgent` extracts real YouTube video IDs from search results via regex
- `onError` handler hides broken thumbnail images gracefully

---

### Challenge 4 — Single-Innings Score Graph

**Problem:** Runs vs Overs chart only tracked the current batting innings.

**Solution:**
- Added `batting_team` column to `score_progression` table
- Both innings are stored separately under the same `match_id`
- `RunsGraph` groups data points by `batting_team` and renders two colored lines with legend
- Each team's line uses their brand color from `TEAM_THEMES`

---

### Challenge 5 — Stadium Jumbotron & Live Events

**Problem:** The dashboard lacked any sense of the crowd's emotional state. Batting events (WICKET, SIX, FOUR) happened silently with no visible crowd reaction.

**Solution — `Jumbotron` Component (`frontend/components/Jumbotron.tsx`):**

An LED dot-matrix stadium display that reacts to live match events. It reads `activeEvent` from Zustand and shows dramatic overlays:

| Event  | Display               | Effect                    |
| ------ | --------------------- | ------------------------- |
| WICKET | 💀 LED text + red glow | EmojiRain + crowd roar    |
| SIX    | 🚀 LED text + purple   | EmojiRain + stadium shake |
| FOUR   | 🏏 LED text + green    | EmojiRain + applause      |
| NOBALL | ⚠️ LED text + yellow   | Alert animation           |
| DOT    | 🔵 LED text + blue     | Subtle pulse              |

**Features:**
- **LED dot-matrix display** — stadium-style scrolling text with retro pixel font
- **EmojiRain child component** — cascading emojis on major events
- **Strategic Timeout mode** — countdown timer with animated break display
- **5s auto-reset** — events clear after 5 seconds, returning to Live Score
- **Live Score** — reads `score` from Zustand for ambient match energy display

**Event cascade flow:**
```
ScoreAgent detects real score delta
  → CommentaryAgent writes event_type to DB
  → MemeAgent fetches Tenor GIF (or null) and stores it
  → Frontend polls /api/commentary every 5s
  → activeEvent set in Zustand store
  → Jumbotron reacts: LED overlay + EmojiRain + auto-reset
  → SoundManager plays wicket/six/boundary audio cue
  → Scoreboard glows in team color
```

---

### Challenge 6 — Team/Player Pages Re-Fetching on Every Navigation

**Problem:** Every navigation to a team or player page triggered a backend API call — even for the same team — causing unnecessary latency.

**Solution — Dual-Agent Data Orchestration:**

```
Component calls useAgentData({ query: 'CSK Roster', type: 'auto' })
         │
         ▼
  AgentDataRouter.classifyRequest()
         │
         ├─ STATIC (TTL > 1h)  → useLibrarianAgent
         │       │
         │       ├─ CacheManager.get('team_csk') → HIT  → return instantly (0ms)
         │       └─ Cache MISS → show "Compiling Dossier..." → fetch backend → cache → return
         │
         └─ DYNAMIC (TTL < 1min) → useLiveReporterAgent
                 │
                 └─ Poll /api/live-score + /api/commentary every 5s
                    NO cache write. Pure speed.
```

**Classification rules:**

| Data Type | Examples                                              | Agent         | TTL        |
| --------- | ----------------------------------------------------- | ------------- | ---------- |
| STATIC    | Team roster, player bio, career stats, coach, stadium | Librarian     | 5 minutes  |
| DYNAMIC   | Live score, commentary, run rate, events, memes       | Live Reporter | < 1 minute |

**Files:**
- `frontend/lib/CacheManager.ts` — localStorage cache with 5-minute TTL
- `frontend/lib/AgentDataRouter.ts` — keyword-based request classifier
- `frontend/hooks/useLibrarianAgent.ts` — cache-first static data hook
- `frontend/hooks/useLiveReporterAgent.ts` — zero-cache live polling hook
- `frontend/hooks/useAgentData.ts` — universal routing hook

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
│  │ LiveVideoPlayer       │  │ Match Insights (AI)         │ │
│  │ Runs Progression chart│  │ Jumbotron (LED events)      │ │
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
│  6 Background Agents (asyncio, 10s cycle)                   │
│  ├─ ScoreAgent     → ESPN Cricinfo RSS (live scores)        │
│  ├─ CommentaryAgent → Real score delta → template events    │
│  ├─ InsightsAgent  → Gemini 2.5 Flash                       │
│  ├─ MediaAgent     → YouTube API → search fallback          │
│  ├─ MemeAgent      → Tenor API                              │
│  └─ DataFetchAgent → Cricbuzz series 9241 (RSC JSON)        │
│                      Hardcoded seed fallback                │
│                      Runs immediately on startup            │
│                                                             │
│  REST Endpoints: /api/matches, /api/live-score,             │
│  /api/score-progression, /api/commentary, /api/insights,    │
│  /api/highlights, /api/meme, /api/points-table,             │
│  /api/upcoming-matches, /api/teams, /api/teams/{code},      │
│  /api/players/{name}, POST /api/chat, /api/completed-matches│
│  /api/match-result/{id}, /api/search, /api/live-search      │
└──────────────────┬──────────────────────────────────────────┘
                   │ read / write
                   ▼
┌─────────────────────────────────────────────────────────────┐
│  SQLite (WAL mode) — vibestump.db                           │
│  matches | live_scores | score_progression (batting_team)   │
│  commentary | highlights | insights | memes | match_results │
│  points_table | upcoming_matches                            │
└──────────────────┬──────────────────────────────────────────┘
                   │ polled on every agent cycle
                   ▼
┌─────────────────────────────────────────────────────────────┐
│  EXTERNAL SOURCES                                           │
│  ESPN Cricinfo RSS (live scores, PRIMARY)                   │
│  Cricbuzz.com — series/9241 (points table, results)         │
│  Google Gemini 2.5 Flash (AI insights, chat)                │
│  YouTube Data API v3 | Tenor API v2                         │
└─────────────────────────────────────────────────────────────┘
```

---

## Tech Stack

| Layer             | Technology                                            |
| ----------------- | ----------------------------------------------------- |
| Backend framework | FastAPI ≥ 0.115, Python 3.11                          |
| Database          | SQLite WAL mode                                       |
| AI engine         | Google Gemini 2.5 Flash (`google-genai`)              |
| Live data         | ESPN Cricinfo RSS + Cricbuzz (series 9241)            |
| Frontend          | Next.js 15, React 19, TypeScript 5.6+                 |
| Styling           | Tailwind CSS v4 (glassmorphism, light-first theme)    |
| State management  | Zustand 5                                             |
| Animation         | Framer Motion 12                                      |
| Charts            | Recharts 2.12                                         |
| Deployment        | GCP Cloud Run (backend + frontend, separate services) |

---

## Feature Matrix

| Feature                | Status                                             |
| ---------------------- | -------------------------------------------------- |
| Live scoreboard        | ✅ ESPN Cricinfo RSS, updated every 10s             |
| Ball-by-ball events    | ✅ Real score delta triggers WICKET/SIX/FOUR events |
| Commentary feed        | ✅ Template-driven from real score changes          |
| AI insights            | ✅ Gemini 2.5 Flash on live match events            |
| StumpMind chat         | ✅ DB-grounded + Gemini response                    |
| Highlights             | ✅ Real YouTube IDs; card UI, no embed              |
| Memes                  | ✅ Tenor GIFs on events                             |
| Jumbotron              | ✅ LED event display + EmojiRain + auto-reset       |
| Points table           | ✅ Cricbuzz series 9241; refreshed every ~5 min     |
| Upcoming schedule      | ✅ Cricbuzz series 9241; refreshed every ~5 min     |
| Recent results         | ✅ Cricbuzz series 9241; refreshed every ~5 min     |
| Team Playing XI        | ✅ Real IPL 2026 squads from tools.py               |
| Runs progression chart | ✅ Both innings tracked                             |

---

## Quick Start

### One-Command Setup
```bash
# First-time: installs deps, builds frontend, initialises DB schema
bash deploy.sh local

# Start both services
bash deploy.sh start
# Open: http://localhost:3000
```

> **Note:** The frontend uses Next.js standalone output. After `deploy.sh local`,
> the start command runs `node .next/standalone/server.js` — NOT `next start`.
>
> On first load the DataFetchAgent runs immediately and populates the points table,
> upcoming fixtures, and recent results from Cricbuzz. The scoreboard updates every
> 10 seconds from the ESPN Cricinfo RSS feed.

### Environment Variables (`.env` in project root)
```bash
GEMINI_API_KEY=your_key   # Optional — AI insights and chat disabled without it
YOUTUBE_API_KEY=your_key  # Optional — search fallback used without it
TENOR_API_KEY=your_key    # Optional — meme section empty without it
```

### Docker Compose (local)
```bash
cp .env.example .env   # fill in API keys
docker compose up --build
# Frontend: http://localhost:3000
# Backend:  http://localhost:8000
```

### Cloud Deploy (GCP Cloud Run)

**Prerequisites (one-time)**
```bash
# Install & authenticate Google Cloud SDK
gcloud auth login
gcloud config set project YOUR_PROJECT_ID   # e.g. my-gcp-project-123

# Enable required APIs (one-time, ~30 seconds)
gcloud services enable run.googleapis.com cloudbuild.googleapis.com
```

**First-time deploy — both services**
```bash
# Builds images via Cloud Build, deploys backend + frontend to Cloud Run
# Prompts for GEMINI_API_KEY if not in .env
bash deploy.sh setup
# → Prints live App URL and API URL when done
```

> On first start the DataFetchAgent runs immediately and populates the points table,
> upcoming fixtures, and recent results from Cricbuzz. The scoreboard updates every
> 10 seconds from the ESPN Cricinfo RSS feed.

**Redeploy after code changes**
```bash
bash deploy.sh backend    # backend only  (~2 min)
bash deploy.sh frontend   # frontend only (~2 min)
bash deploy.sh setup      # both services (~4 min)
```

**Update API keys without rebuilding (instant)**
```bash
bash deploy.sh env
```

**Check live URLs**
```bash
bash deploy.sh status
# → Backend:  https://vibestump-api-xxxx-uc.a.run.app
# → Frontend: https://vibestump-ui-xxxx-uc.a.run.app
# → API Docs: https://vibestump-api-xxxx-uc.a.run.app/docs
```

**GCP requirements:**
- Billing enabled on the project
- `gcloud` authenticated with an account that has Cloud Run Admin + Cloud Build Editor roles
- Override region (default `asia-south1`): `export GCP_REGION=us-central1`

---

## Project Structure

```
VibeStump-main/
├── backend/
│   ├── main.py           # FastAPI app + agent lifecycle (lifespan)
│   ├── database.py       # SQLite CRUD helpers; init_db() at import
│   ├── agents.py         # 6 agents; DataFetchAgent uses Cricbuzz on startup
│   ├── tools.py          # IPL_TEAMS + SQUAD_DATA + ESPN RSS + Cricbuzz scraper
│   └── seed.py           # Verified IPL 2026 seed data (Points table, Matches 55–63)
│
├── frontend/
│   ├── app/
│   │   ├── layout.tsx          # Root layout — mounts global StumpMind chat
│   │   ├── page.tsx            # Main dashboard (5 tabs)
│   │   ├── team/[teamId]/      # Team detail: Playing XI + Bench (useLibrarianAgent)
│   │   ├── player/[playerId]/  # Player stats (useLibrarianAgent)
│   │   └── api/[...path]/      # Next.js → FastAPI proxy (GET + POST)
│   │
│   ├── components/
│   │   ├── Jumbotron.tsx           # LED dot-matrix stadium display + EmojiRain
│   │   ├── EmojiRain.tsx           # Cascading emojis; exports JumbotronEvent type
│   │   ├── ClientProviders.tsx     # Global wrapper — mounts StumpMindChat
│   │   ├── MatchSelector.tsx       # Today/Previous match dropdowns
│   │   ├── TeamsGrid.tsx           # Box-in-box 10-team panel
│   │   ├── RunsGraph.tsx           # Dual-innings Recharts line chart
│   │   ├── PointsTable.tsx         # IPL standings (Cricbuzz)
│   │   ├── UpcomingMatches.tsx     # Fixtures schedule (Cricbuzz)
│   │   ├── Highlights.tsx          # Card-based highlight UI (no iframe)
│   │   ├── Scoreboard.tsx          # Live score + event glow animation
│   │   ├── Commentary.tsx          # Ball-by-ball event feed
│   │   ├── AgentCommentary.tsx     # Match insights panel
│   │   └── StumpMindChat.tsx       # Floating chatbot
│   │
│   ├── hooks/
│   │   ├── useLibrarianAgent.ts    # The Librarian: cache-first static data (1h TTL)
│   │   ├── useLiveReporterAgent.ts # The Live Reporter: zero-cache 5s polling
│   │   └── useAgentData.ts         # Universal hook — routes to correct agent
│   │
│   └── lib/
│       ├── store.ts              # Zustand store + TEAM_THEMES + activeEvent
│       ├── api.ts                # Typed fetch helpers for all endpoints
│       ├── AgentDataRouter.ts    # Classifies requests: STATIC vs DYNAMIC
│       ├── CacheManager.ts       # localStorage cache, 5-minute TTL
│       └── SoundManager.ts       # Audio cues (WICKET, SIX, FOUR)
│
├── architecture.puml     # PlantUML system diagram
├── docker-compose.yml    # Local Docker orchestration
├── deploy.sh             # Local + GCP Cloud Run deploy script
├── requirements.md       # Product requirements
└── README.md             # This file
```

---

## Design Principles

1. **Real-time data** — ESPN Cricinfo RSS drives live scores every 10 seconds. Cricbuzz powers points table, fixtures, and results.
2. **Agentic data flow** — External sources → Agents → SQLite → FastAPI → Frontend (clean separation)
3. **Dual-agent data routing** — STATIC data served from cache (Librarian); DYNAMIC data polled live (Reporter)
4. **Progressive enhancement** — Dashboard degrades gracefully with hardcoded seed data when live fetches fail
5. **Event-driven UI** — WICKET/SIX/FOUR cascade: glow animation → sound → crowd mood → meme
6. **No broken UI** — All external images use `onError` fallbacks; no silent failures
7. **GCP-native deployment** — Both services are containerised and deployed to Cloud Run with a single shell command
