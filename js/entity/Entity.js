const EntityFactory = require("./EntityFactory.js");
const Util = require("../util/Util.js");
const Performance = require("../server/Performance.js");

class Entity {
    isSerializable = true; // By default, entities can be serialized and saved.
    isSpawned = false; // Only true if this entity instance exists in the game world.

    id; // Each subclass should have a unique ID.
    owner; // e.g. The entity that spawned a projectile is the owner.

    inventory;
    purse;

    screen;
    x;
    y;
    animationShiftX = 0;
    animationShiftY = 0;

    // Certain entities (i.e. players) can teleport home, so store the desired location here.
    homeMapName;
    homeScreenName;
    homeX = 1;
    homeY = 1;
    


    isPlayer = false;
    isTangible = false; // Tangible objects block movement and can interact with projectiles.
    isActionBlocker = false; // Action blockers block projectiles without interacting with them.



    isMoveInProgress = false;

    canMove = true;
    canAction = true;
    canInventory = true;
    canPurse = true;
    canCreate = true;

    // Seconds to perform 1 movement or action.
    movementTime = 0.1;
    actionTime = 0.1;
    inventoryTime = 0.1;
    purseTime = 0.1;
    createTime = 0.1

    // To avoid awkward edge cases, just make every entity start facing to the right.
    direction = "right";

    // By default, entities don't form into stacks of themselves.
    maxStackNumber = 1;
    maxStackSize = 1;
    stackSize = 1;

    getName() {
        return "?";
    }

    getInfo() {
        return "?";
    }

    getServerClock() {
        return this.screen.map.world.universe.server.serverClock;
    }

    getServerCounter() {
        return this.screen.map.world.universe.server.serverCounter;
    }

    // All of the main actions an entity can take are added onto the server queue.
    addExperience(experience) {
        if(this.canAction) {
            this.canAction = false;

            this.getServerClock().addTask(this.actionTime, () => {
                this.canAction = true;
            });

            this.getServerClock().addTask(0, () => {
                this.doAddExperience(experience);
            });
        }
    }

    addHealth(health) {
        if(this.canAction) {
            this.canAction = false;

            this.getServerClock().addTask(this.actionTime, () => {
                this.canAction = true;
            });

            this.getServerClock().addTask(0, () => {
                this.doAddHealth(health);
            });
        }
    }

    addMana(mana) {
        if(this.canAction) {
            this.canAction = false;

            this.getServerClock().addTask(this.actionTime, () => {
                this.canAction = true;
            });

            this.getServerClock().addTask(0, () => {
                this.doAddMana(mana);
            });
        }
    }

    makeInvincible(invincibleSeconds) {
        if(this.canAction) {
            this.canAction = false;

            this.getServerClock().addTask(this.actionTime, () => {
                this.canAction = true;
            });

            this.getServerClock().addTask(0, () => {
                this.doMakeInvincible(invincibleSeconds);
            });
        }
    }

    createEntity(entity) {
        if(this.canCreate) {
            this.canCreate = false;

            this.getServerClock().addTask(this.createTime, () => {
                this.canCreate = true;
            });

            this.getServerClock().addTask(0, () => {
                this.doCreateEntity(entity);
            });
        }
    }

    despawn() {
        this.getServerClock().addTask(0, () => {
            this.doDespawn();
        });
    }

    spawn() {
        this.getServerClock().addTask(0, () => {
            this.doSpawn();
        });
    }

    spawnInWorld(world) {
        this.getServerClock().addTask(0, () => {
            this.doSpawnInWorld(world);
        });
    }

    action() {
        if(this.canAction) {
            this.canAction = false;

            this.getServerClock().addTask(this.actionTime, () => {
                this.canAction = true;
            });

            this.getServerClock().addTask(0, () => {
                this.doAction();
            });
        }
    }

    teleport(screen, x, y) {
        if(this.canMove) {
            this.canMove = false;

            this.getServerClock().addTask(this.movementTime, () => {
                this.canMove = true;
            });

            this.getServerClock().addTask(0, () => {
                this.doTeleport(screen, x, y);
            });
        }
    }

    teleportHome() {
        if(this.canMove) {
            this.canMove = false;

            this.getServerClock().addTask(this.movementTime, () => {
                this.canMove = true;
            });

            this.getServerClock().addTask(0, () => {
                this.doTeleportHome();
            });
        }
    }

    kill() {
        if(this.canMove) {
            this.canMove = false;

            this.getServerClock().addTask(this.movementTime, () => {
                this.canMove = true;
            });

            this.getServerClock().addTask(0, () => {
                this.doKill();
            });
        }
    }

    revive() {
        if(this.canMove) {
            this.canMove = false;

            this.getServerClock().addTask(this.movementTime, () => {
                this.canMove = true;
            });

            this.getServerClock().addTask(0, () => {
                this.doRevive();
            });
        }
    }

