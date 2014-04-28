define(function(require){
	var $ = require('jquery'),
		_ = require('underscore'),
		mask = require('mask'),
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
			'common.e911.getNumber': {
				url: 'accounts/{accountId}/phone_numbers/{phoneNumber}',
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
			'voip.devices.render': 'devicesRender',
			'voip.devices.renderAdd': 'devicesRenderAdd'
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
					var row = parent.find('.grid-row[data-id=' + _deviceId + ']');

					monster.ui.fade(row, {
						endColor: '#FCFCFC'
					});
				}

				if ( dataTemplate.devices.length == 0 ) {
					parent.find('.no-devices-row').css('display', 'block');
				} else {
					parent.find('.no-devices-row').css('display', 'none');
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
				var toggle = $(this),
					row = toggle.parents('.grid-row'),
					deviceId = row.data('id'),
					enable = toggle.bootstrapSwitch('status');

				self.devicesGetDevice(deviceId, function(dataDevice) {
					dataDevice.enabled = enable;

					self.devicesUpdateDevice(dataDevice, function(dataDevice) {
						row.find('.type').removeClass('unregistered registered disabled');

						var classStatus = 'disabled';

						if(dataDevice.enabled === true) {
							classStatus = 'unregistered';

							_.each(data.devices, function(device) {
								if(device.id === dataDevice.id) {
									if(device.registered === true) {
										classStatus = 'registered';
									}

									return false;
								}
							});
						}

						row.find('.type').addClass(classStatus);
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

				monster.pub('voip.devices.renderAdd', {
					type: type,
					callback: function(device) {
						self.devicesRender({ deviceId: device.id });
					}
				});
			});
		},

		devicesRenderAdd: function(args) {
			var self = this,
				type = args.type,
				callback = args.callback,
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
				templateDevice = $(monster.template(self, 'devices-'+type, data)),
				deviceForm = templateDevice.find('#form_device');

			if ( data.extra.hasE911Numbers ) {
				if(data.caller_id && data.caller_id.emergency && data.caller_id.emergency.number) {
					self.devicesGetE911NumberAddress(data.caller_id.emergency.number, function(address) {
						templateDevice
									.find('.number-address')
									.show()
									.find('p')
									.html(address);
					});
				}
			}

			monster.ui.validate(deviceForm, {
				rules: {
					'name': {
						required: true
					},
					'mac_address': {
						required: true,
						mac: true
					},
					'mobile.mdn': {
						number: true
					},
					'sip.username': {
						required: true
					},
					'sip.password': {
						required: true
					},
					'call_forward.number': {
						required: true
					}
				},
				ignore: '' // Do not ignore hidden fields
			});

			if($.inArray(type, ['sip_device', 'smartphone', 'mobile', 'softphone', 'fax', 'ata']) > -1) {
				templateDevice.find('#audio_codec_selector .selected-codecs, #audio_codec_selector .available-codecs').sortable({
					connectWith: '.connectedSortable'
				}).disableSelection();
			}

			if($.inArray(type, ['sip_device', 'smartphone', 'mobile', 'softphone']) > -1) {
				templateDevice.find('#video_codec_selector .selected-codecs, #video_codec_selector .available-codecs').sortable({
					connectWith: '.connectedSortable'
				}).disableSelection();
			}

			monster.ui.tabs(templateDevice);
			monster.ui.prettyCheck.create(templateDevice);
			templateDevice.find('[data-toggle="tooltip"]').tooltip();
			templateDevice.find('.switch').bootstrapSwitch();
			templateDevice.find('#mac_address').mask("hh:hh:hh:hh:hh:hh", {placeholder:" "});

			if(!(data.media.encryption.enforce_security)) {
				templateDevice.find('#rtp_method').hide();
			}

			templateDevice.find('#secure_rtp').on('ifChanged', function() {
				templateDevice.find('#rtp_method').toggle();
			});

			templateDevice.find('.actions .save').on('click', function() {
				if(monster.ui.valid(deviceForm)) {
					var dataToSave = self.devicesMergeData(data, templateDevice);

					self.devicesSaveDevice(dataToSave, function(data) {
						popup.dialog('close').remove();

						callback && callback(data);
					});
				} else {
					templateDevice.find('.tabs-selector[data-section="basic"]').click();
				}
			});

			templateDevice.find('#delete_device').on('click', function() {
				var deviceId = $(this).parents('.edit-device').data('id');

				monster.ui.confirm(self.i18n.active().devices.confirmDeleteDevice, function() {
					self.devicesDeleteDevice(deviceId, function(device) {
						self.devicesRender();
						popup.dialog('close').remove();

						toastr.success(monster.template(self, '!' + self.i18n.active().devices.deletedDevice, { deviceName: device.name }));
					});
				});
			});

			templateDevice.find('.actions .cancel-link').on('click', function() {
				popup.dialog('close').remove();
			});

			templateDevice.on('change', '.caller-id-select', function() {
				var selectedNumber = this.value;

				var divAddress = templateDevice.find('.number-address');

				divAddress.find('p').empty();

				if (selectedNumber !== '') {
					self.devicesGetE911NumberAddress(selectedNumber, function(address) {
						divAddress.find('p').html(address);
					});

					divAddress.slideDown();
				}
				else {
					divAddress.slideUp();
				}
			});

			templateDevice.find('.restriction-matcher-button').on('click', function(e) {
				e.preventDefault();
				var number = templateDevice.find('.restriction-matcher-input').val(),
					matched = false;
				console.log(number);
				templateDevice.find('.restriction-matcher-label').each(function() {
					var label = $(this),
						regex =  new RegExp(data.extra.restrictions[label.data('restriction')].regex);

					console.log(regex)
					if(regex.test(number)) {
						label.show();
						if(matched) {
							label.fadeTo(0, 0.5);
						} else {
							label.fadeTo(0, 1);
						}
						matched = true;
					} else {
						label.hide();
					}
				});
			})

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

			templateDevice.find('.device-box').dblclick(function() {
				var $this = $(this),
					dataProvisioner = {
					endpoint_brand: selectedBrand,
					endpoint_family: $this.data('family'),
					endpoint_model: $this.data('model')
				};

				popup.dialog('close').remove();

				callback && callback(dataProvisioner);
			});

			templateDevice.find('.missing-brand').on('click', function() {
				popup.dialog('close').remove();

				callback && callback();
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
				hasCodecs = $.inArray(originalData.device_type, ['sip_device', 'landline', 'fax', 'ata', 'softphone', 'smartphone', 'mobile']) > -1,
				hasSIP = $.inArray(originalData.device_type, ['fax', 'ata', 'softphone', 'smartphone', 'mobile']) > -1,
				hasCallForward = $.inArray(originalData.device_type, ['landline', 'cellphone', 'smartphone']) > -1,
				hasRTP = $.inArray(originalData.device_type, ['sip_device', 'mobile', 'softphone']) > -1,
				formData = form2object('form_device');

			if('mac_address' in formData) {
				formData.mac_address = monster.util.formatMacAddress(formData.mac_address);
			}

			if(hasCodecs) {
				formData.media = $.extend(true, {
					audio: {
						codecs: []
					},
					video: {
						codecs: []
					}
				}, formData.media);

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
				formData.call_forward = $.extend(true, {
					enabled: true,
					require_keypress: true,
					keep_caller_id: true
				}, formData.call_forward);
			}

			if(hasSIP) {
				formData.sip = $.extend(true, {
					expire_seconds: 360,
					invite_format: 'username',
					method: 'password'
				}, formData.sip);
			}

			if('call_restriction' in formData) {
				_.each(formData.call_restriction, function(restriction) {
					restriction.action = restriction.action === true ? 'inherit' : 'deny';
				});
			}

			var mergedData = $.extend(true, {}, originalData, formData);

			/* The extend doesn't override an array if the new array is empty, so we need to run this snippet after the merge */
			if(hasRTP) {
				mergedData.media.encryption.methods = [];

				if(mergedData.media.encryption.enforce_security) {
					mergedData.media.encryption.methods.push(formData.extra.rtpMethod);
				}
			}

			/* Migration clean-up */
			delete mergedData.media.secure_rtp;
			delete mergedData.extra;

			return mergedData;
		},

		devicesFormatData: function(data) {
			var self = this,
				defaults = {
					extra: {
						hasE911Numbers: data.e911Numbers.length > 0,
						e911Numbers: data.e911Numbers,
						restrictions: data.listClassifiers,
						rtpMethod: data.device.media && data.device.media.encryption && data.device.media.encryption.enforce_security ? data.device.media.encryption.methods[0] : '',
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
								'PCMU': 'G711u / PCMU - 64kbps (NA)',
								'PCMA': 'G711a / PCMA - 64kbps (Elsewhere)',
								'GSM': 'GSM',
								'G722_16': 'G722 (HD) @ 16kHz',
								'G722_32': 'G722.1 (HD) @ 32kHz',
								'CELT_48': 'Siren (HD) @ 48kHz',
								'CELT_64': 'Siren (HD) @ 64kHz',
								'OPUS': 'OPUS',
								'Speex': 'Speex'
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
						encryption: {
							enforce_security: false,
						},
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
					sip_device: {
						sip: {
							password: monster.util.randomString(12),
							realm: monster.apps['auth'].currentAccount.realm,
							username: 'user_' + monster.util.randomString(10)
						}
					},
					landline: {
						call_forward: {
							require_keypress: true,
							keep_caller_id: true
						},
						contact_list: {
							exclude: true
						}
					},
					cellphone: {
						call_forward: {
							require_keypress: true,
							keep_caller_id: true
						},
						contact_list: {
							exclude: true
						},
					},
					ata: {
						sip: {
							password: monster.util.randomString(12),
							realm: monster.apps['auth'].currentAccount.realm,
							username: 'user_' + monster.util.randomString(10)
						}
					},
					fax: {
						media: {
							fax_option: 'auto'
						},
						sip: {
							password: monster.util.randomString(12),
							realm: monster.apps['auth'].currentAccount.realm,
							username: 'user_' + monster.util.randomString(10)
						}
					},
					softphone: {
						sip: {
							password: monster.util.randomString(12),
							realm: monster.apps['auth'].currentAccount.realm,
							username: 'user_' + monster.util.randomString(10)
						}
					},
					mobile: {
						sip: {
							password: monster.util.randomString(12),
							realm: monster.apps['auth'].currentAccount.realm,
							username: 'user_' + monster.util.randomString(10)
						}
					},
					smartphone: {
						call_forward: {
							require_keypress: true,
							keep_caller_id: true
						},
						contact_list: {
							exclude: true
						},
						sip: {
							password: monster.util.randomString(12),
							realm: monster.apps['auth'].currentAccount.realm,
							username: 'user_' + monster.util.randomString(10)
						}
					}
				};

			_.each(data.listClassifiers, function(restriction, name) {
				defaults.extra.restrictions[name] = restriction;
				if(name in self.i18n.active().devices.classifiers) {
					defaults.extra.restrictions[name].friendly_name = self.i18n.active().devices.classifiers[name].name;

					if('help' in self.i18n.active().devices.classifiers[name]) {
						defaults.extra.restrictions[name].help = self.i18n.active().devices.classifiers[name].help;
					}
				}

				if('call_restriction' in data.device && name in data.device.call_restriction) {
					defaults.extra.restrictions[name].action = data.device.call_restriction[name].action;

				}
				else {
					defaults.extra.restrictions[name].action = 'inherit';
				}
			});

			var formattedData = $.extend(true, {}, typedDefaults[data.device.device_type], defaults, data.device);

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
				unassignedString = self.i18n.active().devices.unassignedDevice,
				mapIconClass = {
					cellphone: 'icon-phone',
					smartphone: 'icon-telicon-mobile-phone',
					landline: 'icon-telicon-home-phone',
					mobile: 'icon-telicon-sprint-phone',
					softphone: 'icon-telicon-soft-phone',
					sip_device: 'icon-telicon-voip-phone',
					fax: 'icon-telicon-fax',
					ata: 'icon-telicon-fax'
				};

			_.each(data.users, function(user) {
				mapUsers[user.id] = user;
			});

			_.each(data.devices, function(device) {
				var isAssigned = device.owner_id ? true : false;

				formattedData.countDevices++;

				formattedData.devices[device.id] = {
					id: device.id,
					isAssigned: isAssigned + '',
					friendlyIconClass: mapIconClass[device.device_type],
					macAddress: device.mac_address,
					name: device.name,
					userName: device.owner_id && device.owner_id in mapUsers ? mapUsers[device.owner_id].first_name + ' ' + mapUsers[device.owner_id].last_name : unassignedString,
					sortableUserName: device.owner_id && device.owner_id in mapUsers ? mapUsers[device.owner_id].last_name + ' ' + mapUsers[device.owner_id].first_name : unassignedString,
					enabled: device.enabled,
					type: device.device_type,
					friendlyType: self.i18n.active().devices.types[device.device_type],
					registered: false,
					classStatus: device.enabled ? 'unregistered' : 'disabled' /* Display a device in black if it's disabled, otherwise, until we know whether it's registered or not, we set the color to red */
				}
			});

			_.each(data.status, function(status) {
				if(status.registered === true && status.device_id in formattedData.devices) {
					var device = formattedData.devices[status.device_id];

					device.registered = true;

					/* Now that we know if it's registered, we set the color to green */
					if(device.enabled) {
						device.classStatus = 'registered';
					}
				}
			});

			var arrayToSort = [];

			_.each(formattedData.devices, function(device) {
				arrayToSort.push(device);
			});

			arrayToSort.sort(function(a, b) {
				/* If owner is the same, order by device name */
				if(a.userName === b.userName) {
					var aName = a.name.toLowerCase(),
						bName = b.name.toLowerCase();

					return (aName > bName) ? 1 : (aName < bName) ? -1 : 0;
				}
				else {
					/* Otherwise, push the unassigned devices to the bottom of the list, and show the assigned devices ordered by user name */
					if(a.userName === unassignedString) {
						return 1;
					}
					else if(b.userName === unassignedString) {
						return -1;
					}
					else {
						var aSortName = a.sortableUserName.toLowerCase(),
							bSortName = b.sortableUserName.toLowerCase();

						return (aSortName > bSortName) ? 1 : (aSortName < bSortName) ? -1 : 0;
					}
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
		},

		devicesGetE911NumberAddress: function(number, callback) {
			var self = this;

			monster.request({
				resource: 'common.e911.getNumber',
				data: {
					accountId: self.accountId,
					phoneNumber: encodeURIComponent(number)
				},
				success: function(_data, status) {
					var street_address = _data.data.dash_e911.street_address,
						locality = _data.data.dash_e911.locality,
						postal_code = _data.data.dash_e911.postal_code,
						region = _data.data.dash_e911.region;

					if ( typeof _data.data.dash_e911.extended_address !== 'undefined' ) {
						callback(street_address + ', ' + _data.data.dash_e911.extended_address + '<br>' + locality + ', ' + region + ' ' + postal_code);
					} else {
						callback(street_address + ', ' + '<br>' + locality + ', ' + region + ' ' + postal_code);
					}
				}
			});
		}
	};

	return app;
});
