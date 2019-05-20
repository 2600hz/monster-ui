define(function(require) {
	var $ = require('jquery'),
		_ = require('lodash'),
		monster = require('monster');

	var appSelector = {
		// Defines API requests not included in the SDK
		requests: {},

		// Define the events available for other apps
		subscribe: {
			'common.appSelector.render': 'appSelectorRender'
		},

		appFlags: {
			appSelector: {
				filters: [
					'all',
					'reseller',
					'carrier',
					'developer',
					'end_user',
					'reporting',
					'integration',
					'admin',
					'system_admin'
				]
			}
		},

		appSelectorRender: function(args) {
			var self = this,
				$container = args.container,
				initTemplate = function initTemplate() {
					var dataTemplate = {
							filters: self.appFlags.appSelector.filters
						},
						$template = $(self.getTemplate({
							name: 'layout',
							data: dataTemplate,
							submodule: 'appSelector'
						}));

					self.appSelectorBindEvents();

					return $template;
				};

			$container.append(initTemplate());
		},

		appSelectorBindEvents: function() {

		}
	};

	return appSelector;
});
