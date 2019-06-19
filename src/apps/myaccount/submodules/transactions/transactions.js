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

		appFlags: {
			transactions: {
				dateFormat: 'date',
				datePickerRange: 'monthly',
				priceDigits: 2
			}
		},

		_transactionsRenderContent: function(args) {
			var self = this,
				defaultRange = {
					from: moment().startOf('month').toDate(),
					to: moment().toDate()
				};

			self.transactionsHelperList({
				range: defaultRange,
				callback: function(data) {
					var transactionsView = $(self.getTemplate({
							name: 'layout',
							data: {
								amount: data.amount,
								dateFormat: self.appFlags.transactions.dateFormat,
								endDate: defaultRange.to,
								priceDigits: self.appFlags.transactions.priceDigits,
								startDate: defaultRange.from
							},
							submodule: 'transactions'
						})),
						listTransactionsView = $(self.getTemplate({
							name: 'list',
							data: {
								priceDigits: self.appFlags.transactions.priceDigits,
								transactions: data.transactions
							},
							submodule: 'transactions'
						})),
						optionsDatePicker = {
							container: transactionsView,
							range: self.appFlags.transactions.datePickerRange,
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
				var range = {
					from: parent.find('#startDate').datepicker('getDate'),
					to: parent.find('#endDate').datepicker('getDate')
				};
				self.transactionsHelperList({
					range: range,
					callback: function(data) {
						parent
							.find('.list-transactions')
								.empty()
								.append($(self.getTemplate({
									name: 'list',
									data: {
										priceDigits: self.appFlags.transactions.priceDigits,
										transactions: data.transactions
									},
									submodule: 'transactions'
								})));

						parent.find('.expandable').hide();

						parent
							.find('.start-date .value')
								.text(monster.util.toFriendlyDate(range.from, self.appFlags.transactions.dateFormat));
						parent
							.find('.end-date .value')
								.text(monster.util.toFriendlyDate(range.to, self.appFlags.transactions.dateFormat));
						parent
							.find('.total-amount .value')
								.text(monster.util.formatPrice({
									digits: self.appFlags.transactions.priceDigits,
									price: data.amount
								}));
					}
				});
			});
		},

		transactionsHelperList: function(args) {
			var self = this,
				range = args.range;

			self.transactionsRequestList({
				data: {
					filters: {
						paginate: false,
						created_from: monster.util.dateToBeginningOfGregorianDay(range.from),
						created_to: monster.util.dateToEndOfGregorianDay(range.to),
						reason: 'no_calls'
					}
				},
				success: function(transactions) {
					var formatted = _
						.chain(transactions)
						.filter(function(transaction) {
							return _.get(transaction, 'status', 'pending') !== 'pending';
						})
						.map(function(transaction) {
							return self.transactionsHelperFormat(transaction);
						})
						.orderBy('created', 'desc')
						.value();

					args.callback({
						amount: _
							.chain(formatted)
							.filter('isApproved')
							.sumBy('amount')
							.value(),
						transactions: formatted
					});
				}
			});
		},

		transactionsHelperFormat: function(transaction) {
			var self = this,
				i18n = self.i18n.active().transactions,
				executor = transaction.executor,
				formatted = {
					amount: parseFloat(transaction.amount),
					isApproved: _.get(transaction, 'status', 'null') === 'completed',
					timestamp: transaction.created
				};

			if (!_.isUndefined(executor)) {
				if (_.has(transaction, 'description')) {
					formatted.friendlyName = transaction.description;
				}

				if (!_.has(formatted, 'friendlyName')
					&& _.has(i18n.executors, executor.module)
				) {
					formatted.friendlyName = _.get(
						i18n.executors[executor.module],
						executor.trigger,
						_.get(
							i18n.executors[executor.module],
							'default',
							undefined
						)
					);
				}

				if (!_.has(formatted, 'friendlyName')) {
					formatted.friendlyName = i18n.generalTransaction;
				}

				if (formatted.amount < 0) {
					formatted.friendlyName = self.getTemplate({
						name: '!' + i18n.refundText,
						data: {
							message: _.startCase(formatted.friendlyName)
						}
					});
				}
			}

			if (!formatted.isApproved) {
				formatted.errorMessage = _.get(
					transaction,
					'bookkeeper.message',
					_.get(
						i18n.statuses,
						transaction.status,
						transaction.status
					)
				);
			}

			if (_.has(transaction, 'type')) {
				formatted.type = transaction.type;
			}

			return formatted;
		},

		transactionsRequestList: function(args) {
			var self = this;

			self.callApi({
				resource: 'transactions.list',
				data: _.merge({
					accountId: self.accountId
				}, args.data),
				success: function(data, status) {
					args.hasOwnProperty('success') && args.success(data.data);
				},
				error: function(parsedError) {
					args.hasOwnProperty('error') && args.error(parsedError);
				}
			});
		}
	};

	return transactions;
});
