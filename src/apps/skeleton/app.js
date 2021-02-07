define(function(require) {
	var $ = require('jquery'),
		_ = require('lodash'),
		monster = require('monster');

	var app = {
		i18n: {
			'en-US': { customCss: false },
			'fr-FR': { customCss: false }
		},

		// Entry Point of the app
		render: function(container) {
			var self = this;

			monster.ui.generateAppLayout(self, {
				menus: [
					{
						tabs: [
							{
								callback: self.renderWelcome
							}
						]
					}
				]
			});
		},

		renderWelcome: function(pArgs) {
			var self = this,
				args = pArgs || {},
				parent = args.container || $('#skeleton_app_container .app-content-wrapper'),
				template = $(self.getTemplate({
					name: 'layout',
					data: {
						user: monster.apps.auth.currentUser
					}
				}));

			parent
				.fadeOut(function() {
					$(this)
						.empty()
						.append(template)
						.fadeIn();
				});
		}
	};

	return app;
});
