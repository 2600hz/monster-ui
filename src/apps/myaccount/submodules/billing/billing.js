define(function(require) {
	var $ = require('jquery'),
		_ = require('lodash'),
		monster = require('monster'),
		braintreeClient = require('braintree-client');

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
				braintreeClientToken: null,
				braintreeClientInstance: null
			}
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
					self.billingGetAccountToken({
						success: function(data) {
							callback(null, data);
						},
						error: function(data) {
							self.billingRequestUpdateBilling({
								data: {
									data: {
										first_name: 'Test',
										last_name: 'Test'
									}
								},
								success: function(data) {
									self.billingGetAccountToken({
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

				self.appFlags.billing.braintreeClientToken = _.get(results, 'accountToken.client_token');

				self.billingFormatData(results, function(results) {
					var $billingTemplate = $(self.getTemplate({
							name: 'layout',
							data: results,
							submodule: 'billing'
						})),
						$billingContactForm = $billingTemplate.find('#form_billing'),
						$countrySelector = $billingTemplate.find('#billing_contact_country'),
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

							self.billingEnableSubmitButton($billingTemplate);
							self.billingEnablePaymentSection($billingTemplate);
						};

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

					// Check if billing contact is valid
					_.each(self.appFlags.billing.billingContactFields, function(data, key) {
						var field = self.appFlags.billing.billingContactFields[key];
						field.valid = !field.required || !_.chain(results.account).get(key).isEmpty().value();
						field.value = _.chain(results.account).get(key).trim().value();
						field.originalValue = field.value;
					});

					self.billingEnablePaymentSection($billingTemplate);

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

		billingEnablePaymentSection: function($billingTemplate) {
			var self = this,
				paymentType = self.appFlags.billing.selectedPaymentType,
				country = self.appFlags.billing.billingContactFields['contact.billing.country'].value,
				isContactValid = _.every(self.appFlags.billing.billingContactFields, 'valid');

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
				$contactForm = $template.find('#form_billing'),
				$countrySelector = $template.find('#billing_contact_country'),
				$paymentContent = $template.find('.payment-content'),
				$paymentMethodRadioGroup = $template.find('input[type="radio"][name="payment_method"]'),
				expiredCardData = _.get(data, 'billing.expired_card'),
				paymentTypeChange = function(value) {
					var $paymentTypeContent = $paymentContent.find('[data-payment-type="' + value + '"]');
					$paymentTypeContent.removeClass('payment-type-content-hidden');
					$paymentContent.find('.payment-type-content:not([data-payment-type="' + value + '"])')
						.addClass('payment-type-content-hidden');

					self.appFlags.billing.selectedPaymentType = value;

					monster.ui.valid($contactForm);

					if (_.isEmpty(value)) {
						return;
					}

					if (value === 'ach') {
						self.achRenderSection(args);
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
			});

			monster.pub('myaccount.events', args);
		},

		billingEnableSubmitButton: function($template) {
			var self = this,
				$submitButton = $template.find('#myaccount_billing_save'),
				hasFormChanged = _.some(self.appFlags.billing.billingContactFields, 'changed');

			$submitButton.prop('disabled', !hasFormChanged);
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
		}
	};

	return billing;
});
