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
					upload: self.i18n.active().mediaSelector.upload,
					removeTooltip: self.i18n.active().mediaSelector.removeTooltip
				}, args.labels),
				layout = $(self.getTemplate({
					name: 'layout',
					data: {
						labels: labels,
						inputName: args.inputName || '',
						media: args.media,
						noChoose: !!args.noChoose,
						noUpload: !!args.noUpload
					},
					submodule: 'mediaSelector'
				}));

			if (container) {
				args.labels = labels;
				self.mediaSelectorBindEvents($.extend({ template: layout }, args));
				container.append(layout);
				monster.ui.tooltips(container);
			} else {
				throw new Error('A container must be provided.');
			}
		},

		mediaSelectorBindEvents: function(args) {
			var self = this,
				template = args.template,
				afterCallback = args.afterCallback,
				dropdown = template.find('.media-selector-dropdown'),
				input = template.find('input[name="' + args.inputName + '"]'),
				displayedElement = template.find('.media-selector-displayed .media'),
				removeElement = template.find('.remove-element'),
				medias = args.medias,
				selectMediaCallback = function(media) {
					if (!_.isEmpty(media[0])) {
						input.val(media[0].id);

						removeElement.find('.media').text(media[0].name);
						displayedElement.text(media[0].name);
						removeElement.removeClass('hidden');

						afterCallback && afterCallback(media.id);
					}
				};

			dropdown.on('click', function() {
				dropdown.toggleClass('open');
			});

			dropdown.on('blur', function() {
				dropdown.removeClass('open');
			});

			template.find('.media-selector-element').on('click', function() {
				switch ($(this).data('action')) {
					case 'remove': {
						self.removeSelectedMedia({input: input, displayedElement: displayedElement, removeElement: removeElement});
						break;
					}
					case 'select': {
						monster.pub('common.monsterListing.render', {
							dataList: medias,
							dataType: 'medias',
							labels: {
								title: self.i18n.active().mediaSelector.dialogSelect.title,
								headline: self.i18n.active().mediaSelector.dialogSelect.headline,
								okButton: self.i18n.active().mediaSelector.dialogSelect.proceed
							},
							singleSelect: true,
							okCallback: selectMediaCallback
						});
						break;
					}
					case 'upload': {
						// Upload media
						break;
					}
				}
			});
		},

		removeSelectedMedia: function(args) {
			var self = this;
			args.input.val('');
			args.displayedElement.text(self.i18n.active().mediaSelector.emptyValue);
			args.removeElement.addClass('hidden');
			args.removeElement.find('.media').text('');
		}
	};

	return mediaSelector;
});
