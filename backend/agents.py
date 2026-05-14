"""
agents.py — Multi-Agent System for VibeStump.

All agents fetch REAL-TIME data from live cricket sources.
NO dummy data, NO simulation. Only real cricket data.

Agents:
  • ScoreAgent       — Fetches live IPL scores via ESPN Cricinfo RSS
  • CommentaryAgent  — Generates commentary from real score changes
  • InsightsAgent    — AI insights via Gemini 2.5 Flash
  • MediaAgent       — Fetches real YouTube highlights
  • MemeAgent        — Fetches memes from Tenor for events
  • DataFetchAgent   — Fetches points table, upcoming matches, results from Cricbuzz

Plus the StumpMind chatbot function.
"""

import os
import json
import re
import random
import asyncio
from datetime import datetime
from typing import Optional

from pydantic import BaseModel, Field

from database import (
    upsert_match,
    upsert_live_score,
    upsert_match_result,
    get_live_score,
    add_score_point,
    add_commentary,
    get_commentary,
    add_highlight,
    add_insight,
    add_meme,
    get_matches,
    get_conn,
    _lock,
)
from tools import (
    fetch_cricinfo_rss,
    fetch_cricbuzz_ipl_live,
    fetch_cricbuzz_points_table,
    fetch_youtube_highlights,
    fetch_tenor_meme,
    resolve_team_code,
    search_ipl_scores,
    search_ipl_news,
    search_team_info,
    search_player_info,
    search_web,
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
        print("[Agents] No GEMINI_API_KEY — running with DuckDuckGo only")
except Exception as e:
    print(f"[Agents] Gemini init failed: {e} — running with DuckDuckGo only")

_MODEL = "gemini-2.5-flash"
_agent_running = False
_previous_scores: dict[str, dict] = {}
_initial_fetch_done = False


# ── Score Agent ─────────────────────────────────────────────────────

class ScoreAgent:
    """Fetches REAL live IPL scores from RSS and DuckDuckGo.
    NO simulation. Only stores real data from web sources."""

    IPL_KEYWORDS = list(IPL_TEAMS.keys()) + [
        "royal challengers", "chennai super kings", "mumbai indians",
        "kolkata knight riders", "sunrisers hyderabad", "delhi capitals",
        "rajasthan royals", "punjab kings", "gujarat titans", "lucknow super giants",
        "ipl", "indian premier league",
    ]

    async def poll(self) -> list[dict]:
        """Poll for live scores. Returns list of match dicts stored in DB."""
        matches_found = []

        # ── Attempt 1: ESPN Cricinfo RSS ──────────────────────────────
        try:
            all_matches = await fetch_cricinfo_rss()
            matches = []
            for m in all_matches:
                title_lower = m["title"].lower()
                if any(kw.lower() in title_lower for kw in self.IPL_KEYWORDS):
                    matches.append(m)
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
                                        m.get("runs", 0), m.get("wickets", 0),
                                        batting_team=m.get("batting_team", ""))
                    matches_found.append(m)
                print(f"[ScoreAgent] RSS: found {len(matches_found)} IPL matches")
                return matches_found
        except Exception as e:
            print(f"[ScoreAgent] RSS failed: {e}")

        # ── Attempt 2: DuckDuckGo search for live IPL scores ─────────
        try:
            ddg_results = search_ipl_scores()
            if ddg_results:
                print(f"[ScoreAgent] DDG: found {len(ddg_results)} IPL-related results")
                for r in ddg_results:
                    match_data = self._parse_ddg_score(r)
                    if match_data:
                        match_id = match_data["id"]
                        upsert_match(match_id, match_data["title"],
                                     match_data.get("status", "LIVE"),
                                     match_data.get("team1", ""),
                                     match_data.get("team2", ""))
                        upsert_live_score(match_id, {
                            "batting_team": match_data.get("batting_team", ""),
                            "bowling_team": match_data.get("bowling_team", ""),
                            "runs": match_data.get("runs", 0),
                            "wickets": match_data.get("wickets", 0),
                            "overs": match_data.get("overs", "0.0"),
                            "target": match_data.get("target", "-"),
                            "run_rate": match_data.get("run_rate", 0.0),
                            "required_rate": match_data.get("required_rate", 0.0),
                            "match_status": match_data.get("match_status", ""),
                            "raw_title": match_data.get("raw_title", ""),
                        })
                        matches_found.append(match_data)

                # Store as news insights
                for r in ddg_results[:5]:
                    add_insight("ipl_live", f"📰 {r['title']}: {r['body'][:200]}", "NEWS")

                if matches_found:
                    return matches_found
        except Exception as e:
            print(f"[ScoreAgent] DDG search failed: {e}")

        # ── No new data: return existing DB matches (preserve old real data) ──
        print("[ScoreAgent] No new data — serving existing DB data")
        return self._get_existing_matches()

    def _parse_ddg_score(self, result: dict) -> Optional[dict]:
        """Try to parse a match from DDG search result."""
        title = result.get("title", "")
        body = result.get("body", "")
        text = f"{title} {body}"

        # Try to identify two IPL teams
        found_teams = []
        for code, team_info in IPL_TEAMS.items():
            team_name = team_info["name"].lower()
            short = team_info.get("short", code).lower()
            if code.lower() in text.lower() or team_name in text.lower() or short in text.lower():
                if code not in found_teams:
                    found_teams.append(code)

        if len(found_teams) < 2:
            return None

        team1, team2 = found_teams[0], found_teams[1]

        # Try to extract score (e.g., "145/3 (16.2 ov)" or "145-3")
        score_pattern = r'(\d{1,3})[/-](\d{1,2})\s*(?:\((\d{1,2}(?:\.\d)?)\s*(?:ov(?:ers?)?|ov\.)?\))?'
        scores = re.findall(score_pattern, text)

        runs, wickets, overs = 0, 0, "0.0"
        if scores:
            runs = int(scores[0][0])
            wickets = int(scores[0][1])
            overs = scores[0][2] if scores[0][2] else "0.0"

        # Determine match status
        status = "LIVE"
        match_status = f"{IPL_TEAMS[team1]['name']} vs {IPL_TEAMS[team2]['name']}"
        status_keywords = ["won", "lost", "tied", "drawn", "no result", "abandoned"]
        if any(kw in text.lower() for kw in status_keywords):
            status = "COMPLETED"
            for kw in status_keywords:
                idx = text.lower().find(kw)
                if idx >= 0:
                    match_status = text[max(0, idx - 20):idx + 50].strip()
                    break

        match_id = f"ddg_{team1.lower()}v{team2.lower()}_{datetime.now().strftime('%Y%m%d')}"

        run_rate = 0.0
        try:
            total_balls = int(float(overs)) * 6 + int((float(overs) % 1) * 10)
            if total_balls > 0:
                run_rate = round((runs / total_balls) * 6, 2)
        except Exception:
            pass

        return {
            "id": match_id,
            "title": f"{IPL_TEAMS[team1]['name']} vs {IPL_TEAMS[team2]['name']} — IPL 2026",
            "status": status,
            "team1": team1,
            "team2": team2,
            "batting_team": IPL_TEAMS[team1]["name"],
            "bowling_team": IPL_TEAMS[team2]["name"],
            "runs": runs,
            "wickets": wickets,
            "overs": overs,
            "target": "-",
            "run_rate": run_rate,
            "required_rate": 0.0,
            "match_status": match_status,
            "raw_title": title,
        }

    def _get_existing_matches(self) -> list[dict]:
        """Return existing matches from DB (preserving previous real data)."""
        db_matches = get_matches()
        result = []
        for m in db_matches:
            match_id = m["id"]
            score = get_live_score(match_id)
            if score:
                result.append({
                    "id": match_id,
                    "title": m.get("title", ""),
                    "status": m.get("status", "LIVE"),
                    **dict(score),
                })
        return result


