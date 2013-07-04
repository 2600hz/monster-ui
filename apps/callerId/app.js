define(function(require){
	var $ = require('jquery'),
		_ = require('underscore'),
		monster = require('monster'),
		toastr = require('toastr');

	var app = {

		name: 'callerId',

		i18n: [ 'en-US' ],

		requests: {
			'callerId.getNumber': {
				url: 'accounts/{accountId}/phone_numbers/{phoneNumber}',
				verb: 'GET'
			},
			'callerId.updateNumber': {
				url: 'accounts/{accountId}/phone_numbers/{phoneNumber}',
				verb: 'POST'
			}
		},

		subscribe: {
			'callerId.editPopup': 'edit'
		},

		load: function(callback){
			var self = this;

			self.initApp(function() {
				callback && callback(self);
			});
		},

		initApp: function(callback) {
            var self = this;

            monster.pub('auth.initApp', {
                app: self,
                callback: callback
            });
        },

		render: function(dataNumber, callbacks) {
			var self = this,
                popup_html = $(monster.template(self, 'cnamDialog', dataNumber.cnam || {})),
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
                        self.updateNumber(dataNumber.id, dataNumber,
                            function(data) {
                                var phoneNumber = monster.util.formatPhoneNumber(data.data.id),
                                    template = monster.template(self, '!' + self.i18n.active().successCnam, { phoneNumber: phoneNumber });

                                toastr.success(template);

                				popup.dialog('destroy').remove();

                                callbacks.success && callbacks.success(data);
                            },
                            function(data) {
                                monster.ui.alert(self.i18n.active().errorUpdate + '' + data.data.message);

                                callbacks.error && callbacks.error(data);
                            }
                        );
                    }
                );
            });

            popup = monster.ui.dialog(popup_html, {
                title: self.i18n.active().dialogTitle
            });
		},

		edit: function(args) {
			var self = this;

			self.getNumber(args.phoneNumber, function(dataNumber) {
				self.render(dataNumber.data, args.callbacks);
			});
		},

		getNumber: function(phoneNumber, success, error) {
            var self = this;

            monster.request({
                resource: 'callerId.getNumber',
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

		updateNumber: function(phoneNumber, data, success, error) {
            var self = this;

            monster.request({
                resource: 'callerId.updateNumber',
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

	return app;
});
