// 小遊戲：加退選

(() => {
    const C = window.MiniGameCore;

    function run(opts) {
        const {
            mountEl,
            timeLimitMs = 12000,
            passScore = 12,
            onFinish,
            postUrl,
            username = "player1",
        } = opts;

        const ui = C.renderShell(mountEl, "搶課衝刺（Rush）", "限時點 ⭐ 越多越好；點到 💀 扣分。");

        let score = 0;
        let start = 0;
        let ended = false;
        let spawnId = null;
        let tickId = null;

        const hint = C.el("div", { style: { opacity: "0.9", marginBottom: "8px" }}, ["按開始後目標會出現"]);
        const arena = C.el("div", { style: {
            position: "relative",
            height: "260px",
            borderRadius: "12px",
            border: "1px dashed rgba(255,255,255,0.25)",
            background: "rgba(0,0,0,0.20)",
            overflow: "hidden",
        }});

        const startBtn = C.el("button", { style: C.btnStyle(true) }, ["開始"]);
        const quitBtn  = C.el("button", { style: C.btnStyle(false) }, ["結束"]);

        ui.body.appendChild(hint);
        ui.body.appendChild(arena);
        ui.footer.appendChild(quitBtn);
        ui.footer.appendChild(startBtn);

        function updateHUD() {
            const remain = Math.max(0, timeLimitMs - (C.nowMs() - start));
            C.setText(mountEl, ".mg-timer", `${(remain / 1000).toFixed(1)}s`);
            C.setText(mountEl, ".mg-score", `Score: ${score}`);
        }

        function spawnTarget() {
            if (ended) return;

            const isBad = Math.random() < 0.18;
            const node = C.el("div", { style: {
                position: "absolute",
                width: "42px",
                height: "42px",
                borderRadius: "999px",
                display: "grid",
                placeItems: "center",
                fontSize: "20px",
                fontWeight: "900",
                border: "1px solid rgba(255,255,255,0.2)",
                background: isBad ? "rgba(255,0,0,0.20)" : "rgba(0,255,0,0.18)",
                cursor: "pointer",
            }}, [isBad ? "💀" : "⭐"]);

            const rect = arena.getBoundingClientRect();
            const x = C.randInt(8, Math.max(8, rect.width - 50));
            const y = C.randInt(8, Math.max(8, rect.height - 50));
            node.style.left = `${x}px`;
            node.style.top  = `${y}px`;

            const ttl = isBad ? 900 : 800;

            node.addEventListener("click", () => {
                if (ended) return;
                    score += isBad ? -2 : 1;
                    score = C.clamp(score, 0, 9999);
                    updateHUD();
                    node.remove();
            });

            arena.appendChild(node);
            setTimeout(() => { if (node.isConnected) node.remove(); }, ttl);
        }

        function stop() {
            if (ended) return;
            ended = true;

            clearInterval(spawnId);
            clearInterval(tickId);

            arena.innerHTML = "";
            const success = score >= passScore;
            hint.textContent = success ? `🎉 搶課成功！Score ${score}` : `😵 搶課失敗… Score ${score}`;

            C.setText(mountEl,".mg-timer", "0.0s");
            C.setText(mountEl,".mg-score", `Score: ${score}`);

            C.finishAndReport({ mountEl, game_mode: "rush", score, startMs: start, passScore, onFinish, postUrl, username });
        }

        startBtn.onclick = () => {
            if (start !== 0) return;
            start = C.nowMs();
            hint.textContent = "開始！滑鼠點擊 ⭐（避開 💀）";
            updateHUD();

            spawnId = setInterval(spawnTarget, 250);
            tickId = setInterval(() => {
                updateHUD();
                if (C.nowMs() - start >= timeLimitMs) stop();
            }, 100);
        };

        quitBtn.onclick = () => stop();

        updateHUD();
        return { stop };
    }

    window.MiniRush = { run };
})();