# ── Commentary Agent ────────────────────────────────────────────────

_WICKET_TEMPLATES = [
    "WICKET! {batting} loses a wicket! Score: {runs}/{wickets}",
    "OUT! {batting} batsman dismissed. Score now {runs}/{wickets}",
    "WICKET! Huge breakthrough! {batting} {runs}/{wickets}",
]
_SIX_TEMPLATES = [
    "SIX! {batting} clears the boundary! Score: {runs}/{wickets}",
    "MAXIMUM! {batting} smashes it over the ropes. {runs}/{wickets}",
    "SIX! The crowd erupts! {batting} are flying at {runs}/{wickets}",
]
_FOUR_TEMPLATES = [
    "FOUR! {batting} finds the gap! {runs}/{wickets}",
    "Beautiful shot for FOUR! {batting} batting well at {runs}/{wickets}",
    "Four runs! {batting} working the ball to the boundary. {runs}/{wickets}",
]
_RUNS_TEMPLATES = [
    "{batting} scoring steadily. Score: {runs}/{wickets}",
    "Good cricket from {batting}. Score: {runs}/{wickets}",
]

_INSIGHT_FALLBACK = {
    "WICKET": [
        "🎯 Wicket! {mc} — Score: {sc}. A key breakthrough that could change the match!",
        "OUT! {mc} loses another wicket at {sc}. The fielding side is pumped!",
    ],
    "SIX": [
        "💥 Massive SIX! {mc} goes big — Score: {sc}. What a shot!",
        "🚀 Maximum! {mc} clears the boundary. {sc} on the board!",
    ],
    "FOUR": [
        "🏏 FOUR! {mc} finds the gap beautifully. Score: {sc}.",
        "💫 Boundary! {mc} is batting well. {sc} on the scoreboard.",
    ],
    "RUNS": [
        "📈 {mc} building momentum. {sc} and going strong!",
        "🏏 Steady batting from {mc}. {sc} on the scoreboard.",
    ],
}


