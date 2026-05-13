import streamlit as st
import plotly.graph_objects as go
from streamlit_autorefresh import st_autorefresh

from utils import THEME, validate_config
from agents import analyze_commentary
from tools import get_live_commentary, get_meme_url

# --- Page Configuration & Theming ---
st.set_page_config(page_title="VibeStump: Agentic Fan-Manager", page_icon="🏏", layout="wide")

# Custom CSS for RCB Theme
st.markdown(f"""
<style>
    .stApp {{
        background-color: {THEME['background']};
        color: {THEME['text']};
    }}
    /* Style metrics and generic text */
    [data-testid="stMetricValue"] {{
        color: {THEME['secondary']} !important;
    }}
    [data-testid="stHeader"] {{
        background-color: rgba(0,0,0,0);
    }}
</style>
""", unsafe_allow_html=True)

# --- Session State Initialization ---
if "vibe_history" not in st.session_state:
    st.session_state.vibe_history = []
if "ball_count" not in st.session_state:
    st.session_state.ball_count = 0
if "is_auto_refresh" not in st.session_state:
    st.session_state.is_auto_refresh = False

# --- Auto Refresh Logic ---
# Run every 30 seconds if enabled
if st.session_state.is_auto_refresh:
    st_autorefresh(interval=30000, key="live_match_refresh")

# --- Sidebar ---
with st.sidebar:
    st.title("⚙️ Control Center")
    
    # Check for critical errors
    missing_keys = validate_config()
    if "GEMINI_API_KEY" in missing_keys:
        st.error("🚨 GEMINI_API_KEY is missing! Please configure your .env file to enable the Psychologist Agent.")
        
    st.markdown("### Mode")
    st.session_state.is_auto_refresh = st.toggle("Live Auto-Refresh (30s)", value=st.session_state.is_auto_refresh)
    
    if st.button("Manual Refresh", type="primary", use_container_width=True):
        st.rerun()

    st.markdown("---")
    st.markdown("### Agentic Loop Status")
    st.success("🧠 Psychologist: ONLINE" if "GEMINI_API_KEY" not in missing_keys else "🧠 Psychologist: OFFLINE (No Key)")
    st.success("🔭 Scout Agent: ONLINE (Simulation Fallback active)" if True else "") # Always online in simulation mode if no key
    st.success("🎬 Executor: ONLINE")

st.title("🏏 VibeStump: Agentic Fan-Manager")
st.markdown(f"**<span style='color:{THEME['primary']}'>Real-Time Emotion Tracking for the Ultimate Fan Experience</span>**", unsafe_allow_html=True)

# --- The Scout Agent: Fetch Data ---
current_ball_index = st.session_state.ball_count
commentary = get_live_commentary(current_ball_index)

st.markdown("### Live Match Feed")
st.info(f"🎙️ **Commentary:** {commentary}")

# --- Trigger Agentic Loop ---
if commentary:
    with st.spinner("Psychologist Agent Analyzing..."):
        # The Brain: Analyze
        analysis = analyze_commentary(commentary)
        
        # Update State
        st.session_state.ball_count += 1
        st.session_state.vibe_history.append(analysis.vibe_score)
        
        # The Executor: Fetch Meme
        meme_url = get_meme_url(analysis.meme_search_query, analysis.fallback_mood)

        # --- Visual Columns ---
        col1, col2, col3 = st.columns(3)
        
        with col1:
            st.subheader("📊 Tension Index")
            # Themed Gauge Chart
            fig_gauge = go.Figure(go.Indicator(
                mode = "gauge+number",
                value = analysis.tension_index,
                domain = {'x': [0, 1], 'y': [0, 1]},
                title = {'text': "Tension", 'font': {'color': THEME['secondary']}},
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
            fig_gauge.update_layout(
                height=250, 
                margin=dict(l=20, r=20, t=50, b=20),
                paper_bgcolor=THEME['background'],
                font={'color': THEME['text']}
            )
            st.plotly_chart(fig_gauge, use_container_width=True)
            
            delta = analysis.vibe_score - st.session_state.vibe_history[-2] if len(st.session_state.vibe_history) > 1 else 0
            st.metric(label="Vibe Score (-10 to 10)", value=analysis.vibe_score, delta=delta)

        with col2:
            st.subheader("📈 Emotional Trends")
            fig_line = go.Figure()
            fig_line.add_trace(go.Scatter(
                x=list(range(1, st.session_state.ball_count + 1)),
                y=st.session_state.vibe_history,
                mode='lines+markers',
                name='Vibe Score',
                line=dict(color=THEME['line_color'], width=3),
                marker=dict(size=8, color=THEME['secondary'])
            ))
            fig_line.update_layout(
                title="Vibe History",
                xaxis_title="Ball Count",
                yaxis_title="Vibe Score",
                yaxis=dict(range=[-10, 10]),
                height=350,
                margin=dict(l=20, r=20, t=50, b=20),
                paper_bgcolor=THEME['background'],
                plot_bgcolor=THEME['gauge_bg'],
                font={'color': THEME['text']}
            )
            st.plotly_chart(fig_line, use_container_width=True)
            
        with col3:
            st.subheader("🎭 Agent Intervention")
            st.image(meme_url, caption=f"Agent Query: '{analysis.meme_search_query}'", use_container_width=True)
            
            # Safety Filter
            st.markdown("### Safety Filter")
            if analysis.tension_index > 8:
                st.warning(f"🚨 **HYPE ALERT:** Tension is {analysis.tension_index}/10! Take a breath, remember it's a game!")
            elif analysis.vibe_score < -5:
                st.info("💙 **KEEP THE FAITH:** The vibe is low, but the game can change in an over!")
            else:
                st.success("✅ **VIBE CHECK:** All good! Enjoy the match.")
