class Attacker {
    constructor(name) {
        this.name = name;
        this.health = 100;
        this.mana = 100;
        this.cooldowns = {};  // 冷卻時間
        this.stunDuration = 0;
    }

    slash() {
        return {name: "Slash", damage: 10, manaCost: 10, cooldown: 0};
    }

    fireball() {
        if (this.mana < 20 || (this.cooldowns["Fireball"] > 0)) {
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

    claw() {
        return {name: "Claw", damage: 10};
    }

    bite() {
        return {name: "Bite", damage: 15};
    }

    stun() {
        return {name: "Stun", damage: 0, stun: 2};
    }
}