define(function(require) {
	return {
		subscribe: {
			'common.cidNumber.renderAdd': 'cidNumberRenderAdd',
			'common.cidNumber.renderVerify': 'cidNumberRenderVerify',
			'common.cidNumber.forceVerify': 'cidNumberForceVerify'
		},

		/**
		 * Prompts number creation dialog.
		 * @param  {Object} args
		 * @param  {String} args.accountId
		 * @param  {Function} args.onVerified
		 * @param  {Boolean} [args.allowVerifyLater=true]
		 */
		cidNumberRenderAdd: function(args) {
			var self = this,
				accountId = _.get(args, 'accountId', self.accountId),
				allowVerifyLater = _.find([
					args.allowVerifyLater,
					true
				], _.isBoolean),
				onVerified = _.get(args, 'onVerified', function() {}),
				$template = $(self.getTemplate({
					name: 'add',
					data: {
						allowVerifyLater: allowVerifyLater,
						showBypassActions: allowVerifyLater || monster.util.isSuperDuper()
					},
					submodule: 'cidNumber'
				})),
				popup = monster.ui.dialog($template, {
					title: self.i18n.active().commonApp.cidNumber.add.title
				});

			self.cidNumberBindAddEvents($template, {
				accountId: accountId,
				closePopup: _.bind(popup.dialog, popup, 'close'),
				onVerified: onVerified
			});
		},

		cidNumberGlobalCallback: function(metadata, callback) {
			var self = this,
				isVerified = _.get(metadata, 'verified', true);

			if (isVerified) {
				monster.ui.toast({
					type: 'success',
					message: self.i18n.active().commonApp.cidNumber.verify.numberVerified
				});
			}
			callback && callback(_.merge({
				verified: true,
				id: metadata.numberId,
				number: metadata.phoneNumber
			}, _.omit(metadata, [
				'numberId',
				'phoneNumber'
			])));
		},

		cidNumberBindAddEvents: function($template, args) {
			var self = this,
				$form = $template.find('#form_add_cid_number'),
				$btnGroup = $form.find('.js-submit').parent(),
				getPhoneNumber = _.flow(
					_.bind(monster.ui.getFormData, monster.util, $form.get(0)),
					_.partial(_.get, _, 'phoneNumber'),
					monster.util.unformatPhoneNumber
				),
				onRequestError = function(numberId) {
					monster.ui.toast({
						type: 'error',
						message: self.i18n.active().commonApp.cidNumber.add.errorVerify
					});
					self.cidNumberRequestDelete({
						data: _.merge({
							numberId: numberId
						}, _.pick(args, [
							'accountId'
						]))
					});
					toggleBtnGroup();
				},
				onAddSuccess = function(action, data) {
					var onRequestErrorWithId = _.partial(onRequestError, data.id),
						numberMetadata = {
							numberId: data.id,
							phoneNumber: data.number
						},
						callbacksPerAction = {
							save: function() {
								args.closePopup();

								self.cidNumberGlobalCallback(_.merge({
									verified: false
								}, numberMetadata), args.onVerified);
							},
							send: function() {
								self.cidNumberRenderVerify(_.merge(_.pick(args, [
									'accountId',
									'onVerified'
								]), numberMetadata));
								args.closePopup();
							},
							verify: _.bind(self.cidNumberRequestSubmitPin, self, {
								data: {
									acountId: args.accountId,
									numberId: data.id
								},
								success: function(data) {
									args.closePopup();

									self.cidNumberGlobalCallback(numberMetadata, args.onVerified);
								},
								error: onRequestErrorWithId
							})
						},
						callback = _.get(callbacksPerAction, action);

					callback();
				},
				toggleBtnGroup = function() {
					var isDisabled = $btnGroup.find('button:first-child').is(':disabled');

					$btnGroup.find('> button').prop('disabled', isDisabled ? false : 'disabled');
				};

			monster.ui.validate($form, {
				rules: {
					phoneNumber: {
						required: true,
						phoneNumber: true
					}
				}
			});

			$form.find('.js-submit').on('click', function(event) {
				event.preventDefault();

				if (!monster.ui.valid($form)) {
					return;
				}

				var $button = $(this),
					action = $button.data('action'),
					phoneNumber = getPhoneNumber();

				toggleBtnGroup();

				self.cidNumberRequestAdd({
					data: {
						accountId: args.accountId,
						data: {
							number: phoneNumber
						}
					},
					success: _.partial(onAddSuccess, action),
					error: function() {
						var $input = $form.find('#phone_number');

						$input.rules('add', {
							normalizer: monster.util.unformatPhoneNumber,
							checkList: _
								.chain($input.rules())
								.get('checkList', [])
								.concat(phoneNumber)
								.value()
						});
						monster.ui.valid($form);
						toggleBtnGroup();
					}
				});
			});
		},

		/**
		 * Prompts number verification dialog.
		 * @param  {Object} args
		 * @param  {Object} args.accountId
		 * @param  {Object} args.numberId
		 * @param  {Object} args.phoneNumber
		 * @param  {Object} args.onVerified
		 * @param  {Object} [args.deleteUnverifiedOnClose=true]
		 */
		cidNumberRenderVerify: function(args) {
			var self = this,
				deleteUnverifiedOnClose = _.get(args, 'deleteUnverifiedOnClose', true),
				formattedPhoneNumber = _
					.chain(args.phoneNumber)
					.thru(monster.util.getFormatPhoneNumber)
					.get('userFormat')
					.value(),
				$template = $(self.getTemplate({
					name: 'verify',
					data: {
						phoneNumber: formattedPhoneNumber
					},
					submodule: 'cidNumber'
				})),
				popup = monster.ui.dialog($template, {
					title: self.i18n.active().commonApp.cidNumber.verify.title,
					onClose: function() {
						if (
							self.appFlags.cidNumber.isVerified
							|| !deleteUnverifiedOnClose
						) {
							return;
						}
						self.cidNumberRequestDelete({
							data: _.pick(args, [
								'accountId',
								'numberId'
							])
						});
					}
				});

			self.cidNumberRequestTriggerVerify({
				data: {
					acountId: args.accountId,
					numberId: args.numberId
				}
			});

			_.set(self, 'appFlags.cidNumber.isVerified', false);

			$template.find('.pin').first().focus();

			self.cidNumberBindVerifyEvents($template, _.merge({
				closePopup: _.bind(popup.dialog, popup, 'close')
			}, _.pick(args, [
				'accountId',
				'numberId',
				'onVerified',
				'phoneNumber'
			])));
		},

		cidNumberBindVerifyEvents: function($template, args) {
			var self = this,
				$form = $template.find('#form_verify_pin'),
				$inputs = $form.find('.pin'),
				$notifications = $form.find('.notifications'),
				getPin = _.flow(
					_.bind(monster.ui.getFormData, monster.ui, $form.get(0)),
					_.partial(_.get, _, 'pin'),
					_.partial(_.join, _, '')
				),
				updateLink = function($link, duration) {
					$link
						.addClass('sent')
						.data('duration', duration)
						.text(self.getTemplate({
							name: '!' + self.i18n.active().commonApp.cidNumber.verify.sent,
							data: {
								duration: monster.util.friendlyTimer(duration)
							}
						}));
				};

			monster.ui.mask($inputs, '0');

			$inputs.on('input', function(event) {
				var $input = $(this),
					$nextInput = $input.next('input'),
					isLastInput = $nextInput.length === 0;

				$notifications.removeClass('error');

				if (isLastInput) {
					return;
				}
				if ($input.val() !== '') {
					$nextInput.focus();
				}
			});

			$inputs.on('keyup', function(event) {
				var $input = $(this),
					$prevInput = $input.prev('input'),
					isFirstInput = $prevInput.length === 0,
					$nextInput = $input.next('input'),
					isLastInput = $nextInput.length === 0;

				switch (event.key) {
					case 'Backspace':
					case 'ArrowLeft':
						if (!isFirstInput) {
							$prevInput.focus();
						}
						break;
					case 'ArrowRight':
						if (!isLastInput) {
							$nextInput.focus();
						}
						break;
				}
			});

			$inputs.on('input', function() {
				var pin = getPin();

				if (_.size(pin) !== 4) {
					return;
				}

				$inputs.prop('disabled', 'disabled');
				$notifications.addClass('verifying');

				self.cidNumberRequestSubmitPin({
					data: _.merge({
						data: {
							code: pin
						}
					}, _.pick(args, [
						'accountId',
						'numberId'
					])),
					success: function() {
						self.appFlags.cidNumber.isVerified = true;
						args.closePopup();

						self.cidNumberGlobalCallback(_.pick(args, [
							'numberId',
							'phoneNumber'
						]), args.onVerified);
					},
					error: function(data) {
						$inputs
							.prop('disabled', false)
							.last()
							.focus();

						$notifications.toggleClass('error verifying');
					}
				});
			});

			$form.find('.js-resend:not(.disabled)').on('click', function(event) {
				event.preventDefault();

				var $link = $(this);

				if ($link.hasClass('disabled')) {
					return;
				}
				$link.addClass('disabled');

				self.cidNumberRequestTriggerVerify({
					data: _.pick(args, [
						'accountId',
						'numberId'
					]),
					success: function() {
						var duration = 5;

						updateLink($link, duration);

						var intervalId = setInterval(function() {
							var newDuration = $link.data('duration') - 1;

							if (newDuration > 0) {
								return updateLink($link, newDuration);
							}
							clearInterval(intervalId);
							$link
								.removeClass('sent disabled')
								.text(self.i18n.active().commonApp.cidNumber.verify.resend);
						}, 1000);
					},
					error: function() {
						monster.ui.toast({
							type: 'error',
							message: self.i18n.active().commonApp.cidNumber.add.errorVerify
						});
						$link.removeClass('disabled');
					}
				});
			});

			$form.find('.cancel').on('click', function(event) {
				event.preventDefault();

				args.closePopup();
			});
		},

		/**
		 * @param  {Object} args
		 * @param  {String} args.accountId
		 * @param  {String} args.numberId
		 * @param  {Function} [args.onVerified]
		 */
		cidNumberForceVerify: function(args) {
			var self = this;

			self.cidNumberRequestSubmitPin({
				data: _.merge({
					generateError: false
				}, _.pick(args, [
					'accountId',
					'numberId'
				])),
				success: function(data) {
					self.cidNumberGlobalCallback({
						numberId: data.id,
						phoneNumber: data.number
					}, args.onVerified);
				},
				error: function() {
					monster.ui.toast({
						type: 'error',
						message: self.i18n.active().commonApp.cidNumber.add.errorVerify
					});
				}
			});
		},

		cidNumberRequestList: function(args) {
			var self = this;

			self.callApi({
				resource: 'externalNumbers.list',
				data: {
					accountId: self.accountId
				},
				success: _.flow(
					_.partial(_.get, _, 'data'),
					args.success
				)
			});
		},

		cidNumberRequestAdd: function(args) {
			var self = this;

			self.callApi({
				resource: 'externalNumbers.create',
				data: _.merge({
					generateError: false,
					accountId: self.accountId
				}, args.data),
				success: _.flow(
					_.partial(_.get, _, 'data'),
					args.success
				),
				error: function(parsedError, error, globalHandler) {
					if (error.status === 400) {
						args.error(parsedError);
					} else {
						globalHandler(parsedError, { generateError: true });
					}
				}
			});
		},

		cidNumberRequestDelete: function(args) {
			var self = this;

			self.callApi({
				resource: 'externalNumbers.delete',
				data: _.merge({
					accountId: self.accountId
				}, args.data)
			});
		},

		cidNumberRequestTriggerVerify: function(args) {
			var self = this,
				success = _.get(args, 'success', function() {}),
				error = _.get(args, 'error', function() {});

			self.callApi({
				resource: 'externalNumbers.verify',
				data: _.merge({
					generateError: false,
					accountId: self.accountId,
					data: {
						method: 'voice'
					}
				}, args.data),
				success: _.flow(
					_.partial(_.get, _, 'data'),
					success
				),
				error: error
			});
		},

		cidNumberRequestSubmitPin: function(args) {
			var self = this;

			self.callApi({
				resource: 'externalNumbers.submitPin',
				data: _.merge({
					generateError: false,
					accountId: self.accountId
				}, args.data),
				success: _.flow(
					_.partial(_.get, _, 'data'),
					args.success
				),
				error: args.error
			});
		}
	};
});
