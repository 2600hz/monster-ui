define(function(require) {
	var $ = require('jquery'),
		_ = require('lodash'),
		monster = require('monster');

	var privateSocket = {

		printLogs: true,

		/**
		 * Holds WebSocket instance
		 * @type {WebSocket|undefined}
		 */
		instance: undefined,
		bindings: {},
		commands: {},

		isConnecting: false,

		/**
		 * Returns whether a WebSocket connection is established or not
		 * @return {Boolean}
		 */
		isConnected: function() {
			var self = this;

			return self.instance instanceof WebSocket;
		},

		close: function() {
			var self = this;
			self.instance.close();
		},

		log: function(str, force) {
			var self = this;

			if (self.printLogs || force) {
				console.log(str);
			}
		},

		/**
		 * Attempts to open a WebSocket connection
		 * @param  {Object} args
		 * @param  {Function} [args.onError] Invoked when an error occurs
		 */
		initialize: function(args) {
			var self = this,
				socket;

			self.isConnecting = true;

			if (self.isConnected()) {
				self.isConnecting = false;
				self.log('Socket already active');
				return;
			}

			socket = self.initializeSocket();

			socket.onopen = function() {
				self.isConnecting = false;
				self.log('Successful WebSocket connection');
				self.instance = socket;
				self.initializeSocketEvents(socket);
				monster.pub('socket.connected');
			};
			socket.onerror = function() {
				self.isConnecting = false;
				args.onError && args.onError();
			};
		},

		initializeSocket: function() {
			var self = this;

			return new WebSocket(monster.config.api.socket);
		},

		initializeSocketEvents: function(socket) {
			var self = this;

			socket.onclose = function(data) {
				monster.pub('socket.disconnected');
				self.instance = undefined;
				// We want to automatically attempt to reconnect
				self.connect();
				self.log('WebSocket connection closed');
			};

			socket.onmessage = function(event) {
				var data = JSON.parse(event.data);

				if (data.action === 'reply') {
					self.onReply(data);
				} else if (data.action === 'event') {
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
			};

			monster.socket.close = function() {
				self.close();
			};
		},

		/**
		 * Reconnect loop that retries to connect after {{startingTimeout}} ms
		 * In case it fails, we multiply the previous timeout by {{multiplier}}, and then try again once that time has gone by
		 * The max timer is set to {{maxTimeout}}
		 * @param  {Number} [pTimeoutDuration=0]
		 */
		connect: function(pTimeoutDuration) {
			var self = this,
				timeoutDuration = _.isUndefined(pTimeoutDuration) ? 0 : pTimeoutDuration,
				isFirstAttempt = timeoutDuration === 0,
				startingTimeout = 250,
				multiplier = 2,
				maxTimeout = 60 * 1000;

			if (!monster.util.isLoggedIn()) {
				return self.log('Unable to connect to WebSocket while logged out');
			}
			if (self.isConnecting) {
				return self.log('Already attempting to connect to WebSocket');
			}
			if (self.isConnected()) {
				return self.log('Already connected to WebSocket');
			}

			self.log(
				'Attempting to '
				+ isFirstAttempt ? '' : 're'
				+ 'connect to WebSocket at '
				+ monster.util.toFriendlyDate(new Date())
			);

			if (isFirstAttempt) {
				timeoutDuration = startingTimeout;
			} else {
				timeoutDuration = (timeoutDuration * multiplier) < maxTimeout
					? timeoutDuration * multiplier
					: maxTimeout;

				self.log('Next try in ' + timeoutDuration / 1000 + ' seconds');
			}

			self.initialize({
				onError: function() {
					setTimeout(self.connect.bind(self, timeoutDuration), timeoutDuration);
				}
			});
		},

		subscribe: function(accountId, authToken, binding, onReply) {
			var self = this,
				requestId = monster.util.guid();

			self.commands[requestId] = {
				onReply: onReply
			};

			return self.instance.send(JSON.stringify({ 'action': 'subscribe', 'auth_token': authToken, 'request_id': requestId, 'data': { 'account_id': accountId, 'binding': binding } }));
		},
		unsubscribe: function(accountId, authToken, binding, onReply) {
			var self = this,
				requestId = monster.util.guid();

			self.commands[requestId] = {
				onReply: onReply
			};

			self.instance.send(JSON.stringify({ 'action': 'unsubscribe', 'auth_token': authToken, 'request_id': requestId, 'data': { 'binding': binding, 'account_id': accountId } }));
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

			if (bindingId) {
				if (self.bindings.hasOwnProperty(bindingId)) {
					executeCallbacks(self.bindings[bindingId]);
				}
			} else {
				_.each(self.bindings, function(binding) {
					executeCallbacks(binding);
				});
			}
		},

		onReply: function(data) {
			var self = this,
				requestId = data.request_id;

			if (self.commands.hasOwnProperty(requestId)) {
				self.commands[requestId].onReply(data);
				delete self.commands[requestId];
			}
		},

		// When we remove a listener, we make sure to delete the subscription if our listener was the only listerner for that subscription
		// If there's more than one listener, then we just remove the listener from the array or listeners for that subscription
		removeListener: function removeListener(binding, accountId, authToken, source) {
			var self = this,
				listenersToKeep = [];

			if (self.bindings.hasOwnProperty(binding)) {
				_.each(self.bindings[binding].listeners, function(listener) {
					if (!(listener.accountId === accountId && listener.authToken === authToken && listener.source === source)) {
						listenersToKeep.push(listener);
					}
				});
			}

			if (listenersToKeep.length) {
				self.bindings[binding].listeners = listenersToKeep;
			} else {
				// We remove it regardless of the results, because if an error happened on the WS side, we still would want to rebind the event on reconnect,
				// and if the binding still exists it will prevent the UI from rebinding this event
				delete self.bindings[binding];

				self.unsubscribe(accountId, authToken, binding, function(result) {
					self.log(result);

					if (result.status !== 'success') {
						self.log('monster.socket: unsubscribe ' + binding + ' failed', true);
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
				listener = {
					accountId: accountId,
					authToken: authToken,
					source: source,
					callback: func
				},
				tryAddingListener = function(newListener) {
					if (!self.bindings.hasOwnProperty(binding)) {
						self.bindings[binding] = {
							listeners: [ newListener ]
						};
					} else {
						_.each(self.bindings[binding].listeners, function(listener) {
							if (listener.accountId === newListener.accountId && listener.authToken === newListener.authToken && listener.source === newListener.source) {
								found = true;
							}
						});

						if (!found) {
							self.bindings[binding].listeners.push(newListener);
						} else {
							self.log('already bound!', true);
						}
					}
				};

			if (self.bindings.hasOwnProperty(binding)) {
				tryAddingListener(listener);
			} else {
				self.subscribe(accountId, authToken, binding, function(result) {
					if (result.status === 'success') {
						tryAddingListener(listener);
					} else {
						self.log('monster.socket: subscribe ' + binding + ' failed', true);
						self.log(result);
					}
				});
			}
		}
	};

	var socket = {
		isConnected: function() {
			return privateSocket.isConnected();
		},
		isEnabled: function() {
			return monster.config.api.hasOwnProperty('socket');
		},
		bind: function() {
			privateSocket.log('No WebSockets defined', true);
		},
		connect: function() {
			if (monster.config.api.hasOwnProperty('socket')) {
				privateSocket.connect();
			} else {
				privateSocket.log('No WebSocket API URL set in the config.js file', true);
			}
		}
	};

	return socket;
});
