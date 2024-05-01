define(function(require) {
	var $ = require('jquery'),
		_ = require('lodash'),
		monster = require('monster');

	var callerId = {

		requests: {
		},

		subscribe: {
			'common.callerId.renderPopup': 'callerIdEdit'
		},

		/**
		 * Show Caller ID edit options for a phone number
		 * @param  {Object}   args
		 * @param  {Object}   [args.accountId]          Account ID
		 * @param  {String}   args.phoneNumber          Phone number whose caller ID data will
		 *                                              be edited
		 * @param  {Object}   [args.callbacks]          Callback functions
		 * @param  {Function} [args.callbacks.success]  Success callback
		 * @param  {Function} [args.callbacks.error]    Error callback
		 */
		callerIdEdit: function(args) {
			var self = this,
				argsCommon = {
					success: function(numberData) {
						self.callerIdRender(_.merge({
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
		 * Render Caller ID pop-up
		 * @param  {Object}   args
		 * @param  {Object}   args.numberData   Phone number data
		 * @param  {String}   [args.accountId]  Account ID
		 * @param  {Function} [args.success]    Success callback
		 * @param  {Function} [args.error]      Error callback
		 */
		callerIdRender: function(args) {
			var self = this,
				dataNumber = args.numberData,
				popup_html = $(self.getTemplate({
					name: 'layout',
					data: _.get(dataNumber, 'cnam', {}),
					submodule: 'callerId'
				})),
				popup,
				accountId = _.get(args, 'accountId', self.accountId),
				form = popup_html.find('#cnam');

			monster.ui.validate(form, {
				rules: {
					'display_name': {
						minlength: 1,
						maxlength: 15
					}
				}
			});

			popup_html.find('.save').on('click', function(ev) {
				ev.preventDefault();

				if (!monster.ui.valid(form)) {
					return;
				}

				_.assign(dataNumber, {
					cnam: monster.ui.getFormData('cnam')
				});

				if (dataNumber.cnam.display_name === '') {
					delete dataNumber.cnam.display_name;
				}

				monster.waterfall([
					function(callback) {
						self.callerIdUpdateNumber({
							data: {
								accountId: accountId,
								phoneNumber: dataNumber.id,
								data: dataNumber
							},
							success: function(data) {
								callback(null, data);
							},
							error: function(parsedError) {
								callback(parsedError);
							}
						});
					},
					function(data, callback) {
						if (data.hasOwnProperty('data')) {
							callback(null, data);
							return;
						}

						// `data` is not returned after update for some numbers, so we
						// try to get the phone number data from the API
						self.callerIdGetNumber({
							data: {
								accountId: accountId,
								phoneNumber: dataNumber.id
							},
							success: function(data) {
								callback(null, data);
							},
							error: function(parsedError) {
								callback(parsedError);
							}
						});
					}
				], function(err, data) {
					if (err) {
						args.hasOwnProperty('error') && args.error(err);
						return;
					}

					monster.ui.toast({
						type: 'success',
						message: self.getTemplate({
							name: '!' + self.i18n.active().callerId.successCnam,
							data: {
								phoneNumber: monster.util.formatPhoneNumber(dataNumber.id)
							}
						})
					});

					popup.dialog('close');

					args.hasOwnProperty('success') && args.success(data);
				});
			});

			popup_html.find('.cancel-link').on('click', function(e) {
				e.preventDefault();
				popup.dialog('close');
			});

			popup = monster.ui.dialog(popup_html, {
				title: self.i18n.active().callerId.dialogTitle
			});
		},

		/**
		 * Update a phone number
		 * @param  {Object}   args
		 * @param  {Object}   args.data
		 * @param  {String}   args.data.accountId    Account ID
		 * @param  {String}   args.data.phoneNumber  Phone number ID
		 * @param  {Object}   args.data.data         Phone number data to be updated
		 * @param  {Function} [args.success]         Success callback
		 * @param  {Function} [args.error]           Error callback
		 */
		callerIdUpdateNumber: function(args) {
			var self = this;

			// The back-end doesn't let us set features anymore, they return
			// the field based on the key set on that document.
			delete args.data.data.features;
			delete args.data.data.metadata;

			self.callApi({
				resource: 'numbers.update',
				data: args.data,
				success: function(data) {
					args.hasOwnProperty('success') && args.success(data);
				},
				error: function(parsedError) {
					args.hasOwnProperty('error') && args.error(parsedError);
				}
			});
		},

		/**
		 * Get a phone number
		 * @param  {Object}   args
		 * @param  {Object}   args.data
		 * @param  {String}   args.data.accountId    Account ID
		 * @param  {String}   args.data.phoneNumber  Phone number ID
		 * @param  {Function} [args.success]         Success callback
		 * @param  {Function} [args.error]           Error callback
		 */
		callerIdGetNumber: function(args) {
			var self = this;

			self.callApi({
				resource: 'numbers.get',
				data: args.data,
				success: function(data) {
					args.hasOwnProperty('success') && args.success(data);
				},
				error: function(parsedError) {
					args.hasOwnProperty('error') && args.error(parsedError);
				}
			});
		}
	};

	return callerId;
});
