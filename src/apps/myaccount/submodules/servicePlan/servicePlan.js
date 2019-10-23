define(function(require) {
	var $ = require('jquery');
	var _ = require('lodash');
	var monster = require('monster');

	return {
		subscribe: {
			'myaccount.servicePlan.getTemplate': '_servicePlanGetTemplate',
			'myaccount.servicePlan.renderContent': '_servicePlanRender'
		},

		/**
		 * @param  {Object} args
		 * @param  {Function} [args.callback]
		 */
		_servicePlanRender: function(args) {
			var self = this;

			self._servicePlanGetTemplate({
				callback: function($template) {
					monster.pub('myaccount.renderSubmodule', $template);
					args.hasOwnProperty('callback') && args.callback($template);
				}
			});
		},

		/**
		 * @param  {Object} args
		 * @param  {Object} [args.accountId]
		 * @param  {Object} [args.servicePlan]
		 * @param  {Boolean} [args.allowActions=true]
		 * @param  {Function} args.callback
		 */
		_servicePlanGetTemplate: function(args) {
			var self = this,
				callback = args.callback,
				accountId = _.get(args, 'accountId'),
				servicePlan = _.get(args, 'servicePlan'),
				allowActions = _.get(args, 'allowActions', true),
				initTemplate = function initTemplate(dataToTemplate) {
					var $template = $(self.getTemplate({
						name: 'layout',
						data: dataToTemplate,
						submodule: 'servicePlan'
					}));
					return $template;
				},
				formatDataToTemplate = function formatDataToTemplate(result) {
					var formattedServicePlan = self.servicePlanFormat(result),
						invoices = formattedServicePlan.invoices;

					return _.merge({
						hasServicePlan: !_.isEmpty(invoices),
						showActions: allowActions,
						showBookkeeper: _.size(invoices) > 1,
						showDueDate: !_.isUndefined(formattedServicePlan.dueDate)
					}, formattedServicePlan);
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
				var funcs = [formatDataToTemplate, initTemplate],
					getTemplate;
				if (allowActions) {
					funcs.push(self.servicePlanBindEvents.bind(self));
				}
				getTemplate = _.flow(funcs);
				callback(getTemplate(result));
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
				totalAmount: _.sumBy(servicePlan.invoices, function(invoice) {
					return _
						.chain(invoice)
						.get('items', [])
						.map(function(item) {
							return _.get(item, 'total', 0);
						})
						.sum()
						.value();
				}),
				dueDate: _.get(servicePlan, 'billing_cycle.next'),
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

			return parent;
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
