define(function(require) {
	var $ = require('jquery');
	var _ = require('lodash');
	var monster = require('monster');

	return {
		subscribe: {
			'myaccount.servicePlan.renderContent': '_servicePlanRender'
		},

		_servicePlanRender: function(args) {
			var self = this;
			var initTemplate = function(result) {
				var template = $(self.getTemplate({
					name: 'layout',
					data: self.servicePlanFormat(result),
					submodule: 'servicePlan'
				}));
				self.servicePlanBindEvents(template);
				monster.pub('myaccount.renderSubmodule', template);
				return template;
			};
			self.servicePlanRequestGetSummary({
				success: function(result) {
					var template = initTemplate(result);
					args.hasOwnProperty('callback') && args.callback(template);
				}
			});
		},

		servicePlanFormat: function(data) {
			var self = this;
			return {
				showBookkeeper: _.size(data.invoices) > 1,
				hasSubscriptions: _.has(data, 'billing_cycle.next'),
				hasServicePlan: !_.isEmpty(data.invoices),
				totalAmount: _.reduce(data.invoices, function(acc, invoice) {
					_.forEach(invoice.items, function(item) {
						acc += item.total;
					});
					return acc;
				}, 0),
				dueDate: _.has(data, 'billing_cycle.next')
					? monster.util.toFriendlyDate(data.billing_cycle.next, 'date')
					: '?',
				invoices: _.map(data.invoices, function(invoice, index) {
					return {
						bookkeeper: invoice.bookkeeper.name || 'Invoice ' + (index + 1),
						items: _
							.chain(invoice.items)
							.filter(function(item) {
								return item.quantity > 0;
							})
							.map(function(item) {
								return {
									name: item.name || item.category + '/' + item.item,
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
							.sortBy('name')
							.value()
					};
				})
			};
		},

		servicePlanBindEvents: function(parent) {
			var self = this;

			monster.ui.tooltips(parent);

			parent.find('.action-number#download').on('click', function() {
				window.location.href = self.apiUrl
					+ 'accounts/'
					+ self.accountId
					+ '/services/summary?depth=4&identifier=items&accept=csv&auth_token='
					+ self.getAuthToken();
			});
		},

		servicePlanRequestGetSummary: function(args) {
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
		}
	};
});
