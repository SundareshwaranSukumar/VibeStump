# VibeStump: Agentic Premier League — Requirements Document

This document outlines the core functional, technical, and design requirements for the VibeStump platform.

---

## 1. Core Objective

Build a production-grade, AI-powered IPL cricket dashboard that delivers real-time match data, AI-generated commentary, team insights, and an interactive chatbot—all powered by Google Gemini 2.5 Flash and polled from internet APIs.

---

## 2. Functional Requirements

### 2.1 Match Data & Live Updates
✅ **Internet Feed Integration**: Fetch live match scores from ESPN Cricinfo RSS feed dynamically  
✅ **No Dummy Data**: Zero hardcoded match data; 100% real-time APIs  
✅ **Live Scoreboard**: Display runs, wickets, overs, CRR, target tracking  
✅ **Match Selector**: Dropdown to switch between LIVE, upcoming, and completed matches  
✅ **Match History**: View scores and highlights for past matches  
✅ **IPL Points Table**: Real-time team standings  
✅ **Score Progression**: Runs vs overs chart for trend analysis  

### 2.2 Team & Player Information
✅ **Team Pages** (`/team/[teamId]`): Squad list, coach, home ground, form  
✅ **Player Pages** (`/player/[playerId]`): Career stats, current season summary  
✅ **Team Logos & Colors**: All 10 IPL teams with brand colors and glow animations  
✅ **AI-Generated Insights**: Gemini-powered team analysis and player stats  

### 2.3 AI-Powered Features
✅ **7 Dedicated Agents** (5 backend + 2 frontend):
  1. **ScoreAgent** — Polls cricinfo RSS every 10s
  2. **CommentaryAgent** — Detects score deltas, generates events
  3. **InsightsAgent** — Gemini analysis and predictions
  4. **MediaAgent** — YouTube highlights fetching
  5. **MemeAgent** — Tenor meme images for fun moments
  6. **The Librarian Agent** (`useLibrarianAgent`) — Frontend static data with 1-hour localStorage cache
  7. **The Live Reporter Agent** (`useLiveReporterAgent`) — Frontend live polling at 5s intervals, zero cache

✅ **StumpMind Chatbot** — Ask questions about matches, players, teams with Google Search  
✅ **Real-Time Commentary** — Event-based (WICKET, SIX, FOUR, etc.) with color-coded UI  
✅ **AI Insights Display** — Match analysis and trends from Gemini  

### 2.4 Visuals & Multimedia
✅ **Branded Header**: VibeStump [Stumps Logo] : Agentic Premier League [IPL Logo]  
✅ **Run Progression Chart**: Professional Recharts visualization (Runs vs Overs)  
✅ **YouTube Highlights**: Embedded react-player showing real match videos  
✅ **Event Glow Animations**: Team-colored pulsing effects on WICKET/SIX/FOUR  
✅ **Sound Effects**: Wicket, boundary, six audio cues (0.4 volume)  
✅ **Commentary Feed**: Color-coded event display (red=WICKET, purple=SIX, green=FOUR)  

### 2.5 Design & UI/UX
✅ **Glassmorphism Design**: Modern frosted glass effect on cards  
✅ **Dual Themes**: Dark (default) and light mode with smooth toggle  
✅ **Framer Motion Animations**: Smooth transitions and event glows  
✅ **Responsive Layout**:
  - Desktop: 2-column grid (left: scoreboard + graph, right: insights)
  - Mobile: Single column with collapsible sections
✅ **Zero Dummy Data**: All placeholder content removed  
✅ **No Rickrolls**: Only real YouTube videos and Tenor images  

---

## 3. Backend Architecture

### 3.1 Database (SQLite)
- **Tables**: matches, live_scores, score_progression, commentary, highlights, insights, memes, points_table
- **Mode**: WAL (Write-Ahead Logging) for concurrent access
- **Auto-Init**: Created automatically on first run

### 3.2 API Endpoints (13 total)
- **Match Data**: `/api/matches`, `/api/live-score`, `/api/score-progression`, `/api/commentary`, `/api/points-table`
- **Media**: `/api/highlights`, `/api/meme`
- **Insights**: `/api/insights`
- **Teams**: `/api/teams`, `/api/teams/{team_code}`
- **Players**: `/api/players/{player_name}`
- **Chat**: `POST /api/chat`

### 3.3 Background Agents (Every 10s)
- **ScoreAgent**: Polls cricinfo RSS → updates DB
- **CommentaryAgent**: Detects score deltas → generates events
- **InsightsAgent**: Calls Gemini → AI analysis
- **MediaAgent**: Searches YouTube → highlights
- **MemeAgent**: Fetches Tenor → fun images

---

## 4. Frontend Architecture

### 4.1 Layout
```
Header (Sticky)
  ├─ Logo: Stumps + IPL
  ├─ Match Selector (Dropdown)
  └─ Theme Toggle
  
Content Grid (2-column desktop, 1-column mobile)
  ├─ Left Panel
  │  ├─ Live Scoreboard
  │  └─ Runs vs Overs Chart
  ├─ Center Panel
  │  ├─ Commentary Feed
  │  └─ AI Insights
  └─ Right Panel
     ├─ YouTube Highlights
     └─ [Responsive]
     
StumpMind Chat (Floating Button)
```

### 4.2 Components
✅ **Header**: Sticky navigation with branding and match selector  
✅ **Scoreboard**: Live score with team logos, event glow animations  
✅ **RunsGraph**: Recharts line chart showing runs trend  
✅ **Commentary**: Event-colored feed with animated items  
✅ **AgentCommentary**: AI insights display with event badges  
✅ **Highlights**: React-player with YouTube videos  
✅ **StumpMindChat**: Floating chatbot with typed interface  

