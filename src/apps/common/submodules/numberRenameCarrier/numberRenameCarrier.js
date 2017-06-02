define(function(require) {
	var $ = require('jquery'),
		_ = require('underscore'),
		monster = require('monster'),
		toastr = require('toastr');

	var numberRenameCarrier = {
		requests: {
		},

		appFlags: {
			renameCarrier: {
				CUSTOM_CHOICE: '_uiCustomChoice'
			}
		},

		subscribe: {
			'common.numberRenameCarrier.renderPopup': 'numberRenameCarrierEdit'
		},
		numberRenameCarrierEdit: function(args) {
			var self = this,
				argsCommon = {
					noStateNeeded: true,
					success: function(dataNumber) {
						self.numberRenameCarrierRender(dataNumber, args.callbacks);
					},
					number: args.phoneNumber
				};

			if (args.hasOwnProperty('accountId')) {
				argsCommon.accountId = args.accountId;
			}

			monster.pub('common.numbers.editFeatures', argsCommon);
		},

		numberRenameCarrierFormatData: function(carriers, dataNumber) {
			var self = this,
				formattedData = {
					selectedCarrier: undefined,
					carriers: carriers
				};

			if (dataNumber.hasOwnProperty('_read_only') && dataNumber._read_only.hasOwnProperty('carrier_module')) {
				_.each(carriers, function(carrier) {
					if (dataNumber._read_only.carrier_module === carrier.key) {
						formattedData.selectedCarrier = dataNumber._read_only.carrier_module;
					}
				});

				if (!formattedData.selectedCarrier) {
					formattedData.selectedCarrier = self.appFlags.renameCarrier.CUSTOM_CHOICE;
					formattedData.customCarrierName = dataNumber._read_only.carrier_module;
				}
			}

			return formattedData;
		},

		numberRenameCarrierRender: function(dataNumber, callbacks) {
			var self = this;

			monster.pub('common.numbers.getCarriersModules', function(carriers) {
				var dataTemplate = self.numberRenameCarrierFormatData(carriers, dataNumber),
					popup_html = $(self.getTemplate({
						name: 'layout',
						submodule: 'numberRenameCarrier',
						data: dataTemplate
					})),
					popup;

				popup_html.find('.select-module').on('change', function() {
					popup_html.find('.custom-carrier-block').toggleClass('active', $(this).val() === self.appFlags.renameCarrier.CUSTOM_CHOICE);
				});

				popup_html.find('.save').on('click', function(ev) {
					ev.preventDefault();
					var carrierName = popup_html.find('.select-module').val();

					if (carrierName === self.appFlags.renameCarrier.CUSTOM_CHOICE) {
						carrierName = popup_html.find('#custom_carrier_value').val();
					}

					$.extend(true, dataNumber, { carrier_name: carrierName });

					self.numberPrependUpdateNumber(dataNumber.id, dataNumber,
						function(data) {
							var phoneNumber = monster.util.formatPhoneNumber(data.data.id),
								template = monster.template(self, '!' + self.i18n.active().numberRenameCarrier.successUpdate, { phoneNumber: phoneNumber, carrierName: carrierName });

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
					title: self.i18n.active().numberRenameCarrier.dialogTitle
				});
			});
		},

		numberPrependUpdateNumber: function(phoneNumber, data, success, error) {
			var self = this;

			// The back-end doesn't let us set features anymore, they return the field based on the key set on that document.
			delete data.features;

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

	return numberRenameCarrier;
});
