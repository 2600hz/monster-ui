class SocketsManager {
	/**
	 * Creates a new manager of WebSocketClient per URI.
	 * @return {SocketsManager}
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
		return client && client.isOpen();
	}

	/**
	 * Triggers a connection to uri.
	 * @param  {string} uri
	 *
	 * Creates a client corresponding to uri when none exists.
	 */
	connect(uri) {
		let client = this.clients.get(uri);
		if (client === undefined) {
			this.clients.set(uri, new WebSocketClient(uri));
			client = this.clients.get(uri);
		}
		client.connect();
	}
}

class WebSocketClient {
	/**
	 * Creates a new WebSocketClient instance.
	 * @param  {string} uri
	 * @return {WebSocketClient}
	 */
	constructor(uri) {
		this.uri = uri;
		this.ws = null;
	}

	/**
	 * Creates a new WebSocket connection to uri when none is already connected.
	 */
	connect() {
		if (this.isConnecting() || this.isOpen()) {
			console.log('WebSocket is already connected');
			return;
		}

		try {
			this.ws = new WebSocket(this.uri);
		} catch (e) {
			console.warn('error connecting to WebSocket', e);
		}

		['open', 'close', 'error', 'message'].forEach(
			type => this.ws.addEventListener(type, console.log.bind(undefined, 'on' + type))
		);
	}

	/**
	 * Returns whether ws is instantiated.
	 * @return {boolean}
	 */
	isInstantiated() {
		return this.ws instanceof WebSocket;
	}

	/**
	 * Returns whether ws is in connecting state.
	 * @return {boolean}
	 */
	isConnecting() {
		return this.isInstantiated() && this.ws.readyState === WebSocket.CONNECTING;
	}

	/**
	 * Returns whether ws is in open state.
	 * @return {boolean}
	 */
	isOpen() {
		return this.isInstantiated() && this.ws.readyState === WebSocket.OPEN;
	}
}

/**
 * A module managing WebSocket connections.
 * @module monster/socket
 */
define(new SocketsManager());
