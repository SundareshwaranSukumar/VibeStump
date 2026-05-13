"""
utils.py — Lightweight configuration helpers for VibeStump.

Theme logic has been moved to theme.py.
This module handles environment validation only.
"""

import os
from dotenv import load_dotenv

load_dotenv()

GEMINI_API_KEY   = os.getenv("GEMINI_API_KEY", "")
CRICKET_API_KEY  = os.getenv("CRICKET_API_KEY", "")
YOUTUBE_API_KEY  = os.getenv("YOUTUBE_API_KEY", "")


def validate_config() -> list:
    """Returns a list of missing critical environment variable names."""
    missing = []
    if not GEMINI_API_KEY:
        missing.append("GEMINI_API_KEY")
    return missing
