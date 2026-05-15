"""
database.py — SQLite database for VibeStump.
Thread-safe, WAL-mode, stores all match/score/commentary data.
"""

import sqlite3
import re
import threading
from pathlib import Path
from typing import Optional

DB_FILE = str(Path(__file__).parent / "vibestump.db")
_lock = threading.Lock()
_local = threading.local()


def get_conn() -> sqlite3.Connection:
    if not hasattr(_local, "conn") or _local.conn is None:
        _local.conn = sqlite3.connect(DB_FILE, check_same_thread=False)
        _local.conn.row_factory = sqlite3.Row
        _local.conn.execute("PRAGMA journal_mode=WAL")
        _local.conn.execute("PRAGMA busy_timeout=5000")
    return _local.conn


def init_db():
    conn = get_conn()
    with _lock:
        conn.executescript("""
            CREATE TABLE IF NOT EXISTS matches (
                id TEXT PRIMARY KEY,
                title TEXT NOT NULL,
                status TEXT DEFAULT 'LIVE',
                team1 TEXT DEFAULT '',
                team2 TEXT DEFAULT '',
                updated_at TEXT DEFAULT (datetime('now'))
            );

            CREATE TABLE IF NOT EXISTS live_scores (
                match_id TEXT PRIMARY KEY,
                batting_team TEXT DEFAULT '',
                bowling_team TEXT DEFAULT '',
                runs INTEGER DEFAULT 0,
                wickets INTEGER DEFAULT 0,
                overs TEXT DEFAULT '0.0',
                target TEXT DEFAULT '-',
                run_rate REAL DEFAULT 0.0,
                required_rate REAL DEFAULT 0.0,
                match_status TEXT DEFAULT '',
                raw_title TEXT DEFAULT '',
                updated_at TEXT DEFAULT (datetime('now'))
            );

            CREATE TABLE IF NOT EXISTS score_progression (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                match_id TEXT,
                batting_team TEXT DEFAULT '',
                overs TEXT,
                runs INTEGER,
                wickets INTEGER,
                recorded_at TEXT DEFAULT (datetime('now'))
            );

            CREATE TABLE IF NOT EXISTS commentary (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                match_id TEXT,
                text TEXT,
                event_type TEXT DEFAULT 'NONE',
                created_at TEXT DEFAULT (datetime('now'))
            );

            CREATE TABLE IF NOT EXISTS highlights (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                query TEXT,
                title TEXT,
                video_id TEXT UNIQUE,
                thumbnail TEXT,
                fetched_at TEXT DEFAULT (datetime('now'))
            );

            CREATE TABLE IF NOT EXISTS insights (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                match_id TEXT,
                text TEXT,
                event_type TEXT,
                created_at TEXT DEFAULT (datetime('now'))
            );

            CREATE TABLE IF NOT EXISTS memes (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                event_type TEXT,
                mood TEXT,
                url TEXT,
                fetched_at TEXT DEFAULT (datetime('now'))
            );

            CREATE TABLE IF NOT EXISTS points_table (
                team TEXT PRIMARY KEY,
                played INTEGER DEFAULT 0,
                won INTEGER DEFAULT 0,
                lost INTEGER DEFAULT 0,
                nr INTEGER DEFAULT 0,
                pts INTEGER DEFAULT 0,
                nrr TEXT DEFAULT '+0.000',
                updated_at TEXT DEFAULT (datetime('now'))
            );

            CREATE TABLE IF NOT EXISTS match_results (
                match_id TEXT PRIMARY KEY,
                winner TEXT DEFAULT '',
                margin TEXT DEFAULT '',
                venue TEXT DEFAULT '',
                match_date TEXT DEFAULT '',
                match_no TEXT DEFAULT '',
                team1_code TEXT DEFAULT '',
                team1_name TEXT DEFAULT '',
                team1_score TEXT DEFAULT '',
                team1_overs TEXT DEFAULT '',
                team2_code TEXT DEFAULT '',
                team2_name TEXT DEFAULT '',
                team2_score TEXT DEFAULT '',
                team2_overs TEXT DEFAULT '',
                player_of_match TEXT DEFAULT '',
                pom_performance TEXT DEFAULT '',
                top_bat_name TEXT DEFAULT '',
                top_bat_score TEXT DEFAULT '',
                top_bowl_name TEXT DEFAULT '',
                top_bowl_figures TEXT DEFAULT '',
                updated_at TEXT DEFAULT (datetime('now'))
            );
        """)
        conn.commit()
    # Migration: add batting_team column if missing
    try:
        conn.execute("ALTER TABLE score_progression ADD COLUMN batting_team TEXT DEFAULT ''")
        conn.commit()
    except Exception:
        pass  # Column already exists


