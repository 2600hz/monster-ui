define(function(require){
	var $ = require('jquery'),
		_ = require('underscore'),
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

		_transactionsRenderContent: function(args) {
			var self = this,
				range = 31,
				now = new Date(),
				to = monster.util.dateToGregorian(new Date(now.setDate(now.getDate() + 1))),
				from = to - (range * 60 * 60 * 24);

			self.listTransactions(from, to, function(data) {
				var transactionsView = $(monster.template(self, 'transactions-layout', data)),
					listTransactionsView = monster.template(self, 'transactions-list', data);

				transactionsView.find('.list-transactions').append(listTransactionsView);

				monster.ui.initRangeDatepicker(range, transactionsView);

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

			if(data.listTransactions) {
				$.each(data.listTransactions, function(k, v) {
					v.reason = self.i18n.active().transactions[v.reason ? v.reason : 'oneTimeCharge'];
				});
			}

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
				from = monster.util.dateToGregorian(new Date(parent.find('#startDate').val()));
				to = monster.util.dateToGregorian(new Date(parent.find('#endDate').val()));

				self.listTransactions(from, to, function(data) {
					var listTransactions = parent.find('.list-transactions').empty();

					listTransactions.append(monster.template(self, 'transactions-list', data));

					parent.find('.expandable').hide();

					parent.find('.billing-date.start').html(data.billingStartDate);
					parent.find('.billing-date.end').html(data.billingEndDate);
					parent.find('.total-amount').html(data.amount);
				});
			});
		},

		//utils
		listTransactions: function(from, to, callback) {
			var self = this,
				defaults = {
					amount: 0.00,
					billingStartDate: monster.util.toFriendlyDate(from, 'short'),
					billingEndDate: monster.util.toFriendlyDate(to, 'short')
				},
				formatCharge = function(v) {
					if((!v.hasOwnProperty('add_ons') && !v.hasOwnProperty('discounts')) || (v.add_ons.length === 0 && v.discounts.length === 0)) {
						v.type = 'charges';
					}
					else {
						var mapDiscounts = {};
						_.each(v.discounts, function(discount) {
							mapDiscounts[discount.id] = discount;
						});

						v.type = v.prorated ? 'prorated' : 'monthly';
						v.services = [];

						$.each(v.add_ons, function(k, addOn) {
							var discount = 0;

							addOn.amount = parseFloat(addOn.amount).toFixed(2);
							addOn.quantity = parseFloat(addOn.quantity);

							if((addOn.id + '_discount') in mapDiscounts) {
								var discountItem = mapDiscounts[addOn.id + '_discount'];
								discount = parseInt(discountItem.quantity) * parseFloat(discountItem.amount);
							}

							addOn.monthly_charges = ((addOn.amount * addOn.quantity) - discount).toFixed(2);

							v.services.push({
								service: self.i18n.active().servicePlan.titles[addOn.id] || addOn.id,
								rate: addOn.amount,
								quantity: addOn.quantity,
								discount: discount > 0 ? '-' + self.i18n.active().currencyUsed + parseFloat(discount).toFixed(2) : '',
								monthly_charges: addOn.monthly_charges
							});
						});

						v.services.sort(function(a, b) {
							return parseFloat(a.rate) <= parseFloat(b.rate);
						});
					}

					v.amount = parseFloat(v.amount).toFixed(2);
					// If there are no processor response text, we assume it was approved
					v.approved = v.hasOwnProperty('processor_response_text') ? v.processor_response_text === 'Approved' : true,
					v.friendlyCreated = monster.util.toFriendlyDate(v.created_at, 'short');
					v.created = v.created_at;

					return v;
				};

			monster.parallel({
					monthly: function(callback) {
						self.transactionsGetMonthly(from, to, function(dataMonthly) {
							var arrayTransactions = [];

							$.each(dataMonthly.data, function(k, v) {
								v = formatCharge(v);

								if(v.approved) {
									defaults.amount += parseFloat(v.amount);
								}
							});

							callback(null, arrayTransactions);
						});
					},
					charges: function(callback) {
						self.transactionsGetCharges(from, to, function(dataCharges) {
							var arrayCharges = [];

							$.each(dataCharges.data, function(k, v) {
								v = formatCharge(v);

								arrayCharges.push(v);

								if(v.approved) {
									defaults.amount += parseFloat(v.amount);
								}
							});

							callback(null, arrayCharges);
						});
					}
				},
				function(err, results) {
					var renderData = defaults;

					renderData.listTransactions = (results.charges).concat(results.monthly);

					renderData = self.transactionsFormatData(renderData);

					callback(renderData);
				}
			);
		},

		transactionsGetMonthly: function(from, to, success, error) {
			var self = this;

			monster.request({
				resource: 'myaccount.transactions.getMonthly',
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
