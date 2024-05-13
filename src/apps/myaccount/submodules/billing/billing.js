define(function(require) {
	var $ = require('jquery'),
		_ = require('lodash'),
		monster = require('monster'),
		braintreeClient = require('braintree-client'),
		usBankAccount = require('braintree-us-bank-account');

	var billing = {

		appFlags: {
			billing: {
				billingContactFields: {
					'contact.billing.first_name': {
						required: true,
						originalValue: null,
						value: null,
						valid: null,
						changed: false
					},
					'contact.billing.last_name': {
						required: true,
						originalValue: null,
						value: null,
						valid: null,
						changed: false
					},
					'contact.billing.email': {
						required: true,
						originalValue: null,
						value: null,
						valid: null,
						changed: false
					},
					'contact.billing.number': {
						required: true,
						originalValue: null,
						value: null,
						valid: null,
						changed: false
					},
					'contact.billing.street_address': {
						required: true,
						originalValue: null,
						value: null,
						valid: null,
						changed: false
					},
					'contact.billing.street_address_extra': {
						required: false,
						originalValue: null,
						value: null,
						valid: true,
						changed: false
					},
					'contact.billing.locality': {
						required: true,
						originalValue: null,
						value: null,
						valid: null,
						changed: false
					},
					'contact.billing.region': {
						required: true,
						originalValue: null,
						value: null,
						valid: null,
						changed: false
					},
					'contact.billing.country': {
						required: true,
						originalValue: null,
						value: null,
						valid: null,
						changed: false
					},
					'contact.billing.postal_code': {
						required: true,
						originalValue: null,
						value: null,
						valid: null,
						changed: false
					}
				},
				selectedPaymentType: 'none',
				defaultPaymentType: '',
				braintreeClientToken: null,
				braintreeClientInstance: null,
				usSurcharges: [
					{
						value: '2.7',
						states: [
							'AK',
							'AL',
							'AR',
							'AZ',
							'CA',
							//'CO',
							//'CT',
							'DE',
							'FL',
							'GA',
							'HI',
							'IA',
							'ID',
							'IL',
							'IN',
							'KS',
							'KY',
							'LA',
							//'MA',
							'MD',
							//'ME',
							'MI',
							'MN',
							'MO',
							'MS',
							'MT',
							'NC',
							'ND',
							'NE',
							'NH',
							'NJ',
							'NM',
							'NV',
							//'NY',
							'OH',
							'OK',
							'OR',
							'PA',
							'RI',
							'SC',
							'SD',
							'TN',
							'TX',
							'UT',
							'VA',
							'VT',
							'WA',
							'WI',
							'WV',
							'WY'
						]
					},
					{
						value: '2',
						states: ['CO']
					}
				]
			}
		},

		subscribe: {
			'myaccount.billing.renderContent': '_billingRenderContent'
		},

		requests: {
			'myaccount.braintree.getPaymentMethods': {
				apiRoot: monster.config.api.braintree,
				url: '/accounts/{accountId}/braintree/payment_methods',
				verb: 'GET',
				generateError: false,
				removeHeaders: [
					'X-Kazoo-Cluster-ID'
				]
			},
			'myaccount.braintree.setDefaultPaymentMethod': {
				apiRoot: monster.config.api.braintree,
				url: '/accounts/{accountId}/braintree/payment_methods/{paymentMethodToken}/default',
				verb: 'POST',
				generateError: false,
				removeHeaders: [
					'X-Kazoo-Cluster-ID'
				]
			},
			'myaccount.braintree.deletePaymentMethod': {
				apiRoot: monster.config.api.braintree,
				url: '/accounts/{accountId}/braintree/payment_methods/{paymentMethodToken}',
				verb: 'DELETE',
				generateError: false,
				removeHeaders: [
					'X-Kazoo-Cluster-ID'
				]
			}
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
				payment: function(callback) {
					self.billingGetAccountToken({
						success: function(data) {
							self.getPaymentMethods({
								success: function(paymentData) {
									callback(null, {data, paymentData});
								}, error: function(data) {
									callback(null, {});
								}
							});
						},
						error: function(data) {
							callback(null, {
								'accountToken': {
									'client_token': null
								}
							});
						}
					});
				}
			}, function(err, results) {
				if (err) {
					return;
				}

				if (!_.isEmpty(results.payment.paymentData)) {
					var payments = _.get(results, 'payment.paymentData'),
						isAchDefault = _.find(payments, { 'default': true, 'verified': true }),
						isCreditDefault = _.find(payments, { 'default': true, 'expired': false });

					if (isAchDefault || isCreditDefault) {
						self.appFlags.billing.defaultPaymentType = isAchDefault ? 'ach' : 'credit';
					}
				}

				self.appFlags.billing.braintreeClientToken = _.get(results, 'payment.data.client_token');

				self.billingFormatData(results, function(results) {
					var $billingTemplate = $(self.getTemplate({
							name: 'layout',
							data: results,
							submodule: 'billing'
						})),
						$billingContactForm = $billingTemplate.find('#form_billing'),
						$countrySelector = $billingTemplate.find('#billing_contact_country'),
						$stateSelector = $billingTemplate.find('#billing_contact_state_select'),
						expiredCardData = _.get(results, 'billing.expired_card'),
						shouldBeRequired = function() {
							return self.appFlags.billing.selectedPaymentType !== 'none';
						},
						validateField = function(element) {
							var $element = $(element),
								name = $element.attr('name'),
								isValid = $element.valid(),
								field = self.appFlags.billing.billingContactFields[name],
								value = _.trim($element.val()),
								isEmpty = _.isEmpty(value);

							field.valid = isValid && (!field.required || !isEmpty);
							field.value = value;
							field.changed = (field.value !== field.originalValue);

							if (self.appFlags.billing.braintreeClientToken) {
								self.billingEnableSubmitButton($billingTemplate);
								self.billingEnablePaymentSection($billingTemplate);
							}
						},
						defaultPaymentType = self.appFlags.billing.defaultPaymentType;

					// Initialize country selector
					monster.ui.countrySelector(
						$countrySelector,
						{
							selectedValues: _.get(results, 'account.contact.billing.country'),
							options: {
								showEmptyOption: false
							}
						}
					);

					// Initialize state selector
					monster.ui.stateSelector(
						$stateSelector,
						{
							selectedValues: _.get(results, 'account.contact.billing.region'),
							options: {
								showEmptyOption: false
							}
						}
					);

					// Check if billing contact is valid
					_.each(self.appFlags.billing.billingContactFields, function(data, key) {
						var field = self.appFlags.billing.billingContactFields[key];
						field.valid = !field.required || !_.chain(results.account).get(key).isEmpty().value();
						field.value = _.chain(results.account).get(key).trim().value();
						field.originalValue = field.value;
					});

					if (self.appFlags.billing.braintreeClientToken) {
						// Enable/display sections accordingly
						self.billingEnablePaymentSection($billingTemplate);
						self.billingDisplayStateSelector({
							template: $billingTemplate,
							countryCode: _.get(results, 'account.contact.billing.country')
						});
					}

					// Set validations
					monster.ui.validate($billingContactForm, {
						ignore: '.chosen-search-input', // Ignore only search input fields in jQuery Chosen controls. Don't ignore hidden fields.
						rules: {
							'contact.billing.first_name': {
								required: shouldBeRequired
							},
							'contact.billing.last_name': {
								required: shouldBeRequired
							},
							'contact.billing.email': {
								required: shouldBeRequired,
								email: true,
								normalizer: function(value) {
									return _.toLower(value);
								}
							},
							'contact.billing.number': {
								phoneNumber: true,
								required: shouldBeRequired
							},
							'contact.billing.street_address': {
								required: shouldBeRequired
							},
							'contact.billing.locality': {
								required: shouldBeRequired
							},
							'contact.billing.region': {
								required: shouldBeRequired
							},
							'contact.billing.postal_code': {
								required: shouldBeRequired
							},
							'contact.billing.country': {
								required: shouldBeRequired
							}
						},
						onfocusout: validateField,
						onkeyup: validateField,
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

					if (self.appFlags.billing.braintreeClientToken) {
						//Display ACH section if it's set and in pending or verified state
						self.billingUpdateAchDirectDebitStatus({
							template: $billingTemplate
						});

						// Display error if default payment is credit card and it's expiered
						var isCardExpired = !_.isEmpty(expiredCardData);

						if (isCardExpired) {
							var $paymentTypeContent = $billingTemplate.find('[data-payment-type="card-expired"]');
							$paymentTypeContent.removeClass('payment-type-content-hidden');
						}

						if (typeof args.callback === 'function') {
							args.callback($billingTemplate);
						}
					}

					//select default payment
					var className = '#myaccount_billing_payment_' + defaultPaymentType;
					$billingTemplate
						.find(className)
							.prop('checked', true);

					if (defaultPaymentType === 'ach') {
						self.achRenderSection({
							data: results,
							container: $template.find('div[data-payment-type="ach"]'),
							submitCallback: function() {
								monster.pub('myaccount.billing.renderContent', moduleArgs);
							}
						});	
					} else if (defaultPaymentType === 'credit') {
						self.creditCardRender({
							container: $billingTemplate.find('.payment-type-content[data-payment-type="card"]'),
							authorization: _.get(results, 'accountToken.client_token'),
							expiredCardData: expiredCardData,
							cards: _.get(results, 'billing.credit_cards'),
							surcharge: self.billingGetSurcharge(
								_.get(results, 'account.contact.billing.country'),
								_.get(results, 'account.contact.billing.region')
							),
							submitCallback: function() {
								monster.pub('myaccount.billing.renderContent', args);
							}
						});
					}
				});
			});
		},

		billingEnablePaymentSection: function($billingTemplate) {
			var self = this,
				paymentType = self.appFlags.billing.selectedPaymentType,
				country = self.appFlags.billing.billingContactFields['contact.billing.country'].value,
				isContactValid = _.every(self.appFlags.billing.billingContactFields, 'valid');

			console.log(paymentType);
			console.log(self.appFlags);
			if (isContactValid) {
				$billingTemplate
					.find('.payment-type-selection-item')
						.removeClass('sds_SelectionList_Item_Disabled');
				$billingTemplate.find('.payment-type-warning').hide();
			} else {
				$billingTemplate
					.find('.payment-type-selection-item')
						.addClass('sds_SelectionList_Item_Disabled');
				$billingTemplate.find('.payment-type-warning').show();
			}

			if (paymentType === 'none') {
				if (isContactValid) {
					$billingTemplate.find('div[data-payment-type="' + paymentType + '"]').removeClass('payment-type-content-hidden');
				} else {
					$billingTemplate.find('.payment-type-content').addClass('payment-type-content-hidden');
				}
			} else {
				$billingTemplate.find('.disable-overlay')[isContactValid ? 'hide' : 'show']();
			}

			// Disable ACH Direct Debit if country is not US
			if (['US', 'United States'].indexOf(country) < 0) {
				$billingTemplate
					.find('#myaccount_billing_payment_ach')
					.parents('.payment-type-selection-item')
					.addClass('sds_SelectionList_Item_Disabled');
			}
		},

		billingFormatData:function(data, callback) {
			if (!_.isEmpty(data.billing)) {
				var creditCards = _.get(data, 'billing.credit_cards', {});
				data.billing.expired_card = _.find(creditCards, { 'default': true, 'expired': true }) || {};
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
				$contactForm = $template.find('#form_billing'),
				$countrySelector = $template.find('#billing_contact_country'),
				$stateInput = $template.find('#billing_contact_state'),
				$stateSelector = $template.find('#billing_contact_state_select'),
				$paymentContent = $template.find('.payment-content'),
				$paymentMethodRadioGroup = $template.find('input[type="radio"][name="payment_method"]'),
				expiredCardData = _.get(data, 'billing.expired_card'),
				paymentTypeChange = function(value) {
					var $paymentTypeContent = $paymentContent.find('[data-payment-type="' + value + '"]'),
						countryCode = self.appFlags.billing.billingContactFields['contact.billing.country'].value,
						regionCode = self.appFlags.billing.billingContactFields['contact.billing.region'].value;

					$paymentTypeContent.removeClass('payment-type-content-hidden');
					$paymentContent.find('.payment-type-content:not([data-payment-type="' + value + '"])')
						.addClass('payment-type-content-hidden');

					self.appFlags.billing.selectedPaymentType = value;

					monster.ui.valid($contactForm);

					if (_.isEmpty(value)) {
						return;
					}

					if (self.appFlags.billing.braintreeClientToken) {
						if (value === 'ach') {
							self.achRenderSection({
								data: data,
								container: $template.find('div[data-payment-type="ach"]'),
								submitCallback: function() {
									monster.pub('myaccount.billing.renderContent', moduleArgs);
								}
							});
						} else {
							self.creditCardRender({
								container: $template.find('.payment-type-content[data-payment-type="card"]'),
								authorization: self.appFlags.billing.braintreeClientToken,
								expiredCardData: expiredCardData,
								cards: _.get(data, 'billing.credit_cards'),
								surcharge: self.billingGetSurcharge(countryCode, regionCode),
								submitCallback: function() {
									monster.pub('myaccount.billing.renderContent', moduleArgs);
								}
							});
						}
					}
				};

			// Select paymet method option
			var $paymentContent = $template.find('.payment-content');
			$paymentMethodRadioGroup.change(function() {
				paymentTypeChange(this.value);
			});

			$countrySelector.on('change', function() {
				var field = self.appFlags.billing.billingContactFields['contact.billing.country'];
				field.value = this.value;
				field.changed = (this.value !== field.originalValue);

				if (this.value !== 'US') {
					var $achRadio = $paymentMethodRadioGroup.filter('[value="ach"]');

					if ($achRadio.is(':checked')) {
						$achRadio.attr('checked', false);
						paymentTypeChange('none');
						monster.ui.valid($contactForm);
					}
				}

				self.billingEnableSubmitButton($template);
				self.billingUpdateSurcharge({
					template: $template,
					countryCode: this.value,
					regionCode: 'AL'
				});
				self.billingDisplayStateSelector({
					template: $template,
					countryCode: this.value,
					resetValues: true
				});
			});

			$stateSelector.on('change', function() {
				var state = this.value,
					countryCode = self.appFlags.billing.billingContactFields['contact.billing.country'].value,
					field = self.appFlags.billing.billingContactFields['contact.billing.region'];

				field.value = state;
				field.changed = (state !== field.originalValue);

				$stateInput.val(state);

				self.billingEnableSubmitButton($template);
				self.billingUpdateSurcharge({
					template: $template,
					countryCode: countryCode,
					regionCode: state
				});
			});

			monster.pub('myaccount.events', args);
		},

		billingDisplayStateSelector: function(args) {
			var self = this,
				$template = args.template,
				$stateInput = $template.find('#billing_contact_state'),
				$stateSelector = $template.find('#billing_contact_state_select_chosen'),
				countryCode = args.countryCode,
				resetValues = _.get(args, 'resetValues', false);

			if (countryCode === 'US') {
				$stateInput.hide();
				$stateSelector.show();
			} else {
				$stateInput.show();
				$stateSelector.hide();
				resetValues && $stateInput.val('');
			}
		},

		billingUpdateSurcharge: function(args) {
			var self = this,
				$template = args.template,
				countryCode = args.countryCode,
				regionCode = args.regionCode,
				surcharge = self.billingGetSurcharge(countryCode, regionCode),
				$creditCardSurchargeBadge = $template.find('#myaccount_billing_payment_card_surcharge'),
				$creditCardSurchargeNotice = $template.find('.payment-type-content[data-payment-type="card"] .credit-card-surcharge-notice');

			if (countryCode === 'US') {
				$creditCardSurchargeBadge.show();
				$creditCardSurchargeNotice.show();
			} else {
				$creditCardSurchargeBadge.hide();
				$creditCardSurchargeNotice.hide();
			}

			if (surcharge) {
				$creditCardSurchargeBadge.find('span').text(surcharge);
				$creditCardSurchargeNotice.find('span').text(surcharge);
			} else {
				$creditCardSurchargeBadge.hide();
				$creditCardSurchargeNotice.hide();
			}
		},

		billingGetSurcharge: function(countryCode, regionCode) {
			var self = this;

			if (countryCode !== 'US') {
				return;
			}

			var surcharge = _.find(self.appFlags.billing.usSurcharges, function(surcharge) {
				return _.includes(surcharge.states, regionCode);
			});

			return _.get(surcharge, 'value');
		},

		billingEnableSubmitButton: function($template) {
			var self = this,
				$submitButton = $template.find('#myaccount_billing_save'),
				hasFormChanged = _.some(self.appFlags.billing.billingContactFields, 'changed');

			$submitButton.prop('disabled', !hasFormChanged);
		},

		billingCreateBraintreeClientInstance: function(next) {
			var self = this;

			if (self.appFlags.billing.braintreeClientInstance) {
				next(null, self.appFlags.billing.braintreeClientInstance);
				return;
			}

			monster.waterfall([
				function createClientInstance(waterfallNext) {
					braintreeClient.create({
						authorization: self.appFlags.billing.braintreeClientToken
					}, waterfallNext);
				},
				function storeClientInstance(client, waterfallNext) {
					self.appFlags.billing.braintreeClientInstance = client;

					waterfallNext(null, client);
				}
			], next);
		},

		billingGetAchData: function(next) {
			var self = this;

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
						success: function(bankData) {
							next(null, usBankAccountErr, usBankAccountInstance, bankData);
						}
					});
				},
				function braintreeAchStatus(usBankAccountErr, usBankAccountInstance, bankData, next) {
					if (_.isEmpty(bankData)) {
						next(null, usBankAccountErr, usBankAccountInstance, bankData, []);
					} else {
						var newBankData = _.head(bankData);

						self.getVerificationStatus({
							data: {
								verificationId: _.get(newBankData, 'verification_id')
							},
							success: function(statusData) {
								next(null, usBankAccountErr, usBankAccountInstance, newBankData, statusData);
							}
						});
					}
				}
			], next);
		},

		billingUpdateAchDirectDebitStatus: function(args) {
			var self = this
				$template = args.template;

			self.billingGetAchData(function(usBankAccountErr, clientInstance, usBankAccountInstance, bankData, statusData) {
				var $statusBadge = $template.find('#myaccount_billing_payment_ach_status'),
					setBadgeStatus = function() {
						var currentStatus = _.get(statusData, 'status');

						if (['pending', 'verified'].indexOf(currentStatus) > -1) {
							var classStatusName = currentStatus === 'pending'
								? 'sds_Badge_Yellow'
								: 'sds_Badge_Green',
								className = 'sds_Badge ' + classStatusName,
								badgeText = currentStatus === 'pending'
									? self.i18n.active().achDirectDebit.achVerification.status.pending
									: self.i18n.active().achDirectDebit.achVerification.status.verified;

								$statusBadge.addClass(className);
								$statusBadge.text(badgeText);
						}
					};

				setBadgeStatus();
			});
		},

		billingRequestUpdateBilling: function(args) {
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

		billingGetAccountToken: function(args) {
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
		},

		getPaymentMethods: function(args) {
			var self = this;

			monster.request({
				resource: 'myaccount.braintree.getPaymentMethods',
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

		setDefaultPaymentMethod: function(args) {
			var self = this;

			monster.request({
				resource: 'myaccount.braintree.setDefaultPaymentMethod',
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

		deletePaymentMethod: function(args) {
			var self = this;

			monster.request({
				resource: 'myaccount.braintree.deletePaymentMethod',
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

	return billing;
});