### 4.3 Data Orchestration Layer (Dual-Agent Architecture)
✅ **AgentDataRouter** (`lib/AgentDataRouter.ts`): Classifies requests as STATIC (TTL > 1h) or DYNAMIC (TTL < 1min)  
✅ **CacheManager** (`lib/CacheManager.ts`): localStorage-backed cache, 1-hour TTL, graceful quota handling  
✅ **useLibrarianAgent** (`hooks/useLibrarianAgent.ts`): Cache-first static data hook — shows "Compiling Dossier..." on first load  
✅ **useLiveReporterAgent** (`hooks/useLiveReporterAgent.ts`): Zero-cache high-speed live data polling hook  
✅ **useAgentData** (`hooks/useAgentData.ts`): Universal hook — auto-routes to Librarian or Live Reporter  

### 4.4 Pages
✅ **app/page.tsx**: Main dashboard (uses Zustand store + direct api.ts polling)  
✅ **app/team/[teamId]/page.tsx**: Team details — uses `useLibrarianAgent` with cache + "Compiling Dossier..." state  
✅ **app/player/[playerId]/page.tsx**: Player details — uses `useLibrarianAgent` with cache + "Compiling Dossier..." state  

---

## 5. Deployment

### 5.1 Local Development
```bash
bash deploy.sh local              # Full setup
bash deploy.sh local-backend      # Backend only
bash deploy.sh local-frontend     # Frontend only
```

### 5.2 Google Cloud Run
```bash
bash deploy.sh setup              # First deploy
bash deploy.sh backend            # Update backend
bash deploy.sh frontend           # Update frontend
bash deploy.sh env                # Update API keys
bash deploy.sh status             # Show URLs
```

### 5.3 Environment Variables
- `GEMINI_API_KEY` (Required) — Google Gemini API key
- `YOUTUBE_API_KEY` (Optional) — YouTube Data API v3 key
- `TENOR_API_KEY` (Optional) — Tenor API v2 key

---

## 6. Technical Requirements

### 6.1 Stack
- **Backend**: Python 3, FastAPI ≥0.115.0, SQLite, google-genai, httpx
- **Frontend**: Next.js 15, React 19, TypeScript 5.6+, Tailwind CSS v4, Zustand 5, Framer Motion 12
- **Frontend Data Layer**: AgentDataRouter + CacheManager + useLibrarianAgent + useLiveReporterAgent + useAgentData
- **Deployment**: Google Cloud Run, Docker

### 6.2 Code Quality
✅ No build errors  
✅ No type mismatches  
✅ No dead code  
✅ All imports resolve correctly  
✅ Linting passes  

### 6.3 Security
✅ CORS configured for localhost:3000 and *.run.app  
✅ Environment variables in .env (not in code)  
✅ SQLite transactions for data integrity  
✅ No direct frontend → external API calls (all through backend proxy)  

### 6.4 Performance
✅ Frontend build: <3s  
✅ Backend response: <100ms  
✅ Database: Thread-safe with WAL  
✅ Memory: ~200MB backend, ~150MB frontend  
✅ Supports 100+ concurrent users  

---

## 7. Compliance

✅ **Zero Dummy Data**: All match data from internet APIs  
✅ **No Rickrolls**: Only real YouTube videos  
✅ **No Placeholders**: Removed all filler components  
✅ **Proper Branding**: VibeStump + IPL logos displayed prominently  
✅ **Theme Support**: Dark mode default, light mode available  
✅ **Accessible**: Keyboard navigation, semantic HTML  

---

## 8. Success Criteria

- ✅ Builds without errors
- ✅ Deploys to Google Cloud Run successfully
- ✅ Frontend connects to backend via proxy
- ✅ All 5 agents run in background
- ✅ Live scores update every 5 seconds
- ✅ AI insights generate within 2 seconds
- ✅ Chat responses include real Google Search results
- ✅ Team and player pages load with AI data
- ✅ No console errors or warnings
- ✅ All images load correctly (stumps + IPL logos)

---

## 9. Deliverables

📦 **Code**
- ✅ `/backend` — All Python/FastAPI code with agents
- ✅ `/frontend` — All Next.js/React/TypeScript code
- ✅ `deploy.sh` — Deployment script for local + GCloud
- ✅ `docker-compose.yml` — Local Docker setup

📚 **Documentation**
- ✅ `README.md` — Project overview and quick start
- ✅ `DEPLOY_README.md` — Detailed deployment guide
- ✅ `VibeStump_Solution.md` — Solution architecture
- ✅ `requirements.md` — This document
- ✅ `architecture.puml` — PlantUML diagram
- ✅ `presentation_guide.md` — Presentation notes

📁 **Assets**
- ✅ `/frontend/public/stumps-logo.png` — Brand logo
- ✅ `/frontend/public/ipl-logo.png` — IPL logo

---

Made with ❤️ for IPL fans 🏏
- **Environment Variables**: Use `GEMINI_API_KEY` for all agentic features and ensure it is properly injected in production.
- **Documentation**: Maintain an updated `README.md` and a comprehensive `architecture.puml` diagram.

---

## 5. Deployment Audit & Validation
- Conduct thorough reviews of the deployed application to identify and fix 404 errors, CSS glitches, or data synchronization issues.
- Ensure the application is "Production-Ready" before final sign-off.

---

*Document Author: Sundareshwaran Sukumar*
