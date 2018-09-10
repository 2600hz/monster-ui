define(function(require) {
	var $ = require('jquery'),
		_ = require('lodash'),
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
					showBookkeeper: false,
					hasServicePlan: false,
					hasSubscriptions: false,
					totalAmount: 0,
					servicePlanArray: []
				},
				renderData = defaults;

			monster.parallel({
				servicePlan: function(callback) {
					self.servicePlanGetSummary({
						success: function(data) {
							renderData.showBookkeeper = _.size(data.invoices) > 1;
							renderData.invoices = _.map(data.invoices, function(invoice) {
								renderData.hasServicePlan = true;
								return {
									bookkeeper: _.capitalize(invoice.bookkeeper.type),
									items: _
										.chain(invoice.items)
										.filter(function(item) {
											return item.quantity > 0;
										})
										.map(function(item) {
											renderData.totalAmount += item.total;
											return {
												name: _.has(self.i18n.active().servicePlan.titles, item.category)
													? self.i18n.active().servicePlan.titles[item.category]
													: monster.util.formatVariableToDisplay(item.category),
												rate: item.rate || 0,
												quantity: item.quantity || 0,
												discount: _.has(item, 'discounts.total')
													? '- ' + monster.util.formatPrice({
														price: item.discounts.total
													})
													: '',
												monthlyCharges: item.total
											};
										})
										.orderBy('monthlyCharges', 'desc')
										.value()
								};
							});
							callback(null, data);
						},
						error: function() {
							callback(null, {});
						}
					});
				},
				subscription: function(callback) {
					self.servicePlanGetSubscription(function success(data) {
						renderData.hasSubscriptions = true;

						renderData.dueDate = '?';

						if (data.data.length > 0) {
							// Hack to find the Active subscription
							data.data.forEach(function(subscription) {
								if (subscription.status === 'Active') {
									renderData.dueDate = monster.util.toFriendlyDate(subscription.next_bill_date, 'date');

									return false;
								}
							});
						}

						callback(null, data);
					},
					function error(data) {
						callback(null, {});
					});
				}
			}, function(err, results) {
				var servicePlanView = $(self.getTemplate({
					name: 'layout',
					data: renderData,
					submodule: 'servicePlan'
				}));

				self.servicePlanBindEvents(servicePlanView);

				monster.pub('myaccount.renderSubmodule', servicePlanView);

				if (typeof args.callback === 'function') {
					args.callback(servicePlanView);
				}
			});
		},

		servicePlanCleanFormData: function(module, data) {
			delete data.extra;

			return data;
		},

		servicePlanBindEvents: function(parent) {
			var self = this;

			monster.ui.tooltips(parent);

			parent.find('.action-number#download').on('click', function() {
				window.location.href = self.apiUrl + 'accounts/' + self.accountId + '/service_plans/current?depth=4&identifier=items&accept=csv&auth_token=' + self.getAuthToken();
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

		servicePlanGetSummary: function(args) {
			var self = this;

			self.callApi({
				resource: 'services.getSummary',
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
