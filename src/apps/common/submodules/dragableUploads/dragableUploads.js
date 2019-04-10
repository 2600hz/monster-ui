define(function(require) {
	var $ = require('jquery'),
		_ = require('lodash'),
		monster = require('monster');

	var dragableUploads = {
		// Defines API requests not included in the SDK
		requests: {},

		// Define the events available for other apps
		subscribe: {
			'common.dragableUploads.renderUploadArea': 'renderUploadArea'
		},

		appFlags: {
			dragableUploads: {
				files: []
			}
		},

		renderUploadArea: function(args) {
			var self = this,
				container = args.container,
				template = $(self.getTemplate({
					name: 'layout',
					data: {},
					submodule: 'dragableUploads'
				}));

			container
				.empty()
				.append(template);

			self.dragableUploadsBindEvents(template, args);
		},

		dragableUploadsRenderFileList(template) {
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
						reader = new FileReader();

					if (file && _.includes(args.allowedFiles, file.type)) {
						reader.onload = function(event) {
							self.appFlags.dragableUploads.files.push({
								name: file.name,
								size: file.size,
								data: event.target.result
							});

							$fileDrop
								.removeClass('error uploaded')
								.addClass('success');

							self.dragableUploadsRenderFileList(template);
						};

						reader.readAsDataURL(file);
					} else {
						$fileDrop
							.removeClass('success uploaded')
							.addClass('error');

						self.dragableUploadsRenderFileList(template);
					}
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
						self.dragableUploadsUploadFiles(args.callback);
						self.dragableUploadsClearList(template);
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

		dragableUploadsUploadFiles: function(mainCallback) {
			var self = this,
				parallelRequests = [];

			if (!_.isEmpty(self.appFlags.dragableUploads.files)) {
				parallelRequests = _.map(self.appFlags.dragableUploads.files, function(file) {
					return function(callback) {
						return self.dragableUploadsRequestMediaUpload(callback, file);
					};
				});

				monster.parallel(parallelRequests, function(err, results) {
					mainCallback(err, results);
				});
			}
		},

		dragableUploadsClearList(template) {
			var self = this;
			self.appFlags.dragableUploads.files = [];
			self.dragableUploadsRenderFileList(template);
		},

		dragableUploadsRequestMediaUpload(callback, file) {
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
