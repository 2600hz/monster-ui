define(function(require){
	var $ = require('jquery'),
		_ = require('underscore'),
		monster = require('monster'),
		toastr = require('toastr');

	var failover = {

		requests: {
		},

		subscribe: {
			'common.failover.renderPopup': 'failoverEdit'
		},

		failoverRender: function(dataNumber, callbacks) {
			var self = this,
				radio = '';

			if('failover' in dataNumber) {
				radio = 'e164' in dataNumber.failover ? 'number' : 'sip'
			}

			var	tmplData = {
					radio: radio,
					failover: dataNumber.failover,
					phoneNumber: dataNumber.id
				},
				popupHtml = $(monster.template(self, 'failover-dialog', tmplData)),
				popup;

			popupHtml.find('.failover-block[data-type="'+radio+'"]').addClass('selected');
			popupHtml.find('.failover-block:not([data-type="'+radio+'"]) input').val('');

			popupHtml.find('.failover-block input').on('keyup', function() {
				popupHtml.find('.failover-block').removeClass('selected');
				popupHtml.find('.failover-block:not([data-type="'+$(this).parents('.failover-block').first().data('type')+'"]) input[type="text"]').val('');

				$(this).parents('.failover-block').addClass('selected');
			});

			popupHtml.find('.submit_btn').on('click', function(ev) {
				ev.preventDefault();

				var failoverFormData = { failover: {} },
					type = popupHtml.find('.failover-block.selected').data('type'),
					result;

				if(type === 'number' || type === 'sip') {
					failoverFormData.rawInput = popupHtml.find('.failover-block[data-type="'+type+'"] input').val();

					if(failoverFormData.rawInput.match(/^sip:/)) {
						failoverFormData.failover.sip = failoverFormData.rawInput;
					}
					else {
						failoverFormData.failover.e164 = failoverFormData.rawInput;
					}

					delete failoverFormData.rawInput;

					_.extend(dataNumber, failoverFormData);

					if(dataNumber.failover.e164 || dataNumber.failover.sip) {
						monster.ui.confirm(self.i18n.active().chargeReminder.line1 + '<br/><br/>' + self.i18n.active().chargeReminder.line2,
							function() {
								self.failoverUpdateNumber(dataNumber.id, dataNumber,
									function(data) {
										var phoneNumber = monster.util.formatPhoneNumber(data.data.id),
											template = monster.template(self, '!' + self.i18n.active().failover.successFailover, { phoneNumber: phoneNumber });

										toastr.success(template);

										popup.dialog('destroy').remove();

										callbacks.success && callbacks.success(data);
									},
									function(data) {
										monster.ui.alert(self.i18n.active().failover.errorUpdate + '' + data.data.message);

										callbacks.error && callbacks.error(data);
									}
								);
							}
						);
					}
					else {
						monster.ui.alert(self.i18n.active().failover.invalidFailoverNumber);
					}
				}
				else {
					monster.ui.alert(self.i18n.active().failover.noDataFailover);
				}
			});

			popupHtml.find('.remove_failover').on('click', function(ev) {
				ev.preventDefault();

				delete dataNumber.failover;

				self.failoverUpdateNumber(dataNumber.id, dataNumber,
					function(data) {
						var phoneNumber = monster.util.formatPhoneNumber(data.data.id),
							template = monster.template(self, '!' + self.i18n.active().failover.successRemove, { phoneNumber: phoneNumber });

						toastr.success(template);

						popup.dialog('destroy').remove();

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

		failoverEdit: function(args) {
			var self = this;

			self.failoverGetNumber(args.phoneNumber, function(dataNumber) {
				self.failoverRender(dataNumber.data, args.callbacks);
			});
		},

		failoverGetNumber: function(phoneNumber, success, error) {
			var self = this;

			self.callApi({
				resource: 'numbers.get',
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

		failoverUpdateNumber: function(phoneNumber, data, success, error) {
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

	return failover;
});
