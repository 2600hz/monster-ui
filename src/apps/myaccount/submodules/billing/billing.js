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
				enabledPayments: {
					ach: false,
					card: false
				},
				selectedPaymentType: 'none',
				defaultPaymentType: 'none',
				payments: [],
				braintreeClientToken: null,
				braintreeClientInstance: null,
				usCreditCardSurcharges: [
					{
						value: '2.6',
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
				],
				usStatesDeniedCreditCards: ['CT', 'MA', 'ME', 'NY']
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
									callback(null, { data: data, paymentData: paymentData });
								},
								error: function(errData) {
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
			}, function(err, apiResults) {
				if (err) {
					return;
				}

				var results = _.merge(apiResults, args.data);

				if (!_.isEmpty(results.payment.paymentData)) {
					var payments = _.get(results, 'payment.paymentData'),
						isAchDefault = _.find(payments, { 'default': true, 'verified': true }),
						isCreditDefault = _.find(payments, { 'default': true, 'expired': false });

					if (isAchDefault || isCreditDefault) {
						self.appFlags.billing.defaultPaymentType = isAchDefault ? 'ach' : 'card';
					}

					self.appFlags.billing.payments = payments;
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
						hasCards = !_.chain(results)
							.get('billing.credit_cards')
							.isEmpty()
							.value(),
						isCardExpired = !_.isEmpty(expiredCardData),
						country = _.get(results, 'account.contact.billing.country'),
						region = _.get(results, 'account.contact.billing.region'),
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

							self.billingEnableSubmitButton($billingTemplate);

							if (self.appFlags.billing.braintreeClientToken) {
								self.billingEnablePaymentSection($billingTemplate);
							}
						},
						defaultPaymentType = self.appFlags.billing.defaultPaymentType;

					// Initialize country selector
					monster.ui.countrySelector(
						$countrySelector,
						{
							selectedValues: country,
							options: {
								showEmptyOption: false
							}
						}
					);

					// Initialize state selector
					monster.ui.stateSelector(
						$stateSelector,
						{
							selectedValues: region,
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
						field.originalValue = _.chain(apiResults.account).get(key).trim().value();
						field.changed = false;
					});
					self.appFlags.billing.enabledPayments.card = hasCards;

					// Enable/display sections accordingly
					self.billingDisplayStateSelector({
						template: $billingTemplate,
						countryCode: country,
						initial: true
					});
					self.billingEnableSubmitButton($billingTemplate);

					if (self.appFlags.billing.braintreeClientToken) {
						self.billingEnablePaymentSection($billingTemplate);
						self.billingCreditCardUpdateSurcharge({
							template: $billingTemplate,
							countryCode: country,
							regionCode: region
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
							var defaultPaymentType = self.appFlags.billing.defaultPaymentType,
								selectedPaymentType = self.appFlags.billing.selectedPaymentType,
								isDefaultChanged = defaultPaymentType !== selectedPaymentType;

							if (!isDefaultChanged) {
								callback(null, data);
								return;
							}

							monster.waterfall([
								function reloadPaymentMethods(next) {
									self.getPaymentMethods({
										success: function(payments) {
											next(null, payments);
										},
										error: function(errData) {
											next(errData);
										}
									});
								},
								function updateDefaultPaymentMethod(payments, next) {
									var type = selectedPaymentType === 'ach' ? 'ach' : 'credit_card',
										selectedPayment = _.find(payments, { 'type': type });

									self.setDefaultPaymentMethod({
										data: {
											paymentMethodToken: selectedPayment.id
										},
										success: function(defaultData) {
											self.appFlags.billing.defaultPaymentType = selectedPaymentType;
											callback(null, data);
										}
									});
								}
							], function(err, _results) {
								callback(err, data);
							});
						}
					});

					if (!self.appFlags.billing.braintreeClientToken) {
						return;
					}

					//Display ACH section if it's set and in pending or verified state
					self.billingUpdateAchDirectDebitStatus({
						template: $billingTemplate
					});

					// Display expired credit card notification if necessary
					if (isCardExpired) {
						var $paymentTypeContent = $billingTemplate.find('.card-expired');
						$paymentTypeContent.removeClass('card-expired-hidden');
					}

					if (typeof args.callback === 'function') {
						args.callback($billingTemplate);
					}

					//select default payment
					var className = '#myaccount_billing_payment_' + defaultPaymentType;

					$billingTemplate
						.find(className)
							.prop('checked', true)
							.trigger('change');
				});
			});
		},

		billingEnablePaymentSection: function($billingTemplate, changedFieldName) {
			var self = this,
				country = self.appFlags.billing.billingContactFields['contact.billing.country'].value,
				region = self.appFlags.billing.billingContactFields['contact.billing.region'].value,
				isContactValid = _.every(self.appFlags.billing.billingContactFields, 'valid'),
				enabledPayments = self.appFlags.billing.enabledPayments,
				$paymentSelectionItems = $billingTemplate.find('.payment-type-selection-item'),
				$achPaymentSelectionItem = $paymentSelectionItems.filter('.payment-type-selection-item[data-payment-type="ach"]'),
				$cardPaymentSelectionItem = $paymentSelectionItems.filter('.payment-type-selection-item[data-payment-type="card"]'),
				$paymentDelectionRadioGroup = $billingTemplate.find('input[type="radio"][name="payment_method"]'),
				$achPaymentSelectionCheckbox = $paymentDelectionRadioGroup.filter('[value="ach"]'),
				$cardPaymentSelectionCheckbox = $paymentDelectionRadioGroup.filter('[value="card"]');

			if (isContactValid) {
				$paymentSelectionItems.removeClass('sds_SelectionList_Item_Disabled');
				$billingTemplate.find('.payment-type-warning').hide();
				$billingTemplate.find('.disable-overlay').hide();
			} else {
				if (!enabledPayments.card) {
					$cardPaymentSelectionItem.addClass('sds_SelectionList_Item_Disabled');
				}
				if (!enabledPayments.ach) {
					$achPaymentSelectionItem.addClass('sds_SelectionList_Item_Disabled');
				}
				$billingTemplate.find('.payment-type-warning').show();
				$billingTemplate.find('.disable-overlay').show();
			}

			// Enable payment options according to the region
			if (['US', 'United States'].indexOf(country) < 0) {
				// If country is not US

				// Disable ACH
				if (!enabledPayments.ach) {
					$achPaymentSelectionItem.addClass('sds_SelectionList_Item_Disabled');

					if ($achPaymentSelectionCheckbox.prop('checked')) {
						$achPaymentSelectionCheckbox.prop('checked', false);
						$achPaymentSelectionCheckbox.trigger('change');
					}
				}

				// Allow credit and debit cards
				$cardPaymentSelectionItem.find('.sds_SelectionList_Item_Content_Title')
					.contents().first()
						.replaceWith(self.i18n.active().billing.paymentMethod.options.card.creditDebitCardTitle);
				$cardPaymentSelectionItem.find('.sds_SelectionList_Item_Content_Description')
					.text(self.i18n.active().billing.paymentMethod.options.card.description);
			} else {
				// If country is US

				// Enable ACH
				$achPaymentSelectionItem.removeClass('sds_SelectionList_Item_Disabled');

				// Allow only credit cards
				$cardPaymentSelectionItem.find('.sds_SelectionList_Item_Content_Title')
					.contents().first()
						.replaceWith(self.i18n.active().billing.paymentMethod.options.card.creditCardTitle);

				// Check region
				if (_.includes(self.appFlags.billing.usStatesDeniedCreditCards, region)) {
					// Disable credit card option
					$cardPaymentSelectionItem.find('.sds_SelectionList_Item_Content_Description')
						.text(self.i18n.active().billing.paymentMethod.options.card.denyDescription);

					if (!enabledPayments.card) {
						$cardPaymentSelectionItem.addClass('sds_SelectionList_Item_Disabled');

						if ($cardPaymentSelectionCheckbox.prop('checked')) {
							$cardPaymentSelectionCheckbox.prop('checked', false);
							$cardPaymentSelectionCheckbox.trigger('change');
						}
					}
				} else {
					$cardPaymentSelectionItem.find('.sds_SelectionList_Item_Content_Description')
						.text(self.i18n.active().billing.paymentMethod.options.card.description);
				}
			}
		},

		billingFormatData: function(data, callback) {
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
				cards = _.get(data, 'billing.credit_cards'),
				expiredCardData = _.get(data, 'billing.expired_card'),
				paymentTypeChange = function(value) {
					if (value === 'none') {
						$paymentContent
							.find('.payment-type-content')
								.addClass('payment-type-content-hidden');

						return;
					}

					var $paymentTypeContent = $paymentContent.find('.payment-type-content[data-payment-type="' + value + '"]'),
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

					self.billingEnableSubmitButton($template);

					if (value === 'ach') {
						self.achRenderSection({
							data: data,
							container: $template.find('.payment-type-content[data-payment-type="ach"]'),
							submitCallback: function() {
								self.billingUpdateContactInfo({
									template: $template,
									moduleArgs: moduleArgs
								});
							}
						});
					} else {
						self.creditCardRender({
							container: $template.find('.payment-type-content[data-payment-type="card"]'),
							authorization: self.appFlags.billing.braintreeClientToken,
							expiredCardData: expiredCardData,
							cards: cards,
							country: countryCode,
							region: regionCode,
							submitCallback: function(args) {
								self.billingUpdateContactInfo({
									template: $template,
									moduleArgs: moduleArgs,
									surchargeAccepted: _.get(args, 'surchargeAccepted')
								});
							}
						});
					}
				};

			if (self.appFlags.billing.braintreeClientToken) {
				// Select paymet method option
				var $paymentContent = $template.find('.payment-content');
				$paymentMethodRadioGroup.change(function() {
					var paymentType = !this.checked || _.isNil(this.value)
						? 'none'
						: this.value;

					paymentTypeChange(paymentType);
				});
			}

			$countrySelector.on('change', function() {
				var field = self.appFlags.billing.billingContactFields['contact.billing.country'];
				field.value = this.value;
				field.changed = (this.value !== field.originalValue);

				self.billingEnableSubmitButton($template);
				self.billingDisplayStateSelector({
					template: $template,
					countryCode: this.value
				});
				self.billingCreditCardUpdateSurcharge({
					template: $template,
					countryCode: this.value,
					regionCode: self.appFlags.billing.billingContactFields['contact.billing.region'].value
				});
				self.billingEnablePaymentSection($template, 'contact.billing.country');
				self.creditCardChangeCountry({
					country: this.value
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
				self.billingCreditCardUpdateSurcharge({
					template: $template,
					countryCode: countryCode,
					regionCode: state
				});
				self.billingEnablePaymentSection($template, 'contact.billing.region');
			});

			monster.pub('myaccount.events', args);
		},

		billingDisplayStateSelector: function(args) {
			var self = this,
				$template = args.template,
				$stateInput = $template.find('#billing_contact_state'),
				$regionSelector = $template.find('#billing_contact_state_select'),
				$regionSelectorChosen = $template.find('#billing_contact_state_select_chosen'),
				countryCode = args.countryCode,
				initial = _.get(args, 'initial', false),
				regionField = self.appFlags.billing.billingContactFields['contact.billing.region'];

			if (countryCode === 'US') {
				if (initial || $stateInput.is(':visible')) {
					$stateInput.hide();
					$regionSelectorChosen.show();

					if (!initial) {
						var value = $regionSelector.val();
						$stateInput.val(value);
						regionField.value = value;
						regionField.changed = (regionField.originalValue !== value);
						regionField.valid = !_.isEmpty(value);
					}
				}
			} else {
				if (initial || $regionSelectorChosen.is(':visible')) {
					$stateInput.show();
					$regionSelectorChosen.hide();

					if (!initial) {
						$stateInput.val('');
						regionField.value = '';
						regionField.changed = (regionField.originalValue !== '');
						regionField.valid = false;
					}
				}
			}
		},

		billingCreditCardUpdateSurcharge: function(args) {
			var self = this,
				$template = args.template,
				countryCode = args.countryCode,
				regionCode = args.regionCode,
				surcharge = self.billingGetCreditCardSurcharge(countryCode, regionCode),
				$creditCardSurchargeBadge = $template.find('#myaccount_billing_payment_card_surcharge'),
				$creditCardSurchargeNotice = $template.find('.payment-type-content[data-payment-type="card"] .credit-card-surcharge-notice');

			if (countryCode !== 'US' || !surcharge) {
				$creditCardSurchargeBadge.addClass('badge-surcharge-hidden');
				$creditCardSurchargeNotice.hide();
				return;
			}

			$creditCardSurchargeBadge.removeClass('badge-surcharge-hidden');
			$creditCardSurchargeBadge.find('span').text(surcharge);
			$creditCardSurchargeNotice.find('span').text(surcharge);
		},

		billingGetCreditCardSurcharge: function(countryCode, regionCode) {
			var self = this;

			if (countryCode !== 'US') {
				return;
			}

			var surcharge = _.find(self.appFlags.billing.usCreditCardSurcharges, function(surcharge) {
				return _.includes(surcharge.states, regionCode);
			});

			return _.get(surcharge, 'value');
		},

		billingEnableSubmitButton: function($template) {
			var self = this,
				$submitButton = $template.find('#myaccount_billing_save'),
				hasFormChanged = _.some(self.appFlags.billing.billingContactFields, 'changed'),
				payments = self.appFlags.billing.payments,
				defaultPaymentType = self.appFlags.billing.defaultPaymentType,
				selectedPaymentType = self.appFlags.billing.selectedPaymentType,
				isDefaultValid = selectedPaymentType === 'ach'
					? _.some(payments, { 'type': 'ach', 'verified': true })
					: _.some(payments, { 'expired': false, 'type': 'credit_card' }),
				isDefaultChanged = (defaultPaymentType !== selectedPaymentType) && isDefaultValid,
				billingHasPendingChanges = hasFormChanged || isDefaultChanged;

			$submitButton.prop('disabled', !billingHasPendingChanges);

			self.creditCardBillingHasPendingChanges(billingHasPendingChanges);
			self.achBillingHasPendingChanges(billingHasPendingChanges);
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
			var self = this,
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

		billingGetFormData: function() {
			var self = this,
				data = {
					account: monster.ui.getFormData('form_billing')
				};

			delete data.account.contact.billing.region_select;

			return data;
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
		},

		billingUpdateContactInfo: function(args) {
			var self = this,
				$template = args.template,
				$submitButton = $template.find('#myaccount_billing_save'),
				moduleArgs = args.moduleArgs,
				surchargeAccepted = args.surchargeAccepted;

			// Only payment method was added
			if ($submitButton.prop('disabled') && !surchargeAccepted) {
				monster.pub('myaccount.billing.renderContent', moduleArgs);
				return;
			}

			// Update account after adding payment method
			if (surchargeAccepted) {
				$template.find('form [name="braintree.surcharge_accepted"]').val(surchargeAccepted);
				$submitButton.prop('disabled', false);
			}

			// This will emit myaccount.billing.renderContent after updating the account
			$submitButton.trigger('click');
		}
	};

	return billing;
});
