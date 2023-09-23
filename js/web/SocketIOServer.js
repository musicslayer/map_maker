const IO = require("socket.io");

const Account = require("../account/Account.js");
const Character = require("../account/Character.js");
const Client = require("../client/Client.js");
const Constants = require("../constants/Constants.js");
const Entity = require("../entity/Entity.js");
const RateLimit = require("../security/RateLimit.js");
const Reflection = require("../reflection/Reflection.js");
const ServerTask = require("../server/ServerTask.js");

class SocketIOServer {
	server;

	accountManager;
    clientManager;
    serverManager;
	
	// Used to limit the amount of socket connections that an IP can form at once.
	numSocketsMap = new Map();

	constructor(httpServer, accountManager, clientManager, serverManager) {
		this.server = IO(httpServer.server, {
			// Use these options to only allow websockets and avoid memory leaks.
			allowUpgrades: false,
			transports: ["websocket"],

			// Use this so we don't serve clients extra files that we don't need.
			serveClient: false
		});

		this.accountManager = accountManager;
		this.clientManager = clientManager;
		this.serverManager = serverManager;

		this.attachConnectionListeners();
	}

	terminate() {
        this.server.close();
    }

	attachConnectionListeners() {
		this.server.on("connection", (socket) => {
			try {
				let ip = socket.handshake.address;
				let numSockets = this.numSocketsMap.get(ip) ?? 0;
				if(numSockets >= Constants.server.numAllowedSockets) {
					return;
				}
		
				numSockets++;
				this.numSocketsMap.set(ip, numSockets);
		
				socket.on("disconnect", (reason) => {
					try {
						let numSockets = this.numSocketsMap.get(ip);
						numSockets--;
						this.numSocketsMap.set(ip, numSockets);
					}
					catch(err) {
						console.error(err);
						socket.disconnect(true);
					}
				});
		
				this.attachAppListeners(socket);
			}
			catch(err) {
				console.error(err);
				socket.disconnect(true);
			}
		});
	}

