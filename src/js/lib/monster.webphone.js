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
						args.success && args.success(args.device);
					},
					onHangup: function(ev) {
						args.onHangup && args.onHangup();
					},
					//onCancel: onCancel,
					onIncoming: function(call) {
						args.onIncoming && args.onIncoming(call);
					},
					//onConnecting: onConnecting,
					//onTransfer: onTransfer,
					//onNotified: onNotified,
					onError: function(a) {
						args.error();
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
						console.log('login device');
						self.login(args);
					},
					error: args.error
				};

			monster.pub('common.webphone.getUserDevice', newArgs);
		},

		hangup: function() {
			kazooWebphone.hangup();
		},

		connect: function(destination) {
			kazooWebphone.connect(destination);
		},

		muteMicrophone: function(isMuted, callback) {
			kazooWebphone.muteMicrophone(isMuted, callback);
		}
	};

	var webphone = {
		init: function() {
			privateWebphone.init();
		},
		login: function() {
			privateWebphone.login();
		},
		loginUser: function(args) {
			privateWebphone.loginWebphoneUser(args);
		},
		hangup: function() {
			privateWebphone.hangup();
		},
		connect: function(destination) {
			privateWebphone.connect(destination);
		},
		muteMicrophone: function(isMuted, callback) {
			privateWebphone.muteMicrophone(isMuted, callback);
		}
	};

	return webphone;
});