# ── Matches ─────────────────────────────────────────────────────────

# Full IPL team name fragments — safe as substrings (long, unambiguous)
_IPL_TITLE_KEYWORDS = [
    "royal challengers", "chennai super kings", "mumbai indians",
    "kolkata knight riders", "sunrisers hyderabad", "delhi capitals",
    "rajasthan royals", "punjab kings", "gujarat titans", "lucknow super giants",
    "ipl", "indian premier league",
    # Cricbuzz seeded IDs always start with "cb_"
]
_IPL_SHORT_CODES_RE = re.compile(
    r'\b(RCB|CSK|MI|KKR|SRH|GT|DC|LSG|PBKS|RR)\b', re.IGNORECASE
)


def _is_ipl_title(title: str, match_id: str = "") -> bool:
    """Return True if the match title/ID belongs to an IPL match."""
    # Seeded Cricbuzz matches always have IDs starting with "cb_"
    if match_id.startswith("cb_") or match_id.startswith("upcoming_"):
        return True
    title_lower = title.lower()
    if any(kw in title_lower for kw in _IPL_TITLE_KEYWORDS):
        return True
    if _IPL_SHORT_CODES_RE.search(title):
        return True
    return False


def purge_non_ipl_matches() -> int:
    """Remove any match from the DB that is not an IPL match.
    Returns the number of matches deleted."""
    import re as _re
    conn = get_conn()
    rows = conn.execute("SELECT id, title FROM matches").fetchall()
    to_delete = [r["id"] for r in rows if not _is_ipl_title(r["title"], r["id"])]
    if not to_delete:
        return 0
    with _lock:
        for match_id in to_delete:
            conn.execute("DELETE FROM matches WHERE id = ?", (match_id,))
            conn.execute("DELETE FROM live_scores WHERE match_id = ?", (match_id,))
            conn.execute("DELETE FROM score_progression WHERE match_id = ?", (match_id,))
            conn.execute("DELETE FROM commentary WHERE match_id = ?", (match_id,))
            conn.execute("DELETE FROM insights WHERE match_id = ?", (match_id,))
        conn.commit()
    print(f"[DB] Purged {len(to_delete)} non-IPL match(es): {to_delete}")
    return len(to_delete)


def upsert_match(match_id: str, title: str, status: str, team1: str = "", team2: str = ""):
    conn = get_conn()
    with _lock:
        conn.execute(
            """INSERT INTO matches (id, title, status, team1, team2, updated_at)
               VALUES (?, ?, ?, ?, ?, datetime('now'))
               ON CONFLICT(id) DO UPDATE SET
                 title=excluded.title, status=excluded.status,
                 team1=excluded.team1, team2=excluded.team2,
                 updated_at=datetime('now')""",
            (match_id, title, status, team1, team2),
        )
        conn.commit()


def get_matches() -> list[dict]:
    conn = get_conn()
    rows = conn.execute("SELECT * FROM matches ORDER BY updated_at DESC").fetchall()
    return [dict(r) for r in rows]


# ── Live Scores ─────────────────────────────────────────────────────

