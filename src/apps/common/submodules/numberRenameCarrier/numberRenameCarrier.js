define(function(require) {
	var $ = require('jquery'),
		_ = require('lodash'),
		monster = require('monster');

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
						self.numberRenameCarrierRender(dataNumber, args.accountId, args.callbacks);
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

			if (dataNumber.hasOwnProperty('metadata') && dataNumber.metadata.hasOwnProperty('carrier_module')) {
				_.each(carriers, function(carrier) {
					if (dataNumber.metadata.carrier_module === carrier.key) {
						formattedData.selectedCarrier = dataNumber.metadata.carrier_module;
					}
				});

				if (!formattedData.selectedCarrier) {
					formattedData.selectedCarrier = self.appFlags.renameCarrier.CUSTOM_CHOICE;
					formattedData.customCarrierName = dataNumber._read_only.carrier_module;
				}
			}

			return formattedData;
		},

		numberRenameCarrierRender: function(dataNumber, pAccountId, callbacks) {
			var self = this,
				accountId = pAccountId || self.accountId;

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

					self.numberRenameCarrierUpdateNumber(dataNumber.id, accountId, dataNumber,
						function(data) {
							var phoneNumber = monster.util.formatPhoneNumber(data.data.id),
								template = self.getTemplate({
									name: '!' + self.i18n.active().numberRenameCarrier.successUpdate,
									data: {
										phoneNumber: phoneNumber,
										carrierName: carrierName
									},
									submodule: 'numberRenameCarrier'
								});

							monster.ui.toast({
								type: 'success',
								message: template
							});

							popup.dialog('close');

							callbacks.success && callbacks.success(data);
						},
						function(data) {
							callbacks.error && callbacks.error(data);
						}
					);
				});

				popup_html.find('.cancel-link').on('click', function(e) {
					e.preventDefault();
					popup.dialog('close');
				});

				popup = monster.ui.dialog(popup_html, {
					title: self.i18n.active().numberRenameCarrier.dialogTitle
				});
			});
		},

		numberRenameCarrierUpdateNumber: function(phoneNumber, accountId, data, success, error) {
			var self = this;

			// The back-end doesn't let us set features anymore, they return the field based on the key set on that document.
			delete data.features;
			delete data.metadata;

			self.callApi({
				resource: 'numbers.update',
				data: {
					accountId: accountId,
					phoneNumber: phoneNumber,
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
