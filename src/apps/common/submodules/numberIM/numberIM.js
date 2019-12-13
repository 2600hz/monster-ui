define(function(require) {
	var $ = require('jquery'),
		_ = require('lodash'),
		monster = require('monster');

	var numberIM = {
		requests: {
		},

		subscribe: {
			'common.numberIM.renderPopup': 'numberIMEdit'
		},
		numberIMEdit: function(args) {
			var self = this,
				argsCommon = {
					success: function(dataNumber) {
						self.numberIMRender(dataNumber, args.accountId, args.callbacks);
					},
					number: args.phoneNumber
				};

			if (args.hasOwnProperty('accountId')) {
				argsCommon.accountId = args.accountId;
			}

			monster.pub('common.numbers.editFeatures', argsCommon);
		},

		numberIMRender: function(dataNumber, pAccountId, callbacks) {
			var self = this,
				accountId = pAccountId || self.accountId,
				popup_html = $(self.getTemplate({
					name: 'layout',
					data: dataNumber.im || {},
					submodule: 'numberIM'
				})),
				popup;

			popup_html.find('.save').on('click', function(ev) {
				ev.preventDefault();
				var IMFormData = monster.ui.getFormData('number_im');

				$.extend(true, dataNumber, { im: IMFormData });

				self.numberIMUpdateNumber(dataNumber.id, accountId, dataNumber,
					function(data) {
						var phoneNumber = monster.util.formatPhoneNumber(data.data.id),
							template = self.getTemplate({
								name: '!' + self.i18n.active().numberIM.successUpdate,
								data: {
									phoneNumber: phoneNumber
								},
								submodule: 'numberIM'
							});

						monster.ui.toast({
							type: 'success',
							message: template
						});

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
				title: self.i18n.active().numberIM.dialogTitle
			});
		},

		numberIMUpdateNumber: function(phoneNumber, accountId, data, success, error) {
			var self = this;

			// The back-end doesn't let us set features anymore, they return the field based on the key set on that document.
			delete data.features;

			self.callApi({
				resource: 'numbers.update',
				data: {
					accountId: accountId,
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

	return numberIM;
});
