const fs = require("fs");

const Screen = require("./Screen.js");
const VoidScreen = require("./VoidScreen.js");

const COMMA = ",";
const CRLF = "\r\n";
const PIPE = "|";

class GameMap {
    world;
    id;
    name;

    mapFolder;
    voidMapFolder;

    screens = [];
    screenMap = new Map();
    screenPosMap = new Map();

    loadMapFromFolder(mapFolder, voidMapFolder) {
        this.mapFolder = mapFolder;
        this.voidMapFolder = voidMapFolder;

        let mapData = fs.readFileSync(mapFolder + "_map.txt", "ascii");
        let lines = mapData ? mapData.split(CRLF) : [];

        // Each line represents a screen within this map.
        while(lines.length > 0) {
            let line = lines.shift();
            let parts = line.split(PIPE);

            // First part is the x,y
            let numPart = parts[0].split(COMMA);
            let x = Number(numPart.shift());
            let y = Number(numPart.shift());

            // Second part is the screen
            let name = parts[1];

            let screen = new Screen();
            screen.map = this;
            screen.name = name;
            screen.x = x;
            screen.y = y;

            screen.loadScreenFromFile(mapFolder + name + ".txt");

            this.addScreen(screen);
        }
    }

    addScreen(screen) {
        this.screens.push(screen);
        this.screenMap.set(screen.name, screen);

        let key = [screen.x, screen.y].join(",");
        this.screenPosMap.set(key, screen);
    }

    getScreen(name) {
        return this.screenMap.get(name);
    }

    isScreenUp(screen) {
        return this.isScreenByPosition(screen.x, screen.y - 1);
    }

    isScreenDown(screen) {
        return this.isScreenByPosition(screen.x, screen.y + 1);
    }

    isScreenLeft(screen) {
        return this.isScreenByPosition(screen.x - 1, screen.y);
    }

    isScreenRight(screen) {
        return this.isScreenByPosition(screen.x + 1, screen.y);
    }

    isScreenByPosition(screenX, screenY) {
        let key = [screenX, screenY].join(",");
        return this.screenPosMap.has(key);
    }

    getScreenUp(screen) {
        return this.getScreenByPosition(screen.x, screen.y - 1);
    }

    getScreenDown(screen) {
        return this.getScreenByPosition(screen.x, screen.y + 1);
    }

    getScreenLeft(screen) {
        return this.getScreenByPosition(screen.x - 1, screen.y);
    }

    getScreenRight(screen) {
        return this.getScreenByPosition(screen.x + 1, screen.y);
    }

    getScreenByPosition(screenX, screenY) {
        let key = [screenX, screenY].join(",");
        let screen = this.screenPosMap.get(key);

        // If this screen does not exist, return a dynamically generated "void" screen.
        if(!screen) {
            screen = this.createVoidScreen(screenX, screenY);
        }
        
        return screen;
    }

    createVoidScreen(screenX, screenY) {
        let voidScreen = new VoidScreen();
        voidScreen.map = this;
        voidScreen.x = screenX;
        voidScreen.y = screenY;

        voidScreen.loadScreenFromFile(this.voidMapFolder + "void.txt");
        
        return voidScreen;
    }

    getMapUp() {
        return this.world.getMapUp(this);
    }

    getMapDown() {
        return this.world.getMapDown(this);
    }
}

module.exports = GameMap;