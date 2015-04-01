define(function(require) {
	var $ = require('jquery'),
		_ = require('underscore'),
		monster = require('monster'),
		card = require('card');

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
						})
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
							error:function(data, status) {
								/* For some people billing is not via braintree, but we still ned to display the tab */
								callback(null, {});
							}
						});
					}
				},
				function(err, results) {
					self.billingFormatData(results, function(results) {
						var billingTemplate = $(monster.template(self, 'billing-layout', results));

						self.billingBindEvents(billingTemplate, results);

						monster.pub('myaccount.renderSubmodule', billingTemplate);

						billingTemplate.find('#form_credit_card').card({
							container: '.credit-card-container',
							nameInput: '#first_name, #last_name',
							numberInput: '#credit_card_number',
							expiryInput: '#expiration_date_month, #expiration_date_year',
							cvcInput: '#security_code',
							values: {
								number: '•••• •••• •••• '+(results.billing.credit_card.last_four || '••••')
							}
						});

						if(typeof args.callback === 'function') {
							args.callback(billingTemplate);
						}
					});
				}
			);
		},

		billingFormatData: function(data, callback) {
			if(! _.isEmpty(data.billing) ) {
				data.billing.credit_card = data.billing.credit_cards[0] || {};

				/* If There is a credit card stored, we fill the fields with * */
				if(data.billing.credit_card.last_four) {
					data.billing.credit_card.fake_number = '************'+data.billing.credit_card.last_four;
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
						reg_discover = new RegExp('^6(?:011|5[0-9]{2})[0-9]{12}$');
						//regDiners = new RegExp('^3(?:0[0-5]|[68][0-9])[0-9]{11}$'),
						//regJSB= new RegExp('^(?:2131|1800|35\\d{3})\\d{11}$');

					if(reg_visa.test(number))
						return 'visa';
					if (reg_mastercard.test(number))
						return 'mastercard';
					if (reg_amex.test(number))
						return 'amex';
					if (reg_discover.test(number))
						return 'discover';
					/*if (reg_diners.test(number))
						return 'DINERS';
					if (reg_JSB.test(number))
						return 'JSB';*/
					return false;
				},
				displayCardType = function(cardNumber) {
					var type = getCardType(cardNumber);

					if(type === false) {
						template.find('.edition .card-type').hide();
						template.find('.add-on i').show();
					}
					else if(!(template.find('.card-type.'+type).is(':visible'))) {
						template.find('.edition .card-type').hide();
						template.find('.add-on i').hide();
						template.find('.edition .card-type.'+type).css('display', 'inline-block');
					}
				};

			template.find('.edit-credit-card').on('click', function(e) {
				e.preventDefault();

				template.find('.edition').show();
				template.find('.uneditable').hide();
				displayCardType('');
			});

			template.find('#credit_card_number').on('keyup', function(e) {
				displayCardType($(this).val());
			});

			template.find('#credit_card_number').on('paste', function(e) {
				var currentElement = $(this);
				//Hack for paste event: w/o timeout, the value is set to undefined...
				setTimeout(function() {
					displayCardType(currentElement.val());
				}, 0);
			});

			//Refreshing the card info when opening the settings-item
			template.find('.settings-item[data-name="credit_card"] .settings-link').on('click', function() {
				var settingsItem = $(this).parents('.settings-item');
				if(!settingsItem.hasClass('open')) {
					settingsItem.find('input').keyup();
				}
			});
			monster.pub('myaccount.events', {
				template: template,
				data: data
			});
		}
	};

	return billing;
});