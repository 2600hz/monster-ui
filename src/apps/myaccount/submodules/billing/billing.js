define(function(require) {
	var $ = require('jquery'),
		_ = require('lodash'),
		monster = require('monster'),
		dropin = require('dropin');

	var billing = {

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
							/* For some people billing is not via braintree, but we still ned to display the tab */
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
				self.billingFormatData(results, function(results) {
					var billingTemplate = $(self.getTemplate({
							name: 'layout',
							data: results,
							submodule: 'billing'
						})),
						expiredCreditCardData = _.get(results, 'billing.expired_card');

					self.billingBindEvents(billingTemplate, results);

					monster.pub('myaccount.renderSubmodule', billingTemplate);

					if (_.get(results, 'billing.credit_card')) {
						billingTemplate
							.find('#myaccount_billing_payment_card')
							.prop('checked', true);

						self.renderCardSection(
							_.merge({}, results, {
								container: billingTemplate
							})
						);
					}

					if (typeof args.callback === 'function') {
						args.callback(billingTemplate);
					}
				});
			});
		},

		renderCardSection: function(args) {
			var self = this,
				container = args.container,
				appendTemplate = function appendTemplate() {
					var template = $(self.getTemplate({
						name: 'card-section',
						submodule: 'billing'
					}));

					container
						.find('div[data-payment-type="card"]')
						.removeClass('payment-type-content-hidden')
						.append(template);

					dropin.create({
						authorization: _.get(args, 'accountToken.client_token'),
						selector: '#dropin_container',
						vaultManager: true,
						card: {
							cardholderName: {
								required: true
							}
						}
					}, function(err, instance) {
						var saveButton = container.find('.save-card'),
							expiredCreditCardData = _.get(args, 'billing.expired_card');

						saveButton.on('click', function(e) {
							e.preventDefault();

							instance.requestPaymentMethod(function(err, payload) {
								if (err) {
									instance.clearSelectedPaymentMethod();
								} else {
									monster.parallel({
										updateBilling: function(callback) {
											self.requestUpdateBilling({
												data: {
													data: {
														nonce: payload.nonce
													}
												},
												success: function(data) {
													callback(null, data);
												}
											});
										},
										deletedCard: function(callback) {
											if (!_.isEmpty(expiredCreditCardData)) {
												self.deleteCardBilling({
													data: {
														cardId: expiredCreditCardData.id
													},
													success: function(data) {
														callback(null, data);
													}
												});
											} else {
												callback(null);
											}
										}
									}, function(err, results) {
										if (results.deletedCard) {
											template.find('.card-expired').hide();
										}
									});
								}
							});
						});
					});
				};

			appendTemplate();
		},

		renderACHSection: function(args) {
			var self = this,
				container = args.container,
				appendTemplate = function appendTemplate() {
					var template = $(self.getTemplate({
						name: 'ach-section',
						submodule: 'billing'
					}));

					container
						.find('div[data-payment-type="ach"]')
						.removeClass('payment-type-content-hidden')
						.append(template);
				};

			appendTemplate();
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

			callback(data);
		},

		billingBindEvents: function(template, data) {
			var self = this,
				creditCardData = _.get(data, 'billing.credit_card'),
				expiredCardData = _.get(data, 'billing.expired_card');

			if (_.isEmpty(creditCardData)) {
				template.find('.save-card').addClass('show');
			}

			if (!_.isEmpty(expiredCardData)) {
				template.find('.card-expired').show();
				template.find('.save-card').addClass('show');
			}

			template.on('click', '.braintree-toggle', function(e) {
				e.preventDefault();

				template.find('.save-card').addClass('show');
			});

			template.on('click', '.braintree-method', function(e) {
				e.preventDefault();

				template.find('.save-card').removeClass('show');
			});

			//Refreshing the card info when opening the settings-item
			template.find('.settings-item[data-name="credit_card"] .settings-link').on('click', function() {
				var settingsItem = $(this).parents('.settings-item');
				if (!settingsItem.hasClass('open')) {
					settingsItem.find('input').keyup();
				}
			});

			// Select paymet method option
			var $paymentContent = template.find('.payment-content');
			template.find('input[type="radio"][name="payment_method"]').change(function() {
				var $paymentTypeContent = $paymentContent.find('[data-payment-type="' + this.value + '"]');
				$paymentTypeContent.removeClass('payment-type-content-hidden');
				$paymentTypeContent.siblings().addClass('payment-type-content-hidden');
			});

			monster.pub('myaccount.events', {
				template: template,
				data: data
			});
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
		},

		deleteCardBilling: function(args) {
			var self = this;

			self.callApi({
				resource: 'billing.deleteCard',
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
