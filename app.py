"""
app.py — VibeStump: Agentic Premier League (APL) Second-Screen Experience.

A Streamlit-based broadcast dashboard featuring:
  • Glassmorphism dark-mode UI with dynamic team theming
  • Three-pane layout: Live Feed | Tension Gauge | Agent Interventions
  • Multi-agent agentic loop (Scout → Psychologist → Historian → Executor)
  • Diversion Protocol with mock Swiggy/Netflix APIs
  • YouTube Match VOD Hub
  • Vibe Trend area chart with session memory

Deployment target: Google Cloud Run (port 8080).
"""

import streamlit as st
import plotly.graph_objects as go
from streamlit_autorefresh import st_autorefresh
from dotenv import load_dotenv

# Load .env BEFORE any module that reads os.getenv
load_dotenv()

from theme import get_team_theme, inject_glassmorphism_css, TEAM_PALETTES
from agents import analyze_commentary, generate_historical_insight
from tools import (
    get_live_commentary,
    fetch_live_score,
    get_historical_context,
    fetch_meme,
    fetch_youtube_highlights,
    mock_food_delivery_api,
    mock_netflix_api,
)

# ──────────────────────────────────────────────────────────────────────
#  PAGE CONFIG
# ──────────────────────────────────────────────────────────────────────
st.set_page_config(
    page_title="VibeStump — APL Hub",
    page_icon="🏏",
    layout="wide",
    initial_sidebar_state="expanded",
)

# ──────────────────────────────────────────────────────────────────────
#  SESSION STATE DEFAULTS
# ──────────────────────────────────────────────────────────────────────
_DEFAULTS = {
    "vibe_history":       [],
    "ball_count":         0,
    "is_demo_mode":       True,
    "selected_team":      "RCB",
    "historian_insight":   None,
    "diversion_active":   False,
    "diversion_message":  None,
    "show_vods":          False,
}
for key, val in _DEFAULTS.items():
    if key not in st.session_state:
        st.session_state[key] = val

# ──────────────────────────────────────────────────────────────────────
#  DYNAMIC THEME
# ──────────────────────────────────────────────────────────────────────
THEME = get_team_theme(st.session_state.selected_team)
st.markdown(inject_glassmorphism_css(THEME), unsafe_allow_html=True)

# ──────────────────────────────────────────────────────────────────────
#  AUTO-REFRESH  (paused during Diversion Protocol)
# ──────────────────────────────────────────────────────────────────────
if not st.session_state.diversion_active:
    interval = 8000 if st.session_state.is_demo_mode else 30000
    st_autorefresh(interval=interval, key="apl_refresh")

# ══════════════════════════════════════════════════════════════════════
#  SIDEBAR — APL HUB
# ══════════════════════════════════════════════════════════════════════
with st.sidebar:
    st.markdown(
        f"<h1 style='text-align:center; color:{THEME['primary']};'>🏏 APL Hub</h1>",
        unsafe_allow_html=True,
    )

    # ── Team selector ────────────────────────────────────────────────
    teams = list(TEAM_PALETTES.keys())
    prev_team = st.session_state.selected_team
    st.session_state.selected_team = st.selectbox(
        "🎽 Favorite Team", teams,
        index=teams.index(st.session_state.selected_team),
    )
    if st.session_state.selected_team != prev_team:
        st.rerun()

    # ── Mode toggle ──────────────────────────────────────────────────
    st.session_state.is_demo_mode = st.toggle(
        "🚀 Demo Mode (RCB vs KKR Sim)", value=st.session_state.is_demo_mode)

    # ── Controls ─────────────────────────────────────────────────────
    c1, c2 = st.columns(2)
    with c1:
        if st.button("🔄 Next Ball", use_container_width=True):
            if not st.session_state.diversion_active:
                st.session_state.ball_count += 1
            st.rerun()
    with c2:
        if st.button("🗑️ Reset", use_container_width=True):
            for k, v in _DEFAULTS.items():
                st.session_state[k] = v if not isinstance(v, list) else []
            st.rerun()

    if st.session_state.diversion_active:
        st.error("⏸️ Live feed paused — Diversion Protocol active")

    # ── Tournament fixtures ──────────────────────────────────────────
    st.markdown("---")
    st.markdown(f"<h3 style='color:{THEME['secondary']};'>📅 Fixtures</h3>",
                unsafe_allow_html=True)

    st.markdown(f"""
    <div class="glass-card" style="padding:12px;">
        <p style="margin:0; color:{THEME['success']};">● TODAY</p>
        <p style="margin:0; font-weight:700; font-size:1.1rem;">RCB vs KKR — Match 57</p>
        <p style="margin:0; color:{THEME['text_muted']};">M. Chinnaswamy Stadium, 7:30 PM</p>
    </div>
    """, unsafe_allow_html=True)

    st.markdown(f"""
    <div class="glass-card" style="padding:12px;">
        <p style="margin:0; color:{THEME['text_muted']};">✓ YESTERDAY</p>
        <p style="margin:0;">GT beat SRH by 12 runs</p>
    </div>
    """, unsafe_allow_html=True)

    st.markdown(f"""
    <div class="glass-card" style="padding:12px;">
        <p style="margin:0; color:{THEME['warning']};">◷ TOMORROW</p>
        <p style="margin:0;">PBKS vs MI — 7:30 PM</p>
    </div>
    """, unsafe_allow_html=True)

    # ── Agent status ─────────────────────────────────────────────────
    st.markdown("---")
    st.markdown(f"<h3 style='color:{THEME['secondary']};'>🤖 Agents</h3>",
                unsafe_allow_html=True)
    st.caption("🔭 Scout · 🧠 Psychologist · 📚 Historian")
    st.progress(1.0, text="All agents ONLINE")


