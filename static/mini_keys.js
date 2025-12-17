// 小遊戲：鍵盤按鍵挑戰
(() => {
    "use strict";

    const C = window.MiniGameCore;

    const KEY_SET = ["A", "S", "D", "F", "J", "K", "L", ";"];

    function run(opts) {
        const {
            mountEl,
            timeLimitMs = 45000,          // 整局最長時間（可調）
            passScore = 120,              // 達標分數（可調）
            onFinish,
            postUrl,
            username = "player1",
        } = opts;

        const ui = C.renderShell(
            mountEl,
            "Key Smash Defense",
            "照順序輸入 ASDFJKL;（按錯會斷連擊）"
        );

        // ---------- State ----------
        let startMs = 0;
        let ended = false;
        let running = false;

        let score = 0;
        let combo = 0;

        let seq = [];
        let idx = 0;

        // 每串時間限制（會變快）
        let seqTimeMs = 4500;
        const seqTimeMinMs = 1400;
        const seqTimeStepMs = 120;

        let seqDeadlineMs = 0;

        let tickId = null;

        // ---------- UI ----------
        const tip = C.el("div", { style: { opacity: "0.9", marginBottom: "10px", fontSize: "12px" } }, [
            "按「開始」後用鍵盤輸入；只接受 ASDFJKL;。"
        ]);

        const panel = C.el("div", { style: {
            borderRadius: "12px",
            border: "1px solid rgba(255,255,255,0.15)",
            background: "rgba(0,0,0,0.18)",
            padding: "12px",
            display: "grid",
            gap: "10px",
            textAlign: "center",
        }});

        const seqLine = C.el("div", { class: "ks-seq", style: { fontSize: "22px", fontWeight: "900", letterSpacing: "1px" } }, [
            "Press Start"
        ]);

        const progressLine = C.el("div", { class: "ks-progress", style: { fontSize: "14px", opacity: "0.9" } }, [
            "—"
        ]);

        const metaLine = C.el("div", { class: "ks-meta", style: { fontSize: "12px", opacity: "0.9", display: "flex", justifyContent: "space-between" } }, [
            C.el("div", { class: "ks-combo" }, ["Combo: 0"]),
            C.el("div", { class: "ks-ttl" }, ["Window: 2.6s"]),
        ]);

        panel.appendChild(seqLine);
        panel.appendChild(progressLine);
        panel.appendChild(metaLine);

        ui.body.appendChild(tip);
        ui.body.appendChild(panel);

        // footer buttons：結算、回首頁 分離
        const homeBtn = C.el("button", { style: C.btnStyle(false) }, ["回首頁"]);
        const finishBtn = C.el("button", { style: C.btnStyle(false) }, ["結算"]);
        const startBtn = C.el("button", { style: C.btnStyle(true) }, ["開始"]);

        ui.footer.appendChild(homeBtn);
        ui.footer.appendChild(finishBtn);
        ui.footer.appendChild(startBtn);

        finishBtn.disabled = true;

        // ---------- Helpers ----------
        function setText(cls, txt) {
            const node = C.$(cls, mountEl);
            if (node) node.textContent = txt;
        }

        function updateHUD() {
            const remainGame = Math.max(0, timeLimitMs - (C.nowMs() - startMs));
            C.setText(mountEl, ".mg-timer", `${(remainGame / 1000).toFixed(1)}s`);
            C.setText(mountEl, ".mg-score", `Score: ${score}`);

            setText(".ks-combo", `Combo: ${combo}`);
            setText(".ks-ttl", `Window: ${(seqTimeMs / 1000).toFixed(1)}s`);

            // 進度顯示：已完成用 ●，未完成用 ○
            if (seq.length > 0) {
                const dots = seq.map((_, i) => (i < idx ? "●" : "○")).join(" ");
                progressLine.textContent = dots;
            } else {
                progressLine.textContent = "—";
            }
        }

        function newSequence() {
            // 隨著進度增加長度
            const baseLen = 5;
            const extra = Math.min(3, Math.floor(score / 40)); // 分數越高越容易變長
            const len = baseLen + extra;

            seq = [];
            for (let i = 0; i < len; i++) {
                seq.push(KEY_SET[C.randInt(0, KEY_SET.length - 1)]);
            }

            idx = 0;
            seqDeadlineMs = C.nowMs() + seqTimeMs;

            seqLine.textContent = seq.join(" ");
            updateHUD();
        }

        function onCorrectKey() {
            score += 1;
            idx += 1;

            if (idx >= seq.length) {
                // 完成一串：加成 + 連擊
                combo += 1;
                score += 10 + combo;

                // 變快
                seqTimeMs = Math.max(seqTimeMinMs, seqTimeMs - seqTimeStepMs);

                newSequence();
            } else {
                updateHUD();
            }
        }

        function onWrongKey() {
            combo = 0;
            score = Math.max(0, score - 2);
            tip.textContent = "按錯了！Combo 歸零。";
            updateHUD();
        }

        function normalizeKey(e) {
            // 支援分號 ;（Shift + ; 可能回傳 :，我們把 : 也當成 ;）
            const k = e.key;

            if (k === ":" || k === ";") return ";";

            // 字母轉大寫
            if (typeof k === "string" && k.length === 1) {
                return k.toUpperCase();
            }

            return k;
        }

        function handleKeydown(e) {
            if (!running || ended) return;

            const k = normalizeKey(e);

            // 只吃我們的按鍵集合
            if (!KEY_SET.includes(k)) return;

            e.preventDefault();

            // 超時判定（這串按太慢）
            if (C.nowMs() > seqDeadlineMs) {
                combo = 0;
                tip.textContent = "太慢了！Combo 歸零";
                newSequence();
                return;
            }

            const expected = seq[idx];
            if (k === expected) {
                tip.textContent = "Nice.";
                onCorrectKey();
            } else {
                onWrongKey();
            }
        }

        function stop(reason) {
            if (ended) return;
            ended = true;
            running = false;

            if (tickId) clearInterval(tickId);
            window.removeEventListener("keydown", handleKeydown, true);

            startBtn.disabled = true;
            finishBtn.disabled = true;

            const success = score >= passScore;

            seqLine.textContent = "Game Over";
            progressLine.textContent = success
                ? `✅ PASS | Score ${score}`
                : `❌ FAIL | Score ${score}`;

            C.setText(mountEl, ".mg-timer", "0.0s");
            C.setText(mountEl, ".mg-score", `Score: ${score}`);

            C.finishAndReport({
                mountEl,
                game_mode: "keys",
                score,
                startMs,
                passScore,
                onFinish,
                postUrl,
                username,
            });
        }

        // ---------- Buttons ----------
        startBtn.onclick = () => {
            if (running || ended) return;

            startMs = C.nowMs();
            running = true;

            startBtn.disabled = true;
            finishBtn.disabled = false;

            tip.textContent = "開始！照順序輸入：ASDFJKL;";
            newSequence();

            // 監聽鍵盤（capture=true 讓它優先拿到）
            window.addEventListener("keydown", handleKeydown, true);

            // 定時更新：檢查整局時間 + 當前串是否超時
            tickId = setInterval(() => {
                if (!running || ended) return;

                updateHUD();

                // 整局時間到
                if (C.nowMs() - startMs >= timeLimitMs) {
                    stop("timeout");
                    return;
                }

                // 這一串超時就重開串（不直接結束）
                if (C.nowMs() > seqDeadlineMs) {
                    combo = 0;
                    tip.textContent = "超時！Combo 歸零";
                    newSequence();
                }
            }, 80);
        };

        // 結算
        finishBtn.onclick = () => {
            if (!running || ended) return;
            stop("finish");
        };

        // 回首頁
        homeBtn.onclick = () => {
            window.location.href = "/";
        };

        updateHUD();

        return {
            stop: () => stop("manual"),
        };
    }

    window.MiniKeys = { run };
})();