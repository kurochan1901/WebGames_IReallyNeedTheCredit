// 排行版 分頁形式 按分頁切換

console.log("[leaderboard] loaded");        // debug

(() => {
    "use strict";

    const elTitle = document.getElementById("lbTitle");
    const elDesc = document.getElementById("lbDesc");
    const elThead = document.getElementById("lbThead");
    const elTbody = document.getElementById("lbTbody");
    const tabs = Array.from(document.querySelectorAll(".lb-tab"));

    function setActiveTab(mode) {
        for (const t of tabs) {
            const active = t.dataset.mode === mode;
            t.classList.toggle("is-active", active);
            t.setAttribute("aria-selected", active ? "true" : "false");
        }
    }

    function escapeHtml(s) {        // 防止破版
        return String(s ?? "").replace(/[&<>"']/g, (c) => ({
            "&": "&amp;",
            "<": "&lt;",
            ">": "&gt;",
            '"': "&quot;",
            "'": "&#39;"
        }[c]));
    }

    // 不同表格欄位數要跟著改變
    function colCount(mode) {
        return (mode === "main") ? 7 : 5;
    }

    function setLoading(mode) {
        elTbody.innerHTML = `<tr><td class="lb-muted" colspan="${colCount(mode)}">載入中...</td></tr>`;
    }

    function setEmpty(mode) {
        elTbody.innerHTML = `<tr><td class="lb-muted" colspan="${colCount(mode)}">目前沒有資料</td></tr>`;
    }

    function setError(mode) {
        elTbody.innerHTML = `<tr><td class="lb-muted" colspan="${colCount(mode)}">載入失敗</td></tr>`;
    }

    function renderThead(mode) {        // 依照game mode產生不同表頭
        if (mode === "main") {
            elThead.innerHTML = `
                <tr>
                    <th class="lb-rank">#</th>
                    <th>玩家</th>
                    <th>勝場</th>
                    <th>總場</th>
                    <th>勝率</th>
                    <th>平均勝利回合</th>
                    <th>最近遊玩</th>
                </tr>
            `;
            return;
        }

        // rush / keys
        elThead.innerHTML = `
            <tr>
                <th class="lb-rank">#</th>
                <th>玩家</th>
                <th>Best Score</th>
                <th>Best Time (ms)</th>
                <th>Last Played</th>
            </tr>
        `;
    }

    function renderTbody(mode, rows) {
        if (!Array.isArray(rows) || rows.length === 0) {
            setEmpty(mode);
            return;
        }

        if (mode === "main") {
            elTbody.innerHTML = rows.map((r, i) => `
                <tr>
                    <td class="lb-rank">${i + 1}</td>
                    <td class="lb-user">${escapeHtml(r.username)}</td>
                    <td>${r.wins ?? 0}</td>
                    <td>${r.games ?? 0}</td>
                    <td>${r.win_rate ?? ""}</td>
                    <td>${r.avg_win_rounds ?? "-"}</td>
                    <td>${escapeHtml(r.last_played_at ?? "")}</td>
                </tr>
            `).join("");
            return;
        }

        elTbody.innerHTML = rows.map((r, i) => `
            <tr>
                <td class="lb-rank">${i + 1}</td>
                <td class="lb-user">${escapeHtml(r.username)}</td>
                <td>${r.best_score ?? 0}</td>
                <td>${r.best_time_ms ?? ""}</td>
                <td>${escapeHtml(r.last_played_at ?? "")}</td>
            </tr>
        `).join("");
    }

    // 主流程
    async function loadLeaderboard(mode) {
        setActiveTab(mode);

        if (mode === "main") {
            elTitle.textContent = "主遊戲排行榜";
            elDesc.textContent = "成功戰勝期末考的勇者會名留青史";
        } else if (mode === "rush") {
            elTitle.textContent = "Rush 排行榜";
            elDesc.textContent = "不是啊這也太快了吧";
        } else if (mode === "keys") {
            elTitle.textContent = "Keys 排行榜";
            elDesc.textContent = "你怎麼知道我打報告都不用看鍵盤";
        }

        renderThead(mode);
        setLoading(mode);

        try {
            const url = (mode === "main")
                ? "/api/leaderboard"
                : `/api/minigame_leaderboard?game_mode=${encodeURIComponent(mode)}`;

            const res = await fetch(url, { credentials: "include" });
            const data = await res.json();
            renderTbody(mode, data);
        } catch (e) {
            setError(mode);
        }
    }

    for (const t of tabs) {
        t.addEventListener("click", () => loadLeaderboard(t.dataset.mode));
    }

    loadLeaderboard("main");
})();
