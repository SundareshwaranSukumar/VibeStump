import streamlit as st
import plotly.graph_objects as go
from streamlit_autorefresh import st_autorefresh

from utils import get_theme, validate_config
from agents import analyze_commentary, generate_historical_insight
from tools import get_live_commentary, fetch_live_score, get_historical_context, fetch_meme, mock_food_delivery_api, mock_netflix_api

# --- Page Configuration ---
st.set_page_config(page_title="APL Hub: Agentic Premier League", page_icon="🏏", layout="wide")

# --- Session State Initialization ---
if "vibe_history" not in st.session_state:
    st.session_state.vibe_history = []
if "ball_count" not in st.session_state:
    st.session_state.ball_count = 0
if "is_demo_mode" not in st.session_state:
    st.session_state.is_demo_mode = True
if "historian_insight" not in st.session_state:
    st.session_state.historian_insight = None
if "selected_team" not in st.session_state:
    st.session_state.selected_team = "Default (APL)"
if "diversion_active" not in st.session_state:
    st.session_state.diversion_active = False
if "diversion_message" not in st.session_state:
    st.session_state.diversion_message = None

# --- Dynamic Theming ---
THEME = get_theme(st.session_state.selected_team)

# Custom CSS for Dynamic Theme
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
    /* Distraction Menu Buttons */
    .stButton>button {{
        border: 1px solid {THEME['primary']};
    }}
