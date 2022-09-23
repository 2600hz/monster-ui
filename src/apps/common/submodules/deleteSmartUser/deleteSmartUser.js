define(function(require) {
	var $ = require('jquery'),
		_ = require('lodash'),
		monster = require('monster');

	var deleteSmartUser = {
		// Defines API requests not included in the SDK
		requests: {},

		// Define the events available for other apps
		subscribe: {
			'common.deleteSmartUser.renderPopup': 'deleteSmartUserRender'
		},

		deleteSmartUserRender: function(args) {
			var self = this,
				user = args.user,
				dataTemplate = {
					user: user
				},
				dialogTemplate = $(self.getTemplate({
					name: 'deleteDialog',
					data: dataTemplate,
					submodule: 'deleteSmartUser'
				}));

			monster.ui.tooltips(dialogTemplate);

			dialogTemplate.find('#confirm_button').on('click', function() {
				var removeDevices = dialogTemplate.find('#delete_devices').is(':checked'),
					removeConferences = dialogTemplate.find('#delete_conferences').is(':checked');

				self.deleteSmartUserDeleteUserData({
					data: {
						accountId: args.accountId,
						userId: user.id
					},
					removeDevices: removeDevices,
					removeConferences: removeConferences,
					success: function(data) {
						popup.dialog('close').remove();

						args.hasOwnProperty('callback') && args.callback(data);
					}
				});
			});

			dialogTemplate.find('#cancel_button').on('click', function() {
				popup.dialog('close').remove();
			});

			var popup = monster.ui.dialog(dialogTemplate, {
				title: '<i class="fa fa-question-circle monster-primary-color"></i>',
				position: ['center', 20],
				dialogClass: 'monster-alert'
			});
		},

		deleteSmartUserListUserEntities: function(data, callback) {
			var self = this,
				accountId = data.acountId,
				userId = data.userId,
				shouldListDevices = data.shouldListDevices,
				shouldListConferences = data.shouldListConferences,
				queryData = {
					accountId: accountId,
					filters: {
						filter_owner_id: userId
					}
				},
				listMobileCallflows = function(next) {
					self.deleteSmartUserListCallflows({
						data: _.merge({
							filters: {
								filter_type: 'mobile'
							}
						}, queryData),
						success: _.partial(next, null)
					});
				},
				maybeListDevices = function(next) {
					if (!shouldListDevices) {
						return next(null);
					}
					self.deleteSmartUserListDevices({
						data: queryData,
						success: _.partial(next, null)
					});
				},
				maybeListConferences = function(next) {
					if (!shouldListConferences) {
						return next(null);
					}
					self.deleteSmartUserListConferences({
						data: queryData,
						success: _.partial(next, null)
					});
				};

			monster.parallel({
				conferences: maybeListConferences,
				devices: maybeListDevices,
				mobileCallflows: listMobileCallflows
			}, callback);
		},

		deleteSmartUserDeleteUserData: function(args) {
			var self = this,
				accountId = args.data.accountId,
				userId = args.data.userId,
				listEntities = _.bind(self.deleteSmartUserListUserEntities, self, {
					accountId: accountId,
					userId: userId,
					shouldListDevices: args.removeDevices,
					shouldListConferences: args.removeConferences
				}),
				accountId = args.data.accountId,
				removeDevices = args.removeDevices,
				removeConferences = args.removeConferences;

			listEntities(function(error, results) {
				var hasMobileCallflows = !_.isEmpty(results.mobileCallflows),
					listFnDelete = [];

				if (!removeDevices) {
					_.each(results.devices, function(device) {
						listFnDelete.push(function(callback) {
							self.deleteSmartUserUnassignDevice({
								data: {
									accountId: accountId,
									deviceId: device.id
								},
								callback: callback
							});
						});
					});
				}

				if (!removeConferences) {
					_.each(results.conferences, function(conference) {
						listFnDelete.push(function(callback) {
							self.deleteSmartUserUnassignConference({
								data: {
									accountId: accountId,
									conference: conference
								},
								callback: callback
							});
						});
					});
				}

				if (hasMobileCallflows) {
					_.each(results.mobileCallflows, function(callflow) {
						/*
						Special case for users with mobile devices:
						reassign mobile devices to their respective mobile callflow instead of just deleting the callflow
						*/
						listFnDelete.push(function(callback) {
							self.deleteSmartUserUnassignMobileCallflow({
								accountId: accountId,
								callflow: callflow,
								success: function(data) {
									callback(null, data);
								}
							});
						});
					});
				}

				monster.parallel(listFnDelete, function(err, resultsDelete) {
					self.deleteSmartUserDeleteUser({
						data: _.merge({
							data: {
								object_types: [
									!hasMobileCallflows && 'callflow',
									removeDevices && 'device',
									removeConferences && 'conference',
									'vmbox'
								]
							}
						}, args.data),
						success: function(data) {
							args.hasOwnProperty('success') && args.success(data);
						}
					});
				});
			});
		},

		deleteSmartUserUnassignDevice: function(args) {
			var self = this,
				callback = args.callback;

			self.deleteSmartUserPatchDevice({
				data: _.merge({
					data: {
						owner_id: null
					}
				}, args.data),
				success: _.partial(callback, null),
				error: callback
			});
		},

		deleteSmartUserUnassignConference: function(args) {
			var self = this,
				callback = args.callback,
				accountId = args.data.accountId,
				conference = args.data.conference;

			self.deleteSmartUserPatchConference({
				data: {
					accountId: accountId,
					conferenceId: conference.id,
					data: {
						owner_id: null,
						name: 'Unassigned ' + conference.name
					}
				},
				success: _.partial(callback, null),
				error: callback
			});
		},

		deleteSmartUserUnassignMobileCallflow: function(args) {
			var self = this,
				callback = args.callback,
				accountId = args.accountId,
				callflow = args.callflow,
				getMobileDevice = function(next) {
					var mdn = _.head(callflow.numbers);

					self.deleteSmartUserListDevices({
						data: {
							accountId: accountId,
							filters: {
								'filter_mobile.mdn': mdn
							}
						},
						success: _.flow(
							_.head,
							_.partial(next, null)
						)
					});
				},
				unassignedMobileCallflow = function(mobileDevice, next) {
					self.deleteSmartUserPatchCallflow({
						data: {
							accountId: accountId,
							callflowId: callflow.id,
							data: _.merge({
								owner_id: null
							}, _.isObject(mobileDevice) && {
								flow: {
									module: 'device',
									data: _.pick(mobileDevice, [
										'id'
									])
								}
							})
						},
						success: _.partial(next, null)
					});
				};

			monster.waterfall([
				getMobileDevice,
				unassignedMobileCallflow
			], callback);
		},

		/* API resource calls */

		/* - Devices */

		deleteSmartUserListDevices: function(args) {
			var self = this;

			self.deleteSmartUserListAllResources('device.list', args);
		},

		deleteSmartUserPatchDevice: function(args) {
			var self = this;

			self.deleteSmartUserModifySingleResource('device.patch', args);
		},

		/* - Callflows */

		deleteSmartUserListCallflows: function(args) {
			var self = this;

			self.deleteSmartUserListAllResources('callflow.list', args);
		},

		deleteSmartUserPatchCallflow: function(args) {
			var self = this;

			self.deleteSmartUserModifySingleResource('callflow.patch', args);
		},

		/* - Conferences */

		deleteSmartUserListConferences: function(args) {
			var self = this;

			self.deleteSmartUserListAllResources('conference.list', args);
		},

		deleteSmartUserPatchConference: function(args) {
			var self = this;

			self.deleteSmartUserModifySingleResource('conference.patch', args);
		},

		/* - Users */

		deleteSmartUserDeleteUser: function(args) {
			var self = this;

			self.deleteSmartUserModifySingleResource('user.delete', args);
		},

		/* API utils */

		deleteSmartUserGetResource: function(resource, args) {
			var self = this;

			self.callApi({
				resource: resource,
				data: _.merge({
					accountId: self.accountId
				}, args.data),
				success: function(data) {
					args.hasOwnProperty('success') && args.success(data.data);
				},
				error: function(parsedError) {
					args.hasOwnProperty('error') && args.success(parsedError);
				}
			});
		},

		deleteSmartUserListAllResources: function(resource, args) {
			var self = this;

			self.callApi({
				resource: resource,
				data: _.merge({
					accountId: self.accountId,
					filters: {
						paginate: 'false'
					}
				}, args.data),
				success: function(data) {
					args.hasOwnProperty('success') && args.success(data.data);
				},
				error: function(parsedError) {
					args.hasOwnProperty('error') && args.success(parsedError);
				}
			});
		},

		deleteSmartUserModifySingleResource: function(resource, args) {
			var self = this;

			self.callApi({
				resource: resource,
				data: _.merge({
					accountId: self.accountId,
					data: {}
				}, args.data),
				success: function(data) {
					args.hasOwnProperty('success') && args.success(data.data);
				},
				error: function(parsedError) {
					args.hasOwnProperty('error') && args.success(parsedError);
				}
			});
		}
	};

	return deleteSmartUser;
});
