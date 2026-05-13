# VibeStump: Agentic High-Fidelity Broadcast Platform

## Overview
VibeStump has evolved from a simple static dashboard into a fully responsive, TV-style broadcast overlay using Next.js, Framer Motion, and Google Gemini 2.5 Flash.

## How I Solved the Challenges

### 1. High-Fidelity Sports Broadcast Interface (L-Band Layout)
**Challenge:** Deliver a visually stunning, immersive UI that mimics a live sports broadcast.
**Solution:**
- Implemented `BackgroundAmbience.tsx` using `react-player` to loop a dynamic, muted YouTube video that shifts themes based on the selected team.
- Built a central `LiveMatchPlayer.tsx` to act as the primary stream anchor.
- Used `Framer Motion` in `BroadcastOverlay.tsx` to create massive, full-screen takeover animations for Wickets and Boundaries that synchronize with real-time events.

### 2. Gamification via Fan Points & Oracle Mini-Game
**Challenge:** Keep the user engaged between deliveries.
**Solution:**
- Integrated an Oracle Prediction game into the Sidebar. Users guess the vibe of the next ball (Hype, High Tension, Calm, Wicket).
- `useOracle.ts` hooks into the Gemini model's analysis. If the event matches the prediction, the Fan Points counter dynamically increments by 100 points.

### 3. Agentic Logic (Search-Enabled Chatbot)
**Challenge:** Provide live, dynamic answers to fan questions without hardcoding stats.
**Solution:**
- Equipped the Gemini model in `backend/agents.py` with the **Google Search** tool.
- Built `OracleChat.tsx`, a sleek slide-out glassmorphism drawer where fans can ask specific, contextual questions (e.g., "What are Virat Kohli's last 5 scores at Chinnaswamy?"). The agent searches live and returns up-to-date answers.

### 4. Audio & Haptics Sync
**Challenge:** Trigger audio only when appropriate and respect browser auto-play policies.
**Solution:**
- Created a robust `SoundManager.ts` utility that initializes audio context strictly upon the first user interaction (e.g., clicking the "Oracle" button or toggling the demo mode), bypassing Chrome/Safari autoplay blocking.
- The `BroadcastOverlay` explicitly triggers `soundManager.play('wicket')` precisely as the red flash animation starts.

## Deployment Architecture
- **Frontend:** Next.js 15 Standalone (React 18, Tailwind v4, Framer Motion), containerized.
- **Backend:** FastAPI running the Gemini Agentic loop and proxying dynamic API requests.
- **Infrastructure:** Both containers deployed to Google Cloud Run, utilizing a custom dynamic API proxy route in the frontend to avoid Next.js build-time URL baking.
