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
    """Fetches live cricket data using BeautifulSoup, falls back to Dynamic Simulator."""

    def __init__(self):
        self._history = {}
        self._sim_state = {
            "runs": 150, "wickets": 4, "overs": "15.0", "run_rate": 10.0,
            "target": 195, "batting": "RCB", "bowling": "KKR", "required_rate": 9.0
        }
        self._sim_commentary = "15.0: The players are walking out to the middle. This is going to be an epic finish!"

    async def _scrape_live_match(self) -> dict | None:
        try:
            # We scrape a generic cricket live scores page or RSS
            import xml.etree.ElementTree as ET
            async with httpx.AsyncClient(timeout=5.0) as client:
                resp = await client.get(
                    "http://static.cricinfo.com/rss/livescores.xml",
                    headers={"User-Agent": "Mozilla/5.0"},
                )
                resp.raise_for_status()
                tree = ET.fromstring(resp.content)
                items = tree.findall(".//item")
                if items:
                    title = items[0].find("title").text if items[0].find("title") is not None else "LIVE: Match in progress"
                    return {"commentary": f"🚨 {title}", "score": {
                        "runs": 0, "wickets": 0, "overs": "0.0", "run_rate": 0,
                        "target": "—", "batting": "LIVE", "bowling": "LIVE", "required_rate": 0
                    }}
        except Exception as e:
            print(f"[Scout] Scrape failed: {e}")
        return None

    async def _ensure_ball(self, index: int, demo_mode: bool):
        if index in self._history:
            return
            
        if not demo_mode:
            live_data = await self._scrape_live_match()
            if live_data:
                self._history[index] = live_data
                return

        # Fallback to Dynamic Simulator
        from agents import simulate_next_ball
        result = simulate_next_ball(self._sim_state)
        self._sim_state = {
            "runs": result.runs, "wickets": result.wickets, "overs": result.overs,
            "run_rate": result.run_rate, "target": result.target,
            "batting": result.batting, "bowling": result.bowling,
            "required_rate": result.required_rate
        }
        self._sim_commentary = result.commentary
        self._history[index] = {
            "score": self._sim_state,
            "commentary": self._sim_commentary
        }

    async def get_commentary(self, ball_index: int, demo_mode: bool = True) -> str:
        await self._ensure_ball(ball_index, demo_mode)
        return self._history[ball_index]["commentary"]

    def get_scorecard(self, ball_index: int, demo_mode: bool = True) -> dict:
        # get_score is called synchronously, but it's safe if get_commentary was called first.
        # In main.py, it's called asynchronously but ScoutAgent's get_scorecard is sync.
        # However, we can't reliably await inside get_scorecard if it's sync.
        # Actually, in main.py `get_score` does not await `get_scorecard`.
        # Let's just return the last known state if index not in history.
        if ball_index in self._history:
            return self._history[ball_index]["score"]
        return self._sim_state


def get_historical_context(event_type: str) -> str:
    facts = HISTORICAL_DB.get(event_type, HISTORICAL_DB.get("FOUR", []))
    return random.choice(facts) if facts else "A key moment in the match."


async def fetch_meme(mood: str, search_query: str = "") -> str:
    query = search_query if search_query else f"cricket {mood}"
    try:
        async with httpx.AsyncClient(timeout=3.0) as client:
            resp = await client.get(
                "https://g.tenor.com/v1/search",
                params={"q": query, "key": "LIVDSRZULELA", "limit": 1}
            )
            data = resp.json()
            if data.get("results"):
                return data["results"][0]["media"][0]["gif"]["url"]
    except Exception as e:
        print(f"[Tenor] Error: {e}")
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