def upsert_live_score(match_id: str, data: dict):
    conn = get_conn()
    with _lock:
        conn.execute(
            """INSERT INTO live_scores
                 (match_id, batting_team, bowling_team, runs, wickets, overs,
                  target, run_rate, required_rate, match_status, raw_title, updated_at)
               VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, datetime('now'))
               ON CONFLICT(match_id) DO UPDATE SET
                 batting_team=excluded.batting_team, bowling_team=excluded.bowling_team,
                 runs=excluded.runs, wickets=excluded.wickets, overs=excluded.overs,
                 target=excluded.target, run_rate=excluded.run_rate,
                 required_rate=excluded.required_rate, match_status=excluded.match_status,
                 raw_title=excluded.raw_title, updated_at=datetime('now')""",
            (
                match_id,
                data.get("batting_team", ""),
                data.get("bowling_team", ""),
                data.get("runs", 0),
                data.get("wickets", 0),
                data.get("overs", "0.0"),
                data.get("target", "-"),
                data.get("run_rate", 0.0),
                data.get("required_rate", 0.0),
                data.get("match_status", ""),
                data.get("raw_title", ""),
            ),
        )
        conn.commit()


def get_live_score(match_id: str) -> Optional[dict]:
    conn = get_conn()
    row = conn.execute("SELECT * FROM live_scores WHERE match_id = ?", (match_id,)).fetchone()
    if row:
        return dict(row)

    # Fallback: synthesize from match_results so completed matches show a scorecard
    result = conn.execute("SELECT * FROM match_results WHERE match_id = ?", (match_id,)).fetchone()
    if not result:
        return None
    r = dict(result)

    def _parse(s: str):
        try:
            parts = s.split("/")
            return int(parts[0]), int(parts[1]) if len(parts) > 1 else 10
        except Exception:
            return 0, 0

    t1_r, t1_w = _parse(r.get("team1_score", "0/0"))
    t2_r, t2_w = _parse(r.get("team2_score", "0/0"))
    team1_code = r.get("team1_code", "")
    team2_code = r.get("team2_code", "")
    team1_name = r.get("team1_name", team1_code)
    team2_name = r.get("team2_name", team2_code)
    winner_code = r.get("winner", "")

    # raw_title format understood by Scoreboard's parseInnings():
    # "PBKS 200/8 v MI 205/4"
    raw_title = (
        f"{team1_code} {r.get('team1_score', '?')} v "
        f"{team2_code} {r.get('team2_score', '?')}"
    )

    # Highlight winner as "batting_team" so Scoreboard shows them prominently
    if winner_code.upper() == team2_code.upper():
        batting_team = team2_name
        bowling_team = team1_name
        runs, wickets = t2_r, t2_w
        overs = r.get("team2_overs", "20.0") or "20.0"
    else:
        batting_team = team1_name
        bowling_team = team2_name
        runs, wickets = t1_r, t1_w
        overs = r.get("team1_overs", "20.0") or "20.0"

    status = r.get("status", "")
    if not status and winner_code:
        winner_full = team1_name if winner_code.upper() == team1_code.upper() else team2_name
        margin = r.get("margin", "")
        status = f"{winner_full} won by {margin}" if margin else f"{winner_full} won"

    return {
        "match_id": match_id,
        "batting_team": batting_team,
        "bowling_team": bowling_team,
        "runs": runs,
        "wickets": wickets,
        "overs": overs,
        "target": "-",
        "run_rate": 0.0,
        "required_rate": 0.0,
        "match_status": status or "COMPLETED",
        "raw_title": raw_title,
        "updated_at": r.get("updated_at", ""),
    }


def get_all_live_scores() -> list[dict]:
    conn = get_conn()
    rows = conn.execute("SELECT * FROM live_scores ORDER BY updated_at DESC").fetchall()
    return [dict(r) for r in rows]


# ── Score Progression ───────────────────────────────────────────────

def add_score_point(match_id: str, overs: str, runs: int, wickets: int, batting_team: str = ""):
    conn = get_conn()
    with _lock:
        conn.execute(
            "INSERT INTO score_progression (match_id, batting_team, overs, runs, wickets) VALUES (?, ?, ?, ?, ?)",
            (match_id, batting_team, overs, runs, wickets),
        )
        conn.commit()


