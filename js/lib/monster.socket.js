define(function(require){
	var $ = require('jquery'),
		_ = require('underscore'),
		monster = require('monster');

	var privateSocket = {
		hardCodedTestSubId: 'monster-binding-123',
		initialize: function() {
			var self = this;

			self.object = new WebSocket(monster.config.api.socket);

			self.object.onopen = function(data) {
				console.log('open', data);
			}

			self.object.onclose = function(data) {
				console.log('close', data);
			}

			self.object.onmessage = function(event) {
				var data = JSON.parse(event.data);

				self.onEvent(data);
			}
		},
		object: {},
		bindings: {},

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
				self.object.send(JSON.stringify({"action": "unsubscribe", "account_id": accountId, "auth_token": authToken, "binding": binding}));
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
				self.object.send(JSON.stringify({"action": "subscribe", "account_id": accountId, "auth_token": authToken, "binding": binding}));
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
		privateSocket.initialize();

		socket.bind = function(binding, accountId, authToken, func, source) {
			privateSocket.addListener(binding, accountId, authToken, func, source);
		};

		socket.unbind = function(binding, accountId, authToken, source) {
			privateSocket.removeListener(binding, accountId, authToken, source);
		}
	}

	return socket;
});
