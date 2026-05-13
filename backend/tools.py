"""
tools.py — Data ingestion, YouTube integration, and mock APIs.

ScoutAgent uses httpx for async HTTP to RapidAPI Cricbuzz.
Falls back to live_sim.json (Match 57: RCB vs KKR) on any error.
"""

import os
import json
import time
import random
from pathlib import Path
import httpx

RAPIDAPI_KEY = os.getenv("RAPIDAPI_KEY", "")
YOUTUBE_API_KEY = os.getenv("YOUTUBE_API_KEY", "")

_SIM_PATH = Path(__file__).parent / "live_sim.json"

MEME_DICTIONARY = {
    "happy": "https://media.giphy.com/media/26n6R5HOYPbekK0YE/giphy.gif",
    "sad":   "https://media.giphy.com/media/d2lcHJTG5Tscg/giphy.gif",
    "tense": "https://media.giphy.com/media/l4FATJpd4LWgeruTK/giphy.gif",
    "angry": "https://media.giphy.com/media/11tTNkNy1SdXGg/giphy.gif",
    "hype":  "https://media.giphy.com/media/b1o4elHO8oqD1Fwx48/giphy.gif",
}

HISTORICAL_DB = {
    "WICKET": [
        "Sunil Narine has dismissed Virat Kohli 5 times in IPL history. Their duel is one of cricket's great modern rivalries.",
        "The biggest collapse in IPL history: RCB bowled out for 49 vs KKR in 2017. A trauma that still haunts Bengaluru.",
        "Varun Chakravarthy's mystery spin has troubled RCB's middle order in 4 of their last 6 encounters.",
    ],
    "SIX": [
        "Chris Gayle's 175* off 66 balls (17 sixes!) for RCB vs PWI in 2013 remains the greatest IPL innings ever played.",
        "AB de Villiers hit 133* off 59 balls at Chinnaswamy in 2015. The sixes were landing on MG Road.",
        "Andre Russell's 48-ball century against RCB in 2019 is KKR's most devastating counter-attack in history.",
    ],
    "FOUR": [
        "Kohli scored 973 runs in IPL 2016 — the greatest individual season in T20 league history. 4 centuries.",
        "Chinnaswamy's short boundaries mean more boundaries per match (avg 28.3) than any other IPL venue in 2026.",
    ],
}


class ScoutAgent:
    """Fetches live cricket data. Falls back to simulation on error."""

    def __init__(self):
        self._sim_data = self._load_sim()

    def _load_sim(self) -> list:
        try:
            with open(_SIM_PATH, "r") as f:
                return json.load(f)
        except Exception:
            return []

    async def get_commentary(self, ball_index: int, demo_mode: bool = True) -> str:
        if demo_mode:
            return self._sim_commentary(ball_index)
        # Try live API
        if RAPIDAPI_KEY:
            try:
                async with httpx.AsyncClient(timeout=5.0) as client:
                    resp = await client.get(
                        "https://cricbuzz-cricket.p.rapidapi.com/matches/v1/recent",
                        headers={
                            "X-RapidAPI-Key": RAPIDAPI_KEY,
                            "X-RapidAPI-Host": "cricbuzz-cricket.p.rapidapi.com",
                        },
                    )
                    if resp.status_code in (429, 500, 502, 503):
                        raise httpx.HTTPStatusError(
                            f"HTTP {resp.status_code}", request=resp.request, response=resp)
                    resp.raise_for_status()
                    # Parse the response for commentary
                    data = resp.json()
                    matches = data.get("typeMatches", [])
                    if matches:
                        first = matches[0].get("seriesMatches", [{}])[0]
                        info = first.get("seriesAdWrapper", {}).get("matches", [{}])[0]
                        desc = info.get("matchInfo", {}).get("status", "Live match in progress")
                        return f"🚨 LIVE: {desc}"
            except Exception as e:
                print(f"[Scout] API error: {e}. Falling back to simulation.")
        # Fallback: RSS
        try:
            async with httpx.AsyncClient(timeout=5.0) as client:
                resp = await client.get(
                    "http://static.cricinfo.com/rss/livescores.xml",
                    headers={"User-Agent": "Mozilla/5.0"},
                )
                resp.raise_for_status()
                import xml.etree.ElementTree as ET
                tree = ET.fromstring(resp.content)
                items = tree.findall(".//item")
                if items:
                    titles = [i.find("title").text for i in items if i.find("title") is not None]
                    return f"🚨 LIVE: {titles[ball_index % len(titles)]}"
        except Exception:
            pass
        return self._sim_commentary(ball_index)

    def _sim_commentary(self, index: int) -> str:
        if not self._sim_data:
            return "19.1: Dot ball. Pressure mounting."
        return self._sim_data[index % len(self._sim_data)].get(
            "commentary", "Ball in play.")

    def get_scorecard(self, ball_index: int, demo_mode: bool = True) -> dict:
        if demo_mode and self._sim_data:
            ball = self._sim_data[ball_index % len(self._sim_data)]
            return {
                "runs": ball.get("runs", 0),
                "wickets": ball.get("wickets", 0),
                "overs": ball.get("overs", 0),
                "run_rate": ball.get("run_rate", 0),
                "target": ball.get("target", 195),
                "batting": ball.get("batting", "RCB"),
                "bowling": ball.get("bowling", "KKR"),
                "required_rate": ball.get("required_rate", 0),
            }
        return {
            "runs": 0, "wickets": 0, "overs": 0, "run_rate": 0,
            "target": "—", "batting": "LIVE", "bowling": "LIVE",
            "required_rate": 0,
        }


