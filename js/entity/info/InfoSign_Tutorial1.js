const Entity = require("../Entity.js");

class InfoSign_Tutorial1 extends Entity {
    getName() {
        return "Info Sign";
    }

    getEntityName() {
        return "info_sign";
    }

    getInfo() {
        // The info is a message meant for the player to read, not a description of an info sign itself.
        return "Tutorial: WASD to move, Spacebar to shoot.";
    }

    doInteract(entity) {
        // Instantly kill a player (even if they are invincible).
        if(entity.isPlayer) {
            entity.doKill();
        }
    }
}

module.exports = InfoSign_Tutorial1;