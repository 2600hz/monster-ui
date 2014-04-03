define(function(require){
	var $ = require('jquery'),
		_ = require('underscore'),
		monster = require('monster'),
		toastr = require('toastr');

	var callerId = {

		requests: {
			'common.callerId.getNumber': {
				url: 'accounts/{accountId}/phone_numbers/{phoneNumber}',
				verb: 'GET'
			},
			'common.callerId.updateNumber': {
				url: 'accounts/{accountId}/phone_numbers/{phoneNumber}',
				verb: 'POST'
			}
		},

		subscribe: {
			'common.callerId.renderPopup': 'callerIdEdit'
		},

		callerIdRender: function(dataNumber, callbacks) {
			var self = this,
                popup_html = $(monster.template(self, 'callerId-layout', dataNumber.cnam || {})),
                popup;

            $('button.btn.btn-success', popup_html).click(function(ev) {
                ev.preventDefault();

                var cnamFormData = form2object('cnam');

				_.extend(dataNumber, { cnam: cnamFormData });

				if(cnamFormData.display_name === '') {
					delete dataNumber.cnam;
				}

				monster.ui.confirm(self.i18n.active().chargeReminder.line1 + '<br/><br/>' + self.i18n.active().chargeReminder.line2,
                    function() {
                        self.callerIdUpdateNumber(dataNumber.id, dataNumber,
                            function(data) {
                                var phoneNumber = monster.util.formatPhoneNumber(data.data.id),
                                    template = monster.template(self, '!' + self.i18n.active().callerId.successCnam, { phoneNumber: phoneNumber });

                                toastr.success(template);

                				popup.dialog('destroy').remove();

                                callbacks.success && callbacks.success(data);
                            },
                            function(data) {
                                monster.ui.alert(self.i18n.active().callerId.errorUpdate + '' + data.data.message);

                                callbacks.error && callbacks.error(data);
                            }
                        );
                    }
                );
            });

			$('button.btn.btn-danger', popup_html).click(function(ev) {
				if( dataNumber.cnam ) {
					delete dataNumber.cnam;

					self.callerIdUpdateNumber(dataNumber.id, dataNumber, function(data) {
						var phoneNumber = monster.util.formatPhoneNumber(data.data.id),
							template = monster.template(self, '!' + self.i18n.active().callerId.successRemoveCnam, { phoneNumber: phoneNumber });

						toastr.success(template);

						popup.dialog('destroy').remove();

						callbacks.success && callbacks.success(data);
					});
				} else {
					var phoneNumber = monster.util.formatPhoneNumber(dataNumber.id),
						template = monster.template(self, '!' + self.i18n.active().callerId.noCallerId, { phoneNumber: phoneNumber });

					toastr.warning(template);
				}
			});

            popup = monster.ui.dialog(popup_html, {
                title: self.i18n.active().callerId.dialogTitle
            });
		},

		callerIdEdit: function(args) {
			var self = this;

			self.callerIdGetNumber(args.phoneNumber, function(dataNumber) {
				self.callerIdRender(dataNumber.data, args.callbacks);
			});
		},

		callerIdGetNumber: function(phoneNumber, success, error) {
            var self = this;

            monster.request({
                resource: 'common.callerId.getNumber',
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

		callerIdUpdateNumber: function(phoneNumber, data, success, error) {
            var self = this;

            monster.request({
                resource: 'common.callerId.updateNumber',
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

	return callerId;
});