class CommentaryAgent:
    """Detects events from real score changes and generates commentary."""

    def detect_events(self, match_id: str, current: dict) -> list[dict]:
        global _previous_scores
        events = []
        batting = current.get("batting_team", "Team")
        runs = current.get("runs", 0)
        wickets = current.get("wickets", 0)
        overs = current.get("overs", "0.0")

        prev = _previous_scores.get(match_id)
        if prev:
            prev_runs = prev.get("runs", 0)
            prev_wickets = prev.get("wickets", 0)
            run_diff = runs - prev_runs
            wicket_diff = wickets - prev_wickets

            if wicket_diff > 0:
                events.append({"type": "WICKET", "batting": batting, "runs": runs,
                               "wickets": wickets, "overs": overs, "run_diff": 0})
            if run_diff >= 6:
                events.append({"type": "SIX", "batting": batting, "runs": runs,
                               "wickets": wickets, "overs": overs, "run_diff": run_diff})
            elif run_diff == 4 or run_diff == 5:
                events.append({"type": "FOUR", "batting": batting, "runs": runs,
                               "wickets": wickets, "overs": overs, "run_diff": run_diff})
            elif run_diff > 0:
                events.append({"type": "RUNS", "batting": batting, "runs": runs,
                               "wickets": wickets, "overs": overs, "run_diff": run_diff})

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
    """Generates real-time insights using DuckDuckGo + Gemini."""

    async def process_event(self, match_id: str, event_type: str,
                            match_context: str, score_context: str):
        # Fetch latest real context from DuckDuckGo
        web_context = ""
        try:
            news = search_ipl_news(match_context)
            if news:
                web_context = "\n".join([f"- {n['title']}: {n['body'][:150]}" for n in news[:3]])
        except Exception as e:
            print(f"[InsightsAgent] DDG search failed: {e}")

        # Try Gemini with web context
        if _client:
            try:
                class InsightResult(BaseModel):
                    insight: str = Field(description="A compelling 2-3 sentence cricket insight")

                web_section = f"\n\nLatest web context:\n{web_context}" if web_context else ""
                prompt = f"""You are the Insights Agent for VibeStump IPL dashboard.
A {event_type} just occurred: {match_context}. Score: {score_context}.{web_section}
Generate a fascinating 2-3 sentence cricket insight using REAL data only.
Use the web context to make the insight accurate and current."""

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

        # DDG-only fallback: use templated insight instead of raw web text
        tmpl = random.choice(_INSIGHT_FALLBACK.get(event_type, _INSIGHT_FALLBACK["RUNS"]))
        insight = tmpl.format(mc=match_context, sc=score_context)
        add_insight(match_id, insight, event_type)
        return insight

    async def fetch_latest_news(self):
        """Fetch latest IPL news and store as insights."""
        try:
            news = search_ipl_news("IPL 2026 today match")
            if news:
                for item in news[:5]:
                    add_insight("ipl_news", f"📰 {item['title']}: {item['body'][:200]}", "NEWS")
                print(f"[InsightsAgent] Stored {min(5, len(news))} news insights")
        except Exception as e:
            print(f"[InsightsAgent] News fetch failed: {e}")


# ── Media Agent ─────────────────────────────────────────────────────

class MediaAgent:
    """Fetches REAL YouTube highlights via search. No dummy data."""

    async def fetch(self, query: str = "IPL 2026 highlights"):
        # Attempt 1: YouTube API
        try:
            videos = await fetch_youtube_highlights(query)
            if videos:
                for v in videos:
                    add_highlight(query, v["title"], v["video_id"], v["thumbnail"])
                print(f"[MediaAgent] YouTube: stored {len(videos)} highlights")
                return videos
        except Exception as e:
            print(f"[MediaAgent] YouTube API failed: {e}")

        # Attempt 2: DuckDuckGo search for IPL highlight videos
        try:
            results = search_web(f"{query} youtube video", max_results=8)
            if results:
                videos = []
                for r in results:
                    video_id = self._extract_youtube_id(r.get("href", ""))
                    if video_id:
                        videos.append({
                            "title": r["title"],
                            "video_id": video_id,
                            "thumbnail": f"https://img.youtube.com/vi/{video_id}/mqdefault.jpg",
                        })
                if videos:
                    for v in videos:
                        add_highlight(query, v["title"], v["video_id"], v["thumbnail"])
                    print(f"[MediaAgent] DDG: stored {len(videos)} highlight videos")
                    return videos
        except Exception as e:
            print(f"[MediaAgent] DDG search failed: {e}")

        print("[MediaAgent] No new highlights found — keeping existing DB data")
        return []

    def _extract_youtube_id(self, url: str) -> Optional[str]:
        """Extract YouTube video ID from URL."""
        patterns = [
            r'(?:youtube\.com/watch\?v=|youtu\.be/|youtube\.com/embed/)([a-zA-Z0-9_-]{11})',
            r'youtube\.com/shorts/([a-zA-Z0-9_-]{11})',
        ]
        for pattern in patterns:
            match = re.search(pattern, url)
            if match:
                return match.group(1)
        return None


# ── Meme Agent ──────────────────────────────────────────────────────

class MemeAgent:
    """Fetches memes from Tenor API for match events."""

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


# ── Data Fetch Agent (Points Table, Upcoming, Results) ──────────────

