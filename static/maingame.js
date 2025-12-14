console.log("maingame.js loaded");
class Attacker {
    constructor(name) {
        this.name = name;
        this.health = 100;
        this.mana = 100;
        this.cooldowns = {};  // 冷卻時間
        this.stunDuration = 0;
    }

    slash() {
        return {name: "Slash", damage: 10, manaCost: 0, cooldown: 0};
    }

    fireball() {
        if (this.mana < 20 || (this.cooldowns["fireball"] > 0)) {
            return null;  // 無法施放火球術
        }
        this.mana -= 20;
        return {name: "Fireball", damage: 25, manaCost: 20, cooldown: 2};
    }
    
    powerStrike() {
        if (this.mana < 15 || this.cooldowns["power_strike"] > 0) {
            return null;
        }
        this.mana -= 15;
        return {name: "Power Strike", damage: 15, manaCost: 15, cooldown: 1};
    }

    heal() {
        if (this.mana < 10 || this.cooldowns["heal"] > 0) {
            return null;
        }
        this.mana -= 10;
        return {name: "Heal", heal: 25, manaCost: 10, cooldown: 2};
    }

    restoreMana() {
        this.mana = Math.min(100, this.mana + 10);
    }
}

class Monster {
    constructor() {
        this.name = "Wild Beast";
        this.health = 150;
    }

    claw() { return {name: "Claw", damage: 10};}

    bite() { return {name: "Bite", damage: 15};}

    stun() { return {name: "Stun", damage: 0, stun: 2};}
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


    //訊息記錄
    let logQueue = [];
    let waitingNext = false;

    function showLine(line) {
        $("logBox").textContent = line;
    }
    function enqueue(lines) {
        logQueue.push(...lines);
        playNext();
    }
    function playNext() {
        if (waitingNext) return;
        
        if (logQueue.length === 0) {
            $("nextLogBtn").style.display = "none";
            setButtonEnabled(true);
            return;
        }

        waitingNext = true;
        const line = logQueue.shift();
        showLine(line);

        $("nextLogBtn").style.display = "inline-block";
    }

    $("nextLogBtn").onclick = () => {
        waitingNext = false;
        playNext();
    };

    //按鈕lock
    function setButtonEnabled(enabled) {
        $("slashBtn").disabled = !enabled || gameOver || attacker.stunDuration > 0 || (attacker.cooldowns["slash"] > 0);
        $("fireballBtn").disabled = !enabled || gameOver || attacker.stunDuration > 0 || (attacker.cooldowns["fireball"] > 0) || attacker.mana < 20;
        $("strikeBtn").disabled = !enabled || gameOver || attacker.stunDuration > 0 || (attacker.cooldowns["power_strike"] > 0) || attacker.mana < 15;
        $("healBtn").disabled = !enabled || gameOver || attacker.stunDuration > 0 || (attacker.cooldowns["heal"] > 0) || attacker.mana < 10;
    }

    function render() {
        $("playerHP").textContent = attacker.health;
        $("playerMP").textContent = attacker.mana;
        $("playerStun").textContent = attacker.stunDuration > 0 ? attacker.stunDuration : "無";

        $("monsterName").textContent = monster.name;
        $("monsterHP").textContent = monster.health;

        $("slashBtn").disabled = gameOver || attacker.stunDuration > 0 || (attacker.cooldowns["slash"] > 0);
        $("fireballBtn").disabled = gameOver || attacker.stunDuration > 0 || (attacker.cooldowns["fireball"] > 0) || attacker.mana < 20;
        $("strikeBtn").disabled = gameOver || attacker.stunDuration > 0 || (attacker.cooldowns["power_strike"] > 0) || attacker.mana < 15;
        $("healBtn").disabled = gameOver || attacker.stunDuration > 0 || (attacker.cooldowns["heal"] > 0) || attacker.mana < 10;
        }

    function endGame(winnerName) {
        gameOver = true;
        enqueue([`戰鬥結束！${winnerName} 勝利！`]);        
        render();
    }

    //回合處理
    function tickCooldowns() {
        for (const key of Object.keys(attacker.cooldowns)) {
            if (attacker.cooldowns[key] > 1) attacker.cooldowns[key] -= 1;
            else delete attacker.cooldowns[key];
        }
    }

    function monsterTurnCollect(lines) {
        if (gameOver) return;

        const skills = [monster.claw(), monster.bite(), monster.stun()];
        const monsterSkill = skills[Math.floor(Math.random() * skills.length)];
        lines.push(`${monster.name} 使用了 ${monsterSkill.name}！`);
        
        //怪物傷害
        if (monsterSkill.damage) {
            attacker.health -= monsterSkill.damage;
            lines.push(`${attacker.name} 受到 ${monsterSkill.damage} 點傷害！`);
        }
        
        //暈眩
        if (monsterSkill.stun) {
            attacker.stunDuration = monsterSkill.stun;
            lines.push(`${attacker.name} 被眩暈了 ${monsterSkill.stun} 回合！`);
        }

        if (attacker.health <= 0) {
            endGame(monster.name);
        }

        //回合結算
        roundCount += 1;
        attacker.restoreMana();
        tickCooldowns();

        lines.push(`--- 第 ${roundCount} 回合 ---`);
    }

    function playerUse(skillFn) {
        if (gameOver) return;

        setButtonEnabled(false);
        const lines = [];

        if (attacker.stunDuration > 0) {
            lines.push(`${attacker.name} 被眩暈，無法行動！`);
            attacker.stunDuration -= 1;

            monsterTurnCollect(lines);
            enqueue(lines);
            render();
            return;
        }

        const attackSkill = skillFn();
        if (!attackSkill) {
            lines.push(`${attacker.name} 無法使用該技能！`);
            enqueue(lines);
            setButtonEnabled(true);
            render();
            return;
        }

        //玩家傷害
        if (attackSkill.damage) {
            monster.health -= attackSkill.damage;
            lines.push(`${attacker.name} 使用了 ${attackSkill.name}，造成 ${attackSkill.damage} 點傷害！`);
            if (monster.health <= 0) {
                gameOver = true;
                lines.push(`${attacker.name} 勝利！`);
                enqueue(lines);
                render();
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
            attacker.cooldowns[attackSkill.name.toLowerCase().replace(" ", "_")] = attackSkill.cooldown;
        }

        monsterTurnCollect(lines);
        enqueue(lines);
        render();
    }

    //啟動遊戲
    function startGame() {
        //debug
        must('logBox');
        must('nextLogBtn');
        must('slashBtn');
        must('fireballBtn');
        must('strikeBtn');
        must('healBtn');
        //debug end

        const playerName = 
            document.getElementById("playerName")?.dataset.username || "player1";
        attacker = new Attacker(playerName);
        monster = new Monster();

        roundCount = 1;
        gameOver = false;

        $("logBox").textContent = "";
        logQueue = [];
        waitingNext = false;

        enqueue([
            `戰鬥開始！${attacker.name}VS ${monster.name}`,`--- 第 ${roundCount} 回合 ---`]);
        render();

        $("slashBtn").onclick = () => playerUse(() => attacker.slash());
        $("fireballBtn").onclick = () => playerUse(() => attacker.fireball());
        $("strikeBtn").onclick = () => playerUse(() => attacker.powerStrike());
        $("healBtn").onclick = () => playerUse(() => attacker.heal());
    }

    startGame();
}

document.addEventListener("DOMContentLoaded", battle);