define(function(require){
	var $ = require('jquery'),
		_ = require('underscore'),
		monster = require('monster'),
		toastr = require('toastr');

	var app = {

		requests: {
			/* Classifiers */
			'voip.devices.listClassifiers': {
				url: 'accounts/{accountId}/phone_numbers/classifiers',
				verb: 'GET'
			},
			/* Numbers */
			'voip.devices.listNumbers': {
				url: 'accounts/{accountId}/phone_numbers',
				verb: 'GET'
			},
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
                	viewMode = 'true',//template.find('#device_view_selector').val(),
                    rows = template.find('.devices-rows .grid-row:not(.title)'),
                    emptySearch = template.find('.devices-rows .empty-search-row');

                _.each(rows, function(row) {
                    var row = $(row);

					if(row.data('assigned')+'' === viewMode) {
                    	row.data('search').toLowerCase().indexOf(searchString) < 0 ? row.hide() : row.show();
					}
					else {
						row.hide();
					}
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
					dataDevice = {
						id: $this.parents('.grid-row').data('id')
					};

				//self.devicesGetDevice(deviceId, function(dataDevice) {
				self.devicesGetEditData(dataDevice, function(dataDevice) {
					self.devicesRenderDevice(dataDevice, function(device) {
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
				data = {
					device_type: type
				};

			if(type === 'sip_device') {
				self.devicesGetProvisionerData(function(dataProvisioner) {
					var listModels = self.devicesFormatProvisionerData(dataProvisioner);

					self.devicesRenderProvisioner(listModels, function(dataProvisioner) {
						data.provision = dataProvisioner;

						self.devicesGetEditData(data, function(dataDevice) {
							self.devicesRenderDevice(dataDevice, callback);
						});
					});
				});
			}
			else {
				self.devicesGetEditData(data, function(dataDevice) {
					self.devicesRenderDevice(dataDevice, callback);
				});
			}
		},

		devicesRenderDevice: function(data, callback) {
			var self = this
				mode = data.id ? 'edit' : 'add',
				type = data.device_type,
				popupTitle = mode === 'edit' ? monster.template(self, '!' + self.i18n.active().devices[type].editTitle, { name: data.name }) : self.i18n.active().devices[type].addTitle;
			    templateDevice = $(monster.template(self, 'devices-'+type, data));

			if($.inArray(type, ['sip_device', 'cellphone', 'softphone', 'landline', 'fax']) > -1) {
				templateDevice.find('#audio_codec_selector .selected-codecs, #audio_codec_selector .available-codecs').sortable({
			  		connectWith: '.connectedSortable'
				}).disableSelection();

				templateDevice.find('#video_codec_selector .selected-codecs, #video_codec_selector .available-codecs').sortable({
			  		connectWith: '.connectedSortable'
				}).disableSelection();
			}

			monster.ui.tabs(templateDevice);
			templateDevice.find('.switch').bootstrapSwitch();

			templateDevice.find('.actions .save').on('click', function() {
				var dataToSave = self.devicesMergeData(data, templateDevice);

				self.devicesSaveDevice(dataToSave, function(data) {
					popup.dialog('close').remove();

					callback && callback(data);
				});
			});

			templateDevice.find('#delete_device').on('click', function() {
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
		devicesRenderProvisioner: function(listModels, callback) {
			var self = this,
				selectedBrand,
				selectedFamily,
				selectedModel,
				templateDevice = $(monster.template(self, 'devices-provisioner', listModels));

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
				hasCodecs = $.inArray(originalData.device_type, ['sip_device', 'landline', 'cellphone', 'fax', 'softphone']) > -1,
				hasCallForward = $.inArray(originalData.device_type, ['landline', 'cellphone']) > -1,
				formData = form2object('form_device');

			if('mac_address' in formData) {
				formData.mac_address = monster.util.formatMacAddress(formData.mac_address);
			}

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

			if(hasCallForward) {
				$.extend(true, formData.call_forward, {
					enabled: true,
					require_keypress: true,
					keep_caller_id: true
				});
			}

			if('call_restriction' in formData) {
				_.each(formData.call_restriction, function(restriction) {
					restriction.action = restriction.action === true ? 'inherit' : 'deny';
				});
			}

			delete originalData.extra;
			delete formData.extra;

			var mergedData = $.extend(true, {}, originalData, formData);

			return mergedData;
		},

		devicesFormatData: function(data) {
			var defaults = {
					extra: {
						hasE911Numbers: data.e911Numbers.length > 0,
						e911Numbers: data.e911Numbers,
						restrictions: data.listClassifiers,
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
                                'GSM': 'GSM',
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
					call_restriction: {},
					device_type: 'sip_device',
					enabled: true,
					media: {
						audio: {
							codecs: ['PCMU', 'PCMA']
						},
						video: {
							codecs: []
						}
					},
					suppress_unregister_notifications: false
				},
				typedDefaults = {
					landline: {

					}
				};

			_.each(data.listClassifiers, function(restriction, name) {
				defaults.extra.restrictions[name] = restriction;

				if('call_restriction' in data.device && name in data.device.call_restriction) {
					defaults.extra.restrictions[name].action = data.device.call_restriction[name].action;
				}
				else {
					defaults.extra.restrictions[name].action = 'inherit';
				}
			});

			var formattedData = $.extend(true, {}, defaults, data.device);

			/* Audio Codecs*/
			/* extend doesn't replace the array so we need to do it manually */
			if(data.device.media && data.device.media.audio && data.device.media.audio.codecs) {
				formattedData.media.audio.codecs = data.device.media.audio.codecs;
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
			if(data.device.media && data.device.media.video && data.device.media.video.codecs) {
				formattedData.media.video.codecs = data.device.media.video.codecs;
			}

			_.each(formattedData.media.video.codecs, function(codec) {
				formattedData.extra.selectedCodecs.video.push({ codec: codec, description: defaults.extra.listCodecs.video[codec] });
			});

			_.each(defaults.extra.listCodecs.video, function(description, codec) {
				if(formattedData.media.video.codecs.indexOf(codec) === -1) {
					formattedData.extra.availableCodecs.video.push({ codec: codec, description: description });
				}
			});

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
				var isAssigned = device.owner_id ? true : false;

				formattedData.countDevices++;

				formattedData.devices[device.id] = {
					id: device.id,
					isAssigned: isAssigned + '',
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

		devicesListClassifiers: function(callback) {
			var self = this;

			monster.request({
				resource: 'voip.devices.listClassifiers',
				data: {
					accountId: self.accountId
				},
				success: function(data) {
					callback(data.data);
				}
			});
		},

		devicesGetE911Numbers: function(callback) {
			var self = this;

			monster.request({
				resource: 'voip.devices.listNumbers',
				data: {
					accountId: self.accountId
				},
				success: function(data) {
					var e911Numbers = [];

					_.each(data.data.numbers, function(number, value) {
						if(number.features.indexOf('dash_e911') >= 0) {
							e911Numbers.push(value);
						}
					});

					callback(e911Numbers);
				}
			});
		},

		devicesGetEditData: function(dataDevice, callback) {
			var self = this;

			monster.parallel({
					listClassifiers: function(callback) {
						self.devicesListClassifiers(function(dataClassifiers) {
							callback(null, dataClassifiers);
						});
					},
					device: function(callback) {
						if(dataDevice.id) {
							self.devicesGetDevice(dataDevice.id, function(dataDevice) {
								callback(null, dataDevice);
							});
						}
						else {
							callback(null, dataDevice);
						}
					},
					e911Numbers: function(callback) {
						self.devicesGetE911Numbers(function(e911Numbers) {
							callback(null, e911Numbers);
						});
					}
				},
				function(error, results) {
			    	var formattedData = self.devicesFormatData(results);

					callback && callback(formattedData);
				}
			);
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
