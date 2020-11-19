/**
 * A module managing WebSocket connections.
 * @module monster/socket
 */
define(function(require) {
	var _ = require('lodash');
	var monster = require('monster');

	function Handshakes() {
		this.entries = {};
	}
	Handshakes.prototype = {
		add: function add(callback) {
			var id = monster.util.guid();

			this.entries[id] = callback;

			return id;
		},

		remove: function remove(id) {
			delete this.entries[id];
		},

		dispatch: function dispatch(id, data) {
			var callback = this.entries[id];

			if (_.isFunction(callback)) {
				callback(data);
			}

			this.remove(id);
		}
	};

	function Listener(metadata) {
		this.accountId = metadata.accountId;
		this.source = metadata.source;
		this.callback = metadata.callback;
	}
	Listener.prototype = {
		dispatch: function dispatch(data) {
			if (!_.isFunction(this.callback)) {
				return;
			}
			this.callback(data);
		},

		isEqual: function isEqual(metadata) {
			var accountId = metadata.accountId;
			var source = metadata.source;
			var callback = metadata.callback;
			var checks = [this.source === source];

			if (!_.isUndefined(accountId)) {
				checks.push(this.accountId === accountId);
			}
			if (!_.isUndefined(callback)) {
				checks.push(
					this.callback === callback || this.callback.toString() === callback.toString()
				);
			}

			return _.every(checks);
		}
	};

	function Listeners() {
		this.entries = [];
	}
	Listeners.prototype = {
		register: function register(metadata) {
			if (this.isRegistered(metadata)) {
				return;
			}
			this.entries.push(new Listener(metadata));
		},

		unregister: function unregister(metadata) {
			this.entries = this.entries.filter(function(listener) {
				return !listener.isEqual(metadata);
			});
		},

		dispatch: function dispatch(data) {
			this.entries.forEach(function(listener) {
				listener.dispatch(_.merge({}, data));
			});
		},

		isEmpty: function isEmpty() {
			return _.isEmpty(this.entries);
		},

		isRegistered: function isRegistered(metadata) {
			return _
				.chain(this.entries)
				.find(function(listener) {
					return listener.isEqual(metadata);
				})
				.thru(Boolean)
				.value();
		}
	};

	function Bindings() {
		this.entries = {};
	}
	Bindings.prototype = {
		subscribe: function subscribe(binding, metadata) {
			if (!this.isSubscribed(binding)) {
				this.entries[binding] = new Listeners();
			}
			this.entries[binding].register(metadata);
		},

		unsubscribe: function unsubscribe(binding, metadata) {
			if (!this.isSubscribed(binding)) {
				return;
			}
			var listeners = this.entries[binding];

			listeners.unregister(metadata);

			if (listeners.isEmpty()) {
				delete this.entries[binding];
			}
		},

		isSubscribed: function isSubscribed(binding) {
			return this.entries[binding] instanceof Listeners;
		},

		eject: function eject() {
			var listeners = _.flatMap(this.entries, function(listeners, binding) {
				return _.map(listeners.entries, function(metadata) {
					return _.merge({
						binding: binding
					}, _.clone(metadata));
				});
			});
			this.entries = {};
			return listeners;
		},

		hasSubscriptions: function hasSubscriptions() {
			return !_.isEmpty(this.entries);
		},

		hasListeners: function hasListeners(binding) {
			return this.isSubscribed(binding)
				&& !this.entries[binding].isEmpty();
		},

		dispatch: function dispatch(binding, data) {
			if (!this.isSubscribed(binding)) {
				return;
			}
			this.entries[binding].dispatch(data);
		}
	};

	function Logger(id) {
		this.id = id;
		this.shouldPrint = monster.isDev();
	}
	Logger.prototype = {
		print: function print(content, method) {
			if (!this.shouldPrint) {
				return;
			}
			console[method].apply(console, [
				[new Date().toISOString(), this.id].join(' | '),
				content.length ? '|' : []
			].concat(content));
		},

		log: function log() {
			this.print(_.toArray(arguments), 'log');
		},

		warn: function warn() {
			this.print(_.toArray(arguments), 'warn');
		}
	};

	/**
	 * Creates a new WebSocketClient instance.
	 * @param {Object} params
	 * @param {string} params.uri
	 * @return {WebSocketClient}
	 */
	function WebSocketClient(params) {
		/**
		 * The URL to which to connect.
		 * @type {string}
		 */
		this.uri = params.uri;

		/**
		 * Holds the WebSocket object to manage connection to server.
		 * @type {WebSocket}
		 */
		this.ws = null;

		/**
		 * Holds the timeout ID before next reconnection attempt.
		 * @type {number}
		 */
		this.reconnectTimeout = null;

		/**
		 * Holds the amount of time before next reconnection attempt.
		 * @type {number}
		 */
		this.reconnectTimer = null;

		/**
		 * Whether the connection should be closed without reconnect attempt.
		 * @type {boolean}
		 */
		this.shouldClose = false;

		/**
		 * Utility used to log messages.
		 * @type {Logger}
		 */
		this.logger = new Logger(WebSocketClient.name + '(' + this.uri + ')');

		/**
		 * Maps bindings to listeners
		 * @type {Bindings}
		 */
		this.bindings = new Bindings();

		/**
		 * Maps request IDs to callback
		 * @type {Handshakes}
		 */
		this.handshakes = new Handshakes();
	}
	WebSocketClient.prototype = {
		/**
		 * Creates a new WebSocket connection to uri when none is already connecting/connected.
		 */
		connect: function connect() {
			if (this.isConnecting() || this.isOpen()) {
				this.logger.log('already connected');
				return;
			}

			this.logger.log('attempting to ' + (this.reconnectTimeout ? 're' : '') + 'connect...');

			try {
				this.ws = new WebSocket(this.uri);

				this.ws.addEventListener('open', this.onOpen.bind(this));
				this.ws.addEventListener('close', this.onClose.bind(this));
				this.ws.addEventListener('message', this.onMessage.bind(this));

				this.ws.addEventListener('open', monster.pub.bind(null, 'socket.connected'));
				this.ws.addEventListener('close', monster.pub.bind(null, 'socket.disconnected'));
			} catch (e) {
				this.logger.warn(
					'failed while attempting to ' + (this.reconnectTimeout ? 're' : '') + 'connect',
					e
				);
			}
		},

		/**
		 * Schedules a new connection attempt after a delay.
		 */
		reconnect: function reconnect() {
			var MAX_TIMER = 60 * 1000;
			var MULTIPLIER = 2;
			var timer = this.reconnectTimer || 125;

			this.reconnectTimer = Math.min(
				timer * MULTIPLIER,
				MAX_TIMER
			);
			this.reconnectTimeout = setTimeout(
				this.connect.bind(this),
				this.reconnectTimer
			);

			this.logger.log('reconnection scheduled in ' + this.reconnectTimer / 1000 + 's');
		},

		/**
		 * Resets reconnect related properties to their original values.
		 */
		resetReconnect: function resetReconnect() {
			if (!this.reconnectTimeout) {
				return;
			}
			clearTimeout(this.reconnectTimeout);
			this.reconnectTimeout = null;
			this.reconnectTimer = null;

			this.logger.log('reconnect cleared');
		},

		/**
		 * Closes the connection without reconnection attempts.
		 */
		disconnect: function disconnect() {
			this.resetReconnect();

			if (this.isClosed()) {
				this.logger.log('already disconnected');
				return;
			}

			if (this.shouldClose) {
				this.logger.log('already disconnecting');
				return;
			}
			this.shouldClose = true;

			this.close();
		},

		/**
		 * Closes the connection.
		 */
		close: function close() {
			this.logger.log(this.isClosed()
				? 'already closed'
				: 'attempting to ' + (this.shouldClose ? 'disconnect' : 'close') + '...'
			);
			try {
				this.ws.close();
			} catch (e) {
				this.logger.warn('failed while attempting to close', e);
			}
		},

		/**
		 * @param  {Object} params
		 * @param  {string} params.accountId
		 * @param  {string} params.binding
		 * @param  {string} params.source
		 * @param  {Function} params.callback
		 * @return {Function} Callback to unsubscribe this listener specifically.
		 */
		bind: function bind(params) {
			var wsc = this;
			var binding = params.binding;
			var isAuthError = function(payload) {
				return _
					.chain(payload)
					.get('data.errors', [])
					.find(function(message) {
						return _.startsWith(message, 'failed to authenticate token');
					})
					.thru(Boolean)
					.value();
			};

			monster.waterfall([
				function maybeSubscribe(callback) {
					if (
						wsc.bindings.isSubscribed(binding)
						|| !wsc.isOpen()
					) {
						return callback(null);
					}
					wsc.subscribe(_.merge({
						handleReply: function(reply) {
							callback(reply.status === 'success' ? null : true, reply);
						}
					}, _.pick(params, 'accountId', 'binding')));
				}
			], function(err, reply) {
				if (!err) {
					wsc.bindings.subscribe(binding, _.merge({}, _.pick(params, [
						'accountId',
						'source',
						'callback'
					])));
					return;
				}
				if (!isAuthError(reply)) {
					wsc.logger.warn('failed to subscribe to ' + params.binding);
					return;
				}
				wsc.logger.log('attempting to reauthenticate...');

				monster.pub('auth.retryLogin', {
					success: function() {
						wsc.logger.log('reauthentication successful');
						wsc.bind(params);
					},
					error: function() {
						wsc.logger.warn('failed to reauthenticate, logging out');
						monster.util.logoutAndReload();
					}
				});
			});

			return this.unbind.bind(this, _.merge({}, params));
		},

		rebind: function rebind() {
			if (
				!this.reconnectTimeout
				|| !this.bindings.hasSubscriptions()
			) {
				return;
			}
			this.logger.log('rebinding listeners');

			this.bindings.eject().forEach(this.bind.bind(this));
		},

		/**
		 * @param  {Object} params
		 * @param  {string} param.accountId
		 * @param  {string} param.binding
		 * @param  {string} param.source
		 * @param  {Function} [param.callback]
		 */
		unbind: function unbind(params) {
			var wsc = this;
			var binding = params.binding;

			this.bindings.unsubscribe(binding, _.merge({}, _.pick(params, [
				'accountId',
				'source',
				'callback'
			])));

			monster.waterfall([
				function maybeUnsubscribe(callback) {
					if (
						wsc.bindings.hasListeners(binding)
						|| !wsc.isOpen()
					) {
						return callback(null);
					}
					wsc.unsubscribe(_.merge({
						handleReply: function handleReply(data) {
							callback(data.status === 'success' ? null : true, data);
						}
					}, _.pick(params, 'accountId', 'binding')));
				}
			], function(err, data) {
				if (!err) {
					return;
				}
				wsc.logger.warn('failed to unsubscribe from ' + params.binding, data);
			});
		},

		/**
		 * @param  {Object} parms
		 * @param  {string} params.accountId
		 * @param  {string} params.binding
		 * @param  {Function} params.handleReply
		 */
		subscribe: function subscribe(params) {
			this.logger.log('subscribing to ' + params.binding + '...');

			var requestId = this.handshakes.add(params.handleReply);

			try {
				this.ws.send(
					JSON.stringify({
						action: 'subscribe',
						auth_token: monster.util.getAuthToken(),
						request_id: requestId,
						data: _.merge({
							account_id: params.accountId
						}, _.pick(params, 'binding'))
					})
				);
			} catch (e) {
				this.logger.warn(e);

				this.handshakes.remove(requestId);
			}
		},

		/**
		 * @param  {Object} params
		 * @param  {string} params.accountId
		 * @param  {string} params.binding
		 * @param  {Function} params.handleReply
		 */
		unsubscribe: function unsubscribe(params) {
			this.logger.log('unsubscribing from ' + params.binding + '...');

			var requestId = this.handshakes.add(params.handleReply);

			try {
				this.ws.send(
					JSON.stringify({
						action: 'unsubscribe',
						auth_token: monster.util.getAuthToken(),
						request_id: requestId,
						data: _.merge({
							account_id: params.accountId
						}, _.pick(params, 'binding'))
					})
				);
			} catch (e) {
				this.logger.warn(e);

				this.handshakes.remove(requestId);
			}
		},

		/**
		 * @param {Object} data Parsed MessageEvent payload.
		 */
		handleReply: function handleReply(data) {
			var logger = this.logger;
			[
				{ key: 'errors', method: 'warn' },
				{ key: 'subscribed', method: 'log', partial: 'subscribed successfully to' },
				{ key: 'unsubscribed', method: 'log', partial: 'unsubscribed successfully from' }
			].forEach(function(type) {
				_(data).get(['data', type.key], []).forEach(
					_.chain(logger[type.method]).bind(logger, type.partial || _).unary().value()
				);
			});

			this.handshakes.dispatch(data.request_id, data);
		},

		/**
		 * @param  {Object} data Parsed MessageEvent payload.
		 */
		handleEvent: function handleEvent(data) {
			this.bindings.dispatch(data.subscribed_key, data.data);
		},

		/**
		 * Called when the connection's state changes to open.
		 */
		onOpen: function onOpen() {
			this.logger.log('connected successfully');
			this.rebind();
			this.resetReconnect();
		},

		/**
		 * Called when the connection's state changes to closed.
		 * @param {CloseEvent} event
		 */
		onClose: function onClose(event) {
			if (this.shouldClose) {
				this.logger.log('disconnected successfully');
				this.shouldClose = false;
				return;
			}
			this.logger.log(
				'closed ' + (event.wasClean ? 'cleanly' : 'abruptly'),
				event.wasClean ? '' : event
			);

			this.reconnect();
		},

		/**
		 * @param  {MessageEvent} event
		 */
		onMessage: function onMessage(event) {
			var parsedData = JSON.parse(event.data);
			var action = parsedData.action;

			switch (action) {
				case 'reply':
					this.handleReply(parsedData);
					break;
				case 'event':
					this.handleEvent(parsedData);
					break;
				default:
					this.logger.log('unknown action received: ', action, event);
			}
		},

		/**
		 * Returns whether ws is instantiated.
		 * @return {boolean}
		 */
		isInstantiated: function isInstantiated() {
			return this.ws instanceof WebSocket;
		},

		/**
		 * Returns whether the connection is not yet open.
		 * @return {boolean}
		 */
		isConnecting: function isConnecting() {
			return this.isInstantiated() && this.ws.readyState === WebSocket.CONNECTING;
		},

		/**
		 * Returns whether the connection is open and ready to communicate.
		 * @return {boolean}
		 */
		isOpen: function isOpen() {
			return this.isInstantiated() && this.ws.readyState === WebSocket.OPEN;
		},

		/**
		 * Returns whether the connection is in the process of closing.
		 * @return {boolean}
		 */
		isClosing: function isClosing() {
			return this.isInstantiated() && this.ws.readyState === WebSocket.CLOSING;
		},

		/**
		 * Returns whether the connection is closed.
		 * @return {boolean}
		 */
		isClosed: function isClosed() {
			return this.isInstantiated() && this.ws.readyState === WebSocket.CLOSED;
		}
	};

	var client;

	return {
		getInfo: function getInfo() {
			var uri = _.get(monster, 'config.api.socket');

			return _.merge({
				isConfigured: _.isString(uri) && /^ws{1,2}:\/\//i.test(uri),
				isConnected: !_.isUndefined(client) && client.isOpen(),
				uri: uri
			}, monster.isDev() && {
				client: client
			});
		},

		connect: function connect() {
			if (_.isUndefined(client)) {
				client = new WebSocketClient({
					uri: monster.config.api.socket
				});
			}

			client.connect();
		},

		disconnect: function disconnect() {
			if (_.isUndefined(client)) {
				return;
			}

			client.disconnect();
		},

		/**
		 * @param  {Object} params
		 * @param  {String} params.accountId
		 * @param  {String} params.binding
		 * @param  {String} params.source
		 * @param  {String} params.callback
		 * @return {Function}
		 * @return {Function} Callback to unbind listener
		 */
		bind: function bind(params) {
			if (_.isUndefined(client)) {
				return;
			}

			return client.bind(_.merge({}, _.pick(params, [
				'accountId',
				'binding',
				'source',
				'callback'
			])));
		},

		/**
		 * @param  {Object} params
		 * @param  {String} [params.accountId]
		 * @param  {String} params.binding
		 * @param  {String} params.source
		 * @param  {String} [params.callback]
		 */
		unbind: function unbind(params) {
			if (_.isUndefined(client)) {
				return;
			}

			client.unbind(_.merge({}, _.pick(params, [
				'accountId',
				'binding',
				'source',
				'callback'
			])));
		}
	};
});
