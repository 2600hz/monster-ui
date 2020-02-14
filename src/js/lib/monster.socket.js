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

			if (_.isUndefined(callback)) {
				return;
			}
			callback(data);

			this.remove(id);
		}
	};

	function Listener(metadata) {
		this.source = metadata.source;
		this.callback = metadata.listener;
	}
	Listener.prototype = {
		dispatch: function dispatch(params) {
			this.callback(params);
		},

		isEqual: function isEqual(metadata) {
			var source = metadata.source;
			var callback = metadata.listener;

			return this.source === source
				&& (!callback || this.callback === callback);
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
				listener.dispatch(data);
			});
		},

		isEmpty: function isEmpty() {
			return _.isEmpty(this.entries);
		},

		isRegistered: function isRegistered(metadata) {
			return !!_.find(this.entries, function(listener) {
				return listener.isEqual({
					listener: metadata.listener,
					source: metadata.source
				});
			});
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

	/**
	 * Creates a new manager of WebSocketClient per URI.
	 * @return {WebSocketManager}
	 */
	function WebSocketManager() {
		/**
		 * Maps URI to client instance.
		 * @private
		 * @type {Object.<string, WebSocketClient>}
		 */
		this.clients = {};
	}
	WebSocketManager.prototype = {
		/**
		 * Returns whether a client corresponding to a uri is opened.
		 * @param  {string}  uri
		 * @return {boolean}
		 */
		isConnected: function isConnected(uri) {
			var client = _.get(this.clients, uri);
			return !_.isUndefined(client) && client.isOpen();
		},

		/**
		 * Triggers a connection to uri.
		 * @param {Object} params
		 * @param {string} params.uri
		 * @param {Function} [params.onOpen]
		 * @param {Function} [params.onClose]
		 *
		 * Creates a client corresponding to uri when none exists.
		 */
		connect: function connect(params) {
			var uri = _.get(params, 'uri');
			var client = _.get(this.clients, uri);

			if (_.isUndefined(client)) {
				this.clients[uri] = new WebSocketClient(_.merge({}, params));
				client = _.get(this.clients, uri);
			}

			client.connect();
		},

		/**
		 * Triggers a disconnection for uri
		 * @param  {string} uri
		 */
		disconnect: function disconnect(uri) {
			var client = _.get(this.clients, uri);

			if (_.isUndefined(client)) {
				return;
			}

			client.disconnect();
		},

		/**
		 * @param  {Object} params
		 * @param  {string} params.uri
		 * @param  {string} params.accountId
		 * @param  {string} params.binding
		 * @param  {string} params.source
		 * @param  {Function} params.listener
		 * @return {Function} Callback to unsubscribe this listener specifically.
		 */
		bind: function bind(params) {
			var client = _.get(this.clients, params.uri);

			if (_.isUndefined(client)) {
				return;
			}

			return client.bind(_.merge({}, _.pick(params, 'accountId', 'binding', 'source', 'listener')));
		},

		/**
		 * @param  {Object} params
		 * @param  {string} params.uri
		 * @param  {string} params.accountId
		 * @param  {string} params.binding
		 * @param  {string} params.source
		 * @param  {Function} [params.listener]
		 */
		unbind: function unbind(params) {
			var client = _.get(this.clients, params.uri);

			if (_.isUndefined(client)) {
				return;
			}

			client.unbind(_.merge({}, _.pick(params, 'accountId', 'binding', 'source', 'listener')));
		}
	};

	function Logger(id) {
		this.id = id;
	}
	Logger.prototype = {
		print: function print(content) {
			var content = _.toArray(arguments);
			return [
				[new Date().toISOString(), this.id].join(' | '),
				content.length ? '|' : []
			].concat(content);
		},

		log: function log() {
			_.flowRight(
				_.spread(console.log),
				_.spread(this.print.bind(this))
			)(_.toArray(arguments));
		},

		warn: function warn() {
			_.flowRight(
				_.spread(console.log),
				_.spread(this.print.bind(this))
			)(_.toArray(arguments));
		}
	};

	/**
	 * Creates a new WebSocketClient instance.
	 * @param {Object} params
	 * @param {string} params.uri
	 * @param {Function} [params.onOpen]
	 * @param {Function} [params.onClose]
	 * @return {WebSocketClient}
	 */
	function WebSocketClient(params) {
		/**
		 * The URL to which to connect.
		 * @type {string}
		 */
		this.uri = params.uri;

		/**
		 * Holds callbacks for open and close events.
		 * @type {Object}
		 */
		this.callbacks = _.merge({}, _.pick(params, 'onOpen', 'onClose'));

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

				this.ws.addEventListener('open', this.callbacks.onOpen);
				this.ws.addEventListener('close', this.callbacks.onClose);

				this.ws.addEventListener('error', this.logger.log.bind(this.logger, 'onerror'));
			} catch (e) {
				this.logger.warn(
					'error while attempting to ' + (this.reconnectTimeout ? 're' : '') + 'connect',
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
			if (this.isClosed()) {
				this.logger.log('already closed');
			} else {
				this.logger.log('attempting to ' + (this.shouldClose ? 'disconnect' : 'close') + '...');
			}
			try {
				this.ws.close();
			} catch (e) {
				this.logger.warn('error while attempting to close', e);
			}
		},

		/**
		 * @param  {Object} params
		 * @param  {string} params.accountId
		 * @param  {string} params.binding
		 * @param  {string} params.source
		 * @param  {Function} params.listener
		 * @return {Function} Callback to unsubscribe this listener specifically.
		 */
		bind: function bind(params) {
			var wsc = this;
			var binding = params.binding;

			monster.waterfall([
				function(callback) {
					if (wsc.bindings.isSubscribed(binding)) {
						return callback(null, {});
					}
					wsc.subscribe(_.merge({
						handleReply: function handleReply(data) {
							callback(data.status === 'success' ? null : true, data);
						}
					}, _.pick(params, 'accountId', 'binding')));
				}
			], function(err, data) {
				if (err) {
					wsc.logger.warn('failed to subscribe to ' + binding, data);
					return;
				}
				wsc.bindings.subscribe(binding, _.merge({}, _.pick(params, 'source', 'listener')));
			});

			return this.unbind.bind(this, _.merge({}, params));
		},

		/**
		 * @param  {Object} params
		 * @param  {string} param.accountId
		 * @param  {string} param.binding
		 * @param  {string} param.source
		 * @param  {Function} [param.listener]
		 */
		unbind: function unbind(params) {
			var wsc = this;
			var binding = params.binding;

			this.bindings.unsubscribe(binding, _.merge({}, _.pick(params, 'source', 'listener')));

			monster.waterfall([
				function(callback) {
					if (wsc.bindings.hasListeners(binding)) {
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
				wsc.logger.warn('failed to unsubscribe from ' + binding, data);
			});
		},

		/**
		 * @param  {Object} parms
		 * @param  {string} params.accountId
		 * @param  {string} params.binding
		 * @param  {Function} params.handleReply
		 */
		subscribe: function subscribe(params) {
			this.logger.log('subscribing to binding...');

			var requestId = this.handshakes.add(params.handleReply);

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
		},

		/**
		 * @param  {Object} params
		 * @param  {string} params.accountId
		 * @param  {string} params.binding
		 * @param  {Function} params.handleReply
		 */
		unsubscribe: function unsubscribe(params) {
			this.logger.log('unsubscribing from binding...');

			var requestId = this.handshakes.add(params.handleReply);

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
		},

		/**
		 * @param {Object} data Parsed MessageEvent payload.
		 */
		handleReply: function handleReply(data) {
			this.logger.log('binding ' + (_.has(data.data, 'subscribed') ? '' : 'un') + 'subscribed successfully');

			this.handshakes.dispatch(data.request_id, data);
		},

		/**
		 * @param  {Object} data Parsed MessageEvent payload.
		 */
		handleEvent: function handleEvent(data) {
			this.bindings.dispatch(data.subscribed_key, _.merge({}, data.data));
		},

		/**
		 * Called when the connection's state changes to open.
		 */
		onOpen: function onOpen() {
			this.logger.log('connected successfully');
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

	return new WebSocketManager();
});
