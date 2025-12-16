// 入口
(() => {
    function run(gameCode, opts) {
        if (gameCode === "quiz") return window.MiniQuiz.run(opts);
        if (gameCode === "rush") return window.MiniRush.run(opts);
        throw new Error("Unknown minigame: " + gameCode);
    }

    window.MiniGames = { run };
})();
