"""
agents.py — Multi-Agent System for VibeStump.

Five dedicated agents:
  • ScoreAgent       — Polls cricinfo RSS (with offline sim fallback)
  • CommentaryAgent  — Detects events from score changes, generates commentary
  • InsightsAgent    — Generates AI insights via Gemini (offline fallback)
  • MediaAgent       — Fetches YouTube highlights (offline fallback)
  • MemeAgent        — Fetches memes from Tenor for events

Plus the StumpMind chatbot function.
"""

import os
import json
import random
import asyncio
from typing import Optional

from pydantic import BaseModel, Field

from database import (
    upsert_match,
    upsert_live_score,
    get_live_score,
    add_score_point,
    add_commentary,
    get_commentary,
    add_highlight,
    add_insight,
    add_meme,
    get_matches,
)
from tools import (
    fetch_cricinfo_rss,
    fetch_youtube_highlights,
    fetch_tenor_meme,
    resolve_team_code,
    IPL_TEAMS,
)

GEMINI_API_KEY = os.getenv("GEMINI_API_KEY", "")
_client = None

# Try to init Gemini client; gracefully degrade if not available
try:
    from google import genai
    from google.genai import types
    if GEMINI_API_KEY:
        _client = genai.Client(api_key=GEMINI_API_KEY)
        print("[Agents] Gemini client initialized")
    else:
        print("[Agents] No GEMINI_API_KEY — running in offline mode")
except Exception as e:
    print(f"[Agents] Gemini init failed: {e} — running in offline mode")

_MODEL = "gemini-2.5-flash"
_agent_running = False
_previous_scores: dict[str, dict] = {}

# ── Offline Commentary Templates ────────────────────────────────────

_WICKET_TEMPLATES = [
    "{batting} loses a wicket! Huge moment in the game. Score: {runs}/{wickets}",
    "OUT! {batting} batsman dismissed. Score now {runs}/{wickets} ({overs} ov)",
    "WICKET! The fielding side celebrate wildly. {batting} {runs}/{wickets}",
    "That's a massive breakthrough! {batting} on {runs}/{wickets}",
]
_SIX_TEMPLATES = [
    "SIX! {batting} clears the boundary with ease! Score: {runs}/{wickets}",
    "MAXIMUM! Incredible shot from {batting}. {runs}/{wickets} ({overs} ov)",
    "SIX! The crowd erupts! {batting} are flying at {runs}/{wickets}",
    "That's HUGE! Over the ropes for six. {batting} {runs}/{wickets}",
]
_FOUR_TEMPLATES = [
    "FOUR! {batting} finds the gap and races to the boundary. {runs}/{wickets}",
    "Beautiful shot for FOUR! {batting} batting well at {runs}/{wickets} ({overs} ov)",
    "Four runs! {batting} working the ball superbly. Score: {runs}/{wickets}",
]
_RUNS_TEMPLATES = [
    "{batting} tick along, scoring {run_diff} run(s). Score: {runs}/{wickets} ({overs} ov)",
    "Good running between the wickets. {batting} {runs}/{wickets}",
    "{batting} keeping the scoreboard moving. {run_diff} more added. {runs}/{wickets}",
]

_OFFLINE_INSIGHTS = [
    "In T20 cricket, maintaining a run rate above 8 in the middle overs (7-15) is crucial. Teams that achieve this win 73% of the time according to IPL historical data.",
    "The powerplay (overs 1-6) is where matches are often set up. Losing more than 2 wickets in the powerplay reduces a team's average final score by 18 runs.",
    "Death bowling (overs 17-20) has become the most contested phase. Teams with specialist death bowlers concede on average 12 fewer runs in these overs.",
    "The toss advantage in IPL has shifted — teams choosing to field first now win 58% of matches, up from 51% a decade ago as dew factor becomes more significant.",
    "A quality partnership of 50+ runs in overs 11-16 typically leads to a batting team scoring 40+ in the last 4 overs, making middle-order partnerships the key differentiator.",
    "Spinners are most effective in overs 7-15, conceding 7.2 runs per over on average vs 9.1 for pace bowlers in the same phase — a vital tactical insight.",
    "Teams chasing totals above 185 win only 28% of the time in the IPL, making 180+ a near-unassailable score at most venues.",
    "The impact of a wicket in the powerplay is statistically 2x more impactful than a wicket in overs 11-16 — making the first 6 overs the highest-leverage phase.",
]


