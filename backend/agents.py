"""
agents.py — Multi-Agent Gemini Engine for VibeStump.

Agents:
  • Psychologist — Vibe/tension analysis, critical-event flagging.
  • Historian    — RCB vs KKR rivalry deep-dives, powered by Gemini.

Optimized for the RCB vs KKR rivalry:
  - 2024 Playoffs: RCB's miracle run from 10th to playoffs
  - 2026 Season: RCB dominating the table, Kohli in peak form
"""

import os
import json
from google import genai
from google.genai import types
from pydantic import BaseModel, Field

GEMINI_API_KEY = os.getenv("GEMINI_API_KEY", "")
_client = genai.Client(api_key=GEMINI_API_KEY) if GEMINI_API_KEY else None
_MODEL = "gemini-2.5-flash"


# ── Schemas ──────────────────────────────────────────────────────────
class AnalysisResult(BaseModel):
    vibe_score: int = Field(description="Fan vibe: -10 (devastated) to 10 (ecstatic)")
    tension_index: int = Field(description="Match tension: 0 (calm) to 10 (nail-biter)")
    meme_search_query: str = Field(description="2-4 word GIF search query")
    fallback_mood: str = Field(description="One of: happy, sad, tense, angry, hype")
    is_critical_event: bool = Field(description="True for SIX, WICKET, FOUR, catch")
    event_type: str = Field(description="'WICKET', 'SIX', 'FOUR', or 'NONE'")
    agent_monologue: str = Field(description="1-2 sentence internal thought from the Psychologist about the fan's emotional state")


class HistorianResult(BaseModel):
    historical_insight: str = Field(description="2-3 sentence IPL historical deep-dive")


# ── Psychologist ─────────────────────────────────────────────────────
_PSYCH_PROMPT = """You are the Psychologist Agent for VibeStump, an IPL second-screen fan platform.
Today is Match 57: RCB vs KKR at M. Chinnaswamy Stadium, Bengaluru, May 13, 2026.
RCB are the favorites this season, sitting 2nd on the table. KKR, the 2024 champions, are fighting for a playoff spot.

Analyze this ball-by-ball commentary and determine:
1. vibe_score (-10 devastation to +10 euphoria) from an RCB fan's perspective
2. tension_index (0 calm to 10 extreme)
3. A short GIF search query reflecting the mood
4. fallback_mood (happy | sad | tense | angry | hype)
5. Whether a critical event occurred (SIX, WICKET, FOUR)
6. event_type
7. agent_monologue — your internal thought as the Psychologist, e.g. "The fans are holding their breath..."

Commentary: {commentary}"""


def analyze_commentary(commentary: str) -> AnalysisResult:
    if not _client:
        return _offline_psychologist(commentary)
    try:
        resp = _client.models.generate_content(
            model=_MODEL,
            contents=_PSYCH_PROMPT.format(commentary=commentary),
            config=types.GenerateContentConfig(
                response_mime_type="application/json",
                response_schema=AnalysisResult,
                temperature=0.6,
            ),
        )
        if hasattr(resp, "parsed") and resp.parsed:
            return resp.parsed
        return AnalysisResult(**json.loads(resp.text))
    except Exception as e:
        print(f"[Psychologist] Error: {e}")
        return _offline_psychologist(commentary)


def _offline_psychologist(commentary: str) -> AnalysisResult:
    c = commentary.upper()
    if "WICKET" in c or "BOWLED" in c or "RUN OUT" in c or "CAUGHT" in c:
        return AnalysisResult(
            vibe_score=-7, tension_index=9, meme_search_query="cricket wicket shock",
            fallback_mood="sad", is_critical_event=True, event_type="WICKET",
            agent_monologue="The fans are in disbelief. That wicket has shifted the momentum completely.")
    if "SIX" in c:
        return AnalysisResult(
            vibe_score=8, tension_index=8, meme_search_query="cricket six celebration",
            fallback_mood="hype", is_critical_event=True, event_type="SIX",
            agent_monologue="Pure adrenaline! The crowd is on its feet. This is what IPL cricket is all about!")
    if "FOUR" in c or "BOUNDARY" in c:
        return AnalysisResult(
            vibe_score=5, tension_index=6, meme_search_query="happy cricket fan",
            fallback_mood="happy", is_critical_event=True, event_type="FOUR",
            agent_monologue="A well-timed shot lifts the spirits. The fans are getting their money's worth.")
    if "DOT" in c or "MISS" in c or "PRESSURE" in c:
        return AnalysisResult(
            vibe_score=-2, tension_index=7, meme_search_query="nervous cricket moment",
            fallback_mood="tense", is_critical_event=False, event_type="NONE",
            agent_monologue="Tension building. The dot balls are creating a pressure cooker situation.")
    return AnalysisResult(
        vibe_score=1, tension_index=5, meme_search_query="cricket",
        fallback_mood="happy", is_critical_event=False, event_type="NONE",
        agent_monologue="Steady state. The fans are watchful, waiting for the next big moment.")


# ── Historian ────────────────────────────────────────────────────────
_HIST_PROMPT = """You are the Historian Agent for VibeStump. Today is May 13, 2026 — Match 57: RCB vs KKR.

Key rivalry context:
- KKR won IPL 2024 under Shreyas Iyer, beating SRH in the final
- RCB made a miracle run to the 2024 playoffs from 10th place
- In IPL 2026, RCB are 2nd on the table with Kohli averaging 52 this season
- Kohli's career SR against Narine in powerplay: 98.4
- Sunil Narine has taken 14 wickets against RCB across all IPL seasons
- The Chinnaswamy Stadium has the highest average first-innings score (185) in IPL 2026

A **{event_type}** just occurred. Context from our stats database:
"{context_data}"

Write a fascinating 2-3 sentence insight comparing this moment to IPL history. Be dramatic, specific with numbers, and engaging."""


def generate_historical_insight(event_type: str, context_data: str) -> str:
    if not _client:
        return f"📚 {context_data}"
    try:
        resp = _client.models.generate_content(
            model=_MODEL,
            contents=_HIST_PROMPT.format(event_type=event_type, context_data=context_data),
            config=types.GenerateContentConfig(
                response_mime_type="application/json",
                response_schema=HistorianResult,
                temperature=0.8,
            ),
        )
        if hasattr(resp, "parsed") and resp.parsed:
            return resp.parsed.historical_insight
        return json.loads(resp.text).get("historical_insight", context_data)
    except Exception as e:
        print(f"[Historian] Error: {e}")
        return f"📚 {context_data}"
