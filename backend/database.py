import sqlite3
import json

DB_FILE = "vibestump.db"

def init_db():
    conn = sqlite3.connect(DB_FILE)
    cursor = conn.cursor()
    cursor.execute("""
        CREATE TABLE IF NOT EXISTS matches (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
            ball_number INTEGER,
            batting_team TEXT,
            bowling_team TEXT,
            runs INTEGER,
            wickets INTEGER,
            overs REAL,
            run_rate REAL,
            commentary TEXT,
            is_live BOOLEAN
        )
    """)
    conn.commit()
    conn.close()

def store_match_event(ball: int, data: dict, commentary: str, is_live: bool):
    conn = sqlite3.connect(DB_FILE)
    cursor = conn.cursor()
    cursor.execute("""
        INSERT INTO matches (ball_number, batting_team, bowling_team, runs, wickets, overs, run_rate, commentary, is_live)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    """, (
        ball,
        data.get("batting", ""),
        data.get("bowling", ""),
        data.get("runs", 0),
        data.get("wickets", 0),
        data.get("overs", 0.0),
        data.get("run_rate", 0.0),
        commentary,
        is_live
    ))
    conn.commit()
    conn.close()

# Initialize DB on import
init_db()
