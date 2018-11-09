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

				if (removeDevices) {
					_.each(results.devices, function(device) {
						listFnDelete.push(function(callback) {
							self.deleteSmartUserDeleteDevice({
								data: {
									accountId: accountId,
									deviceId: device.id
								},
								success: function() {
									callback(null, '');
								}
							});
						});
					});
				} else {
					_.each(results.devices, function(device) {
						listFnDelete.push(function(callback) {
							self.deleteSmartUserUnassignDevice({
								data: {
									accountId: accountId,
									deviceId: device.id
								},
								success: function() {
									callback(null, '');
								}
							});
						});
					});
				}

				listFnDelete.push(function(callback) {
					self.deleteSmartUserRemoveBulkConferences({
						accountId: accountId,
						conferences: results.conferences,
						forceDelete: removeConferences,
						success: function() {
							callback(null, '');
						}
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

		deleteSmartUserUnassignDevice: function(args) {
			var self = this;

			monster.waterfall([
				function(callback) {
					self.deleteSmartUserGetDevice({
						data: args.data,
						success: function(deviceGet) {
							callback(null, deviceGet);
						},
						error: function() {
							callback(true);
						}
					});
				},
				function(deviceGet, callback) {
					delete deviceGet.owner_id;

					self.deleteSmartUserUpdateDevice({
						data: _.merge({
							data: deviceGet
						}, args.data),
						success: function(updatedDevice) {
							callback(null, updatedDevice);
						},
						error: function() {
							callback(true);
						}
					});
				}
			], function(err, updatedDevice) {
				if (err) {
					args.hasOwnProperty('error') && args.error(err);
					return;
				}

				args.hasOwnProperty('success') && args.success(updatedDevice);
			});
		},

		deleteSmartUserRemoveBulkConferences: function(args) {
			var self = this,
				listRequests = [];

			if (args.forceDelete) {
				_.each(args.conferences, function(conference) {
					listRequests.push(function(subCallback) {
						self.deleteSmartUserDeleteConference({
							data: {
								accountId: args.accountId,
								conferenceId: conference.id
							},
							success: function(data) {
								subCallback(null, data);
							}
						});
					});
				});
			} else {
				_.each(args.conferences, function(conference) {
					listRequests.push(function(subCallback) {
						self.deleteSmartUserUnassignConference({
							data: {
								accountId: args.accountId,
								conferenceId: conference.id
							},
							success: function(data) {
								subCallback(null, data);
							}
						});
					});
				});
			}

			monster.parallel(listRequests, function(err, results) {
				if (err) {
					args.hasOwnProperty('error') && args.error(err);
					return;
				}
				args.hasOwnProperty('success') && args.success(results);
			});
		},

		deleteSmartUserUnassignConference: function(args) {
			var self = this;

			monster.waterfall([
				function(callback) {
					self.deleteSmartUserGetConference({
						data: args.data,
						success: function(conference) {
							callback(null, conference);
						}
					});
				},
				function(conference, callback) {
					conference.name = 'Unassigned ' + conference.name;
					delete conference.owner_id;

					self.deleteSmartUserUpdateConference({
						data: _.merge({
							data: conference
						}, args.data),
						success: function(updatedConference) {
							callback(null, updatedConference);
						}
					});
				}
			], function(err, updatedConference) {
				if (err) {
					args.hasOwnProperty('error') && args.error(err);
					return;
				}

				args.hasOwnProperty('success') && args.success(updatedConference);
			});
		},

		/* API resource calls */

		deleteSmartUserListDevices: function(args) {
			var self = this;

			self.deleteSmartUserListAllResources('device.list', args);
		},

		deleteSmartUserListVMBoxes: function(args) {
			var self = this;

			self.deleteSmartUserListAllResources('voicemail.list', args);
		},

		deleteSmartUserListCallflows: function(args) {
			var self = this;

			self.deleteSmartUserListAllResources('callflow.list', args);
		},

		deleteSmartUserListConferences: function(args) {
			var self = this;

			self.deleteSmartUserListAllResources('conference.list', args);
		},

		deleteSmartUserDeleteDevice: function(args) {
			var self = this;

			self.deleteSmartUserModifySingleResource('device.delete', args);
		},

		deleteSmartUserGetDevice: function(args) {
			var self = this;

			self.deleteSmartUserGetResource('device.get', args);
		},

		deleteSmartUserUpdateDevice: function(args) {
			var self = this;

			self.deleteSmartUserModifySingleResource('device.update', args);
		},

		deleteSmartUserDeleteConference: function(args) {
			var self = this;

			self.deleteSmartUserModifySingleResource('conference.delete', args);
		},

		deleteSmartUserGetConference: function(args) {
			var self = this;

			self.deleteSmartUserGetResource('conference.get', args);
		},

		deleteSmartUserUpdateConference: function(args) {
			var self = this;

			self.deleteSmartUserModifySingleResource('conference.update', args);
		},

		/* API utils */

		deleteSmartUserGetResource: function(resource, args) {
			var self = this,
				queryArgs = {
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
				};

			self.callApi(queryArgs);
		},

		deleteSmartUserListAllResources: function(resource, args) {
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
					},
					error: function(parsedError) {
						args.hasOwnProperty('error') && args.success(parsedError);
					}
				};

			self.callApi(queryArgs);
		},

		deleteSmartUserModifySingleResource: function(resource, args) {
			var self = this,
				deleteArgs = {
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
				};

			self.callApi(deleteArgs);
		}
	};

	return deleteSmartUser;
});
