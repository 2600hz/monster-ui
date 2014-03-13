define(function(require){
	var $ = require('jquery'),
		_ = require('underscore'),
		mask = require('mask'),
		monster = require('monster');

	var apiRoot = monster.config.api.provisioner;

	var app = {

		name: 'provisioner',

		i18n: [ 'en-US', 'fr-FR' ],

		requests: {
			/* Accounts APIs */
			// 'provisioner.addAccount': {
			// 	'apiRoot': apiRoot,
			// 	'url': 'api/accounts',
			// 	'verb': 'PUT'
			// },
			'provisioner.getAccount': {
				'apiRoot': apiRoot,
				'url': 'api/accounts/{account_id}',
				'verb': 'GET'
			},
			'provisioner.getAccountsByProvider': {
				'apiRoot': apiRoot,
				'url': 'api/accounts/provider/{provider_id}',
				'verb': "GET",
				'generateError': false
			},
			// 'provisioner.updateAccount': {
			// 	'apiRoot': apiRoot,
			// 	'url': 'api/accounts/{account_id}',
			// 	'verb': 'POST'
			// },
			// 'provisioner.deleteAccount': {
			// 	'apiRoot': apiRoot,
			// 	'url': 'api/accounts/{account_id}',
			// 	'verb': 'DELETE'
			// },
			/* Devices APIs */
			'provisioner.addDevice': {
				'apiRoot': apiRoot,
				'url': 'api/devices/{account_id}/{mac_address}',
				'verb': 'PUT'
			},
			'provisioner.getDevice': {
				'apiRoot': apiRoot,
				'url': 'api/devices/{account_id}/{mac_address}',
				'verb': "GET"
			},
			'provisioner.getDevicesByAccount': {
				'apiRoot': apiRoot,
				'url': 'api/devices/{account_id}',
				'verb': "GET"
			},
			'provisioner.updateDevice': {
				'apiRoot': apiRoot,
				'url': 'api/devices/{account_id}/{mac_address}',
				'verb': 'POST'
			},
			'provisioner.deleteDevice': {
				'apiRoot': apiRoot,
				'url': 'api/devices/{account_id}/{mac_address}',
				'verb': 'DELETE'
			},
			/* Files API */
			'provisioner.generateFile': {
				'apiRoot': apiRoot,
				'url': 'api/files/generate',
				'verb': 'POST'
			},
			/* Providers APIs */
			// 'provisioner.addProvider': {
			// 	'apiRoot': apiRoot,
			// 	'url': 'api/providers',
			// 	'verb': 'PUT'
			// },
			// 'provisioner.getProvider': {
			// 	'apiRoot': apiRoot,
			// 	'url': 'api/providers/{provider_id}',
			// 	'verb': 'GET'
			// },
			// 'provisioner.getProviders': {
			// 	'apiRoot': apiRoot,
			// 	'url': 'api/providers',
			// 	'verb': 'GET'
			// },
			// 'provisioner.updateProvider': {
			// 	'apiRoot': apiRoot,
			// 	'url': 'api/providers/{provider_id}',
			// 	'verb': 'POST'
			// },
			// 'provisioner.deleteProvider': {
			// 	'apiRoot': apiRoot,
			// 	'url': 'api/providers/{provider_id}',
			// 	'verb': 'DELETE'
			// },
			/* UI APIs */
			'provisioner.getSettingsByModel': {
				'apiRoot': apiRoot,
				'url': 'api/ui/{brand}/{model}',
				'verb': "GET"
			},
			// 'provisioner.getSettingsByDevice': {
			// 	'apiRoot': apiRoot,
			// 	'url': 'api/ui/{account_id}/{mac_address}',
			// 	'verb': ''
			// },
			/* Phones API */
			'provisioner.getBrands': {
				'apiRoot': apiRoot,
				'url': 'api/phones',
				'verb': 'GET'
			}
		},

		subscribe: {
		},

		load: function(callback){
			var self = this;

			self.initApp(function() {
				callback && callback(self);
			});
		},

		initApp: function(callback) {
			var self = this;

			monster.pub('auth.initApp', {
				app: self,
				callback: callback
			});
		},

		initialized: false,

		render: function(parent){
			var self = this,
				_data,
				appTemplate,
				dataToTemplate;

			parent = parent || $('#ws-content');

			self.getAccountsByProvider(function(data) {
				dataToTemplate = data;

				self.getDevicesByAccount(dataToTemplate.data[0].id, function(data) {
					for ( var device in data ) {
						data[device].mac_address_formatted = data[device].mac_address.match(new RegExp('.{1,2}', 'g')).join(':');
					}

					dataToTemplate.data[0].devices = data;
					appTemplate = $(monster.template(self, 'app', dataToTemplate));
					appTemplate.find('.account-section[data-id="' + dataToTemplate.data[0].id + '"]').addClass('active');

					parent
						.empty()
						.append(appTemplate);



					self.bindEvents(parent);
					self.initialized = true;
				});
			});
		},

		bindEvents: function(parent) {
			var self = this,
				showLinks = function() {
					if ( parent.find('.device-box.selected').size() > 0 ) {
						parent.find('#trigger_links').show();
					} else {
						parent.find('#trigger_links').hide();
					}
				};

			/* Click on header to expand device wrapper */
			parent.find('.expandable').on('click', function() {
				var section = $(this).parents('.account-section');

				if ( section.hasClass('active') ) {
					section.removeClass('active');
				} else {
					if ( section.find('.devices-wrapper').find('.device-box').hasClass('no-data') ) {
						self.getDevicesByAccount(section.data('id'), function(data) {
							for ( var device in data ) {
								data[device].mac_address_formatted = data[device].mac_address.match(new RegExp('.{1,2}', 'g')).join(':');
							}

							section.find('.devices-wrapper')
								.empty()
								.append($(monster.template(self, 'devicesWrapper', { devices: data })));

							section.addClass('active');
						});
					} else {
						section.addClass('active');
					}
				}
			});

			/* Click on header's checkbox to select/deselect  */
			// parent.find('.account-header').on('click', 'input[type="checkbox"]', function(event) {
			// 	var checkboxes = $(this).parents('.account-section').first().find('.device-box input[type="checkbox"]'),
			// 		isChecked = $(this).prop('checked');

			// 	checkboxes.prop('checked', isChecked);

			// 	if ( isChecked ) {
			// 		checkboxes.parent().addClass('selected');
			// 	} else {
			// 		checkboxes.parent().removeClass('selected');
			// 	}

			// 	showLinks();
			// });

			/* Add class selected when you click on a device box, check/uncheck  the account checkbox if all/no devices are checked */
			// parent.on('click', '.device-box:not(.disabled)', function(event) {
			// 	var currentBox = $(this);

			// 	if(!currentBox.hasClass('no-data')) {
			// 		var section = currentBox.parents('.account-section').first(),
			// 			accountCheckbox = section.find('.account-header input[type="checkbox"]');

			// 		currentBox.toggleClass('selected');

			// 		if(!$(event.target).is('input:checkbox')) {
			// 			var currentCheckbox = currentBox.find('input[type="checkbox"]'),
			// 				checkboxValue = currentCheckbox.prop('checked');

			// 			currentCheckbox.prop('checked', !checkboxValue);
			// 		}

			// 		/* Check account checkbox if all the devices are checked */
			// 		if(section.find('.devices-wrapper input[type="checkbox"]:checked').size() === section.find('.devices-wrapper input[type="checkbox"]').size()) {
			// 			accountCheckbox.prop('checked', true);
			// 		}
			// 		else {
			// 			accountCheckbox.prop('checked', false);
			// 		}
			// 	}

			// 	showLinks();
			// });

			if (self.initialized === false) {
				parent.on('click', '.device-box:not(.no-data)', function() {
					if ( $(this).hasClass('selected') ) {
						$(this).removeClass('selected');
						$(this).find('input')[0].checked = false;
					} else {
						if( parent.find('.device-box.selected input')[0] ) {
							parent.find('.device-box.selected input')[0].checked = false;
						}

						parent.find('.account-section .device-box.selected').removeClass('selected');
						$(this).addClass('selected');
						$(this).find('input')[0].checked = true;
					}

					showLinks();
				});

				parent.on('click', '#delete_devices', function() {
					var accountId = parent.find('.device-box.selected').parent().parent().data('id'),
						macAddress = parent.find('.device-box.selected').data('mac-address');

					self.deleteDevice(accountId, macAddress, function() {
						var wrapper = parent.find('.device-box.selected').parent();

						parent.find('.device-box.selected').remove();

						if ( $(wrapper).is(':empty') ) {
							$(wrapper)
								.empty()
								.append($(monster.template(self, 'noDevice')));
						}
					});
				});
			}

			parent.find('#provision_devices').on('click', function() {
				var accountId = parent.find('.device-box.selected').parents('.account-section.active').data('id'),
					macAddress = parent.find('.account-section.active').find('.device-box.selected').data('mac-address');

				self.getDevice(accountId, macAddress, function(data) {
					self.renderDeviceSettings(parent, accountId, macAddress, data);
				});
			});

			parent.find('.account-section .add-device').on('click', function() {
				var accountId = $(this).parents('.account-section').data('id');

				self.renderDeviceSettings(parent, accountId, null);
			});
		},

		renderDeviceSettings: function(parent, accountId, macAddress, deviceData) {
			var self = this;

			deviceData = deviceData || { brand: 'yealink', model: 't22' };

			self.getSettingsByModel(deviceData.brand, deviceData.model, function(data) {
				self.getBrands(function(deviceFamily) {
					var index,
						field,
						brand,
						model,
						option,
						family,
						section,
						dataField,
						dataTemplate,
						pathArray = [],
						brandList = [],
						modelList = [],
						parametersTemplate,
						formatData = function(data) {
							var i,
								key,
								_data,
								iterations;

							for ( key in data ) {
								if ( typeof data[key].iterate === 'undefined' && typeof data[key].data !== 'undefined' ) {
									formatData(data[key].data);
								} else if ( data[key].iterate === 0 ) {
									delete data[key];
								} else if ( data[key].iterate == 1 ) {
									delete data[key].iterate;
									formatData(data[key].data);
								} else if ( data[key].iterate > 1 ) { 
									i = 0;
									_data = data[key].data;
									iterations = data[key].iterate;
									data[key].data = [];

									formatData(_data);

									for ( ; i < iterations; i++ ) {
										data[key].data.push(_data);
									}
								}
							}

							return data;
						};

					for ( brand in deviceFamily ) {
						brandList.push(brand);

						if ( brand == deviceData.brand ) {
							for ( family in deviceFamily[brand].families ) {
								for ( model in deviceFamily[brand].families[family].models ) {
									deviceFamily[brand].families[family].models[model].family = family;
									modelList.push(deviceFamily[brand].families[family].models[model]);
								}
							}
						}
					}

					dataTemplate = {
						model_list: modelList,
						brand_list: brandList,
						name: deviceData.name,
						model: deviceData.model,
						brand: deviceData.brand,
						mac_address: macAddress,
						settings: formatData(data)
					};

					parametersTemplate = $(monster.template(self, 'deviceSettings', dataTemplate));

					for ( section in data ) {
						if ( data[section].iterate ) {
							for ( index in data[section].data ) {
								pathArray.push(section + '[' + index + ']');
								for ( option in data[section].data[index]) {
									pathArray.push(option);
									for ( field in data[section].data[index][option].data) {
										pathArray.push(field);
										dataField = data[section].data[index][option].data[field];
										dataField.path = pathArray.join('.');
										dataField.value = ( dataField.func ) ? self[dataField.func](dataField.args) : dataField. value;

										parametersTemplate
											.find('.container .content[data-key="' + section + '"] .sub-content[data-key="' + index + '"] .' + option)
											.append($(monster.template(self, 'field' + dataField.type.charAt(0).toUpperCase() + dataField.type.slice(1), dataField)));

										pathArray.splice(pathArray.length - 1, 1);
									}
									pathArray.splice(pathArray.length - 1, 1);
								}
								pathArray.splice(pathArray.length - 1, 1);
							}
						} else {
							pathArray.push(section);
							for ( option in data[section].data) {
								pathArray.push(option);
								for ( field in data[section].data[option].data) {
									pathArray.push(field);
									dataField = data[section].data[option].data[field];
									dataField.path = pathArray.join('.');
									dataField.value = ( dataField.func ) ? self[dataField.func](dataField.args) : dataField. value;

									parametersTemplate
										.find('.container .content[data-key="' + section + '"] .' + option)
										.append($(monster.template(self, 'field' + dataField.type.charAt(0).toUpperCase() + dataField.type.slice(1), dataField)));

									pathArray.splice(pathArray.length -1, 1);
								}
								pathArray.splice(pathArray.length - 1, 1);
							}
							pathArray.splice(pathArray.length - 1, 1);
						}
					}

					for ( section in deviceData.settings ) {
						if ( Array.isArray(deviceData.settings[section]) ) {
							for ( index in deviceData.settings[section] ) {
								pathArray.push(section + '[' + index + ']');
								for ( option in deviceData.settings[section][index]) {
									pathArray.push(option);
									for ( field in deviceData.settings[section][index][option]) {
										pathArray.push(field);

										parametersTemplate.find('*[name="' + pathArray.join('.') + '"]').val(deviceData.settings[section][index][option][field]);
										parametersTemplate.find('*[name="' + pathArray.join('.') + '"]').attr('value', deviceData.settings[section][index][option][field]);

										pathArray.splice(pathArray.length - 1, 1);
									}
									pathArray.splice(pathArray.length - 1, 1);
								}
								pathArray.splice(pathArray.length - 1, 1);
							}
						} else {
							pathArray.push(section);
							for ( option in deviceData.settings[section]) {
								pathArray.push(option);
								for ( field in deviceData.settings[section][option]) {
									pathArray.push(field);

									parametersTemplate.find('*[name="' + pathArray.join('.') + '"]').val(deviceData.settings[section][option][field]);
									parametersTemplate.find('*[name="' + pathArray.join('.') + '"]').attr('value', deviceData.settings[section][option][field]);

									pathArray.splice(pathArray.length -1, 1);
								}
								pathArray.splice(pathArray.length - 1, 1);
							}
							pathArray.splice(pathArray.length - 1, 1);
						}
					}

					parametersTemplate.find('.container .content [data-key="0"]').addClass('active');
					parametersTemplate.find('.nav-bar > .switch-link:first-child').addClass('active');
					parametersTemplate.find('.nav-bar .switch-sublink:first-child').addClass('active');
					parametersTemplate.find('.settings-content .container > .content:first-child').addClass('active');

					parametersTemplate.find('#mac').mask('hh:hh:hh:hh:hh:hh', {placeholder:' '});
					parametersTemplate.find('.switch-sublink').each(function() {
						$(this).text(parseInt($(this).text(), 10) + 1);
					});

					parent
						.empty()
						.append(parametersTemplate);

					self.bindDeviceSettingsEvents(parent, accountId, macAddress, deviceData);
				});
			});
		},

		bindDeviceSettingsEvents: function(parent, accountId, macAddress, deviceData) {
			var self = this;

			parent.on('click', '.switch-link', function() {
				parent.find('.switch-link.active').removeClass('active');
				$(this).addClass('active');
				parent.find('.settings-content .content.active').removeClass('active');
				parent.find('.settings-content .content[data-key="' + $(this).data('key') + '"]').addClass('active');
			});

			parent.on('click', '.switch-sublink', function() {
				parent.find('.content[data-key="' + $(this).parent().parent().data('key') + '"] .switch-sublink.active').removeClass('active');
				$(this).addClass('active');
				parent.find('.content[data-key="' + $(this).parent().parent().data('key') + '"] .sub-content.active').removeClass('active');
				parent.find('.content[data-key="' + $(this).parent().parent().data('key') + '"] .sub-content[data-key="' + $(this).data('key') + '"]').addClass('active');
			});

			parent.find('.settings-header').on('change', 'select[name="manufacturer"]', function() {
				self.getModelsByBrand($(this).find('option:selected').val(), function(modelsList) {
					var modelSelect = parent.find('.settings-header').find('select[name="model"]');

					modelSelect
						.empty()
						.append($(monster.template(self, 'modelOption', modelsList)));
				});
			});

			parent.find('.settings-header').on('change', 'select[name="model"]', function() {
				if ( $(this).prop('value') !== '' ) {
					deviceData = {
						brand: parent.find('select[name="manufacturer"]').find('option:selected').val(),
						family: $(this).find('option:selected').data('family'),
						model: $(this).val(),
						name: parent.find('#name').val(),
						settings: deviceData.settings
					};

					self.renderDeviceSettings(parent, accountId, parent.find('#mac').val().replace(/:/g, ''), deviceData);
				}
			});

			parent.find('.cancel').on('click', function() {
				self.render(parent);
			});

			parent.find('.save').on('click', function() {
				var index,
					field,
					option,
					section,
					dataForm = form2object('form2object'),
					deviceExsit = deviceData.mac_address ? true : false,
					newMacAddress = parent.find('#mac').val().replace(/:/g, '');

				for ( section in dataForm ) {
					if ( Array.isArray(dataForm[section]) ) {
						for ( index in dataForm[section] ) {
							for ( option in dataForm[section][index] ) {
								for ( field in dataForm[section][index][option] ) {
									if ( dataForm[section][index][option][field] === '' ) {
										dataForm[section][index] = null;
									}

									break;
								}

								break;
							}
						}
					}
				}

				deviceData = {
						brand: parent.find('select[name="model"] option:selected').data('brand'),
						family: parent.find('select[name="model"] option:selected').data('family'),
						model: parent.find('select[name="model"] option:selected').attr('value'),
						name: parent.find('#name').val(),
						settings: dataForm
					};

				if ( deviceExsit ) {
					self.updateDevice(accountId, macAddress, deviceData, function() {
						self.render(parent);
					});
				} else {
					self.addDevice(accountId, newMacAddress, deviceData, function() {
						self.render(parent);
					});
				}
			});
		},










		/* Accounts Requests */
		getAccount: function(accountId, callback) {
			var self = this;

			monster.request({
				resource: 'provisioner.getAccount',
				data: {
					account_id: accountId
				},
				success: function(data, status) {
					callback(data);
				}
			})
		},
		getAccountsByProvider: function(callback) {
			var self = this;

			monster.request({
				resource: 'provisioner.getAccountsByProvider',
				data: {
					provider_id: self.accountId
				},
				success: function(data, status) {
					callback(data);
				},
				error: function(data, status) {
					if ( data.error.code == 401 ) {
						self.getAccount(self.accountId, function(data) {
							var _data = data;

							_data.id = self.accountId;
							data = { data: [_data] };

							callback(data);
						});
					} else {
						monster.ui.alert('error', 'Francis\' Server is Down!');
					}
				}
			});
		},
		/* Devices Requests */
		addDevice: function(accountId, macAddress, data, callback) {
			var self = this;

			monster.request({
				resource: 'provisioner.addDevice',
				data: {
					account_id: accountId,
					mac_address: macAddress,
					data: data
				},
				success: function(data, status) {
					self.generateFile(macAddress, function() {
						callback();
					});
				}
			});
		},
		getDevice: function(accountId, macAddress, callback) {
			var self = this;

			monster.request({
				resource: 'provisioner.getDevice',
				data: {
					account_id: accountId,
					mac_address: macAddress
				},
				success: function(data, status) {
					callback(data.data);
				}
			});
		},
		getDevicesByAccount: function(accountId, callback) {
			var self = this;

			monster.request({
				resource: 'provisioner.getDevicesByAccount',
				data: {
					account_id: accountId
				},
				success: function(data, status) {
					callback(data.data);
				}
			});
		},
		updateDevice: function(accountId, macAddress, data, callback) {
			var self = this;

			monster.request({
				resource: 'provisioner.updateDevice',
				data: {
					account_id: accountId,
					mac_address: macAddress,
					data: data
				},
				success: function(data, status) {
					self.generateFile(macAddress, function() {
						callback();
					});
				}
			});
		},
		deleteDevice: function(accountId, macAddress, callback) {
			var self = this;

			monster.request({
				resource: 'provisioner.deleteDevice',
				data: {
					account_id: accountId,
					mac_address: macAddress
				},
				success: function(data, status) {
					callback();
				}
			});
		},
		/* Files Requests */
		generateFile: function(macAddress, callback) {
			var self = this,
				data = {
					mac_address: macAddress,
					settings: {}
				};

			monster.request({
				resource: 'provisioner.generateFile',
				data: {
					data: data
				},
				success: function(data, status) {
					callback();
				}
			});
		},
		/* Providers Requests */
		/* UI Requests */
		getSettingsByModel: function(brand, model, callback) {
			var self = this;

			monster.request({
				resource: 'provisioner.getSettingsByModel',
				data: {
					brand: brand,
					model: model
				},
				success: function(data, status) {
					callback(data.data);
				}
			});
		},
		/* Phones Requests */
		getBrands: function(callback) {
			var self = this;

			monster.request({
				resource: 'provisioner.getBrands',
				data: {
				},
				success: function(data, status) {
					callback(data.data);
				}
			});
		},
		getModelsByBrand: function(brand, callback) {
			var self = this;

			self.getBrands(function(data) {
				var key,
					model,
					family,
					modelsList = { data: [] };

				for ( key in data ) {
					if ( brand == key) {
						for ( family in data[key].families ) {
							for ( model in data[key].families[family].models ) {
								data[key].families[family].models[model].family = family;
								modelsList.data.push(data[key].families[family].models[model]);
							}
						}
					}
				}

				callback(modelsList);
			});
		},

		generateRandomLocalPort: function(args) {
			return _.random(args[0], args[1]);
		}
	};

	return app;
});
