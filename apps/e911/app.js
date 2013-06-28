define(function(require){
	var $ = require('jquery'),
		_ = require('underscore'),
		monster = require('monster'),
		toastr = require('toastr');

	var app = {

		name: 'e911',

		i18n: [ 'en-US' ],

		requests: {
			'e911.getNumber': {
				url: 'accounts/{accountId}/phone_numbers/{phoneNumber}',
				verb: 'GET'
			},
			'e911.updateNumber': {
				url: 'accounts/{accountId}/phone_numbers/{phoneNumber}',
				verb: 'POST'
			}
		},

		subscribe: {
			'e911.editPopup': 'edit'
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
                popupHtml = $(monster.template(self, 'e911Dialog', dataNumber.dash_e911 || {})),
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
                        self.updateNumber(dataNumber.id, dataNumber,
                            function(data) {
                                var phoneNumber = monster.util.formatPhoneNumber(data.data.id),
                                    template = monster.template(self, '!' + self.i18n.active().successE911, { phoneNumber: phoneNumber });

                                toastr.success(template);

                				popup.dialog('destroy').remove();

                                callbacks.success && callbacks.success(data);
                            },
                            function(data, status) {
                                monster.ui.alert(self.i18n.active().errorUpdate + ': ' + data.message);

                                callbacks.error && callbacks.error(data);
                            }
                        );
                    }
                );
            });

            popup = monster.ui.dialog(popupHtml, {
                title: self.i18n.active().dialogTitle
            });

			// Fixing the position of the rotated text using its width
            var rotatedText = popup.find('#e911_rotated_text'),
                rotatedTextOffset = rotatedText.width()/2;

            rotatedText.css({'top': 40+rotatedTextOffset +'px', 'left': 25-rotatedTextOffset +'px'});
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
                resource: 'e911.getNumber',
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
                resource: 'e911.updateNumber',
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
