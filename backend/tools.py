"""
tools.py — Utility functions and IPL metadata for VibeStump.
"""

import os
import re
import xml.etree.ElementTree as ET
from typing import Optional

import httpx

YOUTUBE_API_KEY = os.getenv("YOUTUBE_API_KEY", "")

# ── IPL Team Metadata (Configuration) ───────────────────────────────

IPL_TEAMS = {
    "RCB": {
        "name": "Royal Challengers Bengaluru",
        "short": "RCB",
        "coach": "Andy Flower",
        "home": "M. Chinnaswamy Stadium, Bengaluru",
        "logo": "https://upload.wikimedia.org/wikipedia/en/thumb/1/1c/Royal_Challengers_Bengaluru_logo.png/120px-Royal_Challengers_Bengaluru_logo.png",
        "primary": "#E21836",
        "glow": "226, 24, 54",
    },
    "CSK": {
        "name": "Chennai Super Kings",
        "short": "CSK",
        "coach": "Stephen Fleming",
        "home": "MA Chidambaram Stadium, Chennai",
        "logo": "https://upload.wikimedia.org/wikipedia/en/thumb/2/2b/Chennai_Super_Kings_Logo.svg/120px-Chennai_Super_Kings_Logo.svg.png",
        "primary": "#FACC15",
        "glow": "250, 204, 21",
    },
    "MI": {
        "name": "Mumbai Indians",
        "short": "MI",
        "coach": "Mark Boucher",
        "home": "Wankhede Stadium, Mumbai",
        "logo": "https://upload.wikimedia.org/wikipedia/en/thumb/c/cd/Mumbai_Indians_Logo.svg/120px-Mumbai_Indians_Logo.svg.png",
        "primary": "#004BA0",
        "glow": "0, 75, 160",
    },
    "KKR": {
        "name": "Kolkata Knight Riders",
        "short": "KKR",
        "coach": "Chandrakant Pandit",
        "home": "Eden Gardens, Kolkata",
        "logo": "https://upload.wikimedia.org/wikipedia/en/thumb/4/4c/Kolkata_Knight_Riders_Logo.svg/120px-Kolkata_Knight_Riders_Logo.svg.png",
        "primary": "#3A225D",
        "glow": "58, 34, 93",
    },
    "SRH": {
        "name": "Sunrisers Hyderabad",
        "short": "SRH",
        "coach": "Daniel Vettori",
        "home": "Rajiv Gandhi Intl Stadium, Hyderabad",
        "logo": "https://upload.wikimedia.org/wikipedia/en/thumb/8/81/Sunrisers_Hyderabad.svg/120px-Sunrisers_Hyderabad.svg.png",
        "primary": "#FF6600",
        "glow": "255, 102, 0",
    },
    "GT": {
        "name": "Gujarat Titans",
        "short": "GT",
        "coach": "Ashish Nehra",
        "home": "Narendra Modi Stadium, Ahmedabad",
        "logo": "https://upload.wikimedia.org/wikipedia/en/thumb/0/09/Gujarat_Titans_Logo.svg/120px-Gujarat_Titans_Logo.svg.png",
        "primary": "#39B5E0",
        "glow": "57, 181, 224",
    },
    "DC": {
        "name": "Delhi Capitals",
        "short": "DC",
        "coach": "Ricky Ponting",
        "home": "Arun Jaitley Stadium, Delhi",
        "logo": "https://upload.wikimedia.org/wikipedia/en/thumb/f/f5/Delhi_Capitals_Logo.svg/120px-Delhi_Capitals_Logo.svg.png",
        "primary": "#004C93",
        "glow": "0, 76, 147",
    },
    "LSG": {
        "name": "Lucknow Super Giants",
        "short": "LSG",
        "coach": "Justin Langer",
        "home": "Ekana Cricket Stadium, Lucknow",
        "logo": "https://upload.wikimedia.org/wikipedia/en/thumb/a/a9/Lucknow_Super_Giants_IPL_Logo.svg/120px-Lucknow_Super_Giants_IPL_Logo.svg.png",
        "primary": "#A5F3FC",
        "glow": "165, 243, 252",
    },
    "PBKS": {
        "name": "Punjab Kings",
        "short": "PBKS",
        "coach": "Trevor Bayliss",
        "home": "IS Bindra Stadium, Mohali",
        "logo": "https://upload.wikimedia.org/wikipedia/en/thumb/d/d4/Punjab_Kings_Logo.svg/120px-Punjab_Kings_Logo.svg.png",
        "primary": "#DD1F2D",
        "glow": "221, 31, 45",
    },
    "RR": {
        "name": "Rajasthan Royals",
        "short": "RR",
        "coach": "Kumar Sangakkara",
        "home": "Sawai Mansingh Stadium, Jaipur",
        "logo": "https://upload.wikimedia.org/wikipedia/en/thumb/6/60/Rajasthan_Royals_Logo.svg/120px-Rajasthan_Royals_Logo.svg.png",
        "primary": "#E73895",
        "glow": "231, 56, 149",
    },
}

