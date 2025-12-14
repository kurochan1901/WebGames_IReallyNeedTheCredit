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

    function log(msg) {
        const box = $("logBox");
        const p = document.createElement("div");
        p.textContent = msg;
        box.appendChild(p);
        box.scrollTop = box.scrollHeight;
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
        log(`戰鬥結束！${winnerName} 勝利！`);
        render();
    }

    function tickCooldowns() {
        for (const key of Object.keys(attacker.cooldowns)) {
            if (attacker.cooldowns[key] > 1) attacker.cooldowns[key] -= 1;
            else delete attacker.cooldowns[key];
        }
    }

    function monsterTurn() {
        if (gameOver) return;





battle();