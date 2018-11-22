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
				formattedData = self.formattedData(args),
				template = $(self.getTemplate({
					name: 'layout',
					data: {
						labels: formattedData.select,
						inputName: args.inputName || '',
						media: args.media,
						noChoose: !!args.noChoose,
						noUpload: !!args.noUpload
					},
					submodule: 'mediaSelector'
				}));

			args.labels = formattedData;

			self.mediaSelectorBindEvents(_.merge({ template: template }, args));

			container
				.empty()
				.append(template);
		},

		formattedData: function(args) {
			var self = this;

			return _.merge({
				select: self.i18n.active().mediaSelector.select,
				dialogSelect: self.i18n.active().mediaSelector.dialogSelect,
				dialogUpload: self.i18n.active().mediaSelector.dialogUpload
			}, args.labels);
		},

		mediaSelectorBindEvents: function(args) {
			var self = this,
				template = args.template,
				dropdown = template.find('.media-selector-dropdown'),
				args = $.extend({
					input: template.find('input[name="' + args.inputName + '"]'),
					removeElement: template.find('.remove-element'),
					displayedElement: template.find('.media-selector-displayed .media')
				}, args);

			dropdown.on('click', function() {
				dropdown.toggleClass('open');
			});

			dropdown.on('blur', function() {
				dropdown.removeClass('open');
			});

			template.find('.media-selector-element').on('click', function() {
				switch ($(this).data('action')) {
					case 'remove': {
						self.onMediaRemove({
							input: args.input,
							displayedElement: args.displayedElement,
							removeElement: args.removeElement
						});
						break;
					}
					case 'select': {
						self.onMediaSelect({
							medias: args.medias,
							media: args.media,
							labels: args.labels.dialogSelect,
							callbackAfterSelect: function(media) {
								self.onMediaSelected(args, media);
							}
						});
						break;
					}
					case 'upload': {
						self.onMediaUpload({
							medias: args.medias,
							media: args.media,
							labels: args.labels.dialogUpload,
							callbackAfterSelect: function(media) {
								self.onMediaSelected(args, media);
							}
						});
						break;
					}
				}
			});
		},

		onMediaRemove: function(args) {
			var self = this;
			args.input.val('');
			args.displayedElement.text(self.i18n.active().mediaSelector.select.emptyValue);
			args.removeElement.addClass('hidden');
			args.removeElement.find('.media').text('');
		},

		onMediaSelect: function(args) {
			var self = this,
				inputName = 'media_id',
				template = $(self.getTemplate({
					name: 'media-selectDialog',
					data: {
						labels: args.labels
					},
					submodule: 'mediaSelector'
				})),
				popup = monster.ui.dialog(template, {
					position: ['top', 20],
					title: args.labels.headline
				});

			monster.pub('common.mediaSelect.render', {
				container: template.find('.media-select-wrapper'),
				name: 'hold_treatment',
				options: args.medias,
				selectedOption: _.get(args, 'media.id', null),
				label: '',
				inputName: inputName,
				skin: 'select',
				callback: function(mediaControl) {
					self.onMediaSelectBindEvents({
						template: template,
						popup: popup,
						mediaControl: mediaControl,
						inputName: inputName,
						callback: function(media) {
							popup && popup.dialog('close').remove();
							args.callbackAfterSelect(media);
						}
					});
				}
			});
		},

		onMediaUpload: function(args) {
			var self = this,
				inputName = 'media_id',
				template = $(self.getTemplate({
					name: 'media-uploadDialog',
					data: {
						labels: args.labels
					},
					submodule: 'mediaSelector'
				})),
				popup = monster.ui.dialog(template, {
					position: ['top', 20],
					title: args.labels.headline
				});

			monster.pub('common.mediaSelect.render', {
				container: template.find('.media-select-wrapper'),
				name: 'hold_treatment',
				options: args.medias,
				selectedOption: null,
				label: '',
				inputName: inputName,
				skin: 'upload',
				callback: function(mediaControl) {
					self.onMediaSelectBindEvents({
						template: template,
						popup: popup,
						mediaControl: mediaControl,
						inputName: inputName,
						callback: function(media) {
							popup && popup.dialog('close').remove();
							args.callbackAfterSelect(media);
						}
					});
				}
			});
		},

		onMediaSelected: function(args, media) {
			var callback = args.callback,
				selectedMedia = _.find(args.medias, function(file) { return file.id === media; }),
				input = args.input,
				removeElement = args.removeElement,
				displayedElement = args.displayedElement,
				callback = args.callback,
				mediaId = media;

			if (_.isObject(media)) {
				selectedMedia = media;
				mediaId = selectedMedia.id;
			}

			input.val(selectedMedia.id);
			removeElement.find('.media').text(selectedMedia.name);
			displayedElement.text(selectedMedia.name);
			removeElement.removeClass('hidden');

			callback && callback({
				getValue: function() {
					return mediaId;
				}
			});
		},

		onMediaCancel: function(args) {
			args.popup && args.popup.dialog('close').remove();
		},

		onMediaSelectBindEvents: function(args) {
			var self = this,
				template = args.template,
				callback = args.callback,
				mediaControl = args.mediaControl,
				$selectBtn = template.find('.select-submit');

			$selectBtn.on('click', function() {
				callback(mediaControl.getValue());
			});

			template.find('.cancel').on('click', function() {
				self.onMediaCancel(args);
			});
		}
	};

	return mediaSelector;
});
