# VibeStump: Presentation & Pitch Guide

*Keep this open during your hackathon pitch.*

---

## 1. The Elevator Pitch (30 seconds)

> "Cricket fans experience emotional whiplash every ball. VibeStump is an **agentic second-screen companion** — it watches the match alongside you, measures tension using AI, deploys memes when the hype peaks, and orders you comfort food from Swiggy when your team collapses. It's a Next.js + FastAPI app powered by Google Gemini, running serverlessly on Cloud Run."

## 2. The Problem

- Fans experience extreme stress during close matches — no app addresses this.
- Traditional scorecard apps are static, boring, and emotionally dead.
- Zero personalization or emotional intelligence.

## 3. The Architecture (The Differentiator)

**Frontend:** Next.js (App Router) + Tailwind CSS + Zustand + Recharts
**Backend:** FastAPI + Google Gemini 2.5 Flash + httpx

### Multi-Agent Pipeline (every 8 seconds):

1. **Scout Agent** (`backend/tools.py`) — Fetches live data from Cricbuzz via httpx. If the API rate-limits (429/500), instantly falls back to `live_sim.json`. **The demo never crashes.**
2. **Psychologist Agent** (`backend/agents.py`) — Gemini 2.5 Flash with Pydantic structured output. Returns `{vibe_score, tension_index, mood, agent_monologue}`. Includes an "internal monologue" that streams to the UI.
3. **Historian Agent** (`backend/agents.py`) — Triggered on WICKET or SIX. Uses Gemini to generate historical comparisons (e.g., "This collapse mirrors RCB's infamous 49 all-out vs KKR in 2017").
4. **Executor Agent** (`backend/tools.py`) — Fires mood-matched GIFs. If vibe drops below -7 for 2 consecutive balls, triggers the **Diversion Protocol** (mock Swiggy/Netflix APIs).

## 4. Technical Highlights

| Point | Detail |
|---|---|
| **Production Stack** | Next.js + FastAPI — not a Streamlit prototype |
| **Sub-3s Latency** | Direct `google-genai` SDK + Pydantic. No LangChain overhead |
| **Stateful Memory** | The Vibe Trend area chart proves multi-turn emotional memory |
| **Dynamic Theming** | 10 IPL teams. Select KKR → purple/gold. CSS variables, instant |
| **Serverless** | Cloud Run auto-scales 0→10 instances during match peaks |
| **Zero Downtime** | Every external dependency has a local fallback |

## 5. Live Demo Script

1. **Open the app.** Point out the glassmorphism dark-mode design.
2. **Select a team** (e.g., KKR). Watch the entire UI glow purple/gold instantly.
3. **Demo Mode is ON by default.** The auto-refresh runs every 8 seconds.
4. **Ball 3 (SIX):** "Notice the Historian Agent woke up with a Chris Gayle reference."
5. **Balls 5-6 (WICKETS):** "Two consecutive negative vibes — watch the Diversion Protocol trigger."
6. **Click 'Order Comfort Food.'** "Our mock Swiggy API suggested Masala Dosa from MTR, Bengaluru."
7. **Click 'Back to Match.'** "The agent loop resumes seamlessly."
8. **Show the FastAPI docs** at `/docs`. "Every agent is a REST endpoint. Fully testable."

## 6. When Judges Ask Hard Questions

- **"What if the API breaks?"** → "Every external dependency has a local fallback. The `SimulatedLiveFeed` class streams real Match 57 data. The demo literally cannot crash."
- **"How is this different from a chatbot?"** → "Point to the Vibe Trend chart — it proves persistent emotional memory across the entire match. Chatbots are stateless."
- **"Can this scale?"** → "Two independent Cloud Run services. Backend and frontend scale independently. Auto-scales 0→10."
- **"Why not LangChain?"** → "Direct SDK call + Pydantic schema = sub-2 second structured output. LangChain would add 500ms+ overhead for zero benefit."

## 7. Future Roadmap

- Wearable integration (Apple Watch heart rate vs AI tension — correlation analysis)
- Multi-match parallel tracking
- Fan leaderboards and social sharing
