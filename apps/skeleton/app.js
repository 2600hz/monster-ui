define(function(require){
	var $ = require('jquery'),
		_ = require('underscore'),
		monster = require('monster'),
		toastr = require('toastr');

	var app = {
		name: 'skeleton',

		i18n: [ 'en-US', 'fr-FR' ],

		// Defines API requests not included in the SDK
		requests: {},

		// Define the events available for other apps 
		subscribe: {},

		// Method used by the Monster-UI Framework, shouldn't be touched unless you're doing some advanced kind of stuff!
		load: function(callback){
			var self = this;

			self.initApp(function() {
				callback && callback(self);
			});
		},

		// Method used by the Monster-UI Framework, shouldn't be touched unless you're doing some advanced kind of stuff!
		initApp: function(callback) {
			var self = this;

			/* Used to init the auth token and account id of this app */
			monster.pub('auth.initApp', {
				app: self,
				callback: callback
			});
		},

		// Entry Point of the app
		render: function(container){
			var self = this,
				skeletonTemplate = $(monster.template(self, 'layout')),
				parent = _.isEmpty(container) ? $('#ws-content') : container;

			self.bindSocketEvents(skeletonTemplate);
			self.bindUIEvents(skeletonTemplate);

			(parent)
				.empty()
				.append(skeletonTemplate);
		},

		bindSocketEvents: function(template) {
			var self = this,
				addEvent = function(data) {
					console.log(data);
					var formattedEvent = self.formatEvent(data),
						eventTemplate = monster.template(self, 'event', formattedEvent);

					if(formattedEvent.extra.deviceId && formattedEvent.extra.deviceId in globalData.registeredDevices) {
						monster.ui.fade(template.find('.device-item[data-id="'+ formattedEvent.extra.deviceId +'"]'));
					}

					template.find('.list-events tbody').prepend(eventTemplate);
				};

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
			});
		},

		bindUIEvents: function(template) {
			var self = this;
		},
		//utils
	};

	return app;
});