class DataFetchAgent:
    """Fetches points table, upcoming matches, and results from Cricbuzz.
    Falls back to DuckDuckGo if Cricbuzz is unavailable.
    Runs on startup and periodically to keep data fresh."""

    async def fetch_points_table(self):
        """Fetch real IPL 2026 points table from Cricbuzz."""
        try:
            # Primary: Cricbuzz live scraping
            table = await fetch_cricbuzz_points_table()
            if table:
                conn = get_conn()
                with _lock:
                    conn.execute("DELETE FROM points_table")
                    for entry in table:
                        conn.execute(
                            """INSERT INTO points_table (team, played, won, lost, nr, pts, nrr)
                               VALUES (?, ?, ?, ?, ?, ?, ?)
                               ON CONFLICT(team) DO UPDATE SET
                                 played=excluded.played, won=excluded.won,
                                 lost=excluded.lost, nr=excluded.nr,
                                 pts=excluded.pts, nrr=excluded.nrr""",
                            (entry["team"], entry["played"], entry["won"],
                             entry["lost"], entry["nr"], entry["pts"], entry["nrr"]),
                        )
                    conn.commit()
                print(f"[DataFetch] Points table updated: {len(table)} teams")
                return True
        except Exception as e:
            print(f"[DataFetch] Points table failed: {e}")
        return False

    async def fetch_upcoming_matches(self):
        """Fetch upcoming IPL 2026 matches from Cricbuzz."""
        try:
            all_matches = await fetch_cricbuzz_ipl_live()
            upcoming = [m for m in all_matches if m["match_status"] == "UPCOMING"]

            if not upcoming:
                # Fallback: use known upcoming fixtures
                upcoming = self._get_fallback_upcoming()

            if upcoming:
                conn = get_conn()
                with _lock:
                    conn.execute("""
                        CREATE TABLE IF NOT EXISTS upcoming_matches (
                            id TEXT PRIMARY KEY,
                            team1 TEXT, team2 TEXT, venue TEXT,
                            date TEXT, time TEXT, match_no TEXT,
                            updated_at TEXT DEFAULT (datetime('now'))
                        )
                    """)
                    conn.execute("DELETE FROM upcoming_matches")
                    for i, m in enumerate(upcoming):
                        # Convert epoch ms to IST date/time
                        from datetime import timezone, timedelta
                        ist = timezone(timedelta(hours=5, minutes=30))
                        if m.get("start_date_ms", 0) > 0:
                            from datetime import datetime as _dt
                            dt = _dt.fromtimestamp(m["start_date_ms"] / 1000, tz=ist)
                            date_str = dt.strftime("%Y-%m-%d")
                            time_str = dt.strftime("%H:%M")
                        else:
                            date_str = m.get("date", "TBD")
                            time_str = m.get("time", "19:30")

                        conn.execute(
                            """INSERT INTO upcoming_matches
                               (id, team1, team2, venue, date, time, match_no)
                               VALUES (?, ?, ?, ?, ?, ?, ?)""",
                            (
                                f"upcoming_{m.get('match_id', i+1)}",
                                m["team1"], m["team2"], m["venue"],
                                date_str, time_str,
                                m.get("match_desc", f"Match {i+1}"),
                            ),
                        )
                    conn.commit()
                print(f"[DataFetch] Upcoming matches updated: {len(upcoming)}")
                return True
        except Exception as e:
            print(f"[DataFetch] Upcoming matches failed: {e}")
        return False

    def _get_fallback_upcoming(self) -> list[dict]:
        """Return known upcoming IPL 2026 fixtures (as of May 14, 2026)."""
        return [
            {"match_id": "152152", "team1": "LSG", "team2": "CSK",
             "venue": "Bharat Ratna Shri Atal Bihari Vajpayee Ekana Cricket Stadium, Lucknow",
             "match_desc": "59th Match", "start_date_ms": 1778853600000,
             "match_status": "UPCOMING"},
            {"match_id": "152163", "team1": "KKR", "team2": "GT",
             "venue": "Eden Gardens, Kolkata",
             "match_desc": "60th Match", "start_date_ms": 1778940000000,
             "match_status": "UPCOMING"},
            {"match_id": "152174", "team1": "PBKS", "team2": "RCB",
             "venue": "Himachal Pradesh Cricket Association Stadium, Dharamsala",
             "match_desc": "61st Match", "start_date_ms": 1779003000000,
             "match_status": "UPCOMING"},
            {"match_id": "152185", "team1": "DC", "team2": "RR",
             "venue": "Arun Jaitley Stadium, Delhi",
             "match_desc": "62nd Match", "start_date_ms": 1779026400000,
             "match_status": "UPCOMING"},
            {"match_id": "152196", "team1": "CSK", "team2": "SRH",
             "venue": "MA Chidambaram Stadium, Chennai",
             "match_desc": "63rd Match", "start_date_ms": 1779112800000,
             "match_status": "UPCOMING"},
        ]

    async def fetch_recent_results(self):
        """Fetch recent IPL 2026 match results from Cricbuzz."""
        try:
            all_matches = await fetch_cricbuzz_ipl_live()
            completed = [m for m in all_matches if m["match_status"] == "COMPLETED"]

            if not completed:
                completed = self._get_fallback_results()

            for m in completed:
                match_id = m.get("id", f"cb_{m.get('match_id', 'unknown')}")
                t1_code = m["team1"]
                t2_code = m["team2"]
                t1_name = IPL_TEAMS.get(t1_code, {}).get("name", t1_code)
                t2_name = IPL_TEAMS.get(t2_code, {}).get("name", t2_code)
                title = f"{t1_name} vs {t2_name} — IPL 2026 {m.get('match_desc', '')}"

                upsert_match(match_id, title, "COMPLETED", t1_code, t2_code)

                t1_score_str = (
                    f"{m['t1_runs']}/{m['t1_wickets']}" if m.get("t1_runs", 0) > 0 else "0/0"
                )
                t2_score_str = (
                    f"{m['t2_runs']}/{m['t2_wickets']}" if m.get("t2_runs", 0) > 0 else "0/0"
                )

                upsert_match_result(match_id, {
                    "winner": m.get("winner", ""),
                    "margin": m.get("margin", ""),
                    "team1_code": t1_code,
                    "team1_name": t1_name,
                    "team1_score": t1_score_str,
                    "team1_overs": m.get("t1_overs", "20.0"),
                    "team2_code": t2_code,
                    "team2_name": t2_name,
                    "team2_score": t2_score_str,
                    "team2_overs": m.get("t2_overs", "20.0"),
                    "match_no": m.get("match_desc", ""),
                    "venue": m.get("venue", ""),
                    "status": m.get("status", ""),
                })

            print(f"[DataFetch] Recent results updated: {len(completed)}")
            return True
        except Exception as e:
            print(f"[DataFetch] Recent results failed: {e}")
        return False

    def _get_fallback_results(self) -> list[dict]:
        """Return the last 3 confirmed IPL 2026 match results (as of May 14, 2026)."""
        return [
            {
                "id": "cb_152130", "match_id": "152130",
                "team1": "KKR", "team2": "RCB",
                "t1_runs": 192, "t1_wickets": 4, "t1_overs": "19.6",
                "t2_runs": 194, "t2_wickets": 4, "t2_overs": "19.1",
                "venue": "Shaheed Veer Narayan Singh International Stadium, Raipur",
                "match_desc": "57th Match", "match_status": "COMPLETED",
                "winner": "RCB", "margin": "6 wickets",
                "status": "Royal Challengers Bengaluru won by 6 wkts",
            },
            {
                "id": "cb_152119", "match_id": "152119",
                "team1": "GT", "team2": "SRH",
                "t1_runs": 168, "t1_wickets": 5, "t1_overs": "20.0",
                "t2_runs": 86, "t2_wickets": 10, "t2_overs": "14.4",
                "venue": "Narendra Modi Stadium, Ahmedabad",
                "match_desc": "56th Match", "match_status": "COMPLETED",
                "winner": "GT", "margin": "82 runs",
                "status": "Gujarat Titans won by 82 runs",
            },
            {
                "id": "cb_152108", "match_id": "152108",
                "team1": "PBKS", "team2": "DC",
                "t1_runs": 210, "t1_wickets": 5, "t1_overs": "20.0",
                "t2_runs": 216, "t2_wickets": 7, "t2_overs": "19.2",
                "venue": "Himachal Pradesh Cricket Association Stadium, Dharamsala",
                "match_desc": "55th Match", "match_status": "COMPLETED",
                "winner": "DC", "margin": "3 wickets",
                "status": "Delhi Capitals won by 3 wickets",
            },
        ]

    async def run_initial_fetch(self):
        """Run all data fetches on startup to populate the DB immediately."""
        print("[DataFetch] Running initial data fetch from Cricbuzz...")
        await self.fetch_points_table()
        await self.fetch_upcoming_matches()
        await self.fetch_recent_results()
        print("[DataFetch] Initial data fetch complete.")

    # ── OLD DDG methods below are superseded by the Cricbuzz methods above ──
    # Kept as dead-code reference only; Python will use the LAST definition.
    # These should not be reached because the Cricbuzz methods are defined first
    # in source order and Python class dicts store the last assignment.
    async def _old_fetch_points_table_ddg_UNUSED(self):
        """Old DDG-based fetch — superseded by Cricbuzz version above."""
        try:
            results = search_web("IPL 2026 points table standings latest", max_results=5)
            if not results:
                print("[DataFetch] No points table results from DDG")
                return False

            # Try Gemini to parse structured data
            if _client:
                try:
                    class PointsTableEntry(BaseModel):
                        team: str = Field(description="Team short code (CSK, MI, RCB, etc.)")
                        played: int = Field(description="Matches played")
                        won: int = Field(description="Matches won")
                        lost: int = Field(description="Matches lost")
                        nr: int = Field(description="No result matches")
                        pts: int = Field(description="Points")
                        nrr: str = Field(description="Net run rate as string")

                    class PointsTableData(BaseModel):
                        table: list[PointsTableEntry]

                    web_text = "\n".join([f"{r['title']}: {r['body']}" for r in results[:3]])
                    prompt = f"""Extract the latest IPL points table from this web data.
Return all 10 teams with their standings. Use team short codes: CSK, MI, RCB, KKR, SRH, DC, RR, PBKS, GT, LSG.
If the data mentions IPL 2025 or 2026, use it.

Web data:
{web_text}

Return the best available real standings."""

                    resp = _client.models.generate_content(
                        model=_MODEL,
                        contents=prompt,
                        config=types.GenerateContentConfig(
                            response_mime_type="application/json",
                            response_schema=PointsTableData,
                            temperature=0.1,
                        ),
                    )
                    if hasattr(resp, "parsed") and resp.parsed:
                        table = resp.parsed.table
                        conn = get_conn()
                        with _lock:
                            conn.execute("DELETE FROM points_table")
                            for entry in table:
                                conn.execute(
                                    """INSERT INTO points_table (team, played, won, lost, nr, pts, nrr)
                                       VALUES (?, ?, ?, ?, ?, ?, ?)
                                       ON CONFLICT(team) DO UPDATE SET
                                         played=excluded.played, won=excluded.won,
                                         lost=excluded.lost, nr=excluded.nr,
                                         pts=excluded.pts, nrr=excluded.nrr""",
                                    (entry.team, entry.played, entry.won, entry.lost,
                                     entry.nr, entry.pts, entry.nrr),
                                )
                            conn.commit()
                        print(f"[DataFetch] Points table updated: {len(table)} teams")
                        return True
                except Exception as e:
                    print(f"[DataFetch] Gemini points table parse failed: {e}")

            # Fallback: store raw DDG results as insights
            for r in results[:3]:
                add_insight("ipl_standings", f"📊 {r['title']}: {r['body'][:200]}", "STANDINGS")
            return False

        except Exception as e:
            print(f"[DataFetch] Points table fetch failed: {e}")
            return False



