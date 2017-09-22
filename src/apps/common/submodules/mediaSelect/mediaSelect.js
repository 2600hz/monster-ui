define(function(require) {
	var $ = require('jquery'),
		_ = require('lodash'),
		monster = require('monster');

	var mediaSelect = {

		requests: {},

		subscribe: {
			'common.mediaSelect.render': 'mediaSelectRender'
		},

		mediaSelectRender: function(args) {
			var self = this,
				container = args.container,
				callback = args.callback,
				formattedData = self.mediaSelectFormatData(args),
				template = $(monster.template(self, 'mediaSelect-layout', formattedData));

			self.mediaSelectBindEvents(template);

			container
				.empty()
				.append(template);

			callback && callback({
				getValue: function() {
					return self.mediaSelectGetValue(template);
				}
			});
		},

		mediaSelectFormatData: function(args) {
			var self = this,
				defaultData = {
					noneLabel: self.i18n.active().mediaSelect.noneLabel,
					selectedOption: false,
					uploadButton: true,
					options: [],
					name: undefined,
					uploadLabel: self.i18n.active().upload,
					label: self.i18n.active().mediaSelect.defaultLabel,
					hasNone: true,
					hasShoutcast: true,
					hasSilence: true,
					isShoutcast: false,
					shoutcastURLInputClass: ''
				},
				formattedData = $.extend(true, {}, defaultData, args),
				optionShoutcast = {
					id: 'shoutcast',
					name: self.i18n.active().mediaSelect.shoutcastURL
				},
				optionNone = {
					id: 'none',
					name: formattedData.noneLabel
				},
				optionSilence = {
					id: 'silence_stream://300000',
					name: self.i18n.active().mediaSelect.silence
				},
				isShoutcast = formattedData.selectedOption && formattedData.selectedOption.indexOf('://') >= 0 && formattedData.selectedOption !== 'silence_stream://300000',
				options = [];

			if (formattedData.hasNone) {
				options.push(optionNone);
			}

			if (formattedData.hasSilence) {
				options.push(optionSilence);
			}

			if (formattedData.hasShoutcast) {
				options.push(optionShoutcast);
			}

			formattedData.options = options.concat(args.options);

			if (isShoutcast) {
				formattedData.isShoutcast = isShoutcast;
				formattedData.shoutcastValue = formattedData.selectedOption;
				formattedData.selectedOption = 'shoutcast';
			}

			return formattedData;
		},

		mediaSelectGetValue: function(template) {
			var self = this,
				response;

			if (template) {
				var val = template.find('.media-dropdown').val();

				if (val === 'shoutcast') {
					response = template.find('.shoutcast-div input').val();
				} else {
					response = val;
				}
			} else {
				response = 'invalid_template';
			}

			return response;
		},

		mediaSelectBindEvents: function(template) {
			var self = this,
				mediaToUpload,
				closeUploadDiv = function(newMedia) {
					mediaToUpload = undefined;
					template.find('.upload-div input').val('');
					template.find('.upload-div').slideUp(function() {
						template.find('.upload-toggle').removeClass('active');
					});
					if (newMedia) {
						var mediaSelect = template.find('.media-dropdown');
						mediaSelect.append('<option value="' + newMedia.id + '">' + newMedia.name + '</option>');
						mediaSelect.val(newMedia.id);
					}
				};

			template.find('.media-dropdown').on('change', function() {
				var val = $(this).val(),
					isShoutcast = val === 'shoutcast';

				template.find('.shoutcast-div')
						.toggleClass('hidden', !isShoutcast)
						.find('input')
						.val('');

				if (isShoutcast) {
					closeUploadDiv();
				}
			});

			template.find('.upload-input').fileUpload({
				inputOnly: true,
				wrapperClass: 'file-upload input-append',
				//btnText: self.i18n.active().vmboxes.popupSettings.greeting.audioUploadButton,
				btnClass: 'monster-button',
				maxSize: 5,
				success: function(results) {
					mediaToUpload = results[0];
				},
				error: function(errors) {
					if (errors.hasOwnProperty('size') && errors.size.length > 0) {
						monster.ui.alert(self.i18n.active().mediaSelect.fileTooBigAlert);
					}
					template.find('.upload-div input').val('');
					mediaToUpload = undefined;
				}
			});

			template.find('.upload-toggle').on('click', function() {
				if ($(this).hasClass('active')) {
					template.find('.upload-div').stop(true, true).slideUp();
				} else {
					template.find('.upload-div').stop(true, true).slideDown();
				}
			});

			template.find('.upload-cancel').on('click', function() {
				closeUploadDiv();
			});

			template.find('.upload-submit').on('click', function() {
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
						success: function(data, status) {
							var media = data.data;
							self.callApi({
								resource: 'media.upload',
								data: {
									accountId: self.accountId,
									mediaId: media.id,
									data: mediaToUpload.file
								},
								success: function(data, status) {
									closeUploadDiv(media);
									template.find('.shoutcast-div').addClass('hidden');
								},
								error: function(data, status) {
									self.callApi({
										resource: 'media.delete',
										data: {
											accountId: self.accountId,
											mediaId: media.id,
											data: {}
										},
										success: function(data, status) {}
									});
								}
							});
						}
					});
				} else {
					monster.ui.alert(self.i18n.active().mediaSelect.emptyUploadAlert);
				}
			});
		}
	};

	return mediaSelect;
});
