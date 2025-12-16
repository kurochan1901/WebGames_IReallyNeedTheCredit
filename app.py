from flask import Flask, render_template, request, redirect, url_for, session, flash, jsonify
import sqlite3, os, re
from getpass import getpass
from pathlib import Path
from functools import wraps

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
app = Flask(__name__, 
            template_folder=os.path.join(BASE_DIR, "templates"),
            static_folder=os.path.join(BASE_DIR, "static")
            )
app.config["SECRET_KEY"] = "dev-change-me"
DB_PATH = os.path.join(os.path.dirname(__file__), "users.db")

USERNAME_RE = re.compile(r"^[A-Za-z0-9]+$")
PWD_RE = re.compile(r"^(?=.*[A-Z])(?=.*\d)[A-Za-z\d!@#$%^&*()_\-+=\[\]{};:,.?/]{6,12}$")

def get_db():
    con = sqlite3.connect(DB_PATH)
    con.row_factory = sqlite3.Row
    return con

def ensure_schema():
    con = get_db()
    try:
        con.execute("PRAGMA foreign_keys = ON;")

        # Players table
        con.execute("""
        CREATE TABLE IF NOT EXISTS players (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            username TEXT UNIQUE NOT NULL
                CHECK (length(username) BETWEEN 1 AND 30)
                CHECK (username GLOB '[0-9A-Za-z]*'),
            password TEXT NOT NULL,
            created_at TEXT NOT NULL DEFAULT (datetime('now'))
        );
        """)

        # Game records table
        con.execute("""
        CREATE TABLE IF NOT EXISTS game_records (
            record_id  INTEGER PRIMARY KEY AUTOINCREMENT,
            username   TEXT NOT NULL,
            rounds     INTEGER NOT NULL CHECK (rounds >= 1),
            winner     TEXT NOT NULL CHECK (winner IN ('player','monster')),
            played_at  TEXT NOT NULL DEFAULT (datetime('now')),
            FOREIGN KEY (username) REFERENCES players(username) ON DELETE CASCADE
        );
        """)

        # Index on game_records
        con.execute("CREATE INDEX IF NOT EXISTS idx_game_records_username ON game_records(username);")
        con.execute("CREATE INDEX IF NOT EXISTS idx_game_records_played_at ON game_records(winner, played_at);")
    
        con.commit()
    finally:
        con.close()



@app.route("/")
def home():
    #test db connection
    '''
    print("DB_PATH =", DB_PATH)
    con = get_db()
    rows = con.execute("SELECT name FROM sqlite_master WHERE type='table'").fetchall()
    print("TABLES:", [r["name"] for r in rows])
    con.close()     
    '''
    con = get_db()
    try:
        recent_records = con.execute("""
            SELECT username, winner, rounds, played_at
            FROM game_records
            ORDER BY datetime(played_at) DESC
            LIMIT 5
        """).fetchall()
    finally:
        con.close()
    
    return render_template("home.html",
                           recent_records=recent_records,
                           logged_in=bool(session.get("player_id")),
                           username=session.get("username"))

@app.get("/login")
def login_form():
    return render_template("login.html")

@app.post("/login")
def login_submit():
    uname = (request.form.get("username") or "").strip()
    pwd   = (request.form.get("password") or "").strip()

    con = get_db()
    row = con.execute(
        "SELECT id, username, password FROM players WHERE username=?",
        (uname,)
    ).fetchone()
    con.close()

    if row is None:
        flash("查無此帳號，請先註冊。", "no_account")
        return redirect(url_for("login_form"))
    if row["password"] != pwd:
        flash("密碼錯誤。", "error")
        return redirect(url_for("login_form"))
    # 登入成功
    session["player_id"] = row["id"]
    session["username"]  = row["username"]
    flash("登入成功！", "ok")
    return redirect(url_for("home"))

@app.get("/register")
def register_form():
    return render_template("register.html")

@app.post("/register")
def register_submit():
    uname = (request.form.get("username") or "").strip()
    pwd   = (request.form.get("password") or "").strip()

    # 後端權威驗證
    if not USERNAME_RE.fullmatch(uname):
        flash("帳號僅允許英數字（A–Z, a–z, 0–9）。", "error")
        return redirect(url_for("register_form"))
    if not PWD_RE.fullmatch(pwd):
        flash("密碼需 6–12 碼，且至少 1 個大寫字母與 1 個數字。", "error")
        return redirect(url_for("register_form"))
    
    con = get_db()
    try:
        con.execute(
            "INSERT INTO players (username, password) VALUES (?, ?)",
            (uname, pwd)    # 純文字密碼（僅練習用）
        )
        con.commit()
        
    except sqlite3.IntegrityError:
        flash("此帳號已被註冊。", "error")
        return redirect(url_for("register_form"))
    
    finally:
        con.close()

    flash("註冊成功，請登入。", "ok")
    return redirect(url_for("login_form"))

@app.post("/logout")
def logout():
    session.clear()
    flash("已登出。", "ok")
    return redirect(url_for("home"))

@app.post("/api/records")
def api_add_record():
    if "username" not in session:
        return jsonify({"error": "未登入"}), 401
    
    data = request.get_json(silent=True) or {}
    rounds = data.get("rounds")
    winner = data.get("winner")

    if not isinstance(rounds, int) or rounds < 1:
        return jsonify({"error": "invalid rounds"}), 400
    if winner not in ["player", "monster"]:
        return jsonify({"error": "invalid winner"}), 400
    
    con = get_db()
    try:
        con.execute("PRAGMA foreign_keys = ON;")
        con.execute(
            "INSERT INTO game_records (username, rounds, winner) VALUES (?, ?, ?)",
            (session["username"], rounds, winner)
        )
        con.commit()
    finally:
        con.close()

    return jsonify({"ok": True})

@app.get("/leaderboard")
def leaderboard():
    con = get_db()
    try:
        # 通關: 玩家勝利&最少回合數
        best_wins = con.execute("""
        SELECT username, rounds, played_at
        FROM game_records
        WHERE winner = 'player'
        ORDER BY rounds ASC, played_at DESC
        LIMIT 20;
    """).fetchall()
        
        # 玩家總綁: 勝場/總場/勝率/平均勝利回合數
        summary = con.execute("""
        SELECT 
            username,
            SUM(CASE WHEN winner='player' THEN 1 ELSE 0 END) AS wins,
            COUNT(*) AS games,
            ROUND(1.0 * SUM(CASE WHEN winner='player' THEN 1 ELSE 0 END) / COUNT(*), 3) AS win_rate,
            ROUND(AVG(CASE WHEN winner='player' THEN rounds END), 2) AS avg_win_rounds,
            MAX(played_at) AS last_played_at
        FROM game_records
        GROUP BY username
        ORDER BY wins DESC, win_rate DESC, avg_win_rounds ASC, last_played_at DESC
        LIMIT 20;
        """).fetchall()

        return render_template("leaderboard.html",
                               best_wins=best_wins,
                               summary=summary)
    finally:
        con.close()

@app.route("/main_game")
def main_game():
    if 'player_id' not in session:
        return redirect(url_for('login_form'))  # 若未登入，重定向至登入頁面
    return render_template('maingame.html')

if __name__ == "__main__":
    ensure_schema()
    port = int(os.environ.get("PORT", 5000))
    app.run(host='0.0.0.0', port=5000, debug=False)