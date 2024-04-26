define(function(require) {
	var $ = require('jquery'),
		_ = require('lodash'),
		monster = require('monster'),
		client = require('braintree-client'),
		usBankAccount = require('braintree-us-bank-account');

	var billing = {

		appFlags: {
			billingContactFields: {
				'contact.billing.first_name': null,
				'contact.billing.last_name': null,
				'contact.billing.email': null,
				'contact.billing.number': null,
				'contact.billing.street_address': null,
				'contact.billing.street_address_extra': null,
				'contact.billing.locality': null,
				'contact.billing.region': null,
				'contact.billing.country': null,
				'contact.billing.postal_code': null
			},
			validBillingContactFields: {
				'contact.billing.first_name': false,
				'contact.billing.last_name': false,
				'contact.billing.email': false,
				'contact.billing.number': false,
				'contact.billing.street_address': false,
				'contact.billing.locality': false,
				'contact.billing.region': false,
				'contact.billing.country': false,
				'contact.billing.postal_code': false
			},
			validAchFormFields: {
				'account_number': false,
				'routing_number': false,
				'account_type': false,
				'ownership_type': false
			},
			validAchVerificationFormFields: {
				'deposit_amount_1': null,
				'deposit_amount_2': null
			},
			selectedPaymentType: null
		},

		subscribe: {
			'myaccount.billing.renderContent': '_billingRenderContent'
		},

		_billingRenderContent: function(args) {
			var self = this;

			monster.parallel({
				account: function(callback) {
					self.callApi({
						resource: 'account.get',
						data: {
							accountId: self.accountId
						},
						success: function(data, status) {
							callback(null, data.data);
						}
					});
				},
				billing: function(callback) {
					self.callApi({
						resource: 'billing.get',
						data: {
							accountId: self.accountId,
							generateError: false
						},
						success: function(data, status) {
							callback(null, data.data);
						},
						error: function(data, status) {
							/* For some people billing is not via braintree, but we still need to display the tab */
							callback(null, {});
						}
					});
				},
				accountToken: function(callback) {
					self.getAccountToken({
						success: function(data) {
							callback(null, data);
						},
						error: function(data) {
							self.requestUpdateBilling({
								data: {
									data: {
										first_name: 'Test',
										last_name: 'Test'
									}
								},
								success: function(data) {
									self.getAccountToken({
										success: function(data) {
											callback(null, data);
										}
									});
								}
							});
						}
					});
				}
			}, function(err, results) {
				if (err) {
					return;
				}

				self.billingFormatData(results, function(results) {
					var $billingTemplate = $(self.getTemplate({
							name: 'layout',
							data: results,
							submodule: 'billing'
						})),
						$billingContactForm = $billingTemplate.find('#form_billing'),
						$countrySelector = $billingTemplate.find('#billing_contact_country'),
						expiredCardData = _.get(results, 'billing.expired_card');

					// Initialize country selector
					monster.ui.countrySelector(
						$countrySelector,
						{
							selectedValues: results.account.contact.billing.country,
							options: {
								showEmptyOption: false
							}
						}
					);

					// Check if billing contact is filled
					_.each(self.appFlags.validBillingContactFields, function(_value, key) {
						self.appFlags.validBillingContactFields[key] = !_.chain(results.account).get(key).isEmpty().value();

						//set values to cache
						self.appFlags.billingContactFields[key] = _.chain(results.account).get(key).value();
					});
					//set street_address_extra
					self.appFlags.billingContactFields['contact.billing.street_address_extra'] = _.get(results, 'account.contact.billing.street_address_extra', null);

					self.billingEnablePaymentSection($billingTemplate);

					// Set validations
					monster.ui.validate($billingContactForm, {
						ignore: '.chosen-search-input', // Ignore only search input fields in jQuery Chosen controls. Don't ignore hidden fields.
						rules: {
							'contact.billing.first_name': {
								required: true
							},
							'contact.billing.last_name': {
								required: true
							},
							'contact.billing.email': {
								required: true,
								email: true,
								normalizer: function(value) {
									return _.toLower(value);
								}
							},
							'contact.billing.number': {
								phoneNumber: true,
								required: true
							},
							'contact.billing.street_address': {
								required: true
							},
							'contact.billing.locality': {
								required: true
							},
							'contact.billing.region': {
								required: true
							},
							'contact.billing.postal_code': {
								required: true
							},
							'contact.billing.country': {
								required: true
							}
						},
						onfocusout: function(element) {
							var $element = $(element),
								name = $element.attr('name'),
								isValid = $element.valid();

							if (!_.has(self.appFlags.validBillingContactFields, name)) {
								return;
							}

							self.appFlags.validBillingContactFields[name] = isValid;

							self.billingEnablePaymentSection($billingTemplate);
						},
						autoScrollOnInvalid: true
					});

					// Render template
					monster.pub('myaccount.renderSubmodule', $billingTemplate);

					// Bind events
					self.billingBindEvents({
						template: $billingTemplate,
						moduleArgs: args,
						data: results,
						validateCallback: function(callback) {
							var isValid = monster.ui.valid($billingContactForm);

							if (isValid) {
								callback && callback(null);
							}
						},
						updateCallback: function(data, callback) {
							// Add here any steps to do after billing contact update
							callback(null, data);
						}
					});

					// Display credit card section if card is set
					var hasCreditCard = !_.chain(results)
						.get('billing.credit_cards')
						.isEmpty()
						.value(),
						isCardExpired = !_.isEmpty(expiredCardData);

					if (hasCreditCard && !isCardExpired) {
						$billingTemplate
							.find('#myaccount_billing_payment_card')
							.prop('checked', true);

						// TODO: Remove duplicated code with #myaccount_billing_payment_card change event
						var $paymentTypeContent = $billingTemplate.find('[data-payment-type="card"]');
						$paymentTypeContent.removeClass('payment-type-content-hidden');

						self.creditCardRender({
							container: $billingTemplate.find('.payment-type-content[data-payment-type="card"]'),
							authorization: _.get(results, 'accountToken.client_token'),
							expiredCardData: expiredCardData,
							cards: _.get(results, 'billing.credit_cards'),
							callback: function() {
								monster.pub('myaccount.billing.renderContent', args);
							}
						});
					} else if (isCardExpired) {
						var $paymentTypeContent = $billingTemplate.find('[data-payment-type="card-expired"]');
						$paymentTypeContent.removeClass('payment-type-content-hidden');
					}

					if (typeof args.callback === 'function') {
						args.callback($billingTemplate);
					}
				});
			});
		},

		renderAchSection: function(args) {
			var self = this,
				container = args.template,
				data = args.data,
				appendTemplate = function appendTemplate() {
					var template = $(self.getTemplate({
							name: 'ach-section',
							submodule: 'billing'
						})),
						beginVerificationButton = template.find('.begin-verification'),
						enableFormButton = function() {
							if (_.every(self.appFlags.validAchFormFields)) {
								beginVerificationButton.removeClass('disabled');
							} else {
								beginVerificationButton.addClass('disabled');
							}
						},
						$achForm = template.find('#form_ach_payment'),
						billingContactData = self.appFlags.billingContactFields,
						firstname = billingContactData['contact.billing.first_name'],
						lastname = billingContactData['contact.billing.last_name'];

					container
						.find('div[data-payment-type="ach"]')
						.removeClass('payment-type-content-hidden')
						.empty()
						.append(template);

					enableFormButton();

					//Set agreement name
					template.find('.agreement-name').text(firstname + ' ' + lastname);

					//Set validations for form
					monster.ui.validate($achForm, {
						rules: {
							'account_number': {
								required: true,
								digits: true
							},
							'routing_number': {
								required: true,
								digits: true
							},
							'ownership_type': {
								required: true
							},
							'account_type': {
								required: true
							}
						},
						onfocusout: function(element) {
							var $element = $(element),
								name = $element.attr('name'),
								isValid = $element.valid(),
								value = isValid ? $element.val() : '';

							template.find('.agreement-' + name).text(value);
							self.appFlags.validAchFormFields[name] = isValid;

							enableFormButton();
						},
						autoScrollOnInvalid: true
					});
					// Render ACH Direct Debit form
					client.create({
						authorization: _.get(data, 'accountToken.client_token')
					}, function(clientErr, clientInstance) {
						usBankAccount.create({
							client: clientInstance
						}, function(usBankAccountErr, usBankAccountInstance) {
							if (usBankAccountErr && _.get(usBankAccountErr, 'code') === 'US_BANK_ACCOUNT_NOT_ENABLED') {
								monster.ui.alert('warning', self.i18n.active().billing.achSection.bankNotEnabled);
								//hide section and uncheck option
								container.find('.payment-type-content').addClass('payment-type-content-hidden');
								container.find('#myaccount_billing_payment_ach').prop('checked', false);
							}

							beginVerificationButton.on('click', function(event) {
								event.preventDefault();

								if (beginVerificationButton.hasClass('disabled')) {
									return;
								}
								var achDebitData = monster.ui.getFormData('form_ach_payment'),
									mandateText = template.find('.agreement1').text() + ' ' + template.find('.agreement2').text(),
									bankDetails = {
										accountNumber: achDebitData.account_number,
										routingNumber: achDebitData.routing_number,
										accountType: achDebitData.account_type,
										ownershipType: achDebitData.ownership_type,
										billingAddress: {
											streetAddress: billingContactData['contact.billing.street_address'],
											extendedAddress: billingContactData['contact.billing.street_address_extra'],
											locality: billingContactData['contact.billing.locality'],
											region: billingContactData['contact.billing.region'],
											postalCode: billingContactData['contact.billing.postal_code']
										}
									};

								if (bankDetails.ownershipType === 'personal') {
									bankDetails.firstName = firstname;
									bankDetails.lastname = lastname;
								} else {
									bankDetails.businessName = _.get(data, 'account.name');
								}

								usBankAccountInstance.tokenize({
									bankDetails: bankDetails,
									mandateText: mandateText
								}, function(tokenizeErr, tokenizePayload) {
									if (tokenizeErr) {
										monster.ui.toast({
											type: 'error',
											message: self.i18n.active().billing.achSection.toastr.error
										});
									} else {
										monster.ui.toast({
											type: 'success',
											message: self.i18n.active().billing.achSection.toastr.success
										});
										self.requestUpdateBilling({
											data: {
												data: {
													nonce: tokenizePayload.nonce
												}
											},
											success: function(data) {
												//SEND TO MICRO TRANSFER VIEW
												var statusSection = container.find('.verification-status');
												statusSection.text(self.i18n.active().billing.achVerification.status.pending);
												statusSection.addClass('sds_Badge_Yellow');
												self.renderAchVerificationSection(args);
											}
										});
									}
								});
							});
						});
					});
				};

			appendTemplate();
		},

		renderAchVerificationSection: function(args) {
			var self = this,
				container = args.template,
				data = args.data,
				appendTemplate = function appendTemplate() {
					var template = $(self.getTemplate({
							name: 'ach-section-verification',
							submodule: 'billing'
						})),
						verifyButton =  template.find('.verify-account'),
						enableVerifyButton = function() {
							if (_.every(self.appFlags.validAchVerificationFormFields)) {
								verifyButton.removeClass('disabled');
							} else {
								verifyButton.addClass('disabled');
							}
						},
						$achForm = template.find('#form_ach_verification'),
						billingContactData = self.appFlags.billingContactFields,
						firstname = billingContactData['contact.billing.first_name'],
						lastname = billingContactData['contact.billing.last_name'];

					container
						.find('div[data-payment-type="ach"]')
						.removeClass('payment-type-content-hidden')
						.empty()
						.append(template);

					enableVerifyButton();

					//Set validations for form
					monster.ui.validate($achForm, {
						rules: {
							'deposit_amount_1': {
								required: true
							},
							'deposit_amount_2': {
								required: true
							}
						},
						onfocusout: function(element) {
							var $element = $(element),
								name = $element.attr('name'),
								isValid = $element.valid();

							self.appFlags.validAchVerificationFormFields[name] = isValid;

							enableVerifyButton();
						},
						autoScrollOnInvalid: true
					});

					verifyButton.on('click', function(event) {
						event.preventDefault();
					});
				};
			appendTemplate();

		},

		billingEnablePaymentSection: function($billingTemplate) {
			var self = this,
				paymentType = self.appFlags.selectedPaymentType,
				country = self.appFlags.billingContactFields['contact.billing.country'];

			if (_.every(self.appFlags.validBillingContactFields)) {
				$billingTemplate
					.find('.payment-type-selection-item')
						.removeClass('sds_SelectionList_Item_Disabled');
				$billingTemplate.find('.payment-type-warning').hide();
				$billingTemplate.find('div[data-payment-type="' + paymentType + '"]').removeClass('payment-type-content-hidden');
			} else {
				$billingTemplate
					.find('.payment-type-selection-item')
						.addClass('sds_SelectionList_Item_Disabled');
				$billingTemplate.find('.payment-type-warning').show();
				$billingTemplate.find('.payment-type-content').addClass('payment-type-content-hidden');
			}

			//disable ACH Direct Debit if country is not US
			if (['US', 'United States'].indexOf(country) < 0) {
				$billingTemplate
					.find('#myaccount_billing_payment_ach')
					.parents('.payment-type-selection-item')
					.addClass('sds_SelectionList_Item_Disabled');
			}
		},

		billingFormatData: function(data, callback) {
			if (!_.isEmpty(data.billing)) {
				var creditCards = _.get(data, 'billing.credit_cards', {});
				data.billing.credit_card = _.find(creditCards, { 'default': true }) || {};
				data.billing.expired_card = _.find(creditCards, { 'default': true, 'expired': true }) || {};

				/* If There is a credit card stored, we fill the fields with * */
				if (data.billing.credit_card.last_four) {
					var cardType = data.billing.credit_card.card_type.toLowerCase();

					data.billing.credit_card.fake_number = '************' + data.billing.credit_card.last_four;
					data.billing.credit_card.fake_cvv = '***';
					data.billing.credit_card.type = cardType === 'american express'
						? 'amex'
						: cardType;
				}
			}

			if (_.has(data.account, 'contact.billing.name')) {
				// Split names by first space
				var names = data.account.contact.billing.name.replace(/\s+/, '\x01').split('\x01');
				delete data.account.contact.billing.name;
				data.account.contact.billing.firstName = names[0];
				data.account.contact.billing.lastName = names[1] || '';
			}

			callback(data);
		},

		billingBindEvents: function(args) {
			var self = this,
				$template = args.template,
				data = args.data,
				moduleArgs = args.moduleArgs,
				$countrySelector = $template.find('#billing_contact_country'),
				$paymentMethodRadioGroup = $template.find('input[type="radio"][name="payment_method"]'),
				creditCardData = _.get(data, 'billing.credit_card'),
				expiredCardData = _.get(data, 'billing.expired_card');

			if (_.isEmpty(creditCardData)) {
				$template.find('.save-card').addClass('show');
			}

			if (!_.isEmpty(expiredCardData)) {
				$template.find('.card-expired').show();
				$template.find('.save-card').addClass('show');
			}

			$template.on('click', '.braintree-toggle', function(e) {
				e.preventDefault();

				$template.find('.save-card').addClass('show');
			});

			$template.on('click', '.braintree-method', function(e) {
				e.preventDefault();

				$template.find('.save-card').removeClass('show');
			});

			//Refreshing the card info when opening the settings-item
			$template.find('.settings-item[data-name="credit_card"] .settings-link').on('click', function() {
				var settingsItem = $(this).parents('.settings-item');
				if (!settingsItem.hasClass('open')) {
					settingsItem.find('input').keyup();
				}
			});

			// Select paymet method option
			var $paymentContent = $template.find('.payment-content');
			$paymentMethodRadioGroup.change(function() {
				var $paymentTypeContent = $paymentContent.find('[data-payment-type="' + this.value + '"]');
				$paymentTypeContent.removeClass('payment-type-content-hidden');
				$paymentTypeContent.siblings().addClass('payment-type-content-hidden');

				self.appFlags.selectedPaymentType = this.value;

				if (this.value === 'ach') {
					self.renderAchSection(args);
				} else {
					self.creditCardRender({
						container: $template.find('.payment-type-content[data-payment-type="card"]'),
						authorization: _.get(data, 'accountToken.client_token'),
						expiredCardData: expiredCardData,
						cards: _.get(data, 'billing.credit_cards'),
						callback: function() {
							monster.pub('myaccount.billing.renderContent', moduleArgs);
						}
					});
				}
			});

			$countrySelector.on('change', function() {
				self.appFlags.billingContactFields['contact.billing.country'] = this.value;
				self.billingEnablePaymentSection($template);
			});

			monster.pub('myaccount.events', args);
		},

		requestUpdateBilling: function(args) {
			var self = this;

			self.callApi({
				resource: 'billing.update',
				data: _.merge({
					accountId: self.accountId
				}, args.data),
				success: function(data) {
					args.hasOwnProperty('success') && args.success(data.data);
				},
				error: function(parsedError) {
					args.hasOwnProperty('error') && args.error(parsedError);
				}
			});
		},

		getAccountToken: function(args) {
			var self = this;

			self.callApi({
				resource: 'billing.getToken',
				data: _.merge({
					accountId: self.accountId,
					generateError: false
				}, args.data),
				success: function(data) {
					args.hasOwnProperty('success') && args.success(data.data);
				},
				error: function(parsedError) {
					args.hasOwnProperty('error') && args.error(parsedError);
				}
			});
		}
	};

	return billing;
});
