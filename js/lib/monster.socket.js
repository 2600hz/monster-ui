define(function(require){
	var $ = require('jquery'),
		_ = require('underscore'),
		monster = require('monster');

	var privateSocket = {
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
		handlers: {},
		object: {},
		bindings: {},
		addBinding: function(accountId, authToken, binding) {
			var self = this,
				id = accountId + authToken;

			if(!self.bindings.hasOwnProperty(id)) {
				self.bindings[id] = {};
			}

			if(!self.bindings[id].hasOwnProperty(binding)) {
				self.bindings[id][binding] = 1;
				var subscriptionString = JSON.stringify({"action": "subscribe", "account_id": accountId, "auth_token": authToken, "binding": binding});
				self.object.send(subscriptionString);
			}
			else {
				self.bindings[id][binding]++;
			}
		},
		removeBinding: function(accountId, authToken, binding) {
			var self = this,
				id = accountId + authToken,
				unsubscriptionString = JSON.stringify({"action": "unsubscribe", "account_id": accountId, "auth_token": authToken, "binding": binding});

			if(!self.bindings.hasOwnProperty(id) || !self.bindings[id].hasOwnProperty(binding)) {
				self.object.send(unsubscriptionString);
			}
			else if(self.bindings[id][binding] === 1) {
				self.object.send(unsubscriptionString);
				delete self.bindings[id][binding];
			}
			else {
				self.bindings[id][binding]--;
			}
		},
		addHandler: function(binding, event, requiredSelector, accountId, authToken, func, source) {
			var self = this;

			if(typeof self.handlers[event.category] === 'undefined') {
				self.handlers[event.category] = {};
			}
			if(typeof self.handlers[event.category][event.name] === 'undefined') {
				self.handlers[event.category][event.name] = {};
			}

			var subscription = { source: source, callback: func, requiredSelector: requiredSelector, accountId: accountId, authToken: authToken };

			if(typeof self.handlers[event.category][event.name][binding] === 'undefined') {
				self.handlers[event.category][event.name][binding] = [subscription];
				self.addBinding(accountId, authToken, binding);
			}
			else {
				var found = false;
				// we only allow one same binding per source (app)
				_.each(self.handlers[event.category][event.name][binding], function(subscription) {
					if(subscription.source === source) {
						found = true;
					}
				});

				if(!found) {
					self.handlers[event.category][event.name][binding].push(subscription);
					self.addBinding(accountId, authToken, binding);
				}
			}
		},
		removeHandler: function(binding, event, accountId, authToken, func, source) {
			var self = this;

			if(self.handlers.hasOwnProperty(event.category) && self.handlers[event.category].hasOwnProperty(event.name) && self.handlers[event.category][event.name].hasOwnProperty(binding)) {
				var handlersToKeep = [];
				_.each(self.handlers[event.category][event.name][binding], function(handler) {
					if(handler.source !== source) {
						handlersToKeep.push(handler);
					}
					else {
						self.removeBinding(accountId, authToken, binding);
					}
				});

				if(handlersToKeep.length === 0) {
					delete self.handlers[event.category][event.name][binding];
				}
				else {
					self.handlers[event.category][event.name][binding] = handlersToKeep;
				}
			}
		},
		onEvent: function(data) {
			var self = this,
				category = data.event_category,
				name = data.event_name;

			console.log(self.handlers);
			if (typeof self.handlers[category] !== 'undefined' && typeof self.handlers[category][name] !== 'undefined') {
				_.each(self.handlers[category][name], function(subscriptions, bindingName) {
					var newSubscriptions = [];
					_.each(subscriptions, function(subscription) {
						if(subscription.hasOwnProperty('requiredSelector') && subscription.requiredSelector !== false) {
							if($(subscription.requiredSelector).length) {
								console.log('callback executed', subscription);
								subscription.callback(data);
								newSubscriptions.push(subscription);
							}
							else {
								self.removeBinding(subscription.accountId, subscription.authToken, bindingName);
								console.log(subscription.requiredSelector, $(subscription.requiredSelector), $(subscription.requiredSelector).length);
								console.log('required selector not visible, not executing');
							}
						}
						else {
							subscription.callback(data);
							newSubscriptions.push(subscription);
						}
					});

					if(newSubscriptions.length) {
						self.handlers[category][name][bindingName] = newSubscriptions;
					}
					else {
						delete self.handlers[category][name][bindingName];
					}
				});
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

		socket.bind = function(binding, event, requiredSelector, accountId, authToken, func, source) {
			privateSocket.addHandler(binding, event, requiredSelector, accountId, authToken, func, source);
		};

		socket.unbind = function(binding, event, accountId, authToken, source) {
			privateSocket.removeHandler(binding, event, accountId, authToken, source);
		},

		socket.trigger = function(data) {
			privateSocket.onEvent(data);
		}
	}

	return socket;
});
