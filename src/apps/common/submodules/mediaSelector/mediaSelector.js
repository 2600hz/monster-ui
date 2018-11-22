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
				dialog: {
					select: self.i18n.active().mediaSelector.dialog.select,
					upload: self.i18n.active().mediaSelector.dialog.upload
				}
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
				var action = $(this).data('action');

				switch (action) {
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
							labels: args.labels.dialog[action],
							templateName: 'media-selectDialog',
							selectedOption: _.get(args, 'media.id', null),
							skin: action,
							callbackAfterSelect: function(media) {
								self.onMediaSelected(args, media);
							}
						});
						break;
					}
					case 'upload': {
						self.onMediaSelect({
							medias: args.medias,
							media: args.media,
							labels: args.labels.dialog[action],
							templateName: 'media-uploadDialog',
							selectedOption: _.get(args, 'media.id', null),
							skin: action,
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
			args.displayedElement.text(self.i18n.active().mediaSelector.select.empty);
			args.removeElement.addClass('hidden');
			args.removeElement.find('.media').text('');
		},

		onMediaSelect: function(args) {
			var self = this,
				inputName = 'media_id',
				template = $(self.getTemplate({
					name: args.templateName,
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
				name: args.inputName,
				options: args.medias,
				selectedOption: args.selectedOption,
				label: '',
				inputName: inputName,
				skin: args.skin,
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
				args.popup && args.popup.dialog('close').remove();
			});
		}
	};

	return mediaSelector;
});
