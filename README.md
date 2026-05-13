# VibeStump — Agentic Premier League

> High-Fidelity AI-powered sports broadcast companion for live IPL matches. Powered by Google Gemini.

## Architecture

```
Next.js Frontend (Port 3000)  <-->  FastAPI Backend (Port 8000)
  - Broadcast Overlays (Framer Motion) - Scout Agent    --> Cricinfo / SQLite DB
  - Oracle Mini-Game (Zustand state)   - Psychologist   --> Gemini 2.5 Flash / Tenor API
  - Background Ambience (react-player) - Historian      --> Gemini 2.5 Flash
  - Slide-out Chatbot                  - Oracle Agent   --> Gemini Google Search API
```

See `architecture.puml` for the full PlantUML diagram.

## Project Structure

```
VibeStump/
├── backend/
│   ├── main.py              # FastAPI routes (chat, oracle, score, analyze)
│   ├── agents.py            # Psychologist, Historian, Oracle, Simulators
│   ├── tools.py             # Scout (Web Scraping + DB storage), Tenor API
│   ├── database.py          # SQLite DB storage for match data
│   ├── requirements.txt
│   └── Dockerfile           # Optimized Cloud Run config
├── frontend/
│   ├── app/                 # Next.js App Router
│   ├── components/          # High-fidelity Broadcast UI components
│   ├── lib/                 # Zustand store, SoundManager, useOracle API hook
│   ├── package.json
│   └── Dockerfile           # Multi-stage standalone Next.js deployment
├── deploy.sh                # GCloud deploy & update script
├── docker-compose.yml       # Local dev with Docker
├── .env.example             # Environment variable template
├── VibeStump_Solution.md    # Hackathon Submission Details
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

Open http://localhost:3000. Live Mode is ON by default.

## Environment Variables

| Variable | Required | Purpose |
|---|---|---|
| `GEMINI_API_KEY` | Yes | Powers Psychologist, Historian, Oracle, and Google Search agents |
| `YOUTUBE_API_KEY` | No | Enables YouTube match highlight search |

Without optional keys, the app uses Gemini Simulation data and fallback videos. The demo never crashes.

## Key Features

| Feature | Description |
|---|---|
| **High-Fidelity Broadcast UI** | Massive Framer Motion animations for Wickets and Boundaries. |
| **Oracle Mini-Game** | Predict the vibe of the next ball and win Fan Points. |
| **Search-Enabled Chatbot** | Ask Gemini live questions with the Google Search Tool directly in the UI. |
| **Dynamic Audio Sync** | Built-in `SoundManager` plays triggers like "Faah" when wickets fall. |
| **Database Match Logging** | Scout Agent permanently stores internet scraped match data in an SQLite Database. |
---

© 2026 Sundareshwaran Sukumar. All rights reserved. 
This project is proprietary and built for high-fidelity agentic sports broadcasting.
