define(function(require) {
	var $ = require('jquery'),
		Papa = require('papaparse'),
		monster = require('monster');

	return {
		subscribe: {
			'common.csvUploader.renderPopup': 'csvUploaderRender'
		},

		/**
		 * @param  {Object} args
		 * @param  {String[]} args.header Expected header
		 * @param  {Function} args.row.sanitizer Sanitizes row input
		 * @param  {Function} args.row.validator Validates row input
		 * @param  {Function} [args.row.extractor} Extracts row as object
		 * @param  {String} [args.title] Popup title
		 * @param  {Blob} [args.file] CSV template file
		 * @param  {String} [args.filename] CSV template filename
		 * @param  {String} [args.dataLabel] Label of entities to import
		 * @param {Function} [args.onSuccess] Invoked on import button click
		 * @param {Function} [args.onClose] Invoked on close button click
		 */
		csvUploaderRender: function(args) {
			var self = this,
				url = args.file instanceof Blob ? window.URL.createObjectURL(args.file) : null,
				$template = $(self.getTemplate({
					name: 'layout',
					data: _.merge({
						url: url
					}, _.pick(args, [
						'filename',
						'dataLabel'
					])),
					submodule: 'csvUploader'
				})),
				$popup = monster.ui.dialog($template, {
					title: _.get(args, 'title', self.i18n.active().csvUploader.defaultTitle),
					onClose: function() {
						url && window.URL.revokeObjectURL(url);
					}
				});

			self.csvUploaderBindEvents(_.merge({
				url: url,
				template: $template,
				popup: $popup
			}, _.pick(args, [
				'header',
				'row',
				'file',
				'onSuccess',
				'onClose'
			])));
		},

		csvUploaderBindEvents: function(args) {
			var self = this,
				$form = args.template,
				$popup = args.popup,
				validator = monster.ui.validate($form),
				$submitButton = $form.find('button[type="submit"]'),
				successHandler = function(files) {
					var prasedFile = Papa.parse(files[0].file);

					if (!_.isEmpty(prasedFile.errors)) {
						return errorHandler(
							_.get(
								_.head(prasedFile.errors),
								'message',
								self.i18n.active().csvUploader.invalidFile
							)
						);
					}
					var expectedHeader = args.header,
						potentialHeader = _
							.chain(prasedFile.data)
							.head()
							.map(_.toLower)
							.value(),
						hasHeader = _.isEqual(
							_.sortBy(potentialHeader),
							_.sortBy(expectedHeader)
						),
						header = hasHeader ? potentialHeader : expectedHeader,
						entries = hasHeader ? _.tail(prasedFile.data) : prasedFile.data,
						extractObjects = function(entry) {
							return _.reduce(header, function(acc, prop, index) {
								return _.merge(
									_.set({}, prop, entry[index]),
									acc
								);
							}, {});
						},
						sanitized = _
							.chain(entries)
							.reject(_.partial(_.every, _, _.isEmpty))
							.map(_.flow(
								args.row.extractor || extractObjects,
								args.row.sanitizer))
							.value(),
						invalidRows = _
							.chain(sanitized)
							.map(function(row, index) {
								return {
									row: row,
									index: index
								};
							})
							.reject(_.flow(
								_.partial(_.get, _, 'row'),
								args.row.validator
							))
							.value(),
						firstFiveInvalidRowLines = _
							.chain(invalidRows)
							.map(_.flow(
								_.partial(_.get, _, 'index'),
								_.partial(_.add, 1)
							))
							.slice(0, 5)
							.value(),
						invalidRowLines = _
							.chain([
								firstFiveInvalidRowLines,
								invalidRows.length > 5 ? self.i18n.active().csvUploader.andMore : []
							])
							.flatten()
							.join(', ')
							.value();

					if (!_.isEmpty(invalidRows)) {
						return errorHandler(self.getTemplate({
							name: '!' + self.i18n.active().csvUploader.invalidRows,
							data: {
								list: invalidRowLines
							}
						}));
					}
					csvData = sanitized;

					validator.resetForm();
					$form.find('input[name="file_input"]').removeClass('monster-invalid');
					$submitButton.prop('disabled', false);
				},
				errorHandler = function(message) {
					$submitButton.prop('disabled', 'disabled');
					validator.showErrors({
						file_input: message
					});
				},
				csvData;

			$form.find('.file-upload-input').fileUpload({
				dataFormat: 'text',
				filesList: [self.i18n.active().csvUploader.noFile],
				inputOnly: true,
				wrapperClass: 'file-upload input-append',
				btnClass: 'monster-button',
				btnText: self.i18n.active().csvUploader.chooseFile,
				mimeTypes: ['text/csv', 'application/vnd.ms-excel'],
				success: successHandler,
				error: errorHandler
			});
			$form.find('.file-upload input[type="text"]').prop('name', 'file_input');

			$form.find('.cancel').on('click', function() {
				$popup.dialog('close');
				args.onClose && args.onClose();
			});

			$form.on('submit', function(event) {
				event.preventDefault();

				args.onSuccess && args.onSuccess(csvData);

				$popup.dialog('close');
			});
		}
	};
});
