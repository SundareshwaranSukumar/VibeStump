# VibeStump — Agentic Premier League

> AI-powered second-screen fan companion for live IPL matches. Powered by Google Gemini.

## Architecture

```
Next.js Frontend (Port 3000)  <-->  FastAPI Backend (Port 8000)
  - Recharts charts                   - Scout Agent    --> Cricbuzz / RSS
  - Zustand state                     - Psychologist   --> Gemini 2.5 Flash
  - Tailwind glassmorphism            - Historian       --> Gemini 2.5 Flash
  - Dynamic team theming              - Executor        --> Giphy / YouTube
```

See `architecture.puml` for the full PlantUML diagram.

## Project Structure

```
VibeStump/
├── backend/
│   ├── main.py              # FastAPI routes (7 endpoints)
│   ├── agents.py            # Psychologist + Historian agents
│   ├── tools.py             # Scout, YouTube, mock Swiggy/Netflix
│   ├── live_sim.json        # Match 57: RCB vs KKR simulation
│   ├── requirements.txt
│   └── Dockerfile
├── frontend/
│   ├── app/                 # Next.js layout, page, CSS
│   ├── components/          # 7 UI components
│   ├── lib/                 # Zustand store + API helpers
│   ├── package.json
│   └── Dockerfile
├── deploy.sh                # GCloud deploy & update script
├── docker-compose.yml       # Local dev with Docker
├── .env.example             # Environment variable template
└── README.md
```

## Deploy to Google Cloud Run

### Step 1: Configure
```bash
cp .env.example .env         # Add your GEMINI_API_KEY
gcloud auth login
gcloud config set project YOUR_PROJECT_ID
```

### Step 2: First-time deploy
```bash
bash deploy.sh setup
```
Builds and deploys both services. Prompts for API key if not in `.env`.

### Step 3: After making changes
```bash
bash deploy.sh backend       # Changed backend code? (~2 min, uses build cache)
bash deploy.sh frontend      # Changed frontend code? (~2 min, uses build cache)
bash deploy.sh env            # Changed only API keys? (instant, no rebuild)
bash deploy.sh status         # Check live URLs
```

> **Why is it fast?** After the first deploy, GCloud Build caches your Docker layers. Only changed layers are rebuilt. For env-only changes, `services update` is instant — no rebuild at all.

## Local Development

```bash
# Terminal 1: Backend
cd backend
pip install -r requirements.txt
uvicorn main:app --reload --port 8000

# Terminal 2: Frontend
cd frontend
npm install
npm run dev
```

Open http://localhost:3000. Demo Mode is ON by default — no API keys needed to explore.

## Environment Variables

| Variable | Required | Purpose |
|---|---|---|
| `GEMINI_API_KEY` | Yes | Powers Psychologist and Historian agents |
| `YOUTUBE_API_KEY` | No | Enables YouTube match highlight search |
| `RAPIDAPI_KEY` | No | Enables live Cricbuzz data |

Without optional keys, the app uses `live_sim.json` simulation data and fallback videos. The demo never crashes.

## Key Features

| Feature | Description |
|---|---|
| **Dynamic Team Theming** | 10 IPL teams. Select KKR → purple/gold. CSS variables, instant. |
| **Tension Meter** | Recharts radial gauge (0–10) |
| **Vibe Trend** | Area chart tracking emotional history across the match |
| **Historian** | Gemini-generated IPL history on critical moments |
| **Diversion Protocol** | Mock Swiggy/Netflix APIs when vibe drops below -7 |
| **Agent Monologue** | Psychologist streams its "internal thoughts" to the UI |
