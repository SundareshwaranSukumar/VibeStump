import os
from dotenv import load_dotenv

# Load environment variables from .env file
load_dotenv()

# Configuration
GEMINI_API_KEY = os.getenv("GEMINI_API_KEY")
CRICKET_API_KEY = os.getenv("CRICKET_API_KEY")
GIPHY_API_KEY = os.getenv("GIPHY_API_KEY")

# RCB/Bengaluru Theme Colors
THEME = {
    "primary": "#E21836",    # RCB Red
    "secondary": "#DAB14F",  # Gold
    "background": "#000000", # Black
    "text": "#FFFFFF",       # White
    "gauge_bar": "rgba(0,0,0,0)",
    "gauge_bg": "#111111",
    "gauge_border": "#DAB14F",
    "gauge_steps": [
        {'range': [0, 5], 'color': "#2ecc71"},   # Green (Calm)
        {'range': [5, 8], 'color': "#DAB14F"},   # Gold (Tense)
        {'range': [8, 10], 'color': "#E21836"}   # Red (Hype/Danger)
    ],
    "line_color": "#E21836"
}

def validate_config():
    """Check if necessary API keys are present."""
    missing = []
    if not GEMINI_API_KEY:
        missing.append("GEMINI_API_KEY")
    return missing
