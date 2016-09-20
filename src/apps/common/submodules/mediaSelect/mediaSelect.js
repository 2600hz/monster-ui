define(function(require){
	var $ = require('jquery'),
		_ = require('underscore'),
		monster = require('monster');

	var mediaSelect = {

		requests: {},

		subscribe: {
			'common.mediaSelect.render': 'mediaSelectRender'
		},

		mediaSelectRender: function(args) {
			var self = this,
				container = args.container,
				defaultData = {
					selectedOption: false,
					uploadButton: true,
					options: [],
					name: undefined,
					uploadLabel: self.i18n.active().upload,
					label: self.i18n.active().mediaSelect.defaultLabel
				},
				formattedData = $.extend(true, {}, defaultData, args),
				template = $(monster.template(self, 'mediaSelect-layout', formattedData));

			self.mediaSelectBindEvents(template);

			container.empty()
					 .append(template);
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
					if(newMedia) {
						var mediaSelect = template.find('.media-dropdown');
						mediaSelect.append('<option value="'+newMedia.id+'">'+newMedia.name+'</option>');
						mediaSelect.val(newMedia.id);
					}
				};

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
					if(errors.hasOwnProperty('size') && errors.size.length > 0) {
						monster.ui.alert(self.i18n.active().mediaSelect.fileTooBigAlert);
					}
					template.find('.upload-div input').val('');
					mediaToUpload = undefined;
				}
			});

			template.find('.upload-toggle').on('click', function() {
				if($(this).hasClass('active')) {
					template.find('.upload-div').stop(true, true).slideUp();
				} else {
					template.find('.upload-div').stop(true, true).slideDown();
				}
			});

			template.find('.upload-cancel').on('click', function() {
				closeUploadDiv();
			});

			template.find('.upload-submit').on('click', function() {
				if(mediaToUpload) {
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
	}

	return mediaSelect;
});
