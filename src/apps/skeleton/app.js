define(function(require) {
	var $ = require('jquery'),
		_ = require('lodash'),
		monster = require('monster');

	var app = {
		name: 'skeleton',

		css: [ 'app' ],

		i18n: {
			'en-US': { customCss: false }
		},

		// Defines API requests not included in the SDK
		requests: {},

		// Define the events available for other apps
		subscribe: {},

		// Data specific to this app (e.g. store, defaults...)
		appFlags: {},

		// Method used by the Monster-UI Framework, shouldn't be touched unless you're doing some advanced kind of stuff!
		load: function(callback) {
			var self = this;

			self.initApp(function() {
				callback && callback(self);
			});
		},

		// Method used by the Monster-UI Framework, shouldn't be touched unless you're doing some advanced kind of stuff!
		initApp: function(callback) {
			var self = this;

			// Used to init the auth token and account id of this app
			monster.pub('auth.initApp', {
				app: self,
				callback: callback
			});
		},

		// Entry Point of the app
		render: function() {
			var self = this,
				parent = $('#monster_content'),
				template = $(self.getTemplate({
					name: 'hello-world',
					data: {
						user: monster.apps.auth.currentUser
					}
				}));

			parent
				.empty()
				.hide()
				.append(template)
				.fadeIn(250);
		}
	};

	return app;
});
