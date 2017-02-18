define(function(require) {
	var $ = require('jquery'),
		_ = require('underscore'),
		monster = require('monster'),
		toastr = require('toastr');

	var balance = {

		requests: {
		},

		subscribe: {
			'myaccount.balance.renderContent': '_balanceRenderContent',
			'myaccount.balance.addCreditDialog': '_balanceRenderAddCredit',
			'myaccount.refreshBadges': '_balanceRefreshBadge'
		},

		balanceRange: 'monthly',

		_balanceRefreshBadge: function(args) {
			var self = this;

			if(!args.hasOwnProperty('except') || args.except !== 'balance') {
				self.balanceGet(function(data) {
					var argsBadge = {
						module: 'balance',
						data: self.i18n.active().currencyUsed + parseFloat(data.data.balance).toFixed(2),
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
					self.balanceGet(function(data) {
						var amount = parseFloat(data.data.balance).toFixed(2);

						callback(null, amount);
					});
				}
			}, function(err, results) {
				monster.pub('myaccount.UIRestrictionsCompatibility', {
					restrictions: monster.apps.auth.originalAccount.ui_restrictions,
					callback: function(uiRestrictions) {
						var renderData = $.extend(true, {}, { uiRestrictions: uiRestrictions, amount: results.balance });

						renderData.uiRestrictions.balance.show_header = (renderData.uiRestrictions.balance.show_credit === false && renderData.uiRestrictions.balance.show_minutes === false) ? false : true;

						var balance = $(self.getTemplate({ name: 'layout', data: renderData, submodule: 'balance' })),
							args = {
								module: 'balance',
								data: self.i18n.active().currencyUsed + renderData.amount
							};

						self.balanceBindEvents(balance, renderData.uiRestrictions.balance.show_credit);

						self.balanceGetAllTransactions(balance, function(data) {
							self.balanceDisplayPerMinuteTable(balance, renderData.uiRestrictions.balance.show_credit, function() {
								monster.pub('myaccount.updateMenu', args);

								monster.pub('myaccount.renderSubmodule', balance);

								if (typeof argsCallback === 'function') {
									argsCallback(balance);
								}
							}, data);
						});
					}
				});
			});
		},

		balanceGetAllTransactions: function(template, callback, optFilters) {
			var self = this,
				fromDate = template.find('input.filter-from').datepicker('getDate'),
				toDate = template.find('input.filter-to').datepicker('getDate'),
				filters = $.extend({}, {
					created_from: monster.util.dateToBeginningOfGregorianDay(fromDate),
					created_to: monster.util.dateToEndOfGregorianDay(toDate)
				}, optFilters || {});

			self.balanceGetLedgersTransactions(filters, function(data) {
				self.balanceUpdateStats(template, data);

				callback && callback(data);
			});
		},

		balanceUpdateStats: function(template, data) {
			var self = this,
				formattedData = self.balanceGetFormattedStats(data);

			template.find('#call_charges').html(formattedData.totalCharges);
			template.find('#minutes_used').html(formattedData.totalMinutes);
			template.find('#data_used').html(formattedData.totalMobileData);

			if(formattedData.hasMobile === false) {
				template.find('.mobile-required').hide();
			} else {
				template.find('.mobile-required').show();
			}
		},

		balanceGetFormattedStats: function(data) {
			var self = this,
				totalMb = 0,
				formattedData = {
					totalMinutes: 0,
					totalCharges: 0,
					totalMobileData: 0,
					hasMobile: data.types.indexOf('mobile_data') >= 0,
					hasVoip: data.types.indexOf('per-minute-voip') >= 0
				};

			if(data.allLedgers.length > 0) {
				_.each(data.allLedgers, function(ledger) {
					if(ledger.source.service === 'per-minute-voip') {
						var duration;

						if(ledger.usage && ledger.usage.hasOwnProperty('quantity')) {
							duration = Math.ceil((parseInt(ledger.usage.quantity)) / 60);
							formattedData.totalMinutes += duration;
						}

						formattedData.totalCharges += parseFloat(ledger.amount);
					} else if(ledger.source.service === 'mobile_data') {
						totalMb += ledger.usage.quantity;
					}
				});

				formattedData.totalCharges = formattedData.totalCharges.toFixed(3);
			}

			var bytes = monster.util.formatBytes(totalMb * 1000000);
			formattedData.totalMobileData = bytes.value + ' ' + bytes.unit.symbol;

			return formattedData;
		},

		balanceGetDialogData: function(callback) {
			var self = this;

			monster.parallel({
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
					self.callApi({
						resource: 'balance.get',
						data: {
							accountId: self.accountId
						},
						success: function(data) {
							callback(null, data.data);
						}
					});
				}
			}, function(err, results) {
				var data = self.balanceFormatDialogData(results);

				callback && callback(data);
			});
		},

		balanceFormatDialogData: function(data) {
			var self = this,
				amount = data.balance.balance.toFixed(2) || '0.00',
				thresholdData = {},
				topupData = { enabled: false };

			if (data.account.hasOwnProperty('notifications') && data.account.notifications.hasOwnProperty('low_balance')) {
				$.extend(true, thresholdData, data.account.notifications.low_balance);
			} else if (data.account.hasOwnProperty('threshold')) {
				$.extend(true, thresholdData, data.account.threshold);
				thresholdData.enabled = true;
			}

			if(!thresholdData.hasOwnProperty('enabled')) {
				thresholdData.enabled = true;

				if(!thresholdData.hasOwnProperty('threshold')) {
					thresholdData.threshold = 5;
				}
			}

			if(data.account.hasOwnProperty('topup')) {
				topupData.enabled = true;

				$.extend(true, topupData, data.account.topup);
			}

			var templateData = {
				amount: amount,
				threshold: thresholdData,
				topup: topupData
			};

			return templateData;
		},

		_balanceRenderAddCredit: function(args) {
			var self = this,
				popup;

			self.balanceGetDialogData(function(data) {
				var templateData = $.extend({ disableBraintree: monster.config.disableBraintree }, data),
					addCreditDialog = $(self.getTemplate({ name: 'addCreditDialog', data: templateData, submodule: 'balance' })),
					dataUpdate = {
						module: self.name,
						data: parseFloat(data.amount).toFixed(2)
					};

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

		balanceDisplayMobileTable: function(parent, showCredits, afterRender, preloadedData) {
			var self = this,
				template = $(self.getTemplate({ name: 'mobile-table', submodule: 'balance' })),
				fromDate = parent.find('input.filter-from').datepicker('getDate'),
				toDate = parent.find('input.filter-to').datepicker('getDate');

			monster.ui.footable(template.find('.footable'), {
				getData: function(filters, callback) {
					filters = $.extend(true, filters, {
						created_from: monster.util.dateToBeginningOfGregorianDay(fromDate),
						created_to: monster.util.dateToEndOfGregorianDay(toDate)
					});

					self.balanceMobileGetRows(parent, filters, showCredits, callback, preloadedData);
				},
				backendPagination: {
					enabled: true
				},
				afterInitialized: function() {
					afterRender && afterRender();
					parent.find('.table-container').empty().append(template);
				}
			});
		},

		balanceMobileGetRows: function(template, filters, showCredits, callback, preloadedData) {
			var self = this,
				afterDataFetched = function(data) {
					var formattedData = self.balanceFormatMobileDataTable(data, showCredits),
						$rows = $(self.getTemplate({ name: 'mobile-rows', data: formattedData, submodule: 'balance' }));

					// monster.ui.footable requires this function to return the list of rows to add to the table, as well as the payload from the request, so it can set the pagination filters properly
					callback && callback($rows, data);
				};

			if(preloadedData) {
				afterDataFetched(preloadedData);
			} else {
				self.balanceGetAllTransactions(template, function(data) {
					afterDataFetched(data);
				}, filters);
			}
		},

		balanceFormatMobileDataTable: function(dataRequest, showCredits) {
			var self = this,
				data = {
					transactions: []
				};
			var self = this;

			if(dataRequest.allLedgers.length > 0) {
				_.each(dataRequest.allLedgers, function(ledgerDoc) {
					if(ledgerDoc.source.service === 'mobile_data') {
						data.transactions.push(ledgerDoc);
					}
				});
			}

			return data;
		},

		balanceDisplayPerMinuteTable: function(parent, showCredits, afterRender, preloadedData) {
			var self = this,
				template = $(self.getTemplate({ name: 'per-minute-voip-table', submodule: 'balance' })),
				fromDate = parent.find('input.filter-from').datepicker('getDate'),
				toDate = parent.find('input.filter-to').datepicker('getDate');

			monster.ui.footable(template.find('.footable'), {
				getData: function(filters, callback) {
					filters = $.extend(true, filters, {
						created_from: monster.util.dateToBeginningOfGregorianDay(fromDate),
						created_to: monster.util.dateToEndOfGregorianDay(toDate)
					});

					self.balancePerMinuteGetRows(parent, filters, showCredits, callback, preloadedData);
				},
				backendPagination: {
					enabled: true
				},
				afterInitialized: function() {
					afterRender && afterRender();
					parent.find('.table-container').empty().append(template);
				}
			});
		},

		balancePerMinuteGetRows: function(template, filters, showCredits, callback, preloadedData) {
			var self = this,
				afterDataFetched = function(data) {
					var formattedData = self.balanceFormatPerMinuteDataTable(data, showCredits),
						$rows = $(self.getTemplate({ name: 'per-minute-voip-rows', data: formattedData, submodule: 'balance' }));

					// monster.ui.footable requires this function to return the list of rows to add to the table, as well as the payload from the request, so it can set the pagination filters properly
					callback && callback($rows, data);
				};

			if(preloadedData) {
				afterDataFetched(preloadedData);
			} else {
				self.balanceGetAllTransactions(template, function(data) {
					afterDataFetched(data);
				}, filters);
			}
		},

		balanceFormatPerMinuteDataTable: function(dataRequest, showCredits) {
			var self = this,
				data = {
					transactions: [],
					showCredits: showCredits
				};

			if(dataRequest.allLedgers.length > 0) {
				$.each(dataRequest.allLedgers, function(k, v) {
					if(v.source.service === 'per-minute-voip') {
						v.metadata = v.metadata || {
							to: '-',
							from: '-'
						};

						v.metadata.call = { direction: v.metadata.direction || 'inbound', call_id: v.call_id };

						var duration = self.i18n.active().balance.active_call,
							accountName = v.account.name,
							friendlyAmount = self.i18n.active().currencyUsed + parseFloat(v.amount).toFixed(3),
							fromField = monster.util.formatPhoneNumber(v.metadata.from || '').replace(/@.*/, ''),
							toField = monster.util.formatPhoneNumber(v.metadata.to || '').replace(/@.*/, '');

						if(v.usage && v.usage.hasOwnProperty('quantity')) {
							duration = Math.ceil((parseInt(v.usage.quantity)) / 60);
						}

						data.transactions.push({
							direction: v.metadata.call.direction,
							callId: v.id,
							timestamp: v.period.start,
							fromField: fromField,
							toField: toField,
							accountName: accountName,
							duration: duration,
							friendlyAmount: friendlyAmount
						});
					}
				});
			}

			return data;
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

			if(data.hasOwnProperty('threshold')) {
				data.notifications.low_balance.enabled = true;
				data.notifications.low_balance.threshold = data.threshold.threshold;

				delete data.threshold;
			}

			if(!data.notifications.low_balance.hasOwnProperty('enabled')) {
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
				thresholdAlertsContent = parent.find('#threshold_alerts_content'),
				thresholdAlertsSwitch = parent.find('#threshold_alerts_switch'),
				autoRechargeContent = parent.find('#auto_recharge_content'),
				autoRechargeSwitch = parent.find('#auto_recharge_switch');

			parent
				.find('.navbar-menu-item-link')
					.on('click', function(event) {
						event.preventDefault();

						var $this = $(this),
							renderTabContent = function() {
								if (!tabAnimationInProgress) {
									tabAnimationInProgress = true;

									parent.find('.add-credits-content-wrapper.active')
											.fadeOut(function() {
												parent
													.find('.navbar-menu-item-link.active')
													.removeClass('active');

												$this.addClass('active');
												$(this).removeClass('active');

												parent
													.find(event.target.hash)
														.fadeIn(function() {
															$(this)
																.addClass('active');

															tabAnimationInProgress = false;
														});
											});
								}
							};

						if (parent.find('.add-credits-content-wrapper.active input[type="checkbox"]').is(':checked')) {
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

			parent.find('#add_credit').on('click', function(ev) {
				ev.preventDefault();

				var creditsToAdd = parseFloat(parent.find('#amount').val().replace(',', '.'));

				if(creditsToAdd) {
					self.balanceAddCredits(creditsToAdd,
						function() {
							var dataToastr = {
								amount: self.i18n.active().currencyUsed + creditsToAdd
							};

							toastr.success(monster.template(self, '!' + self.i18n.active().balance.creditsAdded, dataToastr));

							if(typeof params.callback === 'function') {
								self.balanceGet(function(data) {
									params.callback(data.data.balance);
									parent.dialog('close');
								});
							} else {
								parent.dialog('close');
							}
						}
					);
				} else{
					monster.ui.alert(self.i18n.active().balance.invalidAmount);
				}
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
										toastr.success(self.i18n.active().balance.thresholdAlertsCancelled);
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

						if(dataAlerts.threshold) {
							if (dataAlerts.threshold) {
								self.balanceUpdateThreshold(dataAlerts.threshold, function() {
									parent.dialog('close');
									toastr.success(self.i18n.active().balance.thresholdAlertsEnabled);
								});
							} else {
								monster.ui.alert(self.i18n.active().balance.invalidAmount);
							}
						} else {
							monster.ui.alert(self.i18n.active().balance.invalidAmount);
						}
					});

			autoRechargeSwitch.on('change', function() {
				if($(this).is(':checked')) {
					autoRechargeContent.slideDown();
				} else {
					if (autoRecharge) {
						self.balanceTurnOffTopup(function() {
							autoRechargeContent
								.slideUp(function() {
									autoRecharge = false;
									toastr.success(self.i18n.active().balance.autoRechargeCancelled);
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
					dataTopUp = {
						threshold: parseFloat(autoRechargeFormData.auto_recharge_threshold.replace(',', '.')),
						amount: parseFloat(autoRechargeFormData.auto_recharge_amount.replace(',', '.'))
					};

				if (dataTopUp.threshold && dataTopUp.amount) {
					if(dataTopUp.threshold && dataTopUp.amount) {
						self.balanceUpdateTopUp(dataTopUp, function() {
							parent.dialog('close');
							toastr.success(self.i18n.active().balance.autoRechargeEnabled);
						});
					} else{
						monster.ui.alert(self.i18n.active().balance.invalidAmount);
					}
				} else {
					monster.ui.alert(self.i18n.active().balance.invalidAmount);
				}
			});
		},

		balanceBindEvents: function(template, showCredits, afterRender) {
			var self = this;

			setTimeout(function() { template.find('.search-query').focus(); });

			var optionsDatePicker = {
					container: template,
					range: self.balanceRange
				},
				dates = monster.util.getDefaultRangeDates(self.balanceRange),
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
						var formattedAmount = parseFloat(amount).toFixed(2),
							newAmount = self.i18n.active().currencyUsed + formattedAmount,
							argsEvent = {
								module: 'balance',
								data: newAmount
							};

						monster.pub('myaccount.updateMenu', argsEvent);
						parent.find('#amount').html(formattedAmount);
					}
				};

				self._balanceRenderAddCredit(args);
			});

			template.find('.tab-type-ledger').on('click', function() {
				template.find('.tab-type-ledger').removeClass('active');
				$(this).addClass('active');

				self.balanceRefreshActiveTable(template, showCredits);
			});
		},

		balanceDownloadActiveTable: function(template) {
			var self = this,
				from = new Date(template.find('#startDate').val()),
				to = new Date(template.find('#endDate').val()),
				dlFrom = monster.util.dateToBeginningOfGregorianDay(from),
				dlTo = monster.util.dateToEndOfGregorianDay(to),
				type = template.find('.tab-type-ledger.active').data('type'),
				url = self.apiUrl + 'accounts/' + self.accountId + '/ledgers/' + type + '?created_from=' + dlFrom + '&created_to=' + dlTo + '&accept=csv&auth_token=' + self.getAuthToken();

			window.open(url, '_blank');
		},

		balanceRefreshActiveTable: function(template, showCredits, afterRender) {
			var self = this,
				type = template.find('.tab-type-ledger.active').data('type');

			template.find('.table-container').empty();

			if(type === 'per-minute-voip') {
				self.balanceDisplayPerMinuteTable(template, showCredits, afterRender);
			} else if(type === 'mobile_data') {
				self.balanceDisplayMobileTable(template, showCredits, afterRender);
			}
		},

		//utils
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
					if(data.data.hasOwnProperty('topup')) {
						delete data.data.topup;

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

		balanceGetLedgersTransactions: function(filters, callback) {
			var self = this,
				parallelRequests = {},
				formattedData = {
					allLedgers: [],
					types: []
				};

			self.balanceListLedgers(function(ledgers) {
				_.each(ledgers, function(ledger, name) {
					parallelRequests[name] = function(callback) {
						self.balanceGetLedgerDocuments(name, filters, function(documents) {
							callback && callback(null, documents);
						});
					};
				});

				monster.parallel(parallelRequests, function(err, results) {
					var arrayResults = [];

					_.each(results, function(ledgerDocuments, type) {
						// for now we only want to list per minute voip, will change once we have more data from ledgers
						//if(type === 'per-minute-voip') {
						formattedData.types.push(type);
						arrayResults = arrayResults.concat(ledgerDocuments);
						//}
					});

					formattedData.allLedgers = arrayResults;

					callback && callback(formattedData);
				});
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
					callback && callback(data.data);
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
				resource: 'balance.get',
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

		balanceAddCredits: function(credits, success, error) {
			var self = this,
				data = {
					amount: credits
				};

			self.balanceUpdateRecharge(data, success, error);
		},

		balanceUpdateRecharge: function(data, success, error) {
			var self = this;

			self.callApi({
				resource: 'balance.add',
				data: {
					accountId: self.accountId,
					data: data
				},
				success: function(data, status) {
					success && success(data, status);
				},
				error: function(data, status) {
					error && error(data, status);
				}
			});
		}
	};

	return balance;
});
