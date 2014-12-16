define(function(require){
	var $ = require('jquery'),
		_ = require('underscore'),
		monster = require('monster');

	var servicePlanDetails = {

		requests: {},

		subscribe: {
			'common.servicePlanDetails.render': 'servicePlanDetailsRender'
		},

		/* Arguments:
		** container: jQuery Div
		** servicePlan: servicePlanId or servicePlan data
		** callback: callback executed once we rendered the number control
		*/
		servicePlanDetailsRender: function(args){
			var self = this,
				container = args.container,
				servicePlan = args.servicePlan || null,
				callback = args.callback;

			if(container) {
				if(typeof servicePlan === 'string') {
					self.callApi({
						resource: 'servicePlan.get',
						data: {
							accountId: self.accountId,
							planId: servicePlan
						},
						success: function(data, status) {
							self.renderServicePlanDetails(container, data.data, callback);
						}
					});
				} else {
					self.renderServicePlanDetails(container, servicePlan, callback);
				}
			} else {
				throw "You must provide a container!";
			}
		},

		renderServicePlanDetails: function(container, servicePlanData, callback) {
			var self = this,
				template = $(monster.template(self, 'servicePlanDetails-layout', {
					servicePlan: servicePlanData
				}));

			template.find('[data-toggle="tooltip"]').tooltip();

			container.empty().append(template);

			callback && callback({
				template: template,
				data: servicePlanData
			});
		}
	}

	return servicePlanDetails;
});
