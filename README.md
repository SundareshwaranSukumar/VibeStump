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
├── deploy.sh                # One-command GCloud deploy
├── deploy.ps1               # Windows PowerShell deploy
├── docker-compose.yml       # Local dev with Docker
├── .env.example             # Environment variable template
└── README.md
```

## Deploy to Google Cloud Run

### Step 1: Clone and configure
```bash
git clone <repo-url> && cd VibeStump
cp .env.example .env
# Edit .env and add your GEMINI_API_KEY
```

### Step 2: Authenticate with GCloud
```bash
gcloud auth login
gcloud config set project YOUR_PROJECT_ID
```

### Step 3: Deploy (one command)
```bash
bash deploy.sh
```

The script will:
1. Prompt for your `GEMINI_API_KEY` if not set
2. Deploy the FastAPI backend to Cloud Run
3. Capture the backend URL automatically
4. Deploy the Next.js frontend pointing to that backend
5. Print the live URLs

### Manual deploy (if you prefer)
```bash
# Backend
gcloud run deploy vibestump-api \
  --source ./backend --port 8000 --region asia-south1 \
  --set-env-vars GEMINI_API_KEY="YOUR_KEY" \
  --allow-unauthenticated

# Frontend (replace BACKEND_URL with URL from above)
gcloud run deploy vibestump-ui \
  --source ./frontend --port 3000 --region asia-south1 \
  --set-env-vars NEXT_PUBLIC_API_URL="BACKEND_URL" \
  --allow-unauthenticated
```

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
