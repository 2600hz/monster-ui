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
			isCarrierTio: false,
			oomaSmsBox: {}
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
							callback && callback(null, {numberData: numberData});
						}
					});
				},
				function(numberData, callback) {
					var isCarrierTio = _.get(numberData, 'numberData.metadata.carrier_module') === 'trunkingio';

					self.appFlags.oomaSmsBox = {};
					self.appFlags.isCarrierTio = isCarrierTio;

					if (!isCarrierTio) {
						monster.parallel({
							users: function(callback) {
								var storedUsers = self.appFlags.users[accountId];

								if (storedUsers) {
									callback && callback(null, storedUsers);
								} else {
									self.numberMessagingListUsers({
										data: {
											accountId: accountId,
											filters: {
												paginate: 'false'
											}
										}, 
										success: function(users) {
											_.each(users, function(user) {
												user.name = user.first_name + ' ' + user.last_name;
											});

											self.appFlags.users[accountId] = users;
											callback && callback(null, users);
										}
									});
								}
							},
							oomaSmsBoxes: function(callback) {
								self.numberMessagingListOomaSmsBoxes({
									data: {
										accountId: accountId,
										filters: {
											paginate: 'false'
										},
										generateError: false
									},
									success: function(oomaSmsBoxes) {
										var number = numberData.numberData.id;

										_.each(oomaSmsBoxes, function(oomaSmsBox) {
											if (_.includes(oomaSmsBox.numbers, number)) {
												self.appFlags.oomaSmsBox = oomaSmsBox;
											}
										});
										callback && callback(null, oomaSmsBoxes);
									},
									error: function(dataError) {
										callback && callback(null, {});
									}
								});
							}
						}, function(err, results) {
							results.numberData = numberData.numberData;
							callback && callback(null, results);
						});
					} else {
						callback && callback(null, numberData);
					}
				}
			], function(err, results) {
				self.numberMessagingRender(_.merge({
					callbacks: args.callbacks,
					accountId: accountId
				}, _.omit(results, [
					'oomaSmsBoxes'
				])));
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
					formData = monster.ui.getFormData('form_number_messaging'),
					isCarrierTio = self.appFlags.isCarrierTio,
					owner,
					members = {},
					oomaSmsBoxData = {
						numbers: [
							numberData.id
						]
					};

				$button.prop('disabled', 'disabled');

				if (isCarrierTio) {
					owner = formData.owner;
					memberData = _.find( self.appFlags.users[accountId], {id: formData.member });

					oomaSmsBoxData.owner = owner;

					if (memberData) {
						oomaSmsBoxData.members = [
							{
								id: formData.member,
								name: memberData.name,
								type: 'user'
							}
						]
					} else {
						oomaSmsBoxData.shared_box = false;
					}

					delete formData.owner;
					delete formData.member;
				}

				monster.waterfall([
					function(callback) {
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


								callback(null, number);
							},
							error: function(dataError) {
								$button.prop('disabled', false);
								error(dataError);
							}
						});
					},
					function(number, callback) {
						var isCarrierTio = self.appFlags.isCarrierTio,
							oomaSmsBox = self.appFlags.oomaSmsBox;
							isUpdateOomaSmsBox = !_.isEmpty(oomaSmsBox);


						if (!isCarrierTio) {
							callback(null, {});
							return;
						}

						if (isUpdateOomaSmsBox) {
							self.numberMessagingUpdateOomaSmsBox({
								data: {
									accountId: accountId,
									boxId: oomaSmsBox.id,
									data: oomaSmsBoxData
								},
								success: function(oomaSmsBox) {
									callback(null, oomaSmsBox);
								}
							});
						} else {
							self.numberMessagingCreateOomaSmsBox({
								data: {
									accountId: accountId,
									data: oomaSmsBoxData
								},
								success: function(oomaSmsBox) {
									callback(null, oomaSmsBox);
								}
							});
						}
					}
				], function(err, results) {
					popup.dialog('close');
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
				isCarrierTio = self.appFlags.isCarrierTio,
				isReseller = _.get(numberData, 'isReseller', false),
				$smsSelectionItem = template.find('.feature-selection .feature-sms-item'),
				$mmsSelectionItem = template.find('.feature-selection .feature-mms-item'),
				isSmsChecked = $smsSelectionItem.find('input').prop('checked');

			if (!isCarrierTio) {
				return;
			}

			if (!isReseller) {
				$smsSelectionItem.addClass('sds_SelectionList_Item_Disabled');
				$mmsSelectionItem.addClass('sds_SelectionList_Item_Disabled');
				return;
			}

			if (isSmsChecked) {
				$mmsSelectionItem.removeClass('sds_SelectionList_Item_Disabled');
			} else {
				$mmsSelectionItem.addClass('sds_SelectionList_Item_Disabled');
			}

			if (!isSmsChecked && $mmsSelectionItem.find('input').prop('checked') && wasChanged) {
				$mmsSelectionItem.find('input').prop('checked', false);
			}
		},

		/**
		 * @param  {Object} args.numberData
		 */
		numberMessagingFormatData: function(args) {
			var self = this,
				numberData = args.numberData,
				settings = _.get(numberData, 'metadata.features.settings', {}),
				returnData = {
					features: _.map(['sms', 'mms'], function(feature) {
						return {
							feature: feature,
							isEnabled: _.get(numberData, [feature, 'enabled'], false),
							isConfigured: _.get(settings, [feature, 'enabled'], false)
						};
					}),
					isCarrierTio: self.appFlags.isCarrierTio,
					isReseller: monster.util.isReseller()
				},
				oomaSmsBox = self.appFlags.oomaSmsBox;

			if (self.appFlags.isCarrierTio && !_.isEmpty(oomaSmsBox)) {
				var memberData = _.find(oomaSmsBox.members, { type: 'user' });

				returnData.id = oomaSmsBox.id;
				returnData.owner = oomaSmsBox.owner;
				returnData.member = _.get(memberData, 'id', null);
			}

			return returnData;
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
		 * @param  {Object} args
		 * @param  {Function} [args.success]
		 */
		numberMessagingListUsers: function(args) {
			var self = this;

			self.callApi({
				resource: 'user.list',
				data: _.merge({
					accountId: self.accountId
				}, args.data),
				success: function(data) {
					_.has(args, 'success') && args.success(data.data);
				}
			});
		},

		/**
		 * @param  {Object} args
		 * @param  {Function} [args.success]
		 * @param  {Function} [args.error]
		 */
		numberMessagingListOomaSmsBoxes: function(args) {
			var self = this;

			self.callApi({
				resource: 'oomasmsboxes.list',
				data: _.merge({
					accountId: self.accountId
				}, args.data),
				success: function(data) {
					_.has(args, 'success') && args.success(data.data);
				},
				error: function(data, status) {
					_.has(args, 'error') && args.error([]);
				}
			});
		},

		/**
		 * @param  {Object} args
		 * @param  {Object} args.data.oomaSmsBox
		 * @param  {Function} [args.success]
		 */
		numberMessagingCreateOomaSmsBox: function(args) {
			var self = this;

			self.callApi({
				resource: 'oomasmsboxes.create',
				data: _.merge({
					accountId: self.accountId
				}, args.data),
				success: function(data) {
					_.has(args, 'success') && args.success(data);
				}
			});
		},

		/**
		 * @param  {Object} args
		 * @param  {Object} args.data.OomaSmsBox
		 * @param  {Function} [args.success]
		 */
		numberMessagingUpdateOomaSmsBox: function(args) {
			var self = this;

			self.callApi({
				resource: 'oomasmsboxes.update',
				data: _.merge({
					accountId: self.accountId
				}, args.data),
				success: function(data) {
					_.has(args, 'success') && args.success(data.data);
				}
			});
		}
	};
});
