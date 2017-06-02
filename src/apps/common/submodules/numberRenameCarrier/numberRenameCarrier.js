define(function(require) {
	var $ = require('jquery'),
		_ = require('underscore'),
		monster = require('monster'),
		toastr = require('toastr');

	var numberRenameCarrier = {
		requests: {
		},

		subscribe: {
			'common.numberRenameCarrier.renderPopup': 'numberRenameCarrierEdit'
		},
		numberRenameCarrierEdit: function(args) {
			var self = this,
				argsCommon = {
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

		numberRenameCarrierFormatData: function() {
			var self = this,
				formattedData = {
					selectedCarrier: undefined,
					carriers: [
						{
							key: 'bandwidth2',
							friendlyValue: 'bandwidth2'
						},
						{
							key: 'bandwidth',
							friendlyValue: 'bandwidth'
						},
						{
							key: 'inum',
							friendlyValue: 'inum'
						},
						{
							key: 'local',
							friendlyValue: 'local'
						},
						{
							key: 'managed',
							friendlyValue: 'managed'
						},
						{
							key: 'mdn',
							friendlyValue: 'mdn'
						},
						{
							key: 'other',
							friendlyValue: 'other'
						},
						{
							key: 'reserved',
							friendlyValue: 'reserved'
						},
						{
							key: 'reserved_reseller',
							friendlyValue: 'reserved_reseller'
						},
						{
							key: 'simwood',
							friendlyValue: 'simwood'
						},
						{
							key: 'telnyx',
							friendlyValue: 'telnyx'
						},
						{
							key: 'vitelity',
							friendlyValue: 'vitelity'
						},
						{
							key: 'voip_innovations',
							friendlyValue: 'voip_innovations'
						}
					]
				};

			if (monster.util.isSuperDuper()) {
				formattedData.carriers.push({
					key: '_uiCustomChoice',
					friendlyValue: self.i18n.active().numberRenameCarrier.custom
				});
			}

			return formattedData;
		},

		numberRenameCarrierRender: function(dataNumber, callbacks) {
			var self = this,
				dataTemplate = self.numberRenameCarrierFormatData(),
				CUSTOM_CHOICE = '_uiCustomChoice',
				popup_html = $(self.getTemplate({
					name: 'layout',
					submodule: 'numberRenameCarrier',
					data: dataTemplate
				})),
				popup;

			popup_html.find('.select-module').on('change', function() {
				popup_html.find('.custom-carrier-block').toggleClass('active', $(this).val() === CUSTOM_CHOICE);
			});

			popup_html.find('.save').on('click', function(ev) {
				ev.preventDefault();
				var carrierName = popup_html.find('.select-module').val();

				if (carrierName === CUSTOM_CHOICE) {
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
