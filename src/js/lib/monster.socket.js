class WebSocketManager {
	/**
	 * Creates a new manager of WebSocketClient per URI.
	 * @return {WebSocketManager}
	 */
	constructor() {
		/**
		 * Maps URI to client instance.
		 * @private
		 * @type {Map.<string, WebSocketClient>}
		 */
		this.clients = new Map();
	}

	/**
	 * Returns whether a client corresponding to a uri is opened.
	 * @param  {string}  uri
	 * @return {boolean}
	 */
	isConnected(uri) {
		const client = this.clients.get(uri);
		return client !== undefined && client.isOpen();
	}

	/**
	 * Triggers a connection to uri.
	 * @param  {string} uri
	 *
	 * Creates a client corresponding to uri when none exists.
	 */
	connect({ uri, onOpen, onClose }) {
		let client = this.clients.get(uri);

		if (client === undefined) {
			this.clients.set(uri, new WebSocketClient({ uri, onOpen, onClose }));
			client = this.clients.get(uri);
		}

		client.connect();
	}

	/**
	 * Triggers a disconnection for uri
	 * @param  {string} uri
	 */
	disconnect(uri) {
		const client = this.clients.get(uri);

		if (client === undefined) {
			return;
		}

		client.disconnect();
	}
}

class Logger {
	constructor(id) {
		this.id = id;
	}

	print(content) {
		return [
			[new Date().toISOString(), this.id].join(' | '),
			...(content.length ? ['|', ...content] : [])
		];
	}

	log(...content) {
		console.log(...this.print(content));
	}

	warn(...content) {
		console.warn(...this.print(content));
	}
}

class WebSocketClient {
	/**
	 * Creates a new WebSocketClient instance.
	 * @param  {string} uri
	 * @return {WebSocketClient}
	 */
	constructor({ uri, onOpen, onClose }) {
		/**
		 * The URL to which to connect.
		 * @type {string}
		 */
		this.uri = uri;

		/**
		 * Holds callbacks for open and close events.
		 * @type {Object}
		 */
		this.callbacks = { onOpen, onClose };

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
		this.logger = new Logger(`${WebSocketClient.name}(${this.uri})`);
	}

	/**
	 * Creates a new WebSocket connection to uri when none is already connecting/connected.
	 */
	connect() {
		if (this.isConnecting() || this.isOpen()) {
			this.logger.log('already connected');
			return;
		}

		this.logger.log(`attempting to ${this.reconnectTimeout ? 're' : ''}connect...`);

		try {
			this.ws = new WebSocket(this.uri);

			this.ws.addEventListener('open', this.onOpen.bind(this));
			this.ws.addEventListener('close', this.onClose.bind(this));

			this.ws.addEventListener('open', this.callbacks.onOpen);
			this.ws.addEventListener('close', this.callbacks.onClose);

			['error', 'message'].forEach(
				type => this.ws.addEventListener(
					type,
					this.logger.log.bind(this.logger, 'on' + type)
				)
			);
		} catch (e) {
			this.logger.warn(
				`error while attempting to ${this.reconnectTimeout ? 're' : ''}connect`,
				e
			);
		}
	}

	/**
	 * Schedules a new connection attempt after a delay.
	 */
	reconnect() {
		const MAX_TIMER = 60 * 1000;
		const MULTIPLIER = 2;
		const timer = this.reconnectTimer || 125;

		this.reconnectTimer = Math.min(
			timer * MULTIPLIER,
			MAX_TIMER
		);
		this.reconnectTimeout = setTimeout(
			this.connect.bind(this),
			this.reconnectTimer
		);

		this.logger.log(`reconnection scheduled in ${this.reconnectTimer / 1000}s`);
	}

	/**
	 * Resets reconnect related properties to their original values.
	 */
	resetReconnect() {
		clearTimeout(this.reconnectTimeout);
		this.reconnectTimeout = null;
		this.reconnectTimer = null;
	}

	/**
	 * Closes the connection without reconnection attempts.
	 */
	disconnect() {
		if (this.shouldClose) {
			this.logger.log('already disconnecting');
			return;
		}
		if (
			!this.reconnectTimeout
			&& (this.isClosing() || this.isClosed())
		) {
			this.logger.log(`already disconnect${this.isClosing() ? 'ing' : 'ed'}`);
			return;
		}

		this.shouldClose = true;
		this.resetReconnect();

		this.close();
	}

	/**
	 * Closes the connection.
	 */
	close() {
		if (this.isClosed()) {
			this.logger.log(this.shouldClose ? 'disconnected successfully' : 'already closed');
		} else {
			this.logger.log(`attempting to ${this.shouldClose ? 'disconnect' : 'close'}...`);
		}
		try {
			this.ws.close();
		} catch (e) {
			this.logger.warn('error while attempting to close', e);
		}
	}

	/**
	 * Called when the connection's state changes to open.
	 */
	onOpen() {
		this.logger.log('connected successfully');
		this.resetReconnect();
	}

	/**
	 * Called when the connection's state changes to closed.
	 */
	onClose(event) {
		if (this.shouldClose) {
			this.logger.log('disconnected successfully');
			this.shouldClose = false;
			return;
		}
		if (event.wasClean) {
			this.logger.log('closed cleanly');
		} else {
			this.logger.warn('closed abruptly', event);
		}
		this.reconnect();
	}

	/**
	 * Returns whether ws is instantiated.
	 * @return {boolean}
	 */
	isInstantiated() {
		return this.ws instanceof WebSocket;
	}

	/**
	 * Returns whether the connection is not yet open.
	 * @return {boolean}
	 */
	isConnecting() {
		return this.isInstantiated() && this.ws.readyState === WebSocket.CONNECTING;
	}

	/**
	 * Returns whether the connection is open and ready to communicate.
	 * @return {boolean}
	 */
	isOpen() {
		return this.isInstantiated() && this.ws.readyState === WebSocket.OPEN;
	}

	/**
	 * Returns whether the connection is in the process of closing.
	 * @return {boolean}
	 */
	isClosing() {
		return this.isInstantiated() && this.ws.readyState === WebSocket.CLOSING;
	}

	/**
	 * Returns whether the connection is closed.
	 * @return {boolean}
	 */
	isClosed() {
		return this.isInstantiated() && this.ws.readyState === WebSocket.CLOSED;
	}
}

/**
 * A module managing WebSocket connections.
 * @module monster/socket
 */
define(new WebSocketManager());