FULL_NAME_TO_CODE = {
    "chennai super kings": "CSK",
    "royal challengers bengaluru": "RCB",
    "royal challengers bangalore": "RCB",
    "mumbai indians": "MI",
    "kolkata knight riders": "KKR",
    "sunrisers hyderabad": "SRH",
    "delhi capitals": "DC",
    "rajasthan royals": "RR",
    "punjab kings": "PBKS",
    "gujarat titans": "GT",
    "lucknow super giants": "LSG",
}


def resolve_team_code(name: str) -> str:
    """Resolve a team name (full or short) to its IPL code."""
    upper = name.strip().upper()
    if upper in IPL_TEAMS:
        return upper
    lower = name.strip().lower()
    for full, code in FULL_NAME_TO_CODE.items():
        if full in lower or lower in full:
            return code
    for code in IPL_TEAMS:
        if code.lower() in lower:
            return code
    return ""


def get_team_info(team_code: str) -> dict:
    """Get team metadata."""
    code = team_code.upper()
    return IPL_TEAMS.get(code, {"name": team_code, "short": team_code, "coach": "N/A", "home": "N/A", "logo": "", "primary": "#666", "glow": "100,100,100"})


# ── IPL 2026 Squad Data ─────────────────────────────────────────────

def _p(name: str, role: str, captain: bool = False, keeper: bool = False) -> dict:
    return {"name": name, "role": role, "captain": captain, "wicketkeeper": keeper}

