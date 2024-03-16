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
				}
			}, function(err, results) {
				self.billingFormatData(results, function(results) {
					var billingTemplate = $(self.getTemplate({
						name: 'layout',
						data: results,
						submodule: 'billing'
					}));

					monster.pub('myaccount.renderSubmodule', billingTemplate);

					self.renderCreditCardSection(billingTemplate);
					self.renderAddButtonsSection(billingTemplate);

					self.billingBindEvents(billingTemplate, results);

					if (typeof args.callback === 'function') {
						args.callback(billingTemplate);
					}
				});
			});
		},

		billingFormatData: function(data, callback) {
			if (!_.isEmpty(data.billing)) {
				var creditCards = _.get(data, 'billing.credit_cards', {});
				data.billing.credit_card = _.find(creditCards, { 'default': true }) || {};

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

		renderCreditCardSection: function(template) {
			var self = this;

			monster.parallel({
				accountToken: function(callback) {
					self.callApi({
						resource: 'billing.getToken',
						data: {
							accountId: self.accountId,
							generateError: false
						},
						success: function(data, status) {
							callback(null, data.data);
						},
						error: function(data, status) {
							callback(null, {});
						}
					});
				}
			}, function(err, results) {
				console.log(results);
				var setCardHeader = function(creditCard, button) {
					var cardType = _.get(creditCard, 'card_type', '').toLowerCase(),
						newTypeClass = cardType === 'american express'
							? 'card-type amex'
							: 'card-type ' + cardType,
						newDescription = creditCard.last_four
							? '•••• •••• •••• ' + (creditCard.last_four)
							: '';

					template.find('.card-type')
						.removeClass()
						.addClass(newTypeClass);

					template.find('.fake-number')
						.text(newDescription);

					if (!_.isEmpty(creditCard)) {
						button.removeClass('show');
					} else {
						button.addClass('show');
					}
				},
				clientToken = _.get(results, 'accountToken.client_token');

				console.log(clientToken);
				dropin.create({
					authorization: clientToken || 'sandbox_g42y39zw_348pk9cgf3bgyw2b', //default client token to display the credit card section
					selector: '#dropin_container',
					vaultManager: true,
					card: {
						cardholderName: {
							required: true
						}
					}
				}, function(err, instance) {
					var saveButton = template.find('.save-card'),
						deleteButton = template.find('.braintree-delete-confirmation__button[data-braintree-id="delete-confirmation__yes"]');

					console.log(clientToken);
					template.on('click', '.save-card', function(event) {
						console.log(clientToken);
						event.preventDefault();
						if (!clientToken) {
							console.log('here');
							self.requestUpdateBilling({
								data: {
									data: {
										first_name: 'Test',
										last_name: 'Test'
									}
								},
								success: function(data) {
									self.renderCreditCardSection(template);
									self.renderAddButtonsSection(template);
								}
							});
							console.log('stop');
							return;
						}

						instance.requestPaymentMethod(function(err, payload) {
							if (err) {
								instance.clearSelectedPaymentMethod();
							} else {
								self.requestUpdateBilling({
									data: {
										data: {
											nonce: payload.nonce
										}
									},
									success: function(data) {
										console.log(data);	
										setCardHeader(_.head(_.get(data, 'credit_cards')), saveButton);
									}
								});
							}
						});
					});

					deleteButton.on('click', function() {
						setCardHeader({}, saveButton);
					});
				});
			});
		},

		renderAddButtonsSection: function(mainTemplate) {
			var self = this,
				appendTemplate = function appendTemplate() {
					var template = $(self.getTemplate({
						name: 'credit-card-buttons',
						submodule: 'billing'
					}));

					mainTemplate
						.find('.credit-card-buttons')
						.replaceWith(template);
				};

			appendTemplate();
		},

		billingBindEvents: function(template, data) {
			var self = this,
				creditCardData = _.get(data, 'billing.credit_card');

			console.log(creditCardData);
			if (_.isEmpty(creditCardData)) {
				console.log('inside here');
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

		getAccountToken: function(callback) {
			self.callApi({
				resource: 'billing.getToken',
				data: {
					accountId: self.accountId,
					generateError: false
				},
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
