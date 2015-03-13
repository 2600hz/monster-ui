define(function(require){
	var $ = require('jquery'),
		_ = require('underscore'),
		toastr = require('toastr'),
		monster = require('monster');

	var transactions = {

		requests: {
			'myaccount.transactions.getMonthly': {
				url: 'accounts/{accountId}/transactions/monthly_recurring?created_from={from}&created_to={to}',
				verb: 'GET'
			},
			'myaccount.transactions.getSubscriptions': {
				url: 'accounts/{accountId}/transactions/subscriptions',
				verb: 'GET'
			},
			'myaccount.transactions.getCharges': {
				url: 'accounts/{accountId}/transactions?reason=no_calls&created_from={from}&created_to={to}',
				verb: 'GET'
			}
		},

		subscribe: {
			'myaccount.transactions.renderContent': '_transactionsRenderContent'
		},

		transactionsRange: 'monthly',

		_transactionsRenderContent: function(args) {
			var self = this;

			self.listTransactions(function(data) {
				var transactionsView = $(monster.template(self, 'transactions-layout', data)),
					listTransactionsView = monster.template(self, 'transactions-list', data),
					optionsDatePicker = {
						container: transactionsView,
						range: self.transactionsRange
					};

				transactionsView.find('.list-transactions').append(listTransactionsView);

				monster.ui.initRangeDatepicker(optionsDatePicker);

				self.transactionsBindEvents(transactionsView);

				monster.pub('myaccount.renderSubmodule', transactionsView);

				if(typeof args.callback === 'function') {
					args.callback(transactionsView);
				}
			});
		},

		transactionsFormatData: function(data) {
			var self = this;

			data.amount = parseFloat(data.amount).toFixed(2);

			data.listTransactions.sort(function(a, b) {
				return a.created < b.created;
			});

			return data;
		},

		transactionsBindEvents: function(parent, data) {
			var self = this;

			parent.find('.expandable').hide();

			parent.on('click', '.expand-box', function() {
				var current = $(this),
					expandable = current.parents('.transaction').first().find('.expandable'),
					content = !expandable.is(':visible') ? '-' : '+';

				current.find('.expand').html(content);
				expandable.slideToggle('fast');
			});

			parent.find('#filter_transactions').on('click', function() {
				var from = new Date(parent.find('#startDate').val()),
					to = new Date(parent.find('#endDate').val());

				self.listTransactions(from, to, function(data) {
					var listTransactions = parent.find('.list-transactions').empty();

					listTransactions.append(monster.template(self, 'transactions-list', data));

					parent.find('.expandable').hide();

					parent.find('.billing-date.start').html(data.billingStartDate);
					parent.find('.billing-date.end').html(data.billingEndDate);
					parent.find('.total-amount').html(self.i18n.active().currencyUsed + data.amount);
				});
			});
		},

		//utils
		// from, to: optional together. Date objects.
		listTransactions: function(from, to, callback) {
			var self = this;

			if(typeof from === 'function') {
				callback = from;

				var dates = monster.util.getDefaultRangeDates(self.balanceRange);

				from = dates.from;
				to = dates.to;
			}

			// We search from the beginning of the from date, to the end of the to date
			from = monster.util.dateToBeginningOfGregorianDay(from);
			to = monster.util.dateToEndOfGregorianDay(to);

			var defaults = {
				amount: 0.00,
				billingStartDate: monster.util.toFriendlyDate(from, 'short'),
				billingEndDate: monster.util.toFriendlyDate(to, 'short')
			};

			monster.parallel({
					charges: function(callback) {
						self.transactionsGetCharges(from, to, function(dataCharges) {
							var arrayCharges = [];

							$.each(dataCharges.data, function(k, v) {
								// We don't want to display Balance Carry-Over anymore
								if(v.code !== 4000) {
									v = monster.util.formatTransaction(v, self);

									arrayCharges.push(v);

									if(v.approved) {
										// All the codes that are in the 5xx and above are refunds
										if(v.code % 1000 > 500) {
											defaults.amount -= parseFloat(v.amount);
										}
										else {
											defaults.amount += parseFloat(v.amount);
										}
									}
								}
							});

							callback(null, arrayCharges);
						});
					}
				},
				function(err, results) {
					var renderData = defaults;

					renderData.listTransactions = results.charges;

					renderData = self.transactionsFormatData(renderData);

					callback(renderData);
				}
			);
		},

		transactionsGetCharges: function(from, to, success, error) {
			var self = this;

			monster.request({
				resource: 'myaccount.transactions.getCharges',
				data: {
					accountId: self.accountId,
					from: from,
					to: to
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

	return transactions;
});
