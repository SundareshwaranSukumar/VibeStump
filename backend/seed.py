"""
seed.py — Seed the database with realistic IPL 2026 demo data.
Run once on startup when the DB is empty, or via: python seed.py
"""

import random
from database import (
    init_db, get_conn, _lock,
    upsert_match, upsert_live_score, add_score_point,
    add_commentary, add_insight, upsert_match_result,
)


# ── Points Table Data (IPL 2026 realistic standings) ─────────────────

POINTS_TABLE = [
    {"team": "RCB", "played": 10, "won": 7, "lost": 2, "nr": 1, "pts": 15, "nrr": "+0.742"},
    {"team": "KKR", "played": 10, "won": 7, "lost": 3, "nr": 0, "pts": 14, "nrr": "+0.631"},
    {"team": "MI",  "played": 10, "won": 6, "lost": 3, "nr": 1, "pts": 13, "nrr": "+0.289"},
    {"team": "CSK", "played": 10, "won": 6, "lost": 4, "nr": 0, "pts": 12, "nrr": "+0.412"},
    {"team": "GT",  "played": 10, "won": 5, "lost": 4, "nr": 1, "pts": 11, "nrr": "+0.103"},
    {"team": "SRH", "played": 10, "won": 5, "lost": 5, "nr": 0, "pts": 10, "nrr": "-0.084"},
    {"team": "DC",  "played": 10, "won": 4, "lost": 5, "nr": 1, "pts": 9,  "nrr": "-0.187"},
    {"team": "RR",  "played": 10, "won": 4, "lost": 6, "nr": 0, "pts": 8,  "nrr": "-0.254"},
    {"team": "LSG", "played": 10, "won": 3, "lost": 7, "nr": 0, "pts": 6,  "nrr": "-0.502"},
    {"team": "PBKS","played": 10, "won": 2, "lost": 7, "nr": 1, "pts": 5,  "nrr": "-0.891"},
]

# ── Upcoming Matches ──────────────────────────────────────────────────

UPCOMING_MATCHES = [
    {
        "id": "upcoming_1",
        "team1": "RCB",
        "team2": "KKR",
        "venue": "M. Chinnaswamy Stadium, Bengaluru",
        "date": "2026-05-15",
        "time": "19:30",
        "match_no": "Match 42",
    },
    {
        "id": "upcoming_2",
        "team1": "MI",
        "team2": "SRH",
        "venue": "Wankhede Stadium, Mumbai",
        "date": "2026-05-16",
        "time": "15:30",
        "match_no": "Match 43",
    },
    {
        "id": "upcoming_3",
        "team1": "DC",
        "team2": "GT",
        "venue": "Arun Jaitley Stadium, Delhi",
        "date": "2026-05-16",
        "time": "19:30",
        "match_no": "Match 44",
    },
    {
        "id": "upcoming_4",
        "team1": "RR",
        "team2": "LSG",
        "venue": "Sawai Mansingh Stadium, Jaipur",
        "date": "2026-05-17",
        "time": "15:30",
        "match_no": "Match 45",
    },
    {
        "id": "upcoming_5",
        "team1": "PBKS",
        "team2": "CSK",
        "venue": "IS Bindra Stadium, Mohali",
        "date": "2026-05-18",
        "time": "19:30",
        "match_no": "Match 46",
    },
]

# ── Demo Live Match ───────────────────────────────────────────────────

DEMO_MATCH_ID = "ipl2026_match41_cskvmi"

