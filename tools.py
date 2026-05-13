"""
tools.py — External data ingestion and mock API tooling for VibeStump.

Contains:
  • ScoutAgent       – live commentary via ESPNcricinfo RSS + robust fallback
  • SimulatedLiveFeed – realistic Match-57 (RCB vs KKR, May 13 2026) simulation
  • YouTube highlight search
  • Meme executor
  • Mock Diversion Protocol APIs (Swiggy, Netflix)
"""

import os
import time
import json
import random
import requests
import xml.etree.ElementTree as ET

# ──────────────────────────────────────────────────────────────────────
#  CONFIG
# ──────────────────────────────────────────────────────────────────────
CRICKET_API_KEY = os.getenv("CRICKET_API_KEY", "")
YOUTUBE_API_KEY = os.getenv("YOUTUBE_API_KEY", "")

# ──────────────────────────────────────────────────────────────────────
#  MEME DICTIONARY (high-quality, fast-loading Giphy URLs)
# ──────────────────────────────────────────────────────────────────────
MEME_DICTIONARY = {
    "happy": "https://media.giphy.com/media/26n6R5HOYPbekK0YE/giphy.gif",
    "sad":   "https://media.giphy.com/media/d2lcHJTG5Tscg/giphy.gif",
    "tense": "https://media.giphy.com/media/l4FATJpd4LWgeruTK/giphy.gif",
    "angry": "https://media.giphy.com/media/11tTNkNy1SdXGg/giphy.gif",
    "hype":  "https://media.giphy.com/media/b1o4elHO8oqD1Fwx48/giphy.gif",
}


# ══════════════════════════════════════════════════════════════════════
#  SIMULATED LIVE FEED  –  Match 57: RCB vs KKR  |  May 13 2026
# ══════════════════════════════════════════════════════════════════════
class SimulatedLiveFeed:
    """
    Streams a full, realistic final-over sequence for demo purposes.
    Designed to trigger both the Historian (SIX / WICKET events) and
    the Diversion Protocol (consecutive negative vibes).
    """

    BALLS = [
        {
            "commentary": "18.4: Kohli pushes to mid-off for a single. RCB 178/4 chasing 195. Asking rate climbs to 11.33.",
            "runs": 178, "wickets": 4, "overs": 18.4, "event": None,
        },
        {
            "commentary": "18.5: Short ball outside off, DK slaps it to deep point for TWO. Excellent running between the wickets.",
            "runs": 180, "wickets": 4, "overs": 18.5, "event": None,
        },
        {
            "commentary": "18.6: Full toss on leg stump – DK muscles it over cow corner for SIX! 🔥 RCB fans are on their feet!",
            "runs": 186, "wickets": 4, "overs": 19.0, "event": "SIX",
        },
        {
            "commentary": "19.1: Dot ball! Narine fires a carrom ball, DK misses completely. Pressure mounting. 9 needed off 5.",
            "runs": 186, "wickets": 4, "overs": 19.1, "event": None,
        },
        {
            "commentary": "19.2: WICKET! DK goes for a wild slog and is clean bowled! The crowd goes deathly silent. Collapse begins.",
            "runs": 186, "wickets": 5, "overs": 19.2, "event": "WICKET",
        },
        {
            "commentary": "19.3: WICKET! Siraj is run out going for an impossible second run! A total disaster for RCB. Fans are devastated.",
            "runs": 186, "wickets": 6, "overs": 19.3, "event": "WICKET",
        },
        {
            "commentary": "19.4: New batsman takes guard. A wide ball gives RCB 1 free run. 8 needed off 3. Can they pull off a miracle?",
            "runs": 187, "wickets": 6, "overs": 19.4, "event": None,
        },
        {
            "commentary": "19.5: Short outside off, swung hard – SIX! Over deep square leg! The stadium erupts! 2 off 1 ball!",
            "runs": 193, "wickets": 6, "overs": 19.5, "event": "SIX",
        },
        {
            "commentary": "19.6: Full and outside off... edged... FOUR through third man! RCB WIN BY 2 WICKETS! ABSOLUTE SCENES! 🏆🎉",
            "runs": 197, "wickets": 6, "overs": 20.0, "event": "FOUR",
        },
    ]

    @classmethod
    def get_ball(cls, index: int) -> dict:
        """Return ball data at the given index (wraps around)."""
        return cls.BALLS[index % len(cls.BALLS)]

    @classmethod
    def get_commentary(cls, index: int) -> str:
        return cls.get_ball(index)["commentary"]

    @classmethod
    def get_scorecard(cls, index: int) -> dict:
        b = cls.get_ball(index)
        rr = round(b["runs"] / (b["overs"] if b["overs"] > 0 else 1), 2)
        return {
            "runs": b["runs"],
            "wickets": b["wickets"],
            "overs": b["overs"],
            "run_rate": rr,
            "target": 195,
            "batting": "RCB",
            "bowling": "KKR",
        }