# ── Live Simulation Engine ───────────────────────────────────────────

class LiveSimulator:
    """Simulates realistic live score progression for demo/offline mode."""

    BALL_OUTCOMES = [0, 0, 0, 1, 1, 1, 2, 4, 4, 6, -1]  # -1 = wicket
    WEIGHTS = [20, 18, 12, 15, 12, 8, 6, 5, 2, 1, 1]

    def __init__(self):
        self._match_state: dict[str, dict] = {}

    def _get_or_init(self, match_id: str, current: dict) -> dict:
        if match_id not in self._match_state:
            self._match_state[match_id] = {
                "runs": current.get("runs", 0),
                "wickets": current.get("wickets", 0),
                "overs_balls": self._parse_overs(current.get("overs", "0.0")),
                "max_wickets": 10,
                "target": current.get("target", "-"),
            }
        return self._match_state[match_id]

    def _parse_overs(self, overs_str: str) -> tuple[int, int]:
        try:
            parts = str(overs_str).split(".")
            return int(parts[0]), int(parts[1]) if len(parts) > 1 else 0
        except Exception:
            return 0, 0

    def _format_overs(self, completed: int, balls: int) -> str:
        return f"{completed}.{balls}"

    def simulate_ball(self, match_id: str, current: dict) -> dict:
        state = self._get_or_init(match_id, current)
        overs, balls = state["overs_balls"]

        # Stop simulating at 20 overs
        if overs >= 20:
            return current

        outcome = random.choices(self.BALL_OUTCOMES, weights=self.WEIGHTS, k=1)[0]
        event = "NONE"

        if outcome == -1 and state["wickets"] < state["max_wickets"]:
            state["wickets"] += 1
            event = "WICKET"
        elif outcome == 6:
            state["runs"] += 6
            event = "SIX"
        elif outcome == 4:
            state["runs"] += 4
            event = "FOUR"
        else:
            state["runs"] += outcome
            if outcome > 0:
                event = "RUNS"

        balls += 1
        if balls >= 6:
            balls = 0
            overs += 1
        state["overs_balls"] = (overs, balls)

        new_overs_str = self._format_overs(overs, balls)
        run_rate = 0.0
        total_balls = overs * 6 + balls
        if total_balls > 0:
            run_rate = round((state["runs"] / total_balls) * 6, 2)

        match_status = f"{current.get('batting_team', 'Team')} batting"
        target = state.get("target", "-")
        req_rate = 0.0
        if target != "-" and target.isdigit():
            runs_needed = int(target) - state["runs"]
            balls_left = (20 * 6) - total_balls
            if balls_left > 0 and runs_needed > 0:
                req_rate = round((runs_needed / balls_left) * 6, 2)
                if runs_needed <= 0:
                    match_status = f"{current.get('batting_team', 'Team')} won!"

        return {
            **current,
            "runs": state["runs"],
            "wickets": state["wickets"],
            "overs": new_overs_str,
            "run_rate": run_rate,
            "required_rate": req_rate,
            "match_status": match_status,
            "_event": event,
        }


_simulator = LiveSimulator()


# ── Score Agent ─────────────────────────────────────────────────────

