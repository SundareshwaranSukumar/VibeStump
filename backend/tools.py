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
from database import store_match_event

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

    async def get_all_matches(self) -> list:
        try:
            import xml.etree.ElementTree as ET
            async with httpx.AsyncClient(timeout=5.0) as client:
                resp = await client.get(
                    "http://static.cricinfo.com/rss/livescores.xml",
                    headers={"User-Agent": "Mozilla/5.0"},
                )
                resp.raise_for_status()
                tree = ET.fromstring(resp.content)
                matches = []
                for idx, item in enumerate(tree.findall(".//item")):
                    title = item.find("title").text if item.find("title") is not None else ""
                    guid = item.find("guid").text if item.find("guid") is not None else str(idx)
                    # Simple heuristic: if there's a * or 'v', it's a match
                    if title:
                        matches.append({
                            "id": guid,
                            "title": title,
                            "status": "LIVE" if "*" in title or "require" in title.lower() else "COMPLETED"
                        })
                return matches
        except Exception as e:
            print(f"[Scout] Fetch matches failed: {e}")
            return []

    async def _scrape_live_match(self, match_id: str = None) -> dict | None:
        try:
            import xml.etree.ElementTree as ET
            import re
            async with httpx.AsyncClient(timeout=5.0) as client:
                resp = await client.get(
                    "http://static.cricinfo.com/rss/livescores.xml",
                    headers={"User-Agent": "Mozilla/5.0"},
                )
                resp.raise_for_status()
                tree = ET.fromstring(resp.content)
                items = tree.findall(".//item")
                
                target_item = None
                if match_id:
                    for item in items:
                        guid = item.find("guid")
                        if guid is not None and guid.text == match_id:
                            target_item = item
                            break
                if not target_item and items:
                    target_item = items[0]

                if target_item:
                    title = target_item.find("title").text if target_item.find("title") is not None else "LIVE: Match in progress"
                    
                    # Title format: "Royal Challengers Bengaluru 180/4 * v Chennai Super Kings"
                    parts = title.split(' v ')
                    batting = parts[0].strip()
                    bowling = parts[1].strip() if len(parts) > 1 else "Unknown"
                    
                    runs, wickets, overs = 0, 0, "0.0"
                    
                    # Look for scores in batting team string
                    match = re.search(r'(\d+)/(\d+)', batting)
                    if match:
                        runs = int(match.group(1))
                        wickets = int(match.group(2))
                        # Strip score to get just team name
                        batting = re.sub(r'\d+/\d+.*$', '', batting).strip()
                    else:
                        # Sometimes score is in the bowling string if innings just changed
                        match2 = re.search(r'(\d+)/(\d+)', title)
                        if match2:
                            runs = int(match2.group(1))
                            wickets = int(match2.group(2))
                            
                    # Clean up bowling string
                    bowling = re.sub(r'\d+/\d+.*$', '', bowling).strip()
                    
                    # Try extracting target if present
                    target = "—"
                    target_match = re.search(r'target (\d+)', title.lower())
                    if target_match:
                        target = target_match.group(1)

                    return {"commentary": f"🚨 {title}", "score": {
                        "runs": runs, "wickets": wickets, "overs": overs, "run_rate": 0,
                        "target": target, "batting": batting, "bowling": bowling, "required_rate": 0
                    }}
        except Exception as e:
            print(f"[Scout] Scrape failed: {e}")
        return None

    async def _ensure_ball(self, index: int, demo_mode: bool, match_id: str = None):
        cache_key = f"{index}_{match_id}" if match_id else index
        if cache_key in self._history:
            return
            
        if not demo_mode:
            live_data = await self._scrape_live_match(match_id)
            if live_data:
                self._history[cache_key] = live_data
                # Store in DB
                store_match_event(index, live_data["score"], live_data["commentary"], is_live=True)
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
        self._history[cache_key] = {
            "score": self._sim_state,
            "commentary": self._sim_commentary
        }
        # Store in DB
        store_match_event(index, self._sim_state, self._sim_commentary, is_live=False)

    async def get_commentary(self, ball_index: int, demo_mode: bool = True, match_id: str = None) -> str:
        await self._ensure_ball(ball_index, demo_mode, match_id)
        cache_key = f"{ball_index}_{match_id}" if match_id else ball_index
        return self._history[cache_key]["commentary"]

    def get_scorecard(self, ball_index: int, demo_mode: bool = True, match_id: str = None) -> dict:
        cache_key = f"{ball_index}_{match_id}" if match_id else ball_index
        if cache_key in self._history:
            return self._history[cache_key]["score"]
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
