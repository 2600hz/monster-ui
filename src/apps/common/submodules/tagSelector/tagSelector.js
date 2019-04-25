define(function(require) {
	var $ = require('jquery'),
		_ = require('lodash'),
		monster = require('monster');

	var tagSelector = {
		// Defines API requests not included in the SDK
		requests: {},

		// Define the events available for other apps
		subscribe: {
			'common.tagSelector.render': 'tagSelectorRender'
		},

		/**
		 * @param {Object} args
		 */
		tagSelectorRender: function(args) {
			var self = this,
				tags = args.tags,
				title = args.title,
				template = $(self.getTemplate({
					name: 'layout',
					data: {
						tags: tags
					},
					submodule: 'tagSelector'
				})),
				optionsPopup = {
					position: ['center', 20],
					title: title || self.i18n.active().tagSelector.title
				},
				popup = monster.ui.dialog(template, optionsPopup);

			self.tagSelectorBindEvents(_.merge({}, args, {
				template: template,
				popup: popup
			}));
		},

		tagSelectorBindEvents: function(args) {
			console.log('binding', args);
		}
	};

	return tagSelector;
});
