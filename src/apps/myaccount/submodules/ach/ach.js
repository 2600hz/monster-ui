define(function(require) {
	var $ = require('jquery'),
		_ = require('lodash'),
		monster = require('monster'),
		client = require('braintree-client'),
		usBankAccount = require('braintree-us-bank-account');

	var ach = {

		appFlags: {
			ach: {
				validAchFormFields: {
					'account_number': false,
					'routing_number': false,
					'account_type': false,
					'ownership_type': false
				},
				validAchVerificationFormFields: {
					'deposit_amount_1': null,
					'deposit_amount_2': null
				}
			}
		},

		subscribe: {},

		achRenderSection: function(args) {
			var self = this,
				container = args.template,
				data = args.data,
				appendTemplate = function appendTemplate() {
					var template = $(self.getTemplate({
							name: 'ach-section',
							submodule: 'ach'
						})),
						beginVerificationButton = template.find('.begin-verification'),
						enableFormButton = function() {
							if (_.every(self.appFlags.ach.validAchFormFields)) {
								beginVerificationButton.removeClass('disabled');
							} else {
								beginVerificationButton.addClass('disabled');
							}
						},
						$achForm = template.find('#form_ach_payment'),
						billingContactData = self.appFlags.billing.billingContactFields,
						firstname = billingContactData['contact.billing.first_name'].value,
						lastname = billingContactData['contact.billing.last_name'].value;

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
							self.appFlags.ach.validAchFormFields[name] = isValid;

							enableFormButton();
						},
						autoScrollOnInvalid: true
					});

					// Render ACH Direct Debit form
					monster.waterfall([
						_.bind(self.billingCreateBraintreeClientInstance, self),
						function createBankAccountInstance(clientInstance, next) {
							usBankAccount.create({
								client: clientInstance
							}, function(usBankAccountErr, usBankAccountInstance) {
								next(usBankAccountErr, clientInstance, usBankAccountInstance);
							});
						}
					], function(usBankAccountErr, clientInstance, usBankAccountInstance) {
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
										streetAddress: billingContactData['contact.billing.street_address'].value,
										extendedAddress: billingContactData['contact.billing.street_address_extra'].value,
										locality: billingContactData['contact.billing.locality'].value,
										region: billingContactData['contact.billing.region'].value,
										postalCode: billingContactData['contact.billing.postal_code'].value
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
									self.billingRequestUpdateBilling({
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
											self.achRenderVerificationSection(args);
										}
									});
								}
							});
						});
					});
				};

			appendTemplate();
		},

		achRenderVerificationSection: function(args) {
			var self = this,
				container = args.template,
				data = args.data,
				appendTemplate = function appendTemplate() {
					var template = $(self.getTemplate({
							name: 'ach-section-verification',
							submodule: 'ach'
						})),
						verifyButton = template.find('.verify-account'),
						enableVerifyButton = function() {
							if (_.every(self.appFlags.ach.validAchVerificationFormFields)) {
								verifyButton.removeClass('disabled');
							} else {
								verifyButton.addClass('disabled');
							}
						},
						$achForm = template.find('#form_ach_verification'),
						billingContactData = self.appFlags.billing.billingContactFields,
						firstname = billingContactData['contact.billing.first_name'].value,
						lastname = billingContactData['contact.billing.last_name'].value;

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
		}
	};

	return ach;
});
