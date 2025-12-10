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
    con.commit()
    con.close()

@app.route("/")
def home():
    return render_template("home.html",
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
        "SELECT id, username, password FROM User WHERE id=?",
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
            "INSERT INTO User (username, password) VALUES (?, ?)",
            (uname, pwd)    # 純文字密碼（僅練習用）
        )
        con.commit()
    except sqlite3.IntegrityError:
        flash("此帳號已被註冊。", "error")
        con.close()
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

@app.get("/play")
def play_hub():
    if not session.get("player_id"):
        flash("請先登入再開始遊戲。", "error")
        return redirect(url_for("home"))
    return "（這裡之後放你的遊戲 Hub 頁面或導向 /games）"

if __name__ == "__main__":
    ensure_schema()
    app.run(debug=True)