SQUAD_DATA: dict[str, dict] = {
    "RCB": {
        "playing_xi": [
            _p("Faf du Plessis", "BAT", captain=True), _p("Virat Kohli", "BAT"),
            _p("Rajat Patidar", "BAT"), _p("Glenn Maxwell", "ALL"),
            _p("Cameron Green", "ALL"), _p("Dinesh Karthik", "WK", keeper=True),
            _p("Shahbaz Ahmed", "ALL"), _p("Karn Sharma", "BOWL"),
            _p("Mohammed Siraj", "BOWL"), _p("Josh Hazlewood", "BOWL"),
            _p("Yash Dayal", "BOWL"),
        ],
        "substitutes": [
            _p("Anuj Rawat", "WK"), _p("Will Jacks", "ALL"),
            _p("Mahipal Lomror", "ALL"), _p("Akash Deep", "BOWL"),
        ],
    },
    "CSK": {
        "playing_xi": [
            _p("Ruturaj Gaikwad", "BAT", captain=True), _p("Devon Conway", "BAT"),
            _p("Ajinkya Rahane", "BAT"), _p("MS Dhoni", "WK", keeper=True),
            _p("Moeen Ali", "ALL"), _p("Shivam Dube", "ALL"),
            _p("Ravindra Jadeja", "ALL"), _p("Piyush Chawla", "BOWL"),
            _p("Mustafizur Rahman", "BOWL"), _p("Deepak Chahar", "BOWL"),
            _p("Matheesha Pathirana", "BOWL"),
        ],
        "substitutes": [
            _p("Subhranshu Senapati", "BAT"), _p("Rachin Ravindra", "ALL"),
            _p("Noor Ahmad", "BOWL"), _p("Tushar Deshpande", "BOWL"),
        ],
    },
    "MI": {
        "playing_xi": [
            _p("Rohit Sharma", "BAT"), _p("Ishan Kishan", "WK", keeper=True),
            _p("Suryakumar Yadav", "BAT"), _p("Hardik Pandya", "ALL", captain=True),
            _p("Tim David", "BAT"), _p("Nehal Wadhera", "BAT"),
            _p("Tilak Varma", "ALL"), _p("Krunal Pandya", "ALL"),
            _p("Jasprit Bumrah", "BOWL"), _p("Piyush Chawla", "BOWL"),
            _p("Jason Behrendorff", "BOWL"),
        ],
        "substitutes": [
            _p("Dewald Brevis", "BAT"), _p("Hrithik Shokeen", "ALL"),
            _p("Shams Mulani", "BOWL"), _p("Naman Dhir", "BAT"),
        ],
    },
    "KKR": {
        "playing_xi": [
            _p("Phil Salt", "WK", keeper=True), _p("Sunil Narine", "ALL"),
            _p("Shreyas Iyer", "BAT", captain=True), _p("Andre Russell", "ALL"),
            _p("Venkatesh Iyer", "ALL"), _p("Nitish Rana", "BAT"),
            _p("Rinku Singh", "BAT"), _p("Varun Chakravarthy", "BOWL"),
            _p("Harshit Rana", "BOWL"), _p("Anrich Nortje", "BOWL"),
            _p("Mitchell Starc", "BOWL"),
        ],
        "substitutes": [
            _p("Manish Pandey", "BAT"), _p("Jason Roy", "BAT"),
            _p("Suyash Sharma", "BOWL"), _p("Rahmanullah Gurbaz", "WK"),
        ],
    },
    "SRH": {
        "playing_xi": [
            _p("Travis Head", "BAT"), _p("Abhishek Sharma", "ALL"),
            _p("Mayank Agarwal", "BAT"), _p("Heinrich Klaasen", "WK", keeper=True),
            _p("Aiden Markram", "ALL"), _p("Pat Cummins", "ALL", captain=True),
            _p("Nitish Kumar Reddy", "ALL"), _p("Bhuvneshwar Kumar", "BOWL"),
            _p("Shaheen Shah Afridi", "BOWL"), _p("T Natarajan", "BOWL"),
            _p("Jaydev Unadkat", "BOWL"),
        ],
        "substitutes": [
            _p("Anmolpreet Singh", "BAT"), _p("Washington Sundar", "ALL"),
            _p("Marco Jansen", "ALL"), _p("Glenn Phillips", "ALL"),
        ],
    },
    "GT": {
        "playing_xi": [
            _p("Shubman Gill", "BAT", captain=True), _p("Sai Sudharsan", "BAT"),
            _p("Wriddhiman Saha", "WK", keeper=True), _p("David Miller", "BAT"),
            _p("Vijay Shankar", "ALL"), _p("Rahul Tewatia", "ALL"),
            _p("Rashid Khan", "ALL"), _p("Mohammed Shami", "BOWL"),
            _p("Alzarri Joseph", "BOWL"), _p("Noor Ahmad", "BOWL"),
            _p("Sai Kishore", "BOWL"),
        ],
        "substitutes": [
            _p("Darshan Nalkande", "BOWL"), _p("Kartik Tyagi", "BOWL"),
            _p("Shahrukh Khan", "BAT"), _p("Abhinav Manohar", "BAT"),
        ],
    },
    "DC": {
        "playing_xi": [
            _p("David Warner", "BAT"), _p("Prithvi Shaw", "BAT"),
            _p("Rishabh Pant", "WK", captain=True, keeper=True), _p("Mitchell Marsh", "ALL"),
            _p("Axar Patel", "ALL"), _p("Lalit Yadav", "ALL"),
            _p("Kuldeep Yadav", "BOWL"), _p("Anrich Nortje", "BOWL"),
            _p("Khaleel Ahmed", "BOWL"), _p("Ishant Sharma", "BOWL"),
            _p("Mukesh Kumar", "BOWL"),
        ],
        "substitutes": [
            _p("Phil Salt", "WK"), _p("Rovman Powell", "BAT"),
            _p("Yash Dhull", "BAT"), _p("Rilee Rossouw", "BAT"),
        ],
    },
    "LSG": {
        "playing_xi": [
            _p("KL Rahul", "WK", captain=True, keeper=True), _p("Quinton de Kock", "WK"),
            _p("Marcus Stoinis", "ALL"), _p("Nicholas Pooran", "BAT"),
            _p("Deepak Hooda", "ALL"), _p("Krunal Pandya", "ALL"),
            _p("Ravi Bishnoi", "BOWL"), _p("Mohsin Khan", "BOWL"),
            _p("Naveen-ul-Haq", "BOWL"), _p("Avesh Khan", "BOWL"),
            _p("Mark Wood", "BOWL"),
        ],
        "substitutes": [
            _p("Krishnappa Gowtham", "ALL"), _p("Prerak Mankad", "ALL"),
            _p("Ayush Badoni", "BAT"), _p("Kyle Mayers", "ALL"),
        ],
    },
    "PBKS": {
        "playing_xi": [
            _p("Shikhar Dhawan", "BAT", captain=True), _p("Jonny Bairstow", "WK", keeper=True),
            _p("Sam Curran", "ALL"), _p("Liam Livingstone", "ALL"),
            _p("Jitesh Sharma", "BAT"), _p("Harpreet Brar", "ALL"),
            _p("Kagiso Rabada", "BOWL"), _p("Nathan Ellis", "BOWL"),
            _p("Arshdeep Singh", "BOWL"), _p("Rahul Chahar", "BOWL"),
            _p("Vidwath Kaverappa", "BOWL"),
        ],
        "substitutes": [
            _p("Prabhsimran Singh", "WK"), _p("Bhanuka Rajapaksa", "BAT"),
            _p("Atharva Taide", "BAT"), _p("Rishi Dhawan", "ALL"),
        ],
    },
    "RR": {
        "playing_xi": [
            _p("Sanju Samson", "WK", captain=True, keeper=True), _p("Jos Buttler", "BAT"),
            _p("Devdutt Padikkal", "BAT"), _p("Riyan Parag", "ALL"),
            _p("Shimron Hetmyer", "BAT"), _p("Ravichandran Ashwin", "ALL"),
            _p("Jason Holder", "ALL"), _p("Trent Boult", "BOWL"),
            _p("Yuzvendra Chahal", "BOWL"), _p("Sandeep Sharma", "BOWL"),
            _p("Navdeep Saini", "BOWL"),
        ],
        "substitutes": [
            _p("Dhruv Jurel", "WK"), _p("Kuldeep Sen", "BOWL"),
            _p("KC Cariappa", "BOWL"), _p("Akash Vasisht", "BOWL"),
        ],
    },
}


