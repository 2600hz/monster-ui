define(function(require){
	var $ = require('jquery'),
		_ = require('underscore'),
		monster = require('monster'),
		toastr = require('toastr');

	var e911 = {

		requests: {
			'common.e911.getNumber': {
				url: 'accounts/{accountId}/phone_numbers/{phoneNumber}',
				verb: 'GET'
			},
			'common.e911.updateNumber': {
				url: 'accounts/{accountId}/phone_numbers/{phoneNumber}',
				verb: 'POST'
			},
			'common.e911.listNumber': {
				url: 'accounts/{accountId}/phone_numbers',
				verb: 'GET'
			}
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

				var e911FormData = form2object('e911');

				_.extend(dataNumber, { dash_e911: e911FormData });

				monster.ui.confirm(self.i18n.active().chargeReminder.line1 + '<br/><br/>' + self.i18n.active().chargeReminder.line2,
					function() {
						self.e911UpdateNumber(dataNumber.id, dataNumber,
							function(data) {
								var phoneNumber = monster.util.formatPhoneNumber(data.data.id),
									template = monster.template(self, '!' + self.i18n.active().e911.successE911, { phoneNumber: phoneNumber });

								toastr.success(template);

								popup.dialog('destroy').remove();

								callbacks.success && callbacks.success(data);
							},
							function(data, status) {
								monster.ui.alert(self.i18n.active().e911.errorUpdate + ': ' + data.message);

								callbacks.error && callbacks.error(data);
							}
						);
					}
				);
			});

			popupHtml.find('#remove_e911_btn').on('click', function(e) {
				e.preventDefault();

				monster.request({
					resource: 'common.e911.listNumber',
					data: {
						accountId: self.accountId
					},
					success: function(data, status) {
						var e911Count = _.countBy(data.data.numbers, function(number) {
							return ('features' in number && number.features.indexOf('dash_e911') >= 0)
						}).true;
						
						if(e911Count > 1) {
							monster.ui.confirm(self.i18n.active().chargeReminder.line1 + '<br/><br/>' + self.i18n.active().chargeReminder.line2,
								function() {
									delete dataNumber.dash_e911;
									self.e911UpdateNumber(dataNumber.id, dataNumber,
										function(data) {
											var phoneNumber = monster.util.formatPhoneNumber(data.data.id),
												template = monster.template(self, '!' + self.i18n.active().e911.successE911, { phoneNumber: phoneNumber });

											toastr.success(template);

											popup.dialog('destroy').remove();

											callbacks.success && callbacks.success(data);
										},
										function(data, status) {
											monster.ui.alert(self.i18n.active().e911.errorUpdate + ': ' + data.message);

											callbacks.error && callbacks.error(data);
										}
									);
								}
							);
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

			monster.request({
				resource: 'common.e911.getNumber',
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

		e911UpdateNumber: function(phoneNumber, data, success, error) {
			var self = this;

			monster.request({
				resource: 'common.e911.updateNumber',
				data: {
					accountId: self.accountId,
					phoneNumber: encodeURIComponent(phoneNumber),
					data: data
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
		}
	};

	return e911;
});
