define(function(require){
	var $ = require('jquery'),
		_ = require('underscore'),
		monster = require('monster'),
		toastr = require('toastr');

	var e911 = {

		requests: {
		},

		subscribe: {
			'common.e911.renderPopup': 'e911Edit'
		},

		e911Render: function(dataNumber, callbacks) {
			var self = this,
				popupHtml = $(monster.template(self, 'e911-dialog', dataNumber.dash_e911 || {})),
				popup;

			popupHtml.find('.icon-question-sign[data-toggle="tooltip"]').tooltip();

			popupHtml.find('#postal_code').blur(function() {
				$.getJSON('http://www.geonames.org/postalCodeLookupJSON?&country=US&callback=?', { postalcode: $(this).val() }, function(response) {
					if (response && response.postalcodes.length && response.postalcodes[0].placeName) {
						popupHtml.find('#locality').val(response.postalcodes[0].placeName);
						popupHtml.find('#region').val(response.postalcodes[0].adminName1);
					}
				});
			});

			popupHtml.find('.inline_field > input').keydown(function() {
				popup.find('.gmap_link_div').hide();
			});

			popupHtml.find('button.btn.btn-success').on('click', function(ev) {
				ev.preventDefault();

				var e911FormData = monster.ui.getFormData('e911');

				_.extend(dataNumber, { dash_e911: e911FormData });

				var callbackSuccess = function callbackSuccess(data) {
					var phoneNumber = monster.util.formatPhoneNumber(data.data.id),
						template = monster.template(self, '!' + self.i18n.active().e911.successE911, { phoneNumber: phoneNumber });

						toastr.success(template);

						popup.dialog('destroy').remove();

						callbacks.success && callbacks.success(data);
				};

				self.e911UpdateNumber(dataNumber.id, dataNumber, {
					success: function(data) {

						callbackSuccess(data);
					},
					multipleChoices: function(addresses) {
						var templatePopupAddresses = $(monster.template(self, 'e911-addressesDialog', addresses)),
							popupAddress;

						templatePopupAddresses.find('.address-option').on('click', function() {
							templatePopupAddresses.find('.address-option.active').removeClass('active');
							$(this).addClass('active');
							templatePopupAddresses.find('.save-address').removeClass('disabled');
						});

						templatePopupAddresses.find('.cancel-link').on('click', function() {
							popupAddress
								.dialog('destroy')
								.remove();
						});

						templatePopupAddresses.find('.save-address').on('click', function() {
							if (templatePopupAddresses.find('.address-option').hasClass('active')) {
								var index = templatePopupAddresses.find('.address-option.active').data('id'),
									dataAddress = addresses.details[index];

								_.extend(dataNumber, { dash_e911: dataAddress });

								self.e911UpdateNumber(dataNumber.id, dataNumber, {
									success: function(data) {
										popupAddress
											.dialog('destroy')
											.remove();

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
						accountId: self.accountId
					},
					success: function(data, status) {
						var e911Count = _.countBy(data.data.numbers, function(number) {
							return ('features' in number && number.features.indexOf('dash_e911') >= 0)
						}).true;
						
						if(e911Count > 1) {
							delete dataNumber.dash_e911;
							self.e911UpdateNumber(dataNumber.id, dataNumber, {
								success: function(data) {
									var phoneNumber = monster.util.formatPhoneNumber(data.data.id),
										template = monster.template(self, '!' + self.i18n.active().e911.successE911, { phoneNumber: phoneNumber });

									toastr.success(template);

									popup.dialog('destroy').remove();

									callbacks.success && callbacks.success(data);
								}
							});
						} else {
							monster.ui.alert(self.i18n.active().e911.lastE911Error);
						}
					}
				});
			});

			popup = monster.ui.dialog(popupHtml, {
				title: self.i18n.active().e911.dialogTitle
			});

			// Fixing the position of the rotated text using its width
			var rotatedText = popup.find('#e911_rotated_text'),
				rotatedTextOffset = rotatedText.width()/2;

			rotatedText.css({'top': 40+rotatedTextOffset +'px', 'left': 25-rotatedTextOffset +'px'});
		},

		e911Edit: function(args) {
			var self = this;

			self.e911GetNumber(args.phoneNumber, function(dataNumber) {
				self.e911Render(dataNumber.data, args.callbacks);
			});
		},

		e911GetNumber: function(phoneNumber, success, error) {
			var self = this;

			self.callApi({
				resource: 'numbers.get',
				data: {
					accountId: self.accountId,
					phoneNumber: encodeURIComponent(phoneNumber)
				},
				success: function(_data, status) {
					if(typeof success === 'function') {
						success(_data);
					}
				},
				error: function(_data, status) {
					if(typeof error === 'function') {
						error(_data);
					}
				}
			});
		},

		e911UpdateNumber: function(phoneNumber, data, callbacks) {
			var self = this;

			self.callApi({
				resource: 'numbers.update',
				data: {
					accountId: self.accountId,
					phoneNumber: encodeURIComponent(phoneNumber),
					data: data,
					generateError: false
				},
				success: function(_data, status) {
					callbacks.success && callbacks.success(_data);
				},
				error: function(_data, status) {
					if (_data.error === '400') {
						if (data.message === 'multiple_choice') {
							callbacks.multipleChoices && callbacks.multipleChoices(_data.data.multiple_choice.dash_e911);
						}
						else {
							callbacks.invalidAddress && callbacks.invalidAddress(_data.data.address.invalid);
						}
					}
					else {
						callbacks.error && callbacks.error(_data.data);
					}
				}
			});
		}
	};

	return e911;
});
