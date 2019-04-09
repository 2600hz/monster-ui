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

		dragableUploadsBindEvents: function(template, args) {
			var self = this,
				$fileDrop = template.find('.file-drop'),
				handleFileSelect = function(event) {
					var file = event.type === 'drop'
							? event.originalEvent.dataTransfer.files[0]
							: event.target.files[0],
						fd = new FormData();

					if (file && _.includes(args.allowedFiles, file.type)) {
						self.appFlags.dragableUploads.files.push({
							name: file.name,
							size: file.size,
							data: event.target.result
						});

						fd.append('file', file);

						$fileDrop
							.removeClass('error uploaded')
							.addClass('success');

						updateFileList();
					} else {
						$fileDrop
							.removeClass('success uploaded')
							.addClass('error');

						updateFileList();
					}
				},
				updateFileList = function() {
					var templateFilesList = $(self.getTemplate({
						name: 'file-list',
						data: {
							files: self.appFlags.dragableUploads.files,
							hasFiles: !_.isEmpty(self.appFlags.dragableUploads.files)
						},
						submodule: 'dragableUploads'
					}));

					template.find('.file-list-area')
						.empty()
						.append(templateFilesList);
				};

			template
				.find('.upload-file')
					.on('mouseenter', function(event) {
						event.preventDefault();

						$fileDrop
							.addClass('dragover', 100);
					})
					.on('mouseleave', function(event) {
						event.preventDefault();

						$fileDrop
							.removeClass('dragover', 100);
					})
					.on('click', function(event) {
						var source = self.appFlags.store.wizard.files.source;
						if (source.hasOwnProperty('id') || source.hasOwnProperty('data')) {
							$fileDrop
								.find('.file-name')
									.text(source.name);

							$fileDrop
								.removeClass('success error')
								.addClass('uploaded');
						}
					});

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
		}
	};

	return dragableUploads;
});