# ══════════════════════════════════════════════════════════════════════
#  SCOUT AGENT  –  Live data ingestion
# ══════════════════════════════════════════════════════════════════════
def get_live_commentary(ball_index: int, demo_mode: bool = False) -> str:
    """
    The Scout Agent: returns live commentary text.
    Priority: 1) demo_mode  2) public RSS  3) SimulatedLiveFeed fallback
    """
    if demo_mode:
        return SimulatedLiveFeed.get_commentary(ball_index)
    return _fetch_public_rss(ball_index)


def fetch_live_score(ball_index: int, demo_mode: bool = False) -> dict:
    """Returns a scorecard dictionary {runs, wickets, overs, run_rate, ...}."""
    if demo_mode:
        return SimulatedLiveFeed.get_scorecard(ball_index)

    # In live mode build a progressive scorecard from RSS context
    base = {"runs": 0, "wickets": 0, "overs": 0.0, "run_rate": 0.0,
            "target": "–", "batting": "LIVE", "bowling": "LIVE"}
    try:
        url = "http://static.cricinfo.com/rss/livescores.xml"
        resp = requests.get(url, headers={"User-Agent": "Mozilla/5.0"}, timeout=5)
        resp.raise_for_status()
        tree = ET.fromstring(resp.content)
        items = tree.findall(".//item")
        if items:
            title = items[ball_index % len(items)].find("title").text
            # Attempt to parse "Team A 123/4  v Team B 200/8"
            parts = title.split()
            for i, p in enumerate(parts):
                if "/" in p and p.replace("/", "").isdigit():
                    r, w = p.split("/")
                    base["runs"] = int(r)
                    base["wickets"] = int(w)
                    base["batting"] = " ".join(parts[:i])
                    break
            base["run_rate"] = round(base["runs"] / max(ball_index + 1, 1), 2)
        return base
    except Exception:
        return SimulatedLiveFeed.get_scorecard(ball_index)


def _fetch_public_rss(index: int = 0) -> str:
    """Fetches a live score line from the ESPNcricinfo public RSS feed."""
    try:
        url = "http://static.cricinfo.com/rss/livescores.xml"
        resp = requests.get(url, headers={"User-Agent": "Mozilla/5.0"}, timeout=5)
        if resp.status_code in (429, 500, 502, 503):
            raise ConnectionError(f"HTTP {resp.status_code} — switching to simulation")
        resp.raise_for_status()
        tree = ET.fromstring(resp.content)
        items = tree.findall(".//item")
        if not items:
            raise ValueError("Empty RSS feed")
        titles = [i.find("title").text for i in items if i.find("title") is not None]
        selected = titles[index % len(titles)]
        return f"🚨 LIVE: {selected}"
    except Exception as e:
        # Hybrid Fallback: never crash — stream the simulation instead
        print(f"[ScoutAgent] RSS error ({e}). Falling back to SimulatedLiveFeed.")
        return SimulatedLiveFeed.get_commentary(index)


# ══════════════════════════════════════════════════════════════════════
#  HISTORIAN TOOL  –  Database-style historical context
# ══════════════════════════════════════════════════════════════════════
HISTORICAL_DB = {
    "WICKET": [
        "Lasith Malinga holds the IPL record for most wickets (170). His toe-crushing yorkers were inimitable.",
        "The biggest collapse in IPL history saw RCB bowled out for just 49 against KKR in 2017.",
        "In IPL 2019, Sam Curran took a hat-trick and turned the match on its head for KXIP.",
    ],
    "SIX": [
        "Chris Gayle's 175* off 66 balls for RCB in 2013 remains the highest individual IPL score — 17 sixes.",
        "AB de Villiers once hit 133 off just 59 balls, with sixes landing on the rooftops in Bengaluru.",
        "MS Dhoni's iconic 'helicopter shot' sixes have defined CSK's brand of power-hitting for over a decade.",
    ],
    "FOUR": [
        "Virat Kohli holds the record for most runs in a single IPL season — 973 in 2016.",
        "Sachin Tendulkar's elegant cover drives made him one of MI's most-loved match-winners in early IPL seasons.",
    ],
}