class ScoreAgent:
    """Polls ESPN Cricinfo RSS feed and updates live scores in the DB.
    Falls back to live simulation if RSS is unavailable."""

    async def poll(self) -> list[dict]:
        IPL_KEYWORDS = list(IPL_TEAMS.keys()) + [
            "royal challengers", "chennai super kings", "mumbai indians",
            "kolkata knight riders", "sunrisers hyderabad", "delhi capitals",
            "rajasthan royals", "punjab kings", "gujarat titans", "lucknow super giants",
        ]

        try:
            all_matches = await fetch_cricinfo_rss()
            # ── STRICT IPL-ONLY FILTER ────────────────────────────────────
            matches = []
            for m in all_matches:
                title_lower = m["title"].lower()
                if any(kw.lower() in title_lower for kw in IPL_KEYWORDS):
                    matches.append(m)
            # ─────────────────────────────────────────────────────────────
            if matches:
                for m in matches:
                    match_id = m["id"]
                    upsert_match(match_id, m["title"], m["status"],
                                 m.get("batting_team", ""), m.get("bowling_team", ""))
                    upsert_live_score(match_id, {
                        "batting_team": m.get("batting_team", ""),
                        "bowling_team": m.get("bowling_team", ""),
                        "runs": m.get("runs", 0),
                        "wickets": m.get("wickets", 0),
                        "overs": m.get("overs", "0.0"),
                        "target": m.get("target", "-"),
                        "run_rate": m.get("run_rate", 0.0),
                        "required_rate": m.get("required_rate", 0.0),
                        "match_status": m.get("match_status", ""),
                        "raw_title": m.get("raw_title", m["title"]),
                    })
                    if m.get("runs", 0) > 0:
                        add_score_point(match_id, m.get("overs", "0.0"),
                                        m.get("runs", 0), m.get("wickets", 0))
                return matches
        except Exception as e:
            print(f"[ScoreAgent] RSS failed: {e}")

        # Fallback: simulate progression on seeded matches
        return await self._simulate_seeded_matches()

    async def _simulate_seeded_matches(self) -> list[dict]:
        """Advance seeded LIVE matches by one ball each cycle."""
        db_matches = get_matches()
        result = []
        for m in db_matches:
            if m.get("status") != "LIVE":
                continue
            match_id = m["id"]
            current = get_live_score(match_id)
            if not current:
                continue

            # Only simulate if overs < 20
            overs_str = current.get("overs", "0.0")
            try:
                overs = float(overs_str)
            except Exception:
                overs = 0.0
            if overs >= 20:
                continue

            updated = _simulator.simulate_ball(match_id, dict(current))
            event = updated.pop("_event", "NONE")

            upsert_live_score(match_id, updated)
            add_score_point(match_id, updated["overs"], updated["runs"], updated["wickets"])

            result.append({
                "id": match_id,
                "title": m.get("title", "Live Match"),
                "status": "LIVE",
                **updated,
                "_simulated_event": event,
            })
        return result


# ── Commentary Agent ────────────────────────────────────────────────

