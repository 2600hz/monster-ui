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

			var sortObject = function(objectToSort) {
				var orderedObject = {},
					keys = [],
					formattedKey,
					obj = {},
					i18nKeys = self.i18n.active().servicePlanDetails.keys;

				_.each(objectToSort, function(item, key) {
					formattedKey = item.hasOwnProperty('name') ? item.name : (i18nKeys.hasOwnProperty(key) ? i18nKeys[key] : key);
					obj = { 
						key:key,
						value: formattedKey.toLowerCase()
					};
					keys.push(obj);
				});

				keys.sort(function(a,b) {
					return a.value > b.value ? 1 : -1;
				});

				_.each(keys, function(item) {
					orderedObject[item.key] = objectToSort[item.key];
				});

				return orderedObject;
			}

			servicePlanData.plan = sortObject(servicePlanData.plan);
			_.each(servicePlanData.plan, function(item, key) {
				servicePlanData.plan[key] = sortObject(item);
			});
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
						_all: { rate: {}, activation_charge: {}, minimum: {}, exceptions: {}, as: {}, discounts: { maximum: {}, rate: {} } },
						port: { rate: {},activation_charge: {}, minimum: {}, discounts: { maximum: {}, rate: {} } },
						cnam: { rate: {},activation_charge: {}, minimum: {}, discounts: { maximum: {}, rate: {} } },
						e911: { rate: {},activation_charge: {}, minimum: {}, discounts: { maximum: {}, rate: {} } }
					},
					devices: {
						_all: { rate: {},activation_charge: {}, minimum: {}, exceptions: {}, as: {}, discounts: { maximum: {}, rate: {} } },
						ata: { rate: {},activation_charge: {}, minimum: {}, discounts: { maximum: {}, rate: {} } },
						cellphone: { rate: {},activation_charge: {}, minimum: {}, discounts: { maximum: {}, rate: {} } },
						fax: { rate: {},activation_charge: {}, minimum: {}, discounts: { maximum: {}, rate: {} } },
						landline: { rate: {},activation_charge: {}, minimum: {}, discounts: { maximum: {}, rate: {} } },
						mobile: { rate: {},activation_charge: {}, minimum: {}, discounts: { maximum: {}, rate: {} } },
						sip_device: { rate: {},activation_charge: {}, minimum: {}, discounts: { maximum: {}, rate: {} } },
						sip_uri: { rate: {},activation_charge: {}, minimum: {}, discounts: { maximum: {}, rate: {} } },
						smartphone: { rate: {},activation_charge: {}, minimum: {}, discounts: { maximum: {}, rate: {} } },
						softphone: { rate: {},activation_charge: {}, minimum: {}, discounts: { maximum: {}, rate: {} } }
					},
					limits: {
						_all: { rate: {}, activation_charge: {}, minimum: {}, exceptions: {}, as: {}, discounts: { maximum: {}, rate: {} } },
						outbound_trunks: { rate: {},activation_charge: {}, minimum: {}, discounts: { maximum: {}, rate: {} } },
						inbound_trunks: { rate: {},activation_charge: {}, minimum: {}, discounts: { maximum: {}, rate: {} } },
						twoway_trunks: { rate: {},activation_charge: {}, minimum: {}, discounts: { maximum: {}, rate: {} } }
					},
					phone_numbers: {
						_all: { rate: {}, activation_charge: {}, minimum: {}, exceptions: {}, as: {}, discounts: { maximum: {}, rate: {} } },
						tollfree_us: { rate: {},activation_charge: {}, minimum: {}, discounts: { maximum: {}, rate: {} } },
						toll_us: { rate: {},activation_charge: {}, minimum: {}, discounts: { maximum: {}, rate: {} } },
						emergency: { rate: {},activation_charge: {}, minimum: {}, discounts: { maximum: {}, rate: {} } },
						caribbean: { rate: {},activation_charge: {}, minimum: {}, discounts: { maximum: {}, rate: {} } },
						did_us: { rate: {},activation_charge: {}, minimum: {}, discounts: { maximum: {}, rate: {} } },
						international: { rate: {},activation_charge: {}, minimum: {}, discounts: { maximum: {}, rate: {} } },
						unknown: { rate: {},activation_charge: {}, minimum: {}, discounts: { maximum: {}, rate: {} } }
					},
					users: {
						_all: { rate: {}, activation_charge: {}, minimum: {}, exceptions: {}, as: {}, discounts: { maximum: {}, rate: {} } },
						user: { rate: {},activation_charge: {}, minimum: {}, discounts: { maximum: {}, rate: {} } }, 
						admin: { rate: {},activation_charge: {}, minimum: {}, discounts: { maximum: {}, rate: {} } }
					},
					ui_apps: function() {
						var obj = {};

						_.each(monster.appsStore, function(app, name) {
							obj[name] = {};
						});

						return obj;
					}()
				};

			_.each(overrideOptions, function(category) {
				_.each(category, function(subCategory) {
					subCategory.hasOptions = !_.isEmpty(subCategory);
					_.each(subCategory, function(subSubCategory) {
						subSubCategory.hasOptions = !_.isEmpty(subSubCategory);
					});
				});
			});

			return overrideOptions;
		},

		servicePlanCustomizeGetTemplate: function(pArgs) {
			var self = this,
				args = pArgs,
				mode = pArgs.mode || 'edit',
				useOwnPlans = pArgs.useOwnPlans || false,
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
											self.servicePlanDetailsGetSP(k, accountId, false, function(detailSP) {
												callback && callback(null, detailSP);
											},
											function(data) {
												callback(null, data);
											});
										}
									});

									monster.parallel(listSP, function(err, results) {
										_.each(results, function(value, plan) {
											// if value is empty, there was an error, so we remove the service plan from the list of service plan to show
											// Once KAZOO-4495 is done, we will be able to remove these next 3 lines, so that the service plan gets automatically deleted by the UI tool.
											if(_.isEmpty(value)) {
												delete results[plan];
											}
										});

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
						self.servicePlanDetailsListSP(accountId, useOwnPlans, function(data) {
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
						divContainerOverride = template.find('select[name="'+ k + '"]').parents('.customize-details-wrapper').find('.customize-override-wrapper');

						self.servicePlanDetailsRenderOverride(divContainerOverride, v.overrides);
					});

					template.find('.service-plan-selector').on('change', function() {
						var $this = $(this),
							servicePlanId = $this.val(),
							divContainer = $this.parents('.customize-details-wrapper').find('.details-selected-service-plan');

						divContainer.empty();

						if(servicePlanId !== 'none') {
							$this.parents('.category-wrapper').addClass('has-selected');
							self.servicePlanDetailsGetSP(servicePlanId, accountId, useOwnPlans, function(data) {
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

			template.find('select.service-plan-selector').each(function() {
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

			template.find('.details-overrides [data-key]').each(function() {
				var $this = $(this),
					plan = $this.parents('.category-wrapper').find(':selected').val(),
					category = $this.parents('[data-category]').data('category'),
					key = $this.data('key'),
					hasFields = $this.find('[data-field]').length > 0;

				if(plan !== 'none') {
					formattedData.overrides[plan] = formattedData.overrides[plan] || {};
					formattedData.overrides[plan][category] = formattedData.overrides[plan][category] || {};
					formattedData.overrides[plan][category][key] = formattedData.overrides[plan][category][key] || {};

					if(category === 'ui_apps') {
						formattedData.overrides[plan][category][key] = {
							enabled: true,
							app_id: monster.appsStore[key].id,
							name: monster.appsStore[key].i18n['en-US'].label,
							account_id: monster.apps.auth.originalAccount.id
						}
					}

					if(hasFields) {
						var field,
							value,
							subField;

						$this.find('[data-field]').each(function(el) {
							var $el = $(this);
							field = $el.data('field'),
							value = $el.find('.input-value').val();
							subField = $el.data('subfield');

							if(field === 'exceptions') { value = value.split(','); }

							if(!subField) {
								formattedData.overrides[plan][category][key][field] = value;
							}
							else {
								formattedData.overrides[plan][category][key][field] = formattedData.overrides[plan][category][key][field] || {};

								if(!field === 'discounts') {
									formattedData.overrides[plan][category][key][field][subField] = value;
								}
								else {
									if(!formattedData.overrides[plan][category][key][field].hasOwnProperty('cumulative')) {
										formattedData.overrides[plan][category][key][field]['cumulative'] = {};
									}

									formattedData.overrides[plan][category][key][field]['cumulative'][subField] = value;
								}
							}
						});
					}
				}
			});

			return formattedData;
		},

		servicePlanCustomizeInternalSaveData: function(data, globalCallback) {
			var self = this,
				parallelFunctionsOverrides= {};

			// First delete all plans to delete
			self.servicePlanDetailsUpdateSP(data.plansToDelete, data.plansToAdd, data.accountId, function() {
				self.servicePlanDetailsAddManyOverrideSP(data.overrides, data.accountId, function() {
					self.servicePlanDetailsGetCurrentSP(data.accountId, function(data) {
						globalCallback && globalCallback(data);
					});
				});
			});
		},

		servicePlanDetailsFormatOverride: function(overrides) {
			var self = this,
				allowedOverridesFull = self.servicePlanCustomizeGetOverrideDefault(),
				formattedData = {
					overrides: overrides,
					allowedOverrides: {}
				};

			var mapAsCategories = {};

			_.each(allowedOverridesFull, function(category, categoryName) {
				mapAsCategories[categoryName] = [];
				_.each(category, function(subCategory, key) {
					if(key !== '_all') {
						mapAsCategories[categoryName].push(key);
					}
				});
			});

			_.each(overrides, function(category, categoryName) {
				_.each(category, function(key, keyName) {
					if(categoryName === 'ui_apps') {
						delete allowedOverridesFull[categoryName][keyName];

						overrides.ui_apps[keyName] = {}
					}
					else {
						_.each(key, function(field, fieldName) {
							if(fieldName === 'discounts') {
								if(field.hasOwnProperty('cumulative')) {
									// If it comes straight from db, it has cumulative in it so we skip it
									overrides[categoryName][keyName][fieldName] = field.cumulative;
									field = field.cumulative;
								}
								
								_.each(field, function(subField, subFieldName) {
									if(allowedOverridesFull.hasOwnProperty(categoryName) && allowedOverridesFull[categoryName].hasOwnProperty(keyName) && allowedOverridesFull[categoryName][keyName].hasOwnProperty(fieldName)) {
										delete allowedOverridesFull[categoryName][keyName][fieldName][subFieldName];
									}
								});
							}
							else {
								if(allowedOverridesFull.hasOwnProperty(categoryName) && allowedOverridesFull[categoryName].hasOwnProperty(keyName)) {
									if(fieldName === 'as') {
										key.asCategories = mapAsCategories[categoryName];
									}

									delete allowedOverridesFull[categoryName][keyName][fieldName];
								}
							}
						});
					}
				});
			});

			formattedData.allowedOverrides = allowedOverridesFull;

			return formattedData;
		},

		servicePlanDetailsRenderOverride: function(container, pOverrides, pCssToFocus) {
			var self = this,
				cssToFocus = pCssToFocus || '',
				overrides = pOverrides || {},
				formattedData = self.servicePlanDetailsFormatOverride(overrides),
				template = $(monster.template(self, 'servicePlanDetails-overrideView', formattedData)),
				getOverridenValues = function() {
					var overrides = {};

					template.find('.details-overrides [data-key]').each(function() {
						var $this = $(this),
							category = $this.parents('[data-category]').data('category'),
							key = $this.data('key'),
							hasFields = $this.find('[data-field]').length > 0;

						overrides[category] = overrides[category] || {};
						overrides[category][key] = overrides[category][key] || {};

						if(hasFields) {
							var field,
								value;

							$this.find('[data-field]').each(function(el) {
								var $el = $(this);
								field = $el.data('field'),
								subField = $el.data('subfield'),
								value = $el.find('.input-value').val();

								if(subField) {
									overrides[category][key][field] = overrides[category][key][field] || {};
									overrides[category][key][field][subField] = value;
								}
								else {
									overrides[category][key][field] = value;
								}
							});
						}
					});

					return overrides;
				};

			template.find('.remove-line').on('click', function() {
				var overrides = getOverridenValues(),
					$this = $(this),
					isKey = $this.parents('[data-field]').length === 0,
					isSubField = $this.parents('[data-subfield]').length > 0,
					category = $this.parents('[data-category]').data('category'),
					key = $this.parents('[data-key]').data('key'),
					field = isKey ? '' : $this.parents('[data-field]').data('field'),
					subField = isSubField ? $this.parents('[data-subfield]').data('subfield') : '';

				if(isKey) {
					delete overrides[category][key];
				}
				else if(isSubField) {
					delete overrides[category][key][field][subField];
				}
				else {
					delete overrides[category][key][field];
				}

				if(overrides[category].hasOwnProperty(key) && overrides[category][key].hasOwnProperty(field) && _.isEmpty(overrides[category][key][field])) {
					delete overrides[category][key][field];
				}

				if(overrides[category].hasOwnProperty(key) && _.isEmpty(overrides[category][key])) {
					delete overrides[category][key];
				}

				if(_.isEmpty(overrides[category])) {
					delete overrides[category];
				}

				self.servicePlanDetailsRenderOverride(container, overrides);
			});

			template.find('.select-field-override .selectable').on('click', function() {
				var $this = $(this),
					isKey = typeof $this.attr('data-key') !== 'undefined',
					isSubField = typeof $this.attr('data-subfield') !== 'undefined',
					overrides = getOverridenValues(),
					category = $this.parents('[data-category]').data('category'),
					key = isKey ? $this.data('key') : $this.parents('[data-key]').data('key'),
					field = isKey ? '' : (isSubField ? $this.parents('[data-field]').data('field') : $this.data('field')),
					subField = isSubField ? $this.data('subfield') : '';

				overrides[category] = overrides[category] || {};
				overrides[category][key] = overrides[category][key] || {};

				if(field) {
					overrides[category][key][field] = overrides[category][key][field] || {};

					!subField ? overrides[category][key][field] = '' : overrides[category][key][field][subField] = '';
				}

				cssToFocus = '[data-category="' + category + '"] [data-key="' + key + '"] [data-field="' + field + '"] input';

				self.servicePlanDetailsRenderOverride(container, overrides, cssToFocus);
			});

			container.empty()
					 .append(template);

			if(cssToFocus) {
				template.find(cssToFocus).focus();
			}
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

		servicePlanDetailsListSP: function(accountId, useOwnPlans, callback) {
			var self = this;

			self.callApi({
				resource: useOwnPlans ? 'servicePlan.list' : 'servicePlan.listAvailable',
				data: {
					accountId: accountId
				},
				success: function(data) {
					callback && callback(data.data);
				}
			});
		},

		servicePlanDetailsGetSP: function(planId, accountId, useOwnPlans, success, error) {
			var self = this;

			self.callApi({
				resource: useOwnPlans ? 'servicePlan.get' : 'servicePlan.getAvailable',
				data: {
					planId: planId,
					accountId: accountId,
					generateError: false
				},
				success: function(data) {
					success && success(data.data);
				},
				error: function(data, status, globalHandler) {
					// We added this so that if the plan has been deleted, we can still continue to edit the plan normally
					// This allow us to edit accounts that have old SP that have been deleted.
					// Before it would just crash and wouldn't let us access the service plan selector
					if(data && data.data && data.data.hasOwnProperty('message') && data.data.message === 'bad identifier') {
						error && error({});
					}
					else {
						globalHandler(data, { generateError: true });
					}
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
