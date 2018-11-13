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
				defaultRange = {
					from: moment().startOf('month').toDate(),
					to: moment().toDate()
				};

			self.listTransactions({
				from: defaultRange.from,
				to: defaultRange.to,
				callback: function(data) {
					var transactionsView = $(self.getTemplate({
							name: 'layout',
							data: {
								billingStartDate: data.billingStartDate,
								billingEndDate: data.billingEndDate,
								amount: data.amount
							},
							submodule: 'transactions'
						})),
						listTransactionsView = $(self.getTemplate({
							name: 'list',
							data: {
								listTransactions: data.listTransactions
							},
							submodule: 'transactions'
						})),
						optionsDatePicker = {
							container: transactionsView,
							range: self.transactionsRange,
							startDate: defaultRange.from
						};

					transactionsView.find('.list-transactions').append(listTransactionsView);

					monster.ui.initRangeDatepicker(optionsDatePicker);

					self.transactionsBindEvents(transactionsView);

					monster.pub('myaccount.renderSubmodule', transactionsView);

					if (typeof args.callback === 'function') {
						args.callback(transactionsView);
					}
				}
			});
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
				self.listTransactions({
					from: parent.find('#startDate').datepicker('getDate'),
					to: parent.find('#endDate').datepicker('getDate'),
					callback: function(data) {
						var listTransactions = parent.find('.list-transactions').empty();

						listTransactions
							.append($(self.getTemplate({
								name: 'list',
								data: {
									listTransactions: data.listTransactions
								},
								submodule: 'transactions'
							})));

						parent.find('.expandable').hide();

						parent.find('.start-date .value').html(data.billingStartDate);
						parent.find('.end-date .value').html(data.billingEndDate);
						parent.find('.total-amount .value').html(monster.util.formatPrice({
							price: data.amount
						}));
					}
				});
			});
		},

		// from, to: optional together. Date objects.
		listTransactions: function(args) {
			var self = this;

			var defaults = {
				amount: 0.00,
				billingStartDate: moment(args.from).format(monster.util.getMomentFormat('date')),
				billingEndDate: moment(args.to).format(monster.util.getMomentFormat('date'))
			};

			self.callApi({
				resource: 'transactions.list',
				data: {
					accountId: self.accountId,
					filters: {
						created_from: monster.util.dateToBeginningOfGregorianDay(args.from),
						created_to: monster.util.dateToEndOfGregorianDay(args.to),
						reason: 'no_calls'
					}
				},
				success: function(transactions) {
					defaults.listTransactions = _.chain(transactions.data)
						.filter(function(transaction) {
							return _.get(transaction, 'status', 'pending') !== 'pending';
						})
						.map(function(transaction) {
							return monster.util.formatTransaction(transaction, self);
						})
						.sortBy('created', 'asc')
						.value();

					defaults.amount = _.reduce(defaults.listTransactions, function(total, trans) {
						if (trans.approved) {
							return total + parseFloat(trans.amount);
						}
					}, 0);

					defaults.amount = parseFloat(defaults.amount).toFixed(2);

					args.callback(defaults);
				}
			});
		}
	};

	return transactions;
});