DEMO_COMMENTARY = [
    ("CSK openers Conway and Gaikwad stride out. The stadium is electric!", "NONE"),
    ("Conway drives beautifully through covers — FOUR! What a shot!", "FOUR"),
    ("Jasprit Bumrah steams in... OUT! Conway caught at slip for 28. Huge wicket!", "WICKET"),
    ("Jadeja walks in. CSK need 145 from here. Game on!", "NONE"),
    ("Gaikwad heaves Bumrah over long-on — SIX! 95 metres at least!", "SIX"),
    ("Jadeja sweeps Piyush Chawla for FOUR! IPL experience showing.", "FOUR"),
    ("CSK 89/2 in 12 overs. Run rate: 7.42. Target: 172.", "RUNS"),
    ("Hardik bowls a full toss — Jadeja smashes it for SIX! 50 off 31 balls!", "SIX"),
    ("WICKET! Jadeja stumped by Ishan Kishan off Krunal Pandya. Brilliant keeping!", "WICKET"),
    ("Dhoni strides in. The crowd goes absolutely berserk. CSK 112/3 in 15 overs.", "NONE"),
    ("Dhoni hits his first ball for SIX over square leg! Vintage stuff!", "SIX"),
    ("16 needed off last 2 overs. This could go either way!", "RUNS"),
    ("Gaikwad pulls Bumrah for FOUR! Championship experience.", "FOUR"),
    ("Dhoni needs 8 off 3 balls... steers it for FOUR! What a finish!", "FOUR"),
    ("CSK win by 3 wickets! Thala Dhoni finishes it off in style. Unbelievable scenes!", "NONE"),
]


def seed_points_table():
    """Seed the IPL 2026 points table."""
    conn = get_conn()
    with _lock:
        conn.execute("DELETE FROM points_table")
        for row in POINTS_TABLE:
            conn.execute(
                """INSERT INTO points_table (team, played, won, lost, nr, pts, nrr)
                   VALUES (?, ?, ?, ?, ?, ?, ?)
                   ON CONFLICT(team) DO UPDATE SET
                     played=excluded.played, won=excluded.won, lost=excluded.lost,
                     nr=excluded.nr, pts=excluded.pts, nrr=excluded.nrr""",
                (row["team"], row["played"], row["won"], row["lost"],
                 row["nr"], row["pts"], row["nrr"]),
            )
        conn.commit()
    print(f"[Seed] Points table seeded with {len(POINTS_TABLE)} teams")


def seed_upcoming_matches():
    """Seed upcoming matches into a dedicated table."""
    conn = get_conn()
    with _lock:
        conn.execute("""
            CREATE TABLE IF NOT EXISTS upcoming_matches (
                id TEXT PRIMARY KEY,
                team1 TEXT,
                team2 TEXT,
                venue TEXT,
                date TEXT,
                time TEXT,
                match_no TEXT,
                updated_at TEXT DEFAULT (datetime('now'))
            )
        """)
        conn.execute("DELETE FROM upcoming_matches")
        for m in UPCOMING_MATCHES:
            conn.execute(
                """INSERT INTO upcoming_matches (id, team1, team2, venue, date, time, match_no)
                   VALUES (?, ?, ?, ?, ?, ?, ?)""",
                (m["id"], m["team1"], m["team2"], m["venue"],
                 m["date"], m["time"], m["match_no"]),
            )
        conn.commit()
    print(f"[Seed] Upcoming matches seeded: {len(UPCOMING_MATCHES)}")


