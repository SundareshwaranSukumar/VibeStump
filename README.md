# 🏏 VibeStump — Agentic Premier League (APL) Experience

> **A real-time, AI-powered second-screen fan companion for IPL matches.**
> Built with Streamlit, Google Gemini, and deployed on Google Cloud Run.

![Python](https://img.shields.io/badge/Python-3.11-blue?logo=python)
![Streamlit](https://img.shields.io/badge/Streamlit-1.30+-red?logo=streamlit)
![Gemini](https://img.shields.io/badge/Google_Gemini-2.5_Flash-purple?logo=google)
![Cloud Run](https://img.shields.io/badge/Cloud_Run-Serverless-orange?logo=googlecloud)
![Tests](https://img.shields.io/badge/Tests-pytest-green?logo=pytest)

---

## 🎯 Problem Statement

Cricket fans experience extreme emotional swings during live matches. Existing apps show plain scores — **zero emotional intelligence, zero engagement**. VibeStump solves this with an **agentic AI loop** that reads the match, feels the crowd, and acts accordingly.

## 🏗️ Architecture

VibeStump operates a **multi-agent pipeline** that executes autonomously every 8–30 seconds:

```
Fan Dashboard (Streamlit)
    │
    ├─→ 🔭 SCOUT AGENT (tools.py)
    │       ├── ESPNcricinfo RSS Feed (live)
    │       └── SimulatedLiveFeed (fallback)
    │
    ├─→ 🧠 PSYCHOLOGIST AGENT (agents.py)
    │       ├── Gemini 2.5 Flash — Structured JSON
    │       └── Offline keyword heuristics (fallback)
    │
    ├─→ 📚 HISTORIAN AGENT (agents.py)
    │       ├── Triggered on WICKET / SIX events
    │       └── Gemini-powered IPL historical deep-dives
    │
    ├─→ 🎬 EXECUTOR AGENT (tools.py)
    │       ├── Meme Dictionary (Giphy)
    │       └── Diversion Protocol (mock Swiggy / Netflix)
    │
    └─→ 🎬 YOUTUBE VOD HUB (tools.py)
            ├── YouTube Data API v3
            └── Fallback video list
```

> See `architecture.puml` for a full PlantUML diagram.

## 🎨 Design

- **Glassmorphism Dark Mode**: Deep navy (`#0B172A`), translucent cards with blur effects, neon accents.
- **Dynamic Team Theming**: All 10 IPL teams supported. Select a team → entire UI updates to match jersey colors.
- **3-Pane Broadcast Dashboard**: Live Commentary + Tension Gauge | Vibe Trend Chart | Agent Interventions.

## 🧠 Key Features

| Feature | Description |
|---|---|
| **Tension Meter** | Plotly gauge chart (0–10) showing real-time match intensity |
| **Vibe Trend** | Area chart tracking emotional history across the match |
| **Historian** | AI-generated IPL history comparisons on critical moments |
| **Diversion Protocol** | When vibe drops below -6 for 2 consecutive balls, offers comfort food (Swiggy) or Netflix |
| **YouTube VODs** | Embedded match highlights via YouTube Data API |
| **Demo Mode** | Full RCB vs KKR Match 57 simulation — works offline, guaranteed |

## 📁 Project Structure

```
VibeStump/
├── app.py                  # Streamlit UI & agentic loop
├── agents.py               # Psychologist & Historian agents
├── tools.py                # Scout, Executor, YouTube, mock APIs
├── theme.py                # ThemeManager — glassmorphism CSS & team palettes
├── utils.py                # Environment config helpers
├── fallback_data.json      # Offline commentary data
├── tests/
│   └── test_agent_loops.py # pytest suite (CI-ready)
├── Dockerfile              # Multi-stage, Cloud Run optimized
├── cloudbuild.yaml         # Google Cloud Build CI/CD pipeline
├── .env.example            # Environment variable template
├── architecture.puml       # PlantUML architecture diagram
└── README.md               # This file
```

## 📋 Prerequisites

- **Python 3.11+**
- **Docker** (for containerized deployment)
- **Google Cloud CLI** (for Cloud Run)
- **API Keys:**
  - `GEMINI_API_KEY` (required) — [Google AI Studio](https://aistudio.google.com/)
  - `YOUTUBE_API_KEY` (optional) — [Google Cloud Console → YouTube Data API v3](https://console.cloud.google.com/)

## 💻 Local Setup

```bash
# 1. Clone & navigate
cd VibeStump

# 2. Create environment file
cp .env.example .env
# Edit .env and add your GEMINI_API_KEY

# 3. Install dependencies
pip install -r requirements.txt

# 4. Run tests
python -m pytest tests/ -v

# 5. Launch the app
streamlit run app.py
```

> 💡 **Tip:** Toggle "Demo Mode" in the sidebar to see the full RCB vs KKR final-over simulation without any API keys!

## ☁️ Deployment (Google Cloud Run)

### Option A: Direct Deploy

```bash
gcloud run deploy vibestump \
  --source . \
  --port 8080 \
  --set-env-vars GEMINI_API_KEY="your_key" \
  --allow-unauthenticated \
  --region asia-south1
```

### Option B: CI/CD via Cloud Build

```bash
gcloud builds submit --config cloudbuild.yaml \
  --substitutions _GEMINI_API_KEY="your_key" .
```

This runs the full pipeline: **Tests → Build → Push → Deploy**.

## 🧪 Testing

The `tests/test_agent_loops.py` suite validates all agent reasoning loops and tool functions **without any API keys** (uses offline heuristics). Designed for 24/7 CI.

```bash
python -m pytest tests/test_agent_loops.py -v
```

## ⚡ Performance

- **Target latency**: < 3 seconds per agentic cycle
- **Model**: `gemini-2.5-flash` (structured JSON output)
- **Scaling**: Cloud Run auto-scales 0 → 10 instances based on traffic
- **Fallbacks**: Every external dependency has a local fallback — the app never crashes
