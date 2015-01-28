define(function(require){
	var $ = require('jquery'),
		_ = require('underscore'),
		toastr = require('toastr'),
		monster = require('monster');

	var transactions = {

		requests: {
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
				var from = new Date(parent.find('#startDate').val()),
					to = new Date(parent.find('#endDate').val());

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
				},
				formatCharge = function(v, isProrated) {
					// If transaction has accounts/discounts and if at least one of these properties is not empty, run this code
					if(v.hasOwnProperty('metadata') && v.metadata.hasOwnProperty('add_ons') && v.metadata.hasOwnProperty('discounts') 
						&& !(v.metadata.add_ons.length === 0 && v.metadata.discounts.length === 0)) {

						var mapDiscounts = {};
						_.each(v.metadata.discounts, function(discount) {
							mapDiscounts[discount.id] = discount;
						});

						v.type = isProrated ? 'prorated' : 'monthly';
						v.services = [];

						$.each(v.metadata.add_ons, function(k, addOn) {
							var discount = 0,
								discountName = 'discount_' + addOn.id,
								discountItem;

							if(mapDiscounts.hasOwnProperty('discountName')) {
								discountItem = mapDiscounts[discountName];
								discount = parseInt(discountItem.quantity) * parseFloat(discountItem.amount);
							}

							addOn.amount = parseFloat(addOn.amount).toFixed(2);
							addOn.quantity = parseFloat(addOn.quantity);
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
					else {
						v.type = 'charges';
					}

					v.amount = parseFloat(v.amount).toFixed(2);

					// If there are no processor response text, we assume it was approved
					v.approved = v.hasOwnProperty('processor_response_text') ? v.processor_response_text === 'Approved' : true,
					// Our API return created but braintree returns created_at
					v.created = v.created_at || v.created; 

					v.friendlyCreated = monster.util.toFriendlyDate(v.created, 'short');

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
								v = formatCharge(v, true);

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

			self.callApi({
				resource: 'balance.getMonthly',
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

			self.callApi({
				resource: 'balance.getCharges',
				data: {
					accountId: self.accountId,
					from: from,
					to: to,
					reason: 'no_calls'
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
