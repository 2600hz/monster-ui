define(function(require){
	var $ = require('jquery'),
		_ = require('underscore'),
		monster = require('monster'),
		kazooWebphone = require('kazoo'),
		toastr = require('toastr');

	var privateWebphone = {
		initialized: false,
		connected: false,

		printLogs: true,

		log: function(str, force) {
			var self = this;

			if(self.printLogs || force) {
				console.log('MONSTER-LOG: ', str);
			}
		},

		init: function() {
			var self = this;

			if(monster.config.api.hasOwnProperty('socketWebphone')) {
				var paramsInit = {
					forceRTMP: false,
					//flashContainer: 'flash_div',
					prefixScripts: 'js/lib/kazooDependencies/',
					onLoaded: function() {
						self.log('Kazoo.js loaded successfully');
						self.initialized = true;
					},
					onFlashMissing: function(container) {
						self.log('This content requires the Adobe Flash Player. <a href=http://www.adobe.com/go/getflash/>Get Flash</a>');
					}
				};

				kazooWebphone.init(paramsInit);
			}
			else {
				self.log('No config.js API configured for the Webphone');
			}
		},

		login: function(args) {//device, success, error) {
			var self = this,
				realm = monster.apps.auth.originalAccount.realm,
				device = args.device;

			if(self.initialized) {
				var kazooParams = {
					wsUrl: monster.config.api.socketWebphone,
					realm: realm,
					privateIdentity: device.sip.username,
					publicIdentity: 'sip:'+ device.sip.username + '@' + realm,
					password: device.sip.password,
					onAccepted: function(call) {
						args.onAccepted && args.onAccepted(call);
					},
					onConnected: function() {
						args.onConnected && args.onConnected(args.device);
					},
					onHangup: function(ev) {
						args.onHangup && args.onHangup(ev);
					},
					onCancel: function() {
						args.onCancel && args.onCancel();
					},
					onIncoming: function(call) {
						args.onIncoming && args.onIncoming(call);
					},
					//onConnecting: onConnecting,
					//onTransfer: onTransfer,
					//onNotified: onNotified,
					onError: function(a) {
						args.onError();
					},
					//reconnectMaxAttempts: 3, // Unlimited autoreconnect attempts
					//reconnectDelay: 5000 // New autoreconnect attempt every 5 seconds
				};

				kazooWebphone.register(kazooParams);
			}
			else {
				args.error();
				self.log('Webphone Not initialized');
			}
		},

		loginWebphoneUser: function(args) {
			var self = this,
				newArgs = {
					success: function(device) {
						args.device = device;

						self.login(args);
					},
					error: args.error
				};

			monster.pub('common.webphone.getOrCreateUserDevice', newArgs);
		},

		hangup: function(callId) {
			kazooWebphone.hangup(callId);
		},

		connect: function(destination) {
			destination += '';
			kazooWebphone.connect(destination);
		},

		mute: function(callId) {
			kazooWebphone.mute(callId);
		},

		unmute: function(callId) {
			kazooWebphone.unmute(callId);
		},

		hold: function(callId) {
			kazooWebphone.hold(callId);
		},

		unhold: function(callId) {
			kazooWebphone.unhold(callId);
		},

		logout: function() {
			kazooWebphone.logout();
		},

		sendDTMF: function(dtmf, callId) {
			dtmf += ''; // cast to string
			kazooWebphone.sendDTMF(dtmf, callId);
		}
	};

	var webphone = {
		init: function() {
			privateWebphone.init();
		},
		login: function(args) {
			privateWebphone.loginWebphoneUser(args);
		},
		hangup: function(callId) {
			privateWebphone.hangup(callId);
		},
		connect: function(destination) {
			privateWebphone.connect(destination);
		},
		hold: function(callId) {
			privateWebphone.hold(callId);
		},
		unhold: function(callId) {
			privateWebphone.unhold(callId);
		},
		mute: function(callId) {
			privateWebphone.mute(callId);
		},
		unmute: function(callId) {
			privateWebphone.unmute(callId);
		},
		logout: function() {
			privateWebphone.logout();
		},
		sendDTMF: function(dtmf, callId) {
			privateWebphone.sendDTMF(dtmf, callId);
		}
	};

	return webphone;
});
