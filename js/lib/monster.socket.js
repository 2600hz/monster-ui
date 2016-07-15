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
				self.onEvent(JSON.parse(event.data));
			}
		},
		object: {},
		subscriptions: {},
		uniqueSubscriptionId: 0,

		onEvent: function(data) {
			var self = this,
				subscriptionId = data.subscription_id,
				executeCallbacks = function(subscription) {
					_.each(subscription.listeners, function(listener) {
						listener.callback(data);
					});
				};

			if(subscriptionId) {
				if(self.subscriptions.hasOwnProperty(subscriptionId)) {
					executeCallbacks(self.subscriptions[subscriptionId]);
				}
			}
			else {
				_.each(self.subscriptions, function(subscription) {
					executeCallbacks(subscription);
				});
			}
		},

		// When we remove a listener, we make sure to delete the subscription if our listener was the only listerner for that subscription
		// If there's more than one listener, then we just remove the listener from the array or listeners for that subscription
		removeListener(binding, accountId, authToken, source) {
			var self = this,
				found = false;

			_.each(self.subscriptions, function(subscription, id) {
				if(!found) {
					var listenersToKeep = [];

					_.each(subscription.listeners, function(listener) {
						if(!(listener.binding === binding && listener.accountId === accountId && listener.authToken === authToken && listener.source === source)) {
							listenersToKeep.push(listener);
						}
						else {
							found = true;
						}
					});

					if(listenersToKeep.length) {
						self.subscriptions[id].listeners = listenersToKeep;
					}
					else {
						self.object.send(JSON.stringify({"action": "unsubscribe", "account_id": accountId, "auth_token": authToken, "binding": binding}));
						delete self.subscriptions[id];
					}
				}
			})
		},

		// We only allow one same listener (binding / accountId / authToken) per source.
		// We look for the same exact listener, if we find it and the listener is for a different source, we store the subscription id as we can reuse the same subscription for our new source
		// If we don't find it, then we start a new subscription and add our listener to it
		addListener(binding, accountId, authToken, func, source) {
			var self = this,
				found = false,
				foundBindingId;

			_.each(self.subscriptions, function(subscription, subId) {
				_.each(subscription.listeners, function(listener) {
					if(listener.binding === binding && listener.accountId === accountId && listener.authToken === authToken) {
						if(listener.source === source) {
							found = true;
							console.log(source + ' is already bound to ' + binding);
						}
						else {
							foundBindingId = subId;
						}
					}
				})
			});

			if(found === false) {
				var newListener = { binding: binding, accountId, authToken: authToken, source: source, callback: func };

				if(foundBindingId) {
					self.subscriptions[foundBindingId].listeners.push(newListener);
				}
				else {
					self.uniqueSubscriptionId++;
					var id = (self.object.send(JSON.stringify({"action": "subscribe", "account_id": accountId, "auth_token": authToken, "binding": binding})) || self.uniqueSubscriptionId);

					self.subscriptions[id] = {
						listeners: [ newListener ]
					}
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
