const Util = require("../util/Util.js");
const UID = require("../uid/UID.js");

class ServerTask {
    server;
    owner;
    
    isRefreshTask = false;
    isCancelled = false;
    fcnString;
    args;

    constructor(fcn, ...args) {
        this.fcnString = fcn.toString();
        this.args = args;
    }

    static createRefreshTask(fcn, ...args) {
        let serverTask = new ServerTask(fcn, ...args);
        serverTask.isRefreshTask = true;
        return serverTask;
    }

    execute() {
        let fcn = new Function('return ' + this.fcnString)();
        if(this.isRefreshTask) {
            fcn(this, ...this.args);
        }
        else {
            fcn(...this.args);
        }
    }

    serialize(writer) {
        writer.beginObject()
            .serialize("!V!", 1)
            .reference("owner", this.owner)
            .serialize("isRefreshTask", this.isRefreshTask)
            .serialize("isCancelled", this.isCancelled)
            .serialize("fcnString", this.fcnString)
            .serialize("numArgs", this.args.length);

        for(let i = 0; i < this.args.length; i++) {
            let arg = this.args[i];

            if(arg instanceof UID) {
                writer.serialize("arg_isUID_" + i, true);
                writer.serialize("arg_class_" + i, Util.getClassName(arg));
                writer.reference("arg_" + i, arg);
            }
            else {
                writer.serialize("arg_isUID_" + i, false);
                writer.serialize("arg_class_" + i, Util.getClassName(arg));
                writer.serialize("arg_" + i, arg);
            }
        }

        writer.endObject();
    }

    static deserialize(reader) {
        let serverTask;
        reader.beginObject()

        let version = reader.deserialize("!V!", "String");
        if(version === "1") {
            let owner = reader.dereference("owner", "Entity");
            let isRefreshTask = reader.deserialize("isRefreshTask", "Boolean");
            let isCancelled = reader.deserialize("isCancelled", "Boolean");
            let fcnString = reader.deserialize("fcnString", "String");
            let numArgs = reader.deserialize("numArgs", "Number");

            let args = [];
            for(let i = 0; i < numArgs; i++) {
                let isUID = reader.deserialize("arg_isUID_" + i, "Boolean");
                let className = reader.deserialize("arg_class_" + i, "String");

                let arg;
                if(isUID) {
                    arg = reader.dereference("arg_" + i, className);
                }
                else {
                    arg = reader.deserialize("arg_" + i, className);
                }

                args.push(arg);
            }

            serverTask = new ServerTask(fcnString, ...args);
            serverTask.isRefreshTask = isRefreshTask;
            serverTask.isCancelled = isCancelled;

            if(owner) {
                serverTask.owner = owner;
                owner.serverTask = serverTask;
            }
        }
        else {
            throw("Unknown version number: " + version);
        }

        reader.endObject();
        return serverTask;
    }
}

module.exports = ServerTask;