import os
from dotenv import load_dotenv

# Load environment variables from .env file
load_dotenv()

# Configuration
GEMINI_API_KEY = os.getenv("GEMINI_API_KEY")
CRICKET_API_KEY = os.getenv("CRICKET_API_KEY")

# APL / IPL Dark Mode Theme Colors
THEME = {
    "background": "#0B172A", # Deep Navy
    "surface": "#1E293B",    # Slightly lighter navy for cards
    "primary": "#00F0FF",    # Neon Blue
    "secondary": "#FFD700",  # Gold
    "text": "#F8FAFC",       # Off-White
    "text_muted": "#94A3B8", # Slate
    "danger": "#EF4444",     # Neon Red (Wickets/Tension)
    "success": "#10B981",    # Neon Green
    "gauge_bar": "rgba(0,0,0,0)",
    "gauge_bg": "#1E293B",
    "gauge_border": "#00F0FF",
    "gauge_steps": [
        {'range': [0, 5], 'color': "#10B981"},   # Green
        {'range': [5, 8], 'color': "#FFD700"},   # Gold
        {'range': [8, 10], 'color': "#EF4444"}   # Red
    ],
    "line_color": "#00F0FF"
}

def validate_config():
    """Check if necessary API keys are present."""
    missing = []
    if not GEMINI_API_KEY:
        missing.append("GEMINI_API_KEY")
    return missing
