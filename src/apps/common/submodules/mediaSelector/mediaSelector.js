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
				callback = args.callback,
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

			callback && callback({
				getValue: function() {
					return self.mediaSelectGetValue(template, args);
				}
			});
		},

		formattedData: function(args) {
			var self = this;

			return _.merge({
				select: self.i18n.active().mediaSelector.select,
				dialogSelect: self.i18n.active().mediaSelector.dialogSelect,
				upload: self.i18n.active().mediaSelector.upload
			}, args.labels);
		},

		mediaSelectGetValue: function(template, args) {
			return template.find('input[name="' + args.inputName + '"]').val();
		},

		mediaSelectorBindEvents: function(args) {
			var self = this,
				template = args.template,
				afterCallback = args.afterCallback,
				dropdown = template.find('.media-selector-dropdown'),
				args = $.extend({
					input: template.find('input[name="' + args.inputName + '"]'),
					removeElement: template.find('.remove-element'),
					displayedElement: template.find('.media-selector-displayed .media')
				}, args),
				selectMediaCallback = function(media) {
					if (!_.isEmpty(media[0])) {
						self.onMediaSelected($.extend({}, args, { template: template, media: media[0] }));
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
							labels: args.labels.dialogSelect,
							okCallback: selectMediaCallback
						});
						break;
					}
					case 'upload': {
						self.onMediaUpload(args);
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

			self.mediaSelectBindEvents({
				template: template,
				popup: popup,
				callback: function(media) {
					popup && popup.dialog('close').remove();
					args.media = media;
					self.onMediaSelected(args);
				}
			});
		},

		onMediaUpload: function(args) {
			var self = this,
				template = $(self.getTemplate({
					name: 'media-uploadDialog',
					data: {
						labels: args.labels.upload
					},
					submodule: 'mediaSelector'
				})),
				popup = monster.ui.dialog(template, {
					position: ['top', 20],
					title: args.labels.upload.headline
				});

			self.mediaUploadBindEvents({
				template: template,
				popup: popup,
				callback: function(media) {
					popup && popup.dialog('close').remove();
					args.media = media;
					self.onMediaSelected(args);
				}
			});
		},

		onMediaSelected: function(args) {
			var media = args.media,
				input = args.input,
				removeElement = args.removeElement,
				displayedElement = args.displayedElement;

			input.val(media.id);
			removeElement.find('.media').text(media.name);
			displayedElement.text(media.name);
			removeElement.removeClass('hidden');
		},

		onMediaCancel: function(args) {
			args.popup && args.popup.dialog('close').remove();
		},

		mediaSelectBindEvents: function(args) {
			var self = this,
				template = args.template,
				callback = args.callback,
				mediaToUpload = undefined,
				$submitBtn = template.find('.select-submit');
		},

		mediaUploadBindEvents: function(args) {
			var self = this,
				template = args.template,
				callback = args.callback,
				mediaToUpload = undefined,
				$submitBtn = template.find('.upload-submit');

			$submitBtn.prop('disabled', true);

			template.find('.media-upload-input').fileUpload({
				inputOnly: true,
				wrapperClass: 'file-upload input-append',
				btnClass: 'monster-button',
				maxSize: 5,
				success: function(results) {
					mediaToUpload = results[0];
					$submitBtn.prop('disabled', false);
				},
				error: function(errors) {
					$submitBtn.prop('disabled', true);
					if (errors.hasOwnProperty('size') && errors.size.length > 0) {
						monster.ui.alert(self.i18n.active().mediaSelector.upload.fileTooBigAlert);
					}
					template.find('.upload-div input').val('');
				}
			});

			$submitBtn.on('click', function() {
				if (mediaToUpload) {
					self.callApi({
						resource: 'media.create',
						data: {
							accountId: self.accountId,
							data: {
								streamable: true,
								name: mediaToUpload.name,
								media_source: 'upload',
								description: mediaToUpload.name
							}
						},
						success: function(data) {
							var media = data.data;
							self.callApi({
								resource: 'media.upload',
								data: {
									accountId: self.accountId,
									mediaId: media.id,
									data: mediaToUpload.file
								},
								success: function() {
									callback && callback(media);
								},
								error: function() {
									self.callApi({
										resource: 'media.delete',
										data: {
											accountId: self.accountId,
											mediaId: media.id,
											data: {}
										},
										success: function() {}
									});
								}
							});
						}
					});
				} else {
					monster.ui.alert(self.i18n.active().mediaSelect.emptyUploadAlert);
				}
			});

			template.find('.cancel').on('click', function() {
				self.onMediaCancel(args);
			});
		}
	};

	return mediaSelector;
});
