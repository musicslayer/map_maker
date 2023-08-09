const AI = require("./AI.js");
const MoveAnimation = require("../animation/MoveAnimation.js");
const ServerTask = require("../server/ServerTask.js");

class ProjectileAI extends AI {
    generateNextActivity(projectile) {
        // Just keep moving in the same direction until the projectile despawns.
        if(!projectile.isSpawned) {
            return;
        }

        let serverTask = new ServerTask("move_step", projectile);
        projectile.getServer().scheduleTask(new MoveAnimation(projectile, projectile.moveTime), projectile.moveTime, 1, serverTask);
        
        let serverTask2 = new ServerTask("ai_generate_next_activity", projectile);
        projectile.getServer().scheduleTask(undefined, projectile.moveTime, 1, serverTask2);
    }
}

module.exports = ProjectileAI;