def get_score_progression(match_id: str) -> list[dict]:
    conn = get_conn()
    rows = conn.execute(
        "SELECT batting_team, overs, runs, wickets FROM score_progression WHERE match_id = ? ORDER BY id",
        (match_id,),
    ).fetchall()
    return [dict(r) for r in rows]


# ── Commentary ──────────────────────────────────────────────────────

def add_commentary(match_id: str, text: str, event_type: str = "NONE"):
    conn = get_conn()
    with _lock:
        conn.execute(
            "INSERT INTO commentary (match_id, text, event_type) VALUES (?, ?, ?)",
            (match_id, text, event_type),
        )
        conn.commit()


def get_commentary(match_id: str, limit: int = 30) -> list[dict]:
    conn = get_conn()
    rows = conn.execute(
        "SELECT text, event_type, created_at FROM commentary WHERE match_id = ? ORDER BY id DESC LIMIT ?",
        (match_id, limit),
    ).fetchall()
    return [dict(r) for r in rows]


# ── Highlights ──────────────────────────────────────────────────────

def add_highlight(query: str, title: str, video_id: str, thumbnail: str):
    conn = get_conn()
    with _lock:
        conn.execute(
            "INSERT OR IGNORE INTO highlights (query, title, video_id, thumbnail) VALUES (?, ?, ?, ?)",
            (query, title, video_id, thumbnail),
        )
        conn.commit()


def get_highlights(limit: int = 6) -> list[dict]:
    conn = get_conn()
    rows = conn.execute(
        "SELECT title, video_id, thumbnail FROM highlights ORDER BY fetched_at DESC LIMIT ?",
        (limit,),
    ).fetchall()
    return [dict(r) for r in rows]


# ── Insights ────────────────────────────────────────────────────────

def add_insight(match_id: str, text: str, event_type: str):
    conn = get_conn()
    with _lock:
        conn.execute(
            "INSERT INTO insights (match_id, text, event_type) VALUES (?, ?, ?)",
            (match_id, text, event_type),
        )
        conn.commit()


def get_insights(match_id: str, limit: int = 10) -> list[dict]:
    conn = get_conn()
    rows = conn.execute(
        "SELECT text, event_type, created_at FROM insights WHERE match_id = ? ORDER BY id DESC LIMIT ?",
        (match_id, limit),
    ).fetchall()
    return [dict(r) for r in rows]


# ── Memes ───────────────────────────────────────────────────────────

def add_meme(event_type: str, mood: str, url: str):
    conn = get_conn()
    with _lock:
        conn.execute(
            "INSERT INTO memes (event_type, mood, url) VALUES (?, ?, ?)",
            (event_type, mood, url),
        )
        conn.commit()


def get_latest_meme(event_type: str = "") -> Optional[str]:
    conn = get_conn()
    if event_type:
        row = conn.execute(
            "SELECT url FROM memes WHERE event_type = ? ORDER BY fetched_at DESC LIMIT 1",
            (event_type,),
        ).fetchone()
    else:
        row = conn.execute("SELECT url FROM memes ORDER BY fetched_at DESC LIMIT 1").fetchone()
    return row["url"] if row else None


# ── Points Table ────────────────────────────────────────────────────

def upsert_points_row(team: str, played: int, won: int, lost: int, nr: int, pts: int, nrr: str):
    conn = get_conn()
    with _lock:
        conn.execute(
            """INSERT INTO points_table (team, played, won, lost, nr, pts, nrr, updated_at)
               VALUES (?, ?, ?, ?, ?, ?, ?, datetime('now'))
               ON CONFLICT(team) DO UPDATE SET
                 played=excluded.played, won=excluded.won, lost=excluded.lost,
                 nr=excluded.nr, pts=excluded.pts, nrr=excluded.nrr,
                 updated_at=datetime('now')""",
            (team, played, won, lost, nr, pts, nrr),
        )
        conn.commit()


def get_points_table() -> list[dict]:
    conn = get_conn()
    rows = conn.execute("SELECT * FROM points_table ORDER BY pts DESC, nrr DESC").fetchall()
    return [dict(r) for r in rows]


