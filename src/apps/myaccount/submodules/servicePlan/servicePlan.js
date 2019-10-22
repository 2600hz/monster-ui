define(function(require) {
	var $ = require('jquery');
	var _ = require('lodash');
	var monster = require('monster');

	return {
		subscribe: {
			'myaccount.servicePlan.getTemplate': '_servicePlanGetTemplate',
			'myaccount.servicePlan.renderContent': '_servicePlanRender'
		},

		_servicePlanRender: function(args) {
			var self = this;

			self._servicePlanGetTemplate({
				callback: function($template) {
					self.servicePlanBindEvents($template);
					monster.pub('myaccount.renderSubmodule', $template);
					args.hasOwnProperty('callback') && args.callback($template);
				}
			});
		},

		/**
		 * @param  {Object} args
		 * @param  {Object} [args.accountId]
		 * @param  {Object} [args.servicePlan]
		 * @param  {Function} args.callback
		 */
		_servicePlanGetTemplate: function(args) {
			var self = this,
				accountId = _.get(args, 'accountId'),
				servicePlan = _.get(args, 'servicePlan'),
				initTemplate = function initTemplate(result) {
					var $template = $(self.getTemplate({
						name: 'layout',
						data: self.servicePlanFormat(result),
						submodule: 'servicePlan'
					}));
					return $template;
				};

			monster.waterfall([
				function(cb) {
					if (!_.isUndefined(servicePlan)) {
						return cb(null, servicePlan);
					}
					self.servicePlanRequestGetSummary({
						data: {
							accountId: accountId
						},
						success: function(result) {
							cb(null, result);
						}
					});
				}
			], function(err, result) {
				var $template = initTemplate(result);
				_.has(args, 'callback') && args.callback($template);
			});
		},

		/**
		 * @param  {Object} servicePlan
		 * @param  {Object[]} servicePlan.invoices
		 * @return {Object}
		 */
		servicePlanFormat: function(servicePlan) {
			var self = this;

			return {
				showBookkeeper: _.size(servicePlan.invoices) > 1,
				hasSubscriptions: _.has(servicePlan, 'billing_cycle.next'),
				hasServicePlan: !_.isEmpty(servicePlan.invoices),
				totalAmount: _
					.chain(servicePlan.invoices)
					.sumBy(function(invoice) {
						return _
							.chain(invoice)
							.get('items', [])
							.sumBy('total')
							.value();
					}),
				dueDate: _.has(servicePlan, 'billing_cycle.next')
					? monster.util.toFriendlyDate(servicePlan.billing_cycle.next, 'date')
					: '?',
				invoices: _.map(servicePlan.invoices, function(invoice, index) {
					return {
						bookkeeper: _.get(invoice, 'bookkeeper.name', 'Invoice ' + (index + 1)),
						items: _
							.chain(invoice)
							.get('items', [])
							.filter(function(item) {
								return item.billable > 0;
							})
							.map(function(item) {
								return {
									name: item.name || item.category + '/' + item.item,
									rate: item.rate || 0,
									quantity: item.billable || 0,
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
