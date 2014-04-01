define(function(require){
	var $ = require('jquery'),
		_ = require('underscore'),
		mask = require('mask'),
		monster = require('monster');

	var app = {

		name: 'provisioner',

		i18n: [ 'en-US', 'fr-FR' ],

		requests: {
			/* Accounts APIs */
			'provisioner.getAccount': {
				'apiRoot': monster.config.api.provisioner,
				'url': 'api/accounts/{account_id}',
				'verb': 'GET'
			},
			'provisioner.getAccountsByProvider': {
				'apiRoot': monster.config.api.provisioner,
				'url': 'api/accounts/provider/{provider_id}',
				'verb': "GET"
			},
			'provisioner.updateAccount': {
				'apiRoot': monster.config.api.provisioner,
				'url': 'api/accounts/{account_id}',
				'verb': 'POST'
			},
			/* Devices APIs */
			'provisioner.addDevice': {
				'apiRoot': monster.config.api.provisioner,
				'url': 'api/devices/{account_id}/{mac_address}',
				'verb': 'PUT'
			},
			'provisioner.getDevice': {
				'apiRoot': monster.config.api.provisioner,
				'url': 'api/devices/{account_id}/{mac_address}',
				'verb': "GET"
			},
			'provisioner.getDevicesByAccount': {
				'apiRoot': monster.config.api.provisioner,
				'url': 'api/devices/{account_id}',
				'verb': "GET"
			},
			'provisioner.updateDevice': {
				'apiRoot': monster.config.api.provisioner,
				'url': 'api/devices/{account_id}/{mac_address}',
				'verb': 'POST'
			},
			'provisioner.deleteDevice': {
				'apiRoot': monster.config.api.provisioner,
				'url': 'api/devices/{account_id}/{mac_address}',
				'verb': 'DELETE'
			},
			/* Files API */
			'provisioner.generateFile': {
				'apiRoot': monster.config.api.provisioner,
				'url': 'api/files/generate',
				'verb': 'POST'
			},
			/* Providers APIs */
			'provisioner.getProvider': {
				'apiRoot': monster.config.api.provisioner,
				'url': 'api/providers/{provider_id}',
				'verb': 'GET'
			},
			'provisioner.updateProvider': {
				'apiRoot': monster.config.api.provisioner,
				'url': 'api/providers/{provider_id}',
				'verb': 'POST'
			},
			/* UI APIs */
			'provisioner.getSettingsByModel': {
				'apiRoot': monster.config.api.provisioner,
				'url': 'api/ui/{brand}/{model}',
				'verb': "GET"
			},
			'provisioner.getGlobalSettings': {
				'apiRoot': monster.config.api.provisioner,
				'url': 'api/ui/global',
				'verb': 'GET'
			},
			/* Phones APIs */
			'provisioner.getPhones': {
				'apiRoot': monster.config.api.provisioner,
				'url': 'api/phones',
				'verb': 'GET'
			},
			/* Apps Link APIs */
			'provisioner.getProviderIdIfNotMasqueraded': {
				'url': 'apps_link/authorize',
				'verb': 'GET'
			},
			'provisioner.getProviderIdIfMasqueraded': {
				'url': 'accounts/{account_id}/apps_link/authorize',
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
				appTemplate,
				initTemplate = function(data, dataTemplate, dataId) {
					for ( var device in data ) {
						data[device].mac_address_formatted = data[device].mac_address.match(new RegExp('.{2}', 'g')).join(':');
					}

					if ( !dataTemplate.data ) {
						var temp = [dataTemplate];

						temp[0].id = self.accountId;
						dataTemplate = {};
						dataTemplate.data = temp;
					}

					for ( var account in dataTemplate.data ) {
						if ( dataTemplate.data[account].id === dataId ) {
							dataTemplate.data[account].devices = data;
						}
					}

					dataTemplate.isReseller = monster.apps.auth.isReseller;
					appTemplate = $(monster.template(self, 'app', dataTemplate));
					appTemplate.find('.account-section[data-id="' + dataId + '"]').addClass('active');

					parent
						.empty()
						.append(appTemplate);

					self.bindEvents(parent);
					self.initialized = true;
				};

			parent = parent || $('#ws-content');

			if ( monster.apps.auth.isReseller ) {
				self.requestGetAccountsByProvider(function(dataTemplate) {
					self.requestGetDevicesByAccount(dataTemplate.data[0].id, function(data) {
						initTemplate(data, dataTemplate, dataTemplate.data[0].id);
					});
				});
			} else {
				self.requestGetAccount(self.accountId, function(dataTemplate) {
					self.requestGetDevicesByAccount(self.accountId, function(data) {
						initTemplate(data, dataTemplate, self.accountId);
					});
				});
			}
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

			parent.find('.expandable').on('click', function() {
				var section = $(this).parents('.account-section');

				if ( section.hasClass('active') ) {
					section.removeClass('active');
				} else {
					if ( section.find('.devices-wrapper').find('.device-box').hasClass('no-data') ) {
						self.requestGetDevicesByAccount(section.data('id'), function(data) {
							for ( var device in data ) {
								data[device].mac_address_formatted = data[device].mac_address.match(new RegExp('.{2}', 'g')).join(':');
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

			if ( self.initialized === false ) {
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

					if ( macAddress ) {
						self.requestDeleteDevice(accountId, macAddress, function() {
							var wrapper = parent.find('.device-box.selected').parent();

							parent.find('.device-box.selected').remove();

							if ( $(wrapper).is(':empty') ) {
								$(wrapper)
									.empty()
									.append($(monster.template(self, 'noDevice')));
							}
						});
					}
				});
			}

			parent.find('#provision_devices').on('click', function() {
				var accountId = parent.find('.device-box.selected').parents('.account-section.active').data('id'),
					macAddress = parent.find('.account-section.active').find('.device-box.selected').data('mac-address');

				if ( macAddress ) {
					self.renderSettingsHeader(parent, accountId, macAddress);
				}
			});

			parent.find('#update_provider').on('click', function() {
				var accountId = parent.find('.device-box.selected').parents('.account-section.active').data('id'),
					macAddress = parent.find('.account-section.active').find('.device-box.selected').data('mac-address');

				if ( monster.apps.auth.isReseller ) {
					self.renderSettingsHeader(parent);
				}
			});

			parent.find('.account-section .add-device').on('click', function() {
				var accountId = $(this).parents('.account-section').data('id');

				self.renderSettingsHeader(parent, accountId, 'new');
			});

			parent.find('.account-section .update-account').on('click', function() {
				var accountId = $(this).parents('.account-section').data('id');

				self.renderSettingsHeader(parent, accountId);
			});
		},

		renderSettingsHeader: function(parent, accountId, macAddress) {
			var self = this,
				loadHeader = function(data) {
					self.getPhonesList(data ? data.brand : null, function(dataTemplate) {
						var settingsHeaderTemplate;

						if ( data ) {
							dataTemplate.device = data;
						}

						settingsHeaderTemplate = $(monster.template(self, 'settingsHeader', dataTemplate));
						settingsHeaderTemplate.find('#mac').mask('hh:hh:hh:hh:hh:hh', { placeholder: ' ' });

						parent
							.find('.settings-header')
							.append(settingsHeaderTemplate);

						self.bindSettingsHeaderEvents(parent, accountId, macAddress);

						if ( data ) {
							self.requestGetSettingsByModel(data.brand, data.model, function(settings) {
								self.renderSettingsContent(parent, accountId, data.settings, settings, macAddress);
							});
						}
					});
				};

			parent
				.empty()
				.append($(monster.template(self, 'settings')));


			if ( macAddress ) {
				if ( macAddress == 'new' ) {
					loadHeader();
				} else {
					self.requestGetDevice(accountId, macAddress, function(data) {
						loadHeader(data);
					});
				}
			} else if ( accountId ) {
				self.requestGetAccount(accountId, function(data) {
					self.requestGetGlobalSettings(function(settings) {
						self.renderSettingsContent(parent, accountId, data.settings, settings, macAddress);
					});
				});
			} else if ( monster.apps.auth.isReseller) {
				self.requestGetProvider(function(data) {
					self.requestGetGlobalSettings(function(settings) {
						self.renderSettingsContent(parent, accountId, data.settings, settings, macAddress);
					});
				});
			}
		},

		bindSettingsHeaderEvents: function(parent, accountId, macAddress) {
			var self = this;

			parent.find('#reset').on('click', function() {
				self.renderSettingsHeader(parent, accountId, macAddress);
			});

			parent.find('select[name="manufacturer"]').on('change', function() {
				if ( $(this).val() != 'default' ) {
					self.getPhonesList($(this).val(), function(dataTemplate) {
						parent
							.find('select[name="model"]')
							.empty()
							.append($(monster.template(self, 'modelOption', dataTemplate)))
							.prop('disabled', null);
					});
				}
			});

			parent.find('select[name="model"]').on('change', function() {
				if ( $(this).val() != 'default' ) {
					var newModel = {
							brand: $(this).find('option:selected').data('brand'),
							family: $(this).find('option:selected').data('family'),
							model: $(this).val()
						};

					if ( parent.find('#form2object').length ) {
						newModel.settings = form2object('form2object');
					}

					self.requestGetSettingsByModel(newModel.brand, newModel.model, function(settings) {
						self.renderSettingsContent(parent, accountId, newModel.settings, settings, macAddress);
					});
				}
			});
		},

		renderSettingsContent: function(parent, accountId, data, settings, macAddress) {
			var self = this,
				settingsContentTemplate = $(monster.template(self, 'settingsContent', { settings: settings })),
				initTemplate = function() {
					parent.find('.nav-bar > .switch-link:first-child').addClass('active');
					parent.find('.settings-content .container > .content:first-child').addClass('active');

					parent.find('.switch-sublink').each(function() {
						$(this).text(parseInt($(this).text(), 10) + 1);
					});

					self.bindSettingsContentEvents(parent, accountId, macAddress);
				},
				findDefaultValues = function(data, settings, args) {

					if ( Array.isArray(settings[args.section]) ) {
						settings[args.section] = settings[args.section][args.index];
					}

					if ( settings[args.section] && settings[args.section][args.option] && settings[args.section][args.option][args.field]) {
						data.defaultValue = settings[args.section][args.option][args.field];

						if ( data.defaultValue == '1' || data.defaultValue == '0' ) {
							for ( var key in data.data ) {
								if ( data.data[key].value == data.defaultValue ) {
									data.defaultValue = data.data[key].text;
								}
							}
						}
					}
				};

			parent
				.find('.settings-content')
				.empty()
				.append(settingsContentTemplate);

			if ( accountId && macAddress ) {
				self.requestGetAccount(accountId, function(accountData) {
					self.requestGetProvider(function(providerData) {
						var mergedSettings = {};

						$.extend(true, mergedSettings, providerData.settings, accountData.settings);

						self.scanObject(settings, function(args) {
							dataField = args.dataField;
							dataField.path = args.pathArray.join('.');
							dataField.value = ( dataField.func ) ? self[dataField.func](dataField.args) : dataField.value;

							findDefaultValues(dataField, mergedSettings, args);

							parent
								.find(args.isArray ? ('.container .content[data-key="' + args.section + '"] .sub-content[data-key="' + args.index + '"] .' + args.option) : ('.container .content[data-key="' + args.section + '"] .' + args.option))
								.append($(monster.template(self, 'field' + dataField.type.charAt(0).toUpperCase() + dataField.type.slice(1), dataField)));
						});

						self.scanObject(data, function(args) {
							parent
								.find('*[name="' + args.pathArray.join('.') + '"]')
								.val(args.dataField)
								.attr('value', args.dataField);
						});

						initTemplate();
					});
				});
			} else if ( accountId ) {
				self.requestGetAccount(accountId, function(accountData) {
					self.requestGetProvider(function(providerData) {
						self.scanObject(settings, function(args) {
							dataField = args.dataField;
							dataField.path = args.pathArray.join('.');
							dataField.value = ( dataField.func ) ? self[dataField.func](dataField.args) : dataField.value;

							findDefaultValues(dataField, providerData.settings, args);

							parent
								.find(args.isArray ? ('.container .content[data-key="' + args.section + '"] .sub-content[data-key="' + args.index + '"] .' + args.option) : ('.container .content[data-key="' + args.section + '"] .' + args.option))
								.append($(monster.template(self, 'field' + dataField.type.charAt(0).toUpperCase() + dataField.type.slice(1), dataField)));
						});

						self.scanObject(data, function(args) {
							parent
								.find('*[name="' + args.pathArray.join('.') + '"]')
								.val(args.dataField)
								.attr('value', args.dataField);
						});

						initTemplate();
					});
				});
			} else {
				self.scanObject(settings, function(args) {
					dataField = args.dataField;
					dataField.path = args.pathArray.join('.');
					dataField.value = ( dataField.func ) ? self[dataField.func](dataField.args) : dataField.value;

					parent
						.find(args.isArray ? ('.container .content[data-key="' + args.section + '"] .sub-content[data-key="' + args.index + '"] .' + args.option) : ('.container .content[data-key="' + args.section + '"] .' + args.option))
						.append($(monster.template(self, 'field' + dataField.type.charAt(0).toUpperCase() + dataField.type.slice(1), dataField)));
				});

				self.scanObject(data, function(args) {
					parent
						.find('*[name="' + args.pathArray.join('.') + '"]')
						.val(args.dataField)
						.attr('value', args.dataField);
				});

				initTemplate();
			}
		},

		bindSettingsContentEvents: function(parent, accountId, macAddress) {
			var self = this;

			parent.find('.switch-link').on('click', function() {
				parent.find('.switch-link.active').removeClass('active');
				$(this).addClass('active');
				parent.find('.settings-content .content.active').removeClass('active');
				parent.find('.settings-content .content[data-key="' + $(this).data('key') + '"]').addClass('active');
			});

			parent.find('.switch-sublink').on('click', function() {
				parent.find('.content[data-key="' + $(this).parents('.content').data('key') + '"] .switch-sublink.active').removeClass('active');
				$(this).addClass('active');
				parent.find('.content[data-key="' + $(this).parents('.content').data('key') + '"] .sub-content.active').removeClass('active');
				parent.find('.content[data-key="' + $(this).parents('.content').data('key') + '"] .sub-content[data-key="' + $(this).data('key') + '"]').addClass('active');
			});

			parent.find('#cancel').on('click', function() {
				self.render(parent);
			});

			parent.find('#save').on('click', function() {

				if ( macAddress ) {
					var newDevice = {
						brand: parent.find('select[name="model"] option:selected').data('brand'),
						family: parent.find('select[name="model"] option:selected').data('family'),
						model: parent.find('select[name="model"] option:selected').attr('value'),
						name: parent.find('#name').val(),
						settings: self.cleanForm(form2object('form2object'))
					};

					if ( macAddress == 'new' ) {
						self.requestAddDevice(accountId, parent.find('#mac').val().replace(/:/g, ''), newDevice, function() {
							self.render(parent);
						});
					} else {
						self.requestGetDevice(accountId, macAddress, function(data) {
							self.requestUpdateDevice(accountId, macAddress, newDevice, function() {
								self.render(parent);
							});
						});
					}
				} else if ( accountId ) {
					self.requestGetAccount(accountId, function(data) {
						data.settings = form2object('form2object');

						self.requestUpdateAccount(accountId, data, function() {
							self.render(parent);
						});
					});
				} else if ( monster.apps.auth.isReseller ) {
					self.requestGetProvider(function(data) {
						data.settings = form2object('form2object');

						self.requestUpdateProvider(data, function() {
							self.render(parent);
						});
					});
				}
			});
		},

		/* Accounts Requests */
		requestGetAccount: function(accountId, callback) {
			var self = this;

			monster.request({
				resource: 'provisioner.getAccount',
				data: {
					account_id: accountId
				},
				success: function(data, status) {
					callback(data);
				}
			});
		},
		requestGetAccountsByProvider: function(callback) {
			var self = this;

			self.getProviderId(function(providerId) {
				monster.request({
					resource: 'provisioner.getAccountsByProvider',
					data: {
						provider_id: providerId
					},
					success: function(data, status) {
						callback(data);
					}
				});
			});
		},
		requestUpdateAccount: function(accountId, data, callback) {
			var self = this;

			monster.request({
				resource: 'provisioner.updateAccount',
				data: {
					account_id: accountId,
					data: data
				},
				success: function(data, status) {
					callback();
				}
			});
		},
		/* Devices Requests */
		requestAddDevice: function(accountId, macAddress, data, callback) {
			var self = this;

			monster.request({
				resource: 'provisioner.addDevice',
				data: {
					account_id: accountId,
					mac_address: macAddress,
					data: data
				},
				success: function(data, status) {
					self.requestGenerateFile(macAddress, function() {
						callback();
					});
				}
			});
		},
		requestGetDevice: function(accountId, macAddress, callback) {
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
		requestGetDevicesByAccount: function(accountId, callback) {
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
		requestUpdateDevice: function(accountId, macAddress, data, callback) {
			var self = this;

			monster.request({
				resource: 'provisioner.updateDevice',
				data: {
					account_id: accountId,
					mac_address: macAddress,
					data: data
				},
				success: function(data, status) {
					self.requestGenerateFile(macAddress, function() {
						callback();
					});
				}
			});
		},
		requestDeleteDevice: function(accountId, macAddress, callback) {
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
		requestGenerateFile: function(macAddress, callback) {
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
		/* Providers APIs */
		requestGetProvider: function(callback) {
			var self = this;

			self.getProviderId(function(providerId) {
				monster.request({
					resource: 'provisioner.getProvider',
					data: {
						provider_id: providerId
					},
					success: function(data, status) {
						callback(data.data);
					}
				});
			});
		},
		requestUpdateProvider: function(data, callback) {
			var self = this;

			self.getProviderId(function(providerId) {
				monster.request({
					resource: 'provisioner.updateProvider',
					data: {
						provider_id: providerId,
						data: data
					},
					success: function(data, status) {
						callback();
					}
				});
			});
		},
		/* UI Requests */
		requestGetSettingsByModel: function(brand, model, callback) {
			var self = this;

			monster.request({
				resource: 'provisioner.getSettingsByModel',
				data: {
					brand: brand,
					model: model
				},
				success: function(data, status) {
					callback(self.expandSettings(data.data));
				}
			});
		},
		requestGetGlobalSettings: function(callback) {
			var self = this;

			monster.request({
				resource: 'provisioner.getGlobalSettings',
				data: {
				},
				success: function(data, status) {
					callback(self.expandSettings(data.data));
				}
			});
		},
		/* Phones Requests */
		requestGetPhones: function(callback) {
			var self = this;

			monster.request({
				resource: 'provisioner.getPhones',
				data: {
				},
				success: function(data, status) {
					callback(data.data);
				}
			});
		},
		/* Apps Link APIs */
		requestGetProviderIfNotMasqueraded: function(callback) {
			var self = this;

			monster.request({
				resource: 'provisioner.getProviderIdIfNotMasqueraded',
				data: {
				},
				success: function(data, status) {
					callback(data.data);
				}
			});
		},
		requestProviderIfMasqueraded: function(callback) {
			var self = this;

			monster.request({
				resource: 'provisioner.getProviderIdIfMasqueraded',
				data: {
					account_id: self.accountId
				},
				success: function(data, status) {
					callback(data.data);
				}
			});
		},

		/* Methods */
		getProviderId: function(callback) {
			var self = this;

			if ( self.accountId === monster.apps.auth.originalAccount.id ) {
				self.requestGetProviderIfNotMasqueraded(function(data) {
					if ( data.is_reseller ) {
						callback(data.account_id);
					} else {
						callback(data.reseller_id);
					}
				});
			} else {
				self.requestProviderIfMasqueraded(function(data) {
					if ( data.is_reseller ) {
						callback(data.account_id);
					} else {
						callback(data.reseller_id);
					}
				});
			}
		},

		getPhonesList: function(deviceBrand, callback) {
			var self = this;

			self.requestGetPhones(function(brands) {
				var brandsList = [],
					modelsList = [],
					family,
					model,
					brand;

				for ( brand in brands ) {
					brandsList.push(brand);
					if ( deviceBrand && deviceBrand == brand ) {
						for ( family in brands[brand].families ) {
							for ( model in brands[brand].families[family].models ) {
								brands[brand].families[family].models[model].family = family;
								brands[brand].families[family].models[model].brand = brand;
								modelsList.push(brands[brand].families[family].models[model]);
							}
						}
					}
				}

				callback(deviceBrand ? { brands_list: brandsList, models_list: modelsList } : { brands_list: brandsList });
			});
		},

		expandSettings: function(data) {
			var self = this;

			for ( var key in data ) {
				if ( !data[key].iterate && data[key].data ) {
					self.expandSettings(data[key].data);
				} else if ( data[key].iterate === 0 ) {
					delete data[key];
				} else if ( data[key].iterate >= 1 ) {
					var iterations = data[key].iterate,
						_data = data[key].data,
						i = 0;

					data[key].data = [];

					self.expandSettings(_data);

					for ( ; i < iterations; i++ ) {
						data[key].data.push(_data);
					}
				}
			}

			return data;
		},

		cleanForm: function(dataForm) {
			var self = this,
				section,
				option,
				index,
				field;

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

			return dataForm;
		},

		scanObject: function(data, callback) {
			var pathArray = [],
				section,
				option,
				__data,
				index,
				field,
				_data;

			for ( section in data ) {
				_data = data[section].data ? data[section].data : data[section];

				if ( Array.isArray(_data) ) {
					for ( index in _data ) {
						pathArray.push(section + '[' + index + ']');
						for ( option in _data[index] ) {
							__data = _data[index][option].data ? _data[index][option].data : _data[index][option];
							pathArray.push(option);
							for ( field in __data ) {
								pathArray.push(field);

								callback({
									dataField: __data[field],
									pathArray: pathArray,
									isArray: true,
									section: section,
									option: option,
									index: index,
									field: field
								});

								pathArray.splice(pathArray.length--, 1);
							}
							pathArray.splice(pathArray.length--, 1);
						}
						pathArray.splice(pathArray.length--, 1);
					}
				} else {
					pathArray.push(section);
					for ( option in _data) {
						__data = _data[option].data ? _data[option].data : _data[option];
						pathArray.push(option);
						for ( field in __data) {
							pathArray.push(field);

							callback({
								dataField: __data[field],
								pathArray: pathArray,
								isArray: false,
								section: section,
								option: option,
								index: index,
								field: field
							});

							pathArray.splice(pathArray.length--, 1);
						}
						pathArray.splice(pathArray.length--, 1);
					}
					pathArray.splice(pathArray.length--, 1);
				}
			}
		},

		generateRandomLocalPort: function(args) {
			return _.random(args[0], args[1]);
		}
	};

	return app;
});