def seed_demo_match():
    """Seed a realistic demo live match: CSK vs MI."""
    # Insert match
    upsert_match(
        DEMO_MATCH_ID,
        "CSK vs MI, IPL 2026 — Match 41",
        "LIVE",
        "CSK",
        "MI",
    )

    # Insert live score (CSK batting, chasing 172)
    upsert_live_score(DEMO_MATCH_ID, {
        "batting_team": "Chennai Super Kings",
        "bowling_team": "Mumbai Indians",
        "runs": 158,
        "wickets": 7,
        "overs": "19.3",
        "target": "172",
        "run_rate": 8.10,
        "required_rate": 28.0,
        "match_status": "CSK won by 3 wickets",
        "raw_title": "CSK 158/7 (19.3 ov) v MI 171/6 (20 ov) — CSK won by 3 wickets",
    })

    # Seed score progression — MI first innings + CSK second innings (both stored under same match_id)
    conn = get_conn()
    with _lock:
        conn.execute("DELETE FROM score_progression WHERE match_id = ?", (DEMO_MATCH_ID,))
        conn.commit()
    # MI first innings (20 overs — 171/6)
    mi_innings = [
        ("2.0", 15, 0), ("4.0", 32, 1), ("6.0", 48, 1), ("8.0", 68, 2),
        ("10.0", 87, 2), ("12.0", 104, 3), ("14.0", 122, 4),
        ("16.0", 143, 4), ("18.0", 158, 5), ("20.0", 171, 6),
    ]
    for overs, runs, wickets in mi_innings:
        add_score_point(DEMO_MATCH_ID, overs, runs, wickets, batting_team="MI")
    # CSK second innings (chasing 172 — 158/7 in 19.3)
    csk_innings = [
        ("2.0", 18, 0), ("4.0", 34, 1), ("6.0", 52, 1), ("8.0", 71, 2),
        ("10.0", 89, 2), ("12.0", 104, 2), ("14.0", 118, 3),
        ("16.0", 135, 4), ("18.0", 149, 5), ("19.3", 158, 7),
    ]
    for overs, runs, wickets in csk_innings:
        add_score_point(DEMO_MATCH_ID, overs, runs, wickets, batting_team="CSK")

    # Seed commentary
    conn = get_conn()
    with _lock:
        conn.execute("DELETE FROM commentary WHERE match_id = ?", (DEMO_MATCH_ID,))
        conn.commit()
    for text, event_type in DEMO_COMMENTARY:
        add_commentary(DEMO_MATCH_ID, text, event_type)

    # Seed insights
    insights = [
        ("CSK's chase master Ruturaj Gaikwad has now scored 6 consecutive 40+ scores this IPL season, making him the most consistent opener in the tournament.", "RUNS"),
        ("Jasprit Bumrah's wicket of Conway was his 175th in IPL history, cementing his position as the all-time leading wicket-taker in the tournament.", "WICKET"),
        ("When Dhoni comes in with CSK needing under 40 runs, CSK's win percentage is an astonishing 87% — the best finishing record in IPL history.", "NONE"),
    ]
    conn = get_conn()
    with _lock:
        conn.execute("DELETE FROM insights WHERE match_id = ?", (DEMO_MATCH_ID,))
        conn.commit()
    for text, event_type in insights:
        add_insight(DEMO_MATCH_ID, text, event_type)

    print(f"[Seed] Demo match seeded: {DEMO_MATCH_ID}")


# ── Second active match: RCB vs KKR ──────────────────────────────────

MATCH2_ID = "ipl2026_match40_rcbvkkr"

def seed_second_match():
    """Seed RCB vs KKR as a completed match."""
    upsert_match(
        MATCH2_ID,
        "RCB vs KKR, IPL 2026 — Match 40",
        "LIVE",
        "RCB",
        "KKR",
    )
    upsert_live_score(MATCH2_ID, {
        "batting_team": "Royal Challengers Bengaluru",
        "bowling_team": "Kolkata Knight Riders",
        "runs": 82,
        "wickets": 3,
        "overs": "11.2",
        "target": "-",
        "run_rate": 7.24,
        "required_rate": 0.0,
        "match_status": "RCB batting",
        "raw_title": "RCB 82/3 (11.2 ov) v KKR — Live",
    })

    progression = [
        ("2.0", 21, 0), ("4.0", 38, 1), ("6.0", 51, 2), ("8.0", 64, 2),
        ("10.0", 75, 3), ("11.2", 82, 3),
    ]
    conn = get_conn()
    with _lock:
        conn.execute("DELETE FROM score_progression WHERE match_id = ?", (MATCH2_ID,))
        conn.commit()
    for overs, runs, wickets in progression:
        add_score_point(MATCH2_ID, overs, runs, wickets, batting_team="RCB")

    commentary = [
        ("KKR win the toss and choose to field first. Smart move on a batting-friendly pitch!", "NONE"),
        ("RCB openers Kohli and du Plessis open confidently. The Chinnaswamy crowd is roaring!", "NONE"),
        ("WICKET! du Plessis caught at mid-on off Varun Chakravarthy for 19.", "WICKET"),
        ("Kohli drives Narine through covers for FOUR! Beautiful timing.", "FOUR"),
        ("WICKET! Kohli nicks one to the keeper off Harshit Rana. Out for 35.", "WICKET"),
        ("Maxwell comes in. He's been in brilliant form this season!", "NONE"),
        ("Maxwell smashes Narine over long-on for SIX! 100 metres that ball!", "SIX"),
        ("RCB 82/3 after 11.2 overs. Maxwell 24*, Rajat 8*. Game well alive.", "RUNS"),
    ]
    conn = get_conn()
    with _lock:
        conn.execute("DELETE FROM commentary WHERE match_id = ?", (MATCH2_ID,))
        conn.commit()
    for text, event_type in commentary:
        add_commentary(MATCH2_ID, text, event_type)
    print(f"[Seed] Second match seeded: {MATCH2_ID}")


