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
				appendTemplate = function appendTemplate() {
					var template = $(self.getTemplate({
						name: 'portInfo',
						data: {
							request: args.data.request
						},
						submodule: 'portWizard'
					}));

					container
						.empty()
						.append(template);

					container
						.find('#name')
							.focus();

					self.portWizardBindPortInfoEvents(args);
				};

			$.extend(true, args, {
				data: {
					attachments: {},
					request: {
						numbers: {}
					}
				}
			});

			appendTemplate();
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
										btnClass: 'monster-button-primary monster-button-small',
										btnText: self.i18n.active().portRequestWizard.fileUpload.button,
										inputOnly: true,
										inputPlaceholder: self.i18n.active().portRequestWizard.fileUpload.placeholder,
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

						self.portWizardHelperCancelPort(args);
					});
		},

		portWizardRenderAccountVerification: function(args) {
			var self = this,
				container = args.container,
				template = $(self.getTemplate({
					name: 'accountVerification',
					data: {
						request: args.data.request
					},
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

						var action = $(this).data('action'),
							$form = container.find('#form_account_verification'),
							formData = monster.ui.getFormData('form_account_verification');

						monster.ui.validate($form, {
							rules: {
								'bill.name': {
									minlength: 1,
									maxlength: 128
								},
								'bill.street_address': {
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
								'bill.account_number': {
									maxlength: 128
								},
								'bill.pin': {
									maxlength: 6
								},
								'bill.btn': {
									maxlength: 20
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

							if (action === 'save') {
								self.portWizardHelperSavePort($.extend(true, args, {
									success: args.globalCallback
								}));
							} else if (action === 'next') {
								self.portWizardRenderAddNumbers(args);
							}
						}
					});

			container
				.find('.cancel')
					.on('click', function(event) {
						event.preventDefault();

						self.portWizardHelperCancelPort(args);
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

						self.portWizardHelperCancelPort(args);
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
						btnClass: 'monster-button-primary monster-button-small',
						btnText: self.i18n.active().portRequestWizard.fileUpload.button,
						inputOnly: true,
						inputPlaceholder: self.i18n.active().portRequestWizard.fileUpload.placeholder,
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
										.append(actionsTemplate);

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
				.find('.save')
					.on('click', function(event) {
						event.preventDefault();

						self.portWizardHelperSavePort($.extend(true, args, {
							success: args.globalCallback
						}));
					});

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

						self.portWizardHelperCancelPort(args);
					});
		},

		portWizardRenderPortNotify: function(args) {
			var self = this,
				container = args.container,
				template = $(self.getTemplate({
					name: 'portNotify',
					data: {
						request: args.data.request
					},
					submodule: 'portWizard'
				}));

			container
				.empty()
				.append(template);

			container
				.find('#email')
					.focus();

			self.portWizardBindPortNotifyEvents(args);
		},

		portWizardBindPortNotifyEvents: function(args) {
			var self = this,
				container = args.container,
				minDate = monster.util.getBusinessDate(4),
				defaultDate = args.data.request.hasOwnProperty('transfer_date') ? monster.util.gregorianToDate(args.data.request.transfer_date) : minDate;

			monster.ui.datepicker(container.find('#transfer_date'), {
				minDate: minDate,
				beforeShowDay: $.datepicker.noWeekends
			}).datepicker('setDate', defaultDate);

			container
				.find('.next')
					.on('click', function(event) {
						event.preventDefault();

						var action = $(this).data('action'),
							formData = monster.ui.getFormData('form_notify');

						$.extend(true, args.data.request, formData, {
							transfer_date: monster.util.dateToGregorian(new Date(formData.transfer_date))
						});

						if (action === 'save') {
							self.portWizardHelperSavePort($.extend(true, args, {
								success: args.globalCallback
							}));
						} else if (action === 'next') {
							self.portWizardRenderSubmitPort(args);
						}
					});

			container
				.find('.cancel')
					.on('click', function(event) {
						event.preventDefault();

						self.portWizardHelperCancelPort(args);
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

						self.portWizardHelperSavePort($.extend(true, args, {
							success: function(requestId) {
								self.portWizardRequestUpdateState({
									data: {
										requestId: requestId,
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

						self.portWizardHelperCancelPort(args);
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

		portWizardHelperSavePort: function(args) {
			var self = this;

			if (args.data.request.hasOwnProperty('id')) {
				self.portWizardHelperUpdatePort(args);
			} else {
				self.portWizardHelperCreatePort(args);
			}
		},

		portWizardHelperCreatePort: function(args) {
			var self = this,
				attachments = _.extend({}, args.data.attachments);

			delete args.data.request.extra;

			self.portWizardRequestCreatePort({
				data: {
					data: args.data.request
				},
				success: function(port) {
					if (!_.isEmpty(attachments)) {
						_.each(attachments, function(attachment, key, object) {
							object[key] = function(callback) {
								self.portWizardRequestCreateAttachment({
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
								args.hasOwnProperty('success') && args.success(port.id);
							}
						});
					} else {
						args.hasOwnProperty('success') && args.success(port.id);
					}
				},
				error: function() {
					args.hasOwnProperty('error') && args.error();
				}
			});
		},

		portWizardHelperUpdatePort: function(args) {
			var self = this,
				attachments = _.extend({}, args.data.attachments);

			delete args.data.request.extra;

			self.portWizardRequestUpdatePort({
				data: {
					data: args.data.request
				},
				success: function(port) {
					if (!_.isEmpty(attachments)) {
						_.each(attachments, function(attachment, key, object) {
							object[key] = function(callback) {
								self.portWizardRequestUpdateAttachment({
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
								args.hasOwnProperty('success') && args.success(port.id);
							}
						});
					} else {
						args.hasOwnProperty('success') && args.success(port.id);
					}
				},
				error: function() {
					args.hasOwnProperty('error') && args.error();
				}
			});
		},

		portWizardHelperCancelPort: function(args) {
			var self = this;

			args.globalCallback();
		},

		/**************************************************
		 *              Requests declarations             *
		 **************************************************/

		// Port requests endpoints
		portWizardRequestCreatePort: function(args) {
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
		portWizardRequestUpdatePort: function(args) {
			var self = this;

			self.callApi({
				resource: 'port.update',
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
		portWizardRequestCreateAttachment: function(args) {
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
		},
		portWizardRequestUpdateAttachment: function(args) {
			var self = this;

			self.callApi({
				resource: 'port.updateAttachment',
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
