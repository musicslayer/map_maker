class Purse {
    maxGoldTotel = 100000;
    goldTotal = 0;

    addToPurse(gold) {
        let N = Math.min(gold.stackSize, this.maxGoldTotel - this.goldTotal);

        gold.stackSize -= N;
        this.goldTotal += N;
    }

    removeFromPurse(goldAmount) {
        this.goldTotal -= goldAmount;
    }
}

module.exports = Purse;