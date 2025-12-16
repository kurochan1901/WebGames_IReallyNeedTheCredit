// 小遊戲共用UI／計時／結束回傳／POST戰績
(() => {
    const $ = (sel, root = document) => root.querySelector(sel);

    // DOM產生器
    function el(tag, attrs = {}, children = []) {
        const node = document.createElement(tag);

        for (const [k, v] of Object.entries(attrs)) {
            if (k === "class") node.className = v;
            else if (k === "style" && typeof v === "object") Object.assign(node.style, v);
            else if (k.startsWith("on") && typeof v === "function") node.addEventListener(k.slice(2), v);
            else node.setAttribute(k, v);
        }

        for (const c of children) node.appendChild(typeof c === "string" ? document.createTextNode(c) : c);
        return node;
    }

    function nowMs() { return Date.now(); }     // 目前毫秒
    function clamp(n, a, b) { return Math.max(a, Math.min(b, n)); }     // 分數限制範圍
    function randInt(a, b) { return Math.floor(Math.random() * (b - a + 1)) + a; }
    function shuffle(arr) {                                             //洗牌
        for (let i = arr.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [arr[i], arr[j]] = [arr[j], arr[i]];
        }
        return arr;
    }

    // 遊戲結果回傳
    function postResult(url, payload) {
        return fetch(url, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(payload),
        }).catch(() => {});
    }

    function renderShell(mountEl, title, subtitle = "") {
        mountEl.innerHTML = "";

        const root = el("div", { class: "mg-root", style: { 
            fontFamily: "system-ui, -apple-system, Segoe UI, Roboto, sans-serif",
            padding: "12px",
            borderRadius: "12px",
            border: "1px solid rgba(255,255,255,0.15)",
            background: "rgba(0,0,0,0.25)",
            color: "#fff",
            lineHeight: "1.4",
            userSelect: "none",
        }});

        const header = el("div", { style: { 
            display: "flex", 
            justifyContent: "space-between", 
            alignItems: "center" , 
            gap: "12px" }},[
                el("div", {}, [
                    el("div", { style: { fontSize: "18px", fontWeight: "700" }}, [title]),
                    el("div", { class: "mg-sub", style: { opacity: "0.85", fontSize: "12px" }}, [subtitle]),
                ]),

                el("div", { style: { textAlign: "right" }}, [
                    el("div", { class: "mg-timer", style: { fontWeight: "700" }}, ["00.0s"]),
                    el("div", { class: "mg-score", style: { opacity: "0.9", fontSize: "12px" }}, ["Score: 0"]),
                ]),
            ]);

            const body = el("div", { class: "mg-body",style: { 
                marginTop: "10px"
            }});

            const footer = el("div", { class: "mg-footer", style: { 
                marginTop: "12px", 
                display: "flex", 
                gap: "8px", 
                justifyContent: "flex-end" 
            }});

            root.appendChild(header);
            root.appendChild(body);
            root.appendChild(footer);
            mountEl.appendChild(root);

            return {root, header, body, footer};
        }

        function setText(sel, txt, mountEl) {
            const node =$(sel, mountEl);
            if (node) node.textContent = txt;
        }

        function btnStyle(primary) {
            return {
                padding: "10px 12px",
                borderRadius: "10px",
                border: "1px solid rgba(255,255,255,0.2)",
                background: primary ? "rgba(255,255,255,0.18)" : "rgba(0,0,0,0.25)",
                color: "#fff",
                cursor: "pointer",
            };
        }
    }

    // 結束流程
})()