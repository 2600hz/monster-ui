define(function(require) {
	var $ = require('jquery'),
		_ = require('lodash'),
		monster = require('monster');

	var storagePlanManager = {
		requests: {},

		subscribe: {
			'common.storagePlanManager.render': 'storagePlanManagerRender'
		},

		storagePlanManagerRender: function(args) {
			var self = this;

			self.storagePlanManagerGetData(args, function(data) {
				var formattedData = self.storagePlanManagerFormatData(data, args),
					template = $(self.getTemplate({
						name: 'layout',
						submodule: 'storagePlanManager',
						data: formattedData
					}));

				self.storagePlanManagerBind(template, args, formattedData);

				$(args.container).empty()
					.append(template);
			});
		},

		storagePlanManagerBind: function(template, args, data) {
			var self = this;

			template.find('.remove-settings').on('click', function() {
				var type = $(this).parents('.storage-provider-wrapper').data('plan');

				monster.ui.confirm(self.i18n.active().storagePlanManager.confirmDeleteText, function() {
					self.storagePlanManagerDeletePlan(type, function(updatedStorage) {
						if (args.hasOwnProperty('onRemove')) {
							args.onRemove(updatedStorage);
						} else {
							self.storagePlanManagerRender(args);
						}
					});
				}, undefined, {
					type: 'warning',
					title: self.i18n.active().storagePlanManager.confirmDeleteTitle,
					confirmButtonText: self.i18n.active().storagePlanManager.confirmDelete
				});
			});

			template.find('.choose-plan').on('click', function() {
				var type = $(this).parents('.storage-provider-wrapper').data('plan'),
					update = function() {
						monster.pub('common.storageSelector.render', {
							callback: function(attachment) {
								self.storagePlanManagerUpdatePlan(type, attachment, function(updatedStorage) {
									monster.ui.toast({
										type: 'success',
										message: self.i18n.active().storagePlanManager.successUpdate
									});

									if (!hasExistingPlan && args.hasOwnProperty('onAdd')) {
										args.onAdd(updatedStorage);
									} else {
										if (args.hasOwnProperty('onUpdate')) {
											args.onUpdate(updatedStorage);
										} else {
											self.storagePlanManagerRender(args);
										}
									}
								});
							}
						});
					},
					hasExistingPlan = _.filter(data.plans, function(v) {
						if (v.extra.type === type && v.extra.isConfigured === true) {
							return true;
						}
					}).length > 0;

				if (hasExistingPlan) {
					monster.ui.confirm(self.i18n.active().storagePlanManager.confirmChange, function() {
						update();
					}, undefined, {
						type: 'warning',
						title: self.i18n.active().storagePlanManager.confirmTitle,
						confirmButtonText: self.i18n.active().storagePlanManager.confirmYes
					});
				} else {
					update();
				}
			});

			template.on('click', '.edit-path', function() {
				var $parent = $(this).parents('.storage-provider-wrapper');
				if (!$parent.find('.path-wrapper').length) {
					self.storagePlanManagerEditPath($parent);
				}
			});
		},

		storagePlanManagerEditPath: function(template) {
			var self = this,
				previousPath = template.attr('data-path'),
				type = template.attr('data-plan'),
				editTemplate = $(self.getTemplate({
					name: 'field-path',
					submodule: 'storagePlanManager',
					data: {
						path: previousPath
					}
				}));

			editTemplate.find('.cancel-link').on('click', function() {
				template.find('.custom-path').empty().html(previousPath);
			});

			editTemplate.find('.save-path').on('click', function() {
				var customPath = editTemplate.find('#path').val();
				self.storagePlanManagerSavePath(type, customPath, function(data) {
					template.attr('data-path', customPath);
					template.find('.custom-path').empty().html(customPath);
					monster.ui.toast({
						type: 'success',
						message: self.i18n.active().storagePlanManager.successPathUpdate
					});
				});
			});

			template.find('.custom-path').empty().append(editTemplate);
		},

		storagePlanManagerSavePath: function(type, path, callback) {
			var self = this;

			self.storagePlanManagerGetStorage(function(storage) {
				var updatedStorage = $.extend(true, {}, storage);

				updatedStorage.plan.modb.types[type].attachments = updatedStorage.plan.modb.types[type].attachments || {};
				updatedStorage.plan.modb.types[type].attachments.params = updatedStorage.plan.modb.types[type].attachments.params || {};
				updatedStorage.plan.modb.types[type].attachments.params.folder_path = path;

				self.storagePlanManagerUpdate(updatedStorage, function(newStorage) {
					callback && callback(newStorage);
				});
			});
		},

		storagePlanManagerDeletePlan: function(type, callback) {
			var self = this,
				found = false;

			self.storagePlanManagerGetStorage(function(storage) {
				var newStorage = $.extend(true, {}, storage);

				if (newStorage.hasOwnProperty('plan') && newStorage.plan.hasOwnProperty('modb') && newStorage.plan.modb.hasOwnProperty('types')) {
					_.each(newStorage.plan.modb.types, function(plan, planName) {
						if (planName === type) {
							found = true;
						}
					});
				}

				if (found) {
					delete newStorage.plan.modb.types[type];

					if (_.isEmpty(newStorage.plan.modb.types)) {
						delete newStorage.plan.modb.types;

						if (_.isEmpty(newStorage.plan.modb)) {
							delete newStorage.plan.modb;
						}
					}
				}

				self.storagePlanManagerUpdate(newStorage, callback);
			});
		},

		storagePlanManagerUpdatePlan: function(type, attachment, callback) {
			var self = this;

			self.storagePlanManagerGetStorage(function(storage) {
				var newStorage = $.extend(true, {}, storage);

				newStorage.plan = newStorage.plan || {};
				newStorage.plan.modb = newStorage.plan.modb || {};
				newStorage.plan.modb.types = newStorage.plan.modb.types || {};
				newStorage.plan.modb.types[type] = newStorage.plan.modb.types[type] || {};
				newStorage.plan.modb.types[type].attachments = newStorage.plan.modb.types[type].attachments || {};
				newStorage.plan.modb.types[type].attachments.handler = attachment.id;

				self.storagePlanManagerUpdate(newStorage, function(data) {
					callback && callback(data);
				});
			});
		},

		storagePlanManagerGetStorage: function(callback) {
			var self = this;

			self.callApi({
				resource: 'storage.get',
				data: {
					accountId: self.accountId,
					generateError: false
				},
				success: function(data) {
					callback(data.data);
				},
				error: function(data, error, globalHandler) {
					if (error.status === 404) {
						callback(undefined);
					} else {
						globalHandler(data);
					}
				}
			});
		},

		storagePlanManagerUpdate: function(data, callback) {
			var self = this;

			self.callApi({
				resource: 'storage.update',
				data: {
					accountId: self.accountId,
					data: data
				},
				success: function(data) {
					callback && callback(data.data);
				}
			});
		},

		storagePlanManagerGetData: function(args, callback) {
			var self = this;

			monster.parallel({
				storage: function(callback) {
					if (args.hasOwnProperty('data')) {
						callback && callback(null, args.data);
					} else {
						self.storagePlanManagerGetStorage(function(data) {
							callback && callback(null, data);
						});
					}
				}
			}, function(err, results) {
				callback && callback(results);
			});
		},

		storagePlanManagerFormatData: function(data, args) {
			var formattedData = {
					countAttachments: data.storage && data.storage.hasOwnProperty('attachments') ? _.size(data.storage.attachments) : 0,
					plans: []
				},
				forceTypes = args.hasOwnProperty('forceTypes') ? args.forceTypes : [],
				hideOtherTypes = args.hasOwnProperty('hideOtherTypes') ? args.hideOtherTypes : false,
				plansNotFound = args.hasOwnProperty('forceTypes') ? [].concat(args.forceTypes) : [];

			if (data.storage && data.storage.hasOwnProperty('plan') && data.storage.plan.hasOwnProperty('modb') && data.storage.plan.modb.hasOwnProperty('types')) {
				_.each(data.storage.plan.modb.types, function(plan, planType) {
					// If we allow display of all types, or if not, if the plan is included in the forced types to display
					if (!hideOtherTypes || forceTypes.indexOf(planType) >= 0) {
						if (data.storage.attachments.hasOwnProperty(plan.attachments.handler)) {
							plan.extra = {
								type: planType,
								isConfigured: true,
								detailAttachment: data.storage.attachments[plan.attachments.handler]
							};
							formattedData.plans.push(plan);
							// If we added the plan to the list, then we remove it to our array tracking the plans not found
							if (plansNotFound.indexOf(planType) >= 0) {
								plansNotFound.splice(plansNotFound.indexOf(planType), 1);
							}
						}
					}
				});
			}

			// Finally, if we still have some plans that the user want to edit, but that weren't found in the storage plan, we add them to the list as an unconfigured plan
			_.each(plansNotFound, function(type) {
				formattedData.plans.push({
					extra: {
						type: type,
						isConfigured: false
					}
				});
			});

			return formattedData;
		}
	};

	return storagePlanManager;
});
