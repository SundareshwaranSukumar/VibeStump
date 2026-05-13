# VibeStump: Agentic Premier League — Requirements Document

This document outlines the core functional, technical, and design requirements for the VibeStump platform, as requested during the development and deployment lifecycle.

---

## 1. Core Objective
Finalize and deploy a high-fidelity, AI-powered sports broadcast companion (VibeStump) that integrates real-time data from the internet (RSS, YouTube, Gemini) to provide an immersive IPL match-day experience.

## 2. Functional Requirements

### 2.1 Match Data & Selection
- **Internet Feed Integration**: Fetch all latest match information (scores, commentary, status) dynamically from the internet. No hardcoded match data allowed.
- **Match Selector**: Provide an intuitive and unique design for choosing between live matches and previous matches.
- **Previous Match History**: Users must be able to view scores and highlights for concluded matches.
- **IPL Points Table**: Display a properly formatted, real-time IPL Points Table.
- **Team Information**: 
  - Show all team logos and names.
  - Clicking a team must reveal detailed info: Upcoming matches, Previous match results, Coach, etc.

### 2.2 Agentic Intelligence
- **Persona-Based Commentary**: Replace static psychologist monologues with "Agent Personas" (e.g., The Hype Man, Cool Analyst, Nervous Fan).
- **Dynamic Emojis & Moods**: Agent moods must be match-aware and use emojis that resemble human reactions.
- **Real-Time Updates**: Agents must update scores and insights as soon as new data is available.
- **Context Awareness**: Agents (Historian, Psychologist/Persona) must accept dynamic match context (current teams, batting/bowling) instead of falling back to hardcoded rivalries.
- **Dynamic Memes**: Fetch and display memes that change dynamically based on the outcome of every ball.

### 2.3 Visuals & Multimedia
- **Broadcast Title**: The title "VibeStump: Agentic Premier League" must be prominent and highlighted at the top of the interface.
- **Score Graphs**: Replace the "Emotional Rollercoaster" chart with a professional **Runs vs Overs** (Run Progression) graph.
- **Live Match Player**: Implement a high-fidelity video player (`react-player`) showing ambient cricket footage or live streams, replacing static loading spinners.
- **Highlights**: Fetch and display actual YouTube highlights for the selected match; strictly avoid placeholder/Rickroll content.
- **Audio Triggers**: Ensure reliable audio playback for critical events (Wickets, Boundaries) with remote fallbacks for missing assets.

---

## 3. Design & UI/UX Requirements
- **Premium Aesthetics**: Use modern design principles (glassmorphism, vibrant gradients, dark mode, smooth animations).
- **Zero Dummy Data**: All placeholder content, including Rickrolls and "Ball Tracking Simulators" with static data, must be removed.
- **Branding**: Ensure consistent use of team logos and colors throughout the dashboard.
- **Copyright Compliance**: A persistent footer must display: `© 2026 Sundareshwaran Sukumar. All rights reserved.`

---

## 4. Technical & Deployment Requirements
- **Tech Stack**: Next.js (Frontend), FastAPI (Backend), Gemini 2.5 Flash (AI), SQLite (Caching), Tailwind CSS (Styling).
- **Cloud Infrastructure**: Optimized for deployment on **Google Cloud Run**.
- **Code Integrity**: 
  - Remove all redundant, dead, or unwanted code.
  - Ensure no build errors or type mismatches (especially in third-party integrations like `react-player`).
- **Environment Variables**: Use `GEMINI_API_KEY` for all agentic features and ensure it is properly injected in production.
- **Documentation**: Maintain an updated `README.md` and a comprehensive `architecture.puml` diagram.

---

## 5. Deployment Audit & Validation
- Conduct thorough reviews of the deployed application to identify and fix 404 errors, CSS glitches, or data synchronization issues.
- Ensure the application is "Production-Ready" before final sign-off.

---

*Document Author: Sundareshwaran Sukumar*