class CommentaryAgent:
    """Detects events and generates commentary (offline capable)."""

    def detect_events(self, match_id: str, current: dict) -> list[dict]:
        global _previous_scores
        events = []
        simulated = current.get("_simulated_event", None)
        batting = current.get("batting_team", "Team")
        runs = current.get("runs", 0)
        wickets = current.get("wickets", 0)
        overs = current.get("overs", "0.0")

        if simulated:
            # Use simulated event from the simulator
            if simulated == "WICKET":
                events.append({"type": "WICKET", "batting": batting, "runs": runs, "wickets": wickets, "overs": overs, "run_diff": 0})
            elif simulated == "SIX":
                events.append({"type": "SIX", "batting": batting, "runs": runs, "wickets": wickets, "overs": overs, "run_diff": 6})
            elif simulated == "FOUR":
                events.append({"type": "FOUR", "batting": batting, "runs": runs, "wickets": wickets, "overs": overs, "run_diff": 4})
            elif simulated == "RUNS":
                prev = _previous_scores.get(match_id, {})
                run_diff = runs - prev.get("runs", runs)
                if run_diff > 0:
                    events.append({"type": "RUNS", "batting": batting, "runs": runs, "wickets": wickets, "overs": overs, "run_diff": run_diff})
        else:
            # Detect from score diff (for real RSS data)
            prev = _previous_scores.get(match_id)
            if prev:
                prev_runs = prev.get("runs", 0)
                prev_wickets = prev.get("wickets", 0)
                run_diff = runs - prev_runs
                wicket_diff = wickets - prev_wickets
                if wicket_diff > 0:
                    events.append({"type": "WICKET", "batting": batting, "runs": runs, "wickets": wickets, "overs": overs, "run_diff": 0})
                if run_diff >= 6:
                    events.append({"type": "SIX", "batting": batting, "runs": runs, "wickets": wickets, "overs": overs, "run_diff": run_diff})
                elif run_diff == 4:
                    events.append({"type": "FOUR", "batting": batting, "runs": runs, "wickets": wickets, "overs": overs, "run_diff": 4})
                elif run_diff > 0:
                    events.append({"type": "RUNS", "batting": batting, "runs": runs, "wickets": wickets, "overs": overs, "run_diff": run_diff})

        _previous_scores[match_id] = {k: v for k, v in current.items() if not k.startswith("_")}
        return events

    def _make_text(self, event: dict) -> str:
        ctx = {
            "batting": event["batting"],
            "runs": event["runs"],
            "wickets": event["wickets"],
            "overs": event["overs"],
            "run_diff": event.get("run_diff", 0),
        }
        etype = event["type"]
        if etype == "WICKET":
            return random.choice(_WICKET_TEMPLATES).format(**ctx)
        elif etype == "SIX":
            return random.choice(_SIX_TEMPLATES).format(**ctx)
        elif etype == "FOUR":
            return random.choice(_FOUR_TEMPLATES).format(**ctx)
        else:
            return random.choice(_RUNS_TEMPLATES).format(**ctx)

    def process(self, match_id: str, current: dict) -> list[dict]:
        events = self.detect_events(match_id, current)
        for event in events:
            text = self._make_text(event)
            add_commentary(match_id, text, event["type"])
        return events


# ── Insights Agent ──────────────────────────────────────────────────

class InsightsAgent:
    """Generates AI insights (offline-capable with pre-written fallbacks)."""

    async def process_event(self, match_id: str, event_type: str,
                            match_context: str, score_context: str):
        # Try Gemini first
        if _client:
            try:
                class InsightResult(BaseModel):
                    insight: str = Field(description="A compelling 2-3 sentence cricket insight")

                prompt = f"""You are the Insights Agent for VibeStump IPL dashboard.
A {event_type} just occurred: {match_context}. Score: {score_context}.
Generate a fascinating 2-3 sentence cricket insight referencing IPL history or statistics."""

                resp = _client.models.generate_content(
                    model=_MODEL,
                    contents=prompt,
                    config=types.GenerateContentConfig(
                        response_mime_type="application/json",
                        response_schema=InsightResult,
                        temperature=0.8,
                    ),
                )
                if hasattr(resp, "parsed") and resp.parsed:
                    text = resp.parsed.insight
                else:
                    text = json.loads(resp.text).get("insight", "")
                if text:
                    add_insight(match_id, text, event_type)
                    return text
            except Exception as e:
                print(f"[InsightsAgent] Gemini failed: {e}")

        # Offline fallback
        insight = random.choice(_OFFLINE_INSIGHTS)
        add_insight(match_id, insight, event_type)
        return insight


# ── Media Agent ─────────────────────────────────────────────────────

