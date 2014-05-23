define(function(require){
	var $ = require('jquery'),
		_ = require('underscore'),
		monster = require('monster');

	var servicePlan = {

		requests: {
			'myaccount.servicePlan.get': {
				url: 'accounts/{accountId}/service_plans/current',
				verb: 'GET'
			},
			'myaccount.servicePlan.getSubscription': {
				url: 'accounts/{accountId}/transactions/subscriptions',
				verb: 'GET'
			},
			'myaccount.servicePlan.downloadCsv': {
				url: 'accounts/{accountId}/service_plans/current?depth=4&identifier=items&accept=csv',
				verb: 'GET'
			}
		},

		subscribe: {
			'myaccount.servicePlan.renderContent': '_servicePlanRenderContent'
		},

		_servicePlanRenderContent: function(args) {
			var self = this,
				defaults = {
					totalAmount: 0,
					servicePlanArray: []
				},
				renderData = defaults;

			monster.parallel({
					servicePlan: function(callback) {
						self.servicePlanGet(function(data) {
							var dataArray = [],
								totalAmount = 0;

							if('items' in data.data) {
								$.each(data.data.items, function(categoryName, category) {
									$.each(category, function(itemName, item) {
										var discount = item.single_discount_rate + (item.cumulative_discount_rate * item.cumulative_discount),
											monthlyCharges = parseFloat(((item.rate * item.quantity) - discount) || 0).toFixed(2);

										if(monthlyCharges > 0) {
											dataArray.push({
												service: self.i18n.active().servicePlan.titles[itemName],
												rate: item.rate || 0,
												quantity: item.quantity || 0,
												discount: discount > 0 ? '-' + self.i18n.active().currencyUsed + parseFloat(discount).toFixed(2) : '',
												monthlyCharges: monthlyCharges
											});

											totalAmount += parseFloat(monthlyCharges);
										}
									});
								});
							}

							var sortByPrice = function(a, b) {
								return parseFloat(a.monthlyCharges) >= parseFloat(b.monthlyCharges) ? -1 : 1;
							}

							dataArray.sort(sortByPrice);

							renderData.servicePlanArray = dataArray;
							renderData.totalAmount = parseFloat(totalAmount).toFixed(2);

							callback(null, data);
						});
					},
					subscription: function(callback) {
						self.servicePlanGetSubscription(function(data) {
							if(data.data.length > 0) {
								renderData.dueDate = monster.util.toFriendlyDate(data.data[0].next_bill_date, 'short');
							}

							callback(null, data);
						});
					}
				},
				function(err, results) {
					var servicePlanView = $(monster.template(self, 'servicePlan-layout', renderData));

					self.servicePlanBindEvents(servicePlanView);

					monster.pub('myaccount.renderSubmodule', servicePlanView);
				}
			);
		},

		servicePlanCleanFormData: function(module, data) {
			delete data.extra;

			return data;
		},

		servicePlanBindEvents: function(parent) {
			var self = this;

			parent.find('.icon-question-sign[data-toggle="tooltip"]').tooltip();

			parent.find('.action-number#download').on('click', function() {
				window.location.href = self.apiUrl+'accounts/'+self.accountId+'/service_plans/current?depth=4&identifier=items&accept=csv&auth_token=' + self.authToken;
			});
		},

		//utils
		servicePlanDownloadCsv: function(success, error) {
			var self = this;

			monster.request({
				resource: 'myaccount.servicePlan.downloadCsv',
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

		servicePlanGet: function(success, error) {
			var self = this;

			monster.request({
				resource: 'myaccount.servicePlan.get',
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

		servicePlanGetSubscription: function(success, error) {
			var self = this;

			monster.request({
				resource: 'myaccount.servicePlan.getSubscription',
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
		}
	};

	return servicePlan;
});