def is_db_seeded() -> bool:
    """Check if the database already has match data."""
    conn = get_conn()
    count = conn.execute("SELECT COUNT(*) FROM matches").fetchone()[0]
    return count > 0


# ── Completed (previous) matches ────────────────────────────────────────

PREV_MATCHES = [
    {
        "id": "ipl2026_match37_srhvgt",
        "title": "SRH vs GT, IPL 2026 — Match 37",
        "team1": "SRH", "team2": "GT",
        "score": {"batting_team": "Gujarat Titans", "bowling_team": "Sunrisers Hyderabad",
                  "runs": 167, "wickets": 8, "overs": "20.0", "target": "169",
                  "run_rate": 8.35, "required_rate": 0.0,
                  "match_status": "SRH won by 1 run",
                  "raw_title": "GT 167/8 (20 ov) v SRH 168/5 (19.4 ov) — SRH won by 1 run"},
        "commentary": [
            ("SRH pull off a thriller! They needed 7 off the last over and got them.", "NONE"),
            ("Umran Malik bowled SRH to victory with two wickets in the final over!", "WICKET"),
        ],
    },
    {
        "id": "ipl2026_match38_mivdc",
        "title": "MI vs DC, IPL 2026 — Match 38",
        "team1": "MI", "team2": "DC",
        "score": {"batting_team": "Delhi Capitals", "bowling_team": "Mumbai Indians",
                  "runs": 142, "wickets": 10, "overs": "19.2", "target": "178",
                  "run_rate": 7.33, "required_rate": 0.0,
                  "match_status": "MI won by 35 runs",
                  "raw_title": "DC 142/10 (19.2 ov) v MI 177/5 (20 ov) — MI won by 35 runs"},
        "commentary": [
            ("MI defend 178 convincingly. Bumrah's 4-wicket haul was the difference!", "NONE"),
            ("Rohit's 62 set up the total. DC never really got going.", "RUNS"),
        ],
    },
    {
        "id": "ipl2026_match39_rrvpbks",
        "title": "RR vs PBKS, IPL 2026 — Match 39",
        "team1": "RR", "team2": "PBKS",
        "score": {"batting_team": "Rajasthan Royals", "bowling_team": "Punjab Kings",
                  "runs": 189, "wickets": 4, "overs": "20.0", "target": "172",
                  "run_rate": 9.45, "required_rate": 0.0,
                  "match_status": "RR won by 17 runs",
                  "raw_title": "RR 189/4 (20 ov) v PBKS 172/8 (20 ov) — RR won by 17 runs"},
        "commentary": [
            ("Jos Buttler smashed 87 off 45 balls to take RR to an imposing total!", "NONE"),
            ("PBKS fell short despite Livingstone's 64. RR win by 17 runs.", "NONE"),
        ],
    },
]


def seed_previous_matches():
    """Seed completed previous matches."""
    for m in PREV_MATCHES:
        upsert_match(m["id"], m["title"], "COMPLETED", m["team1"], m["team2"])
        upsert_live_score(m["id"], m["score"])
        for text, event_type in m["commentary"]:
            add_commentary(m["id"], text, event_type)
    print(f"[Seed] Previous matches seeded: {len(PREV_MATCHES)}")


# ── Rich Match Results (for Results tab scorecards) ────────────────────