def get_squad(team_code: str) -> dict:
    """Return playing XI and substitutes for a team."""
    return SQUAD_DATA.get(team_code.upper(), {"playing_xi": [], "substitutes": []})


# ── RSS Feed Parsing ────────────────────────────────────────────────

async def fetch_cricinfo_rss() -> list[dict]:
    """Fetch live scores from ESPN Cricinfo RSS feed."""
    try:
        async with httpx.AsyncClient(timeout=8.0) as client:
            resp = await client.get(
                "http://static.cricinfo.com/rss/livescores.xml",
                headers={"User-Agent": "Mozilla/5.0"},
            )
            resp.raise_for_status()
            tree = ET.fromstring(resp.content)
            matches = []
            for item in tree.findall(".//item"):
                title = item.find("title")
                guid = item.find("guid")
                if title is None or not title.text:
                    continue
                title_text = title.text.strip()
                match_id = guid.text.strip() if guid is not None and guid.text else title_text
                is_live = "*" in title_text
                status = "LIVE" if is_live else "COMPLETED"
                parsed = parse_match_title(title_text)
                matches.append({
                    "id": match_id,
                    "title": title_text,
                    "status": status,
                    **parsed,
                })
            return matches
    except Exception as e:
        print(f"[RSS] Fetch failed: {e}")
        return []


