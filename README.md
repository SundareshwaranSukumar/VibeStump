# 🏏 Agentic Premier League (APL): VibeStump Experience

Welcome to the ultimate **Agentic Premier League (APL)** experience. VibeStump has been completely overhauled to feature a stunning IPL Dark Mode UI and a sophisticated Multi-Agent architecture.

## 🚀 The Multi-Agent Architecture

VibeStump now runs on an autonomous loop powered by three specialized AI agents interacting with real-time data:

1. **🔭 The Scout Agent (`tools.py`)**: 
   - Responsible for data ingestion. It fetches live commentary and calculates the real-time scorecard (Runs, Wickets, Overs, Run Rate).
   - *Demo Mode Capability*: If the external API rate-limits, the Scout seamlessly transitions to a simulated high-tension T20 final over so your demo never crashes.

2. **🧠 The Psychologist Agent (`agents.py`)**:
   - Powered by Gemini 3 Flash. It processes the Scout's commentary stream and outputs a structured Pydantic schema detailing the crowd's `vibe_score` and `tension_index`.
   - It also flags "Critical Events" (e.g., Wickets, Sixes) and commands the Executor agent.

3. **📚 The Historian Agent (`agents.py`) [NEW!]**:
   - Sleeps until the Psychologist flags a critical event.
   - Once awakened, it pulls past statistical context (simulated via database) and uses Gemini to dynamically generate fascinating historical comparisons (e.g., comparing a current six to Chris Gayle's historical stats).

4. **🎬 The Executor Agent (`tools.py`)**:
   - Takes the emotional directives from the Psychologist and instantly deploys a highly relevant visual intervention (GIF/Meme) to the UI.

## 🎨 UI & Theming

The UI has been redesigned into a responsive 3-column layout featuring an "IPL Dark Mode":
- **Deep Navy Background** (`#0B172A`) with Neon Blue and Gold accents.
- **Left Sidebar**: The APL Tournament Hub showing fixtures and agent statuses.
- **Top Header**: The real-time Live Scoreboard.
- **Center Feed**: The live streaming commentary and the Plotly Tension Gauge.
- **Right Action Column**: The dedicated space for Agent Interventions (Memes and Historian Insights).

## 📋 Prerequisites
- Python 3.11+
- Docker (for containerization)
- Google Cloud CLI (for deployment)
- API Keys: `GEMINI_API_KEY`

## 💻 Local Setup & Execution

1. **Clone the repository and navigate to the directory:**
   ```bash
   cd VibeStump
   ```

2. **Set up your environment variables:**
   Copy the example environment file and add your keys.
   ```bash
   cp .env.example .env
   ```
   *Edit `.env` and add your `GEMINI_API_KEY`.*

3. **Install Dependencies:**
   ```bash
   pip install -r requirements.txt
   ```

4. **Run the Application:**
   ```bash
   streamlit run app.py
   ```
   *Pro-Tip: Toggle "Demo Mode" in the sidebar to witness the simulated final over and see the Historian Agent in action!*

## ☁️ Deployment Guide (Google Cloud Run)

This project is Dockerized and optimized for Google Cloud Run's serverless architecture.

1. **Authenticate with Google Cloud:**
   ```bash
   gcloud auth login
   ```

2. **Set your Google Cloud Project:**
   ```bash
   gcloud config set project YOUR_PROJECT_ID
   ```

3. **Deploy from Source:**
   ```bash
   gcloud run deploy vibestump \
     --source . \
     --port 8080 \
     --set-env-vars GEMINI_API_KEY="your_api_key_here" \
     --allow-unauthenticated
   ```

4. **Access the App:** Click the provided URL to view your live APL Hub!
