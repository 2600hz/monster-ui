define(function(require) {
	var $ = require('jquery'),
		_ = require('lodash'),
		monster = require('monster');

	return {

		subscribe: {
			'common.numberMessaging.renderPopup': 'numberMessagingEdit'
		},

		appFlags: {
			users: {}
		},

		/**
		 * Render dialog to edit number messaging settings.
		 * @param  {Object} args
		 * @param  {String} args.phoneNumber  Phone number to edit.
		 * @param  {Object} [args.accountId]  ID of the account that owns the phone number.
		 * 									  If not specified, the current account ID is used.
		 * @param  {Function} [args.callbacks.success]  Success callback.
		 * @param  {Function} [args.callbacks.error]  Error callback.
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
							callback && callback(null, { numberData: numberData });
						}
					});
				},
				function(wrappedNumberData, callback) {
					wrappedNumberData.isCarrierTio = _.get(wrappedNumberData, 'numberData.metadata.carrier_module') === 'trunkingio';

					if (!wrappedNumberData.isCarrierTio) {
						callback && callback(null, wrappedNumberData);
						return;
					}

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
										callback(null, users);
									},
									error: function(dataError) {
										callback(dataError);
									}
								});
							}
						},
						oomaSmsBox: function(callback) {
							self.numberMessagingListOomaSmsBoxes({
								data: {
									accountId: accountId,
									filters: {
										paginate: 'false'
									},
									generateError: false
								},
								success: function(oomaSmsBoxes) {
									var number = wrappedNumberData.numberData.id,
										oomaSmsBox = _.findLast(oomaSmsBoxes, function(oomaSmsBox) {
											return _.includes(oomaSmsBox.numbers, number);
										});
									callback(null, oomaSmsBox);
								},
								error: function(_dataError) {
									callback(null, {});
								}
							});
						}
					}, function(err, results) {
						if (err) {
							callback(err);
							return;
						}

						results.numberData = wrappedNumberData.numberData;
						results.isCarrierTio = wrappedNumberData.isCarrierTio;
						callback(null, results);
					});
				}
			], function(err, results) {
				if (err) {
					_.has(args, 'callbacks.error') && args.callbacks.error(err);
					return;
				}

				self.numberMessagingRender(_.merge({
					callbacks: args.callbacks,
					accountId: accountId
				}, results));
			});
		},

		/**
		 * Auxiliary function to render the dialog for number messaging settings.
		 * @param  {Object} args
		 * @param  {Object} [args.accountId]  ID of the account that owns the phone number.
		 * @param  {Object} args.numberData  Phone number data.
		 * @param  {Object} args.oomaSmsBox  SMS box data.
		 * @param  {Boolean} args.isCarrierTio  Whether or not the number carrier is Trunking.io.
		 * @param  {Function} [args.success]  Success callback.
		 * @param  {Function} [args.error]  Error callback.
		 */
		numberMessagingRender: function(args) {
			var self = this,
				numberData = args.numberData,
				users = args.users,
				accountId = _.get(args, 'accountId', self.accountId),
				success = _.get(args, 'success', function() {}),
				error = _.get(args, 'error', function() {}),
				oomaSmsBox = _.get(args, 'oomaSmsBox', {}),
				isCarrierTio = args.isCarrierTio,
				numberMessagingFormatted = self.numberMessagingFormatData({
					numberData: numberData,
					oomaSmsBox: oomaSmsBox,
					isCarrierTio: isCarrierTio
				}),
				$popupForm = $(self.getTemplate({
					name: 'layout',
					data: numberMessagingFormatted,
					submodule: 'numberMessaging'
				}));

			if (isCarrierTio) {
				self.numberMessagingTioSmsBoxFormRender({
					$container: $popupForm.find('#number_messaging_tio'),
					isCarrierTio: isCarrierTio,
					data: _.merge({
						users: users
					}, numberMessagingFormatted)
				});
			}

			self.numberMessagingBindEvents({
				accountId: accountId,
				$form: $popupForm,
				formattedData: numberMessagingFormatted,
				numberData: numberData,
				oomaSmsBox: oomaSmsBox,
				isCarrierTio: isCarrierTio,
				users: users,
				success: success,
				error: error
			});

			monster.ui.dialog($popupForm, {
				title: self.i18n.active().numberMessaging.titles.dialog
			});
		},

		/**
		 * Binds the number message settings dialog's events.
		 * @param  {Object} args
		 * @param  {String} args.accountId  ID of the account that owns the phone number.
		 * @param  {jQuery} args.$form  Settings form template.
		 * @param  {Object} args.formattedData  Formatted settings data for the UI.
		 * @param  {Object} args.numberData  Phone number data.
		 * @param  {Object} args.oomaSmsBox  SMS box data.
		 * @param  {Boolean} args.isCarrierTio  Whether or not the number carrier is Trunking.io.
		 * @param  {Function} [args.success]  Success callback.
		 * @param  {Function} [args.error]  Error callback.
		 */
		numberMessagingBindEvents: function(args) {
			var self = this,
				accountId = args.accountId,
				$form = args.$form,
				numberMessagingFormatted = args.formattedData,
				numberData = args.numberData,
				oomaSmsBox = args.oomaSmsBox,
				success = args.success,
				error = args.error,
				isCarrierTio = args.isCarrierTio,
				$tioBoxAvailableSection = $form.find('#tio_sms_box_available_section'),
				$tioBoxEnabledSection = $tioBoxAvailableSection.find('#tio_sms_box_enabled_section');

			monster.ui.validate($form, {
				rules: {
					owner: {
						required: function(element) {
							var isSmsFeatureEnabled = $form
									.find('[name="sms.enabled"]')
									.prop('checked'),
								mustConfigureTioSmsBox = $form
									.find('#configure_tio_sms_box')
									.prop('checked');

							return isSmsFeatureEnabled && mustConfigureTioSmsBox;
						}
					}
				}
			});

			$form.find('.feature-selection').on('click', '.sds_SelectionList_Item', function(e) {
				var $this = $(this),
					$input = $this.find('input'),
					isChecked = $input.prop('checked');

				e.preventDefault();

				$input.prop('checked', !isChecked);

				// If item was checked, and now is unchecked, then uncheck and disable the following items
				if (isChecked) {
					$this.nextAll()
						.addClass('sds_SelectionList_Item_Disabled')
						.find('input')
						.prop('checked', !isChecked);
				} else {
					// Else, enable the next item
					$this.nextAll()
						.removeClass('sds_SelectionList_Item_Disabled');
				}

				// If checkbox is SMS and carrier is TIO
				if ($this.data('feature-type') === 'sms' && isCarrierTio) {
					if (isChecked) {
						$tioBoxAvailableSection.slideUp();
					} else {
						$tioBoxAvailableSection.slideDown();
					}
				}
			});

			$form.find('#configure_tio_sms_box').on('change', function(e) {
				var isChecked = $(this).prop('checked');

				if (isChecked) {
					$tioBoxEnabledSection.slideDown();
				} else {
					$tioBoxEnabledSection.slideUp();
				}
			});

			$form.find('.cancel-link').on('click', function(e) {
				e.preventDefault();
				$form.closest('.ui-dialog-content').dialog('close');
			});

			$form.on('submit', function(ev) {
				ev.preventDefault();

				self.numberMessagingSaveData({
					$form: $form,
					accountId: accountId,
					isCarrierTio: isCarrierTio,
					number: numberData.id,
					oomaSmsBox: oomaSmsBox,
					nonMembers: numberMessagingFormatted.nonMembers || [],
					success: success,
					error: error
				});
			});
		},

		/**
		 * Save all the phone number messaging settings.
		 * @param  {Object} args
		 * @param  {String} args.accountId  ID of the account that owns the phone number.
		 * @param  {Boolean} args.isCarrierTio  Whether or not the number carrier is Trunking.io.
		 * @param  {String} args.number  Phone number.
		 * @param  {Object} args.oomaSmsBox  SMS box data.
		 * @param  {Object[]} args.nonMembers  Non-user SMS box members.
		 * @param  {Function} [args.success]  Success callback.
		 * @param  {Function} [args.error]  Error callback.
		 */
		numberMessagingSaveData: function(args) {
			var self = this,
				$form = args.$form,
				accountId = args.accountId,
				isCarrierTio = args.isCarrierTio,
				number = args.number,
				oomaSmsBox = args.oomaSmsBox,
				members = _.concat([], args.nonMembers),
				success = args.success,
				error = args.error;

			if (!monster.ui.valid($form)) {
				return;
			}

			var $button = $form.find('button[type="submit"]'),
				formData = monster.ui.getFormData('form_number_messaging'),
				features = ['sms', 'mms'],
				isAnyMessagingFeatureEnabled = _.some(features, function(featureName) {
					return _.get(formData, [featureName, 'enabled'], false);
				}),
				shouldCheckMfaConfig = isCarrierTio && isAnyMessagingFeatureEnabled;

			$button.prop('disabled', true);

			monster.waterfall([
				function checkMfaConfiguration(callback) {
					if (!shouldCheckMfaConfig) {
						callback(null, formData, null);
						return;
					}

					self.numberMessagingGetOtpMultifactorConfig({
						data: {
							accountId: accountId
						},
						success: function(otpConfig) {
							callback(null, formData, otpConfig);
						},
						error: function(parsedError) {
							callback(parsedError);
						}
					});
				},
				function checkOtpConfig(formData, otpConfig, callback) {
					if (shouldCheckMfaConfig && !otpConfig) {
						monster.ui.alert('error', self.i18n.active().numberMessaging.mfaNotConfiguredError);
						callback('MfaOtpNotConfigured');
						return;
					}

					callback(null, formData, otpConfig);
				},
				function formatOomaSmsBoxData(formData, otpConfig, callback) {
					var oomaSmsBoxData;

					if (!isCarrierTio || !formData.configureTioSmsBox) {
						callback(null, formData, otpConfig, null);
						return;
					}

					_.each(formData.members, function(memberId) {
						var member = _.find(self.appFlags.users[accountId], { id: memberId });

						if (member) {
							members.push({
								id: memberId,
								name: member.name,
								type: 'user'
							});
						}
					});

					oomaSmsBoxData = _.assign(
						{
							numbers: [
								number
							],
							shared_box: false,
							owner: formData.owner
						},
						(_.size(members) > 0) ? {
							members: members,
							shared_box: true
						} : {}
					);

					callback(null, formData, otpConfig, oomaSmsBoxData);
				},
				function patchNumber(formData, otpConfig, oomaSmsBoxData, callback) {
					var isReseller = monster.util.isReseller();

					if (!isReseller) {
						callback(null, otpConfig, oomaSmsBoxData, {});
						return;
					}

					self.numberMessagingPatchNumber({
						data: {
							accountId: accountId,
							phoneNumber: number,
							data: _.pick(formData, features)
						},
						success: function(number) {
							callback(null, otpConfig, oomaSmsBoxData, number);
						},
						error: function(dataError) {
							callback(dataError);
						}
					});
				},
				function saveSmsBox(otpConfig, oomaSmsBoxData, number, callback) {
					var isUpdateOomaSmsBox = !_.isEmpty(oomaSmsBox);

					if (!isCarrierTio || _.isEmpty(oomaSmsBoxData)) {
						callback(null, otpConfig, number);
						return;
					}

					if (isUpdateOomaSmsBox) {
						self.numberMessagingUpdateOomaSmsBox({
							data: {
								accountId: accountId,
								boxId: oomaSmsBox.id,
								data: oomaSmsBoxData
							},
							success: function() {
								callback(null, otpConfig, number);
							},
							error: function(parsedError) {
								callback(parsedError);
							}
						});
					} else {
						self.numberMessagingCreateOomaSmsBox({
							data: {
								accountId: accountId,
								data: oomaSmsBoxData
							},
							success: function() {
								callback(null, otpConfig, number);
							},
							error: function(parsedError) {
								callback(parsedError);
							}
						});
					}
				},
				function enableMfaOtpConfig(otpConfig, number, callback) {
					if (!shouldCheckMfaConfig || _.get(otpConfig, 'enabled', false)) {
						callback(null, number);
						return;
					}

					self.numberMessagingEnableOtpMultifactor({
						data: {
							accountId: accountId
						},
						success: function() {
							monster.ui.alert(
								'info',
								self.i18n.active().numberMessaging.mfaEnabledDialog.description,
								function() {
									callback(null, number);
								},
								{
									title: self.i18n.active().numberMessaging.mfaEnabledDialog.title
								}
							);
						},
						error: function(parsedError) {
							callback(parsedError);
						}
					});
				}
			], function(errorData, _results) {
				if (errorData) {
					$button.prop('disabled', false);
					error && error(errorData);
					return;
				}

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

				$form.closest('.ui-dialog-content').dialog('close');

				success && success();
			});
		},

		/**
		 * Render the form section corresponding to the SMS box settings.
		 * @param  {Object} args
		 * @param  {jQuery} args.$container  Container where the form section should be rendered.
		 * @param  {Object} args.data  Number messaging settings.
		 * @param  {Boolean} args.isCarrierTio  Whether or not the number carrier is Trunking.io.
		 */
		numberMessagingTioSmsBoxFormRender: function(args) {
			var self = this,
				$container = args.$container,
				data = args.data,
				isCarrierTio = args.isCarrierTio,
				isReseller = monster.util.isReseller(),
				isSmsBoxAvailable = _.chain(data)
					.get('features', [])
					.find({ feature: 'sms' })
					.get('isChecked', false)
					.value(),
				configureTioSmsBox = isSmsBoxAvailable && (!isReseller || !!_.get(data, 'owner')),
				$tioSmsBoxForm = $(self.getTemplate({
					name: 'tioSmsBoxForm',
					data: _.assign({
						isSmsBoxAvailable: isSmsBoxAvailable,
						configureTioSmsBox: configureTioSmsBox
					}, data),
					submodule: 'numberMessaging'
				}));

			self.numberMessagingTioSmsBoxFormBindEvents({
				$template: $tioSmsBoxForm,
				isCarrierTio: isCarrierTio
			});

			$container
				.append($tioSmsBoxForm);
		},

		/**
		 * Bind the events for the SMS box settings form section.
		 * @param  {Object} args
		 * @param  {jQuery} args.$template  Template for the SMS box settings section.
		 * @param  {Boolean} args.isCarrierTio  Whether or not the number carrier is Trunking.io.
		 */
		numberMessagingTioSmsBoxFormBindEvents: function(args) {
			var self = this,
				$template = args.$template,
				isCarrierTio = args.isCarrierTio;

			if (!isCarrierTio) {
				return;
			}

			monster.ui.chosen($template.find('#members'), {
				width: 478
			});
		},

		/**
		 * Formats the phone number and SMS box data to be rendered in the UI.
		 * @param  {Object} args
		 * @param  {Object} args.numberData  Phone number data.
		 * @param  {Object} args.oomaSmsBox  SMS box settings.
		 * @param  {Boolean} args.isCarrierTio  Whether or not the number carrier is Trunking.io.
		 * @returns  Phone number settings formatted data.
		 */
		numberMessagingFormatData: function(args) {
			var self = this,
				isReseller = monster.util.isReseller(),
				isCarrierTio = args.isCarrierTio,
				numberData = args.numberData,
				settings = _.get(numberData, 'metadata.features.settings', {}),
				returnData = {
					features: _.reduce(['sms', 'mms'], function(features, feature) {
						features.push({
							feature: feature,
							isEnabled: isReseller && (features.length === 0 || _.get(features, [features.length - 1, 'isChecked'], false)),
							isChecked: _.get(numberData, [feature, 'enabled'], false),
							isConfigured: _.get(settings, [feature, 'enabled'], false)
						});

						return features;
					}, []),
					isReseller: isReseller,
					isCarrierTio: isCarrierTio
				},
				oomaSmsBox = args.oomaSmsBox;

			if (isCarrierTio && !_.isEmpty(oomaSmsBox)) {
				var [allMembers, nonMembers] = _.partition(oomaSmsBox.members, function(member) {
						return member.type === 'user';
					}),
					members = [];

				_.each(allMembers, function(member) {
					members.push(member.id);
				});

				returnData.id = oomaSmsBox.id;
				returnData.owner = oomaSmsBox.owner;
				returnData.nonMembers = nonMembers;
				returnData.members = members;
			}

			return returnData;
		},

		/**
		 * Patches a phone number data.
		 * @param  {Object} args
		 * @param  {Object} args.data
		 * @param  {String} args.data.accountId  ID of the account that owns the phone number.
		 * @param  {String} args.data.phoneNumber  Phone number to be updated.
		 * @param  {Object} args.data.data  Phone number data to be updated.
		 * @param  {Function} [args.success]  Success callback.
		 * @param  {Function} [args.error]  Error callback.
		 */
		numberMessagingPatchNumber: function(args) {
			var self = this;

			self.callApi({
				resource: 'numbers.patch',
				data: args.data,
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
		 * Gets the list of users for the account.
		 * @param  {Object} args
		 * @param  {Object} args.data
		 * @param  {String} args.data.accountId  ID of the account.
		 * @param  {Object} [args.data.filters]  Results filters.
		 * @param  {Object} [args.data.filters.paginate]  Whether or not to paginate the list of results.
		 * @param  {Function} [args.success]  Success callback.
		 * @param  {Function} [args.error]  Error callback.
		 */
		numberMessagingListUsers: function(args) {
			var self = this;

			self.callApi({
				resource: 'user.list',
				data: args.data,
				success: function(data) {
					_.has(args, 'success') && args.success(data.data);
				},
				error: function(parsedError) {
					_.has(args, 'error') && args.error(parsedError);
				}
			});
		},

		/**
		 * Gets the multi-factor configuration for OTP.
		 * @param  {Object} args
		 * @param  {Object} args.data
		 * @param  {String} args.data.accountId  ID of the account.
		 * @param  {Function} [args.success]  Success callback, which receives the OTP configuration object.
		 * @param  {Function} [args.error]  Error callback.
		 */
		numberMessagingGetOtpMultifactorConfig: function(args) {
			var self = this;

			self.callApi({
				resource: 'multifactor.list',
				data: args.data,
				success: function(data) {
					if (!_.has(args, 'success')) {
						return;
					}

					var otpConfig = _.chain(data)
						.get('data.multi_factor_providers', [])
						.find({
							provider_name: 'otp'
						})
						.value();

					args.success(otpConfig);
				},
				error: function(parsedError) {
					_.has(args, 'error') && args.error(parsedError);
				}
			});
		},

		/**
		 * Enables the OTP multi-factor authentication for the specified account.
		 * @param  {Object} args
		 * @param  {Object} args.data
		 * @param  {String} args.data.accountId  ID of the account.
		 * @param  {Function} [args.success]  Success callback, which receives the OTP configuration object.
		 * @param  {Function} [args.error]  Error callback.
		 */
		numberMessagingEnableOtpMultifactor: function(args) {
			var self = this,
				data = {
					'auth_modules': {
						'cb_user_auth': {
							'multi_factor': {
								'configuration_id': args.configurationId,
								'account_id': self.accountId,
								'enabled': true
							}
						}
					},
					accountId: self.accountId
				};

			self.callApi({
				resource: 'security.update',
				data: _.merge({
					data: data
				}, args.data),
				success: function(data) {
					_.has(args, 'success') && args.error(data.data);
				},
				error: function(parsedError) {
					_.has(args, 'error') && args.error(parsedError);
				}
			});
		},

		/**
		 * Get the list of available SMS boxes for the account.
		 * @param  {Object} args
		 * @param  {Object} args.data
		 * @param  {String} args.data.accountId  ID of the account.
		 * @param  {Object} [args.data.filters]  Results filters.
		 * @param  {Object} [args.data.filters.paginate]  Whether or not to paginate the list of results.
		 * @param  {Object} [args.data.generateError]  Whether or not to generate error.
		 * @param  {Function} [args.success]  Success callback.
		 * @param  {Function} [args.error]  Error callback.
		 */
		numberMessagingListOomaSmsBoxes: function(args) {
			var self = this;

			self.callApi({
				resource: 'oomasmsboxes.list',
				data: args.data,
				success: function(data) {
					_.has(args, 'success') && args.success(data.data);
				},
				error: function(parsedError) {
					_.has(args, 'error') && args.error(parsedError);
				}
			});
		},

		/**
		 * Creates a new SMS box.
		 * @param  {Object} args
		 * @param  {Object} args.data
		 * @param  {String} args.data.accountId  ID of the account.
		 * @param  {Object} args.data.data  SMS box data.
		 * @param  {Function} [args.success]  Success callback.
		 * @param  {Function} [args.error]  Error callback.
		 */
		numberMessagingCreateOomaSmsBox: function(args) {
			var self = this;

			self.callApi({
				resource: 'oomasmsboxes.create',
				data: args.data,
				success: function(data) {
					_.has(args, 'success') && args.success(data);
				},
				error: function(parsedError) {
					_.has(args, 'error') && args.error(parsedError);
				}
			});
		},

		/**
		 * Updates an existing SMS box.
		 * @param  {Object} args
		 * @param  {Object} args.data
		 * @param  {String} args.data.accountId  ID of the account.
		 * @param  {Object} args.data.boxId  SMS box ID.
		 * @param  {Object} args.data.data  SMS box data.
		 * @param  {Function} [args.success]  Success callback.
		 * @param  {Function} [args.error]  Error callback.
		 */
		numberMessagingUpdateOomaSmsBox: function(args) {
			var self = this;

			self.callApi({
				resource: 'oomasmsboxes.update',
				data: args.data,
				success: function(data) {
					_.has(args, 'success') && args.success(data.data);
				},
				error: function(parsedError) {
					_.has(args, 'error') && args.error(parsedError);
				}
			});
		}
	};
});
