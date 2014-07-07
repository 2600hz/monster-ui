define(function(require){
	var $ = require('jquery'),
		_ = require('underscore'),
		monster = require('monster');

	var servicePlanDetails = {

		requests: {},

		subscribe: {
			'common.servicePlanDetails.render': 'render'
		},

		/* Arguments:
		** container: jQuery Div
		** servicePlan: servicePlanId or servicePlan data
		** callback: callback executed once we rendered the number control
		*/
		render: function(args){
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
							var template = monster.template(self, 'servicePlanDetails-layout', {
								servicePlan: data.data
							});

							container.empty().append(template);

							callback && callback({
								template: template,
								data: data.data
							});
						}
					});
				} else {
					var template = monster.template(self, 'servicePlanDetails-layout', {
						servicePlan: servicePlan
					});

					container.empty().append(template);

					callback && callback({
						template: template,
						data: servicePlan
					});
				}
			} else {
				throw "You must provide a container!";
			}
		}
	}

	return servicePlanDetails;
});
