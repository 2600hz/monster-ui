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
				var parsedEvent = JSON.parse(event.data);

				socket.trigger(parsedEvent);
			}
		},
		object: {},
		subscriptions: [],
		bindings: {},
		onEvent: function(data) {
			var self = this;

			_.each(self.subscriptions, function(subscription) {
				if(subscription.id === (data.subscription_id || self.hardCodedTestSubId)) {
					subscription.callback(data);
				}
			});
		},
		addSubscription: function(binding, accountId, authToken, callback, source) {
			var self = this,
				id = accountId + authToken;

			if(!self.bindings.hasOwnProperty(id)) {
				self.bindings[id] = {};
			}

			if(!self.bindings[id].hasOwnProperty(binding)) {
				var subscriptionId = self.object.send(JSON.stringify({"action": "subscribe", "account_id": accountId, "auth_token": authToken, "binding": binding}));

				self.bindings[id][binding] = {
					subscriptionId: subscriptionId || self.hardCodedTestSubId,
					count: 0
				};
			}

			var found = false;
			_.each(self.subscriptions, function(subscription) {
				if(subscription.binding === binding && subscription.accountId === accountId && subscription.authToken === authToken && subscription.source === source) {
					found = true;
				}
			});

			if(found === false) {
				self.bindings[id][binding].count++;
				self.subscriptions.push({ id: self.bindings[id][binding].subscriptionId, callback: callback, source: source, accountId: accountId, authToken:authToken, binding: binding });
			}
			else {
				console.log('subscription already exist, ignored');
			}
		},

		removeSubscription: function(binding, accountId, authToken, source) {
			var self = this,
				id = accountId + authToken;

			if(self.bindings.hasOwnProperty(id)) {
				if(self.bindings[id].hasOwnProperty(binding)) {
					var subscriptionsToKeep = [];
					_.each(self.subscriptions, function(subscription) {
						if(subscription.binding === binding && subscription.accountId === accountId && subscription.authToken === authToken && subscription.source === source) {
							self.bindings[id][binding].count--;
						}
						else {
							subscriptionsToKeep.push(subscription);
						}
					});
					self.subscriptions = subscriptionsToKeep;

					if(self.bindings[id][binding].count === 0) {
						self.object.send(JSON.stringify({"action": "unsubscribe", "account_id": accountId, "auth_token": authToken, "binding": binding}));
						delete self.bindings[id][binding];
					}
				}

				if(_.isEmpty(self.bindings[id])) {
					delete self.bindings[id];
				}
			}
		}
	};

	var socket = {
		bind: function() {
			console.log('no websockets defined');
		},

		trigger: function() {
			console.log('no websockets defined');
		}
	};

	if(monster.config.api.hasOwnProperty('socket')) {
		privateSocket.initialize();

		socket.bind = function(binding, accountId, authToken, func, source) {
			privateSocket.addSubscription(binding, accountId, authToken, func, source);
		};

		socket.unbind = function(binding, accountId, authToken, source) {
			privateSocket.removeSubscription(binding, accountId, authToken, source);
		},

		socket.trigger = function(data) {
			privateSocket.onEvent(data);
		}
	}

	return socket;
});
