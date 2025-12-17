// 排行版 分頁形式 按分頁切換
(() => {
    "use strict";

    console.log("[leaderboard] loaded");

    document.addEventListener("DOMContentLoaded", () => {
        const elTitle = document.getElementById("lbTitle");
        const elDesc = document.getElementById("lbDesc");

        // 控制排行榜分頁顯示主遊戲／小遊戲
        const panelMain = document.getElementById("panel-main");
        const panelMini = document.getElementById("panel-mini");

        const elThead = document.getElementById("lbThead");
        const elTbody = document.getElementById("lbTbody");
        const tabs = Array.from(document.querySelectorAll(".lb-tab"));

        // 防呆
        if (!elTitle || !elDesc || !panelMain || !panelMini || !elThead || !elTbody || tabs.length === 0) {
            console.error("[leaderboard] missing elements", {
                elTitle, elDesc, panelMain, panelMini, elThead, elTbody, tabs: tabs.length
            });
            return;
        }

        function setActiveTab(mode) {
            for (const t of tabs) {
                const active = t.dataset.mode === mode;
                t.classList.toggle("is-active", active);
                t.setAttribute("aria-selected", active ? "true" : "false");
            }
        }

        function switchPanel(mode) {
            const isMain = (mode === "main");
            panelMain.classList.toggle("is-hidden", !isMain);
            panelMini.classList.toggle("is-hidden", isMain);

            // debug：你切 tab 時 Console 應該看到這行
            console.log("[leaderboard] switchPanel", mode, {
                mainHidden: panelMain.classList.contains("is-hidden"),
                miniHidden: panelMini.classList.contains("is-hidden")
            });
        }

        function escapeHtml(s) {
            return String(s ?? "").replace(/[&<>"']/g, (c) => ({
                "&": "&amp;",
                "<": "&lt;",
                ">": "&gt;",
                '"': "&quot;",
                "'": "&#39;"
            }[c]));
        }

        function setLoading() {
            elTbody.innerHTML = `<tr><td class="lb-muted" colspan="5">載入中...</td></tr>`;
        }

        function setEmpty() {
            elTbody.innerHTML = `<tr><td class="lb-muted" colspan="5">目前沒有資料</td></tr>`;
        }

        function setError() {
            elTbody.innerHTML = `<tr><td class="lb-muted" colspan="5">載入失敗</td></tr>`;
        }

        function renderMiniThead() {
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

        function renderMiniTbody(rows) {
            if (!Array.isArray(rows) || rows.length === 0) {
                setEmpty();
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

        async function loadMini(mode) {
            renderMiniThead();
            setLoading();

            try {
                const url = `/api/minigame_leaderboard?game_mode=${encodeURIComponent(mode)}`;
                const res = await fetch(url, { credentials: "include" });
                const data = await res.json();
                renderMiniTbody(data);
            } catch (e) {
                console.error("[leaderboard] loadMini error", e);
                setError();
            }
        }

        async function loadLeaderboard(mode) {
            setActiveTab(mode);
            switchPanel(mode);

            if (mode === "main") {
                elTitle.textContent = "主遊戲排行榜";
                elDesc.textContent = "成功戰勝期末考的勇者會名留青史";
                return; // ✅ 重要：主遊戲不 fetch 小遊戲表
            }

            if (mode === "rush") {
                elTitle.textContent = "Rush 排行榜";
                elDesc.textContent = "加退選衝刺：分數越高越強，同分比時間";
            } else if (mode === "keys") {
                elTitle.textContent = "Keys 排行榜";
                elDesc.textContent = "Key Smash Defense：連擊越高越猛，同分比時間";
            } else {
                elTitle.textContent = "小遊戲排行榜";
                elDesc.textContent = "";
            }

            await loadMini(mode);
        }

        for (const t of tabs) {
            t.addEventListener("click", () => loadLeaderboard(t.dataset.mode));
        }

        loadLeaderboard("main");
    });
})();
