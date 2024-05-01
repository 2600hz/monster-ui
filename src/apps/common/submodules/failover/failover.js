define(function(require) {
	var $ = require('jquery'),
		_ = require('lodash'),
		monster = require('monster');

	var failover = {

		requests: {
		},

		subscribe: {
			'common.failover.renderPopup': 'failoverEdit'
		},

		failoverEdit: function(args) {
			var self = this,
				argsCommon = {
					success: function(dataNumber) {
						self.failoverRender(dataNumber, args.accountId, args.callbacks);
					},
					number: args.phoneNumber
				};

			if (args.hasOwnProperty('accountId')) {
				argsCommon.accountId = args.accountId;
			}

			monster.pub('common.numbers.editFeatures', argsCommon);
		},

		failoverRender: function(dataNumber, pAccountId, callbacks) {
			var self = this,
				accountId = pAccountId || self.accountId,
				radio = '';

			if ('failover' in dataNumber) {
				radio = 'e164' in dataNumber.failover ? 'number' : 'sip';
			}

			var	tmplData = {
					radio: radio,
					failover: dataNumber.failover,
					phoneNumber: dataNumber.id
				},
				popupHtml = $(self.getTemplate({
					name: 'dialog',
					data: tmplData,
					submodule: 'failover'
				})),
				popup;

			popupHtml.find('.failover-block[data-type="' + radio + '"]').addClass('selected');
			popupHtml.find('.failover-block:not([data-type="' + radio + '"]) input').val('');

			popupHtml.find('.failover-block input').on('keyup', function() {
				popupHtml.find('.failover-block').removeClass('selected');
				popupHtml.find('.failover-block:not([data-type="' + $(this).parents('.failover-block').first().data('type') + '"]) input[type="text"]').val('');

				$(this).parents('.failover-block').addClass('selected');
			});

			popupHtml.find('.submit_btn').on('click', function(ev) {
				ev.preventDefault();

				var failoverFormData = { failover: {} },
					type = popupHtml.find('.failover-block.selected').data('type');

				if (type === 'number' || type === 'sip') {
					failoverFormData.rawInput = popupHtml.find('.failover-block[data-type="' + type + '"] input').val();

					if (failoverFormData.rawInput.match(/^sip:/)) {
						failoverFormData.failover.sip = failoverFormData.rawInput;
					} else {
						failoverFormData.failover.e164 = failoverFormData.rawInput;
					}

					delete failoverFormData.rawInput;

					_.extend(dataNumber, failoverFormData);

					if (dataNumber.failover.e164 || dataNumber.failover.sip) {
						self.failoverUpdateNumber(dataNumber.id, accountId, dataNumber,
							function(data) {
								var phoneNumber = monster.util.formatPhoneNumber(data.data.id),
									template = self.getTemplate({
										name: '!' + self.i18n.active().failover.successFailover,
										data: {
											phoneNumber: phoneNumber
										},
										submodule: 'failover'
									});

								monster.ui.toast({
									type: 'success',
									message: template
								});

								popup.dialog('close');

								callbacks.success && callbacks.success(data);
							},
							function(data) {
								monster.ui.alert(self.i18n.active().failover.errorUpdate + '' + data.data.message);

								callbacks.error && callbacks.error(data);
							}
						);
					} else {
						monster.ui.alert(self.i18n.active().failover.invalidFailoverNumber);
					}
				} else {
					monster.ui.alert(self.i18n.active().failover.noDataFailover);
				}
			});

			popupHtml.find('.remove_failover').on('click', function(ev) {
				ev.preventDefault();

				delete dataNumber.failover;

				self.failoverUpdateNumber(dataNumber.id, accountId, dataNumber,
					function(data) {
						var phoneNumber = monster.util.formatPhoneNumber(data.data.id),
							template = self.getTemplate({
								name: '!' + self.i18n.active().failover.successRemove,
								data: {
									phoneNumber: phoneNumber
								},
								submodule: 'failover'
							});

						monster.ui.toast({
							type: 'success',
							message: template
						});

						popup.dialog('close');

						callbacks.success && callbacks.success(data);
					},
					function(data) {
						monster.ui.alert(self.i18n.active().failover.errorUpdate + '' + data.data.message);

						callbacks.error && callbacks.error(data);
					}
				);
			});

			popup = monster.ui.dialog(popupHtml, {
				title: self.i18n.active().failover.failoverTitle,
				width: '540px'
			});
		},

		failoverUpdateNumber: function(phoneNumber, accountId, data, success, error) {
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
					if (typeof success === 'function') {
						success(_data);
					}
				},
				error: function(_data, status) {
					if (typeof error === 'function') {
						error(_data);
					}
				}
			});
		}
	};

	return failover;
});
