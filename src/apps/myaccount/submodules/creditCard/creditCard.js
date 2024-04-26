define(function(require) {
	var $ = require('jquery'),
		_ = require('lodash'),
		monster = require('monster'),
		braintreeClient = require('braintree-client'),
		braintreeHostedFields = require('braintree-hosted-fields');

	var creditCard = {

		appFlags: {},

		subscribe: {},

		creditCardRender: function(args) {
			var self = this,
				$container = args.container,
				expiredCardData = args.expiredCardData,
				$template = $(self.getTemplate({
					name: 'layout',
					submodule: 'creditCard'
				})),
				$form = $template.find('form'),
				$submitButton = $template.find('#credit_card_save');

			$container.append($template);

			monster.waterfall([
				function createBraintreeInstance(next) {
					braintreeClient.create({
						authorization: args.authorization
					}, next);
				},
				function createHostedFields(clientInstance, next) {
					braintreeHostedFields.create({
						preventAutofill: false,
						client: clientInstance,
						styles: {
							input: {
								// change input styles to match
								// bootstrap styles
								/*'font-size': '1rem',
								color: '#495057'*/
							}
						},
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
				if (err) {
					console.error(err);
					return;
				}

				hostedFieldsInstance.on('validityChange', function(event) {
					// Check if all fields are valid, then show submit button
					var formValid = Object.keys(event.fields).every(function (key) {
						return event.fields[key].isValid;
					});

					$submitButton.prop('disabled', !formValid);
				});

				$form.on('submit', function(event) {
					event.preventDefault();

					hostedFieldsInstance.tokenize({ vault: true }, function(err, payload) {
						if (err) {
							console.err(err);
							return;
						}

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
							//setCardHeader(_.head(_.get(results, 'updateBilling.credit_cards')), saveButton);

							if (results.deletedCard) {
								//billingTemplate.find('.card-expired').hide();
							}
						});
					});
				});
			});
		}
	};

	return creditCard;
});
