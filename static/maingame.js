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

function battle() {
    let attackerName = prompt("請輸入攻擊者名字: ");
    let attacker = new Attacker(attackerName);
    let monster = new Monster();
    let roundCount = 1;

    while (attacker.health > 0 && monster.health > 0) {
        alert(`\n---\n回合 ${roundCount}\n${attacker.name} - 血量: ${attacker.health}, 魔力: ${attacker.mana}`);
        alert(`${monster.name} - 血量: ${monster.health}`);

        let availableSkills = [];
        if (attacker.cooldowns["slash"] === undefined || attacker.cooldowns["slash"] === 0) availableSkills.push("Slash");
        if (attacker.cooldowns["fireball"] === undefined || attacker.cooldowns["fireball"] === 0) availableSkills.push("Fireball");
        if (attacker.cooldowns["power_strike"] === undefined || attacker.cooldowns["power_strike"] === 0) availableSkills.push("Power Strike");
        if (attacker.cooldowns["heal"] === undefined || attacker.cooldowns["heal"] === 0) availableSkills.push("Heal");

        alert(`可用技能: ${availableSkills.join(", ")}`);

        let attackSkill = null;
        if (attacker.stunDuration > 0) {
            alert(`${attacker.name} 被暈眩，無法行動！`);
            attacker.stunDuration -= 1;
        } else {
            let skillChoice = prompt("選擇技能: 1. Slash 2. Fireball 3. Power Strike 4. Heal");
            switch (skillChoice) {
                case "1":
                    attackSkill = attacker.slash();
                    break;
                case "2":
                    attackSkill = attacker.fireball();
                    break;
                case "3":
                    attackSkill = attacker.powerStrike();
                    break;
                case "4":
                    attackSkill = attacker.heal();
                    break;
            }
        }

        if (attackSkill) {
            if (attackSkill.damage) {
                monster.health -= attackSkill.damage;
                alert(`${attacker.name} 使用 ${attackSkill.name}，造成 ${attackSkill.damage} 點傷害！`);
            } else if (attackSkill.heal) {
                attacker.health = Math.min(100, attacker.health + attackSkill.heal);
                alert(`${attacker.name} 使用 ${attackSkill.name}，恢復 ${attackSkill.heal} 點血量！`);
            }

            if (attackSkill.cooldown > 0) {
                attacker.cooldowns[attackSkill.name.toLowerCase()] = attackSkill.cooldown;
            }
        }
        // 怪物回合
        let monsterSkill = [monster.claw(), monster.bite(), monster.stun()][Math.floor(Math.random() * 3)];
        alert(`${monster.name} 使用 ${monsterSkill.name}！`);
        if (monsterSkill.damage) {
            attacker.health -= monsterSkill.damage;
            alert(`${monster.name} 造成 ${monsterSkill.damage} 點傷害！`);
        }
        if (monsterSkill.stun) {
            attacker.stunDuration = monsterSkill.stun;
            alert(`${attacker.name} 被暈眩 ${monsterSkill.stun} 回合！`);
        }

        roundCount += 1;
        attacker.restoreMana();

        // 更新冷卻時間
        for (let skill in attacker.cooldowns) {
            if (attacker.cooldowns[skill] > 1) {
                attacker.cooldowns[skill] -= 1;
            } else {
                delete attacker.cooldowns[skill];
            }
        }
    }

    let winner = attacker.health > 0 ? attacker.name : monster.name;
    alert(`戰鬥結束！${winner} 勝利！`);
}

battle();