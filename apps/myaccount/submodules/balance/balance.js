define(function(require){
	var $ = require('jquery'),
		_ = require('underscore'),
		monster = require('monster'),
		dataTables = require('datatables'),
		toastr = require('toastr');

	var balance = {

		transactionsRange: 30,

		requests: {
			'myaccount.balance.getCredits': {
				url: 'accounts/{accountId}/braintree/credits',
				verb: 'GET'
			},
			'myaccount.balance.update': {
				url: 'accounts/{accountId}/braintree/credits',
				verb: 'PUT'
			},
			'myaccount.balance.getFilteredTransactions': {
				url: 'accounts/{accountId}/transactions?created_from={from}&created_to={to}',
				verb: 'GET'
			},
			'myaccount.balance.getDescendants': {
				url: 'accounts/{accountId}/descendants',
				verb: 'GET'
			},
			'myaccount.balance.getLimits': {
				url: 'accounts/{accountId}/limits',
				verb: 'GET'
			},
			'myaccount.balance.updateLimits': {
				url: 'accounts/{accountId}/limits',
				verb: 'POST'
			}
		},

		subscribe: {
			'myaccount.balance.renderContent': '_balanceRenderContent',
			'myaccount.balance.addCreditDialog': '_balanceRenderAddCredit',
			'myaccount.refreshBadges': '_balanceRefreshBadge'
		},

		_balanceRefreshBadge: function(args) {
			var self = this;

			self.balanceGet(function(data) {
				var argsBadge = {
					module: 'balance',
					data: self.i18n.active().currencyUsed + parseFloat(data.data.amount).toFixed(2),
					callback: args.callback
				};

				monster.pub('myaccount.updateMenu', argsBadge);
			});
		},

		_balanceRenderContent: function(args) {
			var self = this,
				defaults = {
					fieldData: {
						accounts: {}
					}
				};

			monster.parallel({
					accounts: function(callback) {
						self.balanceGetAccounts(function(dataAccounts) {
							$.each(dataAccounts.data, function(k, v) {
								defaults.fieldData.accounts[v.id] = v;
							});

							callback(null, defaults);
						});
					},
					balance: function(callback) {
						self.balanceGet(function(data) {
							defaults.amount = parseFloat(data.data.amount).toFixed(2);

							callback(null, data)
						});
					},
					transactions: function(callback) {
						self.balanceGetTransactions(function(dataTransactions) {
							callback(null, dataTransactions)
						});
					}
				},
				function(err, results) {
					monster.pub('myaccount.UIRestrictionsCompatibility', {
						restrictions: monster.apps.auth.originalAccount.ui_restrictions,
						callback: function(uiRestrictions) {

							var renderData = $.extend(true, {},
													  defaults,
													  self.balanceFormatTableData(results.transactions.data, defaults.fieldData.accounts),
													  {uiRestrictions: uiRestrictions}
													 );

							renderData.uiRestrictions.balance.show_header = ( renderData.uiRestrictions.balance.show_credit === false && renderData.uiRestrictions.balance.show_minutes === false )  ? false : true;

							var balance = $(monster.template(self, 'balance-layout', renderData)),
								args = {
									module: self.name,
									data: self.i18n.active().currencyUsed + renderData.amount
								};

							self.balanceBindEvents(balance);

							monster.pub('myaccount.updateMenu', args);
							monster.pub('myaccount.renderSubmodule', balance);

							self.balanceInitTable(balance);

							$.fn.dataTableExt.afnFiltering.pop();

							balance.find('div.table-custom-actions').html(monster.template(self, 'balance-tableActionBar'));

							monster.ui.initRangeDatepicker(self.transactionsRange, balance);

							var startDate = balance.find('#startDate').val(),
								endDate = balance.find('#endDate').val(),
								createdFrom = (new Date(startDate).getTime()/1000) + 62167219200,
								createdTo = (new Date(endDate).getTime()/1000) + 62167219200;

							balance.find('.refresh-filter').on('click', function() {
								self._balanceRenderContent(args);
							});

							balance.find('#filter_transactions').on('click', function() {
								startDate = balance.find('#startDate').val();
								endDate = balance.find('#endDate').val();
								createdFrom = (new Date(startDate).getTime()/1000) + 62167219200;
								createdTo = (new Date(endDate).getTime()/1000) + 62167219200;

								/* Bug because of Infinite scrolling... we need to manually remove tr */
								monster.ui.table.balance.find('tbody tr').remove();
								monster.ui.table.balance.fnClearTable();

								self.balanceRefreshTransactionsTable(balance, createdFrom, createdTo, defaults.fieldData.accounts);
							});

							balance.find('.action-number#download').on('click', function() {
								window.location.href = self.apiUrl+'accounts/'+self.accountId+'/transactions?created_from='+createdFrom+'&created_to='+createdTo+'&depth=2&identifier=metadata&accept=csv&auth_token=' + self.authToken;
							});

							monster.ui.table.balance.fnAddData(renderData.tabData);

							balance.find('.popup-marker').clickover();
						}
					});
				}
			);
		},

		_balanceRenderAddCredit: function(args) {
			var self = this,
                popup;

			self.balanceGet(function(data) {
				self.balanceGetLimits(function(dataLimits) {
					var amount = data.data.amount.toFixed(2) || '0.00',
						rechargeDefault = { enabled: false };

					dataLimits.data.recharge = $.extend(true, {}, rechargeDefault, dataLimits.data.recharge);

					var templateData = {
							amount: amount,
							limits: dataLimits.data
						},
						addCreditDialog = $(monster.template(self, 'balance-addCreditDialog', templateData)),
						dataUpdate = {
							module: self.name,
							data: parseFloat(amount).toFixed(2)
						};

					monster.pub('myaccount.updateMenu', dataUpdate);

					popup = monster.ui.dialog(addCreditDialog, {
						width: '600px',
						title: self.i18n.active().balance.addCreditDialogTitle
					});

					var argsDialog = {
						parent: popup,
						data: data,
						dataLimits: dataLimits,
						callback: args.callback
					};

					self.balanceBindEventsDialog(argsDialog);
				});
			});
		},

		balanceRefreshTransactionsTable: function(parent, from, to, mapAccounts) {
			var self = this,
				params = {
					from: from,
					to: to,
				};

			self.balanceGetTransactions(params, function(dataTransactions) {
				var data = self.balanceFormatTableData(dataTransactions.data, mapAccounts);

				monster.ui.table.balance.addData(data.tabData);

				parent.find('#call_charges').html(data.totalCharges.toFixed(2));
				parent.find('#minutes_used').html(data.totalMinutes);
			});
		},

		balanceFormatTableData: function(dataRequest, mapAccounts) {
			var self = this,
				data = {
					tabData: [],
					totalMinutes: 0,
					totalCharges: 0.00
				};

			if(dataRequest.length > 0) {
				$.each(dataRequest, function(k, v) {
					v.metadata = v.metadata || {
						to: '-',
						from: '-'
					};

					v.metadata.call = { direction: v.metadata.direction || 'inbound', call_id: v.call_id }

					if(v.reason === 'per_minute_call') {
						var duration = self.i18n.active().balance.active_call,
							friendlyDate = monster.util.toFriendlyDate(v.created),
							accountName = '-';

						if('duration' in v.metadata) {
							duration = Math.ceil((parseInt(v.metadata.duration))/60),
							data.totalMinutes += duration;
						}

						if('account_id' in v.metadata) {
							accountName = mapAccounts[v.metadata.account_id].name;
						}

						data.totalCharges += v.amount;

						data.tabData.push([
							v.created,
							v.call_id,
							v.metadata.call,
							friendlyDate,
							monster.util.formatPhoneNumber(v.metadata.from),
							monster.util.formatPhoneNumber(v.metadata.to),
							accountName,
							duration,
							self.i18n.active().currencyUsed + v.amount.toFixed(3)
						]);
					}
				});

				data.totalCharges = data.totalCharges.toFixed(3);
			}

			return data;
		},

		balanceInitTable: function(parent) {
			var self = this;

			monster.pub('myaccount.UIRestrictionsCompatibility',{
				restrictions: monster.apps.auth.originalAccount.ui_restrictions,
				callback: function(uiRestrictions) {
					var showCredit = uiRestrictions.balance && uiRestrictions.balance.show_credit == false ? false : true,
						columns = [
							{
								'sTitle': 'timestamp',
								'bVisible': false
							},
							{
								'sTitle': 'call_id',
								'bVisible': false
							},
							{
								'sTitle': self.i18n.active().balance.directionColumn,
								'fnRender': function(obj) {
									var icon = '<i class="icon-arrow-left icon-orange popup-marker" data-placement="right" data-original-title="Call ID" data-content="'+obj.aData[obj.iDataColumn].call_id+'"></i>';
									if(obj.aData[obj.iDataColumn].direction === 'inbound') {
										icon = '<i class="icon-arrow-right icon-green popup-marker" data-placement="right" data-original-title="Call ID" data-content="'+obj.aData[obj.iDataColumn].call_id+'"></i>'
									}
									return icon;
								},
								'sWidth': '5%'

							},
							{
								'sTitle': self.i18n.active().balance.dateColumn,
								'sWidth': '20%'

							},
							{
								'sTitle': self.i18n.active().balance.fromColumn,
								'sWidth': '20%'
							},
							{
								'sTitle': self.i18n.active().balance.toColumn,
								'sWidth': '20%'
							},
							{
								'sTitle': self.i18n.active().balance.accountColumn,
								'sWidth': '25%'
							},
							{
								'sTitle': self.i18n.active().balance.durationColumn,
								'sWidth': '10%'
							}
						];

					if (showCredit) {
						columns[7].sWidth = '5%';
						columns.push({'sTitle': self.i18n.active().balance.amountColumn,'sWidth': '5%'});
					}

					monster.ui.table.create('balance', parent.find('#transactions_grid'), columns, {}, {
						sDom: '<"table-custom-actions">frtlip',
						aaSorting: [[0, 'desc']]
					});
				}
			})
		},

		balanceCleanFormData: function(module, data) {
			delete data.extra;

			return data;
		},

		balanceFormatData: function(data) {
			return data;
		},

		balanceBindEventsDialog: function(params) {
			var self = this,
				parent = params.parent,
				data = params.data,
				dataLimits = params.dataLimits,
				stateSwitch = 'manual',
				autoRecharge = 'recharge' in dataLimits.data ? dataLimits.data.recharge.enabled || false : false;

			parent.find('.switch').bootstrapSwitch()
								 .on('switch-change', function (e, data) {
				if(data.value === true) {
					parent.find('#recharge_content').slideDown('fast')
				}
				else {
					parent.find('#recharge_content').slideUp();

					if(autoRecharge === true) {
						monster.ui.confirm(self.i18n.active().balance.turnoffRechargeConfirm,
							function() {
								self.balanceGetLimits(function(dataLimits) {
									dataLimits.data.recharge = { enabled: false };

									self.balanceUpdateLimits(dataLimits.data, function() {
										autoRecharge = 'recharge' in dataLimits.data ? dataLimits.data.recharge.enabled || false : false;
										toastr.success(self.i18n.active().balance.autoRechargeCancelled);
									});
								});
							},
							function() {
								parent.find('#recharge_content').slideDown();
								stateSwitch = 'manual';
								parent.find('.switch').bootstrapSwitch('setState', true);
							}
						);
					}
				}
			}).bootstrapSwitch('setState', autoRecharge);

			parent.find('.icon-question-sign[data-toggle="tooltip"]').tooltip();

			parent.find('.add-credit').on('click', function(ev) {
				ev.preventDefault();

				var creditsToAdd = parseFloat(parent.find('#amount').val().replace(',','.'));

				if(creditsToAdd) {
					monster.ui.confirm(self.i18n.active().chargeReminder.line1 + '<br/><br/>' + self.i18n.active().chargeReminder.line2,
						function() {
							self.balanceAddCredits(creditsToAdd,
								function() {
									var dataToastr = {
										amount: self.i18n.active().currencyUsed + creditsToAdd
									};

									toastr.success(monster.template(self, '!' + self.i18n.active().balance.creditsAdded, dataToastr));

									if(typeof params.callback === 'function') {
										self.balanceGet(function(data) {
											params.callback(data.data.amount);
											parent.dialog('close');
										});
									}
									else {
										parent.dialog('close');
									}
								}
							);
						}
					);
				}
				else{
					monster.ui.alert(self.i18n.active().balance.invalidAmount);
				}
			});

			parent.find('#confirm_recharge').on('click', function() {
				var dataForm = {
					enabled: true,
					threshold: parseFloat(parent.find('#threshold_recharge').val()),
					amount: parseFloat(parent.find('#recharge_amount').val())
				};

				if(dataForm.threshold && dataForm.amount) {
					self.balanceGetLimits(function(dataLimits) {
						dataLimits.data.recharge = dataForm;

						self.balanceUpdateLimits(dataLimits.data, function() {
							toastr.success(self.i18n.active().balance.autoRechargeEnabled);
						});
					});
				}
				else{
					monster.ui.alert(self.i18n.active().balance.invalidAmount);
				}
			});
		},

		balanceBindEvents: function(parent) {
			var self = this;

			parent.find('#add_credits').on('click', function() {
				var args = {
					callback: function(amount) {
						var formattedAmount =  parseFloat(amount).toFixed(2),
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
		},

		//utils
		balanceGetAccounts: function(success, error) {
			var self = this;

			monster.request({
				resource: 'myaccount.balance.getDescendants',
				data: {
					accountId: self.accountId,
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

			monster.request({
				resource: 'myaccount.balance.getLimits',
				data: {
					accountId: self.accountId,
				},
				success: function(data, status) {
					success && success(data, status);
				},
				error: function(data, status) {
					error && error(data, status);
				}
			});
		},

	 	balanceGetTransactions: function(params, success, error) {
			var self = this;

			if(typeof params === 'function') {
				success = params;
				error = success;

				var tomorrow = new Date();
				tomorrow.setDate(tomorrow.getDate() + 1);

				var params = {};
				params.to = Math.floor(tomorrow.getTime()/1000) + 62167219200;
				params.from = params.to - (self.transactionsRange*24*60*60);
			}

			monster.request({
				resource: 'myaccount.balance.getFilteredTransactions',
				data: {
					accountId: self.accountId,
					from: params.from,
					to: params.to
				},
				success: function(data, status) {
					success && success(data, status);
				},
				error: function(data, status) {
					error && error(data, status);
				}
			});
		},

		balanceUpdateLimits: function(limits, success, error) {
			var self = this;

			monster.request({
				resource: 'myaccount.balance.updateLimits',
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

			monster.request({
				resource: 'myaccount.balance.getCredits',
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

			/*monster.request({
				resource: 'myaccount.balance.update',
				data: {
					accountId: self.accountId,
					data: {
						'amount': credits
					}
				},
				success: function(data, status) {
					success && success(data, status);
				},
				error: function(data, status) {
					error && error(data, status);
				}
			});*/
		},

		balanceUpdateRecharge: function(data, success, error) {
			var self = this;

			monster.request({
				resource: 'myaccount.balance.update',
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
		},
	};

	return balance;
});
