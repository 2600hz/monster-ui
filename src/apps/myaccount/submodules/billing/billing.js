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
				usStatesDeniedCreditCards: ['CT', 'MA', 'ME', 'NY'],
				requestCount: 0
			}
		},

		subscribe: {
			'myaccount.billing.renderContent': '_billingRenderContent',
			'monster.requestStart': '_billingRequestStart',
			'monster.requestEnd': '_billingRequestEnd'
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

		_billingRequestStart: function() {
			var self = this;

			self.appFlags.billing.requestCount++;

			if (self.appFlags.billing.requestCount > 0) {
				$(document).find('#myaccount_billing_loading_overlay')
					.removeClass('billing-body-loading-overlay-hidden');
			}
		},

		_billingRequestEnd: function() {
			var self = this;

			self.appFlags.billing.requestCount--;

			if (self.appFlags.billing.requestCount === 0) {
				$(document).find('#myaccount_billing_loading_overlay')
					.addClass('billing-body-loading-overlay-hidden');
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
				billing: _.bind(self.billingGetBillingData, self)
			}, function(err, apiResults) {
				if (err) {
					return;
				}

				var results = _.merge(apiResults, args.data),
					payments = _.get(results, 'billing.payments');

				if (_.isEmpty(payments)) {
					self.appFlags.billing.defaultPaymentType = 'none';
				} else {
					var isAchDefault = _.some(payments, { 'default': true, 'type': 'ach' }),
						isCreditDefault = _.some(payments, { 'default': true, 'expired': false, 'type': 'credit_card' });

					self.appFlags.billing.defaultPaymentType = isAchDefault
						? 'ach'
						: isCreditDefault
							? 'card'
							: 'none';
					self.appFlags.billing.payments = payments;
				}

				self.appFlags.billing.braintreeClientToken = _.get(results, 'billing.token.client_token');

				self.billingFormatData(results, function(results) {
					var isReseller = monster.util.isReseller(),
						isMasquerading = monster.util.isMasquerading(),
						isAdmin = monster.util.isAdmin(),
						$billingTemplate = $(self.getTemplate({
							name: 'layout',
							data: _.assign({
								displayPamentMethods: isReseller && isAdmin && !isMasquerading
							}, results),
							submodule: 'billing'
						})),
						$billingContactForm = $billingTemplate.find('#form_billing'),
						$countrySelector = $billingTemplate.find('#billing_contact_country'),
						$stateSelector = $billingTemplate.find('#billing_contact_state_select'),
						expiredCardData = _.get(results, 'billing.customer.expired_card'),
						cards = _.get(results, 'billing.customer.credit_cards'),
						hasCards = !_.isEmpty(cards),
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

							self.billingEnablePaymentSection($billingTemplate);
						},
						defaultPaymentType = self.appFlags.billing.defaultPaymentType;

					self.appFlags.billing.enabledPayments.card = hasCards;
					self.appFlags.billing.enabledPayments.ach = _.chain(results)
						.get('billing.payments', [])
						.some({ type: 'ach' })
						.value();

					// Initialize country selector
					monster.ui.countrySelector(
						$countrySelector,
						{
							selectedValues: country || '',
							options: {
								showEmptyOption: true
							}
						}
					);

					// Initialize state selector
					monster.ui.stateSelector(
						$stateSelector,
						{
							selectedValues: region || '',
							options: {
								showEmptyOption: true
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

					// Enable/display sections accordingly
					self.billingDisplayStateSelector({
						template: $billingTemplate,
						countryCode: country,
						initial: true
					});
					self.billingEnableSubmitButton($billingTemplate);

					self.billingEnablePaymentSection($billingTemplate);
					self.billingCreditCardUpdateSurcharge({
						template: $billingTemplate,
						countryCode: country,
						regionCode: region
					});

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
						data: results
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
						var $expiredCardPaymentTypeContent = $billingTemplate.find('.payment-type-content[data-payment-type="card-expired"]');
						$expiredCardPaymentTypeContent.removeClass('payment-type-content-hidden');

						self.creditCardRender({
							container: $expiredCardPaymentTypeContent,
							expiredCardData: expiredCardData,
							expiredMode: true,
							cards: cards,
							country: country,
							region: region
						});
					} else if (defaultPaymentType !== 'none') {
						//select default payment
						var className = '#myaccount_billing_payment_' + defaultPaymentType;

						$billingTemplate
							.find(className)
								.prop('checked', true)
								.trigger('change');
					}

					if (typeof args.callback === 'function') {
						args.callback($billingTemplate);
					}
				});
			});
		},

		billingGetBillingData: function(callback) {
			var self = this;

			if (!monster.util.isReseller()) {
				return callback(null, {});
			}

			monster.waterfall([
				function getBillingCustomer(next) {
					self.callApi({
						resource: 'billing.get',
						data: {
							accountId: self.accountId,
							generateError: false
						},
						success: function(data) {
							next(null, { customer: data.data });
						},
						error: function() {
							/* For some people billing is not via braintree, but we still need to display the tab */
							next(null, {});
						}
					});
				},
				function getCustomerToken(mainData, next) {
					if (!monster.config.api.braintree) {
						return next(null, mainData);
					}

					self.billingGetAccountToken({
						success: function(data) {
							next(null, _.assign({}, mainData, { token: data }));
						},
						error: function() {
							next(null, mainData);
						}
					});
				},
				function getBraintreePaymentMethods(mainData, next) {
					if (!monster.config.api.braintree || !_.get(mainData, 'token.client_token')) {
						return next(null, mainData);
					}

					self.getPaymentMethods({
						success: function(payments) {
							next(null, _.assign({}, mainData, { payments: payments }));
						},
						error: function() {
							next(null, mainData);
						}
					});
				}
			], callback);
		},

		billingEnablePaymentSection: function($billingTemplate) {
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
				$billingTemplate.find('.no-ach-available')
					.removeClass('no-ach-available-hidden');

				if (!enabledPayments.ach) {
					$achPaymentSelectionItem.addClass('sds_SelectionList_Item_Disabled');

					if ($achPaymentSelectionCheckbox.prop('checked')) {
						$achPaymentSelectionCheckbox.prop('checked', false);
						$achPaymentSelectionCheckbox.trigger('change');
					}
				}

				// Allow credit and debit cards
				$billingTemplate.find('.no-card-available')
					.addClass('no-card-available-hidden');

				$cardPaymentSelectionItem.find('.sds_SelectionList_Item_Content_Title')
					.contents().first()
						.replaceWith(self.i18n.active().billing.paymentMethod.options.card.creditDebitCardTitle);

				$cardPaymentSelectionItem.find('.sds_SelectionList_Item_Content_Description')
					.text(self.i18n.active().billing.paymentMethod.options.card.creditDebitCardDescription);
			} else {
				// If country is US

				// Enable ACH
				$billingTemplate.find('.no-ach-available')
					.addClass('no-ach-available-hidden');

				$achPaymentSelectionItem.removeClass('sds_SelectionList_Item_Disabled');

				// Allow only credit cards
				$cardPaymentSelectionItem.find('.sds_SelectionList_Item_Content_Title')
					.contents().first()
						.replaceWith(self.i18n.active().billing.paymentMethod.options.card.creditCardTitle);

				// Check region
				if (_.includes(self.appFlags.billing.usStatesDeniedCreditCards, region)) {
					// Disable credit card option
					$billingTemplate.find('.no-card-available')
						.removeClass('no-card-available-hidden');

					$cardPaymentSelectionItem.find('.sds_SelectionList_Item_Content_Description')
						.text(self.i18n.active().billing.paymentMethod.options.card.creditDenyDescription);

					if (!enabledPayments.card) {
						$cardPaymentSelectionItem.addClass('sds_SelectionList_Item_Disabled');

						if ($cardPaymentSelectionCheckbox.prop('checked')) {
							$cardPaymentSelectionCheckbox.prop('checked', false);
							$cardPaymentSelectionCheckbox.trigger('change');
						}
					}
				} else {
					// Enable card option
					$billingTemplate.find('.no-card-available')
						.addClass('no-card-available-hidden');

					$cardPaymentSelectionItem.removeClass('sds_SelectionList_Item_Disabled');

					$cardPaymentSelectionItem.find('.sds_SelectionList_Item_Content_Description')
						.text(self.i18n.active().billing.paymentMethod.options.card.creditCardDescription);
				}
			}
		},

		billingFormatData: function(data, callback) {
			if (!_.isEmpty(data.billing.customer)) {
				var creditCards = _.get(data, 'billing.customer.credit_cards', []);
				data.billing.customer.expired_card = _.find(creditCards, { 'default': true, 'expired': true }) || {};
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
				$submitButton = $template.find('#myaccount_billing_save'),
				cards = _.get(data, 'billing.customer.credit_cards'),
				expiredCardData = _.get(data, 'billing.customer.expired_card'),
				achData = {
					account: data.account,
					billing: data.billing.customer,
					payment: {
						data: data.billing.token,
						paymentData: data.billing.payments
					}
				},
				updateCallback = function(callback) {
					// Add here any steps to do after billing contact update
					var defaultPaymentType = self.appFlags.billing.defaultPaymentType,
						selectedPaymentType = self.appFlags.billing.selectedPaymentType,
						isDefaultChanged = defaultPaymentType !== selectedPaymentType;

					if (!isDefaultChanged) {
						callback(null);
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
								selectedPayment = selectedPaymentType === 'ach'
									? _.find(payments, { 'type': type, 'verified': true })
									: _.find(payments, { 'type': type });

							if (_.get(selectedPayment, 'id')) {
								self.setDefaultPaymentMethod({
									data: {
										paymentMethodToken: selectedPayment.id
									},
									success: function(defaultData) {
										self.appFlags.billing.defaultPaymentType = selectedPaymentType;
										next(null);
									}
								});
							} else {
								next(null);
							}
						}
					], callback);
				},
				paymentTypeChange = function(value) {
					$template.find('.no-payment-available-small-notices')
						.removeClass('no-payment-available-small-notices-ach')
						.removeClass('no-payment-available-small-notices-card')
						.removeClass('no-payment-available-small-notices-none')
						.addClass('no-payment-available-small-notices-' + value);

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
							data: achData,
							container: $template.find('.payment-type-content[data-payment-type="ach"]'),
							expiredCardData: expiredCardData,
							preSubmitCallback: function(next) {
								monster.parallel({
									saveContactInfo: function(next) {
										self.billingSaveContactInfo($template, data.account, null, next);
									},
									deleteExpiredCard: function(next) {
										if (_.isEmpty(expiredCardData)) {
											next(null);
											return;
										}

										self.creditCardDelete({
											data: {
												cardId: expiredCardData.id
											},
											success: function(_data) {
												next(null);
											}
										});
									}
								}, function(err, _res) {
									next(err);
								});
							},
							submitCallback: function() {
								updateCallback(function(err) {
									if (err) {
										console.error(err);
										return;
									}

									monster.pub('myaccount.billing.renderContent', moduleArgs);
								});
							}
						});
					} else {
						self.creditCardRender({
							container: $template.find('.payment-type-content[data-payment-type="card"]'),
							expiredCardData: expiredCardData,
							cards: cards,
							country: countryCode,
							region: regionCode,
							postRenderCallback: function() {
								self.billingEnablePaymentSection($template);
							},
							preSubmitCallback: function(args, next) {
								var surchargeAccepted = _.get(args, 'surchargeAccepted');

								self.billingSaveContactInfo($template, data.account, surchargeAccepted, next);
							},
							submitCallback: function(args) {
								var surchargeAccepted = _.get(args, 'surchargeAccepted');

								monster.waterfall([
									function updateBraintreeAccountInfo(next) {
										if (_.isNil(surchargeAccepted)) {
											next(null);
											return;
										}

										self.billingSaveContactInfo($template, data.account, surchargeAccepted, next);
									},
									updateCallback
								], function(err) {
									if (err) {
										console.error(err);
										return;
									}

									monster.pub('myaccount.billing.renderContent', moduleArgs);
								});
							}
						});
					}
				};

			$paymentMethodRadioGroup.change(function() {
				var paymentType = !this.checked || _.isNil(this.value)
					? 'none'
					: this.value;

				paymentTypeChange(paymentType);
			});

			$countrySelector.on('change', function() {
				var field = self.appFlags.billing.billingContactFields['contact.billing.country'];
				field.value = this.value;
				field.changed = (this.value !== field.originalValue);
				field.valid = !field.required || !_.isEmpty(this.value);

				self.billingDisplayStateSelector({
					template: $template,
					countryCode: this.value
				});
				self.billingEnableSubmitButton($template);
				self.billingCreditCardUpdateSurcharge({
					template: $template,
					countryCode: this.value,
					regionCode: self.appFlags.billing.billingContactFields['contact.billing.region'].value
				});
				self.billingEnablePaymentSection($template);
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
				field.valid = !field.required || !_.isEmpty(state);

				$stateInput.val(state);

				self.billingEnableSubmitButton($template);
				self.billingCreditCardUpdateSurcharge({
					template: $template,
					countryCode: countryCode,
					regionCode: state
				});
				self.billingEnablePaymentSection($template);
			});

			$submitButton.on('click', function() {
				monster.waterfall([
					function saveContactInfo(next) {
						self.billingSaveContactInfo($template, data.account, null, next);
					},
					updateCallback
				], function(err) {
					if (err) {
						console.error(err);
						return;
					}

					monster.pub('myaccount.billing.renderContent', moduleArgs);
				});
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
				regionField = self.appFlags.billing.billingContactFields['contact.billing.region'],
				getStateCode = function(value) {
					var lowerCaseValue = value.toLowerCase(),
						countries = $regionSelector.find('option').map(function(_i, item) {
							var $item = $(item);

							return {
								code: $item.attr('value').toLowerCase(),
								name: $item.text().toLowerCase()
							};
						}).get();

					return _.chain(countries)
						.filter(function(country) {
							return country.code === lowerCaseValue || country.name === lowerCaseValue;
						})
						.map(function(country) {
							return country.code.toUpperCase();
						})
						.head()
						.value();
				};

			if (countryCode === 'US') {
				if (initial || $stateInput.is(':visible')) {
					$stateInput.hide();
					$regionSelectorChosen.show();

					if (!initial) {
						var textValue = $stateInput.val(),
							countryCode = getStateCode(textValue),
							value;

						if (countryCode) {
							value = countryCode;
							$regionSelector.val(value).trigger('chosen:updated');
						} else {
							value = $regionSelector.val();
						}

						$stateInput.val(value);
						regionField.value = value;
						regionField.changed = (regionField.originalValue !== value);
						regionField.valid = !regionField.required || !_.isEmpty(value);
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
						regionField.valid = !regionField.required;
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

			self.creditCardBillingHasPendingChanges(hasFormChanged);
			self.achBillingHasPendingChanges(billingHasPendingChanges);
		},

		billingCreateBraintreeClientInstance: function(next) {
			var self = this;

			if (self.appFlags.billing.braintreeClientInstance) {
				next(null, self.appFlags.billing.braintreeClientInstance);
				return;
			}

			monster.waterfall([
				function createBillingCustomer(waterfallNext) {
					if (self.appFlags.billing.braintreeClientToken) {
						return waterfallNext(null, self.appFlags.billing.braintreeClientToken);
					}

					self.billingRequestUpdateBilling({
						data: {
							data: {
								company:  monster.apps.auth.originalAccount.name,
								first_name: monster.apps.auth.currentUser.first_name,
								last_name: monster.apps.auth.currentUser.last_name
							}
						},
						success: function() {
							waterfallNext(null, null);
						},
						error: function(parsedError) {
							waterfallNext(parsedError);
						}
					});
				},
				function getAccountToken(authorization, waterfallNext) {
					if (authorization) {
						return waterfallNext(null, authorization);
					}

					self.billingGetAccountToken({
						success: function(data) {
							waterfallNext(null, data.client_token);
						},
						error: function(parsedError) {
							waterfallNext(parsedError);
						}
					});
				},
				function createClientInstance(authorization, waterfallNext) {
					braintreeClient.create({
						authorization: authorization
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
						return;
					}

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
			], next);
		},

		billingUpdateAchDirectDebitStatus: function(args) {
			var self = this,
				$template = args.template;

			self.billingGetAchData(function(usBankAccountErr, clientInstance, usBankAccountInstance, bankData, statusData) {
				var $statusBadge = $template.find('#myaccount_billing_payment_ach_status'),
					setBadgeStatus = function() {
						var currentStatus = _.get(statusData, 'status');

						if (!currentStatus) {
							return;
						}

						var classStatusName = currentStatus === 'pending'
								? 'sds_Badge_Yellow'
								: currentStatus === 'verified'
									? 'sds_Badge_Green'
									: 'sds_Badge_Red',
							className = 'sds_Badge ' + classStatusName,
							badgeText = currentStatus === 'pending'
								? self.i18n.active().achDirectDebit.achVerification.status.pending
								: currentStatus === 'verified'
									? self.i18n.active().achDirectDebit.achVerification.status.verified
									: self.i18n.active().achDirectDebit.achVerification.status.failed;

						$statusBadge.addClass(className);
						$statusBadge.text(badgeText);
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
		},

		billingSaveContactInfo: function($template, account, surchargeAccepted, next) {
			var self = this,
				$billingContactForm = $template.find('#form_billing'),
				$submitButton = $template.find('#myaccount_billing_save'),
				isValid = monster.ui.valid($billingContactForm),
				isSurchargeAccepted = self.billingIsSurchargeAccepted(account),
				formData = {},
				updatedAccount = {};

			if ($submitButton.prop('disabled') && _.isNil(surchargeAccepted)) {
				next(null);
				return;
			}

			if (!isValid) {
				next('CONTACT_INVALID');
				return;
			}

			formData = monster.ui.getFormData('form_billing');
			updatedAccount = _.merge({}, account, formData);

			delete updatedAccount.contact.billing.region_select;

			if (!isSurchargeAccepted && surchargeAccepted) {
				updatedAccount.braintree = _.merge({}, updatedAccount.braintree, {
					surcharge_accepted: surchargeAccepted,
					user_id: monster.apps.auth.currentUser.id,
					first_name: monster.apps.auth.currentUser.first_name,
					last_name: monster.apps.auth.currentUser.last_name
				});
			}

			self.callApi({
				resource: 'account.update',
				data: {
					accountId: self.accountId,
					data: updatedAccount
				},
				success: function(_data) {
					next && next(null);
				},
				error: function() {
					next && next(true);
				}
			});
		},

		billingIsSurchargeAccepted: function(account) {
			return !!_.get(account, ['braintree', 'surcharge_accepted']);
		}
	};

	return billing;
});
