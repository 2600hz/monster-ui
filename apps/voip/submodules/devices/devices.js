define(function(require){
	var $ = require('jquery'),
		_ = require('underscore'),
		monster = require('monster'),
		toastr = require('toastr');

	var app = {

		requests: {
			/* Provisioner */
			'voip.devices.getProvisionerData': {
				apiRoot: monster.config.api.provisioner || 'http://p.2600hz.com/',
				dataType: '*/*',
				url: 'api/phones/',
				verb: 'GET'
			},
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
		/* args: parent and deviceId */
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
					parent.find('.grid-row[data-id=' + _deviceId + ']')
						.css('background-color', '#22CCFF')
						.animate({
							backgroundColor: '#fcfcfc'
						}, 2000
					);
				}
			});
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

            template.find('.settings').on('click', function() {
				var $this = $(this),
					deviceId = $this.parents('.grid-row').data('id');

				self.devicesGetDevice(deviceId, function(dataDevice) {
					self.devicesRenderEdit(dataDevice, function(device) {
						self.devicesRender({ deviceId: device.id });
					});
				});
            });

            template.find('.create-device').on('click', function() {
				var type = $(this).data('type');

				self.devicesRenderAdd(type, function(device) {
					self.devicesRender({ deviceId: device.id });
				});
            });
		},

		devicesRenderAdd: function(type, callback) {
			var self = this,
				args = {
					type: type
				};

			if(type === 'sip_device') {
				self.devicesGetProvisionerData(function(dataProvisioner) {
					args.data = self.devicesFormatProvisionerData(dataProvisioner);

					self.devicesRenderProvisioner(args, function(dataProvisioner) {
						var argsSip = {
							data: {
								device_type: 'sip_device'
							},
							dataProvisioner: dataProvisioner
						};

						self.devicesRenderDevice(argsSip, callback);
					});
				});
			}
			else {

			}
		},

		devicesRenderEdit: function(data, callback) {
			var self = this;

			if(data.device_type === 'sip_device') {
				var argsSip = {
					data: data,
					dataProvisioner: data.provision
				};

				self.devicesRenderDevice(argsSip, callback);
			}
			else {

			}
		},

		devicesRenderDevice: function(args, callback) {
			console.log(args);
			var self = this
				mode = args.data.id ? 'edit' : 'add',
				type = args.data.device_type,
				popupTitle = mode === 'edit' ? monster.template(self, '!' + self.i18n.active().devices[type].editTitle, { name: args.data.name }) : self.i18n.active().devices[type].addTitle;
			    formattedData = self.devicesFormatData(args),
			    templateDevice = $(monster.template(self, 'devices-'+type, formattedData));

			if(type === 'sip_device') {
				templateDevice.find('#audio_codec_selector .selected-codecs, #audio_codec_selector .available-codecs').sortable({
			  		connectWith: '.connectedSortable'
				}).disableSelection();

				templateDevice.find('#video_codec_selector .selected-codecs, #video_codec_selector .available-codecs').sortable({
			  		connectWith: '.connectedSortable'
				}).disableSelection();
			}

			templateDevice.find('.change-section').on('click', function() {
				var $this = $(this),
					section = $this.data('section');

				templateDevice.find('.main-section').removeClass('active');
				templateDevice.find('.section').hide();

				templateDevice.find('.section[data-section="' + section + '"]').show();
				$this.parents('.main-section').addClass('active');
			});

			templateDevice.find('.actions .save').on('click', function() {
				var dataToSave = self.devicesMergeData(formattedData, templateDevice);

				self.devicesSaveDevice(dataToSave, function(data) {
					popup.dialog('close').remove();

					callback && callback(data);
				});
			});

			templateDevice.find('.actions .delete').on('click', function() {
				var deviceId = $(this).parents('.edit-device').data('id');

				self.devicesDeleteDevice(deviceId, function(device) {
					self.devicesRender();
					popup.dialog('close').remove();

					toastr.success(monster.template(self, '!' + self.i18n.active().devices.deletedDevice, { deviceName: device.name }));
				});
			});

			templateDevice.find('.actions .cancel-link').on('click', function() {
				popup.dialog('close').remove();
			});

			var popup = monster.ui.dialog(templateDevice, {
				position: ['center', 20],
				title: popupTitle
			});
		},

		/* Args inclunding: data:list of supported devices from provisioner api */
		devicesRenderProvisioner: function(args, callback) {
			var self = this,
				selectedBrand,
				selectedFamily,
				selectedModel,
				templateDevice = $(monster.template(self, 'devices-provisioner', args.data));

			templateDevice.find('.brand-box').on('click', function() {
				var $this = $(this),
					brand = $this.data('brand');

				selectedBrand = brand;

				$this.removeClass('unselected').addClass('selected');
				templateDevice.find('.brand-box:not([data-brand="'+brand+'"])').removeClass('selected').addClass('unselected');
				templateDevice.find('.devices-brand').hide();
				templateDevice.find('.devices-brand[data-brand="'+ brand + '"]').show();

				templateDevice.find('.block-device').show();
			});

			templateDevice.find('.device-box').on('click', function() {
				var $this = $(this);
				selectedModel = $this.data('model'),
				selectedFamily = $this.data('family');

				templateDevice.find('.device-box').removeClass('selected');

				$this.addClass('selected');

				templateDevice.find('.actions .selection').text(monster.template(self, '!' + self.i18n.active().devices.provisionerPopup.deviceSelected, { brand: selectedBrand, model: selectedModel }));
				templateDevice.find('.actions').show();
			});

			templateDevice.find('.next-step').on('click', function() {
				var dataProvisioner = {
					endpoint_brand: selectedBrand,
					endpoint_family: selectedFamily,
					endpoint_model: selectedModel
				};

				popup.dialog('close').remove();

				callback && callback(dataProvisioner);
			});

			var popup = monster.ui.dialog(templateDevice, {
				position: ['center', 20],
				title: self.i18n.active().devices.provisionerPopup.title
			});
		},

		devicesMergeData: function(originalData, template) {
			var self = this,
				hasCodecs = originalData.device_type === 'sip_device' ? true : false,
				formData = form2object('form_device');

			formData.mac_address = monster.util.formatMacAddress(formData.mac_address);

			if(hasCodecs) {
				formData.media = {
					audio: {
						codecs: []
					},
					video: {
						codecs: []
					}
				};

				template.find('#audio_codec_selector .selected-codecs li').each(function() {
					formData.media.audio.codecs.push($(this).data('codec'));
				});
				template.find('#video_codec_selector .selected-codecs li').each(function() {
					formData.media.video.codecs.push($(this).data('codec'));
				});

				if(originalData.media && originalData.media.audio && originalData.media.audio.codecs) {
					originalData.media.audio.codecs = [];
				}
				if(originalData.media && originalData.media.video && originalData.media.video.codecs) {
					originalData.media.video.codecs = [];
				}
			}

			delete originalData.extra;
			delete formData.extra;

			var mergedData = $.extend(true, {}, originalData, formData);

			return mergedData;
		},

		devicesFormatData: function(data) {
			var defaults = {
					extra: {
						selectedCodecs: {
							audio: [],
							video: []
						},
						availableCodecs: {
							audio: [],
							video: []
						},
						listCodecs: {
							audio: {
								'G729': 'G729 - 8kbps (Requires License)',
                                'PCMU': 'G711u / PCMU - 64kbps (North America)',
                                'PCMA': 'G711a / PCMA - 64kbps (Elsewhere)',
                                'G722_16': 'G722 (HD) @ 16kHz',
                                'G722_32': 'G722.1 (HD) @ 32kHz',
                                'CELT_48': 'Siren (HD) @ 48kHz',
                                'CELT_64': 'Siren (HD) @ 64kHz'
							},
							video: {
								'H261': 'H261',
                                'H263': 'H263',
                                'H264': 'H264'
							}
						}
					},
					device_type: 'sip_device',
					enabled: true,
					mac_address: '',
					media: {
						audio: {
							codecs: ['PCMU', 'PCMA']
						},
						video: {
							codecs: []
						}
					},
					name: '',
					provision: data.dataProvisioner,
					suppress_unregister_notifications: false
				},
				formattedData = $.extend(true, {}, defaults, data.data);

			/* Audio Codecs*/
			/* extend doesn't replace the array so we need to do it manually */
			if(data.data.media && data.data.media.audio && data.data.media.audio.codecs) {
				formattedData.media.audio.codecs = data.data.media.audio.codecs;
			}

			_.each(formattedData.media.audio.codecs, function(codec) {
				formattedData.extra.selectedCodecs.audio.push({ codec: codec, description: defaults.extra.listCodecs.audio[codec] });
			});

			_.each(defaults.extra.listCodecs.audio, function(description, codec) {
				if(formattedData.media.audio.codecs.indexOf(codec) === -1) {
					formattedData.extra.availableCodecs.audio.push({ codec: codec, description: description });
				}
			});

			/* Video codecs */
			if(data.data.media && data.data.media.video && data.data.media.video.codecs) {
				formattedData.media.video.codecs = data.data.media.video.codecs;
			}

			_.each(formattedData.media.video.codecs, function(codec) {
				formattedData.extra.selectedCodecs.video.push({ codec: codec, description: defaults.extra.listCodecs.video[codec] });
			});

			_.each(defaults.extra.listCodecs.video, function(description, codec) {
				if(formattedData.media.video.codecs.indexOf(codec) === -1) {
					formattedData.extra.availableCodecs.video.push({ codec: codec, description: description });
				}
			});

			console.log(formattedData);

			return formattedData;
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


		devicesFormatProvisionerData: function(data) {
			var formattedData = {
				brands: []
			};

			_.each(data, function(brand) {
				var families = [];

				_.each(brand.families, function(family) {
					var models = [];

					_.each(family.models, function(model) {
						models.push(model.name);
					});

					families.push({ name: family.name, models: models });
				});

				formattedData.brands.push({
					name: brand.name,
					families: families
				});
			});

			return formattedData;
		},

		/* Utils */
		devicesGetProvisionerData: function(callback) {
			var self = this;

			monster.request({
				resource: 'voip.devices.getProvisionerData',
				data: {},
				success: function(data) {
					// we had to set the type to */* to get a response from the API. So we have to manually parse the JSON response
					var jsonResponse = JSON.parse(data.response || {});

					callback(jsonResponse.data);
				}
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

		devicesSaveDevice: function(deviceData, callback) {
			var self = this;

			if(deviceData.id) {
				self.devicesUpdateDevice(deviceData, callback);
			}
			else {
				self.devicesCreateDevice(deviceData, callback);
			}
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
				},
				error: function(data) {
					monster.ui.handleError(data);
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
					monster.ui.handleError(data);

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
