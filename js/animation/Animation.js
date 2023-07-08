const Reflection = require("../reflection/Reflection.js");
const EntityFactory = require("../entity/EntityFactory.js");

class Animation {
    getClassName() {
        return this.constructor.name;
    }

    scheduleTasks(server) {
        let animationDataArray = this.getAnimationServerTasks(this) ?? [];
        for(let animationData of animationDataArray) {
            server.scheduleTask(animationData.animation, animationData.time, animationData.serverTask);
        }
    }

    serialize(writer) {
        writer.beginObject()
            .serialize("!V!", 1)
            .serialize("className", this.getClassName());

        // TODO Get rid of.
        if(this.getClassName() === "MoveAnimation") {
            writer.serialize("entity", this.entity.id)
                .serialize("time", this.time)
        }

        writer.endObject();
    }

    static deserialize(reader) {
        let animation;
        reader.beginObject();

        let version = reader.deserialize("!V!", "String");
        if(version === "1") {
            let className = reader.deserialize("className", "String");
            animation = Reflection.createInstance(className);

            if(className === "MoveAnimation") {
                let entityID = reader.deserialize("entity", "Number");
                animation.time = reader.deserialize("time", "Number");
                animation.entity = EntityFactory.entityMap.get(entityID);
            }
        }
        else {
            throw("Unknown version number: " + version);
        }

        reader.endObject();
        return animation;
    }
}

module.exports = Animation;