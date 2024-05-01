define(function(require) {
	var $ = require('jquery'),
		_ = require('lodash'),
		monster = require('monster'),
		braintreeClient = require('braintree-client'),
		braintreeHostedFields = require('braintree-hosted-fields'),
		braintreeVaultManager = require('braintree-vault-manager');

	var creditCard = {

		appFlags: {},

		subscribe: {},

		creditCardRender: function(args) {
			var self = this,
				expiredCardData = args.expiredCardData,
				cards = args.cards;

			if (_.isEmpty(cards) || !_.isEmpty(expiredCardData)) {
				self.creditCardRenderAdd(args);
			} else {
				self.creditCardRenderShow(args);
			}
		},

		creditCardRenderAdd: function(args) {
			var self = this,
				$container = args.container;

			if ($container.find('.add-card-content-wrapper').length > 0) {
				return;
			}

			var expiredCardData = args.expiredCardData,
				$template = $(self.getTemplate({
					name: 'add-card',
					submodule: 'creditCard'
				})),
				$form = $template.find('form'),
				$submitButton = $template.find('#credit_card_save');

			$container.empty().append($template);

			monster.pub('monster.requestStart', {});

			monster.waterfall([
				_.bind(self.billingCreateBraintreeClientInstance, self),
				function createHostedFields(clientInstance, next) {
					braintreeHostedFields.create({
						preventAutofill: false,
						client: clientInstance,
						styles: {},
						fields: {
							cardholderName: {
								selector: '#credit_card_name',
								placeholder: 'Jon Doe'
							},
							number: {
								selector: '#credit_card_number',
								placeholder: '4111 1111 1111 1111'
							},
							expirationDate: {
								selector: '#credit_card_expiration_date',
								placeholder: 'MM / YY'
							}
						}
					}, function(err, hostedFieldsInstance) {
						next(err, clientInstance, hostedFieldsInstance);
					});
				}
			], function(err, clientInstance, hostedFieldsInstance) {
				monster.pub('monster.requestEnd', {});

				if (err) {
					console.error(err);
					return;
				}

				var validateField = function(event) {
					var field = event.fields[event.emittedBy];

					if (field.isValid) {
						$(field.container)
							.removeClass('monster-invalid')
							.siblings('label')
								.hide();
					} else {
						$(field.container)
							.addClass('monster-invalid')
							.siblings('label')
								.show();
					}
				};

				hostedFieldsInstance.on('validityChange', function(event) {
					// Check if all fields are valid, then show submit button
					var formValid = Object.keys(event.fields).every(function(key) {
						return event.fields[key].isValid;
					});

					$submitButton.prop('disabled', !formValid);

					validateField(event);
				});

				hostedFieldsInstance.on('blur', validateField);

				$form.on('submit', function(event) {
					event.preventDefault();

					$submitButton.prop('disabled', true);

					hostedFieldsInstance.tokenize({ vault: true }, function(err, payload) {
						if (err) {
							console.err(err);
							return;
						}

						monster.parallel({
							updateBilling: function(callback) {
								self.billingRequestUpdateBilling({
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
								if (!_.isEmpty(expiredCardData)) {
									self.deleteCardBilling({
										data: {
											cardId: expiredCardData.id
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
							if (err) {
								monster.ui.toast({
									type: 'error',
									message: self.i18n.active().creditCard.addFailure
								});

								return;
							}

							monster.ui.toast({
								type: 'success',
								message: self.getTemplate({
									name: '!' + self.i18n.active().creditCard.addSuccess,
									data: {
										variable: _.get(results.updateBilling.credit_cards, [0, 'last_four'])
									}
								})
							});

							args.callback && args.callback();
						});
					});
				});
			});
		},

		creditCardRenderShow: function(args) {
			var self = this,
				card = _.get(args, ['cards', 0]),
				$container = args.container,
				$template = $(self.getTemplate({
					name: 'show-card',
					submodule: 'creditCard',
					data: {
						name: card.cardholder_name,
						number: '**** **** **** ' + card.last_four,
						cardType: card.type,
						expirationDate: card.expiration_month + '/' + card.expiration_year.slice(-2)
					}
				}));

			$container.empty().append($template);

			monster.waterfall([
				function createClientInstance(next) {
					braintreeClient.create({
						authorization: args.authorization
					}, next);
				},
				function createVaultmanager(clientInstance, next) {
					braintreeVaultManager.create({
						client: clientInstance,
						authorization: args.authorization
					}, function(err, hostedFieldsInstance) {
						next(err, clientInstance, hostedFieldsInstance);
					});
				},
				function fetchPaymentMethods(clientInstance, vaultInstance, next) {
					vaultInstance.fetchPaymentMethods(function(err, payload) {
						if (err) {
							return next(err);
						}

						var vaultCard = _.find(payload, function(payment) {
							return payment.details.bin === card.bin && payment.details.lastFour === card.last_four;
						});

						next(err, clientInstance, vaultInstance, vaultCard);
					});
				}
			], function(err, clientInstance, vaultInstance, vaultCard) {
				if (err) {
					console.error(err);
					return;
				}

				$template.find('#credit_card_delete').on('click', function(event) {
					event.preventDefault();

					$(this).prop('disabled', true);

					monster.waterfall([
						// It seems that either the vault or kazoo can be used to delete the card
						function deleteVaultCard(next) {
							//vaultInstance.deletePaymentMethod(vaultCard.nonce, next);
							next(null);
						},
						function deleteBilling(next) {
							self.deleteCardBilling({
								data: {
									cardId: card.id
								},
								success: function(data) {
									next(null, data);
								}
							});
						}
					], function(err, result) {
						if (err) {
							monster.ui.toast({
								type: 'error',
								message: self.getTemplate({
									name: '!' + self.i18n.active().creditCard.removeFailure,
									data: {
										variable: card.last_four
									}
								})
							});
							return;
						}

						monster.ui.toast({
							type: 'success',
							message: self.getTemplate({
								name: '!' + self.i18n.active().creditCard.removeSuccess,
								data: {
									variable: card.last_four
								}
							})
						});

						args.callback && args.callback();
					});
				});
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

	return creditCard;
});