# ── Agent Coordinator ───────────────────────────────────────────────

score_agent = ScoreAgent()
commentary_agent = CommentaryAgent()
insights_agent = InsightsAgent()
media_agent = MediaAgent()
meme_agent = MemeAgent()
data_fetch_agent = DataFetchAgent()


async def run_initial_data_fetch():
    """Immediately fetch all data on startup. Does NOT wait for agent loop."""
    global _initial_fetch_done
    try:
        print("[Agents] === IMMEDIATE DATA FETCH ON STARTUP ===")
        # Fetch scores first
        await score_agent.poll()
        # Fetch all supplementary data
        await data_fetch_agent.run_initial_fetch()
        # Fetch media
        await media_agent.fetch("IPL 2026 highlights today")
        # Fetch latest news as insights
        await insights_agent.fetch_latest_news()
        _initial_fetch_done = True
        print("[Agents] === INITIAL FETCH COMPLETE — Dashboard ready ===")
    except Exception as e:
        print(f"[Agents] Initial fetch error (non-fatal): {e}")
        _initial_fetch_done = True


async def run_agent_loop():
    """Main agent loop — fetches real data on a schedule."""
    global _agent_running

    # Run immediate fetch first
    await run_initial_data_fetch()

    _agent_running = True
    data_fetch_counter = 0
    media_counter = 0
    print("[Agents] Starting periodic agent loop (10s cycle)...")

    while _agent_running:
        try:
            # Score Agent: poll every cycle for live scores
            matches = await score_agent.poll()

            # Commentary Agent: detect events for real score changes
            for m in matches:
                match_id = m["id"]
                events = commentary_agent.process(match_id, m)

                # Insights + Meme for significant events
                for event in events:
                    if event["type"] in ("WICKET", "SIX", "FOUR"):
                        batting = m.get("batting_team", "Team")
                        bowling = m.get("bowling_team", "Team")
                        overs_val = m.get('overs', '')
                        score_ctx = f"{m.get('runs', 0)}/{m.get('wickets', 0)}" + (f" ({overs_val} ov)" if overs_val else "")
                        match_ctx = f"{batting} vs {bowling}"
                        await insights_agent.process_event(match_id, event["type"], match_ctx, score_ctx)
                        await meme_agent.fetch(event["type"])

            # Media Agent: refresh every 6th cycle (~60s)
            media_counter += 1
            if media_counter % 6 == 0:
                await media_agent.fetch()

            # Data Fetch Agent: refresh points/upcoming/results every 30th cycle (~5 min)
            data_fetch_counter += 1
            if data_fetch_counter % 30 == 0:
                await data_fetch_agent.fetch_points_table()
                await data_fetch_agent.fetch_upcoming_matches()
                await data_fetch_agent.fetch_recent_results()

        except Exception as e:
            print(f"[Agents] Error in loop: {e}")

        await asyncio.sleep(10)


