define(function(require) {
	var $ = require('jquery'),
		_ = require('lodash'),
		monster = require('monster');

	return {

		subscribe: {
			'common.numberMessaging.renderPopup': 'numberMessagingEdit'
		},

		/**
		 * @param  {Object} args
		 * @param  {String} args.phoneNumber
		 * @param  {Object} [args.accountId]
		 * @param  {Function} [args.callbacks.success]
		 * @param  {Function} [args.callbacks.error]
		 */
		numberMessagingEdit: function(args) {
			var self = this,
				argsCommon = {
					success: function(numberData) {
						self.numberMessagingRender(_.merge({
							numberData: numberData,
							accountId: args.accountId
						}, args.callbacks));
					},
					number: args.phoneNumber
				};

			if (args.hasOwnProperty('accountId')) {
				argsCommon.accountId = args.accountId;
			}

			monster.pub('common.numbers.editFeatures', argsCommon);
		},

		/**
		 * @param  {Object} args
		 * @param  {Object} args.numberData
		 * @param  {Object} [args.accountId]
		 * @param  {Function} [args.success]
		 * @param  {Function} [args.error]
		 */
		numberMessagingRender: function(args) {
			var self = this,
				numberData = args.numberData,
				accountId = _.get(args, 'accountId', self.accountId),
				success = _.get(args, 'success', function() {}),
				error = _.get(args, 'error', function() {}),
				popup_html = $(self.getTemplate({
					name: 'layout',
					data: self.numberMessagingFormatData({
						numberData: numberData
					}),
					submodule: 'numberMessaging'
				})),
				popup;

			popup_html.on('submit', function(ev) {
				ev.preventDefault();

				var $button = $(this).find('button[type="submit"]'),
					formData = monster.ui.getFormData('form_number_messaging');

				$button.prop('disabled', 'disabled');

				self.numberMessagingPatchNumber({
					data: {
						accountId: accountId,
						phoneNumber: numberData.id,
						data: formData
					},
					success: function(number) {
						var phoneNumber = monster.util.formatPhoneNumber(number.id),
							template = self.getTemplate({
								name: '!' + self.i18n.active().numberMessaging.successUpdate,
								data: {
									phoneNumber: phoneNumber
								}
							});

						monster.ui.toast({
							type: 'success',
							message: template
						});

						popup.dialog('close');

						success({
							data: number
						});
					},
					error: function(dataError) {
						$button.prop('disabled', false);
						error(dataError);
					}
				});
			});

			popup_html.find('.cancel-link').on('click', function(e) {
				e.preventDefault();
				popup.dialog('close');
			});

			popup = monster.ui.dialog(popup_html, {
				title: self.i18n.active().numberMessaging.titles.dialog
			});
		},

		/**
		 * @param  {Object} args.numberData
		 */
		numberMessagingFormatData: function(args) {
			var self = this,
				numberData = args.numberData,
				settings = _.get(numberData, 'metadata.features.settings', {});

			return {
				features: _.map(['sms', 'mms'], function(feature) {
					return {
						feature: feature,
						isEnabled: _.get(numberData, [feature, 'enabled'], false),
						isConfigured: _.get(settings, [feature, 'enabled'], false),
						isActivationManual: _.get(settings, [feature, 'activation']) === 'manual'
					};
				})
			};
		},

		/**
		 * @param  {Object} args
		 * @param  {Object} args.data.phoneNumber
		 * @param  {Function} [args.success]
		 * @param  {Function} [args.error]
		 */
		numberMessagingPatchNumber: function(args) {
			var self = this;

			self.callApi({
				resource: 'numbers.patch',
				data: _.merge({
					accountId: self.accountId
				}, args.data),
				success: function(data, status) {
					_.has(args, 'success') && args.success(data.data);
				},
				error: function(parsedError) {
					_.has(args, 'error') && args.error(parsedError);
				},
				onChargesCancelled: function() {
					_.has(args, 'error') && args.error();
				}
			});
		}
	};
});