</style>
""", unsafe_allow_html=True)

# --- Auto Refresh Logic ---
# Pause refresh if diversion is active
if st.session_state.diversion_active:
    st.warning("⏸️ Live feed paused. Diversion Protocol Active.")
else:
    refresh_interval = 10000 if st.session_state.is_demo_mode else 30000
    st_autorefresh(interval=refresh_interval, key="apl_live_refresh")

# === LEFT SIDEBAR: The APL Hub ===
with st.sidebar:
    st.image("https://upload.wikimedia.org/wikipedia/en/thumb/8/84/Indian_Premier_League_Official_Logo.svg/1200px-Indian_Premier_League_Official_Logo.svg.png", width=150)
    st.title("🏆 APL Hub")
    
    missing_keys = validate_config()
    if "GEMINI_API_KEY" in missing_keys:
        st.error("🚨 GEMINI_API_KEY missing! Operating in Offline Mode.")

    st.markdown("### Settings")
    team_options = ["Default (APL)", "RCB", "CSK", "MI"]
    
    # Store previous selection to detect changes
    previous_team = st.session_state.selected_team
    st.session_state.selected_team = st.selectbox("Select Favorite Team", team_options, index=team_options.index(st.session_state.selected_team))
    if st.session_state.selected_team != previous_team:
        st.rerun() # Immediately apply theme change

    st.session_state.is_demo_mode = st.toggle("🚀 Demo Mode (High Tension Sim)", value=st.session_state.is_demo_mode)
    
    if st.button("🔄 Manual Refresh", use_container_width=True):
        if not st.session_state.diversion_active:
             st.session_state.ball_count += 1
        st.rerun()
        
    if st.button("🗑️ Reset Match", use_container_width=True):
        st.session_state.ball_count = 0
        st.session_state.vibe_history = []
        st.session_state.historian_insight = None
        st.session_state.diversion_active = False
        st.session_state.diversion_message = None
        st.rerun()

    st.markdown("---")
    st.markdown("### 📅 Tournament Hub")
    st.success("**Today:** RCB vs KKR (LIVE)")
    st.info("**Previous:** GT beat SRH by 12 runs")
    st.warning("**Upcoming:** PBKS vs MI (Tomorrow)")
    

# === TOP HEADER: Live Scoreboard ===
st.markdown(f"## 🏏 Agentic Premier League: {st.session_state.selected_team} vs Rivals")
current_ball = st.session_state.ball_count
score_data = fetch_live_score(current_ball, demo_mode=st.session_state.is_demo_mode)

col_sc1, col_sc2, col_sc3, col_sc4 = st.columns(4)
col_sc1.metric("Runs", score_data["runs"])
col_sc2.metric("Wickets", score_data["wickets"])
col_sc3.metric("Overs", score_data["overs"])
col_sc4.metric("Run Rate", score_data["run_rate"])
st.markdown("---")

# Fetch Data using Scout Agent (Only advance logic if not diverted)
commentary = get_live_commentary(current_ball, demo_mode=st.session_state.is_demo_mode)
analysis = None
meme_url = ""

# Execute Agentic Loop
if commentary and not st.session_state.diversion_active:
    # 🧠 Psychologist Agent
    analysis = analyze_commentary(commentary)
    
    # Update State properly
    if len(st.session_state.vibe_history) <= current_ball:
        st.session_state.vibe_history.append(analysis.vibe_score)
    else:
        st.session_state.vibe_history[current_ball] = analysis.vibe_score
        
    # Check for Diversion Protocol Trigger (2 consecutive updates < -5)
    if len(st.session_state.vibe_history) >= 2:
        if st.session_state.vibe_history[-1] < -5 and st.session_state.vibe_history[-2] < -5:
            st.session_state.diversion_active = True
            st.rerun() # Immediately trigger UI change
            
    # 📚 Historian Agent Trigger
    if analysis.is_critical_event:
        context = get_historical_context(analysis.event_type)
        st.session_state.historian_insight = generate_historical_insight(analysis.event_type, context)
    else:
        st.session_state.historian_insight = None

    # 🎬 Executor Agent
    meme_url = fetch_meme(analysis.fallback_mood)

    # Auto increment ball counter for next loop
    st.session_state.ball_count += 1

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
    
    # Plotly Tension Gauge (Use last known value if diverted)
    t_index = analysis.tension_index if analysis else 8 # default high if diverted mid-way
    if not analysis and st.session_state.diversion_active:
        t_index = 10 # Max tension during collapse
        
    fig_gauge = go.Figure(go.Indicator(
        mode = "gauge+number",
        value = t_index,
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
                'value': t_index
            }
        }
    ))
    fig_gauge.update_layout(height=280, margin=dict(l=10, r=10, t=40, b=10), paper_bgcolor='rgba(0,0,0,0)', font={'color': THEME['text']})
    st.plotly_chart(fig_gauge, use_container_width=True)

with main_col2:
    if st.session_state.diversion_active:
        # --- The Distraction Menu ---
        st.markdown(f"""
        <div style="background-color: {THEME['surface']}; padding: 20px; border-radius: 10px; border: 2px solid {THEME['danger']}; text-align: center;">
            <h3 style="color: {THEME['danger']};">🚨 DIVERSION PROTOCOL</h3>
            <p style="font-size: 1.1rem; color: {THEME['text']};">Looks like it's getting rough out there. The team is collapsing. Need a distraction?</p>
        </div>
        <br>
        """, unsafe_allow_html=True)
        
        if st.button("🍕 Option A: Order Comfort Food", use_container_width=True):
            with st.spinner("Calling Food Delivery API..."):
                st.session_state.diversion_message = mock_food_delivery_api()
        
        if st.button("📺 Option B: Netflix & Chill", use_container_width=True):
            with st.spinner("Calling Streaming API..."):
                st.session_state.diversion_message = mock_netflix_api()
                
        if st.session_state.diversion_message:
            st.success(st.session_state.diversion_message)
            
        st.markdown("<br>", unsafe_allow_html=True)
        if st.button("⬅️ Back to Match", type="primary", use_container_width=True):
            st.session_state.diversion_active = False
            st.session_state.diversion_message = None
            st.rerun()

    else:
        # Standard Agent Interventions
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
        if meme_url:
            st.image(meme_url, caption=f"Agent Mood: {analysis.fallback_mood.upper() if analysis else ''}", use_container_width=True)
        
        if analysis:
            if analysis.tension_index >= 8:
                st.error("🚨 **HYPE ALERT:** TENSION IS PEAKING! WHAT AN OVER!")
            elif analysis.vibe_score < -5:
                st.warning("⚠️ **WARNING:** The vibe is taking a hit. Hold your breath.")
