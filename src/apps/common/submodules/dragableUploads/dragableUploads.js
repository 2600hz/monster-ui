define(function(require) {
	var $ = require('jquery'),
		_ = require('lodash'),
		monster = require('monster');

	var dragableUploads = {
		// Defines API requests not included in the SDK
		requests: {},

		// Define the events available for other apps
		subscribe: {
			'common.dragableUploads.render': 'dragableUploadsRender'
		},

		appFlags: {
			dragableUploads: {
				files: [],
				maxFileSize: 5242880 // 5MB
			}
		},

		/**
		 * @param {Object} args
		 * @param {jQuery} args.container
		 * @param {Array} args.allowedFiles
		 * @param {Integer} args.maxFileSize
		 * @param {jQuery} args.popup
		 * @param {Function} args.callback
		 */
		dragableUploadsRender: function(args) {
			var self = this,
				container = args.container,
				maxFileSize = monster.util.formatBytes(args.maxFileSize || self.appFlags.dragableUploads.maxFileSize),
				template = $(self.getTemplate({
					name: 'layout',
					data: {
						fileUploadLegend: self.getTemplate({
							name: '!' + self.i18n.active().dragableUploads.fileUploadLegend,
							data: {
								allowedFiles: _.join(args.allowedFiles, ', '),
								maxFileSize: maxFileSize.value + '' + maxFileSize.unit.symbol
							}
						})
					},
					submodule: 'dragableUploads'
				}));

			container
				.empty()
				.append(template);

			self.dragableUploadsBindEvents(template, args);
		},

		dragableUploadsRenderFileList: function(template) {
			var self = this,
				templateFilesList = $(self.getTemplate({
					name: 'file-list',
					data: {
						files: self.appFlags.dragableUploads.files,
						hasFiles: !_.isEmpty(self.appFlags.dragableUploads.files)
					},
					submodule: 'dragableUploads'
				}));

			template.find('.dragable-file-list-area')
				.empty()
				.append(templateFilesList);

			self.dragableUploadsBindFileListEvents(template);
		},

		dragableUploadsBindEvents: function(template, args) {
			var self = this,
				$fileDrop = template.find('.file-drop'),
				handleFileSelect = function(event) {
					var file = event.type === 'drop'
							? event.originalEvent.dataTransfer.files[0]
							: event.target.files[0],
						reader = new FileReader(),
						maxFileSize = args.maxFileSize || self.appFlags.dragableUploads.maxFileSize,
						fileSize = monster.util.formatBytes(maxFileSize || self.appFlags.dragableUploads.maxFileSize);

					if (file && !_.includes(args.allowedFiles, file.type)) {
						$fileDrop
							.removeClass('success uploaded')
							.addClass('error');

						$fileDrop.find('.file-drop-error-message').text(self.i18n.active().dragableUploads.invalidFileFormatError);

						return;
					} else if (file.size >= maxFileSize) {
						var maxFileZiseError = self.getTemplate({
							name: '!' + self.i18n.active().dragableUploads.fileSizeExceded,
							data: {
								maxFileSize: fileSize.value + '' + fileSize.unit.symbol
							}
						});

						$fileDrop
							.removeClass('success uploaded')
							.addClass('error');

						$fileDrop.find('.file-drop-error-message').text(maxFileZiseError);

						return;
					}

					reader.onload = function(event) {
						self.appFlags.dragableUploads.files.push({
							name: file.name,
							size: file.size,
							data: event.target.result,
							bytes: monster.util.formatBytes(file.size)
						});

						$fileDrop
							.removeClass('error uploaded')
							.addClass('success');

						if (args.singleFileSelection) {
							args.callback(null, self.appFlags.dragableUploads.files);
						}
					};

					reader.readAsDataURL(file);
					self.dragableUploadsRenderFileList(template);
				};

			$fileDrop
				.on('drag dragstart dragend dragover dragenter dragleave drop', function(event) {
					event.preventDefault();
					event.stopPropagation();
				})
				.on('dragover dragenter', function(event) {
					$(this).addClass('dragover', 100);
				})
				.on('dragleave dragend drop', function(event) {
					$(this).removeClass('dragover', 100);
				})
				.on('drop', handleFileSelect);

			template
				.find('#source')
					.on('change', handleFileSelect);

			template
				.find('.upload-action')
					.on('click', function() {
						self.dragableUploadsUploadFiles(args);
						self.dragableUploadsClearList(template);
					});

			template
				.find('.upload-cancel')
					.on('click', function() {
						args.hasOwnProperty('popup') && args.popup.dialog('close').remove();
					});
		},

		dragableUploadsBindFileListEvents: function(template) {
			var self = this;

			template
				.find('.file-box')
					.on('click', function() {
						var filename = $(this).data('file_name');

						self.appFlags.dragableUploads.files = _.filter(self.appFlags.dragableUploads.files, function(file) {
							return file.name !== filename;
						});

						self.dragableUploadsRenderFileList(template);
					});
		},

		dragableUploadsUploadFiles: function(args) {
			var self = this,
				parallelRequests = [],
				mainCallback = args.callback;

			if (!_.isEmpty(self.appFlags.dragableUploads.files)) {
				parallelRequests = _.map(self.appFlags.dragableUploads.files, function(file) {
					return function(callback) {
						return self.dragableUploadsRequestMediaUpload(callback, file);
					};
				});

				monster.parallel(parallelRequests, function(err, results) {
					mainCallback(err, results);
					args.hasOwnProperty('popup') && args.popup.dialog('close').remove();
				});
			}
		},

		dragableUploadsClearList: function(template) {
			var self = this;
			self.appFlags.dragableUploads.files = [];
			self.dragableUploadsRenderFileList(template);
		},

		dragableUploadsRequestMediaUpload: function(callback, file) {
			var self = this;

			self.callApi({
				resource: 'media.create',
				data: {
					accountId: self.accountId,
					data: {
						streamable: true,
						name: file.name,
						media_source: 'upload',
						description: file.name
					}
				},
				success: function(data, status) {
					var media = data.data;
					self.callApi({
						resource: 'media.upload',
						data: {
							accountId: self.accountId,
							mediaId: media.id,
							data: file.data
						},
						success: function(data, status) {
							callback(null, media);
						},
						error: function(data, status) {
							self.callApi({
								resource: 'media.delete',
								data: {
									accountId: self.accountId,
									mediaId: media.id,
									data: {}
								}
							});
						}
					});
				}
			});
		}
	};

	return dragableUploads;
});
