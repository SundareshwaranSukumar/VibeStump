import time
import json
import random
import requests
import xml.etree.ElementTree as ET
from utils import CRICKET_API_KEY

# High-Quality Giphy URLs for fast loading
MEME_DICTIONARY = {
    "happy": "https://media.giphy.com/media/26n6R5HOYPbekK0YE/giphy.gif",
    "sad": "https://media.giphy.com/media/d2lcHJTG5Tscg/giphy.gif",
    "tense": "https://media.giphy.com/media/l4FATJpd4LWgeruTK/giphy.gif",
    "angry": "https://media.giphy.com/media/11tTNkNy1SdXGg/giphy.gif",
    "hype": "https://media.giphy.com/media/b1o4elHO8oqD1Fwx48/giphy.gif"
}

# High-Tension Demo Sequence tuned to trigger Diversion Protocol (2 consecutive negative vibes)
DEMO_COMMENTARY = [
    "19.1: A crucial dot ball to start the final over. The batsman swung hard but missed.",
    "19.2: Smashed! That's a massive SIX over long-on! The crowd erupts!",
    "19.3: WICKET! Caught at deep mid-wicket! A catastrophic blow for the batting side.",
    "19.4: WICKET! Clean bowled! Another one bites the dust. It's an absolute collapse! The fans are devastated.",
    "19.5: The new batsman arrives. He drives it to cover for a single. 4 runs needed off the last ball!",
    "19.6: He steps out and launches it... it's high in the air... caught on the boundary! The bowling team wins an absolute thriller!"
]

def fetch_live_score(ball_index, demo_mode=False):
    """Simulates fetching the live scorecard table."""
    # Base score
    runs, wickets, overs = 190, 5, 19.0
    
    if demo_mode:
        # Simulate progression based on demo commentary
        idx = ball_index % len(DEMO_COMMENTARY)
        if idx >= 1: runs += 0   # 19.1
        if idx >= 2: runs += 6   # 19.2
        if idx >= 3: wickets += 1 # 19.3 (Wicket)
        if idx >= 4: wickets += 1 # 19.4 (Wicket)
        if idx >= 5: runs += 1   # 19.5
        if idx == 5: wickets += 1 # 19.6 (end of sequence)
        overs = 19.0 + ((idx + 1) * 0.1)
    else:
        # Simple random progression for non-demo simulation
        runs += (ball_index * 2)
        wickets += (ball_index // 6)
        overs += (ball_index * 0.1)
        if overs - int(overs) > 0.5:
             overs = int(overs) + 1.0

    rr = round(runs / (overs if overs > 0 else 1), 2)
    return {"runs": runs, "wickets": wickets, "overs": round(overs, 1), "run_rate": rr}

def get_live_commentary(ball_index, demo_mode=False):
    """The Scout Agent: Fetches live cricket commentary."""
    if demo_mode:
        return DEMO_COMMENTARY[ball_index % len(DEMO_COMMENTARY)]
        
    if CRICKET_API_KEY:
        # (Placeholder for real premium API logic)
        return _fetch_public_rss()
    else:
        return _fetch_public_rss()

def _fetch_public_rss():
    """Fetches live score data from a free public RSS feed (ESPNcricinfo)."""
    try:
        url = 'http://static.cricinfo.com/rss/livescores.xml'
        headers = {'User-Agent': 'Mozilla/5.0'}
        response = requests.get(url, headers=headers, timeout=5)
        response.raise_for_status()
        
        tree = ET.fromstring(response.content)
        items = tree.findall('.//item')
        if not items: raise Exception("No items in RSS")
            
        scores = [item.find('title').text for item in items if item.find('title') is not None]
        selected_score = random.choice(scores)
        
        return f"🚨 LIVE UPDATE: {selected_score}"
    except Exception:
        return random.choice(DEMO_COMMENTARY)

def get_historical_context(event_type):
    """Simulates pulling past statistics or historical context from a database."""
    db = {
        "WICKET": "Did you know? The most wickets taken in a single IPL season is 32 by Harshal Patel (RCB) and Dwayne Bravo (CSK).",
        "SIX": "Historical Fact: Chris Gayle holds the record for the most sixes in IPL history with an astonishing 357 maximums!",
        "DEFAULT": "IPL stats show that batting second in night games gives a 54% win probability due to dew factor."
    }
    return db.get(event_type, db["DEFAULT"])

def fetch_meme(mood):
    """The Executor: Uses a dictionary of high-quality Giphy URLs."""
    return MEME_DICTIONARY.get(mood.lower(), MEME_DICTIONARY["happy"])

# --- Mock APIs for Diversion Protocol ---

def mock_food_delivery_api(location="Bengaluru"):
    """Simulates a call to a food delivery service."""
    time.sleep(1.5) # Simulate network latency
    foods = [
        "Filter Coffee and Masala Dosa from MTR",
        "Biryani from Meghana Foods",
        "Gobi Manchurian from a local joint"
    ]
    choice = random.choice(foods)
    return f"✅ Success! Ordering hot {choice} to {location}. ETA: 25 mins. The cricket can wait."

def mock_netflix_api():
    """Simulates a call to a streaming service API."""
    time.sleep(1.0) # Simulate network latency
    shows = ["The Office", "Brooklyn Nine-Nine", "Parks and Recreation"]
    choice = random.choice(shows)
    return f"📺 Success! Starting '{choice}' on your screen to lighten the mood. Time for a break."
