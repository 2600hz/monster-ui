define(function(require) {
	var $ = require('jquery'),
		_ = require('lodash');

	var mediaSelector = {
		requests: {},

		subscribe: {
			'common.mediaSelector.render': 'mediaSelectorRender'
		},

		mediaSelectorRender: function(args) {
			var self = this,
				container = args.container,
				labels = $.extend({
					empty: self.i18n.active().mediaSelector.emptyValue,
					choose: self.i18n.active().mediaSelector.choose,
					upload: self.i18n.active().mediaSelector.upload
				}, args.labels),
				layout = $(self.getTemplate({
					name: 'layout',
					data: {
						labels: labels,
						inputName: args.inputName || '',
						file: args.file,
						noChoose: !!args.noChoose,
						noUpload: !!args.noUpload
					},
					submodule: 'mediaSelector'
				}));

			if (container) {
				args.labels = labels;
				self.mediaSelectorBindEvents($.extend({ template: layout }, args));
				container.append(layout);
			} else {
				throw new Error('A container must be provided.');
			}
		},

		mediaSelectorBindEvents: function(args) {
			var self = this,
				template = args.template,
				dropdown = template.find('.media-selector-dropdown');

			dropdown.on('click', function() {
				dropdown.toggleClass('open');
			});

			dropdown.on('blur', function() {
				dropdown.removeClass('open');
			});

			template.find('.media-selector-element').on('click', function() {
				switch ($(this).data('action')) {
					case 'remove': {
						// remove file
						break;
					}
					case 'select': {
						// Choose file form list
						break;
					}
					case 'upload': {
						// Upload file
						break;
					}
				}
			});
		}
	};

	return mediaSelector;
});
