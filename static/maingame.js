console.log("maingame.js loaded");
class Attacker {
    constructor(name) {
        this.name = name;
        this.health = 100;
        this.san = 100;
        this.cooldowns = {};  // 冷卻時間
        this.stunDuration = 0;
    }

    // 基本攻擊（刷題
    practice() {
        return {key: "practice", name: "Practice", damage: 10, sanCost: 0, cooldown: 0};
    }

    // 做報告
    report() {
        if (this.san < 20 || (this.cooldowns["report"] > 0)) {
            return null;  // 無法施放火球術
        }
        this.san -= 20;
        return {key: "report", name: "Report", damage: 25, sanCost: 20, cooldown: 2};
    }
    
    // 點名加分
    callAttendance() {
        if (this.san < 15 || this.cooldowns["call_attendance"] > 0) {
            return null;
        }
        this.san -= 15;
        return {key: "call_attendance", name: "Take Attendance", damage: 15, sanCost: 15, cooldown: 1};
    }

    // 咖啡恢復
    coffee() {
        if (this.san < 10 || this.cooldowns["coffee"] > 0) {
            return null;
        }
        this.san -= 10;
        return {key: "coffee", name: "Coffee", heal: 25, sanCost: 10, cooldown: 2};
    }

    restoreSan() {
        this.san = Math.min(100, this.san + 10);
    }
}

class Monster {
    constructor() {
        this.name = "Final Exam";
        this.health = 150;
    }

    quiz() { return {name: "突發隨堂小考", damage: 10};}

    lateClass() { return {name: "我把這邊講完就下課", damage: 15};}

    selfLearn() { return {name: "這邊範圍回去自學", damage: 0, stun: 2};}
}

