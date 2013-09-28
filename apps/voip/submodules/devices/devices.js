define(function(require){
	var $ = require('jquery'),
		_ = require('underscore'),
		monster = require('monster'),
		toastr = require('toastr');

	var app = {

		requests: {
			/* Users */
			'voip.devices.listUsers': {
				url: 'accounts/{accountId}/users',
				verb: 'GET'
			},
			/* Devices */
			'voip.devices.getStatus': {
				url: 'accounts/{accountId}/devices/status',
				verb: 'GET'
			},
			'voip.devices.listDevices': {
				url: 'accounts/{accountId}/devices',
				verb: 'GET'
			},
			'voip.devices.createDevice': {
				url: 'accounts/{accountId}/devices',
				verb: 'PUT'
			},
			'voip.devices.getDevice': {
				url: 'accounts/{accountId}/devices/{deviceId}',
				verb: 'GET'
			},
			'voip.devices.deleteDevice': {
				url: 'accounts/{accountId}/devices/{deviceId}',
				verb: 'DELETE'
			},
			'voip.devices.updateDevice': {
				url: 'accounts/{accountId}/devices/{deviceId}',
				verb: 'POST'
			}
		},

		subscribe: {
			'voip.devices.render': 'devicesRender'
		},

		/* Users */
		/* args: parent and userId */
		devicesRender: function(args) {
			var self = this,
				args = args || {},
				parent = args.parent || $('.right-content'),
				_deviceId = args.deviceId || '';

			self.devicesGetData(function(data) {
				var dataTemplate = self.devicesFormatListData(data),
				    template = $(monster.template(self, 'devices-layout', dataTemplate)),
					templateDevice;

				_.each(dataTemplate.devices, function(device) {
					templateDevice = monster.template(self, 'devices-row', device);

					template.find('.devices-rows').append(templateDevice);
				});

				template.find('.switch').bootstrapSwitch();

				self.devicesBindEvents(template, parent, dataTemplate);

				parent
					.empty()
					.append(template);

				if(_deviceId) {
					parent.find('.grid-row[data-id=' + _userId + ']')
						.css('background-color', '#22CCFF')
						.animate({
							backgroundColor: '#fcfcfc'
						}, 2000
					);
				}
			});
		},

		devicesFormatListData: function(data) {
			var self = this,
			    formattedData = {
					countDevices: 0,
					devices: {}
				},
				mapUsers = {},
				unassignedString = self.i18n.active().devices.unassignedDevice;

			_.each(data.users, function(user) {
				mapUsers[user.id] = user;
			});

			_.each(data.devices, function(device) {
				formattedData.countDevices++;

				formattedData.devices[device.id] = {
					id: device.id,
					isAssigned: !!device.owner_id,
					macAddress: device.mac_address,
					name: device.name,
					userName: device.owner_id ? mapUsers[device.owner_id].first_name + ' ' + mapUsers[device.owner_id].last_name : unassignedString,
					enabled: device.enabled,
					type: device.device_type,
					friendlyType: self.i18n.active().devices.types[device.device_type],
					registered: false,
					colorLine: device.enabled ? 'red' : 'black' /* Display a device in black if it's disabled, otherwise, until we know whether it's registered or not, we set the color to red */
				}
			});

			_.each(data.statuses, function(status) {
				if(status.registered === true && status.device_id in formattedData.devices) {
					var device = formattedData.devices[status.device_id];

					device.registered = true;

					/* Now that we know if it's registered, we set the color to green */
					if(device.enabled) {
						device.colorLine = 'green';
					}
				}
			});

			var arrayToSort = [];

			_.each(formattedData.devices, function(device) {
				arrayToSort.push(device);
			});

			arrayToSort.sort(function(a, b) {
				if(a.userName === unassignedString) {
					return true;
				}
				else if(b.userName === unassignedString) {
					return false;
				}
				else {
					return a.userName > b.userName;
				}
			});

			formattedData.devices = arrayToSort;

			return formattedData;
		},

		devicesBindEvents: function(template, parent, data) {
			var self = this;

			template.find('.devices-header .search-query').on('keyup', function() {
                var searchString = $(this).val().toLowerCase(),
                    rows = template.find('.devices-rows .grid-row:not(.title)'),
                    emptySearch = template.find('.devices-rows .empty-search-row');

                _.each(rows, function(row) {
                    var row = $(row);

                    row.data('search').toLowerCase().indexOf(searchString) < 0 ? row.hide() : row.show();
                });

                if(rows.size() > 0) {
                    rows.is(':visible') ? emptySearch.hide() : emptySearch.show();
                }
            });

            template.find('.switch').on('change', function() {
				var deviceId = $(this).parents('.grid-row').data('id'),
					toggle = $(this),
					enable = toggle.bootstrapSwitch('status');

				self.devicesGetDevice(deviceId, function(dataDevice) {
					dataDevice.enabled = enable;

					self.devicesUpdateDevice(dataDevice, function(dataDevice) {
						//We could display a success message but that could spam the user so for now we don't display anything
					},
					function() {
						toggle.bootstrapSwitch('toggleState');
					});
				},
				function() {
					toggle.bootstrapSwitch('toggleState');
				});
            });
		},

		devicesDeleteDevice: function(deviceId, callback) {
			var self = this;

			monster.request({
				resource: 'voip.devices.deleteDevice',
				data: {
					accountId: self.accountId,
					deviceId: deviceId,
					data: {}
				},
				success: function(data) {
					callback(data.data);
				}
			});
		},

		devicesGetDevice: function(deviceId, callbackSuccess, callbackError) {
			var self = this;

			monster.request({
				resource: 'voip.devices.getDevice',
				data: {
					accountId: self.accountId,
					deviceId: deviceId
				},
				success: function(data) {
					callbackSuccess && callbackSuccess(data.data);
				},
				error: function(data) {
					callbackError && callbackError(data);
				}
			});
		},

		devicesCreateDevice: function(deviceData, callback) {
			var self = this;

			monster.request({
				resource: 'voip.devices.createDevice',
				data: {
					accountId: self.accountId,
					data: deviceData
				},
				success: function(data) {
					callback(data.data);
				}
			});
		},

		devicesUpdateDevice: function(deviceData, callbackSuccess, callbackError) {
			var self = this;

			monster.request({
				resource: 'voip.devices.updateDevice',
				data: {
					accountId: self.accountId,
					data: deviceData,
					deviceId: deviceData.id
				},
				success: function(data) {
					callbackSuccess && callbackSuccess(data.data);
				},
				error: function(data) {
					callbackError && callbackError(data);
				}
			});
		},

		devicesGetData: function(callback) {
			var self = this;

			monster.parallel({
					users: function(callback) {
						monster.request({
							resource: 'voip.devices.listUsers',
							data: {
								accountId: self.accountId
							},
							success: function(dataUsers) {
								callback && callback(null, dataUsers.data);
							}
						});
					},
					status: function(callback) {
						monster.request({
							resource: 'voip.devices.getStatus',
							data: {
								accountId: self.accountId
							},
							success: function(dataStatus) {
								callback && callback(null, dataStatus.data);
							}
						});
					},
					devices: function(callback) {
						monster.request({
							resource: 'voip.devices.listDevices',
							data: {
								accountId: self.accountId
							},
							success: function(dataDevices) {
								callback(null, dataDevices.data);
							}
						});
					}
				},
				function(err, results) {
					callback && callback(results);
				}
			);
		}
	};

	return app;
});
