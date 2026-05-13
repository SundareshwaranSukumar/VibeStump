"""
tests/test_agent_loops.py — Automated test suite for VibeStump agentic loops.

Validates:
  1. Psychologist Agent — structured output schema, value ranges, critical-event detection.
  2. Historian Agent    — output type and non-empty response.
  3. ScoutAgent tools   — SimulatedLiveFeed consistency, scorecard schema.
  4. Meme Executor      — URL validity for all mood keys.
  5. YouTube tool       — fallback behaviour when API key is absent.

Designed to run in CI (GitHub Actions / Cloud Build) without any API keys.
All tests use offline/heuristic modes so they pass deterministically.

Usage:
    python -m pytest tests/test_agent_loops.py -v
"""

import sys
import os
import pytest

# Ensure project root is importable
sys.path.insert(0, os.path.join(os.path.dirname(__file__), ".."))

# Force offline mode for deterministic CI testing
os.environ.pop("GEMINI_API_KEY", None)
os.environ.pop("YOUTUBE_API_KEY", None)

from agents import analyze_commentary, generate_historical_insight, AnalysisResult
from tools import (
    SimulatedLiveFeed,
    get_live_commentary,
    fetch_live_score,
    fetch_meme,
    get_historical_context,
    fetch_youtube_highlights,
    mock_food_delivery_api,
    mock_netflix_api,
    MEME_DICTIONARY,
)


# ══════════════════════════════════════════════════════════════════════
#  PSYCHOLOGIST AGENT TESTS
# ══════════════════════════════════════════════════════════════════════
class TestPsychologist:
    """Validates the Psychologist Agent's reasoning loop."""

    def test_returns_analysis_result(self):
        result = analyze_commentary("A massive SIX over long-on! The crowd erupts!")
        assert isinstance(result, AnalysisResult)

    def test_vibe_score_range(self):
        result = analyze_commentary("Dot ball. Pressure building.")
        assert -10 <= result.vibe_score <= 10

    def test_tension_index_range(self):
        result = analyze_commentary("WICKET! Clean bowled!")
        assert 0 <= result.tension_index <= 10

    def test_fallback_mood_valid(self):
        result = analyze_commentary("He drives it for FOUR through covers!")
        assert result.fallback_mood in ("happy", "sad", "tense", "angry", "hype")

    def test_critical_event_wicket(self):
        result = analyze_commentary("WICKET! Caught behind! The batsman is out!")
        assert result.is_critical_event is True
        assert result.event_type == "WICKET"

    def test_critical_event_six(self):
        result = analyze_commentary("Massive SIX! Over the stadium roof!")
        assert result.is_critical_event is True
        assert result.event_type == "SIX"

    def test_non_critical_event(self):
        result = analyze_commentary("Pushed gently to mid-off for a single.")
        assert result.is_critical_event is False
        assert result.event_type == "NONE"

    def test_negative_vibe_on_collapse(self):
        result = analyze_commentary("WICKET! Run out! Total collapse for RCB!")
        assert result.vibe_score < 0

    def test_positive_vibe_on_six(self):
        result = analyze_commentary("SIX! What a shot! The fans are ecstatic!")
        assert result.vibe_score > 0


# ══════════════════════════════════════════════════════════════════════
#  HISTORIAN AGENT TESTS
# ══════════════════════════════════════════════════════════════════════
class TestHistorian:
    """Validates the Historian Agent's contextual deep-dive."""

    def test_returns_string(self):
        result = generate_historical_insight("WICKET", "Malinga took 170 wickets.")
        assert isinstance(result, str)

    def test_non_empty_output(self):
        result = generate_historical_insight("SIX", "Gayle hit 357 sixes.")
        assert len(result) > 10

    def test_offline_prefix(self):
        # In offline mode (no API key), output should contain the context
        result = generate_historical_insight("FOUR", "Kohli scored 973 runs.")
        assert "973" in result


# ══════════════════════════════════════════════════════════════════════
#  SCOUT / TOOLS TESTS
# ══════════════════════════════════════════════════════════════════════
class TestScoutTools:
    """Validates the Scout Agent's data-ingestion tools."""

    def test_simulated_feed_length(self):
        assert len(SimulatedLiveFeed.BALLS) >= 6

    def test_simulated_feed_wraps(self):
        # Should not raise even with large index
        c = SimulatedLiveFeed.get_commentary(999)
        assert isinstance(c, str) and len(c) > 0

    def test_scorecard_schema(self):
        sc = fetch_live_score(0, demo_mode=True)
        assert "runs" in sc
        assert "wickets" in sc
        assert "overs" in sc
        assert "run_rate" in sc

    def test_demo_commentary_not_empty(self):
        c = get_live_commentary(0, demo_mode=True)
        assert isinstance(c, str) and len(c) > 0

    def test_scorecard_progression(self):
        s0 = fetch_live_score(0, demo_mode=True)
        s2 = fetch_live_score(2, demo_mode=True)
        # Ball 2 is a SIX → runs should increase
        assert s2["runs"] >= s0["runs"]


# ══════════════════════════════════════════════════════════════════════
#  MEME EXECUTOR TESTS
# ══════════════════════════════════════════════════════════════════════
class TestMemeExecutor:
    """Validates the meme dictionary and executor function."""

    def test_all_moods_have_urls(self):
        for mood in ("happy", "sad", "tense", "angry", "hype"):
            url = fetch_meme(mood)
            assert url.startswith("https://")

    def test_unknown_mood_fallback(self):
        url = fetch_meme("bewildered")
        assert url == MEME_DICTIONARY["happy"]


# ══════════════════════════════════════════════════════════════════════
#  YOUTUBE TOOL TESTS
# ══════════════════════════════════════════════════════════════════════
class TestYouTube:
    """Validates YouTube highlight fetcher fallback behaviour."""

    def test_fallback_returns_list(self):
        results = fetch_youtube_highlights("test query")
        assert isinstance(results, list) and len(results) > 0

    def test_fallback_video_schema(self):
        results = fetch_youtube_highlights("test")
        for v in results:
            assert "title" in v
            assert "video_id" in v


# ══════════════════════════════════════════════════════════════════════
#  DIVERSION PROTOCOL MOCK API TESTS
# ══════════════════════════════════════════════════════════════════════
class TestDiversionProtocol:
    """Validates the mock external APIs for the Diversion Protocol."""

    def test_food_api_returns_string(self):
        result = mock_food_delivery_api("Bengaluru")
        assert isinstance(result, str)
        assert "Bengaluru" in result

    def test_netflix_api_returns_string(self):
        result = mock_netflix_api()
        assert isinstance(result, str)
        assert len(result) > 10


# ══════════════════════════════════════════════════════════════════════
#  HISTORICAL CONTEXT TOOL TESTS
# ══════════════════════════════════════════════════════════════════════
class TestHistoricalContext:

    def test_wicket_context(self):
        ctx = get_historical_context("WICKET")
        assert isinstance(ctx, str) and len(ctx) > 10

    def test_six_context(self):
        ctx = get_historical_context("SIX")
        assert isinstance(ctx, str) and len(ctx) > 10

    def test_unknown_event_fallback(self):
        ctx = get_historical_context("UNKNOWN_EVENT")
        assert isinstance(ctx, str)
