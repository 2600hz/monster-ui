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

					parent.find('.start-date .value').html(data.billingStartDate);
					parent.find('.end-date .value').html(data.billingEndDate);
					parent.find('.total-amount .value').html(self.i18n.active().currencyUsed + data.amount);
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

			self.callApi({
				resource: 'balance.getCharges',
				data: {
					accountId: self.accountId,
					from: from,
					to: to,
					reason: 'no_calls'
				},
				success: function(data, status) {
					var data = {"data":[{"description":"braintree transaction","bookkeeper_info":{"id":"cpmzx6w","merchant_account_id":"switchfreedom"},"metadata":{"id":"cpmzx6w","status":"processor_declined","type":"sale","currency_code":"USD","amount":"5.00","merchant_account_id":"switchfreedom","purchase_order":"2002","created_at":"2015-03-13T18:02:03Z","update_at":"2015-03-13T18:02:04Z","avs_postal_response":"M","avs_street_response":"I","ccv_response_code":"I","processor_response_code":"2046","processor_response_text":"Declined","tax_exempt":false,"billing_address":{"id":"v5","postal_code":"33442"},"shipping_address":{},"customer":{"id":"2abc2a5bdcd82207a6e17610ebe39b83","first_name":"Ana Maria","last_name":"Knezevic","company":"EOX Technology Solutions","phone":"9548954174","credit_cards":[],"addresses":[]},"card":{"id":"85d8053057ba74e846915a15fe2b0f77","bin":"547415","card_type":"MasterCard","default":false,"expiration_month":"06","expiration_year":"2016","expired":false,"customer_location":"US","last_four":"0957","billing_address":{"id":"v5","postal_code":"33442"}},"add_ons":[],"discounts":[],"is_api":true,"is_automatic":false,"is_recurring":false},"amount":5.0,"reason":"manual_addition","status":"processor_declined","type":"credit","created":63593488923,"version":2,"code":3001},{"description":"braintree transaction","bookkeeper_info":{"id":"9x7vj42","merchant_account_id":"switchfreedom"},"metadata":{"id":"9x7vj42","status":"processor_declined","type":"sale","currency_code":"USD","amount":"5.00","merchant_account_id":"switchfreedom","purchase_order":"2002","created_at":"2015-03-13T17:04:19Z","update_at":"2015-03-13T17:04:19Z","avs_postal_response":"M","avs_street_response":"I","ccv_response_code":"I","processor_response_code":"2046","processor_response_text":"Declined","tax_exempt":false,"billing_address":{"id":"v5","postal_code":"33442"},"shipping_address":{},"customer":{"id":"2abc2a5bdcd82207a6e17610ebe39b83","first_name":"Ana Maria","last_name":"Knezevic","company":"EOX Technology Solutions","phone":"9548954174","credit_cards":[],"addresses":[]},"card":{"id":"85d8053057ba74e846915a15fe2b0f77","bin":"547415","card_type":"MasterCard","default":false,"expiration_month":"06","expiration_year":"2016","expired":false,"customer_location":"US","last_four":"0957","billing_address":{"id":"v5","postal_code":"33442"}},"add_ons":[],"discounts":[],"is_api":true,"is_automatic":false,"is_recurring":false},"amount":5.0,"reason":"manual_addition","status":"processor_declined","type":"credit","created":63593485459,"version":2,"code":3001},{"description":"braintree transaction","bookkeeper_info":{"id":"35y2sfr","merchant_account_id":"switchfreedom"},"metadata":{"id":"35y2sfr","status":"processor_declined","type":"sale","currency_code":"USD","amount":"5.00","merchant_account_id":"switchfreedom","purchase_order":"2002","created_at":"2015-03-12T23:30:24Z","update_at":"2015-03-12T23:30:25Z","avs_postal_response":"M","avs_street_response":"I","ccv_response_code":"I","processor_response_code":"2046","processor_response_text":"Declined","tax_exempt":false,"billing_address":{"id":"v5","postal_code":"33442"},"shipping_address":{},"customer":{"id":"2abc2a5bdcd82207a6e17610ebe39b83","first_name":"Ana Maria","last_name":"Knezevic","company":"EOX Technology Solutions","phone":"9548954174","credit_cards":[],"addresses":[]},"card":{"id":"85d8053057ba74e846915a15fe2b0f77","bin":"547415","card_type":"MasterCard","default":false,"expiration_month":"06","expiration_year":"2016","expired":false,"customer_location":"US","last_four":"0957","billing_address":{"id":"v5","postal_code":"33442"}},"add_ons":[],"discounts":[],"is_api":true,"is_automatic":false,"is_recurring":false},"amount":5.0,"reason":"manual_addition","status":"processor_declined","type":"credit","created":63593422224,"version":2,"code":3001},{"description":"braintree transaction","bookkeeper_info":{"id":"38bpmq6","merchant_account_id":"switchfreedom"},"metadata":{"id":"38bpmq6","status":"processor_declined","type":"sale","currency_code":"USD","amount":"5.00","merchant_account_id":"switchfreedom","purchase_order":"2002","created_at":"2015-03-05T14:35:43Z","update_at":"2015-03-05T14:35:44Z","avs_postal_response":"M","avs_street_response":"I","ccv_response_code":"I","processor_response_code":"2046","processor_response_text":"Declined","tax_exempt":false,"billing_address":{"id":"v5","postal_code":"33442"},"shipping_address":{},"customer":{"id":"2abc2a5bdcd82207a6e17610ebe39b83","first_name":"Ana Maria","last_name":"Knezevic","company":"EOX Technology Solutions","phone":"9548954174","credit_cards":[],"addresses":[]},"card":{"id":"85d8053057ba74e846915a15fe2b0f77","bin":"547415","card_type":"MasterCard","default":false,"expiration_month":"06","expiration_year":"2016","expired":false,"customer_location":"US","last_four":"0957","billing_address":{"id":"v5","postal_code":"33442"}},"add_ons":[],"discounts":[],"is_api":true,"is_automatic":false,"is_recurring":false},"amount":5.0,"reason":"manual_addition","status":"processor_declined","type":"credit","created":63592785343,"version":2,"code":3001},{"description":"braintree transaction","bookkeeper_info":{"id":"dd9zbmw","merchant_account_id":"switchfreedom"},"metadata":{"id":"dd9zbmw","status":"settled","type":"sale","currency_code":"USD","amount":"1075.72","merchant_account_id":"switchfreedom","created_at":"2015-03-02T10:31:34Z","update_at":"2015-03-02T10:31:35Z","settlement_batch":"2015-03-02_switchfreedom_2","avs_postal_response":"M","avs_street_response":"I","ccv_response_code":"I","processor_authorization_code":"03964J","processor_response_code":"1000","processor_response_text":"Approved","tax_exempt":false,"billing_address":{"id":"v5","postal_code":"33442"},"shipping_address":{},"customer":{"id":"2abc2a5bdcd82207a6e17610ebe39b83","first_name":"Ana Maria","last_name":"Knezevic","company":"EOX Technology Solutions","phone":"9548954174","credit_cards":[],"addresses":[]},"card":{"id":"85d8053057ba74e846915a15fe2b0f77","bin":"547415","card_type":"MasterCard","default":false,"expiration_month":"06","expiration_year":"2016","expired":false,"customer_location":"US","last_four":"0957","billing_address":{"id":"v5","postal_code":"33442"}},"subscription_id":"71780aac60bb52e4a58585833ab922db","add_ons":[{"id":"did_us","amount":"1.00","quantity":123},{"id":"e911","amount":"2.00","quantity":1},{"id":"tollfree_us","amount":"4.99","quantity":5},{"id":"sip_device","amount":"5.00","quantity":200}],"discounts":[],"is_api":false,"is_automatic":true,"is_recurring":true},"amount":1075.7200000000000273,"reason":"monthly_recurring","status":"settled","type":"credit","created":63592511494,"version":2,"code":5001},{"description":"braintree transaction","bookkeeper_info":{"id":"gs7pwq6","merchant_account_id":"switchfreedom"},"metadata":{"id":"gs7pwq6","status":"settled","type":"credit","currency_code":"USD","amount":"1237.85","merchant_account_id":"switchfreedom","created_at":"2015-02-18T09:58:25Z","update_at":"2015-02-18T09:58:25Z","refunded_transaction":"f25qv8m","settlement_batch":"2015-02-18_switchfreedom","avs_postal_response":"A","avs_street_response":"A","ccv_response_code":"A","processor_response_code":"1002","processor_response_text":"Processed","tax_exempt":false,"billing_address":{"id":"v5","postal_code":"33442"},"shipping_address":{},"customer":{"id":"2abc2a5bdcd82207a6e17610ebe39b83","first_name":"Ana Maria","last_name":"Knezevic","company":"EOX Technology Solutions","phone":"9548954174","credit_cards":[],"addresses":[]},"card":{"id":"85d8053057ba74e846915a15fe2b0f77","bin":"547415","card_type":"MasterCard","default":false,"expiration_month":"06","expiration_year":"2016","expired":false,"customer_location":"US","last_four":"0957","billing_address":{"id":"v5","postal_code":"33442"}},"subscription_id":"71780aac60bb52e4a58585833ab922db","add_ons":[],"discounts":[],"is_api":false,"is_automatic":false,"is_recurring":false},"amount":1237.8499999999999091,"reason":"unknown","status":"settled","type":"credit","created":63591472705,"version":2,"code":9999},{"description":"credit addition from credit card","bookkeeper_info":{"card":{"id":"85d8053057ba74e846915a15fe2b0f77","bin":"547415","card_type":"MasterCard","default":false,"expiration_month":"06","expiration_year":"2016","expired":false,"customer_location":"US","last_four":"0957"},"customer":{"id":"2abc2a5bdcd82207a6e17610ebe39b83","first_name":"Ana Maria","last_name":"Knezevic","company":"EOX Technology Solutions","phone":"9548954174"},"id":"dwn75dm","status":"submitted_for_settlement","type":"sale","currency_code":"USD","amount":"10.00","merchant_account_id":"switchfreedom","created_at":"2015-02-17T16:55:45Z","update_at":"2015-02-17T16:55:46Z","avs_postal_response":"M","avs_street_response":"I","ccv_response_code":"I","processor_authorization_code":"06340J","processor_response_code":"1000","processor_response_text":"Approved","tax_exempt":false,"add_ons":[],"discounts":[]},"id":"9fbe79b8622e7c80facf923890fbc60a","amount":10.0,"reason":"manual_addition","type":"credit","created":63591411346,"version":2,"code":3001},{"description":"monthly rollup","id":"monthly_rollup","amount":8.2863000000000006651,"reason":"database_rollup","type":"credit","created":63592405581,"version":2,"code":4000}],"revision":"undefined","request_id":"6cb3992805aa89922dbdea67cbe6d8d5","status":"success","auth_token":"31a75678448cfe617a07729662353aa7"};
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
