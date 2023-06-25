const Entity = require("./Entity.js");

class Monster extends Entity {
    id = "monster_spawner";

    spawnTime = 3; // Seconds to spawn a new monster after one dies.
    maxMonsterCount = 4;

    getName() {
        // This entity is hidden.
        return undefined;
    }

    getInfo() {
        // This entity is hidden.
        return undefined;
    }

    doSpawn() {
        super.doSpawn();

        // Initial spawn of monsters.
        for(let i = 0; i < this.maxMonsterCount; i++) {
            this.spawnMonster();
        }
    }

    onMonsterDeath() {
        // When a monster dies, start a timer to spawn another one.
        this.getServer().addTask(this.spawnTime, () => {
            this.spawnMonster();
        })
    }

    spawnMonster() {
        let monster = this.getWorld().spawn("monster", 1, this.screen, this.x, this.y)
        monster.owner = this;
    }
}

module.exports = Monster;