# ══════════════════════════════════════════════════════════════════════
#  TOP HEADER — LIVE SCOREBOARD
# ══════════════════════════════════════════════════════════════════════
current_ball = st.session_state.ball_count
score = fetch_live_score(current_ball, demo_mode=st.session_state.is_demo_mode)

st.markdown(f"""
<div class="glass-card" style="text-align:center; margin-bottom:16px;">
    <span style="font-size:0.85rem; color:{THEME['text_muted']}; text-transform:uppercase; letter-spacing:0.1em;">
        Live Scoreboard — Ball {current_ball + 1}
    </span>
</div>
""", unsafe_allow_html=True)

sc1, sc2, sc3, sc4 = st.columns(4)
batting = score.get("batting", "Team A")
target  = score.get("target", "—")
sc1.metric("🏏 Runs", f"{score['runs']}/{score['wickets']}")
sc2.metric("⏱️ Overs", score["overs"])
sc3.metric("📈 Run Rate", score["run_rate"])
sc4.metric("🎯 Target", target)
st.markdown("---")


# ══════════════════════════════════════════════════════════════════════
#  AGENTIC LOOP
# ══════════════════════════════════════════════════════════════════════
commentary = get_live_commentary(current_ball, demo_mode=st.session_state.is_demo_mode)
analysis = None
meme_url = ""

if commentary and not st.session_state.diversion_active:
    # 🧠 Psychologist
    analysis = analyze_commentary(commentary)

    # State bookkeeping
    if len(st.session_state.vibe_history) <= current_ball:
        st.session_state.vibe_history.append(analysis.vibe_score)
    else:
        st.session_state.vibe_history[current_ball] = analysis.vibe_score

    # Diversion Protocol check (< -6 for 2 consecutive)
    vh = st.session_state.vibe_history
    if len(vh) >= 2 and vh[-1] < -6 and vh[-2] < -6:
        st.session_state.diversion_active = True
        st.rerun()

    # 📚 Historian trigger on critical events
    if analysis.is_critical_event:
        ctx = get_historical_context(analysis.event_type)
        st.session_state.historian_insight = generate_historical_insight(
            analysis.event_type, ctx)
    else:
        st.session_state.historian_insight = None

    # 🎬 Executor
    meme_url = fetch_meme(analysis.fallback_mood)

    # Advance for next cycle
    st.session_state.ball_count += 1


# ══════════════════════════════════════════════════════════════════════
#  3-PANE LAYOUT
# ══════════════════════════════════════════════════════════════════════
left_col, right_col = st.columns([1.6, 1])

# ── LEFT: Live Feed + Tension Gauge + Vibe Trend ─────────────────────
with left_col:
    # Commentary card
    st.markdown(f"""
    <div class="glass-card" style="border-left: 4px solid {THEME['primary']};">
        <span style="color:{THEME['text_muted']}; font-size:0.8rem; text-transform:uppercase; letter-spacing:0.08em;">
            🎙️ Live Commentary
        </span>
        <p style="font-size:1.15rem; margin-top:8px; line-height:1.6;">{commentary}</p>
    </div>
    """, unsafe_allow_html=True)

    # Tension Gauge
    t_val = analysis.tension_index if analysis else (10 if st.session_state.diversion_active else 5)
    fig_gauge = go.Figure(go.Indicator(
        mode="gauge+number+delta",
        value=t_val,
        delta={"reference": 5, "increasing": {"color": THEME["danger"]}},
        title={"text": "Tension Meter", "font": {"color": THEME["secondary"], "size": 18}},
        number={"font": {"color": THEME["primary"], "size": 42}},
        gauge={
            "axis": {"range": [0, 10], "tickcolor": THEME["text_muted"]},
            "bar": {"color": THEME["gauge_bar"]},
            "bgcolor": THEME["gauge_bg"],
            "borderwidth": 1,
            "bordercolor": THEME["gauge_border"],
            "steps": THEME["gauge_steps"],
            "threshold": {
                "line": {"color": THEME["text"], "width": 3},
                "thickness": 0.8,
                "value": t_val,
            },
        },
    ))
    fig_gauge.update_layout(
        height=250,
        margin=dict(l=20, r=20, t=45, b=10),
        paper_bgcolor="rgba(0,0,0,0)",
        font={"color": THEME["text"]},
    )
    st.plotly_chart(fig_gauge, use_container_width=True)

    # Vibe Trend (Area Chart)
    if st.session_state.vibe_history:
        fig_area = go.Figure()
        fig_area.add_trace(go.Scatter(
            x=list(range(1, len(st.session_state.vibe_history) + 1)),
            y=st.session_state.vibe_history,
            mode="lines+markers",
            fill="tozeroy",
            fillcolor=THEME["area_fill"],
            line=dict(color=THEME["line_color"], width=3),
            marker=dict(size=7, color=THEME["secondary"]),
            name="Vibe Score",
        ))
        fig_area.update_layout(
            title={"text": "Vibe Trend", "font": {"color": THEME["secondary"]}},
            xaxis_title="Ball",
            yaxis=dict(range=[-10, 10], gridcolor="rgba(148,163,184,0.1)"),
            xaxis=dict(gridcolor="rgba(148,163,184,0.1)"),
            height=280,
            margin=dict(l=20, r=20, t=45, b=30),
            paper_bgcolor="rgba(0,0,0,0)",
            plot_bgcolor="rgba(0,0,0,0)",
            font={"color": THEME["text"]},
        )
        st.plotly_chart(fig_area, use_container_width=True)


