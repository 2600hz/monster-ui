define(function(require){
	var $ = require('jquery'),
		_ = require('underscore'),
		monster = require('monster');

	var servicePlan = {

		requests: {
		},

		subscribe: {
			'myaccount.servicePlan.renderContent': '_servicePlanRenderContent'
		},

		_servicePlanRenderContent: function(args) {
			var self = this,
				defaults = {
					hasServicePlan: false,
					hasSubscriptions: false,
					totalAmount: 0,
					servicePlanArray: []
				},
				renderData = defaults;

			monster.parallel({
					servicePlan: function(callback) {
						self.servicePlanGet(function success (data) {
							var dataArray = [],
								totalAmount = 0;

							renderData.hasServicePlan = true;

							if('items' in data.data) {
								$.each(data.data.items, function(categoryName, category) {
									$.each(category, function(itemName, item) {
										var discount = item.single_discount_rate + (item.cumulative_discount_rate * item.cumulative_discount),
											monthlyCharges = parseFloat(((item.rate * item.quantity) - discount) || 0);

										if(monthlyCharges > 0) {
											dataArray.push({
												service: self.i18n.active().servicePlan.titles[itemName],
												rate: item.rate || 0,
												quantity: item.quantity || 0,
												discount: discount > 0 ? '-' + self.i18n.active().currencyUsed + monster.util.formatPrice(discount, 2) : '',
												monthlyCharges: monthlyCharges
											});

											totalAmount += monthlyCharges;
										}
									});
								});
							}

							var sortByPrice = function(a, b) {
								return parseFloat(a.monthlyCharges) >= parseFloat(b.monthlyCharges) ? -1 : 1;
							}

							dataArray.sort(sortByPrice);

							renderData.servicePlanArray = dataArray;
							renderData.totalAmount = totalAmount;

							callback(null, data);
						},
						function error(data) {
							callback(null, {});
						});
					},
					subscription: function(callback) {
						self.servicePlanGetSubscription(function success (data) {
							renderData.hasSubscriptions = true;

							renderData.dueDate = '?';

							if(data.data.length > 0) {
								// Hack to find the Active subscription
								data.data.forEach(function(subscription) {
									if(subscription.status === 'Active') {
										renderData.dueDate = monster.util.toFriendlyDate(subscription.next_bill_date, 'short');
										
										return false;
									}
								})
							}

							callback(null, data);
						},
						function error (data) { 
							callback(null, {});
						});
					}
				},
				function(err, results) {
					var servicePlanView = $(monster.template(self, 'servicePlan-layout', renderData));

					self.servicePlanBindEvents(servicePlanView);

					monster.pub('myaccount.renderSubmodule', servicePlanView);

					if(typeof args.callback === 'function') {
						args.callback(servicePlanView);
					}
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

			self.callApi({
				resource: 'servicePlan.getCsv',
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

			self.callApi({
				resource: 'servicePlan.listCurrent',
				data: {
					accountId: self.accountId,
					generateError: false
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

			self.callApi({
				resource: 'balance.getSubscriptions',
				data: {
					accountId: self.accountId,
					generateError: false
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