	attachAppListeners(socket) {
		let ip = socket.handshake.address;

		// Respond to account creation.
		socket.on("on_account_creation", (username, password, callback) => {
			try {
				if(RateLimit.isRateLimited("create_account", ip)) {
					socket.disconnect(true);
					return;
				}

				if(!validateCallback(callback)) {
					socket.disconnect(true);
					return;
				}
				if(!validateStrings(username, password)) {
					socket.disconnect(true);
					return;
				}

				let key = username + "-" + password;
				if(this.accountManager.getAccount(key)) {
					// The account already exists.
					callback({"isSuccess": false});
					return;
				}

				// Create a new account.
				let account = new Account();
				account.key = key;
				this.accountManager.addAccount(account);

				callback({"isSuccess": true});
			}
			catch(err) {
				console.error(err);
				socket.disconnect(true);
			}
		});

		// Respond to character creation.
		socket.on("on_character_creation", (username, password, playerName, playerClass, callback) => {
			try {
				if(RateLimit.isRateLimited("create_character", ip)) {
					socket.disconnect(true);
					return;
				}

				if(!validateCallback(callback)) {
					socket.disconnect(true);
					return;
				}
				if(!validateStrings(username, password, playerName, playerClass)) {
					socket.disconnect(true);
					return;
				}

				let key = username + "-" + password;
				let account = this.accountManager.getAccount(key);
				if(!account) {
					// The account does not exist.
					callback({"isSuccess": false});
					return;
				}

				if(account.getCharacter(playerName)) {
					// The character already exists.
					callback({"isSuccess": false});
					return;
				}

				if(!Reflection.isSubclass(playerClass, "Player")) {
					callback({"isSuccess": false});
					return;
				}

				let player = Entity.createInstance(playerClass, 1);
				let character = new Character(player);
				account.addCharacter(playerName, character);

				callback({"isSuccess": true});
			}
			catch(err) {
				console.error(err);
				socket.disconnect(true);
			}
		});

		// Respond to the user wanting to select a character.
		socket.on("on_character_select", (username, password, callback) => {
			try {
				if(RateLimit.isRateLimited("select_character", ip)) {
					socket.disconnect(true);
					return;
				}

				if(!validateCallback(callback)) {
					socket.disconnect(true);
					return;
				}

				if(!validateStrings(username, password)) {
					socket.disconnect(true);
					return;
				}

				let key = username + "-" + password;
				let account = this.accountManager.getAccount(key);
				if(!account) {
					// The account does not exist.
					callback({"isSuccess": false});
					return;
				}

				// Return to the client a list of characters they can log in as.
				let characterNames = [];
				for(let characterName of account.characterMap.keys()) {
					characterNames.push(characterName);
				}

				callback({"isSuccess": true, "characterNames": characterNames});
			}
			catch(err) {
				console.error(err);
				socket.disconnect(true);
			}
		});

		// Respond to login.
		socket.on("on_login", (username, password, playerName, serverName, worldName, callback) => {
			try {
				if(RateLimit.isRateLimited("login", ip)) {
					socket.disconnect(true);
					return;
				}

				if(!validateCallback(callback)) {
					socket.disconnect(true);
					return;
				}

				if(!validateStrings(username, password, playerName, serverName, worldName)) {
					socket.disconnect(true);
					return;
				}

				let key = username + "-" + password;
				if(this.clientManager.clientMap.has(key)) {
					// User is already logged in.
					callback({"isSuccess": false});
					return;
				}

				let account = this.accountManager.getAccount(key);
				if(!account) {
					// The account does not exist.
					callback({"isSuccess": false});
					return;
				}

				let character = account.getCharacter(playerName);
				if(!character) {
					// The character does not exist.
					callback({"isSuccess": false});
					return;
				}

				let server = this.serverManager.getServerByName(serverName);
				let world = server?.universe.getWorldByName(worldName);
				if(!world) {
					callback({"isSuccess": false});
					return;
				}

				let player = character.player;

				let screen;
				if(player.mapName === undefined || player.screenName === undefined) {
					// On the first login use a tutorial screen.
					let tutorialWorld = world.universe.getWorldByID("tutorial");
					let entrance = tutorialWorld.createEntrance(world);

					screen = entrance.screen;
					player.x = entrance.x;
					player.y = entrance.y;
				}
				else {
					let map = world.getMapByName(player.mapName);
					screen = map?.getScreenByName(player.screenName);
				}

				if(!screen) {
					// Use a fallback screen.
					let fallbackWorld = world.universe.getWorldByID("fallback");
					let entrance = fallbackWorld.createEntrance(world);

					screen = entrance.screen;
					player.x = entrance.x;
					player.y = entrance.y;
				}

				player.setScreen(screen);
				
				let serverTask = new ServerTask(undefined, 0, 1, "spawn", player);
				player.getServer().scheduleTask(serverTask);

				let client = new Client(playerName, player);
				client.key = key;
				client.socket = socket;
				this.clientManager.addClient(client);

				player.client = client;

				socket.on("disconnect", (reason) => {
					let client = this.clientManager.getClient(key);
					this.clientManager.removeClient(client);

					// It's possible that a client is present but then a state is loaded where the player was despawned or did not exist.
					if(client.player) {
						if(client.player.isSpawned) {
							let serverTask = new ServerTask(undefined, 0, 1, "despawn", client.player);
							client.player.getServer().scheduleTask(serverTask);
						}

						client.player.client = undefined;
						client.player = undefined;
					}
				});

				this.attachClientListeners(socket, client);

				callback({"isSuccess": true});
			}
			catch(err) {
				console.error(err);
				socket.disconnect(true);
			}
		});
	}

