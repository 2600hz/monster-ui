define(function(require){
	var $ = require('jquery'),
		_ = require('underscore'),
		monster = require('monster');

	var privateSocket = {
		connected: false,

		close: function() {
			var self = this;
			self.object.close();
		},

		initialize: function() {
			var self = this,
				socket = self.initializeSocket();

			socket.onopen = function(data) {
				console.log('Successful WebSocket connection');
				self.connected = true;
				self.object = socket;
				self.initializeSocketEvents(socket);
				monster.pub('socket.connected');
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
				console.log('WebSocket connection closed');
			};

			socket.onmessage = function(event) {
				var data = JSON.parse(event.data);

				self.onEvent(data);
			};

			_.each(self.bindings, function(binding, name) {
				_.each(binding.listeners, function(listener) {
					self.subscribe(listener.accountId, listener.authToken, name);
				});
			});
		},

		connect: function() {
			var self = this,
				interval = setInterval(function() {
					if(!self.connected) {
						console.log('Attempting to reconnect to WebSocket');
						self.initialize();
					}
					else {
						clearInterval(interval);
					}
				}, 3000);

			self.initialize();
		},
		object: {},
		bindings: {},

		subscribe: function(accountId, authToken, binding) {
			var self = this;

			self.object.send(JSON.stringify({'action': 'subscribe', 'account_id': accountId, 'auth_token': authToken, 'binding': binding}));
		},
		unsubscribe: function(accountId, authToken, binding) {
			var self = this;

			self.object.send(JSON.stringify({'action': 'unsubscribe', 'account_id': accountId, 'auth_token': authToken, 'binding': binding}));
		},

		onEvent: function(data) {
			var self = this,
				bindingId = data.binding,
				executeCallbacks = function(subscription) {
					_.each(subscription.listeners, function(listener) {
						listener.callback(data);
					});
				};

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
				self.unsubscribe(accountId, authToken, binding);
				delete self.bindings[binding];
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
					console.log('already bound!')
				}
			}
			else {
				self.subscribe(accountId, authToken, binding);
				self.bindings[binding] = {
					listeners: [ newListener ]
				}
			}
		}
	};

	var socket = {
		bind: function() {
			console.log('no websockets defined');
		}
	};

	if(monster.config.api.hasOwnProperty('socket')) {
		privateSocket.connect();

		socket.bind = function(binding, accountId, authToken, func, source) {
			privateSocket.addListener(binding, accountId, authToken, func, source);
		};

		socket.unbind = function(binding, accountId, authToken, source) {
			privateSocket.removeListener(binding, accountId, authToken, source);
		}

		socket.close = function() {
			privateSocket.close();
		}
	}

	return socket;
});