def get_historical_context(event_type: str) -> str:
    """Returns a random historical fact matching the event type."""
    facts = HISTORICAL_DB.get(event_type, HISTORICAL_DB.get("FOUR", []))
    if not facts:
        return "IPL stats show that batting second in night games gives a 54% win probability due to the dew factor."
    return random.choice(facts)


# ══════════════════════════════════════════════════════════════════════
#  MEME EXECUTOR
# ══════════════════════════════════════════════════════════════════════
def fetch_meme(mood: str) -> str:
    """Returns a high-quality Giphy URL for the given mood."""
    return MEME_DICTIONARY.get(mood.lower(), MEME_DICTIONARY["happy"])


# ══════════════════════════════════════════════════════════════════════
#  YOUTUBE VIDEO HUB
# ══════════════════════════════════════════════════════════════════════
FALLBACK_VIDEOS = [
    {"title": "RCB vs KKR — IPL 2024 Highlights", "video_id": "dQw4w9WgXcQ"},
    {"title": "Top 10 Last-Over Thrillers in IPL", "video_id": "dQw4w9WgXcQ"},
    {"title": "Virat Kohli Century Compilation", "video_id": "dQw4w9WgXcQ"},
]


def fetch_youtube_highlights(query: str = "IPL highlights 2026", max_results: int = 3) -> list:
    """
    Searches YouTube Data API v3 for match highlights.
    Returns list of dicts: [{title, video_id}, ...]
    Falls back to hardcoded results if key is missing or API errors.
    """
    if not YOUTUBE_API_KEY:
        return FALLBACK_VIDEOS

    try:
        url = "https://www.googleapis.com/youtube/v3/search"
        params = {
            "part": "snippet",
            "q": query,
            "type": "video",
            "maxResults": max_results,
            "key": YOUTUBE_API_KEY,
            "order": "relevance",
        }
        resp = requests.get(url, params=params, timeout=5)
        resp.raise_for_status()
        data = resp.json()
        results = []
        for item in data.get("items", []):
            results.append({
                "title": item["snippet"]["title"],
                "video_id": item["id"]["videoId"],
            })
        return results if results else FALLBACK_VIDEOS
    except Exception as e:
        print(f"[YouTube] API error ({e}). Using fallback videos.")
        return FALLBACK_VIDEOS


# ══════════════════════════════════════════════════════════════════════
#  DIVERSION PROTOCOL  –  Mock external APIs
# ══════════════════════════════════════════════════════════════════════
def mock_food_delivery_api(location: str = "Bengaluru") -> str:
    """Simulates a Swiggy/Zomato API call suggesting comfort food."""
    time.sleep(1)
    foods = [
        ("Filter Coffee & Masala Dosa", "MTR, Lalbagh Road"),
        ("Chicken Biryani", "Meghana Foods, Koramangala"),
        ("Gobi Manchurian & Fried Rice", "Empire Restaurant, Church Street"),
        ("Butter Naan & Paneer Tikka", "Truffles, Indiranagar"),
    ]
    item, place = random.choice(foods)
    return f"✅ Ordering **{item}** from **{place}**, {location}. ETA: 25 mins. 🍽️ The cricket can wait."


def mock_netflix_api() -> str:
    """Simulates a streaming-service API call."""
    time.sleep(0.8)
    shows = [
        ("The Office", "Comedy"),
        ("Brooklyn Nine-Nine", "Comedy"),
        ("Hasan Minhaj: Homecoming King", "Stand-Up"),
        ("Drive to Survive", "Docuseries"),
    ]
    title, genre = random.choice(shows)
    return f"📺 Starting **'{title}'** ({genre}) to lighten the mood. Time for a break!"
