define(function(require) {
	var $ = require('jquery'),
		_ = require('lodash'),
		moment = require('moment'),
		monster = require('monster'),
		braintreeHostedFields = require('braintree-hosted-fields'),
		braintreeVaultManager = require('braintree-vault-manager');

	var creditCard = {

		appFlags: {
			creditCard: {
				container: null,
				billingHasPendingChanges: false,
				country: null,
				hostedFieldsInstance: null
			}
		},

		subscribe: {},

		creditCardRender: function(args) {
			var self = this,
				expiredCardData = args.expiredCardData,
				cards = args.cards,
				expiredMode = _.get(args, 'expiredMode', false);

			self.appFlags.creditCard.container = args.container;
			self.appFlags.creditCard.country = args.country;

			if (!expiredMode && (_.isEmpty(cards) || !_.isEmpty(expiredCardData))) {
				self.creditCardRenderAdd(args);
			} else {
				self.creditCardRenderShow(args);
			}
		},

		creditCardRenderAdd: function(args) {
			var self = this,
				$container = args.container,
				country = args.country,
				region = args.region,
				surcharge = self.billingGetCreditCardSurcharge(country, region),
				postRenderCallback = args.postRenderCallback;

			if ($container.find('.add-card-content-wrapper').length > 0) {
				postRenderCallback && postRenderCallback();
				return;
			}

			var expiredCardData = args.expiredCardData,
				$template = $(self.getTemplate({
					name: 'add-card',
					submodule: 'creditCard',
					data: {
						billingHasPendingChanges: self.appFlags.creditCard.billingHasPendingChanges
					}
				})),
				$form = $template.find('form'),
				$submitButton = $template.find('#credit_card_save'),
				$debitCardError = $template.find('.credit-card-debit-error');

			if (surcharge) {
				$template.find('.credit-card-surcharge-notice span').text(surcharge);
			} else {
				$template.find('.credit-card-surcharge-notice').hide();
			}

			$debitCardError.hide();

			$container.append($template);

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
								placeholder: '4111 1111 1111 1111',
								supportedCardBrands: country === 'US'
									? {
										'american-express': false,
										discover: false,
										jcb: false,
										'union-pay': false
									}
									: {}
							},
							expirationDate: {
								selector: '#credit_card_expiration_date',
								placeholder: 'MM / YY'
							},
							cvv: {
								selector: '#credit_card_cvv',
								placeholder: 'CVV'
							}
						}
					}, function(err, hostedFieldsInstance) {
						next(err, clientInstance, hostedFieldsInstance);
					});
				},
				_.bind(self.creditCardGetAdditionalInformation, self, self.appFlags.billing.braintreeClientToken)
			], function(err, clientInstance, hostedFieldsInstance, additionalData) {
				if (err) {
					monster.pub('monster.requestEnd', {});
					console.error(err);
					return;
				}

				self.appFlags.creditCard.hostedFieldsInstance = hostedFieldsInstance;

				self.creditCardRenderSupportedCardTypes({
					country: country
				});
				self.creditCardRenderAgreement({
					country: country
				});

				var isAgreementAccepted = country !== 'US',
					isCardValid = false,
					validateField = function(event) {
						var field = event.fields[event.emittedBy];

						if (field.isValid) {
							$(field.container)
								.removeClass('monster-invalid')
								.siblings('label')
									.hide();
							$debitCardError.hide();
						} else {
							$(field.container)
								.addClass('monster-invalid')
								.siblings('label')
									.show();
						}

						// Re-validate expiration date if car number changes, as
						// expirationDate may be marked as invalid for debit card
						if (event.emittedBy === 'number'
							&& $(event.fields.expirationDate.container).hasClass('monster-invalid')) {
							validateField(_.assign({}, event, {
								emittedBy: 'expirationDate'
							}));
						}
					};

				if (/*country === 'US' && */!_.includes(additionalData.challenges, 'cvv')) {
					var $smallControlGroups = $template.find('.control-group-small');

					$smallControlGroups.eq(0).removeClass('control-group-small');
					$smallControlGroups.eq(1).addClass('control-group-hidden');
				}

				monster.pub('monster.requestEnd', {});

				hostedFieldsInstance.on('validityChange', function(event) {
					// Check if all fields are valid, then show submit button
					isCardValid = Object.keys(event.fields).every(function(key) {
						if (key === 'cvv') {
							return _.includes(additionalData.challenges, 'cvv')
								? event.fields[key].isValid
								: event.fields[key].isPotentiallyValid;
						}
						return event.fields[key].isValid;
					});

					$submitButton.prop('disabled', !isAgreementAccepted || !isCardValid);

					validateField(event);
				});

				hostedFieldsInstance.on('blur', validateField);

				$form.find('input[name="credit_card_accept_agreement"]').on('change', function() {
					isAgreementAccepted = this.checked;

					$submitButton.prop('disabled', !isAgreementAccepted || !isCardValid);
				});

				$form.on('submit', function(event) {
					event.preventDefault();

					$submitButton.prop('disabled', true);

					monster.pub('monster.requestStart', {});
					hostedFieldsInstance.tokenize({
						vault: true,
						fieldsToTokenize: ['cardholderName', 'number', 'expirationDate'].concat(
							_.includes(additionalData.challenges, 'cvv') ? ['cvv'] : []
						)
					}, function(err, payload) {
						if (err) {
							console.error(err);
							monster.pub('monster.requestEnd', {});
							return;
						}

						if (country === 'US' && payload.binData.debit === 'Yes') {
							$debitCardError.show();
							$template.find('#credit_card_number,#credit_card_expiration_date')
								.addClass('monster-invalid')
								.siblings('label')
								.show();

							additionalData.vaultManager.deletePaymentMethod(payload.nonce, function(err) {
								if (err) {
									console.error(err);
								}

								monster.pub('monster.requestEnd', {});
							});

							return;
						}

						monster.waterfall([
							function preSubmit(next) {
								if (args.preSubmitCallback) {
									var now = moment().toDate(),
										timestamp = monster.util.dateToGregorian(now);

									args.preSubmitCallback({
										surchargeAccepted: timestamp
									}, next);
									return;
								}

								next(null);
							},
							function updateCard(next) {
								monster.parallel({
									updateBilling: function(next) {
										self.billingRequestUpdateBilling({
											data: {
												data: {
													nonce: payload.nonce
												}
											},
											success: function(data) {
												next(null, data);
											}
										});
									},
									deletedCard: function(next) {
										if (!_.isEmpty(expiredCardData)) {
											self.creditCardDelete({
												data: {
													cardId: expiredCardData.id
												},
												success: function(data) {
													next(null, data);
												}
											});
										} else {
											next(null);
										}
									}
								}, next);
							}
						], function(err, results) {
							monster.pub('monster.requestEnd', {});

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

							args.submitCallback && args.submitCallback();
						});
					});
				});

				postRenderCallback && postRenderCallback();
			});
		},

		creditCardRenderShow: function(args) {
			var self = this,
				$container = args.container,
				country = args.country,
				region = args.region,
				expiredMode = _.get(args, 'expiredMode', false);

			if ($container.find('.show-card-content-wrapper').length > 0) {
				return;
			}

			var card = _.get(args, ['cards', 0]);

			monster.waterfall([
				_.bind(self.billingCreateBraintreeClientInstance, self),
				function createVaultmanager(clientInstance, next) {
					braintreeVaultManager.create({
						client: clientInstance,
						authorization: self.appFlags.billing.braintreeClientToken
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
			], function(err, _clientInstance, _vaultInstance, vaultCard) {
				if (err) {
					console.error(err);
					return;
				}

				var $template = $(self.getTemplate({
					name: 'show-card',
					submodule: 'creditCard',
					data: {
						name: _.find([
							card.cardholder_name,
							_.get(vaultCard, 'details.cardholderName')
						]),
						number: '**** **** **** ' + card.last_four,
						cardType: card.type,
						expirationDate: card.expiration_month + '/' + card.expiration_year.slice(-2),
						expiredMode: expiredMode
					}
				}));

				if (!expiredMode && country === 'US' && _.includes(self.appFlags.billing.usStatesDeniedCreditCards, region)) {
					$template.filter('.no-card-available')
						.removeClass('no-card-available-hidden');
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
							self.creditCardDelete({
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

						args.submitCallback && args.submitCallback();
					});
				});

				$container.append($template);
			});
		},

		creditCardBillingHasPendingChanges: function(value) {
			var self = this;

			if (self.appFlags.creditCard.billingHasPendingChanges === value) {
				return;
			}

			self.appFlags.creditCard.billingHasPendingChanges = value;

			if (!self.appFlags.creditCard.container) {
				return;
			}

			var saveText = value
				? self.i18n.active().creditCard.add.saveAndAddCard
				: self.i18n.active().creditCard.add.addCard;

			self.appFlags.creditCard.container.find('#credit_card_save').text(saveText);
		},

		creditCardChangeCountry: function(args) {
			var self = this,
				country = args.country,
				$container = self.appFlags.creditCard.container;

			if (self.appFlags.creditCard.country === country) {
				return;
			}

			self.appFlags.creditCard.country = country;

			if (!$container) {
				return;
			}

			if ($container.find('.card-type-list').length === 0) {
				return;
			}

			// HACK: Update client supported card types
			self.appFlags.creditCard.hostedFieldsInstance._merchantConfigurationOptions.fields.supportedCardBrands = country === 'US'
				? {
					'american-express': false,
					discover: false,
					jcb: false,
					'union-pay': false
				}
				: {};

			self.creditCardRenderSupportedCardTypes({
				country: country
			});

			self.creditCardRenderAgreement({
				country: country
			});
		},

		creditCardRenderSupportedCardTypes: function(args) {
			var self = this,
				country = args.country;

			monster.pub('monster.requestStart', {});

			self.appFlags.creditCard.hostedFieldsInstance.getSupportedCardTypes(function(err, cardTypes) {
				var normalizedCardTypes = _.chain(cardTypes)
					.map(_.kebabCase)
					.difference(country === 'US' ? ['american-express', 'discover', 'jcb', 'union-pay'] : [])
					.value();

				var $template = $(self.getTemplate({
					name: 'card-type-list',
					submodule: 'creditCard',
					data: {
						cardTypes: normalizedCardTypes
					}
				}));

				self.appFlags.creditCard.container
					.find('.card-type-list')
						.empty()
						.append($template);

				monster.pub('monster.requestEnd', {});
			});
		},

		creditCardRenderAgreement: function(args) {
			var self = this,
				country = args.country,
				$container = self.appFlags.creditCard.container;

			if (country === 'US') {
				$container.find('.control-group-agreement').show();
				$container.find('[name="credit_card_accept_agreement"]').prop('checked', false).trigger('change');
			} else {
				$container.find('.control-group-agreement').hide();
				$container.find('[name="credit_card_accept_agreement"]').prop('checked', true).trigger('change');
			}
		},

		creditCardGetAdditionalInformation: function(authorization, clientInstance, hostedFieldsInstance, callback) {
			monster.parallel({
				vaultManager: function(next) {
					braintreeVaultManager.create({
						client: clientInstance,
						authorization: authorization
					}, function(err, vaultManagerInstance) {
						next(err, vaultManagerInstance);
					});
				},
				challenges: function(next) {
					hostedFieldsInstance.getChallenges(function(err, challenges) {
						next(err, challenges);
					});
				}
			}, function(err, results) {
				callback(err, clientInstance, hostedFieldsInstance, results);
			});
		},

		creditCardDelete: function(args) {
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
		},

		creditCardCheckStatus: function() {
			var self = this,
				isReseller = monster.util.isReseller(),
				isMasquerading = monster.util.isMasquerading(),
				isAdmin = monster.util.isAdmin();

			if (!isReseller || isMasquerading || !isAdmin) {
				return;
			}

			monster.parallel({
				account: function(next) {
					self.callApi({
						resource: 'account.get',
						data: {
							accountId: self.accountId
						},
						success: function(data) {
							next(null, data.data);
						},
						error: function() {
							next(true);
						}
					});
				},
				billing: function(next) {
					self.callApi({
						resource: 'billing.get',
						data: {
							accountId: self.accountId,
							generateError: false
						},
						success: function(data) {
							next(null, data.data);
						},
						error: function() {
							next(true);
						}
					});
				}
			}, function(err, results) {
				if (err) {
					return;
				}

				var account = results.account,
					billing = results.billing,
					isSurchargeAccepted = self.billingIsSurchargeAccepted(account),
					hasCreditCards = !_.chain(billing).get('credit_cards', []).isEmpty().value(),
					country = _.get(account, ['contact', 'billing', 'country']),
					region = _.get(account, ['contact', 'billing', 'region']),
					surcharge = self.billingGetCreditCardSurcharge(country, region),
					isCardAccepted = !!surcharge;

				if (!hasCreditCards || country !== 'US' || (isCardAccepted && isSurchargeAccepted)) {
					return;
				}

				var $template = $(self.getTemplate({
						name: 'disclaimerDialog',
						submodule: 'creditCard',
						data: {
							isCardAccepted: isCardAccepted
						}
					})),
					$acceptButton = $template.find('#myaccount_creditcard_disclaimer_accept'),
					$checkbox = $template.find('input[name="credit_card_accept_agreement"]'),
					$dialog = monster.ui.dialog($template, {
						dialogClass: isCardAccepted ? 'myaccount-creditcard-dialog' : 'myaccount-creditcard-dialog-no-card',
						title: self.i18n.active().creditCard.disclaimer[isCardAccepted ? 'title' : 'noCardTitle'],
						isPersistent: true,
						hideClose: true,
						closeOnEscape: !isCardAccepted
					}),
					$icon = isCardAccepted
						? monster.ui.getSvgIconTemplate({ id: 'telicon2--warning--triangle' })
						: monster.ui.getSvgIconTemplate({ id: 'telicon2--x--circle' });

				if (surcharge) {
					$template.find('.disclaimer-dialog-notice span').text(surcharge);
				}

				$checkbox.on('change', function() {
					$acceptButton.prop('disabled', !this.checked);
				});

				$acceptButton.on('click', function() {
					var now = moment().toDate(),
						timestamp = monster.util.dateToGregorian(now),
						updatedAccount = _.merge({}, account, {
							braintree: {
								surcharge_accepted: timestamp,
								user_id: monster.apps.auth.currentUser.id,
								first_name: monster.apps.auth.currentUser.first_name,
								last_name: monster.apps.auth.currentUser.last_name
							}
						});

					$acceptButton.prop('disabled', true);
					$checkbox.prop('disabled', true);

					self.callApi({
						resource: 'account.update',
						data: {
							accountId: updatedAccount.id,
							data: updatedAccount
						},
						success: function() {
							$dialog.dialog('close');
						},
						error: function() {
							$dialog.dialog('close');
						}
					});
				});

				$template.find('#myaccount_creditcard_disclaimer_payments')
					.on('click', function() {
						$dialog.dialog('close');
						self.showSubmodule({
							module: 'billing'
						});
					});

				$template.find('#myaccount_creditcard_disclaimer_cancel')
					.on('click', function() {
						$dialog.dialog('close');
					});

				$dialog
					.siblings('.ui-dialog-titlebar')
						.addClass('disclaimer-dialog-title')
						.prepend($icon);
			});
		}
	};

	return creditCard;
});
