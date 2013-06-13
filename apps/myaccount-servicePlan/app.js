define(function(require){
	var $ = require('jquery'),
		_ = require('underscore'),
		monster = require('monster'),

		templates = {
			menu: 'menu',
			servicePlan: 'servicePlan',
		};

	var app = {

		name: 'myaccount-servicePlan',

		i18n: [ 'en-US' ],

		requests: {
			'servicePlan.get': {
				url: 'accounts/{accountId}/service_plans/current',
				verb: 'GET'
			},
			'servicePlan.getSubscription': {
				url: 'accounts/{accountId}/transactions/subscriptions',
				verb: 'GET'
			},
			'servicePlan.downloadCsv': {
				url: 'accounts/{accountId}/service_plans/current?depth=4&identifier=items&accept=csv',
				verb: 'GET'
			}
		},

		subscribe: {
			'myaccount-servicePlan.renderContent': '_renderContent'
		},

		load: function(callback){
			var self = this;

			self.whappAuth(function() {
				monster.ui.addCommonI18n(self);

				callback && callback(self);
			});
		},

		whappAuth: function(callback) {
			var self = this;

			monster.pub('auth.sharedAuth', {
				app: self,
				callback: callback
			});
		},

		render: function(account){
			var self = this,
				servicePlanMenu = $(monster.template(self, 'menu')),
				args = {
					name: self.name,
					title: self.i18n.active().title,
					menu: servicePlanMenu,
					weight: 20,
					category: 'billingCategory'
				};

			monster.pub('myaccount.addSubmodule', args);
		},

		_renderContent: function(args) {
			var self = this,
				defaults = {
					totalAmount: 0,
					servicePlanArray: []
				},
				renderData = defaults;

			monster.parallel({
					servicePlan: function(callback) {
						self.getServicePlan(function(data) {
							var dataArray = [],
								totalAmount = 0;

							if('items' in data.data) {
								$.each(data.data.items, function(categoryName, category) {
									$.each(category, function(itemName, item) {
										var discount = item.single_discount_rate + (item.cumulative_discount_rate * item.cumulative_discount),
											monthlyCharges = parseFloat(((item.rate * item.quantity) - discount) || 0).toFixed(2);

										if(monthlyCharges > 0) {
											dataArray.push({
												service: self.i18n.active()[itemName],
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
						self.getSubscription(function(data) {
							if(data.data.length > 0) {
								renderData.dueDate = monster.ui.toFriendlyDate(data.data[0].next_bill_date, 'short');
							}

							callback(null, data);
						});
					}
				},
				function(err, results) {
					var servicePlanView = $(monster.template(self, 'servicePlan', renderData));

					self.bindEvents(servicePlanView);

					monster.pub('myaccount.renderSubmodule', servicePlanView);
				}
			);
		},

		cleanFormData: function(module, data) {
			delete data.extra;

			return data;
		},

		formatData: function(data) {
			var self = this;

			return data;
		},

		bindEvents: function(parent) {
			var self = this;

			parent.find('.icon-question-sign[data-toggle="tooltip"]').tooltip();

			parent.find('#get_csv').on('click', function() {
				window.location.href = self.apiUrl+'accounts/'+self.accountId+'/service_plans/current?depth=4&identifier=items&accept=csv&auth_token=' + self.authToken;
			});

			parent.find('#get_pdf').on('click', function() {
				window.location.href = self.apiUrl + 'accounts/' +
								   self.accountId + '/service_plans/current?identifier=items&depth=4&auth_token=' + self.authToken;
			});
		},

		//utils
		downloadCsv: function(success, error) {
			var self = this;

			monster.request({
				resource: 'servicePlan.downloadCsv',
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

		getServicePlan: function(success, error) {
			var self = this;

			monster.request({
				resource: 'servicePlan.get',
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

		getSubscription: function(success, error) {
			var self = this;

			monster.request({
				resource: 'servicePlan.getSubscription',
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

	return app;
});