# ── RIGHT: Agent Interventions / Diversion Protocol ──────────────────
with right_col:
    if st.session_state.diversion_active:
        # ── DIVERSION PROTOCOL UI ────────────────────────────────────
        st.markdown(f"""
        <div class="glass-card" style="border: 2px solid {THEME['danger']}; text-align:center;">
            <h3 style="color:{THEME['danger']} !important; margin-top:0;">🚨 DIVERSION PROTOCOL</h3>
            <p style="color:{THEME['text']}; font-size:1.05rem;">
                Your team is collapsing. The vibe is toxic.<br/>
                <strong>Need a distraction?</strong>
            </p>
        </div>
        """, unsafe_allow_html=True)

        if st.button("🍕 Order Comfort Food (Bengaluru)", use_container_width=True):
            with st.spinner("📞 Calling Swiggy API..."):
                st.session_state.diversion_message = mock_food_delivery_api()

        if st.button("📺 Switch to Netflix", use_container_width=True):
            with st.spinner("📡 Calling Streaming API..."):
                st.session_state.diversion_message = mock_netflix_api()

        if st.session_state.diversion_message:
            st.success(st.session_state.diversion_message)

        st.markdown("<br>", unsafe_allow_html=True)
        if st.button("⬅️ Back to Match", type="primary", use_container_width=True):
            st.session_state.diversion_active = False
            st.session_state.diversion_message = None
            st.rerun()

    else:
        # ── HISTORIAN ────────────────────────────────────────────────
        if st.session_state.historian_insight:
            st.markdown(f"""
            <div class="glass-card" style="border: 1px solid {THEME['secondary']};">
                <span style="color:{THEME['secondary']}; font-weight:700;">📚 The Historian</span>
                <p style="margin-top:8px; font-style:italic; line-height:1.6;">
                    "{st.session_state.historian_insight}"
                </p>
            </div>
            """, unsafe_allow_html=True)

        # ── MEME INTERVENTION ────────────────────────────────────────
        if meme_url:
            mood_label = analysis.fallback_mood.upper() if analysis else ""
            st.markdown(f"""
            <div class="glass-card" style="text-align:center;">
                <span style="color:{THEME['text_muted']}; font-size:0.8rem; text-transform:uppercase; letter-spacing:0.08em;">
                    🎭 Agent Mood: {mood_label}
                </span>
            </div>
            """, unsafe_allow_html=True)
            st.image(meme_url, use_container_width=True)

        # ── SAFETY FILTER ────────────────────────────────────────────
        if analysis:
            if analysis.tension_index >= 8:
                st.error("🚨 **HYPE ALERT** — Tension is through the roof!")
            elif analysis.vibe_score < -5:
                st.warning("⚠️ The vibe is taking a hit. Hold your breath...")

        # ── VIBE METRIC ──────────────────────────────────────────────
        if analysis:
            delta = 0
            if len(st.session_state.vibe_history) > 1:
                delta = st.session_state.vibe_history[-1] - st.session_state.vibe_history[-2]
            st.metric("Vibe Score", analysis.vibe_score, delta=delta)


# ══════════════════════════════════════════════════════════════════════
#  MATCH VODs — YouTube Integration
# ══════════════════════════════════════════════════════════════════════
st.markdown("---")
vod_toggle = st.checkbox("🎬 Show Match VODs (YouTube Highlights)")
if vod_toggle:
    query = f"{st.session_state.selected_team} IPL highlights 2026"
    videos = fetch_youtube_highlights(query)
    vod_cols = st.columns(len(videos))
    for i, vid in enumerate(videos):
        with vod_cols[i]:
            st.markdown(f"""
            <div class="glass-card" style="text-align:center; padding:12px;">
                <p style="font-size:0.85rem; font-weight:600;">{vid['title'][:50]}</p>
            </div>
            """, unsafe_allow_html=True)
            st.video(f"https://www.youtube.com/watch?v={vid['video_id']}")