    move(direction, range) {
        if(!this.isMoveInProgress) {
            this.direction = direction;
        }

        if(this.canMove && this.isNextStepAllowed(direction)) {
            this.isMoveInProgress = true;
            this.canMove = false;
            
            for(let a = 0; a < Performance.MOVEMENT_FRAMES; a++) {
                let fraction = a / Performance.MOVEMENT_FRAMES;
                this.getServerClock().addTask(this.movementTime * fraction, () => {
                    let [shiftX, shiftY] = Util.getDirectionalShift(direction);
                    this.animationShiftX = (shiftX * fraction);
                    this.animationShiftY = (shiftY * fraction);
                });
            }
            this.getServerClock().addTask(this.movementTime, () => {
                this.animationShiftX = 0;
                this.animationShiftY = 0;

                this.isMoveInProgress = false;
                this.canMove = true;

                this.doMove(direction, range);
            });
        }
    }

    changeDirection(direction) {
        if(!this.isMoveInProgress) {
            this.direction = direction;
        }

        if(this.canMove) {
            this.isMoveInProgress = true;
            this.canMove = false;

            this.getServerClock().addTask(this.movementTime, () => {
                this.isMoveInProgress = false;
                this.canMove = true;

                this.doChangeDirection(direction);
            });
        }
    }

    wait() {
        if(this.canMove) {
            this.canMove = false;

            this.getServerClock().addTask(this.movementTime, () => {
                this.canMove = true;
                this.doWait();
            });
        }
    }



    moveScreen(direction) {
        if(this.canMove) {
            this.canMove = false;

            this.getServerClock().addTask(this.movementTime, () => {
                this.canMove = true;
            });

            this.getServerClock().addTask(0, () => {
                this.doMoveScreen(direction);
            });
        }
    }

    moveMap(direction) {
        if(this.canMove) {
            this.canMove = false;

            this.getServerClock().addTask(this.movementTime, () => {
                this.canMove = true;
            });

            this.getServerClock().addTask(0, () => {
                this.doMoveMap(direction);
            });
        }
    }


    moveWorld(direction) {
        if(this.canMove) {
            this.canMove = false;

            this.getServerClock().addTask(this.movementTime, () => {
                this.canMove = true;
            });

            this.getServerClock().addTask(0, () => {
                this.doMoveWorld(direction);
            });
        }
    }

    addToPurse(gold) {
        if(this.canPurse) {
            this.canPurse = false;

            this.getServerClock().addTask(this.purseTime, () => {
                this.canPurse = true;
            });

            this.getServerClock().addTask(0, () => {
                this.doAddToPurse(gold);
            });
        }
    }

    dropFromPurse(goldAmount) {
        if(this.canPurse) {
            this.canPurse = false;

            this.getServerClock().addTask(this.purseTime, () => {
                this.canPurse = true;
            });

            this.getServerClock().addTask(0, () => {
                this.doDropFromPurse(goldAmount);
            });
        }
    }


    addToInventory(entity) {
        if(this.canInventory) {
            this.canInventory = false;

            this.getServerClock().addTask(this.inventoryTime, () => {
                this.canInventory = true;
            });

            this.getServerClock().addTask(0, () => {
                this.doAddToInventory(entity);
            });
        }
    }

    consumeFromInventory(slot) {
        if(this.canInventory) {
            this.canInventory = false;

            this.getServerClock().addTask(this.inventoryTime, () => {
                this.canInventory = true;
            });

            this.getServerClock().addTask(0, () => {
                this.doConsumeFromInventory(slot);
            });
        }
    }

    dropFromInventory(slot, number) {
        if(this.canInventory) {
            this.canInventory = false;

            this.getServerClock().addTask(this.inventoryTime, () => {
                this.canInventory = true;
            });

            this.getServerClock().addTask(0, () => {
                this.doDropFromInventory(slot, number);
            });
        }
    }

    swapInventorySlots(slot1, slot2) {
        if(this.canInventory) {
            this.canInventory = false;

            this.getServerClock().addTask(this.inventoryTime, () => {
                this.canInventory = true;
            });

            this.getServerClock().addTask(0, () => {
                this.doSwapInventorySlots(slot1, slot2);
            });
        }
    }










    doAddExperience(experience) {
        // By default, do nothing.
    }

    doAddHealth(health) {
        // By default, do nothing.
    }

    doAddMana(mana) {
        // By default, do nothing.
    }

    doMakeInvincible(invincibleSeconds) {
        // By default, do nothing.
    }

