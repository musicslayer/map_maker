class Inventory {
    maxSlots = 45;
    itemArray = [];

    owner;

    constructor(owner) {
        this.owner = owner;

        // Prefill inventory to make logic easier.
        for(let index = 0; index < this.maxSlots; index++) {
            this.itemArray[index] = undefined;
        }
    }

    // Return value is whether the ENTIRE entity was added to the inventory (i.e. if we need to despawn it)
    addToInventory(entity) {
        let numStacks = 0;

        // See if this item is already in the inventory and there is room in the stack to add it.
        for(let index = 0; index < this.maxSlots && entity.stackSize > 0; index++) {
            let item = this.itemArray[index];
            if(item && item.id === entity.id) {
                // Item is already in the inventory. Add as much of the entity's stack as we can to this stack.
                numStacks++;

                let N = Math.min(entity.stackSize, item.maxStackSize - item.stackSize);

                entity.stackSize -= N;
                item.stackSize += N;
            }
        }

        // There is no more room in existing stacks, so now we try to create new stacks.
        for(let index = 0; index < this.maxSlots && entity.stackSize > 0 && numStacks < entity.maxStackNumber; index++) {
            if(this.itemArray[index] === undefined) {
                numStacks++;

                let item = this.owner.getWorld().cloneInstance(entity, 0, this.owner.screen);
                this.itemArray[index] = item;
                this.owner.getWorld().register("inventory", 1);

                let N = Math.min(entity.maxStackSize, entity.stackSize);

                entity.stackSize -= N;
                item.stackSize += N;
            }
        }
    }

    removeFromInventorySlot(slot, number) {
        let item = this.itemArray[slot];
        if(item) {
            item.stackSize -= number;
            if(item.stackSize === 0) {
                this.itemArray[slot] = undefined;
                this.owner.getWorld().deregister("inventory", 1);
            }
        }
    }

    swapInventorySlots(slot1, slot2) {
        let item1 = this.itemArray[slot1];
        let item2 = this.itemArray[slot2];

        this.itemArray[slot1] = item2;
        this.itemArray[slot2] = item1;
    }
}

module.exports = Inventory;