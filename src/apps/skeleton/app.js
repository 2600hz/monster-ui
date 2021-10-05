define(function(require) {
	var $ = require('jquery'),
		monster = require('monster');

	return {
		// Entry Point of the app
		render: function() {
			var self = this;

			monster.ui.generateAppLayout(self, {
				menus: [
					{
						tabs: [
							{
								callback: self.welcomeRender
							}
						]
					}
				]
			});
		},

		welcomeRender: function(args) {
			var self = this,
				$template = $(self.getTemplate({
					name: 'layout',
					data: {
						user: monster.apps.auth.currentUser
					}
				}));

			monster.ui.insertTemplate(args.container, $template);
		}
	};
});