class MediaAgent:
    """Fetches YouTube highlights (offline: stores placeholder if unavailable)."""

    DEMO_HIGHLIGHTS = [
        {"title": "CSK vs MI — Match 41 Full Highlights | IPL 2026", "video_id": "5Y_9cOxFJlI", "thumbnail": ""},
        {"title": "RCB vs KKR — Match 40 Best Moments | IPL 2026", "video_id": "kfI_A4oS_c4", "thumbnail": ""},
        {"title": "SRH vs GT — Match 37 Thriller Finish | IPL 2026", "video_id": "rTgj1HxmUbg", "thumbnail": ""},
        {"title": "Top 10 Sixes of IPL 2026 — Mid-Season Special", "video_id": "Jne9t8sHpUc", "thumbnail": ""},
    ]

    async def fetch(self, query: str = "IPL 2026 highlights"):
        try:
            videos = await fetch_youtube_highlights(query)
            if videos:
                for v in videos:
                    add_highlight(query, v["title"], v["video_id"], v["thumbnail"])
                return videos
        except Exception as e:
            print(f"[MediaAgent] YouTube failed: {e}")

        # Offline: add demo highlights if none exist
        from database import get_conn, _lock
        conn = get_conn()
        count = conn.execute("SELECT COUNT(*) FROM highlights").fetchone()[0]
        if count == 0:
            for h in self.DEMO_HIGHLIGHTS:
                add_highlight(query, h["title"], h["video_id"], h["thumbnail"])
        return []


# ── Meme Agent ──────────────────────────────────────────────────────

class MemeAgent:
    """Fetches memes from Tenor API."""

    EVENT_QUERIES = {
        "WICKET": "cricket wicket celebration",
        "SIX": "cricket six celebration",
        "FOUR": "cricket boundary celebration",
    }

    async def fetch(self, event_type: str, mood: str = "hype"):
        query = self.EVENT_QUERIES.get(event_type, "cricket")
        try:
            url = await fetch_tenor_meme(query)
            if url:
                add_meme(event_type, mood, url)
        except Exception:
            pass


# ── Agent Coordinator ───────────────────────────────────────────────

score_agent = ScoreAgent()
commentary_agent = CommentaryAgent()
insights_agent = InsightsAgent()
media_agent = MediaAgent()
meme_agent = MemeAgent()


async def run_agent_loop():
    """Main agent loop — runs all agents on a schedule."""
    global _agent_running
    _agent_running = True
    media_counter = 0
    print("[Agents] Starting agent loop...")

    while _agent_running:
        try:
            matches = await score_agent.poll()

            for m in matches:
                match_id = m["id"]
                events = commentary_agent.process(match_id, m)

                for event in events:
                    if event["type"] in ("WICKET", "SIX", "FOUR"):
                        batting = m.get("batting_team", "Team")
                        bowling = m.get("bowling_team", "Team")
                        score_ctx = f"{m.get('runs', 0)}/{m.get('wickets', 0)} ({m.get('overs', '0.0')} ov)"
                        match_ctx = f"{batting} vs {bowling}"
                        await insights_agent.process_event(match_id, event["type"], match_ctx, score_ctx)
                        await meme_agent.fetch(event["type"])

            media_counter += 1
            if media_counter % 6 == 0:
                await media_agent.fetch()

        except Exception as e:
            print(f"[Agents] Error in loop: {e}")

        await asyncio.sleep(10)


def stop_agents():
    global _agent_running
    _agent_running = False


# ── StumpMind Chatbot ───────────────────────────────────────────────

def chat_with_stumpmind(message: str, history: list[dict]) -> str:
    """AI chatbot — Gemini with fallback."""
    if not _client:
        return (
            "StumpMind is currently in offline mode. "
            "The Gemini API is unreachable from this network. "
            "You can still explore match data, scores, and commentary on the dashboard!"
        )
    try:
        system_prompt = """You are StumpMind, the AI cricket expert for VibeStump — an IPL live dashboard.
You are knowledgeable about cricket, IPL history, player stats, and match analysis.
Answer questions about ongoing matches, player performance, team stats, and cricket trivia.
Be enthusiastic, engaging, and use cricket terminology. Keep responses concise (2-4 sentences)."""

        contents = [
            {"role": "user", "parts": [{"text": system_prompt}]},
            {"role": "model", "parts": [{"text": "I'm StumpMind! Ask me anything about IPL 2026. 🏏"}]},
        ]
        for m in history:
            role = "user" if m.get("role") == "user" else "model"
            contents.append({"role": role, "parts": [{"text": m.get("content", "")}]})
        contents.append({"role": "user", "parts": [{"text": message}]})

        resp = _client.models.generate_content(
            model=_MODEL,
            contents=contents,
            config=types.GenerateContentConfig(temperature=0.7),
        )
        return resp.text
    except Exception as e:
        print(f"[StumpMind] Error: {e}")
        return "Sorry, I'm having trouble connecting right now. Please try again."


