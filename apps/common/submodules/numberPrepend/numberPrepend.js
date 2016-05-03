define(function(require){
	var $ = require('jquery'),
		_ = require('underscore'),
		monster = require('monster'),
		toastr = require('toastr');

	var numberPrepend = {

		requests: {
		},

		subscribe: {
			'common.numberPrepend.renderPopup': 'numberPrependEdit'
		},
		numberPrependEdit: function(args) {
			var self = this,
				argsCommon = {
					success: function(dataNumber) {
						self.numberPrependRender(dataNumber, args.callbacks);
					},
					number: args.phoneNumber
				};
				
			monster.pub('common.numbers.editFeatures', argsCommon);
		},

		numberPrependRender: function(dataNumber, callbacks) {
			var self = this,
				popup_html = $(monster.template(self, 'numberPrepend-layout', dataNumber.prepend || {})),
				popup;

			popup_html.find('.save').on('click', function(ev) {
				ev.preventDefault();
				var prependFormData = monster.ui.getFormData('number_prepend');
				prependFormData.enabled = (prependFormData.name && prependFormData.name.length > 0) ? true : false;

				$.extend(true, dataNumber, { prepend: prependFormData });

				self.numberPrependUpdateNumber(dataNumber.id, dataNumber,
					function(data) {
						var phoneNumber = monster.util.formatPhoneNumber(data.data.id),
							template = monster.template(self, '!' + self.i18n.active().numberPrepend.successUpdate, { phoneNumber: phoneNumber });

						toastr.success(template);

						popup.dialog('destroy').remove();

						callbacks.success && callbacks.success(data);
					},
					function(data) {
						callbacks.error && callbacks.error(data);
					}
				);

			});

			popup_html.find('.cancel-link').on('click', function(e) {
				e.preventDefault();
				popup.dialog('destroy').remove();
			});

			popup = monster.ui.dialog(popup_html, {
				title: self.i18n.active().numberPrepend.dialogTitle
			});
		},

		numberPrependUpdateNumber: function(phoneNumber, data, success, error) {
			var self = this;

			self.callApi({
				resource: 'numbers.update',
				data: {
					accountId: self.accountId,
					phoneNumber: encodeURIComponent(phoneNumber),
					data: data
				},
				success: function(_data, status) {
					success && success(_data);
				},
				error: function(_data, status) {
					error && error(_data);
				}
			});
		}
	};

	return numberPrepend;
});
