define(function(require) {
	var $ = require('jquery'),
		monster = require('monster');

	var app = {

		requests: {},

		subscribe: {
			'common.fileUpload.render': 'fileUploadRender'
		},

		fileUploadRender: function(args) {
			var self = this,
				container = args.container,
				labels = $.extend({
					cancel: self.i18n.active().fileUpload.cancel,
					upload: self.i18n.active().fileUpload.upload,
					greetingsHelp: self.i18n.active().fileUpload.greetingsHelp
				}, args.labels),
				layout = $(self.getTemplate({
					name: 'chooseFile',
					data: {
						labels: labels
					},
					submodule: 'fileUpload'
				}));

			if (container) {
				args.labels = labels;
				self.fileUploadBindEvents($.extend({ template: layout }, args));
				container.append(layout);
			} else {
				throw new Error('A container must be provided.');
			}
		},

		fileUploadBindEvents: function(args) {
			var self = this,
				template = args.template,
				callbacks = args.callbacks,
				mediaToUpload;

			template.find('.file-upload-input').fileUpload({
				inputOnly: true,
				wrapperClass: 'upload-container',
				btnText: self.i18n.active().fileUpload.fileUploadButton,
				btnClass: 'monster-button-secondary',
				maxSize: 5,
				success: function(results) {
					mediaToUpload = results[0];
				},
				error: function(errors) {
					if (errors.hasOwnProperty('size') && errors.size.length > 0) {
						monster.ui.alert(self.i18n.active().strategy.alertMessages.fileTooBigAlert);
					}
					template.find('.upload-container input').val('');
					mediaToUpload = undefined;
				}
			});

			template.find('.upload-file').on('click', function() {
				if (mediaToUpload) {
					var uploadFile = function(file, greetingId, callback) {
						self.callApi({
							resource: 'media.upload',
							data: {
								accountId: self.accountId,
								mediaId: greetingId,
								data: file
							},
							success: function(data, status) {
								callback && callback();
							},
							error: function(data, status) {
								self.callApi({
									resource: 'media.delete',
									data: {
										accountId: self.accountId,
										mediaId: file.id,
										data: {}
									},
									success: function(data, status) {}
								});
							}
						});
					};

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
							var media = data.data,
								id = media.id;

							uploadFile(mediaToUpload.file, id, function() {
								callbacks.success(media);
							});
						}
					});
				} else {
					monster.ui.alert(self.i18n.active().alertMessages.emptyUpload);
				}
			});
		}
	};

	return app;
});