function battle() {
    let attacker = null;
    let monster = null;
    let roundCount = 1;
    let gameOver = false;

    const $ = (id) => document.getElementById(id);

    //防呆
    function must(id) {
        const el = document.getElementById(id); 
        if (!el) console.error("Missing element:", id);
        return el;
    }


    //訊息記錄(改成逐段顯示)
    let blockQueue = [];
    let showingBlock = false;

    function showBlock(lines) {
        // 讓 logBox 一次顯示多行（用 \n）
        $("logBox").textContent = lines.join("\n");
        $("nextLogBtn").style.display = "inline-block";
        // 最後一段時，提示「繼續」比較像推進回合
        $("nextLogBtn").textContent = blockQueue.length > 0 ? "下一段" : "繼續";
    }

    function enqueueBlock(lines) {
        if (!Array.isArray(lines)) lines = [String(lines)];
        blockQueue.push(lines);

        // 若沒有正在顯示的區塊，立即顯示第一段
        if (!showingBlock) {
            showingBlock = true;
            setButtonEnabled(false);
            showBlock(blockQueue.shift());
        }
    
    }

    function finishBlocksAndContinue() {
        showingBlock = false;
        $("nextLogBtn").style.display = "none";
        beginPlayerTurn(); // 開始玩家回合(--測試: 進暈眩卡死?)
    }

    $("nextLogBtn").onclick = () => {
        if (blockQueue.length > 0) {
            showBlock(blockQueue.shift());
        } else {
            finishBlocksAndContinue();
        }
    };


    //按鈕lock
    function setButtonEnabled(enabled) {
        $("practiceBtn").disabled = !enabled || gameOver || attacker.stunDuration > 0 || (attacker.cooldowns["practice"] > 0);
        $("reportBtn").disabled = !enabled || gameOver || attacker.stunDuration > 0 || (attacker.cooldowns["report"] > 0) || attacker.san < 20;
        $("callAttendanceBtn").disabled = !enabled || gameOver || attacker.stunDuration > 0 || (attacker.cooldowns["call_attendance"] > 0) || attacker.san < 15;
        $("coffeeBtn").disabled = !enabled || gameOver || attacker.stunDuration > 0 || (attacker.cooldowns["coffee"] > 0) || attacker.san < 10;
    }

    function render() {
        $("playerHP").textContent = attacker.health;
        $("playerSan").textContent = attacker.san;
        $("playerStun").textContent = attacker.stunDuration > 0 ? attacker.stunDuration : "無";

        $("monsterName").textContent = monster.name;
        $("monsterHP").textContent = monster.health;

        $("practiceBtn").disabled = gameOver || attacker.stunDuration > 0 || (attacker.cooldowns["practice"] > 0);
        $("reportBtn").disabled = gameOver || attacker.stunDuration > 0 || (attacker.cooldowns["report"] > 0) || attacker.san < 20;
        $("callAttendanceBtn").disabled = gameOver || attacker.stunDuration > 0 || (attacker.cooldowns["call_attendance"] > 0) || attacker.san < 15;
        $("coffeeBtn").disabled = gameOver || attacker.stunDuration > 0 || (attacker.cooldowns["coffee"] > 0) || attacker.san < 10;
        }

    function endGame(winnerName) {
        gameOver = true;

        let lines = [];

        if (winnerName === attacker.name) {
            lines = [
                "--- 好結局 ---",
                "隨著最後一科考試結束的鐘聲響起，",
                "你放下手中的筆，深深地嘆了一口氣：",
                "「誰TM說要改成16週的...」",
            ]

        } else if (winnerName === monster.name) {
            lines = [
                "--- 壞結局 ---",
                "當你看到成績單的那一刻，",
                "你感受到前所未有的絕望：",
                "「好課值得一修再修...」",
            ]

        } else {
            lines = [
                `戰鬥結束！${winnerName} 勝利！`
            ];
        }

        enqueueBlock(lines);
        render();
    }

    //回合處理
    function tickCooldowns() {
        for (const key of Object.keys(attacker.cooldowns)) {
            attacker.cooldowns[key] -= 1;
            if (attacker.cooldowns[key] <= 0) 
                delete attacker.cooldowns[key];
        }
    }

    function monsterTurnCollect(lines) {
        if (gameOver) return;

        const skills = [monster.quiz(), monster.lateClass(), monster.selfLearn()];
        const monsterSkill = skills[Math.floor(Math.random() * skills.length)];
        lines.push(`${monster.name} 使用了 ${monsterSkill.name}！`);
        
        //怪物傷害
        if (monsterSkill.damage) {
            if (typeof monsterSkill.damage === "number" && monsterSkill.damage > 0){
                attacker.health -= monsterSkill.damage;
                lines.push(`${attacker.name} 受到 ${monsterSkill.damage} 點傷害！`);
            }
        }
        
        //暈眩
        if (monsterSkill.stun) {
            attacker.stunDuration = monsterSkill.stun;
            lines.push(`${attacker.name} 被眩暈了 ${monsterSkill.stun} 回合！`);
        }

        if (attacker.health <= 0) {
            endGame(monster.name);
            return;
        }

        //回合結算
        roundCount += 1;
        attacker.restoreSan();
        tickCooldowns();

        lines.push(`--- 第 ${roundCount} 回合 ---`);
    }

    //開始玩家回合
    function beginPlayerTurn() {
        if (gameOver) {
            setButtonEnabled(false);
            return;
        }

    // 若玩家暈眩：自動跳過玩家回合（不需要點技能）
        if (attacker.stunDuration > 0) {
            const lines = [];
            lines.push(`${attacker.name} 過於震驚，無法行動！`);
            attacker.stunDuration -= 1;

            monsterTurnCollect(lines); // 加怪物回合 + 回合結算
            render();
            enqueueBlock(lines);       // 變成一段顯示，按一次 Next 繼續
            return;
        }

        render();
        setButtonEnabled(true);
    }

    function playerUse(skillFn) {
        if (gameOver) return;

        setButtonEnabled(false);
        const lines = [];

        const attackSkill = skillFn();
        if (!attackSkill) {
            lines.push(`${attacker.name} 無法使用該技能！`);
            enqueueBlock(lines);
            setButtonEnabled(true);
            render();
            return;
        }

        //玩家傷害
        if (attackSkill.damage) {
            if (typeof attackSkill.damage === "number" && attackSkill.damage > 0){
                monster.health -= attackSkill.damage;
                lines.push(`${attacker.name} 使用了 ${attackSkill.name}，造成 ${attackSkill.damage} 點傷害！`);
            }

            if (monster.health <= 0) {
                endGame(attacker.name);
                return;
            }
                    
        }

        //玩家回復
        if (attackSkill.heal) {
            attacker.health = Math.min(100, attacker.health + attackSkill.heal);
            lines.push(`${attacker.name} 使用了 ${attackSkill.name}，恢復 ${attackSkill.heal} 點生命！`);
        }

        //設置冷卻
        if (attackSkill.cooldown > 0) {
            attacker.cooldowns[attackSkill.key] = attackSkill.cooldown;
        }

        monsterTurnCollect(lines);
        enqueueBlock(lines);
        render();
    }


    //啟動遊戲
    function startGame() {
        //debug
        // must('logBox');
        // must('nextLogBtn');
        // must('practiceBtn');
        // must('reportBtn');
        // must('callAttendanceBtn');
        // must('coffeeBtn');
        //debug end

        const playerName = 
            document.getElementById("playerName")?.dataset.username || "player1";
        attacker = new Attacker(playerName);
        monster = new Monster();

        roundCount = 1;
        gameOver = false;

        $("logBox").textContent = "";
        blockQueue= [];
        showingBlock = false;
        $("nextLogBtn").style.display = "none";

        enqueueBlock([
            `戰鬥開始！${attacker.name}VS ${monster.name}`,`--- 第 ${roundCount} 回合 ---`]);
        render();

        $("practiceBtn").onclick = () => playerUse(() => attacker.practice());
        $("reportBtn").onclick = () => playerUse(() => attacker.report());
        $("callAttendanceBtn").onclick = () => playerUse(() => attacker.callAttendance());
        $("coffeeBtn").onclick = () => playerUse(() => attacker.coffee());
    }

    startGame();
}

document.addEventListener("DOMContentLoaded", battle);