define(function(require) {
	var $ = require('jquery'),
		_ = require('lodash'),
		monster = require('monster');

	var deleteSmartUser = {
		// Defines API requests not included in the SDK
		requests: {},

		// Define the events available for other apps
		subscribe: {
			'common.deleteSmartUser.showDeleteDialog': 'deleteSmartUserShowDeleteDialog'
		},

		deleteSmartUserShowDeleteDialog: function(args) {
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

				self.deleteSmartUserDeleteUser({
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

		deleteSmartUserDeleteUser: function(args) {
			var self = this,
				accountId = args.data.accountId,
				userId = args.data.userId,
				removeDevices = args.removeDevices,
				removeConferences = args.removeConferences,
				queryData = {
					accountId: accountId,
					filters: {
						filter_owner_id: userId
					}
				};

			monster.parallel({
				devices: function(callback) {
					self.deleteSmartUserListDevices({
						data: queryData,
						success: function(devices) {
							callback(null, devices);
						}
					});
				},
				vmbox: function(callback) {
					self.deleteSmartUserListVMBoxes({
						data: queryData,
						success: function(data) {
							callback(null, data);
						}
					});
				},
				callflows: function(callback) {
					self.deleteSmartUserListCallflows({
						data: queryData,
						success: function(data) {
							callback(null, data);
						}
					});
				},
				conferences: function(callback) {
					self.deleteSmartUserListConferences({
						data: queryData,
						success: function(data) {
							callback(null, data);
						}
					});
				}
			}, function(error, results) {
				var listFnDelete = [];

				_.each(results.devices, function(device) {
					listFnDelete.push(function(callback) {
						if (removeDevices) {
							self.usersDeleteDevice(device.id, function(data) {
								callback(null, '');
							});
						} else {
							self.usersUnassignDevice(device.id, function(data) {
								callback(null, '');
							});
						}
					});
				});

				listFnDelete.push(function(callback) {
					self.usersRemoveBulkConferences(results.conferences, removeConferences, function() {
						callback(null, '');
					});
				});

				_.each(results.callflows, function(callflow) {
					/*
					Special case for users with mobile devices:
					reassign mobile devices to their respective mobile callflow instead of just deleting the callflow
					 */
					if (callflow.type === 'mobile') {
						listFnDelete.push(function(mainCallback) {
							monster.parallel({
								callflow: function(callback) {
									self.usersGetCallflow(callflow.id, function(data) {
										callback(null, data);
									});
								},
								mobileDevice: function(callback) {
									self.usersGetMobileDevice(callflow.numbers[0].slice(2), function(data) {
										callback(null, data);
									});
								}
							}, function(err, results) {
								var fullCallflow = results.callflow,
									mobileDeviceId = results.mobileDevice.id;

								delete fullCallflow.owner_id;

								$.extend(true, fullCallflow, {
									flow: {
										module: 'device',
										data: {
											id: mobileDeviceId
										}
									}
								});

								self.usersUpdateCallflow(fullCallflow, function(data) {
									mainCallback(null, data);
								});
							});
						});
					} else {
						listFnDelete.push(function(callback) {
							self.usersDeleteCallflow(callflow.id, function(data) {
								callback(null, '');
							});
						});
					}
				});

				_.each(results.vmbox, function(vmbox) {
					listFnDelete.push(function(callback) {
						self.usersDeleteVMBox(vmbox.id, function(data) {
							callback(null, '');
						});
					});
				});

				monster.parallel(listFnDelete, function(err, resultsDelete) {
					self.usersDeleteUser({
						data: args.data,
						success: function(data) {
							args.hasOwnProperty('success') && args.success(data);
						}
					});
				});
			});
		},

		deleteSmartUserListDevices: function(args) {
			var self = this;

			self.deleteSmartUserListResources('device.list', args);
		},

		deleteSmartUserListVMBoxes: function(args) {
			var self = this;

			self.deleteSmartUserListResources('voicemail.list', args);
		},

		deleteSmartUserListCallflows: function(args) {
			var self = this;

			self.deleteSmartUserListResources('callflow.list', args);
		},

		deleteSmartUserListConferences: function(args) {
			var self = this;

			self.deleteSmartUserListResources('conference.list', args);
		},

		deleteSmartUserListResources: function(resource, args) {
			var self = this,
				queryArgs = {
					resource: resource,
					data: _.merge({
						accountId: self.accountId,
						filters: {
							paginate: 'false'
						}
					}, args.data),
					success: function(data) {
						args.hasOwnProperty('success') && args.success(data.data);
					}
				};

			self.callApi(queryArgs);
		}
	};

	return deleteSmartUser;
});
