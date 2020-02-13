define(function(require) {
	var $ = require('jquery'),
		_ = require('lodash'),
		monster = require('monster');

	var numberIm = {

		subscribe: {
			'common.numberIm.renderPopup': 'numberImEdit'
		},

		/**
		 * @param  {Object} args
		 * @param  {String} args.phoneNumber
		 * @param  {Object} [args.accountId]
		 * @param  {Function} [args.callbacks.success]
		 * @param  {Function} [args.callbacks.error]
		 */
		numberImEdit: function(args) {
			var self = this,
				argsCommon = {
					success: function(numberData) {
						self.numberImRender(_.merge({
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
		numberImRender: function(args) {
			var self = this,
				numberData = args.numberData,
				accountId = _.get(args, 'accountId', self.accountId),
				success = _.get(args, 'success', function() {}),
				error = _.get(args, 'error', function() {}),
				config = _.get(numberData, '_read_only.features.settings.im', {}),
				popup_html = $(self.getTemplate({
					name: 'layout',
					data: {
						configuration: {
							sms: _.get(numberData, '_read_only.features.settings.sms', {}),
							mms: _.get(numberData, '_read_only.features.settings.mms', {})
						},
						data: {
							sms: numberData.sms || {},
							mms: numberData.mms || {}
						}
					},
					submodule: 'numberIm'
				})),
				popup;

			popup_html.find('.save').on('click', function(ev) {
				ev.preventDefault();

				var $this = $(this),
					formData = monster.ui.getFormData('form_number_im');

				$this.prop('disabled', 'disabled');

				self.numberImPatchNumber({
					data: {
						accountId: accountId,
						phoneNumber: encodeURIComponent(numberData.id),
						data: formData						
					},
					success: function(number) {
						var phoneNumber = monster.util.formatPhoneNumber(number.id),
							template = self.getTemplate({
								name: '!' + self.i18n.active().numberIm.successUpdate,
								data: {
									phoneNumber: phoneNumber
								},
								submodule: 'numberIm'
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
						$this.prop('disabled', false);
						error(dataError);
					}
				});
			});

			popup_html.find('.cancel-link').on('click', function(e) {
				e.preventDefault();
				popup.dialog('close');
			});

			popup = monster.ui.dialog(popup_html, {
				title: self.i18n.active().numberIm.dialogTitle
			});
		},

		/**
		 * @param  {Object} args
		 * @param  {Object} args.data.phoneNumber
		 * @param  {Function} [args.success]
		 * @param  {Function} [args.error]
		 */
		numberImPatchNumber: function(args) {
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

	return numberIm;
});