COMPLETED_RESULTS = [
    {
        "match_id": "ipl2026_match37_srhvgt",
        "winner": "SRH",
        "margin": "1 run",
        "venue": "Rajiv Gandhi Intl. Stadium, Hyderabad",
        "match_date": "2026-05-10",
        "match_no": "Match 37",
        "team1_code": "SRH",
        "team1_name": "Sunrisers Hyderabad",
        "team1_score": "168/5",
        "team1_overs": "19.4",
        "team2_code": "GT",
        "team2_name": "Gujarat Titans",
        "team2_score": "167/8",
        "team2_overs": "20.0",
        "player_of_match": "Umran Malik",
        "pom_performance": "3/28 in 4 overs",
        "top_bat_name": "Shubman Gill",
        "top_bat_score": "72 (49)",
        "top_bowl_name": "Umran Malik",
        "top_bowl_figures": "3/28",
    },
    {
        "match_id": "ipl2026_match38_mivdc",
        "winner": "MI",
        "margin": "35 runs",
        "venue": "Wankhede Stadium, Mumbai",
        "match_date": "2026-05-11",
        "match_no": "Match 38",
        "team1_code": "MI",
        "team1_name": "Mumbai Indians",
        "team1_score": "177/5",
        "team1_overs": "20.0",
        "team2_code": "DC",
        "team2_name": "Delhi Capitals",
        "team2_score": "142/10",
        "team2_overs": "19.2",
        "player_of_match": "Jasprit Bumrah",
        "pom_performance": "4/21 in 4 overs",
        "top_bat_name": "Rohit Sharma",
        "top_bat_score": "62 (38)",
        "top_bowl_name": "Jasprit Bumrah",
        "top_bowl_figures": "4/21",
    },
    {
        "match_id": "ipl2026_match39_rrvpbks",
        "winner": "RR",
        "margin": "17 runs",
        "venue": "Sawai Mansingh Stadium, Jaipur",
        "match_date": "2026-05-12",
        "match_no": "Match 39",
        "team1_code": "RR",
        "team1_name": "Rajasthan Royals",
        "team1_score": "189/4",
        "team1_overs": "20.0",
        "team2_code": "PBKS",
        "team2_name": "Punjab Kings",
        "team2_score": "172/8",
        "team2_overs": "20.0",
        "player_of_match": "Jos Buttler",
        "pom_performance": "87 off 45 balls",
        "top_bat_name": "Jos Buttler",
        "top_bat_score": "87 (45)",
        "top_bowl_name": "Trent Boult",
        "top_bowl_figures": "3/31",
    },
    {
        "match_id": "ipl2026_match41_cskvmi",
        "winner": "CSK",
        "margin": "3 wickets",
        "venue": "MA Chidambaram Stadium, Chennai",
        "match_date": "2026-05-14",
        "match_no": "Match 41",
        "team1_code": "CSK",
        "team1_name": "Chennai Super Kings",
        "team1_score": "158/7",
        "team1_overs": "19.3",
        "team2_code": "MI",
        "team2_name": "Mumbai Indians",
        "team2_score": "171/6",
        "team2_overs": "20.0",
        "player_of_match": "MS Dhoni",
        "pom_performance": "18* (6) & leadership",
        "top_bat_name": "Ruturaj Gaikwad",
        "top_bat_score": "72 (51)",
        "top_bowl_name": "Jasprit Bumrah",
        "top_bowl_figures": "2/28",
    },
]


def seed_match_results():
    """Seed rich match result details. Idempotent — skips if already present."""
    conn = get_conn()
    try:
        count = conn.execute("SELECT COUNT(*) FROM match_results").fetchone()[0]
        if count >= len(COMPLETED_RESULTS):
            return
    except Exception:
        pass
    for result in COMPLETED_RESULTS:
        upsert_match_result(result["match_id"], result)
    print(f"[Seed] Match results seeded: {len(COMPLETED_RESULTS)}")


def run_seed(force: bool = False):
    """Run full seed — only if DB is empty or forced."""
    init_db()
    if not force and is_db_seeded():
        print("[Seed] Database already seeded. Skipping.")
        # Always refresh points table and upcoming matches
        seed_points_table()
        seed_upcoming_matches()
        seed_match_results()  # always ensure results are seeded
        return

    print("[Seed] Seeding database with IPL 2026 demo data...")
    seed_demo_match()
    seed_second_match()
    seed_previous_matches()
    seed_points_table()
    seed_upcoming_matches()
    seed_match_results()
    print("[Seed] Done!")


if __name__ == "__main__":
    import sys
    force = "--force" in sys.argv
    run_seed(force=force)
