# 🏏 VibeStump: Agentic Fan-Manager

VibeStump is a high-performance, agentic Streamlit application designed to analyze live cricket commentary and manage fan emotions in real-time. It uses **Google Gemini** as the reasoning engine to serve as a "Psychologist," evaluating the mood and tension of the match, and an "Executor" agent that fetches dynamic visual interventions (memes/GIFs) to manage fan hype.

## 🚀 Project Overview
- **The Problem**: Fans experience extreme emotional volatility during live matches.
- **The Solution**: An agentic loop that reads live match commentary, structures the emotional data, and intervenes with perfectly timed, context-aware memes to manage tension.
- **Theme**: Bengaluru / RCB (Red, Gold, Black).

## 🏗️ Architecture
- `app.py`: Streamlit UI, visual layout, and auto-refresh loop.
- `agents.py`: **The Psychologist** (Gemini integration with Pydantic structured outputs).
- `tools.py`: **The Scout** (Live Cricket API / Simulation Fallback) and **The Executor** (Giphy API / Meme fallback).
- `utils.py`: Environment configuration and theme management.

## 📋 Prerequisites
- Python 3.11+
- Docker (for containerization)
- Google Cloud CLI (for deployment)
- API Keys (Gemini, optionally RapidAPI Cricbuzz and Giphy)

## 💻 Local Setup

1. **Clone the repository and navigate to the directory:**
   ```bash
   cd VibeStump
   ```

2. **Set up your environment variables:**
   Copy the example environment file and add your keys.
   ```bash
   cp .env.example .env
   ```
   *Edit `.env` and add your `GEMINI_API_KEY`. (If Cricket/Giphy keys are omitted, the app gracefully switches to Simulation Mode).*

3. **Install Dependencies:**
   ```bash
   pip install -r requirements.txt
   ```

4. **Run the Application:**
   ```bash
   streamlit run app.py
   ```

## ☁️ Deployment Guide (Google Cloud Run)

This project is Dockerized and optimized for Google Cloud Run's serverless architecture, scaling instantly as match viewership spikes.

1. **Authenticate with Google Cloud:**
   ```bash
   gcloud auth login
   ```

2. **Set your Google Cloud Project:**
   ```bash
   gcloud config set project YOUR_PROJECT_ID
   ```

3. **Deploy from Source:**
   Run the following command. Note that you must pass your environment variables securely to Cloud Run.
   ```bash
   gcloud run deploy vibestump \
     --source . \
     --port 8080 \
     --set-env-vars GEMINI_API_KEY="your_api_key_here" \
     --allow-unauthenticated
   ```

4. **Access the App:**
   Click the URL provided in the terminal output to view your live, highly-available application!

## ⚡ Performance
The agentic loop is optimized to have a latency of **under 3 seconds** between fetching a live ball and displaying the agent intervention, utilizing Gemini Flash and direct API requests.
