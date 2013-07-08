define(function(require){
	var $ = require('jquery'),
		_ = require('underscore'),
		monster = require('monster'),
		dataTables = require('datatables'),
		toastr = require('toastr'),

		templates = {
			menu: 'menu',
			balance: 'balance',
			tableActionBar: 'tableActionBar',
			addCreditDialog: 'addCredit'
		};

	var app = {

		name: 'myaccount-balance',

		transactionsRange: 30,

		i18n: [ 'en-US', 'fr-FR' ],

		requests: {
			'balance.getCredits': {
				url: 'accounts/{accountId}/braintree/credits',
				verb: 'GET'
			},
			'balance.update': {
				url: 'accounts/{accountId}/braintree/credits',
				verb: 'PUT'
			},
			'balance.getFilteredTransactions': {
				url: 'accounts/{accountId}/transactions?created_from={from}&created_to={to}',
				verb: 'GET'
			},
			'balance.getDescendants': {
				url: 'accounts/{accountId}/descendants',
				verb: 'GET'
			},
			'balance.getLimits': {
				url: 'accounts/{accountId}/limits',
				verb: 'GET'
			},
			'balance.updateLimits': {
				url: 'accounts/{accountId}/limits',
				verb: 'POST'
			}
		},

		subscribe: {
			'myaccount-balance.renderContent': '_renderContent',
			'myaccount-balance.addCreditDialog': '_renderAddCredit'
		},

		load: function(callback){
			var self = this;

			self.initApp(function() {
				callback && callback(self);
			});
		},

		initApp: function(callback) {
			var self = this;

			monster.pub('auth.initApp', {
				app: self,
				callback: callback
			});
		},

		render: function(account){
			var self = this;

			self.getBalance(function(data) {
				var dataTemplate = {
						amount: data.data.amount.toFixed(2) || '0.00'
					},
					balanceMenu = $(monster.template(self, 'menu', dataTemplate));
					args = {
						name: self.name,
						title: self.i18n.active().title,
						menu: balanceMenu,
						weight: 30,
						category: 'billingCategory'
					};

				monster.pub('myaccount.addSubmodule', args);
			});
		},

		_renderContent: function(args) {
			var self = this,
				defaults = {
					fieldData: {
						accounts: {}
					}
				};

			monster.parallel({
					accounts: function(callback) {
						self.getAccounts(function(dataAccounts) {
							$.each(dataAccounts.data, function(k, v) {
								defaults.fieldData.accounts[v.id] = v;
							});

							callback(null, defaults);
						});
					},
					balance: function(callback) {
						self.getBalance(function(data) {
							defaults.amount = parseFloat(data.data.amount).toFixed(2);

							callback(null, data)
						});
					},
					transactions: function(callback) {
						self.getTransactions(function(dataTransactions) {
							callback(null, dataTransactions)
						});
					}
				},
				function(err, results) {
					var renderData = $.extend(true, {}, 
											  defaults,  
											  self.formatTableData(results.transactions.data, defaults.fieldData.accounts),
											  {uiRestrictions: monster.apps['auth'].originalAccount.ui_restrictions}
											 ),
						balance = $(monster.template(self, 'balance', renderData)),
						args = {
							module: self.name,
							data: self.i18n.active().currencyUsed + renderData.amount
						};

					self.bindEvents(balance);

					monster.pub('myaccount.updateMenu', args);
					monster.pub('myaccount.renderSubmodule', balance);

					self.initTable(balance);

					$.fn.dataTableExt.afnFiltering.pop();

					balance.find('div.table-custom-actions').html(monster.template(self, 'tableActionBar'));

					monster.ui.initRangeDatepicker(self.transactionsRange, balance);

					var startDate = balance.find('#startDate').val(),
						endDate = balance.find('#endDate').val(),
						createdFrom = (new Date(startDate).getTime()/1000) + 62167219200,
						createdTo = (new Date(endDate).getTime()/1000) + 62167219200;

					balance.find('#filter_transactions').on('click', function() {
						startDate = balance.find('#startDate').val();
						endDate = balance.find('#endDate').val();
						createdFrom = (new Date(startDate).getTime()/1000) + 62167219200;
						createdTo = (new Date(endDate).getTime()/1000) + 62167219200;

						/* Bug because of Infinite scrolling... we need to manually remove tr */
						monster.ui.table.balance.find('tbody tr').remove();
						monster.ui.table.balance.fnClearTable();

						self.refreshTransactionsTable(balance, createdFrom, createdTo, defaults.fieldData.accounts);
					});

					balance.find('#get_csv').on('click', function() {
						window.location.href = self.apiUrl+'/accounts/'+self.accountId+'/transactions?created_from='+createdFrom+'&created_to='+createdTo+'&depth=2&identifier=metadata&accept=csv&auth_token=' + self.authToken;
					});

					monster.ui.table.balance.fnAddData(renderData.tabData);

					balance.find('.popup-marker').clickover();
				}
			);
		},

		_renderAddCredit: function(args) {
			var self = this,
                popup;

			self.getBalance(function(data) {
				self.getLimits(function(dataLimits) {
					var amount = data.data.amount.toFixed(2) || '0.00',
						rechargeDefault = { enabled: false };

					dataLimits.data.recharge = $.extend(true, {}, rechargeDefault, dataLimits.data.recharge);

					var templateData = {
							amount: amount,
							limits: dataLimits.data
						},
						addCreditDialog = $(monster.template(self, 'addCreditDialog', templateData)),
						dataUpdate = {
							module: self.name,
							data: parseFloat(amount).toFixed(2)
						};

					monster.pub('myaccount.updateMenu', dataUpdate);

					popup = monster.ui.dialog(addCreditDialog, {
						width: '600px',
						title: self.i18n.active().addCreditDialogTitle
					});

					var argsDialog = {
						parent: popup,
						data: data,
						dataLimits: dataLimits,
						callback: args.callback
					};

					self.bindEventsDialog(argsDialog);
				});
			});
		},

		refreshTransactionsTable: function(parent, from, to, mapAccounts) {
			var self = this,
				params = {
					from: from,
					to: to,
				};

			self.getTransactions(params, function(dataTransactions) {
				var data = self.formatTableData(dataTransactions.data, mapAccounts);

				monster.ui.table.balance.addData(data.tabData);

				parent.find('#call_charges').html(data.totalCharges.toFixed(2));
				parent.find('#minutes_used').html(data.totalMinutes);
			});
		},

		formatTableData: function(dataRequest, mapAccounts) {
			var data = {
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
						var duration = self.i18n.active().active_call,
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
							self.i18n.active().currencyUsed + v.amount
						]);
					}
				});
			}

			return data;
		},

		initTable: function(parent) {
			var self = this,
				uiRestrictions = monster.apps['auth'].originalAccount.ui_restrictions || {},
				showCredit = uiRestrictions.balance && uiRestrictions.balance.show_credit == false ? false : true,
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
						'sTitle': self.i18n.active().directionColumn,
						'fnRender': function(obj) {
							var icon = '<i class="icon-arrow-right icon-orange popup-marker" data-placement="right" data-original-title="Call ID" data-content="'+obj.aData[obj.iDataColumn].call_id+'"></i>';
							if(obj.aData[obj.iDataColumn].direction === 'inbound') {
								icon = '<i class="icon-arrow-left icon-green popup-marker" data-placement="right" data-original-title="Call ID" data-content="'+obj.aData[obj.iDataColumn].call_id+'"></i>'
							}
							return icon;
						},
						'sWidth': '5%'

					},
					{
						'sTitle': self.i18n.active().dateColumn,
						'sWidth': '20%'

					},
					{
						'sTitle': self.i18n.active().fromColumn,
						'sWidth': '20%'
					},
					{
						'sTitle': self.i18n.active().toColumn,
						'sWidth': '20%'
					},
					{
						'sTitle': self.i18n.active().accountColumn,
						'sWidth': '25%'
					},
					{
						'sTitle': self.i18n.active().durationColumn,
						'sWidth': '10%'
					}
				];

			if (showCredit) {
				columns[7].sWidth = '5%';
				columns.push({'sTitle': self.i18n.active().amountColumn,'sWidth': '5%'});
			}

			monster.ui.table.create('balance', parent.find('#transactions_grid'), columns, {}, {
				sDom: '<"table-custom-actions">frtlip',
				aaSorting: [[0, 'desc']]
			});
		},

		cleanFormData: function(module, data) {
			delete data.extra;

			return data;
		},

		formatData: function(data) {
			return data;
		},

		bindEventsDialog: function(params) {
			var self = this,
				parent = params.parent,
				data = params.data,
				dataLimits = params.dataLimits,
				stateSwitch = 'manual',
				autoRecharge = 'recharge' in dataLimits.data ? dataLimits.data.recharge.enabled || false : false;

			parent.find('.switch').bootstrapSwitch()
								 .on('switch-change', function (e, data) {
				if(stateSwitch === 'manual') {
					stateSwitch = 'event';
				}
				else {
					if(data.value === true) {
						parent.find('#recharge_content').slideDown('fast')
					}
					else {
						parent.find('#recharge_content').slideUp();

						if(autoRecharge === true) {
							monster.ui.confirm(self.i18n.active().turnoffRechargeConfirm,
								function() {
									self.getLimits(function(dataLimits) {
										dataLimits.data.recharge = { enabled: false };

										self.updateLimits(dataLimits.data, function() {
											autoRecharge = 'recharge' in dataLimits.data ? dataLimits.data.recharge.enabled || false : false;
											toastr.success(self.i18n.active().autoRechargeCancelled);
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
				}
			}).bootstrapSwitch('setState', autoRecharge);

			parent.find('.icon-question-sign[data-toggle="tooltip"]').tooltip();

			parent.find('.add-credit').on('click', function(ev) {
				ev.preventDefault();

				var creditsToAdd = parseFloat(parent.find('#amount').val().replace(',','.'));

				if(creditsToAdd) {
					monster.ui.confirm(self.i18n.active().chargeReminder.line1 + '<br/><br/>' + self.i18n.active().chargeReminder.line2,
						function() {
							self.addBalance(creditsToAdd,
								function() {
									var dataToastr = {
										amount: self.i18n.active().currencyUsed + creditsToAdd
									};

									toastr.success(monster.template(self, '!' + self.i18n.active().creditsAdded, dataToastr));

									if(typeof params.callback === 'function') {
										self.getBalance(function(data) {
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
					monster.ui.alert(self.i18n.active().invalidAmount);
				}
			});

			parent.find('#confirm_recharge').on('click', function() {
				var dataForm = {
					enabled: true,
					threshold: parseFloat(parent.find('#threshold_recharge').val()),
					amount: parseFloat(parent.find('#recharge_amount').val())
				};

				if(dataForm.threshold && dataForm.amount) {
					self.getLimits(function(dataLimits) {
						dataLimits.data.recharge = dataForm;

						self.updateLimits(dataLimits.data, function() {
							toastr.success(self.i18n.active().autoRechargeEnabled);
						});
					});
				}
				else{
					monster.ui.alert(self.i18n.active().invalidAmount);
				}
			});
		},

		bindEvents: function(parent) {
			var self = this;

			parent.find('#add_credits').on('click', function() {
				var args = {
					callback: function(amount) {
						var formattedAmount =  parseFloat(amount).toFixed(2),
						    newAmount = self.i18n.active().currencyUsed + formattedAmount,
							argsEvent = {
								module: self.name,
								data: newAmount
							};

						monster.pub('myaccount.updateMenu', argsEvent);
						parent.find('#amount').html(formattedAmount);
					}
				};

				self._renderAddCredit(args);
			});
		},

		//utils
		getAccounts: function(success, error) {
			var self = this;

			monster.request({
				resource: 'balance.getDescendants',
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

		getLimits: function(success, error) {
			var self = this;

			monster.request({
				resource: 'balance.getLimits',
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

	 getTransactions: function(params, success, error) {
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
				resource: 'balance.getFilteredTransactions',
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

		updateLimits: function(limits, success, error) {
			var self = this;

			monster.request({
				resource: 'balance.updateLimits',
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

		getBalance: function(success, error) {
			var self = this;

			monster.request({
				resource: 'balance.getCredits',
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

		addBalance: function(credits, success, error) {
			var self = this;

			monster.request({
				resource: 'balance.update',
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
			});
		},

		updateRecharge: function(data, success, error) {
			var self = this;

			monster.request({
				resource: 'balance.update',
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

	return app;
});