def get_historical_context(event_type: str) -> str:
    facts = HISTORICAL_DB.get(event_type, HISTORICAL_DB.get("FOUR", []))
    return random.choice(facts) if facts else "A key moment in the match."


def fetch_meme(mood: str) -> str:
    return MEME_DICTIONARY.get(mood.lower(), MEME_DICTIONARY["happy"])


# ── YouTube ──────────────────────────────────────────────────────────
FALLBACK_VIDEOS = [
    {"title": "RCB vs KKR — IPL 2026 Match 57 Preview", "videoId": "dQw4w9WgXcQ", "thumbnail": ""},
    {"title": "Top 10 RCB vs KKR Clashes in IPL History", "videoId": "dQw4w9WgXcQ", "thumbnail": ""},
    {"title": "Virat Kohli's Best Innings vs KKR", "videoId": "dQw4w9WgXcQ", "thumbnail": ""},
]


def fetch_youtube_highlights(query: str = "IPL 2026 highlights", max_results: int = 3) -> list:
    if not YOUTUBE_API_KEY:
        return FALLBACK_VIDEOS
    try:
        resp = httpx.get(
            "https://www.googleapis.com/youtube/v3/search",
            params={
                "part": "snippet", "q": query, "type": "video",
                "maxResults": max_results, "key": YOUTUBE_API_KEY, "order": "relevance",
            },
            timeout=5.0,
        )
        resp.raise_for_status()
        results = []
        for item in resp.json().get("items", []):
            results.append({
                "title": item["snippet"]["title"],
                "videoId": item["id"]["videoId"],
                "thumbnail": item["snippet"]["thumbnails"]["medium"]["url"],
            })
        return results if results else FALLBACK_VIDEOS
    except Exception as e:
        print(f"[YouTube] Error: {e}")
        return FALLBACK_VIDEOS


# ── Diversion Protocol ───────────────────────────────────────────────
def mock_food_delivery_api(location: str = "Bengaluru") -> str:
    time.sleep(0.5)
    foods = [
        ("Filter Coffee & Masala Dosa", "MTR, Lalbagh Road"),
        ("Chicken Biryani", "Meghana Foods, Koramangala"),
        ("Gobi Manchurian & Fried Rice", "Empire Restaurant, Church Street"),
    ]
    item, place = random.choice(foods)
    return f"✅ Ordering {item} from {place}, {location}. ETA: 25 mins. 🍽️"


def mock_netflix_api() -> str:
    time.sleep(0.3)
    shows = [("The Office", "Comedy"), ("Brooklyn Nine-Nine", "Comedy"), ("Drive to Survive", "Docuseries")]
    title, genre = random.choice(shows)
    return f"📺 Starting '{title}' ({genre}) to lighten the mood!"
