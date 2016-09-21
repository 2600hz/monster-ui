define(function(require){
	var $ = require('jquery'),
		_ = require('underscore'),
		monster = require('monster');

	var privateSocket = {
		connected: false,

		printLogs: true,

		close: function() {
			var self = this;
			self.object.close();
		},

		log: function(str, force) {
			var self = this;

			if(self.printLogs || force) {
				console.log(str);
			}
		},

		initialize: function() {
			var self = this,
				socket = self.initializeSocket();

			socket.onopen = function(data) {
				if(self.connected === false) {
					self.log('Successful WebSocket connection');
					self.connected = true;
					self.object = socket;
					self.initializeSocketEvents(socket);
					monster.pub('socket.connected');
				}
				else {
					self.log('Socket already active');
					socket.close();
				}
			}
		},

		initializeSocket: function() {
			var self = this;

			return new WebSocket(monster.config.api.socket);
		},

		initializeSocketEvents: function(socket) {
			var self = this;

			socket.onclose = function(data) {
				self.connected = false;
				self.connect();
				self.log('WebSocket connection closed');
			};

			socket.onmessage = function(event) {
				var data = JSON.parse(event.data);

				if(data.action === 'reply') { 
					self.onReply(data);
				}
				else if(data.action === 'event') {
					self.onEvent(data);
				}
			};

			// Try to reconnect to all the old bindings, empty the key before trying so the addListener logic works properly
			var oldBindings = $.extend(true, {}, self.bindings);

			self.bindings = {};

			_.each(oldBindings, function(binding, name) {
				_.each(binding.listeners, function(listener) {
					self.addListener(name, listener.accountId, listener.authToken, listener.callback, listener.source);
				});
			});

			monster.socket.bind = function(binding, accountId, authToken, func, source) {
				self.addListener(binding, accountId, authToken, func, source);
			};

			monster.socket.unbind = function(binding, accountId, authToken, source) {
				self.removeListener(binding, accountId, authToken, source);
			}

			monster.socket.close = function() {
				self.close();
			}
		},

		// Reconnect loop that retries to connect after {{startingTimeout}} ms
		// In case it fails, we multiply the previous timeout by {{multiplier}}, and then try again once that time has gone by
		// The max timer is set to {{maxtimeout}}
		connect: function() {
			var self = this,
				timeoutDuration,
				startingTimeout = 250,
				maxTimeout = 1000*60,
				multiplier = 2,
				connectAttempt = function(){
					if(!self.connected) {
						self.initialize();

						if(timeoutDuration) {
							if((timeoutDuration * multiplier) < maxTimeout) {
								timeoutDuration *= multiplier;
							}
							else {
								timeoutDuration = maxTimeout;
							}

							self.log('Attempting to reconnect to WebSocket at ' + monster.util.toFriendlyDate(new Date()));
							self.log('Next try in ' + timeoutDuration/1000 + ' seconds');
						} 
						else {
							timeoutDuration = startingTimeout;

							self.log('Attempting to connect to WebSocket at ' + monster.util.toFriendlyDate(new Date()));
						}

						
						timeout = setTimeout(connectAttempt, timeoutDuration);
					}
				};

			connectAttempt();
		},

		object: {},
		bindings: {},
		commands: {},

		subscribe: function(accountId, authToken, binding, onReply) {
			var self = this,
				requestId = monster.util.guid();

			self.commands[requestId] = {
				onReply: onReply
			};

			return self.object.send(JSON.stringify({'action': 'subscribe', 'auth_token': authToken, 'request_id': requestId, 'data': { 'account_id': accountId,  'binding': binding }}));
		},
		unsubscribe: function(accountId, authToken, binding, onReply) {
			var self = this,
				requestId = monster.util.guid();

			self.commands[requestId] = {
				onReply: onReply
			};

			self.object.send(JSON.stringify({'action': 'unsubscribe','auth_token': authToken, 'request_id': requestId, 'data': {'binding': binding, 'account_id': accountId}}));
		},

		onEvent: function(data) {
			var self = this,
				bindingId = data.subscribed_key,
				executeCallbacks = function(subscription) {
					_.each(subscription.listeners, function(listener) {
						listener.callback(data.data);
					});
				};

			data.data.binding = bindingId;

			if(bindingId) {
				if(self.bindings.hasOwnProperty(bindingId)) {
					executeCallbacks(self.bindings[bindingId]);
				}
			}
			else {
				_.each(self.bindings, function(binding) {
					executeCallbacks(binding);
				});
			}
		},

		onReply: function(data) {
			var self = this,
				requestId = data.request_id;

			if(self.commands.hasOwnProperty(requestId)) {
				self.commands[requestId].onReply(data);
				delete self.commands[requestId];
			}
		},

		// When we remove a listener, we make sure to delete the subscription if our listener was the only listerner for that subscription
		// If there's more than one listener, then we just remove the listener from the array or listeners for that subscription
		removeListener: function removeListener(binding, accountId, authToken, source) {
			var self = this,
				listenersToKeep = [];

			if(self.bindings.hasOwnProperty(binding)) {
				_.each(binding.listeners, function(listener) {
					if(!(listener.accountId === accountId && listener.authToken === authToken && listener.source === source)) {
						listenersToKeep.push(listener);
					}
				});
			}

			if(listenersToKeep.length) {
				self.bindings[binding].listeners = listenersToKeep;
			}
			else {
				self.unsubscribe(accountId, authToken, binding, function(result) {
					if(result.status === 'success') {
						delete self.bindings[binding];
					}
					else {
						self.log('monster.socket: unsubscribe ' + binding + ' failed', true);
						self.log(result);
					}
				});
			}
		},

		// We only allow one same listener (binding / accountId / authToken) per source.
		// We look for the same exact listener, if we find it and the listener is for a different source, we store the subscription id as we can reuse the same subscription for our new source
		// If we don't find it, then we start a new subscription and add our listener to it
		addListener: function addListener(binding, accountId, authToken, func, source) {
			var self = this,
				found = false,
				newListener = {
					accountId: accountId,
					authToken: authToken,
					source: source,
					callback: func
				};

			if(self.bindings.hasOwnProperty(binding)) {
				_.each(self.bindings[binding].listeners, function(listener) {
					if(listener.accountId === newListener.accountId && listener.authToken === newListener.authToken && listener.source === newListener.source) {
						found = true;
					}
				})

				if(!found) {
					self.bindings[binding].listeners.push(newListener);
				}
				else {
					self.log('already bound!', true)
				}
			}
			else {
				self.subscribe(accountId, authToken, binding, function(result) {
					if(result.status === 'success') {
						self.bindings[binding] = {
							listeners: [ newListener ]
						}
					}
					else {
						self.log('monster.socket: subscribe ' + binding + ' failed', true);
						self.log(result);
					}
				});
			}
		}
	};

	var socket = {
		bind: function() {
			privateSocket.log('No WebSockets defined', true);
		},
		connect: function() {
			if(monster.config.api.hasOwnProperty('socket')) {
				privateSocket.connect();
			}
			else {
				privateSocket.log('No WebSocket API URL set in the config.js file', true)
			}
		}
	};

	return socket;
});
