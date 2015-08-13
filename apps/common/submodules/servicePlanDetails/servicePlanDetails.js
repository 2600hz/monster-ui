define(function(require){
	var $ = require('jquery'),
		_ = require('underscore'),
		monster = require('monster');

	var servicePlanDetails = {

		requests: {},

		subscribe: {
			'common.servicePlanDetails.render': 'servicePlanDetailsRender',
			'common.servicePlanDetails.getServicePlanTemplate': 'servicePlanCustomizeGetTemplate',
			'common.servicePlanDetails.customizeSave': 'servicePlanCustomizeSave'
		},

		/* Arguments:
		** container: jQuery Div
		** servicePlan: servicePlanId or servicePlan data
		** useOwnPlans: if true, get the plan details from the account own plans, instead of its reseller's ones
		** callback: callback executed once we rendered the number control
		*/
		servicePlanDetailsRender: function(args) {
			var self = this,
				container = args.container,
				servicePlan = args.servicePlan || null,
				useOwnPlans = args.useOwnPlans || false,
				callback = args.callback,
				accountId = args.accountId || self.accountId;

			if(container) {
				if(typeof servicePlan === 'string') {
					self.callApi({
						resource: useOwnPlans ? 'servicePlan.get' : 'servicePlan.getAvailable',
						data: {
							accountId: accountId,
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

		// We use the same view to display 2 different API GET /service_plan/available/xxx and /current, so we use this function to format them the same
		servicePlanDetailsFormatData: function(servicePlanData) {
			var self = this,
				formattedData = {
					servicePlan: {}
				};

			if(servicePlanData.hasOwnProperty('items') && !servicePlanData.hasOwnProperty('plan')) {
				servicePlanData.plan = servicePlanData.items;
			}

			formattedData.servicePlan = servicePlanData;

			return formattedData;
		},

		renderServicePlanDetails: function(container, servicePlanData, callback) {
			var self = this,
				formattedData = self.servicePlanDetailsFormatData(servicePlanData),
				template = $(monster.template(self, 'servicePlanDetails-layout', formattedData));

			monster.ui.tooltips(template);

			container.empty().append(template);

			callback && callback({
				template: template,
				data: servicePlanData
			});
		},

		/* New common stuff */
		servicePlanCustomizeGetOverrideDefault: function() {
			var self = this,
				 overrideOptions = {
					number_services: {
						port: [ 'rate', 'activation_charge', 'minimum '],
						cnam: [ 'rate', 'activation_charge', 'minimum '],
						e911: [ 'rate', 'activation_charge', 'minimum ']
					},
					devices: {
						ata: [ 'rate', 'activation_charge', 'minimum '],
						cellphone: [ 'rate', 'activation_charge', 'minimum '],
						fax: [ 'rate', 'activation_charge', 'minimum '],
						landline: [ 'rate', 'activation_charge', 'minimum '],
						mobile: [ 'rate', 'activation_charge', 'minimum '],
						sip_device: [ 'rate', 'activation_charge', 'minimum '],
						sip_uri: [ 'rate', 'activation_charge', 'minimum '],
						smartphone: [ 'rate', 'activation_charge', 'minimum '],
						softphone: [ 'rate', 'activation_charge', 'minimum ']
					},
					limits: {
						outbound_trunks: [ 'rate', 'activation_charge', 'minimum '],
						inbound_trunks: [ 'rate', 'activation_charge', 'minimum '],
						twoway_trunks: [ 'rate', 'activation_charge', 'minimum ']
					},
					phone_numbers: {
						tollfree_us: [ 'rate', 'activation_charge', 'minimum '],
						did_us: [ 'rate', 'activation_charge', 'minimum ']
					}
				};

			return overrideOptions;
		},

		servicePlanCustomizeGetTemplate: function(pArgs) {
			var self = this,
				args = pArgs,
				mode = pArgs.mode || 'edit',
				accountId = args.accountId || self.accountId;

			monster.parallel({
					current: function(callback) {
						if(mode === 'new') {
							callback(null, {});
						}
						else {
							self.servicePlanDetailsGetCurrentSP(accountId, function(data) {
								var response = {
									details: data,
									selectedPlans: {}
								};

								if(data && data.plans && !_.isEmpty(data.plans)) {
									var listSP = {};

									_.each(data.plans, function(v,k) {
										listSP[k] = function(callback) {
											self.servicePlanDetailsGetSP(k, accountId, function(detailSP) {
												callback && callback(null, detailSP);
											});
										}
									});

									monster.parallel(listSP, function(err, results) {
										response.selectedPlans = results;

										callback && callback(null, response);
									});
								}
								else {
									callback(null, response);
								}
							});
						}
					},
					listAvailable: function(callback) {
						self.servicePlanDetailsListSP(accountId, function(data) {
							callback(null, data)
						});
					}
				},
				function(err, results) {
					var data = self.servicePlanCustomizeFormatData(results),
						template = $(monster.template(self, 'servicePlanDetails-customizeView', data)),
						divContainerPlan,
						divContainerOverride;

					_.each(data.selectedPlans, function(v,k) {
						divContainerPlan = template.find('[value="'+ k + '"]:selected').parents('.customize-details-wrapper').find('.details-selected-service-plan');
						self.servicePlanDetailsRender({ accountId: accountId, servicePlan: v, container: divContainerPlan });
					});

					_.each(data.categories, function(v,k) {
						if(v.overrides) {
							divContainerOverride = template.find('select[name="'+ k + '"]').parents('.customize-details-wrapper').find('.details-overrides');

							self.servicePlanDetailsRenderOverride(divContainerOverride, v.overrides);
						}
					});

					template.find('.service-plan-selector').on('change', function() {
						var $this = $(this),
							servicePlanId = $this.val(),
							divContainer = $this.parents('.customize-details-wrapper').find('.details-selected-service-plan');

						divContainer.empty();

						if(servicePlanId !== 'none') {
							$this.parents('.category-wrapper').addClass('has-selected');
							self.servicePlanDetailsGetSP(servicePlanId, accountId, function(data) {
								self.servicePlanDetailsRender({ accountId: accountId, servicePlan: data, container: divContainer });
							});
						} else {
							$this.parents('.category-wrapper').removeClass('has-selected');
						}
					});

					args.afterRender && args.afterRender(template, data);
				}
			);
		},

		servicePlanCustomizeFormatData: function(data) {
			var self = this,
				formattedPlan = {},
				formattedData = {};

			_.each(data.listAvailable, function(plan) {
				if(!formattedData.hasOwnProperty(plan.category)) {
					formattedData[plan.category] = {
						friendlierName: plan.category,
						plans: []
					};
				}

				formattedPlan = {
					id: plan.id,
					name: plan.name
				}

				if(data.current && data.current.details && data.current.details.hasOwnProperty('plans') && data.current.details.plans.hasOwnProperty(plan.id)) {
					formattedPlan.selected = true;
					formattedData[plan.category].hasSelected = true;
					formattedData[plan.category].overrides = data.current.details.plans[plan.id].overrides;

					if(data.current.details.plans[plan.id].overrides) {
						//formattedPlan.overrides = data.current.details.plans[plan.id].overrides;
						formattedData[plan.category].overrides = data.current.details.plans[plan.id].overrides;
					}
				}

				formattedData[plan.category].plans.push(formattedPlan);
			});

			return { 
				categories: formattedData, 
				selectedPlans: data.current.selectedPlans,
				allowedOverrides: self.servicePlanCustomizeGetOverrideDefault()
			};
		},

		servicePlanDetailsGetDataToSave: function(accountId, template, previousPlans) {
			var self = this,
				mapToDelete = {},
				formattedData = {
					accountId: accountId,
					plansToDelete: [],
					plansToAdd: [],
					overrides: {}
				};

			_.each(previousPlans, function(v,k) {
				mapToDelete[k] = true;
			});

			template.find('select').each(function() {
				var value = $(this).val();

				if(value !== 'none') {
					// If we selected a plan we already have, we don't delete it
					if(mapToDelete.hasOwnProperty(value)) {
						delete mapToDelete[value];
					}
					// And if we didn't have it before we add it to the plans to add
					else {
						formattedData.plansToAdd.push(value);
					}
				}
			});

			_.each(mapToDelete, function(v,k) {
				formattedData.plansToDelete.push(k);
			});

			template.find('.details-overrides [data-field]').each(function() {
				var $this = $(this),
					plan = $this.parents('.category-wrapper').find(':selected').val(),
					category = $this.parents('[data-key]').siblings('[data-category]').data('category'),
					key = $this.parents('[data-key]').data('key'),
					field = $this.data('field'),
					value = $this.data('value');

				if(plan !== 'none') {
					formattedData.overrides[plan] = formattedData.overrides[plan] || {};
					formattedData.overrides[plan][category] = formattedData.overrides[plan][category] || {};
					formattedData.overrides[plan][category][key] = formattedData.overrides[plan][category][key] || {};
					formattedData.overrides[plan][category][key][field] = value;
				}
			});

			console.log(formattedData);

			return formattedData;
		},

		servicePlanCustomizeInternalSaveData: function(data, globalCallback) {
			var self = this,
				parallelFunctionsOverrides= {};

			console.log(data);
			// First delete all plans to delete
			self.servicePlanDetailsUpdateSP(data.plansToDelete, data.plansToAdd, data.accountId, function() {
				self.servicePlanDetailsAddManyOverrideSP(data.overrides, data.accountId, function() {
					self.servicePlanDetailsGetCurrentSP(data.accountId, function(data) {
						globalCallback && globalCallback(data);
					});
				});
			});
		},

		servicePlanDetailsRenderOverride: function(container, overrides) {
			console.log(container, overrides);
			var self = this,
				template = monster.template(self, 'servicePlanDetails-overrideView', { overrides: overrides });

			container.append(template);
		},

		servicePlanCustomizeSave: function(pArgs) {
			var self = this,
				args = pArgs,
				accountId = args.accountId || self.accountId,
				previousPlans = args.previousPlans || {},
				divResult = args.divResult || undefined,
				container = args.container,
				dataToSave = self.servicePlanDetailsGetDataToSave(accountId, container, previousPlans);

			self.servicePlanCustomizeInternalSaveData(dataToSave, function(data) {
				if(divResult) {
					self.servicePlanDetailsRender({ accountId: accountId, servicePlan: data, container: divResult });
				}

				args.callback && args.callback(data);
			});
		},

		servicePlanDetailsListSP: function(accountId, callback) {
			var self = this;

			self.callApi({
				resource: 'servicePlan.listAvailable',
				data: {
					accountId: accountId
				},
				success: function(data) {
					callback && callback(data.data);
				}
			});
		},

		servicePlanDetailsGetSP: function(planId, accountId, callback) {
			var self = this;

			self.callApi({
				resource: 'servicePlan.getAvailable',
				data: {
					planId: planId,
					accountId: accountId
				},
				success: function(data) {
					callback && callback(data.data);
				}
			});
		},

		servicePlanDetailsGetCurrentSP: function(accountId, callback) {
			var self = this;

			self.callApi({
				resource: 'servicePlan.listCurrent',
				data: {
					accountId: accountId
				},
				success: function(data) {
					callback && callback(data.data);
				}
			});
		},

		servicePlanDetailsAddManySP: function(plans, accountId, callback) {
			var self = this;

			if(plans.length) {
				self.callApi({
					resource: 'servicePlan.addMany',
					data: {
						accountId: accountId,
						data: {
							plans: plans
						}
					},
					success: function(data) {
						callback && callback(data.data);
					}
				});
			}
			else {
				callback && callback({});
			}
			
		},

		servicePlanDetailsRemoveSP: function(planId, accountId, callback) {
			var self = this;

			self.callApi({
				resource: 'servicePlan.remove',
				data: {
					planId: planId,
					accountId: accountId
				},
				success: function(data) {
					callback && callback(data.data);
				}
			});
		},

		servicePlanDetailsRemoveManySP: function(plansToDelete, accountId, callback) {
			var self = this;

			self.callApi({
				resource: 'servicePlan.removeMany',
				data: {
					accountId: accountId,
					data: {
						plans: plansToDelete
					}
				},
				success: function(data) {
					callback && callback(data.data);
				}
			});
		},

		servicePlanDetailsAddManyOverrideSP: function(overrides, accountId, callback) {
			var self = this;

			self.callApi({
				resource: 'servicePlan.addManyOverrides',
				data: {
					accountId: accountId,
					data: {
						overrides: overrides
					}
				},
				success: function(data) {
					callback && callback(data.data);
				}
			});
		},

		servicePlanDetailsUpdateSP: function(plansToDelete, plansToAdd, accountId, callback) {
			var self = this;

			// If both arrays are empty, no need to do anything
			if(plansToAdd.length + plansToDelete.length) {
				self.callApi({
					resource: 'servicePlan.update',
					data: {
						accountId: accountId,
						data: {
							add: plansToAdd,
							delete: plansToDelete
						}
					},
					success: function(data) {
						callback && callback(data.data);
					}
				});
			}
			else {
				callback && callback();
			}
		}
	}

	return servicePlanDetails;
});
