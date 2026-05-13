import os
from dotenv import load_dotenv

# Load environment variables from .env file
load_dotenv()

# Configuration
GEMINI_API_KEY = os.getenv("GEMINI_API_KEY")
CRICKET_API_KEY = os.getenv("CRICKET_API_KEY")

def get_theme(team_name: str):
    """Returns a dynamic IPL theme based on the selected team."""
    
    # Base configuration shared across all themes
    base = {
        "background": "#0B172A", # Deep Navy
        "surface": "#1E293B",    # Slightly lighter navy for cards
        "text": "#F8FAFC",       # Off-White
        "text_muted": "#94A3B8", # Slate
        "danger": "#EF4444",     # Neon Red (Wickets/Tension)
        "success": "#10B981",    # Neon Green
        "gauge_bar": "rgba(0,0,0,0)",
        "gauge_bg": "#1E293B",
    }
    
    # Team-specific overrides
    if team_name == "RCB":
        custom = {
            "primary": "#E21836",    # RCB Red
            "secondary": "#DAB14F",  # Gold
            "line_color": "#E21836",
            "gauge_border": "#DAB14F",
            "gauge_steps": [
                {'range': [0, 5], 'color': "#10B981"},
                {'range': [5, 8], 'color': "#DAB14F"},
                {'range': [8, 10], 'color': "#E21836"}
            ]
        }
    elif team_name == "CSK":
        custom = {
            "primary": "#FACC15",    # CSK Yellow
            "secondary": "#3B82F6",  # Blue
            "line_color": "#FACC15",
            "gauge_border": "#3B82F6",
            "gauge_steps": [
                {'range': [0, 5], 'color': "#10B981"},
                {'range': [5, 8], 'color': "#3B82F6"},
                {'range': [8, 10], 'color': "#FACC15"}
            ]
        }
    elif team_name == "MI":
        custom = {
            "primary": "#3B82F6",    # MI Blue
            "secondary": "#DAB14F",  # Gold
            "line_color": "#3B82F6",
            "gauge_border": "#DAB14F",
            "gauge_steps": [
                {'range': [0, 5], 'color': "#10B981"},
                {'range': [5, 8], 'color': "#DAB14F"},
                {'range': [8, 10], 'color': "#3B82F6"}
            ]
        }
    else: # Default APL Theme
        custom = {
            "primary": "#00F0FF",    # Neon Blue
            "secondary": "#FFD700",  # Gold
            "line_color": "#00F0FF",
            "gauge_border": "#00F0FF",
            "gauge_steps": [
                {'range': [0, 5], 'color': "#10B981"},
                {'range': [5, 8], 'color': "#FFD700"},
                {'range': [8, 10], 'color': "#EF4444"}
            ]
        }
        
    base.update(custom)
    return base

def validate_config():
    """Check if necessary API keys are present."""
    missing = []
    if not GEMINI_API_KEY:
        missing.append("GEMINI_API_KEY")
    return missing
