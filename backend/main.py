"""
main.py — FastAPI backend for VibeStump: Agentic Premier League.

Clean architecture with background agent tasks.
All data flows: Agents → DB → API → Frontend.
"""

import asyncio
from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel

from database import (
    get_matches,
    get_live_score,
    get_all_live_scores,
    get_score_progression,
    get_commentary,
    get_highlights,
    get_insights,
    get_latest_meme,
    get_points_table,
    get_completed_matches,
    get_match_result,
    get_conn,
)
from agents import (
    run_agent_loop,
    stop_agents,
    chat_with_stumpmind,
    get_team_details_ai,
    get_player_details_ai,
)
from tools import IPL_TEAMS, get_team_info, get_squad
from seed import run_seed


# ── Lifespan ────────────────────────────────────────────────────────

_agent_task = None


@asynccontextmanager
async def lifespan(app: FastAPI):
    global _agent_task
    print("[VibeStump] Backend starting — seeding data + initializing agents...")
    run_seed()  # Seed demo data if DB is empty
    _agent_task = asyncio.create_task(run_agent_loop())
    yield
    print("[VibeStump] Shutting down agents...")
    stop_agents()
    if _agent_task:
        _agent_task.cancel()
        try:
            await _agent_task
        except asyncio.CancelledError:
            pass
    print("[VibeStump] Backend stopped.")


# ── App ─────────────────────────────────────────────────────────────

app = FastAPI(
    title="VibeStump API",
    description="Agentic Premier League Backend",
    version="3.0.0",
    lifespan=lifespan,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:3000",
        "https://*.run.app",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# ── Request Models ──────────────────────────────────────────────────

class ChatRequest(BaseModel):
    message: str
    history: list[dict] = []


# ── Routes ──────────────────────────────────────────────────────────

@app.get("/")
async def root():
    return {"status": "online", "service": "vibestump-api", "version": "3.0.0"}


@app.get("/api/matches")
async def api_matches():
    """List all tracked matches."""
    return get_matches()


@app.get("/api/live-score")
async def api_live_score(match_id: str = ""):
    """Get live score for a specific match, or all scores."""
    if match_id:
        score = get_live_score(match_id)
        return score if score else {"error": "Match not found"}
    return get_all_live_scores()


@app.get("/api/score-progression")
async def api_score_progression(match_id: str):
    """Get score progression (runs vs overs) for graphing."""
    return get_score_progression(match_id)


@app.get("/api/commentary")
async def api_commentary(match_id: str, limit: int = 30):
    """Get recent commentary for a match."""
    return get_commentary(match_id, limit)


@app.get("/api/highlights")
async def api_highlights(limit: int = 6):
    """Get YouTube highlights."""
    return get_highlights(limit)


@app.get("/api/insights")
async def api_insights(match_id: str, limit: int = 10):
    """Get AI-generated insights for a match."""
    return get_insights(match_id, limit)


@app.get("/api/meme")
async def api_meme(event_type: str = ""):
    """Get latest meme for an event type."""
    url = get_latest_meme(event_type)
    return {"url": url} if url else {"url": None}


@app.get("/api/points-table")
async def api_points_table():
    """Get IPL points table."""
    return get_points_table()


@app.get("/api/upcoming-matches")
async def api_upcoming_matches():
    """Get upcoming scheduled matches."""
    conn = get_conn()
    try:
        rows = conn.execute(
            "SELECT * FROM upcoming_matches ORDER BY date, time"
        ).fetchall()
        return [dict(r) for r in rows]
    except Exception:
        return []


@app.get("/api/teams")
async def api_teams():
    """List all IPL teams with metadata."""
    return [
        {"code": code, **{k: v for k, v in info.items()}}
        for code, info in IPL_TEAMS.items()
    ]


@app.get("/api/teams/{team_code}")
async def api_team_detail(team_code: str):
    """Get detailed info for a specific team (uses Gemini for live data)."""
    code = team_code.upper()
    meta = get_team_info(code)
    details = get_team_details_ai(meta.get("name", code))
    squad = get_squad(code)
    return {**meta, **details, **squad}


@app.get("/api/players/{player_name}")
async def api_player_detail(player_name: str):
    """Get player stats (uses Gemini with google_search)."""
    return get_player_details_ai(player_name)


@app.post("/api/chat")
async def api_chat(req: ChatRequest):
    """StumpMind AI chatbot."""
    reply = chat_with_stumpmind(req.message, req.history)
    return {"reply": reply}


@app.get("/api/completed-matches")
async def api_completed_matches():
    """Get all completed matches with rich result details (scorecard, performers)."""
    return get_completed_matches()


@app.get("/api/match-result/{match_id}")
async def api_match_result(match_id: str):
    """Get detailed result data for a specific completed match."""
    result = get_match_result(match_id)
    return result if result else {"error": "Match result not found"}
