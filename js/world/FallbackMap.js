const path = require("path");

const Screen = require("./Screen.js");
const InstanceMap = require("./InstanceMap.js");

const NAME_PREFIX = "_fallback_";

class FallbackMap extends InstanceMap {
    getScreenByName(name) {
        // Return a dynamically generated "fallback" screen if the name starts with the expected prefix.
        let fallbackScreen;

        if(name.startsWith(NAME_PREFIX)) {
            name = name.slice(NAME_PREFIX.length);
            let [screenX, screenY] = name.split(",");
            fallbackScreen = this.createFallbackScreen(Number(screenX), Number(screenY));
        }

        return fallbackScreen;
    }

    getScreenByID(screenX, screenY) {
        // Always return a dynamically generated "fallback" screen.
        return this.createFallbackScreen(screenX, screenY);
    }

    createFallbackScreen(screenX, screenY) {
        let fallbackScreen = Screen.loadScreenFromFile(this, "FallbackScreen", path.join(this.mapFolder, "fallback.txt"));
        fallbackScreen.name = NAME_PREFIX + [screenX, screenY].join(",");
        fallbackScreen.x = screenX;
        fallbackScreen.y = screenY;
        fallbackScreen.pvpStatus = "safe";

        this.addScreen(fallbackScreen);
        
        return fallbackScreen;
    }
}

module.exports = FallbackMap;