define(function(require) {
	var $ = require('jquery'),
		_ = require('lodash'),
		monster = require('monster');

	var balance = {

		requests: {
		},

		subscribe: {
			'myaccount.balance.renderContent': '_balanceRenderContent',
			'myaccount.balance.addCreditDialog': '_balanceRenderAddCredit',
			'myaccount.refreshBadges': '_balanceRefreshBadge'
		},

		appFlags: {
			balance: {
				customLedgers: {
					'recurring': {
						format: 'balanceFormatRecurringDataTable',
						table: 'recurring-table',
						rows: 'recurring-rows'
					},
					'per-minute-voip': {
						format: 'balanceFormatPerMinuteDataTable',
						table: 'per-minute-voip-table',
						rows: 'per-minute-voip-rows'
					},
					'mobile_data': {
						format: 'balanceFormatMobileDataTable',
						table: 'mobile-table',
						rows: 'mobile-rows'
					}
				},
				digits: {
					availableCreditsBadge: 2,
					callChargesBadge: 3,
					genericTableAmount: 2,
					recurringTableAmount: 2,
					perMinuteTableAmount: 4
				},
				range: 'monthly',
				topupDupData: {}
			}
		},

		_balanceRefreshBadge: function(args) {
			var self = this;

			if (!args.hasOwnProperty('except') || args.except !== 'balance') {
				self.balanceGet(function(balance) {
					var argsBadge = {
						module: 'balance',
						data: monster.util.formatPrice({
							price: balance,
							digits: self.appFlags.balance.digits.availableCreditsBadge
						}),
						callback: args.callback
					};

					monster.pub('myaccount.updateMenu', argsBadge);
				});
			}
		},

		_balanceRenderContent: function(args) {
			var self = this,
				argsCallback = args.callback;

			monster.parallel({
				balance: function(callback) {
					self.balanceGet(function(balance) {
						var amount = parseFloat(balance).toFixed(self.appFlags.balance.digits.availableCreditsBadge);

						callback(null, amount);
					});
				}
			}, function(err, results) {
				monster.pub('myaccount.UIRestrictionsCompatibility', {
					restrictions: monster.apps.auth.originalAccount.ui_restrictions,
					callback: function(uiRestrictions) {
						var renderData = $.extend(true, {}, {
							currencySymbol: monster.util.getCurrencySymbol(),
							uiRestrictions: uiRestrictions,
							amount: monster.util.formatPrice({
								price: results.balance,
								digits: self.appFlags.balance.digits.availableCreditsBadge
							})
						});

						renderData.uiRestrictions.balance.show_header = (renderData.uiRestrictions.balance.show_credit === false && renderData.uiRestrictions.balance.show_minutes === false) ? false : true;

						var balance = $(self.getTemplate({ name: 'layout', data: renderData, submodule: 'balance' })),
							args = {
								module: 'balance',
								data: renderData.amount
							};

						self.balanceBindEvents(balance, renderData.uiRestrictions.balance.show_credit);

						self.balanceDisplayGenericTable('per-minute-voip', balance, renderData.uiRestrictions.balance.show_credit, function() {
							monster.pub('myaccount.updateMenu', args);

							monster.pub('myaccount.renderSubmodule', balance);

							if (typeof argsCallback === 'function') {
								argsCallback(balance);
							}
						});
					}
				});
			});
		},

		balanceGetDataPerLedger: function(ledgerName, template, callback, optFilters) {
			var self = this,
				fromDate = template.find('input.filter-from').datepicker('getDate'),
				toDate = template.find('input.filter-to').datepicker('getDate'),
				filters = $.extend({}, {
					created_from: monster.util.dateToBeginningOfGregorianDay(fromDate, 'UTC'),
					created_to: monster.util.dateToEndOfGregorianDay(toDate, 'UTC')
				}, optFilters || {});

			monster.parallel({
				globalLedgers: function(callback) {
					var globalFilters = {
						created_from: filters.created_from,
						created_to: filters.created_to
					};

					self.balanceListFilteredLedgers(globalFilters, function(data) {
						callback(null, data);
					});
				},
				ledger: function(callback) {
					self.balanceGetLedgerDocuments(ledgerName, filters, function(documents) {
						callback(null, documents);
					});
				}
			}, function(err, results) {
				self.balanceUpdateStats(template, results, ledgerName);

				callback && callback(results);
			});
		},

		balanceUpdateStats: function(template, data, currentLedger) {
			var self = this,
				formattedData = self.balanceGetFormattedStats(data);

			template.find('#call_charges').html(formattedData.totalCharges);
			template.find('#minutes_used').html(formattedData.totalMinutes);
			template.find('#data_used').html(formattedData.totalMobileData);

			_.each(data.globalLedgers, function(ledger, ledgerName) {
				if (template.find('.tab-type-ledger[data-type="' + ledgerName + '"]').length === 0) {
					template.find('.ledger-tabs').append(self.getTemplate({ name: 'generic-tab-ledger', data: { ledgerName: ledgerName }, submodule: 'balance' }));
				}

				template.find('.tab-type-ledger[data-type="' + ledgerName + '"]').show();
				template.find('.title-box[data-type="' + ledgerName + '"]').show();
			});
		},

		balanceGetFormattedStats: function(data) {
			var self = this,
				bytes = monster.util.formatBytes(0),
				formattedData = {
					totalMinutes: 0,
					totalCharges: 0,
					totalMobileData: bytes.value + ' ' + bytes.unit.symbol
				};

			if (!_.isEmpty(data.globalLedgers)) {
				if (data.globalLedgers.hasOwnProperty('per-minute-voip')) {
					var ledger = data.globalLedgers['per-minute-voip'],
						duration;

					if (ledger.usage && ledger.usage.hasOwnProperty('quantity')) {
						duration = Math.ceil((parseInt(ledger.usage.quantity)) / 60);
						formattedData.totalMinutes = duration;
					}

					// We now divide by 1 because the amount returned is negative
					formattedData.totalCharges = monster.util.formatPrice({
						price: ledger.amount / -1,
						digits: self.appFlags.balance.digits.callChargesBadge
					});
				}

				if (data.globalLedgers.hasOwnProperty('mobile_data')) {
					var ledger = data.globalLedgers.mobile_data,
						bytes = monster.util.formatBytes(ledger.usage.quantity * 1000000);

					formattedData.totalMobileData = bytes.value + ' ' + bytes.unit.symbol;
				}
			}

			return formattedData;
		},

		balanceGetDialogData: function(callback) {
			var self = this;

			monster.parallel({
				serviceSummary: function(callback) {
					self.callApi({
						resource: 'services.getSummary',
						data: {
							accountId: self.accountId
						},
						success: function(data) {
							callback(null, data.data);
						}
					});
				},
				account: function(callback) {
					self.callApi({
						resource: 'account.get',
						data: {
							accountId: self.accountId
						},
						success: function(data) {
							callback(null, data.data);
						}
					});
				},
				balance: function(callback) {
					self.balanceGet(function(data) {
						callback(null, data);
					});
				}
			}, function(err, results) {
				var data = self.balanceFormatDialogData(results);

				callback && callback(data);
			});
		},

		/**
		 * @param  {Object} data
		 * @param  {Object} data.account
		 * @param  {Object} data.balance
		 * @param  {Object} data.serviceSummary
		 * @return {Object}
		 */
		balanceFormatDialogData: function(data) {
			var self = this,
				serviceSummary = _.get(data, 'serviceSummary'),
				amount = (data.balance || 0).toFixed(self.appFlags.balance.digits.availableCreditsBadge),
				thresholdData = {},
				topupData = { enabled: false },
				getSelectedSubscription = function() {
					var monthly = _.get(data, 'account.topup.monthly'),
						isPreemptive = _.get(monthly, 'preemptive', false),
						isExact = _.get(monthly, 'exact', false);

					if (
						isPreemptive
						&& (isExact || !isExact)
					) {
						return 'preemptive';
					}
					if (
						!isPreemptive
						&& isExact
					) {
						return 'exact';
					}
					return 'none';
				};

			if (data.account.hasOwnProperty('notifications') && data.account.notifications.hasOwnProperty('low_balance')) {
				$.extend(true, thresholdData, data.account.notifications.low_balance);
			} else if (data.account.hasOwnProperty('threshold')) {
				$.extend(true, thresholdData, data.account.threshold);
				thresholdData.enabled = true;
			}

			if (!thresholdData.hasOwnProperty('enabled')) {
				thresholdData.enabled = true;

				if (!thresholdData.hasOwnProperty('threshold')) {
					thresholdData.threshold = 5;
				}
			}

			if (data.account.hasOwnProperty('topup')) {
				$.extend(true, topupData, data.account.topup);
			}

			if (_.get(data, 'account.topup.amount')) {
				topupData.enabled = true;
			}

			self.appFlags.balance.topupData = topupData;
			return {
				subscriptions: {
					show: _.some(serviceSummary.invoices, {
						bookkeeper: {
							type: 'iou'
						}
					}),
					selected: getSelectedSubscription()
				},
				currencySymbol: monster.util.getCurrencySymbol(),
				amount: amount,
				threshold: thresholdData,
				topup: topupData
			};
		},

		_balanceRenderAddCredit: function(args) {
			var self = this,
				popup;

			self.balanceGetDialogData(function(data) {
				var templateData = $.extend({ disableBraintree: monster.config.disableBraintree }, data),
					addCreditDialog = $(self.getTemplate({ name: 'addCreditDialog', data: templateData, submodule: 'balance' })),
					dataUpdate = {
						module: self.name,
						data: parseFloat(data.amount).toFixed(self.appFlags.balance.digits.availableCreditsBadge)
					};

				addCreditDialog
					.find('input#amount')
						.mask('#0.00', {
							reverse: true
						});

				monster.pub('myaccount.updateMenu', dataUpdate);

				popup = monster.ui.dialog(addCreditDialog, {
					title: self.i18n.active().balance.addCreditDialogTitle
				});

				var argsDialog = {
					parent: popup,
					data: data,
					callback: args.callback
				};

				self.balanceBindEventsDialog(argsDialog);
			});
		},

		balanceFormatMobileDataTable: function(data) {
			var self = this;
			return _.map(data, function(item) {
				return {
					amount: item.amount,
					name: item.account.name,
					phoneNumber: item.source.id,
					timestamp: _.get(
						item,
						'period.end',
						_.get(item, 'period.start', undefined)
					),
					usage: item.usage
				};
			});
		},

		balanceFormatPerMinuteDataTable: function(data) {
			var self = this;
			return _.map(data, function(item) {
				var fromField = monster.util.formatPhoneNumber(item.metadata.from.replace(/@.*/, '') || ''),
					toField = monster.util.formatPhoneNumber(item.metadata.to.replace(/@.*/, '') || ''),
					callerIdNumber = monster.util.formatPhoneNumber(item.metadata.caller_id_number || ''),
					calleeIdNumber = monster.util.formatPhoneNumber(item.metadata.callee_id_number || '');
				return {
					amount: {
						value: item.amount,
						digits: self.appFlags.balance.digits.perMinuteTableAmount
					},
					calleeNumber: calleeIdNumber !== toField
						? calleeIdNumber
						: '',
					callerNumber: callerIdNumber !== fromField
						? callerIdNumber
						: '',
					callId: item.id,
					direction: _.get(item, 'metadata.direction', 'inbound'),
					from: fromField,
					minutes: _.has(item, 'usage.quantity')
						? Math.ceil(parseInt(item.usage.quantity) / 60)
						: -1,
					name: item.account.name,
					timestamp: item.period.start,
					to: toField
				};
			});
		},

		balanceFormatRecurringDataTable: function(data) {
			var self = this;
			return _
				.chain(data)
				.filter('metadata.item.billable')
				.map(function(value) {
					var item = value.metadata.item;
					return {
						timestamp: value.period.start,
						name: item.name || item.category + '/' + item.item,
						description: value.description,
						rate: {
							value: item.rate || 0,
							digits: self.appFlags.balance.digits.recurringTableAmount
						},
						quantity: item.billable || 0,
						discount: {
							value: _.get(item, 'discounts.total', undefined),
							digits: self.appFlags.balance.digits.recurringTableAmount
						},
						charges: {
							value: item.total,
							digits: self.appFlags.balance.digits.recurringTableAmount
						}
					};
				})
				.value();
		},

		balanceDisplayGenericTable: function(ledgerName, parent, showCredits, afterRender) {
			var self = this,
				template = $(self.getTemplate({
					name: _.get(self.appFlags.balance.customLedgers, ledgerName + '.table', 'generic-table'),
					data: {
						showCredits: showCredits
					},
					submodule: 'balance'
				})),
				fromDate = parent.find('input.filter-from').datepicker('getDate'),
				toDate = parent.find('input.filter-to').datepicker('getDate');

			monster.ui.footable(template.find('.footable'), {
				getData: function(filters, callback) {
					filters = $.extend(true, filters, {
						created_from: monster.util.dateToBeginningOfGregorianDay(fromDate, 'UTC'),
						created_to: monster.util.dateToEndOfGregorianDay(toDate, 'UTC')
					});

					self.balanceGenericGetRows(ledgerName, parent, filters, showCredits, callback);
				},
				backendPagination: {
					enabled: true,
					allowLoadAll: false
				},
				afterInitialized: function() {
					afterRender && afterRender();
					parent.find('.table-container').empty().append(template);
				}
			});
		},

		balanceGenericGetRows: function(ledgerName, template, filters, showCredits, callback) {
			var self = this,
				customLedger = _.get(self.appFlags.balance.customLedgers, ledgerName, {}),
				formatFunction = _.get(customLedger, 'format', 'balanceFormatGenericDataTable');

			self.balanceGetDataPerLedger(ledgerName, template, function(data) {
				var formattedData = {
						showCredits: showCredits,
						transactions: self[formatFunction](data.ledger.data)
					},
					$rows = $(self.getTemplate({
						name: _.get(customLedger, 'rows', 'generic-rows'),
						data: formattedData,
						submodule: 'balance'
					}));

				monster.ui.tooltips($rows);

				// monster.ui.footable requires this function to return the list of rows to add to the table, as well as the payload from the request, so it can set the pagination filters properly
				callback && callback($rows, data.ledger);
			}, filters);
		},

		balanceFormatGenericDataTable: function(data) {
			var self = this;
			return _.map(data, function(item) {
				return {
					amount: {
						value: item.amount,
						digits: self.appFlags.balance.digits.genericTableAmount
					},
					description: item.description,
					name: item.account.name,
					timestamp: _.get(
						item,
						'period.end',
						_.get(item, 'period.start', undefined)
					)
				};
			});
		},

		balanceGetData: function(filters, webhookId, callback) {
			var self = this;

			self.callApi({
				resource: 'webhooks.listAttempts',
				data: {
					accountId: self.accountId,
					webhookId: webhookId,
					filters: filters
				},
				success: function(data) {
					callback && callback(data);
				}
			});
		},

		balanceCleanFormData: function(module, data) {
			delete data.extra;

			return data;
		},

		balanceFormatThresholdData: function(data) {
			data.notifications = data.notifications || {};
			data.notifications.low_balance = data.notifications.low_balance || {};

			if (data.hasOwnProperty('threshold')) {
				data.notifications.low_balance.enabled = true;
				data.notifications.low_balance.threshold = data.threshold.threshold;

				delete data.threshold;
			}

			if (!data.notifications.low_balance.hasOwnProperty('enabled')) {
				data.notifications.low_balance.enabled = true;
				data.notifications.low_balance.threshold = 5;
			}

			return data;
		},

		balanceBindEventsDialog: function(params) {
			var self = this,
				parent = params.parent,
				data = params.data,
				thresholdAlerts = data.threshold.enabled,
				autoRecharge = data.topup.enabled || false,
				tabAnimationInProgress = false,
				subscriptionsContent = parent.find('#subscriptions'),
				subscriptionsRadio = subscriptionsContent.find('.subscription-option'),
				thresholdAlertsContent = parent.find('#threshold_alerts_content'),
				thresholdAlertsSwitch = parent.find('#threshold_alerts_switch'),
				autoRechargeContent = parent.find('#auto_recharge_content'),
				autoRechargeSwitch = parent.find('#auto_recharge_switch');

			parent
				.find('.navbar-menu-item-link')
					.on('click', function(event) {
						event.preventDefault();

						var $this = $(this),
							tab = $this.prop('href').match(/[^#]+$/),
							renderTabContent = function() {
								if (!tabAnimationInProgress) {
									tabAnimationInProgress = true;

									parent.find('.add-credits-content-wrapper.active')
											.fadeOut(250, function() {
												parent
													.find('.navbar-menu-item-link.active')
													.removeClass('active');

												$this.addClass('active');
												$(this).removeClass('active');

												parent
													.find(event.target.hash)
														.fadeIn(250, function() {
															$(this)
																.addClass('active');

															tabAnimationInProgress = false;
														});
											});
								}
							};

						if (
							(tab === 'threshold_alerts' || tab === 'auto_recharge')
							&& parent.find('.add-credits-content-wrapper.active input[type"checkbox"]').is(':checkbox')
						) {
							var formId = parent.find('.add-credits-content-wrapper.active form').prop('id'),
								hasEmptyValue = false,
								formData = monster.ui.getFormData(formId);

							for (var key in formData) {
								if (formData[key] === '') {
									hasEmptyValue = true;
									break;
								}
							}

							if (hasEmptyValue) {
								monster.ui.alert('warning', self.i18n.active().balance.addCreditPopup.alerts.missingValue[formId], function() {}, {
									title: self.i18n.active().balance.addCreditPopup.alerts.missingValue.title
								});
							} else {
								renderTabContent();
							}
						} else {
							renderTabContent();
						}
					});

			parent
				.find('#add_credit')
					.on('click', function(event) {
						event.preventDefault();

						var $this = $(this),
							creditsToAdd = parseFloat(parent.find('input#amount').val());

						if (_.isNaN(creditsToAdd)) {
							monster.ui.toast({
								type: 'warning',
								message: self.getTemplate({
									name: '!' + self.i18n.active().myAccountApp.balance.toast.warning.invalidTopup,
									data: {
										value: creditsToAdd
									}
								})
							});
							return;
						}

						$this.prop('disabled', true);

						monster.series([
							function(callback) {
								self.balanceRequestTopup({
									data: {
										data: {
											amount: creditsToAdd
										}
									},
									success: function() {
										callback(null);
									},
									error: function(data) {
										callback(data);
									}
								});
							},
							function(callback) {
								if (!_.isFunction(params.callback)) {
									callback(null);
									return;
								}
								self.balanceGet(function(balance) {
									params.callback(balance);
									callback(null);
								});
							}
						], function(err, results) {
							if (err) {
								monster.ui.toast({
									type: 'error',
									message: self.getTemplate({
										name: '!' + self.i18n.active().myAccountApp.balance.toast.error.topup,
										data: {
											reason: err.bookkeeper.results.message
										}
									})
								});
								$this.prop('disabled', false);
								return;
							}
							monster.ui.toast({
								type: 'success',
								message: self.getTemplate({
									name: '!' + self.i18n.active().balance.creditsAdded,
									data: {
										amount: monster.util.formatPrice({
											price: creditsToAdd
										})
									}
								})
							});
							parent.dialog('close');
						});
					});

			thresholdAlertsSwitch
				.on('change', function() {
					if ($(this).is(':checked')) {
						thresholdAlertsContent.slideDown();
					} else {
						if (thresholdAlerts) {
							self.balanceTurnOffThreshold(function() {
								thresholdAlertsContent
									.slideUp(function() {
										thresholdAlerts = false;
										monster.ui.toast({
											type: 'success',
											message: self.i18n.active().balance.thresholdAlertsCancelled
										});
									});
							});
						}
						thresholdAlertsContent.slideUp();
					}
				});

			thresholdAlertsSwitch
				.prop('checked', thresholdAlerts);

			thresholdAlertsContent.toggle(thresholdAlerts);

			parent
				.find('#save_threshold')
					.on('click', function(event) {
						event.preventDefault();

						var thresholdAlertsFormData = monster.ui.getFormData('threshold_alerts_content'),
							dataAlerts = {
								threshold: parseFloat(thresholdAlertsFormData.threshold_alerts_amount.replace(',', '.'))
							};

						if (dataAlerts.threshold) {
							if (dataAlerts.threshold) {
								self.balanceUpdateThreshold(dataAlerts.threshold, function() {
									parent.dialog('close');
									monster.ui.toast({
										type: 'success',
										message: self.i18n.active().balance.thresholdAlertsEnabled
									});
								});
							} else {
								monster.ui.alert(self.i18n.active().balance.invalidAmount);
							}
						} else {
							monster.ui.alert(self.i18n.active().balance.invalidAmount);
						}
					});

			autoRechargeSwitch.on('change', function() {
				if ($(this).is(':checked')) {
					autoRechargeContent.slideDown();
				} else {
					if (autoRecharge) {
						self.balanceTurnOffTopup(function() {
							autoRechargeContent
								.slideUp(function() {
									autoRecharge = false;
									monster.ui.toast({
										type: 'success',
										message: self.i18n.active().balance.autoRechargeCancelled
									});
								});
						});
					} else {
						autoRechargeContent.slideUp();
					}
				}
			});

			autoRechargeSwitch
				.prop('checked', autoRecharge);

			autoRechargeContent.toggle(autoRecharge);

			parent.find('#confirm_recharge').on('click', function(event) {
				event.preventDefault();

				var autoRechargeFormData = monster.ui.getFormData('auto_recharge_content'),
					topupData = self.appFlags.balance.topupData,
					dataTopUp = _.merge({}, _.omit(topupData, ['enabled']), {
						threshold: parseFloat(autoRechargeFormData.auto_recharge_threshold.replace(',', '.')),
						amount: parseFloat(autoRechargeFormData.auto_recharge_amount.replace(',', '.'))
					});

				if (dataTopUp.threshold && dataTopUp.amount) {
					if (dataTopUp.threshold && dataTopUp.amount) {
						self.balanceUpdateTopUp(dataTopUp, function() {
							parent.dialog('close');
							monster.ui.toast({
								type: 'success',
								message: self.i18n.active().balance.autoRechargeEnabled
							});
						});
					} else {
						monster.ui.alert(self.i18n.active().balance.invalidAmount);
					}
				} else {
					monster.ui.alert(self.i18n.active().balance.invalidAmount);
				}
			});

			subscriptionsRadio
				.on('change', function(event) {
					event.preventDefault();

					var $this = $(this),
						$warningElements = subscriptionsContent.find('.option .warning');

					subscriptionsRadio.prop('disabled', 'disabled');

					subscriptionsContent
						.find('.option.selected')
							.removeClass('selected');

					$this
						.parents('.option')
							.addClass('selected');

					$warningElements
						.hide();

					$this
						.parents('.option')
							.find('.warning')
								.fadeIn(250);

					self.balanceUpdateSubscriptions({
						type: $this.val(),
						success: function() {
							subscriptionsRadio.prop('disabled', false);
							monster.ui.toast({
								type: 'success',
								message: self.i18n.active().balance.addCreditPopup.subscriptions.toast.success
							});
						},
						error: function() {
							subscriptionsRadio.prop('disabled', false);
						}
					});
				});
		},

		balanceBindEvents: function(template, showCredits, afterRender) {
			var self = this;

			setTimeout(function() { template.find('.search-query').focus(); });

			var optionsDatePicker = {
					container: template,
					range: self.appFlags.balance.range
				},
				dates = monster.util.getDefaultRangeDates(self.appFlags.balance.range),
				fromDate = dates.from,
				toDate = dates.to;

			monster.ui.initRangeDatepicker(optionsDatePicker);

			template.find('#startDate').datepicker('setDate', fromDate);
			template.find('#endDate').datepicker('setDate', toDate);

			template.find('.refresh-filter').on('click', function() {
				self.balanceRefreshActiveTable(template, showCredits, afterRender);
			});

			template.find('.filter-transactions').on('click', function() {
				self.balanceRefreshActiveTable(template, showCredits, afterRender);
			});

			template.find('.download-transactions').on('click', function() {
				self.balanceDownloadActiveTable(template);
			});

			template.find('#add_credits').on('click', function() {
				var args = {
					callback: function(amount) {
						var newAmount = monster.util.formatPrice({
								price: amount,
								digits: self.appFlags.balance.digits.availableCreditsBadge
							}),
							argsEvent = {
								module: 'balance',
								data: newAmount
							};

						monster.pub('myaccount.updateMenu', argsEvent);
						template.find('#amount').html(newAmount);
					}
				};

				self._balanceRenderAddCredit(args);
			});

			template.on('click', '.tab-type-ledger', function() {
				template.find('.tab-type-ledger').removeClass('active');
				$(this).addClass('active');

				self.balanceRefreshActiveTable(template, showCredits);
			});
		},

		balanceDownloadActiveTable: function(template) {
			var self = this,
				from = template.find('input.filter-from').datepicker('getDate'),
				to = template.find('input.filter-to').datepicker('getDate'),
				dlFrom = monster.util.dateToBeginningOfGregorianDay(from, 'UTC'),
				dlTo = monster.util.dateToEndOfGregorianDay(to, 'UTC'),
				type = template.find('.tab-type-ledger.active').data('type'),
				url = self.apiUrl + 'accounts/' + self.accountId + '/ledgers/' + type + '?created_from=' + dlFrom + '&created_to=' + dlTo + '&accept=csv&auth_token=' + self.getAuthToken();

			window.open(url, '_blank');
		},

		balanceRefreshActiveTable: function(template, showCredits, afterRender) {
			var self = this,
				type = template.find('.tab-type-ledger.active').data('type');

			template.find('.table-container').empty();

			self.balanceDisplayGenericTable(type, template, showCredits, afterRender);
		},

		//utils

		/**
		 * @param  {Object} args
		 * @param  {'preemptive'|'exact'|'none'} args.type
		 * @param  {Function} [args.success]
		 * @param  {Function} [args.error]
		 */
		balanceUpdateSubscriptions: function(args) {
			var self = this,
				type = args.type,
				normalizedSubscriptions = (function(type) {
					if (type === 'preemptive') {
						return {
							preemptive: true,
							exact: false
						};
					}
					if (type === 'exact') {
						return {
							preemptive: false,
							exact: true
						};
					}
					return {
						preemptive: false,
						exact: false
					};
				})(type),
				success = _.get(args, 'success'),
				error = _.get(args, 'error');

			monster.waterfall([
				function(cb) {
					self.callApi({
						resource: 'account.get',
						data: {
							accountId: self.accountId
						},
						success: function(data) {
							cb(null, data.data);
						}
					});
				},
				function(accountData, cb) {
					_.set(accountData, 'topup.monthly.preemptive', normalizedSubscriptions.preemptive);
					_.set(accountData, 'topup.monthly.exact', normalizedSubscriptions.exact);

					self.appFlags.balance.topupData = _.get(accountData, 'topup', {});
					self.callApi({
						resource: 'account.patch',
						data: {
							accountId: self.accountId,
							data: accountData
						},
						success: function(data) {
							self.appFlags.balance.topupData = _.get(data, 'data.topup', {});
							cb(null);
						},
						error: function() {
							cb(true);
						}
					});
				}
			], function(err) {
				if (err) {
					error && error();
					return;
				}
				success && success();
			});
		},

		balanceTurnOffThreshold: function(callback) {
			var self = this;

			self.callApi({
				resource: 'account.get',
				data: {
					accountId: self.accountId
				},
				success: function(data, status) {
					data.data = self.balanceFormatThresholdData(data.data);
					data.data.notifications.low_balance.enabled = false;

					self.appFlags.balance.topupData = _.get(data, 'data.topup', {});
					self.callApi({
						resource: 'account.update',
						data: {
							accountId: self.accountId,
							data: data.data
						},
						success: function(dataUpdate) {
							callback && callback(dataUpdate);
						}
					});
				}
			});
		},

		balanceUpdateThreshold: function(valueThreshold, callback) {
			var self = this;

			self.callApi({
				resource: 'account.get',
				data: {
					accountId: self.accountId
				},
				success: function(data, status) {
					data.data = self.balanceFormatThresholdData(data.data);
					data.data.notifications.low_balance.enabled = true;
					data.data.notifications.low_balance.threshold = valueThreshold;

					self.appFlags.balance.topupData = _.get(data, 'data.topup', {});
					self.callApi({
						resource: 'account.update',
						data: {
							accountId: self.accountId,
							data: data.data
						},
						success: function(dataUpdate) {
							callback && callback(dataUpdate);
						}
					});
				}
			});
		},

		balanceTurnOffTopup: function(callback) {
			var self = this;

			self.callApi({
				resource: 'account.get',
				data: {
					accountId: self.accountId
				},
				success: function(data) {
					if (data.data.hasOwnProperty('topup')) {
						delete data.data.topup.amount;
						delete data.data.topup.threshold;

						self.appFlags.balance.topupData = _.get(data, 'data.topup', {});
						self.callApi({
							resource: 'account.update',
							data: {
								accountId: self.accountId,
								data: data.data
							},
							success: function(dataUpdate) {
								callback && callback(dataUpdate);
							}
						});
					}
				}
			});
		},

		balanceUpdateTopUp: function(dataTopUp, callback) {
			var self = this;

			self.callApi({
				resource: 'account.get',
				data: {
					accountId: self.accountId
				},
				success: function(data) {
					data.data.topup = dataTopUp;

					self.appFlags.balance.topupData = dataTopUp;
					self.callApi({
						resource: 'account.update',
						data: {
							accountId: self.accountId,
							data: data.data
						},
						success: function(dataUpdate) {
							callback && callback(dataUpdate);
						}
					});
				}
			});
		},

		balanceGetAccounts: function(success, error) {
			var self = this;

			self.callApi({
				resource: 'account.listDescendants',
				data: {
					accountId: self.accountId
				},
				success: function(data, status) {
					success && success(data, status);
				},
				error: function(data, status) {
					error && error(data, status);
				}
			});
		},

		balanceGetLimits: function(success, error) {
			var self = this;

			self.callApi({
				resource: 'limits.get',
				data: {
					accountId: self.accountId
				},
				success: function(data, status) {
					success && success(data, status);
				},
				error: function(data, status) {
					error && error(data, status);
				}
			});
		},

		balanceListFilteredLedgers: function(filters, callback) {
			var self = this;

			self.callApi({
				resource: 'ledgers.list',
				data: {
					accountId: self.accountId,
					filters: filters
				},
				success: function(data) {
					delete data.data['kazoo-rollover'];
					callback && callback(data.data);
				}
			});
		},

		balanceListLedgers: function(callback) {
			var self = this;

			self.callApi({
				resource: 'ledgers.list',
				data: {
					accountId: self.accountId
				},
				success: function(data) {
					delete data.data['kazoo-rollover'];
					callback && callback(data.data);
				}
			});
		},

		balanceGetLedgerDocuments: function(ledgerId, filters, callback) {
			var self = this;

			self.callApi({
				resource: 'ledgers.get',
				data: {
					accountId: self.accountId,
					ledgerId: ledgerId,
					filters: filters
				},
				success: function(data) {
					callback && callback(data);
				}
			});
		},

		balanceUpdateLimits: function(limits, success, error) {
			var self = this;

			self.callApi({
				resource: 'limits.update',
				data: {
					accountId: self.accountId,
					data: limits
				},
				success: function(data, status) {
					success && success(data, status);
				},
				error: function(data, status) {
					error && error(data, status);
				}
			});
		},

		balanceGet: function(success, error) {
			var self = this;

			self.callApi({
				resource: 'ledgers.total',
				data: {
					accountId: self.accountId
				},
				success: function(data, status) {
					success && success(data.data.amount, status);
				},
				error: function(data, status) {
					error && error(data, status);
				}
			});
		},

		balanceRequestTopup: function(args) {
			var self = this;

			self.callApi({
				resource: 'services.topup',
				data: _.merge({
					accountId: self.accountId,
					generateError: false
				}, args.data),
				success: function(data, status) {
					args.hasOwnProperty('success') && args.success(data.data);
				},
				error: function(parsedError, error, globalHandler) {
					if (error.status !== 500) {
						globalHandler(parsedError, {
							generateError: true
						});
						return;
					}
					args.hasOwnProperty('error') && args.error(parsedError.data);
				}
			});
		}
	};

	return balance;
});
