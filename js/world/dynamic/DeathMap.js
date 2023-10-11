const path = require("path");

const Screen = require("../Screen.js");
const DynamicMap = require("./DynamicMap.js");

class DeathMap extends DynamicMap {
    getNamePrefix() {
        return "_death_";
    }

    createDynamicScreen(screenX, screenY) {
        let deathScreen = Screen.loadScreenFromFile(this, "DynamicScreen", path.join(this.mapFolder, "death.txt"));
        deathScreen.name = this.getNamePrefix() + [screenX, screenY].join(",");
        deathScreen.x = screenX;
        deathScreen.y = screenY;
        deathScreen.pvpStatus = "safe";

        this.addScreen(deathScreen);
        
        return deathScreen;
    }
}

module.exports = DeathMap;