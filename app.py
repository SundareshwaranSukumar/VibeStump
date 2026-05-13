import streamlit as st
import plotly.graph_objects as go
from streamlit_autorefresh import st_autorefresh

from utils import THEME, validate_config
from agents import analyze_commentary, generate_historical_insight
from tools import get_live_commentary, fetch_live_score, get_historical_context, fetch_meme

# --- Page Configuration & Theming ---
st.set_page_config(page_title="APL Hub: Agentic Premier League", page_icon="🏏", layout="wide")

# Custom CSS for APL Theme
st.markdown(f"""
<style>
    .stApp {{
        background-color: {THEME['background']};
        color: {THEME['text']};
    }}
    /* Containers / Cards */
    [data-testid="stVerticalBlock"] > div > div {{
        background-color: {THEME['surface']};
        border-radius: 12px;
        padding: 10px;
    }}
    /* Metrics */
    [data-testid="stMetricValue"] {{
        color: {THEME['primary']} !important;
        font-family: 'Courier New', Courier, monospace;
        font-weight: bold;
    }}
    [data-testid="stMetricLabel"] {{
        color: {THEME['text_muted']} !important;
    }}
    /* Headings */
    h1, h2, h3 {{
        color: {THEME['secondary']} !important;
        font-family: 'Arial', sans-serif;
    }}
    /* Hide top padding */
    .block-container {{
        padding-top: 1rem;
        padding-bottom: 0rem;
    }}
</style>
""", unsafe_allow_html=True)

# --- Session State Initialization ---
if "vibe_history" not in st.session_state:
    st.session_state.vibe_history = []
if "ball_count" not in st.session_state:
    st.session_state.ball_count = 0
if "is_demo_mode" not in st.session_state:
    st.session_state.is_demo_mode = True
if "historian_insight" not in st.session_state:
    st.session_state.historian_insight = None

# Auto Refresh Logic (Runs every 10 seconds in demo mode, 30s in live)
refresh_interval = 10000 if st.session_state.is_demo_mode else 30000
st_autorefresh(interval=refresh_interval, key="apl_live_refresh")

# --- UI LAYOUT: 3 Columns ---
# 1. Left Sidebar (Hub), 2. Center (Feed & Tension), 3. Right (Insights)

# === LEFT SIDEBAR: The APL Hub ===
with st.sidebar:
    st.image("https://upload.wikimedia.org/wikipedia/en/thumb/8/84/Indian_Premier_League_Official_Logo.svg/1200px-Indian_Premier_League_Official_Logo.svg.png", width=150)
    st.title("🏆 APL Hub")
    
    missing_keys = validate_config()
    if "GEMINI_API_KEY" in missing_keys:
        st.error("🚨 GEMINI_API_KEY missing! Operating in Offline Mode.")

    st.markdown("### Settings")
    st.session_state.is_demo_mode = st.toggle("🚀 Demo Mode (High Tension Sim)", value=st.session_state.is_demo_mode)
    
    if st.button("🔄 Manual Refresh", use_container_width=True):
        st.session_state.ball_count += 1
        st.rerun()
        
    if st.button("🗑️ Reset Match", use_container_width=True):
        st.session_state.ball_count = 0
        st.session_state.vibe_history = []
        st.session_state.historian_insight = None
        st.rerun()

    st.markdown("---")
    st.markdown("### 📅 Tournament Hub")
    st.success("**Today:** RCB vs KKR (LIVE)")
    st.info("**Previous:** GT beat SRH by 12 runs")
    st.warning("**Upcoming:** PBKS vs MI (Tomorrow)")
    
    st.markdown("---")
    st.markdown("### 🤖 Agents Status")
    st.write("🔭 Scout: **ONLINE**")
    st.write("🧠 Psychologist: **ONLINE**")
    st.write("📚 Historian: **ONLINE**")


# === TOP HEADER: Live Scoreboard ===
st.markdown("## 🏏 Agentic Premier League: RCB vs KKR")
current_ball = st.session_state.ball_count
score_data = fetch_live_score(current_ball, demo_mode=st.session_state.is_demo_mode)