    doCheckCollision() {
        // Call this after any movement to see if this entity is overlapping another on the same screen.
        let overlappingEntities = this.screen.getOverlappingEntities(this);
        for(let overlappingEntity of overlappingEntities) {
            this.doInteract(overlappingEntity);
            overlappingEntity.doInteract(this);
        }
    }

    isNextStepAllowed(direction) {
        // By default, check screen edges and if any entities in the direction block movement.
        let isFacingEdge = this.screen.isFacingEdge(this, direction);
        let canCrossScreen = this.canCrossScreen();
        let isScreenInDirection = this.isScreenInDirection(direction);
        if(isFacingEdge && (!canCrossScreen || !isScreenInDirection)) {
            return false;
        }
        
        let [shiftX, shiftY] = Util.getDirectionalShift(direction);
        let x = this.x + shiftX;
        let y = this.y + shiftY;

        let entities = this.screen.getEntitiesAt(x, y);
        for(let entity of entities) {
            if(this !== entity && this.isBlockedBy(entity)) {
                return false;
            }
        }

        return true;
    }

    canConsume(entity) {
        // By default, any entity can consume any item.
        return true;
    }

    doConsume(entity) {
        // By default, do nothing.
    }

    doDespawn() {
        this.isSpawned = false;
        this.screen.removeEntity(this);

        if(this.inventory) {
            this.getServerCounter().deregister("inventory", this.inventory.numItems());
        }
    }

    doInteract(entity) {
        // By default, do nothing.
    }

    doCreateEntity(entity) {
        entity.owner = this;
        entity.spawn();
    }

    doSpawn() {
        this.isSpawned = true;
        this.screen.addEntity(this);
    }

    doSpawnInWorld(world) {
        // Spawns into the same map/screen/x/y that the entity is already located at but in the given world.
        this.doSpawn();

        let map = world.getMapByName(this.screen.map.name);
        let screen = map?.getScreenByName(this.screen.name);

        if(screen) {
            this.doTeleport(screen, this.x, this.y);
        }
    }

    //let screen = world.getMapByName(client.player.homeMapName).getScreenByName(client.player.homeScreenName);

    doSpawnAsLoot() {
        // Spawns this entity as loot (i.e. it will despawn after a certain amount of time).
        this.doSpawn();

        this.getServerClock().addTask(Performance.LOOT_TIME, () => {
            this.doDespawn();
        })
    }

    doTakeDamage(entity, damage) {
        // By default, do nothing.
    }






    doAction() {
        // By default, do nothing.
    }

    doTeleport(screen, x, y) {
        // Move to an arbitrary point in the world. Do not check collision or call spawn/respawn.
        this.x = x;
        this.y = y;

        // If the entity stays on the same screen, this is skipped to avoid triggering deregistration of instance screens.
        if(this.screen !== screen) {
            this.screen.removeEntity(this);
            this.screen = screen;
            screen.addEntity(this, x, y);
        }
    }

    doTeleportHome() {
        let homeMap = this.screen.map.world.getMapByName(this.homeMapName);
        let homeScreen = homeMap?.getScreenByName(this.homeScreenName);

        if(homeScreen) {
            this.doTeleport(homeScreen, this.homeX, this.homeY);
        }
    }

    doTeleportDeath() {
        // Teleport the entity to the death plane.
        let deathMap = this.screen.map.world.getMapByPosition("death");
        let deathScreen = deathMap.getScreenByPosition(0, 0);
        this.doTeleport(deathScreen, 7, 11);
    }

    doKill() {
        // Called when an entity is killed but not despawned, for example players who die and get sent to the death plane.
        this.health = 0;
        this.mana = 0;

        this.isDead = true;
        this.isInvincible = false;

        // ??? If the player is in a dungeon, could we just teleport them to the entrance instead?
        this.doTeleportDeath();
    }

    doRevive() {
        // Called when an entity is revived but was not despawned first, for example players who enter a revive portal.
        this.health = this.maxHealth;
        this.mana = this.maxMana;

        this.isDead = false;

        this.doTeleportHome();
    }

    // By default, movement happens one tile at a time, and if the edge is crossed then the entity moves to the next screen.
    // Also, if you move onto another entity, the two entities interact with each other.
    doMoveStep(direction) {
        if(this.screen.isFacingEdge(this, direction)) {
            // Cross into the next screen.
            this.screen.doCrossScreen(this, direction);
        }
        else {
            // Just do normal movement.
            let [shiftX, shiftY] = Util.getDirectionalShift(direction);
            this.x += shiftX;
            this.y += shiftY;
        }

        this.doCheckCollision();
    }

    doMove(direction, range) {
        this.doMoveStep(direction);

        range--;
        if(this.isSpawned && range > 0) {
            this.move(direction, range);
        }
    }

    doChangeDirection(direction) {
        // By default, do nothing.
    }

    doWait() {
        // By default, do nothing.
    }