	attachClientListeners(socket, client) {
		let ip = socket.handshake.address;
	
		// Respond to key presses.
		socket.on("on_key_press", (keys, callback) => {
			try {
				if(RateLimit.isRateLimited("input", ip)) {
					socket.disconnect(true);
					return;
				}

				if(!validateCallback(callback)) {
					socket.disconnect(true);
					return;
				}

				if(!validateKeys(keys)) {
					socket.disconnect(true);
					return;
				}

				client.onKeyPress(keys);
				callback();
			}
			catch(err) {
				console.error(err);
				socket.disconnect(true);
			}
		});
	
		// Respond to controller button presses.
		socket.on("on_controller_press", (buttons, callback) => {
			try {
				if(RateLimit.isRateLimited("input", ip)) {
					socket.disconnect(true);
					return;
				}

				if(!validateCallback(callback)) {
					socket.disconnect(true);
					return;
				}

				if(!validateButtons(buttons)) {
					socket.disconnect(true);
					return;
				}

				client.onControllerPress(buttons);
				callback();
			}
			catch(err) {
				console.error(err);
				socket.disconnect(true);
			}
		});
	
		// Respond to controller analog sticks.
		socket.on("on_controller_sticks", (axes, callback) => {
			try {
				if(RateLimit.isRateLimited("input", ip)) {
					socket.disconnect(true);
					return;
				}

				if(!validateCallback(callback)) {
					socket.disconnect(true);
					return;
				}

				if(!validateAxes(axes)) {
					socket.disconnect(true);
					return;
				}

				client.onControllerSticks(axes);
				callback();
			}
			catch(err) {
				console.error(err);
				socket.disconnect(true);
			}
		});
	
		// Respond to mouse clicks.
		socket.on("on_mouse_click", (button, location, info, callback) => {
			try {
				if(RateLimit.isRateLimited("input", ip)) {
					socket.disconnect(true);
					return;
				}

				if(!validateMouse(button, location, info)) {
					socket.disconnect(true);
					return;
				}

				client.onClick(button, location, info);
				callback();
			}
			catch(err) {
				console.error(err);
				socket.disconnect(true);
			}
		});
	
		// Respond to mouse drags.
		socket.on("on_mouse_drag", (button, location1, info1, location2, info2, callback) => {
			try {
				if(RateLimit.isRateLimited("input", ip)) {
					socket.disconnect(true);
					return;
				}

				if(!validateCallback(callback)) {
					socket.disconnect(true);
					return;
				}

				if(!validateMouse(button, location2, info2)) {
					socket.disconnect(true);
					return;
				}

				if(!validateMouse(button, location2, info2)) {
					socket.disconnect(true);
					return;
				}

				client.onDrag(button, location1, info1, location2, info2);
				callback();
			}
			catch(err) {
				console.error(err);
				socket.disconnect(true);
			}
		});
	
		// Send the client all the data needed to draw the player's screen.
		socket.on("get_client_data", (callback) => {
			try {
				if(RateLimit.isRateLimited("data", ip)) {
					socket.disconnect(true);
					return;
				}

				if(!validateCallback(callback)) {
					socket.disconnect(true);
					return;
				}

				let clientData = client.getClientData();
				callback({"isSuccess": true, "clientData": clientData});
			}
			catch(err) {
				console.error(err);
				socket.disconnect(true);
			}
		});
	
		// Send developer data to the client.
		socket.on("get_dev_data", (callback) => {
			try {
				if(RateLimit.isRateLimited("dev", ip)) {
					socket.disconnect(true);
					return;
				}

				if(!validateCallback(callback)) {
					socket.disconnect(true);
					return;
				}

				let devData = client.getDevData();
				callback({"isSuccess": true, "devData": devData});
			}
			catch(err) {
				console.error(err);
				socket.disconnect(true);
			}
		});
	}
}

function validateCallback(callback) {
	return isFunction(callback);
}

function validateKeys(keys) {
	return isNumberArray(keys, 20);
}

function validateButtons(buttons) {
	return isNumberArray(buttons, 20);
}

function validateAxes(axes) {
	return isNumberArray(axes, 4) && axes.length === 4
	&& axes[0] >= -1 && axes[0] <= 1
	&& axes[1] >= -1 && axes[1] <= 1
	&& axes[2] >= -1 && axes[2] <= 1
	&& axes[3] >= -1 && axes[3] <= 1;
}

function validateMouse(button, location, info) {
	return isNumber(button)
	&& isString(location)
	&& isNumberArray(info, 2)
	&& validateMouseInputs(location, info);
}

function validateMouseInputs(location, info) {
	if(location === "screen") {
		return info.length === 2;
	}
	else if(location === "inventory") {
		return info.length === 1;
	}
	else if(location === "purse") {
		return info.length === 0;
	}
	else {
		return false;
	}
}

function validateStrings(...args) {
	return isStringArray(args, 5);
}

function isFunction(value) {
	return typeof value === "function" || (typeof value === "object" && value instanceof Function);
}

function isNumber(value) {
	return typeof value === "number" || value instanceof Number;
}

function isNumberArray(value, maxLength) {
	return Array.isArray(value) && value.length <= maxLength && value.every((v) => isNumber(v));
}

function isString(value) {
	return typeof value === "string" || value instanceof String;
}

function isStringArray(value, maxLength) {
	return Array.isArray(value) && value.length <= maxLength && value.every((v) => isString(v));
}

module.exports = SocketIOServer;