import os
import json
import random
import requests
import xml.etree.ElementTree as ET
from utils import CRICKET_API_KEY, GIPHY_API_KEY

# Fallback Memes if Giphy API is not configured or fails
FALLBACK_MEMES = {
    "happy": "https://media.giphy.com/media/l0HlHFRbmaZtBRhXG/giphy.gif",
    "sad": "https://media.giphy.com/media/BEob5qwFkSJ7G/giphy.gif",
    "tense": "https://media.giphy.com/media/l4FATJpd4LWgeruTK/giphy.gif",
    "angry": "https://media.giphy.com/media/11tTNkNy1SdXGg/giphy.gif"
}

def get_live_commentary(ball_index=None):
    """
    The Scout Agent: Fetches live cricket commentary.
    Attempts to fetch from a free public RSS feed if no API key is provided.
    Falls back to Simulation Mode if the internet is down.
    """
    if CRICKET_API_KEY:
        try:
            # Example RapidAPI integration (Placeholder endpoint)
            # You would replace this with actual RapidAPI endpoint details
            url = "https://cricbuzz-cricket.p.rapidapi.com/matches/v1/recent"
            headers = {
                "X-RapidAPI-Key": CRICKET_API_KEY,
                "X-RapidAPI-Host": "cricbuzz-cricket.p.rapidapi.com"
            }
            # Since we don't have a guaranteed live match, we simulate an error/rate limit
            raise Exception("API Rate Limit or No Live Match")
            
        except Exception as e:
            print(f"Cricket API Error: {e}. Switching to Public RSS.")
            return _fetch_public_rss(ball_index)
    else:
        return _fetch_public_rss(ball_index)

def _fetch_public_rss(index=None):
    """Fetches live score data from a free public RSS feed (ESPNcricinfo)."""
    try:
        url = 'http://static.cricinfo.com/rss/livescores.xml'
        headers = {'User-Agent': 'Mozilla/5.0'}
        response = requests.get(url, headers=headers, timeout=5)
        response.raise_for_status()
        
        tree = ET.fromstring(response.content)
        items = tree.findall('.//item')
        
        if not items:
            return _get_simulation_commentary(index)
            
        # Extract titles (scores)
        scores = [item.find('title').text for item in items if item.find('title') is not None]
        
        # Pick one to focus on, e.g., using the index to rotate or just pick the first active one
        if index is not None:
             selected_score = scores[index % len(scores)]
        else:
             selected_score = random.choice(scores)
             
        # Combine with a simulation flavor text to give it "commentary" feel
        flavor_text = _get_simulation_commentary(index)
        
        return f"🚨 LIVE UPDATE: {selected_score} | 🎙️ {flavor_text}"
        
    except Exception as e:
        print(f"RSS Fetch Error: {e}. Switching to offline Simulation Mode.")
        return _get_simulation_commentary(index)

def _get_simulation_commentary(index=None):
    """Fallback method for demo purposes."""
    try:
        with open('fallback_data.json', 'r') as f:
            data = json.load(f)
            if index is not None:
                 return data[index % len(data)]
            return random.choice(data)
    except FileNotFoundError:
        return "Simulation data missing. What a brilliant piece of fielding!"

def get_meme_url(search_query: str, fallback_mood: str = "happy"):
    """
    The Executor: Fetches a live GIF from Giphy based on the AI's search query.
    Falls back to hardcoded dictionary if API fails or is not configured.
    """
    if GIPHY_API_KEY:
        try:
            url = "https://api.giphy.com/v1/gifs/search"
            params = {
                "api_key": GIPHY_API_KEY,
                "q": search_query,
                "limit": 1,
                "rating": "g"
            }
            response = requests.get(url, params=params, timeout=2)
            response.raise_for_status()
            data = response.json()
            if data['data']:
                return data['data'][0]['images']['downsized']['url']
            else:
                raise Exception("No GIFs found for query.")
        except Exception as e:
            print(f"Giphy API Error: {e}. Switching to fallback dictionary.")
            return FALLBACK_MEMES.get(fallback_mood.lower(), FALLBACK_MEMES["happy"])
    else:
        return FALLBACK_MEMES.get(fallback_mood.lower(), FALLBACK_MEMES["happy"])
