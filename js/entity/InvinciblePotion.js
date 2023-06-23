const Entity = require("./Entity.js");

class InvinciblePotion extends Entity {
    id = "invincible_potion";
    maxStackNumber = 1;
    maxStackSize = 20;
    
    invincibleSeconds = 10;

    getName() {
        return "Invincible Potion";
    }

    getInfo() {
        return "A potion that makes you invincible for a limited time.";
    }

    doInteract(entity) {
        // The item will be collected.
        if(entity.inventory) {
            entity.doAddToInventory(this);
        }
    }

    canConsume(entity) {
        return !entity.isInvincible;
    }

    doConsume(entity) {
        entity.makeInvincible(this.invincibleSeconds);
    }
}

module.exports = InvinciblePotion;