define(function(require) {
	var $ = require('jquery'),
		_ = require('lodash'),
		monster = require('monster');

	return {

		subscribe: {
			'common.numberMessaging.renderPopup': 'numberMessagingEdit'
		},

		appFlags: {
			users: {},
			oomaSmsBoxes: {}
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
				accountId = _.get(args, 'accountId', self.accountId);

			monster.waterfall([
				function(callback) {
					monster.pub('common.numbers.editFeatures', {
						accountId: args.accountId,
						number: args.phoneNumber,
						success: function(numberData) {
							callback && callback(null, numberData);
						}
					});
				},
				function(numberData, callback) {
					var isCarrierTio = _.get(numberData, 'metadata.carrier_module') === 'trunkingio';

					if (isCarrierTio) {
						monster.parallel({
							users: function(callback) {
								self.numberMessagingListUsers(accountId, function(users) {
									_.each(users, function(user) {
										user.name = user.first_name + ' ' + user.last_name;
									});

									self.appFlags.users[accountId] = users;
									callback && callback(null, users);
								});
							},
							oomaSmsBoxes: function(callback) {
								self.numberMessagingListOomasmsBoxes(accountId, function(oomaSmsBoxes) {
									self.appFlags.oomaSmsBoxes[accountId] = oomaSmsBoxes;
									callback && callback(null, oomaSmsBoxes);
								});
							}
						}, function(err, results) {
							callback && callback(null, numberData);
						});
					} else {
						callback && callback(null, numberData);
					}
				}
			], function(err, results) {
				console.log(results);
				console.log(self.appFlags);
				self.numberMessagingRender(_.merge({
					numberData: results.numberData,
					users: results.users,
					accountId: accountId
				}, args.callbacks));
			});
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
				users = args.users,
				accountId = _.get(args, 'accountId', self.accountId),
				success = _.get(args, 'success', function() {}),
				error = _.get(args, 'error', function() {}),
				numberMessagingFormatted = self.numberMessagingFormatData({
					numberData: args.numberData
				}),
				popup_html = $(self.getTemplate({
					name: 'layout',
					data: _.merge({
						users: users
					}, numberMessagingFormatted),
					submodule: 'numberMessaging'
				})),
				popup;

			self.trunkingCarrierEvents(popup_html, numberMessagingFormatted, users);
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

			var featureSelectionItem = popup_html.find('.feature-selection .sds_SelectionList_Item');
			featureSelectionItem.on('click', function(e) {
				var $this = $(this),
					$input = $this.find('input'),
					isChecked = $input.prop('checked');

				e.preventDefault();
				$input.prop('checked', !isChecked);
				self.trunkingCarrierEvents(popup_html, numberMessagingFormatted, users, true);
			});

			popup = monster.ui.dialog(popup_html, {
				title: self.i18n.active().numberMessaging.titles.dialog
			});
		},

		/**
		 * @param template
		 * @param  {Object} numberData
		 * @param {boolean} wasChanged
		 */
		trunkingCarrierEvents: function(template, numberData, users, wasChanged = false) {
			var self = this,
				isCarrierTio = _.get(numberData, 'isCarrierTio', false),
				isReseller = _.get(numberData, 'isReseller', false),
				$smsSelectionItem = template.find('.feature-selection .feature-sms-item'),
				$mmsSelectionItem = template.find('.feature-selection .feature-mms-item'),
				isSmsChecked = $smsSelectionItem.find('input').prop('checked');

			if (!isReseller && isCarrierTio) {
				$smsSelectionItem.addClass('sds_SelectionList_Item_Disabled');
				$mmsSelectionItem.addClass('sds_SelectionList_Item_Disabled');
				return;
			}

			if (isCarrierTio) {
				if (isSmsChecked) {
					$mmsSelectionItem.removeClass('sds_SelectionList_Item_Disabled');
				} else {
					$mmsSelectionItem.addClass('sds_SelectionList_Item_Disabled');
				}

				if (!isSmsChecked && $mmsSelectionItem.find('input').prop('checked') && wasChanged) {
					$mmsSelectionItem.find('input').prop('checked', false);
				}

				//Initialize selectors
			//	monster.ui.chosen(template.find('#owners_list'));
			//	monster.ui.chosen(template.find('#members_list'));
			}
		
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
						isConfigured: _.get(settings, [feature, 'enabled'], false)
					};
				}),
				isCarrierTio: _.get(numberData, 'metadata.carrier_module') === 'trunkingio',
				isReseller: monster.util.isReseller()
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
		},

		/**
		 * @param {String} accountId
		 * @param  {Function} callback
		 */
		numberMessagingListUsers: function(accountId, callback) {
			var self = this;

			self.callApi({
				resource: 'user.list',
				data: {
					accountId: accountId,
					filters: {
						paginate: 'false'
					},
				},
				success: function(data) {
					callback && callback(data.data);
				}
			});
		},

		/**
		 * @param {String} accountId
		 * @param  {Function} callback
		 */
		numberMessagingListOomasmsBoxes: function(accountId, callback) {
			var self = this;

			self.callApi({
				resource: 'oomasmsboxes.list',
				data: {
					accountId: accountId,
					filters: {
						paginate: 'false'
					},
					generateError: false
				},
				success: function(data) {
					callback && callback(data.data);
				},
				error: function(data, status) {
					callback && callback([]);
				}
			});
		}
	};
});
