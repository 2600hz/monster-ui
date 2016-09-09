define(function(require){
	var $ = require('jquery'),
		_ = require('underscore'),
		monster = require('monster'),
		toastr = require('toastr');

	var callerId = {

		requests: {
		},

		subscribe: {
			'common.callerId.renderPopup': 'callerIdEdit'
		},

		callerIdEdit: function(args) {
			var self = this,
				argsCommon = {
					success: function(dataNumber) {
						self.callerIdRender(dataNumber, args.callbacks);
					},
					number: args.phoneNumber
				};
				
			monster.pub('common.numbers.editFeatures', argsCommon);
		},

		callerIdRender: function(dataNumber, callbacks) {
			var self = this,
				popup_html = $(monster.template(self, 'callerId-layout', dataNumber.cnam || {})),
				popup,
				form = popup_html.find('#cnam');

			monster.ui.validate(form, {
				rules: {
					'display_name': {
						minlength:1,
						maxlength: 15
					}
				}
			});

			popup_html.find('.save').on('click', function(ev) {
				ev.preventDefault();

				if(monster.ui.valid(form)) {
					var cnamFormData = monster.ui.getFormData('cnam');

					_.extend(dataNumber, { cnam: cnamFormData });

					if(cnamFormData.display_name === '') {
						delete dataNumber.cnam.display_name;
					}

					self.callerIdUpdateNumber(dataNumber.id, dataNumber,
						function(data) {
							var phoneNumber = monster.util.formatPhoneNumber(data.data.id),
								template = monster.template(self, '!' + self.i18n.active().callerId.successCnam, { phoneNumber: phoneNumber });

							toastr.success(template);

							popup.dialog('destroy').remove();

							callbacks.success && callbacks.success(data);
						},
						function(data) {
							callbacks.error && callbacks.error(data);
						}
					);
				}
			});

			popup_html.find('.cancel-link').on('click', function(e) {
				e.preventDefault();
				popup.dialog('destroy').remove();
			});

			popup = monster.ui.dialog(popup_html, {
				title: self.i18n.active().callerId.dialogTitle
			});
		},

		callerIdUpdateNumber: function(phoneNumber, data, success, error) {
			var self = this;

			self.callApi({
				resource: 'numbers.update',
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
