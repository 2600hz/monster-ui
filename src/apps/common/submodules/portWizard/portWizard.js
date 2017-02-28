define(function(require) {
	var $ = require('jquery'),
		_ = require('underscore'),
		monster = require('monster');

	var portWizard = {

		// Defines API requests not included in the SDK
		requests: {
		},

		// Define the events available for other apps
		subscribe: {
			'common.portWizard.render': 'portWizardRenderPortInfo'
		},

		portWizardRenderPortInfo: function(args) {
			var self = this,
				container = args.container,
				template = $(self.getTemplate({
					name: 'portInfo',
					submodule: 'portWizard'
				}));

			container
				.empty()
				.append(template);

			container
				.find('#name')
					.focus();

			args.data = {
				request: {}
			};

			self.portWizardBindPortInfoEvents(args);
		},

		portWizardBindPortInfoEvents: function(args) {
			var self = this,
				container = args.container,
				billFileData;

			container
				.find('.numbers-type')
					.on('change', function(event) {
						event.preventDefault();

						var template;

						if (container.find('.bill-upload-wrapper').is(':empty')) {
							template = $(self.getTemplate({
								name: 'portInfo-billUpload',
								submodule: 'portWizard'
							})).css('display', 'none');

							template
								.find('#bill_input')
									.fileUpload({
										success: function(results) {
											var template = $(self.getTemplate({
												name: 'portInfo-actions',
												submodule: 'portWizard'
											})).css('display', 'none');

											if (container.find('.success').length < 1) {
												billFileData = results[0];

												container
													.find('.actions')
														.prepend(template);

												container
													.find('.success')
														.fadeIn();
											}
										}
									});

							container
								.find('.bill-upload-wrapper')
									.append(template);

							container
								.find('.bill-upload')
									.fadeIn();
						}
					});

			container
				.on('click', '.success', function(event) {
					event.preventDefault();

					var $form = container.find('#form_port_info'),
						formData = monster.ui.getFormData('form_port_info');

					monster.ui.validate($form, {
						rules: {
							name: {
								required: true,
								minlength: 1,
								maxlength: 128
							},
							'extra.type': {
								required: true
							}
						}
					});

					if (monster.ui.valid($form)) {
						$.extend(true, args.data.request, formData, {
							extra: {
								billFileData: billFileData
							}
						});

						console.log(args.data);
					}
				});

			container
				.find('.cancel')
				.on('click', function(event) {
					event.preventDefault();

					console.log('cancel');
				});
		}
	};

	return portWizard;
});
