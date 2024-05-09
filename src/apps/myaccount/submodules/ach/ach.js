define(function(require) {
	var $ = require('jquery'),
		_ = require('lodash'),
		monster = require('monster'),
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

		requests: {
			'myaccount.getAccount': {
				url: 'accounts/{accountId}',
				verb: 'GET'
			},
			'myaccount.braintree.putAchToken': {
				apiRoot: monster.config.whitelabel.achApi,
				url: '/accounts/{accountId}/braintree/ach/vault',
				verb: 'PUT',
				generateError: false,
				removeHeaders: [
					'X-Kazoo-Cluster-ID'
				]
			},
			'myaccount.braintree.deleteAchMethod': {
				apiRoot: monster.config.whitelabel.achApi,
				url: '/accounts/{accountId}/braintree/ach/{paymentMethodToken}',
				verb: 'DELETE',
				generateError: false,
				removeHeaders: [
					'X-Kazoo-Cluster-ID'
				]
			},
			'myaccount.braintree.confirmMicroDeposits': {
				apiRoot: monster.config.whitelabel.achApi,
				url: '/accounts/{accountId}/braintree/ach/{verificationId}/confirm',
				verb: 'PUT',
				generateError: false,
				removeHeaders: [
					'X-Kazoo-Cluster-ID'
				]
			},
			'myaccount.braintree.getVerificationStatus': {
				apiRoot: monster.config.whitelabel.achApi,
				url: '/accounts/{accountId}/braintree/ach/{verificationId}',
				verb: 'GET',
				generateError: false,
				removeHeaders: [
					'X-Kazoo-Cluster-ID'
				]
			},
			'myaccount.braintree.getAch': {
				apiRoot: monster.config.whitelabel.achApi,
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
						lastname = billingContactData['contact.billing.last_name'].value;

					enableBeginVerificationButton();

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

							enableBeginVerificationButton();
						},
						autoScrollOnInvalid: true
					});

					// Render ACH Direct Debit form
					monster.pub('monster.requestStart', {});

					monster.waterfall([
						_.bind(self.billingCreateBraintreeClientInstance, self),
						function createBankAccountInstance(clientInstance, next) {
							usBankAccount.create({
								client: clientInstance
							}, function(usBankAccountErr, usBankAccountInstance) {
								next(usBankAccountErr, clientInstance, usBankAccountInstance);
							});
						},
						function braintreeAch(usBankAccountErr, usBankAccountInstance, next) {
							self.getBraintreeAch({
								success: function(data) {
									next(null, usBankAccountErr, usBankAccountInstance, data);
								}
							});
						}
					], function(usBankAccountErr, clientInstance, usBankAccountInstance, data) {
						monster.pub('monster.requestEnd', {});

						console.log(data);
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

						if (!_.isEmpty(data)) {
							self.achRenderVerificationSection(_.merge({}, args, {
								bankData: _.head(data)
							}));

							return;
						}

						$beginVerificationButton.on('click', function(event) {
							event.preventDefault();

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
								bankDetails.businessName = _.get(data, 'account.name');
							}

							usBankAccountInstance.tokenize({
								bankDetails: bankDetails,
								mandateText: mandateText
							}, function(tokenizeErr, tokenizePayload) {
								if (tokenizeErr) {
									monster.ui.toast({
										type: 'error',
										message: self.i18n.active().achDirectDebit.achSection.toast.error
									});
								} else {
									monster.ui.toast({
										type: 'success',
										message: self.i18n.active().achDirectDebit.achSection.toast.success
									});
									self.putAchToken({
										data: {
											data: {
												nonce: tokenizePayload.nonce
											}
										},
										success: function(data) {
											console.log(data);
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
				bankData = args.bankData,
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
						billingContactData = self.appFlags.billing.billingContactFields,
						firstname = billingContactData['contact.billing.first_name'].value,
						lastname = billingContactData['contact.billing.last_name'].value;

					container
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

							self.appFlags.ach.validAchVerificationFormFields[name] = isValid;

							enableVerifyButton();
						},
						autoScrollOnInvalid: true
					});

					$verifyAccountButton.on('click', function(event) {
						event.preventDefault();
					});

					$removeAccountButton.on('click', function(event) {
						event.preventDefault();

						self.deleteAchMethod({
							data: {
								paymentMethodToken: bankData.payment_method_token
							},
							success: function(data) {
								monster.ui.toast({
									type: 'success',
									message: self.i18n.active().achDirectDebit.achVerification.toast.deletion
								});

								delete args.bankData;
								self.achRenderSection(args);
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

		deleteAchMethod: function(args) {
			var self = this;

			monster.request({
				resource: 'myaccount.braintree.deleteAchMethod',
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