# ── Team/Player Info via Gemini ─────────────────────────────────────

def get_team_details_ai(team_name: str) -> dict:
    """Get team details using Gemini (offline fallback)."""
    from tools import IPL_TEAMS, resolve_team_code
    code = resolve_team_code(team_name)
    team = IPL_TEAMS.get(code, {})

    if not _client:
        return {
            "squad": ["Data unavailable — Gemini API unreachable from this network"],
            "recent_results": [],
            "upcoming": [],
            "form": f"{team.get('name', team_name)} squad details require internet access.",
        }
    try:
        class TeamInfoResult(BaseModel):
            squad: list[str] = Field(description="List of key players in the squad")
            recent_results: list[str] = Field(description="Last 3-5 match results")
            upcoming: list[str] = Field(description="Next 1-2 scheduled matches")
            form: str = Field(description="Current team form in 1-2 sentences")

        resp = _client.models.generate_content(
            model=_MODEL,
            contents=f"Get IPL 2026 squad, last 3 results, upcoming matches, and form for {team_name}.",
            config=types.GenerateContentConfig(
                tools=[{"google_search": {}}],
                response_mime_type="application/json",
                response_schema=TeamInfoResult,
                temperature=0.3,
            ),
        )
        if hasattr(resp, "parsed") and resp.parsed:
            return resp.parsed.model_dump()
        return json.loads(resp.text)
    except Exception as e:
        print(f"[TeamInfo] Error: {e}")
        return {"squad": [], "recent_results": [], "upcoming": [], "form": "Unable to fetch team data."}


def get_player_details_ai(player_name: str) -> dict:
    """Get player details using Gemini (offline fallback)."""
    if not _client:
        return {
            "name": player_name,
            "role": "N/A",
            "batting_avg": "N/A",
            "bowling_avg": "N/A",
            "total_runs": "N/A",
            "total_wickets": "N/A",
            "current_season": "Player data requires Gemini API access.",
        }
    try:
        class PlayerInfoResult(BaseModel):
            name: str
            role: str
            batting_avg: str
            bowling_avg: str
            total_runs: str
            total_wickets: str
            current_season: str

        resp = _client.models.generate_content(
            model=_MODEL,
            contents=f"IPL career and 2026 season stats for {player_name}.",
            config=types.GenerateContentConfig(
                tools=[{"google_search": {}}],
                response_mime_type="application/json",
                response_schema=PlayerInfoResult,
                temperature=0.3,
            ),
        )
        if hasattr(resp, "parsed") and resp.parsed:
            return resp.parsed.model_dump()
        return json.loads(resp.text)
    except Exception as e:
        print(f"[PlayerInfo] Error: {e}")
        return {"name": player_name, "role": "N/A", "batting_avg": "N/A", "bowling_avg": "N/A",
                "total_runs": "N/A", "total_wickets": "N/A", "current_season": "Unable to fetch player data."}



class InsightResult(BaseModel):
    insight: str = Field(description="A compelling 2-3 sentence cricket insight about this moment")


_INSIGHT_PROMPT = """You are the Insights Agent for VibeStump, an IPL live dashboard.
A {event_type} just occurred in the match: {match_context}.
Current score: {score_context}.

Generate a fascinating 2-3 sentence cricket insight. Be specific, engaging, and reference real IPL history or statistics. Make it feel like expert commentary."""


