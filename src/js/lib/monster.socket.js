/**
 * A module managing WebSocket connections.
 * @module monster/socket
 */
define(function(require) {
	var _ = require('lodash');

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
	 * @param  {string} uri
	 * @return {WebSocketClient}
	 */
	/**
	 * Creates a new WebSocketClient instance.
	 * @param {Object} params
	 * @param {string} params.uri
	 * @param {Function} [params.onOpen]
	 * @param {Function} [params.onClose]
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

				this.ws.addEventListener('open', this.callbacks.onOpen);
				this.ws.addEventListener('close', this.callbacks.onClose);

				this.ws.addEventListener('error', this.logger.log.bind(this.logger, 'onerror'));
				this.ws.addEventListener('message', this.logger.log.bind(this.logger, 'onmessage'));
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
		 * Called when the connection's state changes to open.
		 */
		onOpen: function onOpen() {
			this.logger.log('connected successfully');
			this.resetReconnect();
		},

		/**
		 * Called when the connection's state changes to closed.
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
