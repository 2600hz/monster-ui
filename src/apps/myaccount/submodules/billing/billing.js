define(function(require) {
	var $ = require('jquery'),
		_ = require('lodash'),
		monster = require('monster'),
		card = require('card'),
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
					self.callApi({
						resource: 'billing.getToken',
						data: {
							accountId: self.accountId
						},
						success: function(data, status) {
							callback(null, data.data);
						}
					});
				},

			}, function(err, results) {
				self.billingFormatData(results, function(results) {
					var billingTemplate = $(self.getTemplate({
						name: 'layout',
						data: results,
						submodule: 'billing'
					}));

					self.billingBindEvents(billingTemplate, results);

					monster.pub('myaccount.renderSubmodule', billingTemplate);

					billingTemplate.find('#form_credit_card').card({
						container: '.credit-card-container',
						nameInput: '#first_name, #last_name',
						numberInput: '#credit_card_number',
						expiryInput: '#expiration_date_month, #expiration_date_year',
						cvcInput: '#security_code',
						values: {
							number: '•••• •••• •••• ' + (results.billing.credit_card.last_four || '••••')
						}
					});

					dropin.create({
						authorization: _.get(results, 'accountToken.client_token'),
						selector: '#dropin_container',
						vaultManager: true
					}, function (err, instance) {
						billingTemplate.find('.change-card').on('click', function() {
							instance.requestPaymentMethod(function (err, payload) {
								if (err) {
									instance.clearSelectedPaymentMethod();
                							return;
             							} else {
									self.requestUpdateBilling({
										data: {
											data: {
												nonce: payload.nonce
											}
										},
										success: function(data) {
											console.log(data);
										}
									});
								}
    							});
  						})
					});

					if (typeof args.callback === 'function') {
						args.callback(billingTemplate);
					}
				});
			});
		},

		billingFormatData: function(data, callback) {
			if (!_.isEmpty(data.billing)) {
				data.billing.credit_card = data.billing.credit_cards[0] || {};

				/* If There is a credit card stored, we fill the fields with * */
				if (data.billing.credit_card.last_four) {
					data.billing.credit_card.fake_number = '************' + data.billing.credit_card.last_four;
					data.billing.credit_card.fake_cvv = '***';
					data.billing.credit_card.type = data.billing.credit_card.card_type.toLowerCase();
				}
			}

			callback(data);
		},

		billingBindEvents: function(template, data) {
			var self = this,
				getCardType = function(number) {
					var reg_visa = new RegExp('^4[0-9]{12}(?:[0-9]{3})?$'),
						reg_mastercard = new RegExp('^5[1-5][0-9]{14}$'),
						reg_amex = new RegExp('^3[47][0-9]{13}$'),
						reg_discover = new RegExp('^6(?:011|5[0-9]{2})[0-9]{12}$'),
						reg_JSB = new RegExp('^(?:2131|1800|35\\d{3})\\d{11}$');

					if (reg_visa.test(number)) {
						return 'visa';
					}

					if (reg_mastercard.test(number)) {
						return 'mastercard';
					}

					if (reg_amex.test(number)) {
						return 'amex';
					}

					if (reg_discover.test(number)) {
						return 'discover';
					}

					if (reg_JSB.test(number)) {
						return 'JSB';
					}

					return false;
				},
				displayCardType = function(cardNumber) {
					var type = getCardType(cardNumber);

					if (type === false) {
						template.find('.edition .card-type').hide();
						template.find('.add-on i').show();
					} else if (!(template.find('.card-type.' + type).is(':visible'))) {
						template.find('.edition .card-type').hide();
						template.find('.add-on i').hide();
						template.find('.edition .card-type.' + type).css('display', 'inline-block');
					}
				};

			template.on('click', '.braintree-toggle', function(e) {
				e.preventDefault();

				template.find('.change-card').addClass('show');
				template.find('.uneditable').hide();
				displayCardType('');
			});

			template.on('click', '.braintree-method', function(e) {
				e.preventDefault();

				template.find('.change-card').removeClass('show');
				displayCardType('');
			});

			//Refreshing the card info when opening the settings-item
			template.find('.settings-item[data-name="credit_card"] .settings-link').on('click', function() {
				var settingsItem = $(this).parents('.settings-item');
				if (!settingsItem.hasClass('open')) {
					settingsItem.find('input').keyup();
				}

                                template.find('.credit-card-container').show();
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
		}

	};

	return billing;
});