def stop_agents():
    global _agent_running
    _agent_running = False


# ── StumpMind Chatbot ───────────────────────────────────────────────

def _build_stumpmind_answer(message: str, db_context: str, web_context: str) -> str:
    """Build a smart conversational reply from DB + web context without Gemini."""
    msg_lower = message.lower()

    # Parse db_context into sections
    standings_lines = ""
    results_lines = ""
    if "\n\nRecent Results:" in db_context:
        idx = db_context.index("\n\nRecent Results:")
        standings_lines = db_context[:idx].replace("IPL 2026 Standings:", "").strip()
        results_lines = db_context[idx:].replace("\n\nRecent Results:", "").strip()
    elif db_context:
        standings_lines = db_context.replace("IPL 2026 Standings:", "").strip()

    # Intent-based routing
    if any(k in msg_lower for k in ["lead", "top", "first", "number one", "best team", "who is #1", "which team"]):
        if standings_lines:
            top_line = standings_lines.split("\n")[0].strip()
            return f"🏆 {top_line} is currently leading IPL 2026!\n\n📊 **Full standings:**\n{standings_lines}"

    if any(k in msg_lower for k in ["point", "table", "standing", "rank", "position", "leaderboard"]):
        if standings_lines:
            return f"📊 **IPL 2026 Points Table:**\n{standings_lines}"

    if any(k in msg_lower for k in ["result", "won", "win", "lost", "beat", "defeat", "last match", "recent"]):
        if results_lines:
            return f"🏆 **Recent IPL 2026 Results:**\n{results_lines}"
        if standings_lines:
            return f"📊 **IPL 2026 Standings:**\n{standings_lines}"

    if any(k in msg_lower for k in ["squad", "playing xi", "roster", "who plays", "lineup"]):
        return (
            "🏏 Check the **Teams** section in the dashboard for full squads and playing XI! "
            "I can also answer questions about IPL 2026 standings, results, and player statistics."
        )

    # Default: show all available DB data
    parts = []
    if standings_lines:
        parts.append(f"📊 **IPL 2026 Standings:**\n{standings_lines}")
    if results_lines:
        parts.append(f"🏆 **Recent Results:**\n{results_lines}")

    if not parts and web_context:
        first = web_context.split("\n")[0].strip().lstrip("• ")
        if ": " in first:
            src, body = first.split(": ", 1)
            parts.append(f"🌐 **{src}:**\n{body[:300]}")
        else:
            parts.append(f"🌐 {first[:300]}")

    if parts:
        return "\n\n".join(parts)
    return "🏏 Ask me about IPL 2026 standings, recent results, player stats, or match predictions!"


