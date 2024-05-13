define(function(require) {
	var $ = require('jquery'),
		_ = require('lodash'),
		monster = require('monster');

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

		requests: {
			'myaccount.getAccount': {
				url: 'accounts/{accountId}',
				verb: 'GET'
			},
			'myaccount.braintree.putAchToken': {
				apiRoot: monster.config.api.braintree,
				url: '/accounts/{accountId}/braintree/ach/vault',
				verb: 'PUT',
				generateError: false,
				removeHeaders: [
					'X-Kazoo-Cluster-ID'
				]
			},
			'myaccount.braintree.confirmMicroDeposits': {
				apiRoot: monster.config.api.braintree,
				url: '/accounts/{accountId}/braintree/ach/{verificationId}/confirm',
				verb: 'PUT',
				generateError: false,
				removeHeaders: [
					'X-Kazoo-Cluster-ID'
				]
			},
			'myaccount.braintree.getVerificationStatus': {
				apiRoot: monster.config.api.braintree,
				url: '/accounts/{accountId}/braintree/ach/{verificationId}',
				verb: 'GET',
				generateError: false,
				removeHeaders: [
					'X-Kazoo-Cluster-ID'
				]
			},
			'myaccount.braintree.getAch': {
				apiRoot: monster.config.api.braintree,
				url: '/accounts/{accountId}/braintree/ach',
				verb: 'GET',
				generateError: false,
				removeHeaders: [
					'X-Kazoo-Cluster-ID'
				]
			}
		},

		achRenderSection: function(args) {
			var self = this,
				container = args.container,
				appendTemplate = function appendTemplate() {
					var template = $(self.getTemplate({
							name: 'ach-section',
							submodule: 'ach'
						})),
						$beginVerificationButton = template.find('.begin-verification'),
						enableBeginVerificationButton = function() {
							var isFormValid = _.every(self.appFlags.ach.validAchFormFields);
							$beginVerificationButton.prop('disabled', !isFormValid);
						},
						$achForm = template.find('#form_ach_payment'),
						billingContactData = self.appFlags.billing.billingContactFields,
						firstname = billingContactData['contact.billing.first_name'].value,
						lastname = billingContactData['contact.billing.last_name'].value,
						validateField = function(element) {
							var $element = $(element),
								name = $element.attr('name'),
								isValid = $element.valid(),
								value = isValid ? $element.val() : '';

							template.find('.agreement-' + name).text(value);
							self.appFlags.ach.validAchFormFields[name] = isValid;

							enableBeginVerificationButton();
						};

					//disabe 'Begin Verification' button on render
					$beginVerificationButton.prop('disabled', true);

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
						onfocusout: validateField,
						onkeyup: validateField,
						onclick: validateField,
						autoScrollOnInvalid: true
					});

					// Render ACH Direct Debit form
					monster.pub('monster.requestStart', {});

					self.billingGetAchData(function(usBankAccountErr, clientInstance, usBankAccountInstance, bankData, statusData) {
						monster.pub('monster.requestEnd', {});

						if (usBankAccountErr && _.get(usBankAccountErr, 'code') === 'US_BANK_ACCOUNT_NOT_ENABLED') {
							var $unavailableTemplate = $(self.getTemplate({
								name: 'ach-section-unavailable',
								submodule: 'ach'
							}));

							container
								.removeClass('payment-type-content-hidden')
								.empty()
								.append($unavailableTemplate);

							return;
						}

						if (!_.isEmpty(bankData) && _.get(statusData, 'status') === 'pending') {
							self.achRenderVerificationSection(_.merge({}, args, {
								data: {
									bankData: bankData
								}
							}));

							return;
						}

						if (!_.isEmpty(bankData) && _.get(statusData, 'status') === 'verified') {
							self.achRenderShowBank(_.merge({}, args, {
								data: {
									bankData: bankData
								}
							}));

							return;
						}

						$beginVerificationButton.on('click', function(event) {
							event.preventDefault();

							$beginVerificationButton.prop('disabled', true);
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
								bankDetails.lastName = lastname;
							} else {
								bankDetails.businessName = _.get(args, 'data.account.name');
							}

							usBankAccountInstance.tokenize({
								bankDetails: bankDetails,
								mandateText: mandateText
							}, function(tokenizeErr, tokenizePayload) {
								if (tokenizeErr) {
									monster.ui.toast({
										type: 'error',
										message: self.i18n.active().achDirectDebit.addFailure
									});
								} else {
									monster.ui.toast({
										type: 'success',
										message: self.i18n.active().achDirectDebit.addSuccess
									});
									self.putAchToken({
										data: {
											data: {
												nonce: tokenizePayload.nonce
											}
										},
										success: function(data) {
											self.achRenderSection(args);
										}
									});
								}
							});
						});

						container
							.removeClass('payment-type-content-hidden')
							.empty()
							.append(template);
					});
				};

			appendTemplate();
		},

		achRenderVerificationSection: function(args) {
			var self = this,
				container = args.container,
				data = args.data,
				bankData = data.bankData,
				appendTemplate = function appendTemplate() {
					var template = $(self.getTemplate({
							name: 'ach-section-verification',
							submodule: 'ach',
							data: {
								number: '**** **** **** ' + bankData.account_number_last_4,
								type: _.upperFirst(bankData.account_type),
								name: bankData.bank_name
							}
						})),
						$verifyAccountButton = template.find('#verify_account'),
						$removeAccountButton = template.find('#remove_account'),
						enableVerifyButton = function() {
							var isFormValid = _.every(self.appFlags.ach.validAchVerificationFormFields);
							$verifyAccountButton.prop('disabled', !isFormValid);
						},
						$achForm = template.find('#form_ach_verification'),
						$statusBadge = container.parents('.settings-item-content').find('#myaccount_billing_payment_ach_status'),
						validateField = function(element) {
							var $element = $(element),
								name = $element.attr('name'),
								isValid = $element.valid();

							self.appFlags.ach.validAchVerificationFormFields[name] = isValid;

							enableVerifyButton();
						};

					//set badge status and text
					$statusBadge.addClass('sds_Badge sds_Badge_Yellow');
					$statusBadge.text(self.i18n.active().achDirectDebit.achVerification.status.pending);

					container
						.removeClass('payment-type-content-hidden')
						.empty()
						.append(template);

					//Disable 'Verify' button and set status badge on card
					$verifyAccountButton.prop('disabled', true);

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
						onfocusout: validateField,
						onkeyup: validateField,
						autoScrollOnInvalid: true
					});

					$verifyAccountButton.on('click', function(event) {
						event.preventDefault();

						var verificationAmounts = monster.ui.getFormData('form_ach_verification');

						$verifyAccountButton.prop('disabled', true);
						self.confirmMicroDeposits({
							data: {
								verificationId: _.get(bankData, 'verification_id'),
								data: {
									deposits: [
										Math.floor(verificationAmounts.deposit_amount_1),
										Math.floor(verificationAmounts.deposit_amount_2)
									]
								}
							},
							success: function(data) {
								container.find('.ach-section-error').hide();
								monster.ui.toast({
									type: 'success',
									message: self.getTemplate({
										name: '!' + self.i18n.active().achDirectDebit.verificationSuccess,
										data: {
											variable: _.get(bankData, 'account_number_last_4')
										}
									})
								});

								self.achRenderSection(args);
							},
							error: function(errData) {
								container.find('.ach-section-error').show();
							}
						});
					});

					$removeAccountButton.on('click', function(event) {
						event.preventDefault();

						$removeAccountButton.prop('disabled', true);
						self.deletePaymentMethod({
							data: {
								paymentMethodToken: bankData.payment_method_token
							},
							success: function(data) {
								monster.ui.toast({
									type: 'success',
									message: self.i18n.active().achDirectDebit.removeSuccess
								});

								delete args.data.statusData;
								delete args.data.bankData;
								args.submitCallback && args.submitCallback();
							}
						});
					});
				};

			appendTemplate();
		},

		achRenderShowBank: function(args) {
			var self = this,
				container = args.container,
				data = args.data,
				bankData = data.bankData,
				appendTemplate = function appendTemplate() {
					var template = $(self.getTemplate({
							name: 'show-bank-account',
							submodule: 'ach',
							data: {
								number: '**** **** **** ' + bankData.account_number_last_4,
								type: _.upperFirst(bankData.account_type),
								name: bankData.bank_name
							}
						})),
						$removeAccountButton = template.find('#remove_account'),
						$statusBadge = container.parents('.settings-item-content').find('#myaccount_billing_payment_ach_status');

					//set badge status
					$statusBadge.addClass('sds_Badge sds_Badge_Green');
					$statusBadge.text(self.i18n.active().achDirectDebit.achVerification.status.verified);

					container
						.removeClass('payment-type-content-hidden')
						.empty()
						.append(template);

					$removeAccountButton.on('click', function(event) {
						event.preventDefault();

						$removeAccountButton.prop('disabled', true);
						self.deletePaymentMethod({
							data: {
								paymentMethodToken: bankData.payment_method_token
							},
							success: function(data) {
								monster.ui.toast({
									type: 'success',
									message: self.i18n.active().achDirectDebit.removeSuccess
								});

								delete args.data.statusData;
								delete args.data.bankData;
								args.submitCallback && args.submitCallback();
							}
						});
					});
				};

			appendTemplate();
		},

		/*Braintree ACH functions*/
		putAchToken: function(args) {
			var self = this;

			monster.request({
				resource: 'myaccount.braintree.putAchToken',
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

		confirmMicroDeposits: function(args) {
			var self = this;

			monster.request({
				resource: 'myaccount.braintree.confirmMicroDeposits',
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

		getVerificationStatus: function(args) {
			var self = this;

			monster.request({
				resource: 'myaccount.braintree.getVerificationStatus',
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

		getBraintreeAch: function(args) {
			var self = this;

			monster.request({
				resource: 'myaccount.braintree.getAch',
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
		}
	};

	return ach;
});