    isScreenInDirection(direction) {
        return this.screen.isScreenInDirection(direction);
    }

    doMoveScreen(direction) {
        let newScreen = this.screen.getScreenInDirection(direction);
        this.doTeleport(newScreen, this.x, this.y);
    }

    doMoveMap(direction) {
        let newMap = this.screen.getMapInDirection(direction);
        let newScreen = newMap.getScreenByPosition(this.screen.x, this.screen.y);
        this.doTeleport(newScreen, this.x, this.y);
    }

    doMoveWorld(direction) {
        let newWorld = this.screen.getWorldInDirection(direction);
        let newMap = newWorld.getMapByPosition(this.screen.map.id);
        let newScreen = newMap.getScreenByPosition(this.screen.x, this.screen.y);
        this.doTeleport(newScreen, this.x, this.y);
    }

    doAddToPurse(gold) {
        if(this.purse) {
            this.purse.addToPurse(gold);
            if(gold.stackSize === 0) {
                gold.doDespawn();
            }
        }
    }

    doDropFromPurse(goldAmount) {
        if(this.purse) {
            // A negative value or a value too large means to drop all the gold.
            if(goldAmount < 0 || goldAmount > this.purse.goldTotal) {
                goldAmount = this.purse.goldTotal;
            }

            if(goldAmount > 0) {
                let gold = EntityFactory.createInstance("gold", goldAmount);
                gold.screen = this.screen;
                gold.x = this.x;
                gold.y = this.y;

                gold.doSpawnAsLoot();

                this.purse.removeFromPurse(goldAmount);
            }
        }
    }

    doAddToInventory(entity) {
        if(this.inventory) {
            this.inventory.addToInventory(entity);
            if(entity.stackSize === 0) {
                entity.doDespawn();
            }
        }
    }

    doConsumeFromInventory(slot) {
        // Consume 1 item in this inventory slot.
        if(this.inventory) {
            let item = this.inventory.itemMap.get(slot);
            if(item && item.canConsume(this)) {
                item.doConsume(this);
                this.inventory.removeFromInventorySlot(slot, 1);
            }
        }
    }

    doDropFromInventory(slot, number) {
        // Drop a number of items from a stack without consuming them.
        if(this.inventory) {
            let item = this.inventory.itemMap.get(slot);
            if(item) {
                // A negative value or a value too large means to drop the entire stack.
                if(number < 0 || number > item.stackSize) {
                    number = item.stackSize;
                }

                if(number > 0) {
                    let itemDrop = EntityFactory.createInstance(item.id, number);
                    itemDrop.screen = this.screen;
                    itemDrop.x = this.x;
                    itemDrop.y = this.y;

                    itemDrop.doSpawnAsLoot();

                    this.inventory.removeFromInventorySlot(slot, number);
                }
            }
        }
    }

    doSwapInventorySlots(slot1, slot2) {
        if(this.inventory) {
            this.inventory.swapInventorySlots(slot1, slot2);
        }
    }





    getRootEntity(entity) {
        let rootEntity = entity;

        while(rootEntity.owner) {
            rootEntity = rootEntity.owner;
        }

        return rootEntity;
    }

    clone(number) {
        // By default, just create another instance.
        return EntityFactory.createInstance(this.id, number);
    }

    isBlockedBy(entity) {
        // By default, an entity is blocked from moving by any other tangible entity.
        return entity.isTangible;
    }

    canCrossScreen() {
        // By default, an entity can cross into any screen that exists.
        return true;
    }

    isAt(x, y) {
        // Returns true if this entity is at the point or currently moving onto the point.
        return (this.x === x && this.y === y) || (this.getMovementX() === x && this.getMovementY() === y);
    }

    getMovementX() {
        // Returns x, but if movement is in progress return the value that the entity is moving towards.
        let [shiftX, ] = Util.getDirectionalShift(this.direction);
        return this.isMoveInProgress ? this.x + shiftX : this.x;
    }

    getMovementY() {
        // Returns y, but if movement is in progress return the value that the entity is moving towards.
        let [, shiftY] = Util.getDirectionalShift(this.direction);
        return this.isMoveInProgress ? this.y + shiftY : this.y;
    }

    serialize() {
        let s = "{";
        s += "\"classname\":";
        s += "\"" + this.constructor.name + "\"";
        s += ",";
        s += "\"id\":";
        s += "\"" + this.id + "\"";
        s += ",";
        s += "\"stackSize\":";
        s += "\"" + this.stackSize + "\"";
        s += ",";
        s += "\"x\":";
        s += "\"" + this.x + "\"";
        s += ",";
        s += "\"y\":";
        s += "\"" + this.y + "\"";
        s += "}";

        return s;
    }
}

module.exports = Entity;