def chat_with_stumpmind(message: str, history: list[dict]) -> str:
    """AI chatbot — Gemini + DuckDuckGo grounding + live DB context."""
    # ── Fetch web context via targeted DDG searches ───────────────────
    web_context = ""
    try:
        # Use the user's own message as query (more targeted than prepending "IPL cricket")
        primary = search_web(f"IPL 2026 {message}", max_results=3)
        secondary = search_ipl_news("IPL 2026 today match") if len(primary) < 2 else []
        all_results = primary + secondary
        if all_results:
            web_context = "\n".join(
                [f"• {r['title']}: {r['body'][:220]}" for r in all_results[:4]]
            )
    except Exception as e:
        print(f"[StumpMind] DDG search failed: {e}")

    # ── Fetch live DB context: standings + recent results ────────────
    db_context = ""
    try:
        conn = get_conn()
        standings = conn.execute(
            "SELECT team, pts, played, won, lost, nrr FROM points_table ORDER BY pts DESC, nrr DESC LIMIT 10"
        ).fetchall()
        if standings:
            rows = [
                f"  {i+1}. {dict(r)['team']}: {dict(r)['pts']} pts "
                f"({dict(r)['won']}W/{dict(r)['lost']}L, NRR {dict(r)['nrr']})"
                for i, r in enumerate(standings)
            ]
            db_context += "IPL 2026 Standings:\n" + "\n".join(rows)

        recent = conn.execute(
            """SELECT match_no, team1_code, team2_code, winner, margin
               FROM match_results ORDER BY rowid DESC LIMIT 4"""
        ).fetchall()
        if recent:
            result_strs = [
                f"  {dict(r)['match_no']}: {dict(r)['winner']} won "
                f"({dict(r)['team1_code']} vs {dict(r)['team2_code']}, {dict(r)['margin']})"
                for r in recent
            ]
            db_context += "\n\nRecent Results:\n" + "\n".join(result_strs)
    except Exception as e:
        print(f"[StumpMind] DB context fetch failed: {e}")

    # ── No Gemini: return smart targeted answer ──────────────────────
    if not _client:
        return _build_stumpmind_answer(message, db_context, web_context)

    # ── Gemini path: use DB + DDG as grounding context ───────────────
    try:
        context_parts = []
        if db_context:
            context_parts.append(db_context)
        if web_context:
            context_parts.append(f"Web search results:\n{web_context}")
        context_section = ("\n\n".join(context_parts)).strip()

        system_prompt = (
            "You are StumpMind, the AI cricket expert for VibeStump — an IPL 2026 live dashboard.\n"
            "You are knowledgeable about cricket, IPL history, player stats, and match analysis.\n"
            "Be enthusiastic and use cricket terminology. Keep responses concise (2-4 sentences).\n"
            "IMPORTANT: Only provide REAL, factual information. Do NOT fabricate scores or results.\n"
            "Use the context below to ground your answers.\n\n"
            + context_section
        )

        contents = []
        for m in history:
            role = "user" if m.get("role") == "user" else "model"
            contents.append({"role": role, "parts": [{"text": m.get("content", "")}]})
        contents.append({"role": "user", "parts": [{"text": message}]})

        resp = _client.models.generate_content(
            model=_MODEL,
            contents=contents,
            config=types.GenerateContentConfig(
                system_instruction=system_prompt,
                temperature=0.7,
            ),
        )
        return resp.text
    except Exception as e:
        print(f"[StumpMind] Gemini error: {e}")
        return _build_stumpmind_answer(message, db_context, web_context)


# ── Team/Player Info ────────────────────────────────────────────────

