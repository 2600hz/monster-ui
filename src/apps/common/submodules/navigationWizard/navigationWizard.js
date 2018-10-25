define(function(require) {
	var $ = require('jquery'),
		_ = require('lodash'),
		monster = require('monster');

	var navigationWizard = {
		requests: {

		},

		subscribe: {
			'common.navigationWizard.render': 'navigationWizardRender'
		},

		navigationWizardRender: function(args) {
			var self = this,
				container = args.container,
				layout = $(self.getTemplate({
					name: 'layout',
					data: {
						title: args.title,
						steps: args.steps
					},
					submodule: 'navigationWizard'
				}));

			if (container) {
				self.navigationWizardBindEvents($.extend({ template: layout }, args));
				container
					.append(layout);
			} else {
				throw new Error('A container must be provided.');
			}
		},

		navigationWizardBindEvents: function(args) {
			var self = this,
				container = args.container,
				template = args.template,
				removeCallback = args.removeCallback,
				afterCallback = args.afterCallback;

			console.log(args);
		}
	};

	return navigationWizard;
});
