define(function(require) {
	var $ = require('jquery'),
		_ = require('lodash'),
		monster = require('monster');

	var app = {
		i18n: {
			'en-US': { customCss: false }
		},

		// Entry Point of the app
		render: function(container) {
			var self = this,
				container = container || $('#monster_content');

			// Get the initial dynamic data we need before displaying the app
			self.listDevices(function(data) {
				// Load the data in a Handlebars template
				var demoTemplate = $(self.getTemplate({
					name: 'layout',
					data: {
						devices: data
					}
				}));

				// Bind UI and Socket events
				self.bindUIEvents(demoTemplate);
				self.bindSocketsEvents(demoTemplate, data);

				// Once everything has been attached to the template, we can add it to our main container
				(container)
					.empty()
					.append(demoTemplate);
			});
		},

		// Binding Events
		bindUIEvents: function(template) {
			var self = this;

			template.find('#clearEvents').on('click', function() {
				template.find('.table tbody tr:not(.no-events)').remove();
			});

			template.find('.device-item').on('click', function() {
				var isInactive = !$(this).hasClass('active');
				template.find('.device-item').removeClass('active');

				template.find('table tbody tr').removeClass('inactive');

				if (isInactive) {
					var	id = $(this).data('id');

					if (id !== '') {
						$(this).addClass('active');
						template.find('table tbody tr:not([data-deviceid="' + id + '"])').addClass('inactive');
					}
				}
			});
		},

		bindSocketsEvents: function(template) {
			var self = this,
				addEvent = function(data) {
					var formattedEvent = self.formatEvent(data),
						eventTemplate = $(self.getTemplate({
							name: 'event',
							data: formattedEvent
						}));

					if (formattedEvent.extra.hasOwnProperty('deviceId')) {
						monster.ui.highlight(template.find('.device-item[data-id="' + formattedEvent.extra.deviceId + '"]'));
					}

					template.find('.list-events tbody').prepend(eventTemplate);
				};

			self.subscribeWebSocket({
				binding: 'call.CHANNEL_CREATE.*',
				requiredElement: template,
				callback: function(event) {
					addEvent(event);
				}
			});

			self.subscribeWebSocket({
				binding: 'call.CHANNEL_ANSWER.*',
				requiredElement: template,
				callback: function(event) {
					addEvent(event);
				}
			});

			self.subscribeWebSocket({
				binding: 'call.CHANNEL_DESTROY.*',
				requiredElement: template,
				callback: function(event) {
					addEvent(event);
				}
			});
/*
			// subscribe to call events
			monster.socket.emit("subscribe", { account_id: self.accountId, auth_token: self.authToken, binding: "call.CHANNEL_CREATE.*"});
			monster.socket.emit("subscribe", { account_id: self.accountId, auth_token: self.authToken, binding: "call.CHANNEL_ANSWER.*"});
			monster.socket.emit("subscribe", { account_id: self.accountId, auth_token: self.authToken, binding: "call.CHANNEL_DESTROY.*"});

			// Bind some js code to the reception of call events
			monster.socket.on("CHANNEL_CREATE", function (data) {
				addEvent(data);
			});

			monster.socket.on("CHANNEL_ANSWER", function (data) {
				addEvent(data);
			});

			monster.socket.on("CHANNEL_DESTROY", function (data) {
				addEvent(data);
			});*/
		},

		// Formatting data
		formatEvent: function(data) {
			var self = this,
				formattedData = data;

			formattedData.extra = {};

			formattedData.extra.to = data.to.substr(0, data.to.indexOf('@'));
			formattedData.extra.friendlyEvent = self.i18n.active().demo.events[data.event_name];
			formattedData.extra.classEvent = data.event_name === 'CHANNEL_CREATE' ? 'info' : (data.event_name === 'CHANNEL_ANSWER' ? 'success' : 'error');

			if ('custom_channel_vars' in data && 'authorizing_type' in data.custom_channel_vars && data.custom_channel_vars.authorizing_type === 'device') {
				formattedData.extra.deviceId = data.custom_channel_vars.authorizing_id;
			}

			return formattedData;
		},

		// API Calls
		listDevices: function(callback) {
			var self = this;

			self.callApi({
				resource: 'device.list',
				data: {
					accountId: self.accountId
				},
				success: function(devices) {
					callback(devices.data);
				}
			});
		}
	};

	return app;
});
