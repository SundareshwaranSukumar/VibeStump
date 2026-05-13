"""
agents.py — Multi-Agent Reasoning Engine for VibeStump.

Agents:
  • Psychologist — Vibe & tension analysis, critical-event flagging, meme-mood selection.
  • Historian    — Gemini-powered contextual deep-dives on player head-to-heads & IPL history.

All agents use Google Gemini (gemini-2.5-flash) via the google-genai SDK with
Pydantic-enforced structured JSON outputs for deterministic, low-latency reasoning.
"""

import os
import json
from google import genai
from google.genai import types
from pydantic import BaseModel, Field

# ──────────────────────────────────────────────────────────────────────
#  CLIENT SETUP
# ──────────────────────────────────────────────────────────────────────
GEMINI_API_KEY = os.getenv("GEMINI_API_KEY", "")
_client = genai.Client(api_key=GEMINI_API_KEY) if GEMINI_API_KEY else None
_MODEL = "gemini-2.5-flash"


# ──────────────────────────────────────────────────────────────────────
#  PYDANTIC SCHEMAS
# ──────────────────────────────────────────────────────────────────────
class AnalysisResult(BaseModel):
    """Structured output from the Psychologist Agent."""
    vibe_score: int = Field(
        description="Fan vibe score from -10 (devastated) to 10 (ecstatic)")
    tension_index: int = Field(
        description="Match tension from 0 (calm) to 10 (nail-biting)")
    meme_search_query: str = Field(
        description="A 2-4 word search query to find a relevant cricket GIF")
    fallback_mood: str = Field(
        description="One of: happy, sad, tense, angry, hype")
    is_critical_event: bool = Field(
        description="True when commentary describes a SIX, WICKET, FOUR, or catch")
    event_type: str = Field(
        description="'WICKET', 'SIX', 'FOUR', or 'NONE'")


class HistorianResult(BaseModel):
    """Structured output from the Historian Agent."""
    historical_insight: str = Field(
        description="A 1-3 sentence engaging historical comparison about this IPL event")


# ──────────────────────────────────────────────────────────────────────
#  PSYCHOLOGIST AGENT
# ──────────────────────────────────────────────────────────────────────
_PSYCHOLOGIST_PROMPT = """You are the Psychologist Agent for an IPL second-screen fan experience.
Analyze the following live ball-by-ball commentary and determine:
1. vibe_score (-10 = fan devastation, +10 = euphoria)
2. tension_index (0 = dead rubber, 10 = last-ball thriller)
3. A short GIF search query reflecting the mood
4. fallback_mood (happy | sad | tense | angry | hype)
5. Whether a critical event occurred (SIX, WICKET, FOUR, catch)
6. The event type

Commentary: {commentary}"""


def analyze_commentary(commentary: str) -> AnalysisResult:
    """
    The Psychologist Agent.
    Runs Gemini with structured JSON output for deterministic reasoning.
    Falls back to keyword heuristics when the API key is absent.
    """
    if not _client:
        return _offline_psychologist(commentary)

    try:
        response = _client.models.generate_content(
            model=_MODEL,
            contents=_PSYCHOLOGIST_PROMPT.format(commentary=commentary),
            config=types.GenerateContentConfig(
                response_mime_type="application/json",
                response_schema=AnalysisResult,
                temperature=0.6,
            ),
        )
        if hasattr(response, "parsed") and response.parsed:
            return response.parsed
        return AnalysisResult(**json.loads(response.text))

    except Exception as e:
        print(f"[Psychologist] Gemini error: {e}. Using offline heuristics.")
        return _offline_psychologist(commentary)


def _offline_psychologist(commentary: str) -> AnalysisResult:
    """Keyword-based heuristic fallback (no API key required)."""
    c = commentary.upper()
    if "WICKET" in c or "BOWLED" in c or "RUN OUT" in c:
        return AnalysisResult(
            vibe_score=-7, tension_index=9,
            meme_search_query="cricket wicket reaction",
            fallback_mood="sad", is_critical_event=True, event_type="WICKET")
    if "SIX" in c:
        return AnalysisResult(
            vibe_score=8, tension_index=8,
            meme_search_query="excited cricket fan",
            fallback_mood="hype", is_critical_event=True, event_type="SIX")
    if "FOUR" in c or "BOUNDARY" in c:
        return AnalysisResult(
            vibe_score=5, tension_index=6,
            meme_search_query="happy cricket moment",
            fallback_mood="happy", is_critical_event=True, event_type="FOUR")
    if "DOT" in c or "MISS" in c:
        return AnalysisResult(
            vibe_score=-2, tension_index=7,
            meme_search_query="tense cricket moment",
            fallback_mood="tense", is_critical_event=False, event_type="NONE")
    # Neutral default
    return AnalysisResult(
        vibe_score=1, tension_index=5,
        meme_search_query="cricket",
        fallback_mood="happy", is_critical_event=False, event_type="NONE")


# ──────────────────────────────────────────────────────────────────────
#  HISTORIAN AGENT
# ──────────────────────────────────────────────────────────────────────
_HISTORIAN_PROMPT = """You are the Historian Agent for an IPL fan platform.
A **{event_type}** just occurred during a live IPL match.
Here is relevant historical context from our stats database:
"{context_data}"

Write a fascinating 1-3 sentence insight comparing this moment to legendary IPL history.
Make it engaging, dramatic, and packed with numbers."""


def generate_historical_insight(event_type: str, context_data: str) -> str:
    """
    The Historian Agent.
    Generates rich, contextual IPL history when triggered by the Psychologist.
    """
    if not _client:
        return f"📚 {context_data}"

    try:
        response = _client.models.generate_content(
            model=_MODEL,
            contents=_HISTORIAN_PROMPT.format(
                event_type=event_type, context_data=context_data),
            config=types.GenerateContentConfig(
                response_mime_type="application/json",
                response_schema=HistorianResult,
                temperature=0.8,
            ),
        )
        if hasattr(response, "parsed") and response.parsed:
            return response.parsed.historical_insight
        return json.loads(response.text).get("historical_insight", context_data)

    except Exception as e:
        print(f"[Historian] Gemini error: {e}. Using raw context.")
        return f"📚 {context_data}"
