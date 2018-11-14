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
					select: {
						empty: self.i18n.active().mediaSelector.select.emptyValue,
						choose: self.i18n.active().mediaSelector.select.choose,
						upload: self.i18n.active().mediaSelector.select.upload,
						remove: self.i18n.active().mediaSelector.select.remove
					},
					upload: {
						headline: self.i18n.active().mediaSelector.upload.headline,
						upload: self.i18n.active().mediaSelector.upload.upload,
						cancel: self.i18n.active().mediaSelector.upload.cancel
					}
				}, args.labels),
				layout = $(self.getTemplate({
					name: 'layout',
					data: {
						labels: labels.select,
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
			} else {
				throw new Error('A container must be provided.');
			}
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
			var self = this;

			monster.pub('common.monsterListing.render', {
				dataList: args.medias,
				dataType: 'medias',
				labels: {
					title: self.i18n.active().mediaSelector.dialogSelect.title,
					headline: self.i18n.active().mediaSelector.dialogSelect.headline,
					okButton: self.i18n.active().mediaSelector.dialogSelect.proceed
				},
				singleSelect: true,
				okCallback: args.okCallback
			});
		},

		onMediaUpload: function(args) {
			var self = this,
				popup,
				template = $(self.getTemplate({
					name: 'media-uploadDialog',
					data: {
						labels: args.labels.upload
					},
					submodule: 'mediaSelector'
				}));

			monster.pub('common.mediaSelect.render', {
				container: template.find('.media-wrapper'),
				options: [],
				selectedOption: null,
				label: 'Label',
				noneLabel: 'NonLabel',
				skin: 'tabs',
				callback: function() {
					popup = monster.ui.dialog(template, {
						position: ['top', 20],
						title: args.labels.upload.headline
					});
				}
			});

			self.mediaUploadBinEvents({
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

		mediaUploadBinEvents: function(args) {
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
