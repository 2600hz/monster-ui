define(function(require) {
	var $ = require('jquery'),
		_ = require('underscore'),
		monster = require('monster'),
		toastr = require('toastr');

	var portWizard = {

		// Defines API requests not included in the SDK
		requests: {
		},

		// Define the events available for other apps
		subscribe: {
			'common.portWizard.render': 'portWizardRenderPortInfo'
		},

		appFlags: {
			attachments: {
				mimeTypes: [
					'application/pdf'
				],
				maxSize: 8
			}
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
				attachments: {},
				request: {
					numbers: {}
				}
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
										btnClass: 'monster-button-primary',
										inputOnly: true,
										inputPlaceholder: '.pdf',
										mimeTypes: self.appFlags.attachments.mimeTypes,
										maxSize: self.appFlags.attachments.maxSize,
										success: function(results) {
											var actionsTemplate = $(self.getTemplate({
												name: 'portInfo-actions',
												submodule: 'portWizard'
											})).css('display', 'none');

											if (container.find('.portInfo-success').length < 1) {
												billFileData = results[0];

												container
													.find('.actions')
														.prepend(actionsTemplate);

												container
													.find('.portInfo-success')
														.fadeIn();
											}
										},
										error: function(errorsList) {
											self.portWizardFileUploadErrorsHandler(errorsList);
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
				.on('click', '.portInfo-success', function(event) {
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
							'type': {
								required: true
							}
						}
					});

					if (monster.ui.valid($form)) {
						$.extend(true, args.data, {
							request: formData,
							attachments: {
								bill: billFileData
							}
						});

						self.portWizardRenderAccountVerification(args);
					}
				});

			container
				.find('.cancel')
					.on('click', function(event) {
						event.preventDefault();

						console.log('cancel');
					});
		},

		portWizardRenderAccountVerification: function(args) {
			var self = this,
				container = args.container,
				template = $(self.getTemplate({
					name: 'accountVerification',
					submodule: 'portWizard'
				}));

			monster.ui.renderPDF(args.data.attachments.bill.file, template.find('.pdf-container'));

			container
				.empty()
				.append(template);

			self.portWizardBindAccountVerificationEvents(args);
		},

		portWizardBindAccountVerificationEvents: function(args) {
			var self = this,
				container = args.container;

			container
				.find('.next')
					.on('click', function(event) {
						event.preventDefault();

						var $form = container.find('#form_account_verification'),
							formData = monster.ui.getFormData('form_account_verification');

						monster.ui.validate($form, {
							rules: {
								'bill.name': {
									minlength: 1,
									maxlength: 128
								},
								'bill.steet_address': {
									minlength: 1,
									maxlength: 128
								},
								'bill.locality': {
									minlength: 1,
									maxlength: 128
								},
								'bill.region': {
									minlength: 2,
									maxlength: 2
								},
								'bill.postal_code': {
									digits: true,
									minlength: 5,
									maxlength: 5
								},
								validation: {
									required: true
								}
							}
						});

						if (monster.ui.valid($form)) {
							$.extend(true, args.data.request, {
								bill: formData.bill
							});

							self.portWizardRenderAddNumbers(args);
						}
					});

			container
				.find('.cancel')
					.on('click', function(event) {
						event.preventDefault();

						console.log('cancel');
					});
		},

		portWizardRenderAddNumbers: function(args) {
			var self = this,
				container = args.container,
				dataToTemplate = $.extend(true, args.data, {
					request: {
						extra: {
							numbers_count: _.keys(args.data.request.numbers).length
						}
					}
				}),
				template = $(self.getTemplate({
					name: 'addNumbers',
					data: dataToTemplate,
					submodule: 'portWizard'
				}));

			monster.ui.renderPDF(args.data.attachments.bill.file, template.find('.pdf-container'));

			container
				.empty()
				.append(template);

			self.portWizardBindAddNumbersEvents(args);
		},

		portWizardBindAddNumbersEvents: function(args) {
			var self = this,
				container = args.container;

			container
				.find('.add-numbers')
					.on('click', function(event) {
						event.preventDefault();

						var $form = container.find('#form_add_numbers'),
							formData = monster.ui.getFormData('form_add_numbers'),
							newNumbers;

						monster.ui.validate($form, {
							rules: {
								numbers: {
									required: true
								}
							}
						});

						if (monster.ui.valid($form)) {
							newNumbers = formData.numbers.split(' ').reduce(function(object, number) {
								object[monster.util.unformatPhoneNumber(monster.util.formatPhoneNumber(number), 'keepPlus')] = {};
								return object;
							}, {});

							self.portWizardRenderAddNumbers($.extend(true, args, {
								data: {
									request: {
										numbers: newNumbers
									}
								}
							}));
						}
					});

			container
				.find('.remove')
					.on('click', function(event) {
						event.preventDefault();

						var number = $(this).parents('.item').data('number');

						delete args.data.request.numbers[number];

						self.portWizardRenderAddNumbers(args);
					});

			container
				.find('.next')
					.on('click', function(event) {
						event.preventDefault();

						var sign = $(this).data('sign');

						if (sign === 'manual') {
							self.portWizardRenderUploadForm(args);
						} else {
							self.portWizardRenderSignForm(args);
						}
					});

			container
				.find('.cancel')
					.on('click', function(event) {
						event.preventDefault();

						console.log('cancel');
					});
		},

		portWizardRenderUploadForm: function(args) {
			var self = this,
				container = args.container,
				formType = self.portWizardGetFormType(args.data.request),
				dataToTemplate = {
					type: self.i18n.active().portRequestWizard.formTypes[formType],
					link: monster.config.whitelabel.port[formType]
				},
				template = $(self.getTemplate({
					name: 'uploadForm',
					data: dataToTemplate,
					submodule: 'portWizard'
				}));

			template
				.find('#form_input')
					.fileUpload({
						btnClass: 'monster-button-primary',
						inputOnly: true,
						inputPlaceholder: '.pdf',
						mimeTypes: self.appFlags.attachments.mimeTypes,
						maxSize: self.appFlags.attachments.maxSize,
						success: function(results) {
							var actionsTemplate = $(self.getTemplate({
								name: 'uploadForm-actions',
								submodule: 'portWizard'
							})).css('display', 'none');

							if (template.find('.uploadForm-success').length < 1) {
								$.extend(true, args.data, {
									attachments: {
										form: results[0]
									}
								});

								template
									.find('.actions')
										.prepend(actionsTemplate);

								template
									.find('.uploadForm-success')
										.fadeIn();
							}
						},
						error: function(errorsList) {
							self.portWizardFileUploadErrorsHandler(errorsList);
						}
					});

			container
				.empty()
				.append(template);

			self.portWizardBindUploadFormEvents(args);
		},

		portWizardBindUploadFormEvents: function(args) {
			var self = this,
				container = args.container;

			container
				.on('click', '.uploadForm-success', function(event) {
					event.preventDefault();

					self.portWizardRenderPortNotify(args);
				});

			container
				.find('.cancel')
					.on('click', function(event) {
						event.preventDefault();

						console.log(args.data.request);
					});
		},

		portWizardRenderSignForm: function(args) {
			var self = this,
				container = args.container,
				formType = self.portWizardGetFormType(args.data.request),
				dataToTemplate = {
					type: self.i18n.active().portRequestWizard.formTypes[formType]
				},
				template = $(self.getTemplate({
					name: 'signForm',
					data: dataToTemplate,
					submodule: 'portWizard'
				}));

			container
				.empty()
				.append(template);

			self.portWizardBindSignFormEvents(args);
		},

		portWizardBindSignFormEvents: function(args) {
			var self = this,
				container = args.container;

			container
				.find('.success')
					.on('click', function(event) {
						event.preventDefault();

						self.portWizardRenderPortNotify(args);
					});

			container
				.find('.cancel')
					.on('click', function(event) {
						event.preventDefault();

						console.log('cancel');
					});
		},

		portWizardRenderPortNotify: function(args) {
			var self = this,
				container = args.container,
				template = $(self.getTemplate({
					name: 'portNotify',
					submodule: 'portWizard'
				}));

			container
				.empty()
				.append(template);

			self.portWizardBindPortNotifyEvents(args);
		},

		portWizardBindPortNotifyEvents: function(args) {
			var self = this,
				container = args.container;

			monster.ui.datepicker(container.find('#transfer_date'), {
				minDate: monster.util.getBusinessDate(4),
				beforeShowDay: $.datepicker.noWeekends
			});

			container
				.find('.success')
					.on('click', function(event) {
						event.preventDefault();

						var formData = monster.ui.getFormData('form_notify');

						$.extend(true, args.data.request, formData, {
							transfer_date: monster.util.dateToGregorian(new Date(formData.transfer_date))
						});

						self.portWizardRenderSubmitPort(args);
					});

			container
				.find('.cancel')
					.on('click', function(event) {
						event.preventDefault();

						console.log('cancel');
					});
		},

		portWizardRenderSubmitPort: function(args) {
			var self = this,
				container = args.container,
				dataToTemplate = {
					request: args.data.request,
					today: new Date()
				},
				template = $(self.getTemplate({
					name: 'portSubmit',
					data: dataToTemplate,
					submodule: 'portWizard'
				}));

			container
				.empty()
				.append(template);

			self.portWizardBindPortSubmitEvents(args);
		},

		portWizardBindPortSubmitEvents: function(args) {
			var self = this,
				container = args.container;

			container
				.find('.conditions')
					.on('change', function(event) {
						event.preventDefault();

						var formData = monster.ui.getFormData('form_conditions'),
							disabled = formData.conditions.indexOf(false) > -1;

						container
							.find('.success')
								.prop('disabled', disabled);
					});

			container
				.find('.success')
					.on('click', function(event) {
						event.preventDefault();

						self.portWizardHelperCreatePort($.extend(true, args, {
							success: function(port) {
								self.portWizardRequestUpdateState({
									data: {
										portRequestId: port.id,
										state: 'submitted'
									}
								});
							}
						}));
					});

			container
				.find('.cancel')
					.on('click', function(event) {
						event.preventDefault();

						console.log('cancel');
					});
		},

		/**************************************************
		 *              Data handling helpers             *
		 **************************************************/

		portWizardGetFormType: function(portData) {
			return portData.type === 'local' ? 'loa' : 'resporg';
		},

		portWizardFileUploadErrorsHandler: function(errorsList) {
			var self = this,
				mimeTypes = self.appFlags.attachments.mimeTypes,
				maxSize = self.appFlags.attachments.maxSize,
				fileTypes;

			_.each(errorsList, function(files, type) {
				_.each(files, function(file) {
					if (type === 'mimeTypes') {
						fileTypes = mimeTypes.map(function(value) { return (/[^/]*$/.exec(value)[0]).toUpperCase(); }).join(', ');

						toastr.warning(file + self.i18n.active().portRequestWizard.toastr.warning.mimeTypes.replace('{{variable}}', fileTypes));
					} else if (type === 'size') {
						toastr.warning(file + self.i18n.active().portRequestWizard.toastr.warning.size.replace('{{variable}}', maxSize));
					}
				});
			});
		},

		portWizardHelperCreatePort: function(args) {
			var self = this,
				attachments = _.extend({}, args.data.attachments);

			delete args.data.request.extra;

			self.portWizardRequestAddPort({
				data: {
					data: args.data.request
				},
				success: function(port) {
					if (!_.isEmpty(attachments)) {
						_.each(attachments, function(attachment, key, object) {
							object[key] = function(callback) {
								self.portWizardRequestAddAttachment({
									data: {
										portRequestId: port.id,
										documentName: key + '.pdf',
										data: attachment.file
									},
									success: function() {
										callback(null);
									}
								});
							};
						});

						monster.series(attachments, function(err, results) {
							if (err) {
								args.hasOwnProperty('error') && args.error();
							} else {
								args.hasOwnProperty('success') && args.success(port);
							}
						});
					} else {
						args.hasOwnProperty('success') && args.success(port);
					}
				},
				error: function() {
					args.hasOwnProperty('error') && args.error();
				}
			});
		},

		/**************************************************
		 *              Requests declarations             *
		 **************************************************/

		// Port requests endpoints
		portWizardRequestAddPort: function(args) {
			var self = this;

			self.callApi({
				resource: 'port.create',
				data: $.extend(true, {
					accountId: self.accountId
				}, args.data),
				success: function(data, status) {
					args.hasOwnProperty('success') && args.success(data.data);
				},
				error: function(parsedError, error, globalHandler) {
					args.hasOwnProperty('error') && args.error(parsedError);
				}
			});
		},
		portWizardRequestUpdateState: function(args) {
			var self = this;

			self.callApi({
				resource: 'port.changeState',
				data: $.extend(true, {
					accountId: self.accountId
				}, args.data),
				success: function(data, status) {
					args.hasOwnProperty('success') && args.success(data.data);
				},
				error: function(parsedError, error, globalHandler) {
					args.hasOwnProperty('error') && args.error(parsedError);
				}
			});
		},

		// Attachments endpoints
		portWizardRequestAddAttachment: function(args) {
			var self = this;

			self.callApi({
				resource: 'port.createAttachment',
				data: $.extend(true, {
					accountId: self.accountId
				}, args.data),
				success: function(data, status) {
					args.hasOwnProperty('success') && args.success(data.data);
				},
				error: function(parsedError, error, globalHandler) {
					args.hasOwnProperty('error') && args.error(parsedError);
				}
			});
		}
	};

	return portWizard;
});
