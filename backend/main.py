"""
main.py — FastAPI backend for VibeStump APL.

Endpoints:
  GET  /api/score          — Live scorecard from Scout Agent
  GET  /api/commentary     — Latest commentary line
  POST /api/analyze        — Psychologist Agent analysis
  POST /api/historian      — Historian Agent deep-dive
  GET  /api/youtube        — YouTube highlight search
  POST /api/diversion/food — Mock Swiggy API
  POST /api/diversion/netflix — Mock Netflix API
"""

import os
from contextlib import asynccontextmanager
from fastapi import FastAPI, Query
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from dotenv import load_dotenv

load_dotenv()

from agents import analyze_commentary, generate_historical_insight
from tools import (
    ScoutAgent,
    fetch_youtube_highlights,
    mock_food_delivery_api,
    mock_netflix_api,
)


# ── Lifespan ─────────────────────────────────────────────────────────
@asynccontextmanager
async def lifespan(app: FastAPI):
    """Initialize and teardown resources."""
    print("[VibeStump] Backend starting — agents online.")
    yield
    print("[VibeStump] Backend shutting down.")


# ── App ──────────────────────────────────────────────────────────────
app = FastAPI(
    title="VibeStump API",
    description="Agentic Premier League Backend",
    version="2.0.0",
    lifespan=lifespan,
)

# CORS — allow the Next.js frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:3000",
        "https://*.run.app",  # Cloud Run frontend
        "*",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

scout = ScoutAgent()


# ── Request / Response Models ────────────────────────────────────────
class AnalyzeRequest(BaseModel):
    commentary: str
    team: str = "RCB"
    batting: str = "Home Team"
    bowling: str = "Away Team"

class HistorianRequest(BaseModel):
    event_type: str
    context: str
    match_title: str = "IPL Match"


# ── Routes ───────────────────────────────────────────────────────────
@app.get("/")
async def root():
    return {"status": "online", "service": "vibestump-backend"}


@app.get("/api/matches")
async def get_matches():
    """Returns all available internet matches."""
    return await scout.get_all_matches()


@app.get("/api/score")
async def get_score(ball: int = 0, demo: bool = True, match_id: str = None):
    """Returns the live scorecard."""
    return scout.get_scorecard(ball, demo_mode=demo, match_id=match_id)


@app.get("/api/commentary")
async def get_commentary(ball: int = 0, demo: bool = True, match_id: str = None):
    """Returns the commentary for a specific ball."""
    text = await scout.get_commentary(ball, demo_mode=demo, match_id=match_id)
    return {"ball": ball, "commentary": text}


@app.post("/api/analyze")
async def analyze(req: AnalyzeRequest):
    """Runs the Psychologist Agent on commentary."""
    result = analyze_commentary(
        req.commentary, 
        team=req.team, 
        batting=req.batting, 
        bowling=req.bowling
    )
    
    # Dynamically fetch meme using Tenor API
    from tools import fetch_meme
    meme_url = await fetch_meme(result.fallback_mood, result.meme_search_query)
    
    data = result.model_dump()
    data["meme_url"] = meme_url
    return data


@app.post("/api/historian")
async def historian(req: HistorianRequest):
    """Runs the Historian Agent for a critical event."""
    insight = generate_historical_insight(req.event_type, req.context, match_title=req.match_title)
    return {"insight": insight}


@app.get("/api/youtube")
async def youtube(q: str = Query("IPL highlights 2026"), max_results: int = 3):
    """Searches YouTube Data API v3."""
    videos = fetch_youtube_highlights(q, max_results)
    return {"videos": videos}


@app.post("/api/diversion/food")
async def diversion_food():
    """Mock Swiggy comfort-food API."""
    return {"message": mock_food_delivery_api()}


@app.post("/api/diversion/netflix")
async def diversion_netflix():
    """Mock Netflix streaming API."""
    return {"message": mock_netflix_api()}

@app.get("/api/points-table")
async def points_table():
    """Returns the IPL Points Table."""
    from tools import get_points_table
    return await get_points_table()


@app.get("/api/team-info/{team_code}")
async def team_info(team_code: str):
    """Returns detailed info for a specific team."""
    from tools import get_team_info
    return get_team_info(team_code)


class OracleRequest(BaseModel):
    commentary: str
    team: str


@app.post("/api/oracle")
async def oracle(req: OracleRequest):
    """Runs the Oracle agent for gamification."""
    from agents import analyze_oracle
    result = analyze_oracle(req.commentary, req.team)
    return result.model_dump()


class ChatRequest(BaseModel):
    message: str
    history: list


@app.post("/api/chat")
async def chat(req: ChatRequest):
    """Runs the Search-Enabled Chatbot."""
    from agents import chat_with_oracle
    resp_text = chat_with_oracle(req.message, req.history)
    return {"reply": resp_text}

