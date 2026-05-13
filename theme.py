"""
theme.py — ThemeManager for VibeStump APL Edition.
Provides dynamic team-specific theming with glassmorphism CSS injection.
"""

# ──────────────────────────────────────────────────────────────────────
#  TEAM COLOR PALETTES
# ──────────────────────────────────────────────────────────────────────
TEAM_PALETTES = {
    "RCB": {
        "primary":   "#E21836",   # Bold Red
        "secondary": "#DAB14F",   # Gold
        "accent":    "#1E1E1E",   # Charcoal
    },
    "KKR": {
        "primary":   "#3A225D",   # Royal Purple
        "secondary": "#FFD700",   # Gold
        "accent":    "#4B0082",   # Indigo
    },
    "CSK": {
        "primary":   "#FACC15",   # Bright Yellow
        "secondary": "#1E3A8A",   # Navy Blue
        "accent":    "#0E7490",   # Teal
    },
    "MI": {
        "primary":   "#004BA0",   # MI Blue
        "secondary": "#DAB14F",   # Gold
        "accent":    "#0284C7",   # Sky Blue
    },
    "SRH": {
        "primary":   "#FF6600",   # Orange
        "secondary": "#1E1E1E",   # Black
        "accent":    "#DC2626",   # Red
    },
    "GT": {
        "primary":   "#1C1C2E",   # Dark Navy
        "secondary": "#39B5E0",   # Titan Blue
        "accent":    "#FFD700",   # Gold
    },
    "DC": {
        "primary":   "#004C93",   # Delhi Blue
        "secondary": "#EF4444",   # Red
        "accent":    "#1E40AF",   # Royal Blue
    },
    "LSG": {
        "primary":   "#A5F3FC",   # Cyan
        "secondary": "#1E3A5F",   # Navy
        "accent":    "#0EA5E9",   # Sky Blue
    },
    "PBKS": {
        "primary":   "#DD1F2D",   # Red
        "secondary": "#D4A843",   # Gold
        "accent":    "#8B0000",   # Dark Red
    },
    "RR": {
        "primary":   "#E73895",   # Pink
        "secondary": "#254AA5",   # Royal Blue
        "accent":    "#1E3A8A",   # Navy
    },
}


def get_team_theme(team_name: str) -> dict:
    """
    Returns a full theme dictionary for the selected team,
    built on the shared glassmorphism dark-mode base.
    """
    palette = TEAM_PALETTES.get(team_name, {
        "primary":   "#00F0FF",   # Default neon blue
        "secondary": "#FFD700",   # Default gold
        "accent":    "#7C3AED",   # Purple
    })

    return {
        # Backgrounds
        "background":  "#0B172A",
        "surface":     "rgba(30, 41, 59, 0.60)",  # Translucent for glassmorphism
        "surface_solid": "#1E293B",
        # Team colors
        "primary":     palette["primary"],
        "secondary":   palette["secondary"],
        "accent":      palette["accent"],
        # Text
        "text":        "#F8FAFC",
        "text_muted":  "#94A3B8",
        # Semantic
        "danger":      "#EF4444",
        "success":     "#10B981",
        "warning":     "#F59E0B",
        # Chart
        "gauge_bar":   "rgba(0,0,0,0)",
        "gauge_bg":    "rgba(30, 41, 59, 0.40)",
        "gauge_border": palette["primary"],
        "gauge_steps": [
            {"range": [0, 4],  "color": "#10B981"},
            {"range": [4, 7],  "color": palette["secondary"]},
            {"range": [7, 10], "color": "#EF4444"},
        ],
        "line_color":  palette["primary"],
        "area_fill":   palette["primary"].lower() + "33",  # 20 % opacity hex
    }


def inject_glassmorphism_css(theme: dict) -> str:
    """
    Returns a <style> block implementing the glassmorphism dark-mode theme.
    Called once per render from app.py via st.markdown(unsafe_allow_html=True).
    """
    return f"""
<style>
    /* ── Import Inter font ────────────────────────────────── */
    @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap');

    /* ── Global ───────────────────────────────────────────── */
    .stApp {{
        background: linear-gradient(135deg, {theme['background']} 0%, #0F172A 50%, #020617 100%);
        color: {theme['text']};
        font-family: 'Inter', sans-serif;
    }}

    /* ── Top bar ──────────────────────────────────────────── */
    [data-testid="stHeader"] {{
        background: rgba(11,23,42,0.85);
        backdrop-filter: blur(12px);
        -webkit-backdrop-filter: blur(12px);
    }}

    /* ── Glassmorphism cards ──────────────────────────────── */
    .glass-card {{
        background: {theme['surface']};
        backdrop-filter: blur(16px);
        -webkit-backdrop-filter: blur(16px);
        border: 1px solid rgba(248,250,252,0.08);
        border-radius: 16px;
        padding: 24px;
        margin-bottom: 12px;
        box-shadow: 0 8px 32px rgba(0,0,0,0.25);
    }}

    /* ── Metrics ──────────────────────────────────────────── */
    [data-testid="stMetricValue"] {{
        color: {theme['primary']} !important;
        font-family: 'Inter', sans-serif;
        font-weight: 700;
        font-size: 2rem !important;
    }}
    [data-testid="stMetricLabel"] {{
        color: {theme['text_muted']} !important;
        text-transform: uppercase;
        letter-spacing: 0.08em;
        font-size: 0.75rem !important;
    }}
    [data-testid="stMetricDelta"] > div {{
        color: {theme['secondary']} !important;
    }}

    /* ── Headings ─────────────────────────────────────────── */
    h1, h2, h3 {{
        color: {theme['secondary']} !important;
        font-family: 'Inter', sans-serif;
        font-weight: 700;
    }}
    h1 {{ letter-spacing: -0.02em; }}

    /* ── Sidebar ──────────────────────────────────────────── */
    [data-testid="stSidebar"] {{
        background: linear-gradient(180deg, rgba(11,23,42,0.95) 0%, rgba(15,23,42,0.98) 100%);
        border-right: 1px solid rgba(248,250,252,0.06);
    }}
    [data-testid="stSidebar"] h1,
    [data-testid="stSidebar"] h2,
    [data-testid="stSidebar"] h3 {{
        color: {theme['primary']} !important;
    }}

    /* ── Buttons ──────────────────────────────────────────── */
    .stButton > button {{
        background: linear-gradient(135deg, {theme['primary']}22, {theme['primary']}44);
        color: {theme['text']};
        border: 1px solid {theme['primary']}88;
        border-radius: 10px;
        font-weight: 600;
        transition: all 0.25s ease;
    }}
    .stButton > button:hover {{
        background: linear-gradient(135deg, {theme['primary']}55, {theme['primary']}77);
        border-color: {theme['primary']};
        box-shadow: 0 0 20px {theme['primary']}44;
        transform: translateY(-1px);
    }}

    /* ── Layout ───────────────────────────────────────────── */
    .block-container {{
        padding-top: 1.5rem;
        padding-bottom: 0.5rem;
        max-width: 1400px;
    }}

    /* ── Toggle ───────────────────────────────────────────── */
    [data-testid="stWidgetLabel"] {{
        color: {theme['text_muted']} !important;
    }}
</style>
"""
