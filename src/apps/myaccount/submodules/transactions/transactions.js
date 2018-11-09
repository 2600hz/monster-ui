define(function(require) {
	var $ = require('jquery'),
		_ = require('lodash'),
		moment = require('moment'),
		monster = require('monster');

	var transactions = {

		requests: {
		},

		subscribe: {
			'myaccount.transactions.renderContent': '_transactionsRenderContent'
		},

		transactionsRange: 'monthly',

		_transactionsRenderContent: function(args) {
			var self = this,
				dates = self.utilDefaultRangeDates();

			self.listTransactions(dates.from, dates.to, function(data) {
				var transactionsView = $(self.getTemplate({
						name: 'layout',
						data: data,
						submodule: 'transactions'
					})),
					listTransactionsView = $(self.getTemplate({
						name: 'list',
						data: data,
						submodule: 'transactions'
					})),
					optionsDatePicker = {
						container: transactionsView,
						range: self.transactionsRange,
						startDate: dates.from
					};

				transactionsView.find('.list-transactions').append(listTransactionsView);

				monster.ui.initRangeDatepicker(optionsDatePicker);

				self.transactionsBindEvents(transactionsView);

				monster.pub('myaccount.renderSubmodule', transactionsView);

				if (typeof args.callback === 'function') {
					args.callback(transactionsView);
				}
			});
		},

		transactionsFormatData: function(data) {
			var self = this;

			data.amount = parseFloat(data.amount).toFixed(2);

			data.listTransactions.sort(function(a, b) {
				return a.created < b.created ? 1 : -1;
			});

			return data;
		},

		transactionsBindEvents: function(parent, data) {
			var self = this;

			parent.find('.expandable').hide();

			parent.on('click', '.expand-box:not(.disabled)', function() {
				var current = $(this),
					transactionBox = current.parents('.transaction-box'),
					expandable = transactionBox.first().find('.expandable');

				transactionBox.toggleClass('open');
				expandable.slideToggle('fast');
			});

			parent.find('#filter_transactions').on('click', function() {
				var from = monster.util.parseDateString(parent.find('#startDate').val()),
					to = monster.util.parseDateString(parent.find('#endDate').val());

				self.listTransactions(from, to, function(data) {
					var listTransactions = parent.find('.list-transactions').empty();

					listTransactions
						.append($(self.getTemplate({
							name: 'list',
							data: data,
							submodule: 'transactions'
						})));

					parent.find('.expandable').hide();

					parent.find('.start-date .value').html(data.billingStartDate);
					parent.find('.end-date .value').html(data.billingEndDate);
					parent.find('.total-amount .value').html(monster.util.formatPrice({
						price: data.amount
					}));
				});
			});
		},

		//utils

		utilDefaultRangeDates() {
			var today = moment().toDate(),
				firstDOM = moment().startOf('month').toDate();

			return {
				from: firstDOM,
				to: today
			};
		},

		// from, to: optional together. Date objects.
		listTransactions: function(from, to, callback) {
			var self = this;

			if (typeof from === 'function') {
				callback = from;

				var dates = monster.util.getDefaultRangeDates(self.balanceRange);

				from = dates.from;
				to = dates.to;
			}

			var defaults = {
				amount: 0.00,
				billingStartDate: moment(from).format(monster.util.getMomentFormat('date')),
				billingEndDate: moment(to).format(monster.util.getMomentFormat('date'))
			};

			// We search from the beginning of the from date, to the end of the to date
			from = monster.util.dateToBeginningOfGregorianDay(from);
			to = monster.util.dateToEndOfGregorianDay(to);

			monster.parallel({
				charges: function(callback) {
					self.transactionsGetCharges(from, to, function(dataCharges) {
						var arrayCharges = [];

						$.each(dataCharges.data, function(k, v) {
							if (v.status && v.status == 'pending') {
                                                                  return true;
                                                        }

                					v = monster.util.formatTransaction(v, self);
							arrayCharges.push(v);

							if (v.approved) {
							        defaults.amount += parseFloat(v.amount);
							}
						});

						callback(null, arrayCharges);
					});
				}
			}, function(err, results) {
				var renderData = defaults;

				renderData.listTransactions = results.charges;

				renderData = self.transactionsFormatData(renderData);

				callback(renderData);
			});
		},

		transactionsGetCharges: function(from, to, success, error) {
			var self = this;

			self.callApi({
				resource: 'transactions.list',
				data: {
					accountId: self.accountId,
					filters: {
						created_from: from,
						created_to: to,
						reason: 'no_calls'
					}
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
