const Server = require("../server/Server.js");

class Keyboard {
    _spacebar = 32;

    _leftarrow = 37;
    _uparrow = 38;
    _rightarrow = 39;
    _downarrow = 40;

    _0 = 48;
    _1 = 49;
    _2 = 50;
    _3 = 51;
    _4 = 52;
    _5 = 53;
    _6 = 54;
    _7 = 55;
    _8 = 56;
    _9 = 57;

    _a = 65;
    _b = 66;
    _c = 67;
    _d = 68;
    _e = 69;
    _f = 70;
    _g = 71;
    _h = 72;
    _i = 73;
    _j = 74;
    _k = 75;
    _l = 76;
    _m = 77;
    _n = 78;
    _o = 79;
    _p = 80;
    _q = 81;
    _r = 82;
    _s = 83;
    _t = 84;
    _u = 85;
    _v = 86;
    _w = 87;
    _x = 88;
    _y = 89;
    _z = 90;

    _equals = 187;
    _dash = 189;


    flagInventoryPrevious;
    flagInventoryNext;
    flagInventoryUse;

    flagAction;
    flagTeleportHome;

    flagExperienceBoost;
    flagHealthBoost;
    flagManaBoost;

    flagMoveDown;
    flagMoveUp;
    flagMoveLeft;
    flagMoveRight;

    flagScreenDown;
    flagScreenUp;
    flagScreenLeft;
    flagScreenRight;

    flagMapDown;
    flagMapUp;

    inputInventoryPrevious;
    inputInventoryNext;
    inputInventoryUse;

    inputAction;
    inputTeleportHome;

    inputExperienceBoost;
    inputHealthBoost;
    inputManaBoost;

    inputMoveDown;
    inputMoveUp;
    inputMoveLeft;
    inputMoveRight;

    inputScreenDown;
    inputScreenUp;
    inputScreenLeft;
    inputScreenRight;

    inputMapDown;
    inputMapUp;

    constructor() {
        this.inputInventoryPrevious = this._f;
        this.inputInventoryNext = this._g;
        this.inputInventoryUse = this._h;

        this.inputAction = this._spacebar;
        this.inputTeleportHome = this._t;

        this.inputExperienceBoost = this._e;
        this.inputHealthBoost = this._r;
        this.inputManaBoost = this._y;

        this.inputMoveDown = this._downarrow;
        this.inputMoveUp = this._uparrow;
        this.inputMoveLeft = this._leftarrow;
        this.inputMoveRight = this._rightarrow;

        this.inputScreenDown = this._s;
        this.inputScreenUp = this._w;
        this.inputScreenLeft = this._a;
        this.inputScreenRight = this._d;

        this.inputMapUp = this._i;
        this.inputMapDown = this._k;

        Server.addRefresh(() => { this.resetFlags() });
    }

    resetFlags() {
        this.flagInventoryPrevious = false;
        this.flagInventoryNext = false;
        this.flagInventoryUse = false;
        this.flagAction = false;
        this.flagTeleportHome = false;
        this.flagExperienceBoost = false;
        this.flagHealthBoost = false;
        this.flagManaBoost = false;
        this.flagMoveDown = false;
        this.flagMoveUp = false;
        this.flagMoveLeft = false;
        this.flagMoveRight = false;
        this.flagScreenDown = false;
        this.flagScreenUp = false;
        this.flagScreenLeft = false;
        this.flagScreenRight = false;
        this.flagMapDown = false;
        this.flagMapUp = false;
    }

    processKeyPress(key) {
        let input;

        // Inventory
        if(key === this.inputInventoryPrevious && !this.flagInventoryPrevious) {
            this.flagInventoryPrevious = true;
            input = "inventory_previous";
        }

        else if(key === this.inputInventoryNext && !this.flagInventoryNext) {
            this.flagInventoryNext = true;
            input = "inventory_next";
        }

        else if(key === this.inputInventoryUse && !this.flagInventoryUse) {
            this.flagInventoryUse = true;
            input = "inventory_use";
        }

        // Player Action
        else if(key === this.inputAction && !this.flagAction) {
            this.flagAction = true;
            input = "action";
        }

        // Player Teleport Home
        else if(key === this.inputTeleportHome && !this.flagTeleportHome) {
            this.flagTeleportHome = true;
            input = "teleport_home";
        }

        // Player Boosts
        else if(key === this.inputExperienceBoost && !this.flagExperienceBoost) {
            this.flagExperienceBoost = true;
            input = "boost_experience";
        }

        else if(key === this.inputHealthBoost && !this.flagHealthBoost) {
            this.flagHealthBoost = true;
            input = "boost_health";
        }

        else if(key === this.inputManaBoost && !this.flagManaBoost) {
            this.flagManaBoost = true;
            input = "boost_mana";
        }

        // Move Position
        else if(key === this.inputMoveUp && !this.flagMoveUp) {
            this.flagMoveUp = true;
            input = "move_up";
        }
        else if(key === this.inputMoveDown && !this.flagMoveDown) {
            this.flagMoveDown = true;
            input = "move_down";
        }
        else if(key === this.inputMoveLeft && !this.flagMoveLeft) {
            this.flagMoveLeft = true;
            input = "move_left";
        }
        else if(key === this.inputMoveRight && !this.flagMoveRight) {
            this.flagMoveRight = true;
            input = "move_right";
        }

        // Move Screens
        else if(key === this.inputScreenUp && !this.flagScreenUp) {
            this.flagScreenUp = true;
            input = "screen_up";
        }
        else if(key === this.inputScreenDown && !this.flagScreenDown) {
            this.flagScreenDown = true;
            input = "screen_down";
        }
        else if(key === this.inputScreenLeft && !this.flagScreenLeft) {
            this.flagScreenLeft = true;
            input = "screen_left";
        }
        else if(key === this.inputScreenRight && !this.flagScreenRight) {
            this.flagScreenRight = true;
            input = "screen_right";
        }

        // Move Maps
        else if(key === this.inputMapUp && !this.flagMapUp) {
            this.flagMapUp = true;
            input = "map_up";
        }
        else if(key === this.inputMapDown && !this.flagMapDown) {
            this.flagMapDown = true;
            input = "map_down";
        }

        return input;
    }
}

module.exports = Keyboard;