class InsightsAgent:
    """Generates AI-powered cricket insights for match events."""

    async def process_event(self, match_id: str, event_type: str, match_context: str, score_context: str):
        if not _client:
            insight = f"A crucial {event_type.lower()} moment in the match! {match_context}"
            add_insight(match_id, insight, event_type)
            return insight

        try:
            resp = _client.models.generate_content(
                model=_MODEL,
                contents=_INSIGHT_PROMPT.format(
                    event_type=event_type,
                    match_context=match_context,
                    score_context=score_context,
                ),
                config=types.GenerateContentConfig(
                    response_mime_type="application/json",
                    response_schema=InsightResult,
                    temperature=0.8,
                ),
            )
            if hasattr(resp, "parsed") and resp.parsed:
                text = resp.parsed.insight
            else:
                text = json.loads(resp.text).get("insight", f"A key {event_type.lower()} moment!")
            add_insight(match_id, text, event_type)
            return text
        except Exception as e:
            print(f"[InsightsAgent] Error: {e}")
            fallback = f"A crucial {event_type.lower()} moment! {match_context}"
            add_insight(match_id, fallback, event_type)
            return fallback


# ── Media Agent ─────────────────────────────────────────────────────

class MediaAgent:
    """Fetches YouTube highlights and stores in DB."""

    async def fetch(self, query: str = "IPL 2026 highlights"):
        videos = await fetch_youtube_highlights(query)
        for v in videos:
            add_highlight(query, v["title"], v["video_id"], v["thumbnail"])
        return videos


# ── Meme Agent ──────────────────────────────────────────────────────

class MemeAgent:
    """Fetches memes from Tenor for match events."""

    EVENT_QUERIES = {
        "WICKET": "cricket wicket celebration",
        "SIX": "cricket six celebration",
        "FOUR": "cricket boundary celebration",
        "RUNS": "cricket",
    }

    async def fetch(self, event_type: str, mood: str = "hype"):
        query = self.EVENT_QUERIES.get(event_type, f"cricket {mood}")
        url = await fetch_tenor_meme(query)
        if url:
            add_meme(event_type, mood, url)
        return url


# ── Agent Coordinator ───────────────────────────────────────────────

score_agent = ScoreAgent()
commentary_agent = CommentaryAgent()
insights_agent = InsightsAgent()
media_agent = MediaAgent()
meme_agent = MemeAgent()


async def run_agent_loop():
    """Main agent loop — runs all agents on a schedule."""
    global _agent_running
    _agent_running = True
    media_counter = 0
    print("[Agents] Starting agent loop...")

    while _agent_running:
        try:
            # Score Agent: poll every cycle
            matches = await score_agent.poll()

            # Commentary Agent: detect events for each match
            for m in matches:
                match_id = m["id"]
                events = commentary_agent.process(match_id, m)

                # Insights + Meme agents: process significant events
                for event in events:
                    if event["type"] in ("WICKET", "SIX", "FOUR"):
                        batting = m.get("batting_team", "Team")
                        bowling = m.get("bowling_team", "Team")
                        score_ctx = f"{m.get('runs', 0)}/{m.get('wickets', 0)} ({m.get('overs', '0.0')} ov)"
                        match_ctx = f"{batting} vs {bowling}"

                        await insights_agent.process_event(match_id, event["type"], match_ctx, score_ctx)
                        await meme_agent.fetch(event["type"])

            # Media Agent: refresh every 6th cycle (~60s)
            media_counter += 1
            if media_counter % 6 == 0:
                await media_agent.fetch()

        except Exception as e:
            print(f"[Agents] Error in loop: {e}")

        await asyncio.sleep(10)


def stop_agents():
    global _agent_running
    _agent_running = False


# ── StumpMind Chatbot ───────────────────────────────────────────────

