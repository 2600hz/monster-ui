define(function(require) {
	var $ = require('jquery'),
		_ = require('lodash'),
		moment = require('moment'),
		monster = require('monster');

	var portWizard = {

		// Defines API requests not included in the SDK
		requests: {
		},

		// Define the events available for other apps
		subscribe: {
			'common.portWizard.render': 'portWizardRender'
		},

		appFlags: {
			portWizard: {
				attachments: {
					mimeTypes: [
						'application/pdf'
					],
					maxSize: 8
				},
				knownErrors: {
					addNumbers: {
						number_is_on_a_port_request_already: {},
						number_exists_on_the_system_already: {},
						too_few_properties: {
							'numbers': 'addNumbers.list.title' // 'field_key': 'i18n.path'
						}
					},
					portNotify: {
						wrong_format: {
							'notifications.email.send_to': 'portNotify.email.label'
						}
					}
				}
			}
		},

		/**
		 * Store getter
		 * @param  {Array|String} [path]
		 * @param  {*} [defaultValue]
		 * @return {*}
		 */
		portWizardGet: function(path, defaultValue) {
			var self = this,
				store = ['_store', 'portWizard'];
			return _.get(
				self,
				_.isUndefined(path)
					? store
					: _.flatten([store, _.isString(path) ? path.split('.') : path]),
				defaultValue
			);
		},

		/**
		 * Store setter
		 * @param  {Array|String} [path]
		 * @param  {*} [value]
		 */
		portWizardSet: function(path, value) {
			var self = this,
				hasValue = _.toArray(arguments).length === 2,
				store = ['_store', 'portWizard'];
			_.set(
				self,
				hasValue
					? _.flatten([store, _.isString(path) ? path.split('.') : path])
					: store,
				hasValue ? value : path
			);
		},

		/**
		 * @param  {jQuery} args.container
		 * @param  {String} args.data.accountId
		 * @param  {Function} args.globalCallback
		 * @param  {Object} [args.data.portRequestId]
		 */
		portWizardRender: function(args) {
			var self = this,
				accountId = args.data.accountId,
				container = args.container,
				globalCallback = args.globalCallback,
				portRequestId = _.get(args, 'data.portRequestId');

			self.portWizardSet({
				accountId: accountId,
				container: container,
				globalCallback: globalCallback
			});

			monster.parallel({
				portRequest: function(callback) {
					if (_.isUndefined(portRequestId)) {
						callback(null);
						return;
					}
					self.portWizardRequestGetPort({
						data: {
							portRequestId: portRequestId
						},
						success: function(portRequest) {
							callback(null, portRequest);
						},
						error: function() {
							callback(true);
						}
					});
				}
			}, function(err, result) {
				if (err) {
					globalCallback();
					return;
				}
				var portRequest = _.merge({
					ui_flags: {},
					numbers: {}
				}, _.get(result, 'portRequest', {}));

				self.portWizardSet('attachments', {});
				self.portWizardSet('portRequest', portRequest);

				self.portWizardRenderPortInfo({
					container: self.portWizardGet('container'),
					data: {
						attachments: self.portWizardGet('attachments'),
						request: self.portWizardGet('portRequest')
					}
				});
			});
		},

		/**************************************************
		 *               Templates rendering              *
		 **************************************************/

		/**
		 * @param  {jQuery} args.container
		 * @param  {Object} args.data.attachments
		 * @param  {Object} args.data.request
		 */
		portWizardRenderPortInfo: function(args) {
			var self = this,
				container = args.container,
				attachments = args.data.attachments,
				portRequest = args.data.request,
				initTemplate = function initTemplate() {
					var template = $(self.getTemplate({
						name: 'portInfo',
						data: {
							request: portRequest
						},
						submodule: 'portWizard'
					}));

					self.portWizardBindPortInfoEvents(template, {
						container: container,
						data: {
							attachments: attachments,
							request: portRequest
						}
					});

					return template;
				};

			monster.ui.insertTemplate(container, function(insertTemplateCallback) {
				insertTemplateCallback(initTemplate(), function() {
					container
						.find('#name')
							.focus();
				});
			});
		},

		/**
		 * @param  {jQuery} args.container
		 * @param  {Object} args.data.attachment
		 * @param  {Object} args.data.request
		 */
		portWizardRenderBillUpload: function(args) {
			var self = this,
				container = args.container,
				request = args.data.request,
				initTemplate = function initTemplate() {
					var template = $(self.getTemplate({
						name: 'billUpload',
						data: {
							request: request
						},
						submodule: 'portWizard'
					}));

					self.portWizardRenderBillUploadAccountVerification(template, args);

					self.portWizardBindBillUploadEvents(template, args);

					return template;
				};

			monster.ui.insertTemplate(container, function(insertTemplateCallback) {
				var fileName = 'bill.pdf';

				monster.waterfall([
					function(callback) {
						if (!_.has(request, ['uploads', fileName])) {
							callback(null);
							return;
						}
						self.portWizardRequestGetAttahcment({
							data: {
								portRequestId: request.id,
								documentName: fileName
							},
							success: function(fileData) {
								_.set(args, 'data.attachments.bill', {
									file: fileData,
									name: fileName
								});

								callback(null);
							}
						});
					}
				], function() {
					insertTemplateCallback(initTemplate());
				});
			});
		},

		/*
		 * @param {jQuery} args.container
		 * @param {Object} args.data.attachments
		 * @param {Object} args.data.request
		 */
		portWizardRenderBillUploadAccountVerification: function(parentTemplate, args) {
			var self = this,
				container = parentTemplate.find('#account_verification'),
				attachments = args.data.attachments,
				portRequest = args.data.request,
				initTemplate = function initTemplate() {
					var template = $(self.getTemplate({
						name: 'billUpload-accountVerification',
						data: formatDataToTemplate(portRequest),
						submodule: 'portWizard'
					}));

					monster.ui.renderPDF(attachments.bill.file, template.find('.pdf-container'));

					return template;
				},
				formatDataToTemplate = function formatDataToTemplate(request) {
					return {
						carriers: _.get(monster, 'config.whitelabel.port.carriers'),
						request: request
					};
				};

			if (
				_.has(attachments, 'bill.file')
				&& _.get(portRequest, 'ui_flags.validation', false)
			) {
				monster.ui.insertTemplate(container, function(insertTemplateCallback) {
					insertTemplateCallback(initTemplate(), undefined, function() {
						parentTemplate.find('.actions').show();
					});
				});
			} else {
				container.empty();
				parentTemplate.find('.actions').hide();
			}
		},

		/**
		 * @param {jQuery} args.container
		 * @param {Object} args.data.attachments
		 * @param {Object} args.data.request
		 */
		portWizardRenderAddNumbers: function(args) {
			var self = this,
				container = args.container,
				template = $(self.getTemplate({
					name: 'addNumbers',
					data: {
						text1Var: self.i18n.active().portWizard.portInfo.numbersType.label[args.data.request.ui_flags.type]
					},
					submodule: 'portWizard'
				}));

			monster.ui.renderPDF(args.data.attachments.bill.file, template.find('.pdf-container'));

			container
				.fadeOut(function() {
					container
						.empty()
						.append(template)
						.fadeIn(function() {
							container
								.find('#numbers')
									.focus();
						});

					self.portWizardRenderAddNumbersList(args);
					self.portWizardRenderAddNumbersPortion(args);

					if (!args.data.request.numbers.hasOwnProperty(args.data.request.bill.btn) & !_.isEmpty(args.data.request.numbers)) {
						self.portWizardRenderAddNumbersActions(args);
					}

					self.portWizardBindAddNumbersEvents(args);
				});
		},

		/**
		 * @param {jQuery} args.container
		 * @param {Object} args.data.request
		 */
		portWizardRenderAddNumbersList: function(args) {
			var self = this,
				container = args.container,
				dataToTemplate = _.merge(args.data, {
					request: {
						extra: {
							numbers_count: _.keys(args.data.request.numbers).length
						}
					}
				}),
				template = $(self.getTemplate({
					name: 'addNumbers-list',
					data: dataToTemplate,
					submodule: 'portWizard'
				})),
				$listWrapper = container.find('.list-wrapper');

			if ($listWrapper.is(':empty')) {
				$listWrapper
					.hide()
					.append(template)
					.fadeIn();
			} else {
				$listWrapper
					.empty()
					.append(template);
			}

			if (_.isEmpty(args.data.request.numbers)) {
				delete args.data.request.ui_flags.portion;

				container
					.find('.success-wrapper')
						.fadeOut(function() {
							$(this)
								.empty();
						});
			}

			self.portWizardBindAddNumbersListEvents(args);
		},

		/**
		 * @param {jQuery} args.container
		 * @param {Object} args.data.request
		 */
		portWizardRenderAddNumbersPortion: function(args) {
			var self = this,
				request = args.data.request,
				container = args.container,
				template = $(self.getTemplate({
					name: 'addNumbers-portion',
					submodule: 'portWizard'
				}));

			if (request.numbers.hasOwnProperty(request.bill.btn)) {
				template
					.find('.portion-item[data-portion="' + request.ui_flags.portion + '"]')
						.addClass('active');

				if (request.ui_flags.portion === 'full') {
					self.portWizardRenderAddNumbersActions(args);
				} else if (request.ui_flags.portion === 'partial') {
					self.portWizardRenderAddNumbersBtn(args);
					self.portWizardRenderAddNumbersActions(args);
				}

				container
					.find('.portion-wrapper')
						.fadeOut(function() {
							$(this)
								.empty()
								.append(template)
								.fadeIn();

							self.portWizardBindAddNumbersPortionEvents(args);
						});
			}
		},

		/**
		 * @param {jQuery} args.container
		 * @param {Object} args.data.request
		 */
		portWizardRenderAddNumbersBtn: function(args) {
			var self = this,
				container = args.container,
				dataToTemplate = {
					request: args.data.request
				},
				template = $(self.getTemplate({
					name: 'addNumbers-btn',
					data: dataToTemplate,
					submodule: 'portWizard'
				}));

			container
				.find('.btn-wrapper')
					.empty()
					.append(template)
					.slideDown();
		},

		/**
		 * @param {jQuery} args.container
		 * @param {Object} args.data.request
		 */
		portWizardRenderAddNumbersActions: function(args) {
			var self = this,
				container = args.container,
				formType = self.portWizardGetFormType(args.data.request),
				dataToTemplate = {
					request: args.data.request,
					eSignEnabled: false,
					buttons: {
						manual: self.i18n.active().portWizard.addNumbers.buttons.next.manual[formType],
						electronic: self.i18n.active().portWizard.addNumbers.buttons.next.eSign[formType]
					}
				},
				template = $(self.getTemplate({
					name: 'addNumbers-actions',
					data: dataToTemplate,
					submodule: 'portWizard'
				})),
				$successWrapper = container.find('.success-wrapper');

			if ($successWrapper.is(':empty')) {
				$successWrapper
					.hide()
					.append(template)
					.fadeIn();

				self.portWizardBindAddNumbersActionsEvents(args);
			}
		},

		/**
		 * @param {jQuery} args.container
		 * @param {Object} args.data.request
		 */
		portWizardRenderUploadForm: function(args) {
			var self = this,
				data = args.data,
				request = data.request,
				formType = self.portWizardGetFormType(request),
				initTemplate = function initTemplate() {
					var dataToTemplate = {
							request: request,
							type: self.i18n.active().portWizard.formTypes[formType],
							formLink: monster.config.whitelabel.port[formType]
						},
						template = $(self.getTemplate({
							name: 'uploadForm',
							data: dataToTemplate,
							submodule: 'portWizard'
						})),
						todayJsDate = moment().toDate(),
						defaultJsDate = _.has(args.data.request, 'signing_date')
							? monster.util.gregorianToDate(args.data.request.signing_date)
							: todayJsDate,
						actionsTemplate;

					if (request.hasOwnProperty('uploads') && request.uploads.hasOwnProperty('form.pdf')) {
						actionsTemplate = $(self.getTemplate({
							name: 'uploadForm-actions',
							submodule: 'portWizard'
						}));

						template
							.find('.actions')
								.append(actionsTemplate);
					}

					monster.ui.datepicker(template.find('#signing_date'), {
						maxDate: todayJsDate
					}).datepicker('setDate', defaultJsDate);

					self.portWizardBindUploadFormEvents(template, args);

					return template;
				};

			monster.ui.insertTemplate(args.container, function(insertTemplateCallback) {
				insertTemplateCallback(initTemplate());
			});
		},

		/**
		 * @param {jQuery} args.container
		 * @param {Object} args.data.request
		 */
		portWizardRenderSignForm: function(args) {
			var self = this,
				initTemplate = function initTemplate() {
					var formType = self.portWizardGetFormType(args.data.request),
						dataToTemplate = {
							type: self.i18n.active().portWizard.formTypes[formType]
						},
						template = $(self.getTemplate({
							name: 'signForm',
							data: dataToTemplate,
							submodule: 'portWizard'
						}));

					self.portWizardBindSignFormEvents(template, args);

					return template;
				};

			monster.ui.insertTemplate(args.container, function(insertTemplateCallback) {
				insertTemplateCallback(initTemplate());
			});
		},

		/**
		 * @param {jQuery} args.container
		 * @param {Object} args.data.request
		 */
		portWizardRenderPortNotify: function(args) {
			var self = this,
				container = args.container,
				initTemplate = function initTemplate() {
					var template = $(self.getTemplate({
						name: 'portNotify',
						data: {
							request: args.data.request
						},
						submodule: 'portWizard'
					}));

					self.portWizardBindPortNotifyEvents(template, args);

					return template;
				};

			container.fadeOut(function() {
				monster.ui.insertTemplate(container, function(insertTemplateCallback) {
					insertTemplateCallback(initTemplate(), function() {
						container
							.find('#email')
								.focus();
					});
				});
			});
		},

		/**
		 * @param {jQuery} args.container
		 * @param {Object} args.data.request
		 */
		portWizardRenderSubmitPort: function(args) {
			var self = this,
				initTemplate = function initTemplate() {
					var dataToTemplate = {
							request: args.data.request,
							today: new Date()
						},
						template = $(self.getTemplate({
							name: 'portSubmit',
							data: dataToTemplate,
							submodule: 'portWizard'
						}));

					self.portWizardBindPortSubmitEvents(template, args);

					return template;
				};

			monster.ui.insertTemplate(args.container, function(insertTemplateCallback) {
				insertTemplateCallback(initTemplate());
			});
		},

		/**************************************************
		 *                 Events bindings                *
		 **************************************************/

		/**
		 * @param {jQuery} template
		 * @param {Object} args.data.request
		 * @param {Object} args.data.attachments
		 */
		portWizardBindPortInfoEvents: function(template, args) {
			var self = this,
				$form = template.find('#form_port_info');

			monster.ui.validate($form, {
				rules: {
					name: {
						required: true,
						minlength: 1,
						maxlength: 128
					},
					'ui_flags.type': {
						required: true
					}
				}
			});

			template
				.on('click', '.portInfo-success', function(event) {
					if (!monster.ui.valid($form)) {
						return;
					}
					event.preventDefault();

					_.merge(args.data, {
						request: monster.ui.getFormData('form_port_info')
					});

					self.portWizardRenderBillUpload(args);
				});

			template
				.find('.cancel')
					.on('click', function(event) {
						event.preventDefault();

						self.portWizardHelperCancelPort();
					});
		},

		/**
		 * @param  {jQuery} template
		 * @param  {Object} args.data.attachments
		 * @param  {Object} args.data.request
		 */
		portWizardBindBillUploadEvents: function(template, args) {
			var self = this,
				formValidationRules = {
					'bill.name': {
						required: true,
						minlength: 1,
						maxlength: 128
					},
					'bill.street_number': {
						required: true,
						digits: true,
						minlength: 1,
						maxlength: 8
					},
					'bill.street_address': {
						required: true,
						minlength: 1,
						maxlength: 128
					},
					'bill.street_type': {
						required: true,
						minlength: 1,
						maxlength: 128
					},
					'bill.locality': {
						required: true,
						minlength: 1,
						maxlength: 128
					},
					'bill.region': {
						required: true,
						minlength: 2,
						maxlength: 2
					},
					'bill.postal_code': {
						required: true,
						digits: true,
						minlength: 5,
						maxlength: 5
					},
					'bill.account_number': {
						required: true,
						maxlength: 128
					},
					'bill.pin': {
						maxlength: 6
					},
					'bill.btn': {
						required: true,
						maxlength: 20
					}
				};

			template
				.find('#bill_input')
					.fileUpload({
						btnClass: 'monster-button-primary monster-button-small',
						btnText: self.i18n.active().portWizard.fileUpload.button,
						inputOnly: true,
						inputPlaceholder: self.i18n.active().portWizard.fileUpload.placeholder,
						mimeTypes: self.appFlags.portWizard.attachments.mimeTypes,
						maxSize: self.appFlags.portWizard.attachments.maxSize,
						filesList: _.has(args.data.request, ['uploads', 'bill.pdf'])
							? ['bill.pdf']
							: [],
						success: function(results) {
							_.merge(args.data.attachments, {
								bill: results[0]
							});
							self.portWizardRenderBillUploadAccountVerification(template, args);
						},
						error: function(errorsList) {
							self.portWizardFileUploadErrorsHandler(errorsList);
						}
					});

			template
				.find('#validation')
					.on('change', function(event) {
						event.preventDefault();

						var isChecked = $(this).is(':checked');

						_.set(args.data.request, 'ui_flags.validation', isChecked);

						self.portWizardRenderBillUploadAccountVerification(template, args);
					});

			template
				.find('.next')
					.on('click', function(event) {
						event.preventDefault();

						var $form = template.find('#form_account_verification'),
							formData = monster.ui.getFormData('form_account_verification'),
							btn = formData.bill.btn
								? monster.util.unformatPhoneNumber(monster.util.formatPhoneNumber(formData.bill.btn), 'keepPlus')
								: '';

						monster.ui.validate($form, {
							rules: formValidationRules
						});

						if (monster.ui.valid($form)) {
							_.merge(args.data.request, {
								ui_flags: formData.ui_flags,
								bill: _.assign(formData.bill, {
									btn: btn
								})
							});

							self.portWizardRenderAddNumbers(args);
						}
					});

			template
				.find('.cancel')
					.on('click', function(event) {
						event.preventDefault();

						self.portWizardHelperCancelPort();
					});
		},

		/**
		 * @param {jQuery} args.container
		 * @param {Object} args.data.request
		 */
		portWizardBindAddNumbersEvents: function(args) {
			var self = this,
				container = args.container;

			container
				.find('.collapse')
					.on('click', function(event) {
						event.preventDefault();

						var $this = $(this);

						$this
							.fadeOut(function() {
								container
									.find('.accordion')
										.slideDown();
							});
					});

			container
				.find('.add-numbers')
					.on('click', function(event) {
						event.preventDefault();

						var $form = container.find('#form_add_numbers'),
							formData = monster.ui.getFormData('form_add_numbers'),
							newNumbers = {},
							phoneNumber,
							errors = [];

						monster.ui.validate($form, {
							rules: {
								numbers: {
									required: true
								}
							}
						});

						if (monster.ui.valid($form)) {
							formData.numbers = formData.numbers.replace(/[\n]/g, ' ');
							formData.numbers = formData.numbers.replace(/[-().]/g, '').split(' ');

							_.each(formData.numbers, function(number) {
								phoneNumber = monster.util.getFormatPhoneNumber(number);

								if (phoneNumber.hasOwnProperty('e164Number')) {
									newNumbers[phoneNumber.e164Number] = {};
								} else {
									errors.push(number);
								}
							});

							_.merge(args, {
								data: {
									request: {
										numbers: newNumbers
									}
								}
							});

							$form
								.find('textarea')
									.val('');

							if (_.isEmpty(errors)) {
								container
									.find('.accordion')
										.slideUp(function() {
											container
												.find('.collapse')
													.fadeIn();
										});
							} else {
								monster.ui.toast({
									type: 'warning',
									message: self.getTemplate({
										name: '!' + self.i18n.active().portWizard.toastr.warning.invalidNumbers,
										data: {
											variable: errors.join(', ')
										}
									})
								});
							}

							self.portWizardRenderAddNumbersList(args);
							self.portWizardRenderAddNumbersPortion(args);

							if (args.data.request.numbers.hasOwnProperty(args.data.request.bill.btn)) {
								container
									.find('.success-wrapper')
										.fadeOut(function() {
											$(this)
												.empty();
										});
							} else {
								self.portWizardRenderAddNumbersActions(args);
							}
						}
					});

			container
				.find('.save')
					.on('click', function(event) {
						event.preventDefault();

						var formData = monster.ui.getFormData('form_new_btn'),
							portion = container.find('.portion-item.active').data('portion');

						_.merge(args, {
							data: {
								request: {
									ui_flags: {
										portion: portion
									},
									bill: {
										new_btn: formData.new_btn
									}
								}
							}
						});

						self.portWizardHelperSavePort(args);
					});

			container
				.find('.cancel')
					.on('click', function(event) {
						event.preventDefault();

						self.portWizardHelperCancelPort();
					});
		},

		/**
		 * @param {jQuery} args.container
		 * @param {Object} args.data.request
		 */
		portWizardBindAddNumbersListEvents: function(args) {
			var self = this,
				container = args.container;

			container
				.find('.remove-number')
					.on('click', function(event) {
						event.preventDefault();

						var $this = $(this),
							$item = $this.parents('.item'),
							number = $item.data('number');

						if (args.data.request.bill.btn === number) {
							container
								.find('.portion-wrapper')
									.slideUp(function() {
										$(this)
											.empty();
									});

							container
								.find('.btn-wrapper')
									.slideUp(function() {
										$(this)
											.empty();
									});

							self.portWizardRenderAddNumbersActions(args);
						}

						delete args.data.request.numbers[number];

						self.portWizardRenderAddNumbersList(args);
					});
		},

		/**
		 * @param {jQuery} args.container
		 */
		portWizardBindAddNumbersPortionEvents: function(args) {
			var self = this,
				container = args.container;

			container
				.find('.portion-item')
					.on('click', function(event) {
						event.preventDefault();

						var $this = $(this),
							portion = $this.data('portion');

						if (!$this.hasClass('active')) {
							$this
								.siblings()
									.removeClass('active');

							$this
								.addClass('active');

							if (portion === 'full') {
								container
									.find('.btn-wrapper')
										.slideUp(function() {
											$(this)
												.empty();
										});
							} else {
								self.portWizardRenderAddNumbersBtn(args);
							}

							self.portWizardRenderAddNumbersActions(args);
						}
					});
		},

		/**
		 * @param {jQuery} args.container
		 */
		portWizardBindAddNumbersActionsEvents: function(args) {
			var self = this,
				container = args.container;

			container
				.find('.next')
					.on('click', function(event) {
						event.preventDefault();

						var sign = $(this).data('sign'),
							$form = container.find('#form_new_btn'),
							formData = monster.ui.getFormData('form_new_btn'),
							portion = container.find('.portion-item.active').data('portion');

						monster.ui.validate($form, {
							rules: {
								new_btn: {
									required: true
								}
							}
						});

						if (monster.ui.valid($form)) {
							_.merge(args, {
								data: {
									request: {
										ui_flags: {
											portion: portion
										},
										bill: {
											new_btn: formData.new_btn
										}
									}
								}
							});

							if (sign === 'manual') {
								self.portWizardRenderUploadForm(args);
							} else {
								self.portWizardRenderSignForm(args);
							}
						}
					});
		},

		/**
		 * @param {jQuery} template
		 * @param {Object} args.data.request
		 */
		portWizardBindUploadFormEvents: function(template, args) {
			var self = this,
				$datepicker = template.find('#signing_date'),
				fileUploadOptions = (function(data) {
					var request = data.request,
						options = {
							btnClass: 'monster-button-primary monster-button-small',
							btnText: self.i18n.active().portWizard.fileUpload.button,
							inputOnly: true,
							inputPlaceholder: self.i18n.active().portWizard.fileUpload.placeholder,
							mimeTypes: self.appFlags.portWizard.attachments.mimeTypes,
							maxSize: self.appFlags.portWizard.attachments.maxSize,
							success: function(results) {
								if (request.hasOwnProperty('id')) {
									if (request.hasOwnProperty('uploads') && request.uploads.hasOwnProperty('form.pdf')) {
										self.portWizardRequestUpdateAttachment({
											data: {
												portRequestId: request.id,
												documentName: 'form.pdf',
												data: results[0].file
											}
										});
									} else {
										self.portWizardRequestCreateAttachment({
											data: {
												portRequestId: request.id,
												documentName: 'form.pdf',
												data: results[0].file
											},
											success: function() {
												if (template.find('.uploadForm-success').length < 1) {
													actionsTemplate = $(self.getTemplate({
														name: 'uploadForm-actions',
														submodule: 'portWizard'
													})).css('display', 'none');

													template
														.find('.actions')
															.append(actionsTemplate);

													template
														.find('.uploadForm-success')
															.fadeIn();
												}
											}
										});
									}
								} else {
									_.merge(args.data, {
										attachments: {
											form: results[0]
										}
									});

									if (template.find('.uploadForm-success').length < 1) {
										actionsTemplate = $(self.getTemplate({
											name: 'uploadForm-actions',
											submodule: 'portWizard'
										})).css('display', 'none');

										template
											.find('.actions')
												.append(actionsTemplate);

										template
											.find('.uploadForm-success')
												.fadeIn();
									}
								}
							},
							error: function(errorsList) {
								self.portWizardFileUploadErrorsHandler(errorsList);
							}
						},
						actionsTemplate;

					if (args.data.request.hasOwnProperty('uploads') && args.data.request.uploads.hasOwnProperty('form.pdf')) {
						options.filesList = [ 'form.pdf' ];
					}

					return options;
				})(args.data);

			template
				.find('#form_input')
					.fileUpload(fileUploadOptions);

			template
				.find('.save')
					.on('click', function(event) {
						event.preventDefault();

						var formData = monster.ui.getFormData('form_upload_document'),
							$form = template.find('#form_upload_document');

						monster.ui.validate($form, {
							rules: {
								signee_name: {
									minlength: 1,
									maxlength: 128
								}
							}
						});

						if (monster.ui.valid($form)) {
							_.merge(args.data.request, formData, {
								signing_date: monster.util.dateToGregorian($datepicker.datepicker('getDate'))
							});

							self.portWizardHelperSavePort(args);
						}
					});

			template
				.on('click', '.uploadForm-success', function(event) {
					event.preventDefault();

					var formData = monster.ui.getFormData('form_upload_document'),
						$form = template.find('#form_upload_document');

					monster.ui.validate($form, {
						rules: {
							signee_name: {
								required: true,
								minlength: 1,
								maxlength: 128
							},
							signing_date: {
								required: true
							}
						}
					});

					if (monster.ui.valid($form)) {
						_.merge(args.data.request, formData, {
							signing_date: monster.util.dateToGregorian($datepicker.datepicker('getDate'))
						});
						self.portWizardRenderPortNotify(args);
					}
				});

			template
				.find('.cancel')
					.on('click', function(event) {
						event.preventDefault();

						self.portWizardHelperCancelPort();
					});
		},

		/**
		 * @param {jQuery} template
		 * @param {Object} args
		 */
		portWizardBindSignFormEvents: function(template, args) {
			var self = this;

			template
				.find('.success')
					.on('click', function(event) {
						event.preventDefault();

						self.portWizardRenderPortNotify(args);
					});

			template
				.find('.cancel')
					.on('click', function(event) {
						event.preventDefault();

						self.portWizardHelperCancelPort();
					});
		},

		/**
		 * @param {jQuery} template
		 * @param {Object} args.data.request
		 */
		portWizardBindPortNotifyEvents: function(template, args) {
			var self = this,
				minDate = monster.util.getBusinessDate(4),
				defaultDate = args.data.request.hasOwnProperty('transfer_date') ? monster.util.gregorianToDate(args.data.request.transfer_date) : minDate;

			monster.ui.datepicker(template.find('#transfer_date'), {
				minDate: minDate,
				beforeShowDay: $.datepicker.noWeekends
			}).datepicker('setDate', defaultDate);

			template
				.find('.next')
					.on('click', function(event) {
						event.preventDefault();

						var action = $(this).data('action'),
							formData = monster.ui.getFormData('form_notify');

						_.merge(args.data.request, formData, {
							transfer_date: monster.util.dateToGregorian(new Date(formData.transfer_date))
						});

						if (action === 'save') {
							self.portWizardHelperSavePort(args);
						} else if (action === 'next') {
							self.portWizardRenderSubmitPort(args);
						}
					});

			template
				.find('.cancel')
					.on('click', function(event) {
						event.preventDefault();

						self.portWizardHelperCancelPort();
					});
		},

		/**
		 * @param {jQuery} template
		 * @param {Object} args
		 */
		portWizardBindPortSubmitEvents: function(template, args) {
			var self = this,
				globalCallback = self.portWizardGet('globalCallback');

			template
				.find('.conditions')
					.on('change', function(event) {
						event.preventDefault();

						var formData = monster.ui.getFormData('form_conditions'),
							disabled = formData.conditions.indexOf(false) > -1;

						template
							.find('.success')
								.prop('disabled', disabled);
					});

			template
				.find('#save')
					.on('click', function(event) {
						event.preventDefault();

						self.portWizardHelperSavePort(args);
					});

			template
				.find('.success')
					.on('click', function(event) {
						event.preventDefault();

						self.portWizardHelperSavePort(_.merge({}, args, {
							stopErrorPropagation: true,
							success: function(requestId) {
								self.portWizardRequestUpdateState({
									data: {
										portRequestId: requestId,
										state: 'submitted'
									},
									success: function() {
										globalCallback();
									}
								});
							}
						}));
					});

			template
				.find('.cancel')
					.on('click', function(event) {
						event.preventDefault();

						self.portWizardHelperCancelPort();
					});
		},

		/**************************************************
		 *              Data handling helpers             *
		 **************************************************/

		/**
		 * @param {Object} portData
		 */
		portWizardGetFormType: function(portData) {
			return portData.ui_flags.type === 'local' ? 'loa' : 'resporg';
		},

		/*
		 * @param {Object} errorsList
		 */
		portWizardFileUploadErrorsHandler: function(errorsList) {
			var self = this;

			_.each(errorsList, function(files, type) {
				_.each(files, function(file) {
					if (type === 'mimeTypes') {
						monster.ui.toast({
							type: 'warning',
							message: self.getTemplate({
								name: '!' + self.i18n.active().portWizard.toastr.warning.mimeTypes,
								data: {
									variable: _
										.chain(self.appFlags.portWizard.attachments.mimeTypes)
										.map(function(value) {
											return /[^/]*$/
												.exec(value)[0]
												.toUpperCase();
										})
										.join(', ')
										.value()
								}
							})
						});
					} else if (type === 'size') {
						monster.ui.toast({
							type: 'warning',
							message: self.getTemplate({
								name: '!' + self.i18n.active().portWizard.toastr.warning.size,
								data: {
									variable: self.appFlags.portWizard.attachments.maxSize
								}
							})
						});
					}
				});
			});
		},

		/**
		 * @param  {Function} [args.success]
		 * @param  {Function} [args.error]
		 * @param  {Object} args.data.request
		 * @param  {Boolean} [args.stopErrorPropagation]
		 */
		portWizardHelperSavePort: function(args) {
			var self = this,
				container = self.portWizardGet('container'),
				globalCallback = self.portWizardGet('globalCallback'),
				stopErrorPropagation = _.get(args, 'stopErrorPropagation', false),
				method = _.has(args, 'data.request.id')
					? 'portWizardHelperUpdatePort'
					: 'portWizardHelperCreatePort';

			monster.ui.insertTemplate(container, function() {
				self[method](_.merge({}, args, {
					success: _.isFunction(args.success)
						? args.success
						: globalCallback,
					error: function(parsedError, groupedErrors) {
						var processedErrors = self.portWizardProcessKnownErrors(groupedErrors);

						if (processedErrors.failedWizardStep === 'addNumbers') {
							self.portWizardRenderAddNumbers(args);
						} else if (processedErrors.failedWizardStep === 'portNotify') {
							self.portWizardRenderPortNotify(args);
						}

						self.portWizardShowErrors(processedErrors);

						if (!stopErrorPropagation && _.isFunction(args.error)) {
							args.error(parsedError);
						}
					}
				}));
			}, {
				cssId: 'port_wizard',
				title: self.i18n.active().portWizard.loading.title,
				text: self.i18n.active().portWizard.loading.text
			});
		},

		/**
		 * @param {Function} args.success
		 * @param {Function} args.error
		 * @param {Object} args.data.attachments
		 * @param {Object} args.data.request
		 */
		portWizardHelperCreatePort: function(args) {
			var self = this,
				attachments = args.data.attachments;

			monster.waterfall([
				function(callback) {
					self.portWizardRequestCreatePort({
						data: {
							data: args.data.request
						},
						success: function(portRequest) {
							callback(null, portRequest);
						},
						error: function(parsedError, error) {
							callback({
								parsedError: parsedError,
								error: error
							});
						}
					});
				},
				function(portRequest, callback) {
					if (_.isEmpty(attachments)) {
						callback(null, portRequest);
						return;
					}
					monster.series(_.map(attachments, function(attachment, file) {
						return function(seriesCallback) {
							self.portWizardRequestCreateAttachment({
								data: {
									portRequestId: portRequest.id,
									documentName: file + '.pdf',
									data: attachment.file
								},
								success: function() {
									seriesCallback(null);
								},
								error: function() {
									seriesCallback(true);
								}
							});
						};
					}), function(err, results) {
						if (err) {
							callback({});
							return;
						}
						callback(null, portRequest.id);
					});
				}
			], function(err, portRequestId) {
				if (!_.isNull(err)) {
					args.error(err.parsedError, err.error);
					return;
				}
				args.success(portRequestId);
			});
		},

		/**
		 * @param {Function} args.success
		 * @param {Function} args.error
		 * @param {Object} args.data.attachments
		 * @param {Object} args.data.request
		 */
		portWizardHelperUpdatePort: function(args) {
			var self = this,
				attachments = args.data.attachments,
				portRequest = args.data.request;

			monster.series([
				function(callback) {
					self.portWizardRequestUpdatePort({
						data: {
							data: portRequest
						},
						success: function() {
							callback(null);
						},
						error: function(parsedError, error) {
							callback({
								parsedError: parsedError,
								error: error
							});
						}
					});
				},
				function(callback) {
					if (_.isEmpty(attachments)) {
						callback(null);
						return;
					}
					monster.series(_.map(attachments, function(attachment, type) {
						var fileName = type + '.pdf',
							method = _.has(portRequest, ['uploads', fileName])
								? 'portWizardRequestUpdateAttachment'
								: 'portWizardRequestCreateAttachment';

						return function(seriesCallback) {
							self[method]({
								data: {
									portRequestId: portRequest.id,
									documentName: fileName,
									data: attachment.file
								},
								success: function() {
									seriesCallback(null);
								},
								error: function() {
									seriesCallback({});
								}
							});
						};
					}), callback);
				}
			], function(err) {
				if (!_.isNull(err)) {
					args.error(err.parsedError, err.error);
					return;
				}
				args.success(portRequest.id);
			});
		},

		portWizardHelperCancelPort: function() {
			var self = this,
				globalCallback = self.portWizardGet('globalCallback'),
				portRequestId = self.portWizardGet('portRequest.id');

			monster.waterfall([
				function(callback) {
					if (_.isUndefined(portRequestId)) {
						callback(null);
						return;
					}

					self.portWizardRequestDeletePort({
						data: {
							portRequestId: portRequestId
						},
						success: function() {
							callback(null);
						}
					});
				}
			], function() {
				globalCallback();
			});
		},

		/**************************************************
		 *              Requests declarations             *
		 **************************************************/

		// Port requests endpoints

		/**
		 * @param {Function} args.success
		 * @param {Function} [args.error]
		 * @param {Object} args.data.data
		 */
		portWizardRequestCreatePort: function(args) {
			var self = this;

			self.portWizardRequestSavePort('port.create', args);
		},
		/**
		 * @param  {Function} args.success
		 * @param  {Function} [args.error]
		 */
		portWizardRequestGetPort: function(args) {
			var self = this;

			self.callApi({
				resource: 'port.get',
				data: _.merge({
					accountId: self.portWizardGet('accountId')
				}, args.data),
				success: function(data) {
					args.hasOwnProperty('success') && args.success(data.data);
				},
				error: function(parsedError) {
					args.hasOwnProperty('error') && args.error(parsedError);
				}
			});
		},
		/**
		 * @param {Function} args.success
		 * @param {Function} [args.error]
		 * @param {Object} args.data.data
		 */
		portWizardRequestUpdatePort: function(args) {
			var self = this;

			self.portWizardRequestSavePort('port.update', args);
		},
		portWizardRequestSavePort: function(resource, args) {
			var self = this;

			self.callApi({
				resource: resource,
				data: _.merge({
					accountId: self.portWizardGet('accountId'),
					generateError: false
				}, args.data),
				success: function(data, status) {
					args.hasOwnProperty('success') && args.success(data.data);
				},
				error: function(parsedError, error, globalHandler) {
					var groupedErrors = self.portWizardGroupSavePortErrors(parsedError, error);

					if (groupedErrors) {
						args.hasOwnProperty('error') && args.error(parsedError, groupedErrors);
						return;
					}

					globalHandler(error, {
						generateError: true
					});

					args.hasOwnProperty('error') && args.error(parsedError);
				}
			});
		},
		/**
		 * @param {Function} args.success
		 * @param {Function} [args.error]
		 * @param {String} args.data.portRequestId
		 */
		portWizardRequestDeletePort: function(args) {
			var self = this;

			self.callApi({
				resource: 'port.delete',
				data: _.merge({
					accountId: self.portWizardGet('accountId')
				}, args.data),
				success: function(data, status) {
					args.hasOwnProperty('success') && args.success(data.data);
				},
				error: function(parsedError, error, globalHandler) {
					args.hasOwnProperty('error') && args.error(parsedError);
				}
			});
		},
		/**
		 * @param {Function} args.success
		 * @param {Function} [args.error]
		 * @param {String} args.data.portRequestId
		 * @param {String} args.data.state
		 */
		portWizardRequestUpdateState: function(args) {
			var self = this;

			self.callApi({
				resource: 'port.changeState',
				data: _.merge({
					accountId: self.portWizardGet('accountId'),
					reason: ''
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

		/**
		 * @param {Function} args.success
		 * @param {Function} [args.error]
		 * @param {String} args.data.portRequestId
		 * @param {String} args.data.documentName
		 * @param {String} args.data.data
		 */
		portWizardRequestCreateAttachment: function(args) {
			var self = this;

			self.callApi({
				resource: 'port.createAttachment',
				data: _.merge({
					accountId: self.portWizardGet('accountId')
				}, args.data),
				success: function(data, status) {
					args.hasOwnProperty('success') && args.success(data.data);
				},
				error: function(parsedError, error, globalHandler) {
					args.hasOwnProperty('error') && args.error(parsedError);
				}
			});
		},
		/**
		 * @param {Function} args.success
		 * @param {Function} [args.error]
		 * @param {String} args.data.portRequestId
		 * @param {String} args.data.documentName
		 */
		portWizardRequestGetAttahcment: function(args) {
			var self = this;

			self.callApi({
				resource: 'port.getAttachment',
				data: _.merge({
					accountId: self.portWizardGet('accountId')
				}, args.data),
				success: function(data, status) {
					// `data` is a string representation of the PDF in base 64
					args.hasOwnProperty('success') && args.success(data);
				},
				error: function(parsedError, error, globalHandler) {
					args.hasOwnProperty('error') && args.error(parsedError);
				}
			});
		},
		/**
		 * @param {Function} [args.success]
		 * @param {Function} [args.error]
		 * @param {String} args.data.portRequestId
		 * @param {String} args.data.documentName
		 * @param {Object} args.data.data
		 */
		portWizardRequestUpdateAttachment: function(args) {
			var self = this;

			self.callApi({
				resource: 'port.updateAttachment',
				data: _.merge({
					accountId: self.portWizardGet('accountId')
				}, args.data),
				success: function(data, status) {
					args.hasOwnProperty('success') && args.success(data.data);
				},
				error: function(parsedError, error, globalHandler) {
					args.hasOwnProperty('error') && args.error(parsedError);
				}
			});
		},

		/**************************************************
		 *             Error handling helpers             *
		 **************************************************/

		portWizardGroupSavePortErrors: function(parsedError, errorData) {
			if (errorData.status !== 400) {
				// Errors cannot be processed
				return null;
			}

			var self = this,
				groupedErrors = {},
				errorsI18n = self.i18n.active().portWizard.errors;

			_.each(parsedError.data, function(fieldErrors, fieldKey) {
				var isPhoneNumber = _.startsWith(fieldKey, '+');

				if (typeof fieldErrors === 'string') {
					return;
				}

				_.each(fieldErrors, function(errorData, errorDataKey) {
					var errorKey, errorMessage, errorCause;

					try {
						// Separate error data depending on the case
						if (isPhoneNumber) {
							errorCause = errorData.cause || fieldKey;

							if (errorData.hasOwnProperty('message')) {
								errorKey = self.portWizardGetErrorKey(errorData.message);
							} else {
								errorKey = errorDataKey;
							}

							errorMessage = errorsI18n[errorKey];

							if (!errorMessage) {
								if (errorData.hasOwnProperty('message')) {
									errorMessage
										= _.capitalize(errorData.message) + ': {{variable}}';
								} else {
									errorMessage = errorsI18n.unknown_error;
								}
							}
						} else {
							errorKey = errorDataKey;
							errorCause = fieldKey;

							if (errorsI18n.hasOwnProperty(errorDataKey)) {
								errorMessage = errorsI18n[errorDataKey];
							} else if (typeof errorData === 'string' || typeof errorData === 'number') {
								errorMessage = _.capitalize(errorData + '') + ': {{variable}}';
							} else if (errorData.hasOwnProperty('message')) {
								errorMessage = _.capitalize(errorData.message) + ': {{variable}}';
							}
						}
					} catch (err) {
						// In case of exception, skip error entry
						return false;
					}

					// If error group already exists, add cause
					if (groupedErrors.hasOwnProperty(errorKey)) {
						if (errorCause) {
							groupedErrors[errorKey].causes.push(errorCause);
						}
						return;
					}

					// Else add new error group
					groupedErrors[errorKey] = {
						message: errorMessage,
						causes: errorCause ? [ errorCause ] : []
					};
				});
			});

			return _.isEmpty(groupedErrors) ? null : groupedErrors;
		},

		portWizardGetErrorKey: function(errorMessage) {
			var minIndex = _.chain([':', ';', ',', '.'])
				.map(function(separator) {
					return errorMessage.indexOf(separator);
				}).filter(function(index) {
					return index > 0;
				}).min().value();

			return _.snakeCase(errorMessage.slice(0, minIndex));
		},

		portWizardShowErrors: function(processedErrors) {
			var self = this,
				viewErrors = _.map(processedErrors.errorGroups, function(errorGroup) {
					return {
						message: errorGroup.message,
						causes: _.chain(errorGroup.causes).map(function(cause) {
							if (_.startsWith(cause, '+')) {
								return monster.util.formatPhoneNumber(cause);
							}
							return cause;
						}).join(', ').value()
					};
				});

			if (viewErrors.length !== 1) {
				// If there is not exactly one kind of error, show dialog
				monster.ui.alert('error', self.getTemplate({
					name: 'errorDialog',
					data: {
						errors: viewErrors
					},
					submodule: 'portWizard'
				}));

				return;
			}

			// Else (there is only one kind of error) show toast
			var error = viewErrors[0];

			monster.ui.toast({
				type: 'error',
				message: self.getTemplate({
					name: '!' + error.message,
					data: {
						variable: error.causes
					}
				}),
				options: {
					timeOut: 10000
				}
			});
		},

		portWizardProcessKnownErrors: function(groupedErrors) {
			var self = this,
				knownErrorSteps = self.appFlags.portWizard.knownErrors,
				failedWizardStep = null;

			// Iterate wizard steps for known errors
			_.each(knownErrorSteps, function(knownErrorStep, knownErrorStepKey) {
				// Iterate error causes within known error step
				_.each(knownErrorStep, function(knownErrorCauses, knownErrorKey) {
					// Then check every error group
					_.each(groupedErrors, function(errorGroup, errorGroupKey) {
						// If the error group key does not match a known error key,
						// then continue with the next group
						if (errorGroupKey !== knownErrorKey) {
							return;
						}

						// If there are not known error causes, the cause does not matter and
						// does not need any further processing, so just set the failed step
						if (_.isEmpty(knownErrorCauses)) {
							if (!failedWizardStep) {
								failedWizardStep = knownErrorStepKey;
							}
							return;
						}

						// Else, check error causes and process any translation if possible
						_.each(errorGroup.causes, function(errorGroupCause, i) {
							// If the cause is not known, skip
							if (!knownErrorCauses.hasOwnProperty(errorGroupCause)) {
								return;
							}

							// Set failed step
							if (!failedWizardStep) {
								failedWizardStep = knownErrorStepKey;
							}

							// Try to get translation for cause
							var i18nPath = knownErrorCauses[errorGroupCause];

							if (!i18nPath) {
								return;
							}

							var newCause = _.get(self.i18n.active().portWizard, i18nPath);

							if (!newCause) {
								return;
							}

							errorGroup.causes[i] = '"' + newCause + '"';
						});
					});
				});
			});

			return {
				failedWizardStep: failedWizardStep,
				errorGroups: groupedErrors
			};
		}
	};

	return portWizard;
});
