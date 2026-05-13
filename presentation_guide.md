# 🏏 VibeStump: Presentation & Pitch Guide

*Keep this open during your hackathon pitch. It covers every talking point you need.*

---

## 1. The Elevator Pitch (30 seconds)

> "Cricket fans experience emotional whiplash every ball. VibeStump is an **agentic second-screen companion** — it watches the match alongside you, measures the tension using AI, deploys perfectly-timed memes when the hype peaks, and even orders you comfort food from Swiggy when your team collapses. It's powered by Google Gemini and runs serverlessly on Cloud Run."

## 2. The Problem

- Fans experience extreme stress during close matches — no app addresses this.
- Traditional scorecard apps are static, boring, and emotionally dead.
- There's zero personalization or emotional intelligence.

## 3. The Multi-Agent Architecture (The Differentiator)

This is what separates VibeStump from a simple chatbot:

1. 🔭 **Scout Agent** — Scrapes ESPNcricinfo RSS in real-time. If the API fails or rate-limits (429/500), it instantly switches to the `SimulatedLiveFeed` class. **The demo never crashes.**
2. 🧠 **Psychologist Agent** — Powered by Gemini 2.5 Flash with Pydantic-enforced structured outputs. Outputs `{vibe_score, tension_index, meme_mood, is_critical_event}` in deterministic JSON. Sub-2 second latency.
3. 📚 **Historian Agent** — Sleeps until the Psychologist flags a WICKET or SIX. Then wakes up, queries our stats database, and uses Gemini to generate a rich historical comparison (e.g., "This collapse is eerily similar to RCB's infamous 49 all-out against KKR in 2017...").
4. 🎬 **Executor Agent** — Takes the Psychologist's mood output and fires a perfectly matching meme. Or, if the vibe is toxic for 2+ balls, triggers the **Diversion Protocol**.

## 4. Technical Highlights (What Judges Care About)

| Point | Detail |
|---|---|
| **Sub-3s Latency** | Raw `google-genai` SDK + Pydantic schemas. No Langchain overhead. |
| **Stateful Memory** | The Vibe Trend area chart proves multi-turn memory — not a one-shot chatbot. |
| **Automated Testing** | `tests/test_agent_loops.py` runs 20+ tests in CI without API keys. Show this to judges — most hackathon teams skip testing entirely. |
| **CI/CD Pipeline** | `cloudbuild.yaml` runs Tests → Build → Deploy in one command. |
| **Serverless Scaling** | Cloud Run auto-scales 0 → 10 during match peaks. Mention: "Real sports-tech needs this." |
| **Dynamic Theming** | 10 IPL teams. Select KKR → purple/gold. Select CSK → yellow/blue. |

## 5. Live Demo Script

1. **Open the app.** Point out the glassmorphism dark-mode design.
2. **Select a team** (e.g., RCB). Show the UI instantly retheming.
3. **Toggle Demo Mode ON.** Let the auto-refresh run.
4. **Ball 3 (SIX):** "Notice the Historian Agent woke up with a Chris Gayle reference."
5. **Balls 5-6 (WICKETS):** "Two consecutive negative vibes — watch the Diversion Protocol trigger."
6. **Click 'Order Comfort Food.'** "Our mock Swiggy API just suggested Masala Dosa from MTR."
7. **Click 'Back to Match.'** "And we're back. The agent loop resumes seamlessly."
8. **Scroll down → Check 'Show Match VODs.'** "YouTube highlights right inside the app."

## 6. When Judges Ask Hard Questions

- **"What if the API breaks?"** → "Every external dependency has a local fallback. The app literally cannot crash."
- **"How is this different from a chatbot?"** → "Point to the Vibe Trend chart — it proves session memory across the entire match."
- **"Can this scale?"** → "Cloud Run, serverless, auto-scales to 10 instances. Plus our Docker image uses multi-stage builds to keep it under 100MB."

## 7. Future Roadmap

- Wearable integration (Apple Watch heart rate vs AI tension — correlation analysis)
- Multi-match parallel tracking
- Fan leaderboards and social sharing