col_sc1, col_sc2, col_sc3, col_sc4 = st.columns(4)
col_sc1.metric("Runs", score_data["runs"])
col_sc2.metric("Wickets", score_data["wickets"])
col_sc3.metric("Overs", score_data["overs"])
col_sc4.metric("Run Rate", score_data["run_rate"])
st.markdown("---")


# Fetch Data using Scout Agent
commentary = get_live_commentary(current_ball, demo_mode=st.session_state.is_demo_mode)

# Execute Agentic Loop
if commentary:
    # 🧠 Psychologist Agent
    analysis = analyze_commentary(commentary)
    
    # Update State properly
    if len(st.session_state.vibe_history) <= current_ball:
        st.session_state.vibe_history.append(analysis.vibe_score)
    else:
        st.session_state.vibe_history[current_ball] = analysis.vibe_score
        
    # 📚 Historian Agent Trigger
    if analysis.is_critical_event:
        context = get_historical_context(analysis.event_type)
        st.session_state.historian_insight = generate_historical_insight(analysis.event_type, context)
    else:
        st.session_state.historian_insight = None

    # 🎬 Executor Agent
    meme_url = fetch_meme(analysis.fallback_mood)

    # === MAIN COLUMNS ===
    main_col1, main_col2 = st.columns([1.5, 1])

    with main_col1:
        st.markdown("### 🎙️ The Live Feed")
        # Style the commentary box
        st.markdown(f"""
        <div style="background-color: {THEME['surface']}; padding: 20px; border-radius: 10px; border-left: 5px solid {THEME['primary']}; font-size: 1.2rem;">
            {commentary}
        </div>
        """, unsafe_allow_html=True)
        
        st.markdown("<br>", unsafe_allow_html=True)
        
        # Plotly Tension Gauge
        fig_gauge = go.Figure(go.Indicator(
            mode = "gauge+number",
            value = analysis.tension_index,
            domain = {'x': [0, 1], 'y': [0, 1]},
            title = {'text': "Match Tension", 'font': {'color': THEME['secondary'], 'size': 20}},
            gauge = {
                'axis': {'range': [None, 10], 'tickwidth': 1, 'tickcolor': THEME['text']},
                'bar': {'color': THEME['gauge_bar']},
                'bgcolor': THEME['gauge_bg'],
                'borderwidth': 2,
                'bordercolor': THEME['gauge_border'],
                'steps': THEME['gauge_steps'],
                'threshold': {
                    'line': {'color': THEME['text'], 'width': 4},
                    'thickness': 0.75,
                    'value': analysis.tension_index
                }
            }
        ))
        fig_gauge.update_layout(height=280, margin=dict(l=10, r=10, t=40, b=10), paper_bgcolor='rgba(0,0,0,0)', font={'color': THEME['text']})
        st.plotly_chart(fig_gauge, use_container_width=True)

    with main_col2:
        st.markdown("### 🎭 Agent Interventions")
        
        # Historian Output
        if st.session_state.historian_insight:
            st.markdown(f"""
            <div style="background-color: {THEME['surface']}; padding: 15px; border-radius: 10px; border: 1px solid {THEME['secondary']}; margin-bottom: 15px;">
                <h4 style="color: {THEME['secondary']}; margin-top: 0;">📚 The Historian</h4>
                <em>"{st.session_state.historian_insight}"</em>
            </div>
            """, unsafe_allow_html=True)
            
        # Psychologist/Executor Output
        st.image(meme_url, caption=f"Agent Mood: {analysis.fallback_mood.upper()}", use_container_width=True)
        
        if analysis.tension_index >= 8:
            st.error("🚨 **HYPE ALERT:** TENSION IS PEAKING! WHAT AN OVER!")
        elif analysis.vibe_score < -5:
            st.info("💙 **KEEP CALM:** The vibe is low, but the match isn't over.")
            
    # Auto increment ball counter for next loop
    st.session_state.ball_count += 1
