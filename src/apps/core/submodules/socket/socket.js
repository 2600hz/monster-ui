define(function(require) {
	var monster = require('monster'),
		$ = require('jquery');

	return {
		subscribe: {
			'core.socket.start': 'socketStart',
			'core.socket.showDisconnectToast': 'socketShowDisconnectToast',
			'socket.connected': 'socketShowConnectToast',
			'socket.disconnected': 'socketShowDisconnectToast'
		},

		socketStart: function socketStart() {
			monster.socket.connect();
		},

		socketShowConnectToast: function socketShowConnectToast() {
			var self = this;

			if (!_.get(monster.apps, [monster.apps.getActiveApp(), 'requiresWebSockets'], false)) {
				return;
			}

			$('.core-socket-disconnected-warning').fadeOut(1000, function() {
				$(this).remove();
			});

			monster.ui.toast({
				type: 'success',
				message: self.i18n.active().brokenWebSocketsWarning.successReconnect
			});
		},

		socketShowDisconnectToast: function socketShowDisconnectToast() {
			var self = this;

			if (
				!_.get(monster.apps, [monster.apps.getActiveApp(), 'requiresWebSockets'], false)
				|| monster.socket.getInfo().isConnected
			) {
				return;
			}

			monster.ui.toast({
				type: 'error',
				message: self.i18n.active().brokenWebSocketsWarning.disconnectMessage,
				options: {
					toastClass: 'core-socket-disconnected-warning',
					tapToDismiss: false,
					onClick: null,
					timeOut: 0,
					extendedTimeOut: 0
				}
			});
		}
	};
});