def parse_match_title(title: str) -> dict:
    """Parse a cricinfo RSS title into structured score data."""
    result = {
        "batting_team": "",
        "bowling_team": "",
        "runs": 0,
        "wickets": 0,
        "overs": "0.0",
        "target": "-",
        "run_rate": 0.0,
        "required_rate": 0.0,
        "match_status": "",
        "raw_title": title,
    }

    parts = title.split(" v ")
    if len(parts) < 2:
        result["match_status"] = title
        return result

    side_a = parts[0].strip()
    side_b = parts[1].strip()

    # Determine batting side (has *)
    batting_side = side_a if "*" in side_a else side_b
    bowling_side = side_b if batting_side == side_a else side_a

    # Extract score from batting side
    score_match = re.search(r"(\d+)/(\d+)", batting_side)
    if score_match:
        result["runs"] = int(score_match.group(1))
        result["wickets"] = int(score_match.group(2))

    # Extract overs if present
    overs_match = re.search(r"\((\d+\.?\d*)\s*ov", batting_side)
    if overs_match:
        result["overs"] = overs_match.group(1)

    # Clean team names
    result["batting_team"] = re.sub(r"[\d/\*\(\)\.ov\s]+$", "", re.sub(r"\d+/\d+.*$", "", batting_side)).strip()
    result["bowling_team"] = re.sub(r"[\d/\*\(\)\.ov\s]+$", "", re.sub(r"\d+/\d+.*$", "", bowling_side)).strip()

    # Extract target
    target_match = re.search(r"(\d+)/\d+", bowling_side)
    if target_match and "*" not in bowling_side:
        result["target"] = str(int(target_match.group(1)) + 1)

    # Compute run rate
    try:
        overs_float = float(result["overs"])
        if overs_float > 0:
            completed = int(overs_float) + (overs_float % 1) * 10 / 6
            result["run_rate"] = round(result["runs"] / completed, 2) if completed > 0 else 0.0
    except (ValueError, ZeroDivisionError):
        pass

    # Check for match result text after the scores
    for text in ["won by", "match drawn", "match tied", "no result"]:
        if text in title.lower():
            result["match_status"] = title
            break

    return result


# ── YouTube ─────────────────────────────────────────────────────────

async def fetch_youtube_highlights(query: str = "IPL 2026 highlights", max_results: int = 6) -> list[dict]:
    """Fetch YouTube highlights using YouTube Data API v3."""
    if not YOUTUBE_API_KEY:
        return []
    try:
        async with httpx.AsyncClient(timeout=8.0) as client:
            resp = await client.get(
                "https://www.googleapis.com/youtube/v3/search",
                params={
                    "part": "snippet",
                    "q": query,
                    "type": "video",
                    "maxResults": max_results,
                    "key": YOUTUBE_API_KEY,
                    "order": "relevance",
                },
            )
            resp.raise_for_status()
            results = []
            for item in resp.json().get("items", []):
                results.append({
                    "title": item["snippet"]["title"],
                    "video_id": item["id"]["videoId"],
                    "thumbnail": item["snippet"]["thumbnails"]["medium"]["url"],
                })
            return results
    except Exception as e:
        print(f"[YouTube] Error: {e}")
        return []


# ── Tenor Meme API ──────────────────────────────────────────────────

TENOR_API_KEY = os.getenv("TENOR_API_KEY", "")


async def fetch_tenor_meme(query: str) -> Optional[str]:
    """Fetch a GIF from Tenor API."""
    key = TENOR_API_KEY
    if not key:
        return None
    try:
        async with httpx.AsyncClient(timeout=5.0) as client:
            resp = await client.get(
                "https://tenor.googleapis.com/v2/search",
                params={"q": query, "key": key, "limit": 1, "media_filter": "gif"},
            )
            data = resp.json()
            results = data.get("results", [])
            if results:
                media = results[0].get("media_formats", {})
                gif = media.get("gif", {})
                return gif.get("url", "")
    except Exception as e:
        print(f"[Tenor] Error: {e}")
    return None