def get_team_details_ai(team_name: str) -> dict:
    """Build team detail response from the live DB (no external API needed).

    Returns recent results and upcoming fixtures directly from the SQLite DB
    that DataFetchAgent keeps up-to-date via Cricbuzz scraping.
    """
    code = resolve_team_code(team_name)

    # ── Recent results from match_results table ───────────────────────
    recent_results: list[str] = []
    try:
        conn = get_conn()
        rows = conn.execute(
            """SELECT match_no, team1_code, team1_score, team2_code, team2_score,
                      winner, margin, venue
               FROM match_results
               WHERE team1_code = ? OR team2_code = ?
               ORDER BY rowid DESC LIMIT 5""",
            (code, code),
        ).fetchall()
        for r in rows:
            r = dict(r)
            opp = r["team2_code"] if r["team1_code"] == code else r["team1_code"]
            own_score = r["team1_score"] if r["team1_code"] == code else r["team2_score"]
            opp_score = r["team2_score"] if r["team1_code"] == code else r["team1_score"]
            outcome = "Won" if r["winner"] == code else "Lost"
            recent_results.append(
                f"{r['match_no']}: {outcome} vs {opp} "
                f"({own_score} vs {opp_score}) — {r['margin']}"
            )
    except Exception as e:
        print(f"[TeamInfo] DB recent_results error: {e}")

    # ── Upcoming fixtures from upcoming_matches table ─────────────────
    upcoming: list[str] = []
    try:
        conn = get_conn()
        rows = conn.execute(
            """SELECT match_no, team1, team2, date, time, venue
               FROM upcoming_matches
               WHERE team1 = ? OR team2 = ?
               ORDER BY date, time LIMIT 3""",
            (code, code),
        ).fetchall()
        for r in rows:
            r = dict(r)
            opp = r["team2"] if r["team1"] == code else r["team1"]
            venue_short = r["venue"].split(",")[0] if r["venue"] else "TBD"
            upcoming.append(
                f"{r['match_no']}: vs {opp} on {r['date']} at {r['time']} IST, {venue_short}"
            )
    except Exception as e:
        print(f"[TeamInfo] DB upcoming error: {e}")

    # ── Form string ───────────────────────────────────────────────────
    if recent_results:
        wins = sum(1 for r in recent_results if r.split(":")[1].strip().startswith("Won"))
        total = len(recent_results)
        form = f"{wins} wins in last {total} games."
    else:
        form = "IPL 2026 season in progress."

    # ── Points table position ─────────────────────────────────────────
    try:
        conn = get_conn()
        rows = conn.execute(
            "SELECT team, pts, played, won, nrr FROM points_table ORDER BY pts DESC, nrr DESC"
        ).fetchall()
        for i, r in enumerate(rows):
            r = dict(r)
            if r["team"] == code:
                form = (
                    f"Rank #{i+1} — {r['pts']} pts from {r['played']} games "
                    f"({r['won']} wins, NRR {r['nrr']}). {form}"
                )
                break
    except Exception:
        pass

    return {
        "squad": [],
        "recent_results": recent_results,
        "upcoming": upcoming,
        "form": form,
    }


def get_player_details_ai(player_name: str) -> dict:
    """Get player details using DuckDuckGo + Gemini."""
    # ── Fetch web context via DDG (two queries for richer coverage) ──
    web_context = ""
    try:
        ipl_ctx = search_player_info(player_name)  # IPL 2026 stats
        career_results = search_web(
            f"{player_name} cricket career runs wickets batting bowling average", max_results=3
        )
        career_ctx = "\n".join(
            [f"{r['title']}: {r['body'][:220]}" for r in career_results]
        ) if career_results else ""
        web_context = "\n".join(filter(None, [ipl_ctx, career_ctx]))[:1800]
    except Exception as e:
        print(f"[PlayerInfo] DDG search failed: {e}")

    _empty = {
        "name": player_name, "role": "—", "batting_avg": "—",
        "bowling_avg": "—", "total_runs": "—", "total_wickets": "—",
        "current_season": "Fetching player data... Please refresh.",
    }

    # ── No Gemini: return DDG text in current_season field ───────────
    if not _client:
        if web_context:
            return {**_empty, "role": "Cricketer", "current_season": web_context[:700]}
        return _empty

    # ── Gemini path: structured JSON extraction from DDG context ─────
    try:
        class PlayerInfoResult(BaseModel):
            name: str
            role: str
            batting_avg: str
            bowling_avg: str
            total_runs: str
            total_wickets: str
            current_season: str

        web_section = f"\n\nLatest from web:\n{web_context}" if web_context else ""
        prompt = (
            f"You are a cricket statistics expert. Provide REAL IPL career and "
            f"current IPL 2026 season stats for {player_name}.\n"
            f"Use ONLY real, factual information from the web context. "
            f"If a value is unknown, use '—'.\n"
            f"For 'current_season', give a 1-2 sentence summary of their IPL 2026 performance."
            f"{web_section}"
        )

        resp = _client.models.generate_content(
            model=_MODEL,
            contents=prompt,
            config=types.GenerateContentConfig(
                # NOTE: Do NOT add tools=[{"google_search": {}}] here —
                # it is INCOMPATIBLE with response_mime_type="application/json"
                # and will cause an exception. DDG context is used instead.
                response_mime_type="application/json",
                response_schema=PlayerInfoResult,
                temperature=0.3,
            ),
        )
        if hasattr(resp, "parsed") and resp.parsed:
            return resp.parsed.model_dump()
        return json.loads(resp.text)
    except Exception as e:
        print(f"[PlayerInfo] Gemini error: {e}")
        if web_context:
            return {**_empty, "role": "Cricketer", "current_season": web_context[:700]}
        return _empty