def chat_with_stumpmind(message: str, history: list[dict]) -> str:
    """AI chatbot powered by Gemini with google_search for real-time data."""
    if not _client:
        return "StumpMind is offline. Please set the GEMINI_API_KEY environment variable for live AI insights."
    try:
        system_prompt = """You are StumpMind, the AI cricket expert for VibeStump — an IPL live dashboard.
You are knowledgeable about cricket, IPL history, player stats, and match analysis.
Answer questions about ongoing matches, player performance, team stats, and cricket trivia.
Be enthusiastic, engaging, and use cricket terminology. Keep responses concise (2-4 sentences)."""

        contents = [{"role": "user", "parts": [{"text": system_prompt}]},
                     {"role": "model", "parts": [{"text": "I'm StumpMind, your IPL cricket expert! Ask me anything about the match, players, or cricket history. 🏏"}]}]
        for m in history:
            role = "user" if m.get("role") == "user" else "model"
            contents.append({"role": role, "parts": [{"text": m.get("content", "")}]})
        contents.append({"role": "user", "parts": [{"text": message}]})

        tools = [{"google_search": {}}]

        resp = _client.models.generate_content(
            model=_MODEL,
            contents=contents,
            config=types.GenerateContentConfig(
                tools=tools,
                temperature=0.7,
            ),
        )
        return resp.text
    except Exception as e:
        print(f"[StumpMind] Error: {e}")
        return "Sorry, I'm having trouble connecting right now. Please try again."


# ── Team/Player Info via Gemini ─────────────────────────────────────

class TeamInfoResult(BaseModel):
    squad: list[str] = Field(description="List of key players in the squad")
    recent_results: list[str] = Field(description="Last 3-5 match results")
    upcoming: list[str] = Field(description="Next 1-2 scheduled matches")
    form: str = Field(description="Current team form description in 1-2 sentences")


class PlayerInfoResult(BaseModel):
    name: str = Field(description="Full player name")
    role: str = Field(description="Player role (Batsman/Bowler/All-rounder/Wicketkeeper)")
    batting_avg: str = Field(description="IPL career batting average")
    bowling_avg: str = Field(description="IPL career bowling average or N/A")
    total_runs: str = Field(description="Total IPL runs")
    total_wickets: str = Field(description="Total IPL wickets")
    current_season: str = Field(description="Brief current season performance summary")


def get_team_details_ai(team_name: str) -> dict:
    """Get team details using Gemini with google_search."""
    if not _client:
        return {"squad": [], "recent_results": [], "upcoming": [], "form": "Data unavailable — Gemini API key not set."}
    try:
        resp = _client.models.generate_content(
            model=_MODEL,
            contents=f"Get the current IPL 2026 squad, last 3 match results, upcoming matches, and current form for {team_name}. Use the latest available data.",
            config=types.GenerateContentConfig(
                tools=[{"google_search": {}}],
                response_mime_type="application/json",
                response_schema=TeamInfoResult,
                temperature=0.3,
            ),
        )
        if hasattr(resp, "parsed") and resp.parsed:
            return resp.parsed.model_dump()
        return json.loads(resp.text)
    except Exception as e:
        print(f"[TeamInfo] Error: {e}")
        return {"squad": [], "recent_results": [], "upcoming": [], "form": "Unable to fetch team data."}


def get_player_details_ai(player_name: str) -> dict:
    """Get player details using Gemini with google_search."""
    if not _client:
        return {"name": player_name, "role": "N/A", "batting_avg": "N/A", "bowling_avg": "N/A", "total_runs": "N/A", "total_wickets": "N/A", "current_season": "Data unavailable."}
    try:
        resp = _client.models.generate_content(
            model=_MODEL,
            contents=f"Get IPL career stats for {player_name}: role, batting average, bowling average, total runs, total wickets, and current IPL 2026 season performance.",
            config=types.GenerateContentConfig(
                tools=[{"google_search": {}}],
                response_mime_type="application/json",
                response_schema=PlayerInfoResult,
                temperature=0.3,
            ),
        )
        if hasattr(resp, "parsed") and resp.parsed:
            return resp.parsed.model_dump()
        return json.loads(resp.text)
    except Exception as e:
        print(f"[PlayerInfo] Error: {e}")
        return {"name": player_name, "role": "N/A", "batting_avg": "N/A", "bowling_avg": "N/A", "total_runs": "N/A", "total_wickets": "N/A", "current_season": "Unable to fetch player data."}
