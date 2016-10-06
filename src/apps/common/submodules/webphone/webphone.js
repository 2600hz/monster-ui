define(function(require){
	var $ = require('jquery'),
		_ = require('underscore'),
		monster = require('monster');

	var webphone = {
		requests: {},

		subscribe: {
			'common.webphone.getOrCreateUserDevice': 'webphoneGetOrCreateUserDevice',
			'common.webphone.getUserDevices': 'webphoneGetUserDevices',
			'common.webphone.createUserDevice': 'webphoneCreateUserDevice'
		},

		webphoneCreateUserDevice: function(callback) {
			var self = this,
				accountId = monster.apps.auth.originalAccount.id,
				user = monster.apps.auth.currentUser,
				deviceData = {
					device_type: 'softphone',
					name: user.first_name + ' ' + user.last_name + ' - ' + self.i18n.active().webphoneSubmodule.deviceName,
					owner_id: user.id,
					media: {
						audio: {
							codecs: ['OPUS']
						}
					},
					ui_flags: {
						source: 'monster-webphone'
					},
					sip: {
						password: monster.util.randomString(12),
						realm: monster.apps.auth.currentAccount.realm,
						username: 'user_' + monster.util.randomString(10)
					}
				};

			self.callApi({
				resource: 'device.create',
				data: {
					accountId: accountId,
					data: deviceData
				},
				success: function(device) {
					callback && callback(device.data);
				}
			});
		},

		webphonePromptUserCreateDevice: function(success, error) {
			var self = this;

			monster.ui.confirm(self.i18n.active().webphoneSubmodule.createADevice,
				function() {
					self.webphoneCreateUserDevice(function(device) {
						success(device);
					})
				},
				error
			);
		},

		webphoneGetUserDevices: function(callback) {
			var self = this
				app = monster.apps.auth;

			self.callApi({
				resource: 'device.list',
				data: {
					accountId: app.originalAccount.id,
					filters: {
						filter_owner_id: app.userId,
						'filter_ui_flags.source': 'monster-webphone'
					}
				},
				success: function(devices) {
					callback && callback(devices.data);
				}
			});
		},

		webphoneGetDevice: function(deviceId, callback) {
			var self = this;

			self.callApi({
				resource: 'device.get',
				data: {
					deviceId: deviceId,
					accountId: self.accountId
				},
				success: function(data) {
					callback && callback(data.data);
				}
			});
		},

		webphoneGetOrCreateUserDevice: function(args) {
			var self = this;

			self.webphoneGetUserDevices(function(devices) {
				if(devices.length && devices.length === 1) {
					self.webphoneGetDevice(devices[0].id, function(device) {
						args.success && args.success(device);
					});
				}
				else {
					self.webphonePromptUserCreateDevice(args.success, args.error);
				}
			})
		}
	};

	return webphone;
});
