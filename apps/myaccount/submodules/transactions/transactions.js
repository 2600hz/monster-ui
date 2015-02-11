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

			parent.on('click', '.expand-box:not(.disabled)', function() {
				var current = $(this),
					transactionBox = current.parents('.transaction-box'),
					expandable = transactionBox.first().find('.expandable');

				current.find('.icon-stack-content').toggleClass('icon-plus icon-minus')
				transactionBox.toggleClass('open')
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
			};

			monster.parallel({
					monthly: function(callback) {
						self.transactionsGetMonthly(from, to, function(dataMonthly) {
							var arrayTransactions = [];

							$.each(dataMonthly.data, function(k, v) {
								v = monster.util.formatTransaction(v, false, self);

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
								v = monster.util.formatTransaction(v, true, self);

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
					// success && success(data, status);
					success({
    "data": [
        {
            "description": "braintree transaction",
            "bookkeeper_info": {
                "id": "k9hd6p",
                "merchant_account_id": "2600hz"
            },
            "metadata": {
                "id": "k9hd6p",
                "status": "settled",
                "type": "sale",
                "currency_code": "USD",
                "amount": "16.70",
                "merchant_account_id": "2600hz",
                "created_at": "2015-02-06T19:22:11Z",
                "update_at": "2015-02-06T19:22:11Z",
                "settlement_batch": "2015-02-07_2600hz",
                "avs_postal_response": "I",
                "avs_street_response": "I",
                "ccv_response_code": "I",
                "processor_authorization_code": "NFWQC4",
                "processor_response_code": "1000",
                "processor_response_text": "Approved",
                "tax_exempt": false,
                "billing_address": {},
                "shipping_address": {},
                "customer": {
                    "id": "dc89d55d0be61d60866cdd7863b45e6f",
                    "first_name": "Richard",
                    "last_name": "Hurlock",
                    "credit_cards": [],
                    "addresses": []
                },
                "card": {
                    "id": "95d964740868b6b0d02d0d74c0385c43",
                    "bin": "411111",
                    "card_type": "Visa",
                    "default": false,
                    "expiration_month": "04",
                    "expiration_year": "2017",
                    "expired": false,
                    "customer_location": "US",
                    "last_four": "1111",
                    "billing_address": {}
                },
                "subscription_id": "e56446c17b5e5c4eed3acc5f1fe36dd8",
                "add_ons": [
                    {
                        "id": "sip_device",
                        "amount": "17.99",
                        "quantity": 1
                    },
                    {
                        "id": "user",
                        "amount": "15.99",
                        "quantity": 7
                    },
                    {
                        "id": "twoway_trunks",
                        "amount": "24.99",
                        "quantity": 4
                    }
                ],
                "discounts": []
            },
            "amount": 16.7,
            "reason": "unknown",
            "type": "credit",
            "created": 63590469731,
            "code": 9999
        },
        {
            "description": "monthly rollup",
            "amount": 0,
            "reason": "database_rollup",
            "type": "credit",
            "created": 63590379412,
            "code": 4000
        },
        {
            "description": "credit addition from credit card",
            "sub_account_id": "32d9b55a2df4b99c902bf8ff12cfc764",
            "bookkeeper_info": {
                "amount": 100
            },
            "sub_account_name": "2600hz sandbox",
            "amount": 100,
            "reason": "sub_account_manual_addition",
            "type": "credit",
            "created": 63590379416,
            "code": 3002
        }
    ],
    "revision": "undefined",
    "request_id": "393ff284b09720f4a717ef1ea2e6593b",
    "status": "success",
    "auth_token": "d982de85831f2343ff583d4abe06f532"
})
				},
				error: function(data, status) {
					error && error(data, status);
				}
			});
		}
	};

	return transactions;
});