# ── Match Results ───────────────────────────────────────────────────

def upsert_match_result(match_id: str, data: dict):
    conn = get_conn()
    with _lock:
        conn.execute("""
            INSERT INTO match_results
              (match_id, winner, margin, venue, match_date, match_no,
               team1_code, team1_name, team1_score, team1_overs,
               team2_code, team2_name, team2_score, team2_overs,
               player_of_match, pom_performance,
               top_bat_name, top_bat_score, top_bowl_name, top_bowl_figures)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            ON CONFLICT(match_id) DO UPDATE SET
              winner=excluded.winner, margin=excluded.margin,
              venue=excluded.venue, match_date=excluded.match_date,
              match_no=excluded.match_no,
              team1_score=excluded.team1_score, team1_overs=excluded.team1_overs,
              team2_score=excluded.team2_score, team2_overs=excluded.team2_overs,
              player_of_match=excluded.player_of_match,
              pom_performance=excluded.pom_performance,
              top_bat_name=excluded.top_bat_name, top_bat_score=excluded.top_bat_score,
              top_bowl_name=excluded.top_bowl_name, top_bowl_figures=excluded.top_bowl_figures,
              updated_at=datetime('now')
        """, (
            match_id, data.get('winner', ''), data.get('margin', ''),
            data.get('venue', ''), data.get('match_date', ''), data.get('match_no', ''),
            data.get('team1_code', ''), data.get('team1_name', ''),
            data.get('team1_score', ''), data.get('team1_overs', ''),
            data.get('team2_code', ''), data.get('team2_name', ''),
            data.get('team2_score', ''), data.get('team2_overs', ''),
            data.get('player_of_match', ''), data.get('pom_performance', ''),
            data.get('top_bat_name', ''), data.get('top_bat_score', ''),
            data.get('top_bowl_name', ''), data.get('top_bowl_figures', ''),
        ))
        conn.commit()


def get_match_result(match_id: str) -> Optional[dict]:
    conn = get_conn()
    row = conn.execute(
        "SELECT * FROM match_results WHERE match_id = ?", (match_id,)
    ).fetchone()
    return dict(row) if row else None


def get_completed_matches() -> list[dict]:
    """Returns all COMPLETED matches joined with their rich result details."""
    conn = get_conn()
    rows = conn.execute("""
        SELECT
            m.id, m.title, m.team1, m.team2, m.status,
            COALESCE(mr.winner, '')          AS winner,
            COALESCE(mr.margin, '')          AS margin,
            COALESCE(mr.venue, '')           AS venue,
            COALESCE(mr.match_date, '')      AS match_date,
            COALESCE(mr.match_no, '')        AS match_no,
            COALESCE(mr.team1_code, m.team1) AS team1_code,
            COALESCE(mr.team1_name, m.team1) AS team1_name,
            COALESCE(mr.team1_score, '')     AS team1_score,
            COALESCE(mr.team1_overs, '')     AS team1_overs,
            COALESCE(mr.team2_code, m.team2) AS team2_code,
            COALESCE(mr.team2_name, m.team2) AS team2_name,
            COALESCE(mr.team2_score, '')     AS team2_score,
            COALESCE(mr.team2_overs, '')     AS team2_overs,
            COALESCE(mr.player_of_match, '') AS player_of_match,
            COALESCE(mr.pom_performance, '') AS pom_performance,
            COALESCE(mr.top_bat_name, '')    AS top_bat_name,
            COALESCE(mr.top_bat_score, '')   AS top_bat_score,
            COALESCE(mr.top_bowl_name, '')   AS top_bowl_name,
            COALESCE(mr.top_bowl_figures,'') AS top_bowl_figures
        FROM matches m
        LEFT JOIN match_results mr ON m.id = mr.match_id
        WHERE m.status = 'COMPLETED'
        ORDER BY mr.match_date DESC, m.updated_at DESC
    """).fetchall()
    return [dict(r) for r in rows]


# Initialize on import
init_db()
