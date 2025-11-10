define(function(require) {
	var $ = require('jquery'),
		_ = require('lodash'),
		monster = require('monster');

	var e911 = {

		requests: {
			'google.geocode.address': {
				apiRoot: '//maps.googleapis.com/',
				url: 'maps/api/geocode/json?address={zipCode}',
				verb: 'GET',
				generateError: false,
				removeHeaders: [
					'X-Kazoo-Cluster-ID',
					'X-Auth-Token',
					'Content-Type'
				]
			}
		},

		subscribe: {
			'common.e911.renderPopup': 'e911Edit'
		},

		e911Edit: function(args) {
			var self = this,
				argsCommon = {
					success: function(dataNumber) {
						self.e911Render(dataNumber, args.accountId, args.callbacks);
					},
					number: args.phoneNumber
				};

			if (args.hasOwnProperty('accountId')) {
				argsCommon.accountId = args.accountId;
			}

			monster.pub('common.numbers.editFeatures', argsCommon);
		},

		e911Render: function(dataNumber, pAccountId, callbacks) {
			var self = this,
				accountId = pAccountId || self.accountId,
				popupHtml = $(self.getTemplate({
					name: 'dialog',
					data: self.e911Format(dataNumber.e911),
					submodule: 'e911'
				})),
				popup;

			monster.ui.validate(popupHtml, {
				rules: {
					notification_contact_emails: {
						listOf: 'email'
					}
				}
			});

			popupHtml.find('#postal_code').change(function() {
				var zipCode = $(this).val();

				if (zipCode) {
					self.e911GetAddressFromZipCode({
						data: {
							zipCode: zipCode
						},
						success: function(results) {
							if (!_.isEmpty(results)) {
								var length = results[0].address_components.length;

								popupHtml.find('#locality').val(results[0].address_components[1].long_name);
								// Last component is country, before last is state, before can be county if exists or city if no county, so we had to change from 3 to length-2.
								popupHtml.find('#region').val(results[0].address_components[length - 2].short_name);
							}
						}
					});
				}
			});

			popupHtml.find('.inline_field > input').keydown(function() {
				popup.find('.gmap_link_div').hide();
			});

			popupHtml.find('#submit_btn').on('click', function(ev) {
				ev.preventDefault();

				if (!monster.ui.valid(popupHtml)) {
					return;
				}

				var e911FormData = self.e911Normalize(monster.ui.getFormData('e911'));

				_.extend(dataNumber, { e911: e911FormData });

				var callbackSuccess = function callbackSuccess(data) {
					var phoneNumber = monster.util.formatPhoneNumber(data.data.id),
						template = self.getTemplate({
							name: '!' + self.i18n.active().e911.successE911,
							data: {
								phoneNumber: phoneNumber
							},
							submodule: 'e911'
						});

					monster.ui.toast({
						type: 'success',
						message: template
					});

					popup.dialog('close');

					callbacks.success && callbacks.success(data);
				};

				self.e911UpdateNumber(dataNumber.id, accountId, dataNumber, {
					success: function(data) {
						callbackSuccess(data);
					},
					multipleChoices: function(addresses) {
						var templatePopupAddresses = $(self.getTemplate({
								name: 'addressesDialog',
								data: addresses,
								submodule: 'e911'
							})),
							popupAddress;

						templatePopupAddresses.find('.address-option').on('click', function() {
							templatePopupAddresses.find('.address-option.active').removeClass('active');
							$(this).addClass('active');
							templatePopupAddresses.find('.save-address').removeClass('disabled');
						});

						templatePopupAddresses.find('.cancel-link').on('click', function() {
							popupAddress.dialog('close');
						});

						templatePopupAddresses.find('.save-address').on('click', function() {
							if (templatePopupAddresses.find('.address-option').hasClass('active')) {
								var index = templatePopupAddresses.find('.address-option.active').data('id'),
									dataAddress = addresses.details[index];

								_.extend(dataNumber, { e911: dataAddress });

								self.e911UpdateNumber(dataNumber.id, accountId, dataNumber, {
									success: function(data) {
										popupAddress.dialog('close');

										callbackSuccess(data);
									}
								});
							}
						});

						popupAddress = monster.ui.dialog(templatePopupAddresses, {
							title: self.i18n.active().e911.chooseAddressPopup.title
						});
					},
					invalidAddress: function(data) {
						monster.ui.alert('error', self.i18n.active().e911.invalidAddress);
					}
				});
			});

			popupHtml.find('#remove_e911_btn').on('click', function(e) {
				e.preventDefault();

				self.callApi({
					resource: 'numbers.list',
					data: {
						accountId: accountId
					},
					success: function(data, status) {
						var e911Count = _.countBy(data.data.numbers, function(number) {
							return (number.hasOwnProperty('features') && number.features.indexOf('e911') >= 0);
						}).true;

						if (e911Count > 1) {
							delete dataNumber.e911;

							self.e911UpdateNumber(dataNumber.id, accountId, dataNumber, {
								success: function(data) {
									var phoneNumber = monster.util.formatPhoneNumber(data.data.id),
										template = self.getTemplate({
											name: '!' + self.i18n.active().e911.successE911,
											data: {
												phoneNumber: phoneNumber
											},
											submodule: 'e911'
										});

									monster.ui.toast({
										type: 'success',
										message: template
									});

									popup.dialog('close');

									callbacks.success && callbacks.success(data);
								}
							});
						} else {
							monster.ui.alert(self.i18n.active().e911.lastE911Error);
						}
					}
				});
			});

			popupHtml.find('.cancel-link').on('click', function(event) {
				event.preventDefault();

				popup.dialog('close');
			});

			popup = monster.ui.dialog(popupHtml, {
				title: self.i18n.active().e911.dialogTitle
			});

			// Fixing the position of the rotated text using its width
			var rotatedText = popup.find('#e911_rotated_text'),
				rotatedTextOffset = rotatedText.width() / 2;

			rotatedText.css({
				top: 40 + rotatedTextOffset + 'px',
				left: 25 - rotatedTextOffset + 'px'
			});
		},

		e911Format: function(data) {
			if (_.isUndefined(data)) {
				return;
			}

			data.full_street_address = _.get(data, 'legacy_data.house_number') + ' ' + _.get(data, 'street_address');
			return _.merge({}, data, {
				notification_contact_emails: _
					.chain(data)
					.get('notification_contact_emails', [])
					.join(' ')
					.value()
			});
		},

		e911Normalize: function(data) {
			var splitAddress = data.street_address.split(/\s/g);
			data.caller_name = monster.apps.auth.currentAccount.name;
			data.legacy_data = {
				house_number: _.head(splitAddress)
			};
			data.street_address = splitAddress.slice(1).join(' ');

			return _.merge({}, data, {
				notification_contact_emails: _
					.chain(data)
					.get('notification_contact_emails', '')
					.trim()
					.toLower()
					.split(' ')
					.reject(_.isEmpty)
					.uniq()
					.value()
			});
		},

		e911UpdateNumber: function(phoneNumber, accountId, data, callbacks) {
			var self = this;

			// The back-end doesn't let us set features anymore, they return the field based on the key set on that document.
			delete data.features;
			delete data.metadata;

			self.callApi({
				resource: 'numbers.update',
				data: {
					accountId: accountId,
					phoneNumber: phoneNumber,
					data: data,
					generateError: false
				},
				success: function(_data, status) {
					callbacks.success && callbacks.success(_data);
				},
				error: function(_data, status, globalHandler) {
					if (_data.error === '400') {
						if (data.message === 'multiple_choice') {
							callbacks.multipleChoices && callbacks.multipleChoices(_data.data.multiple_choice.e911);
						} else {
							callbacks.invalidAddress && callbacks.invalidAddress();
						}
					} else {
						globalHandler(_data, { generateError: true });
					}
				}
			});
		},

		e911GetAddressFromZipCode: function(args) {
			var self = this;

			monster.request({
				resource: 'google.geocode.address',
				data: args.data,
				success: function(data, status) {
					args.hasOwnProperty('success') && args.success(data.results);
				},
				error: function(errorPayload, data, globalHandler) {
					args.hasOwnProperty('error') ? args.error() : globalHandler(data, { generateError: true });
				}
			});
		}
	};

	return e911;
});
