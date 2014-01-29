define(function(require){
	var $ = require('jquery'),
		_ = require('underscore'),
		mask = require('mask'),
		monster = require('monster');

	var app = {

		name: 'provisioner',

		i18n: [ 'en-US', 'fr-FR' ],

		requests: {
			'provisioner.getDescendants': {
				url: 'accounts/{accountId}/descendants',
				verb: 'GET'
			},
			'provisioner.getDevicesByAccount': {
				url: 'accounts/{accountId}/devices',
				verb: 'GET'
			},
			'provisioner.getDeviceParameters': {
				apiRoot: 'apps/provisioner/static/',
				'url': 'data.json',
				verb: 'GET'
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

		render: function(parent){
			var self = this,
				parent = parent || $('#ws-content'),
				provisionerTemplate;

			// self.getAccounts(function(data) {
			// 	provisionerTemplate = $(monster.template(self, 'app', data));

			// 	parent
			// 		.empty()
			// 		.append(provisionerTemplate);

			// 	self.bindEvents(parent);
			// });

			self.renderDeviceParameters(parent);
		},

		bindEvents: function(parent) {
			var self = this;

			parent.find('#accounts').on('change', function() {
				self.renderSelectDevice(parent, $(this)[0].selectedOptions[0].value);
			});
		},

		renderSelectDevice: function(parent, accountId) {
			var self = this,
				dataTemplate = {
					accountId: accountId
				},
				deviceTemplate;

			parent.find('.select-device').remove();

			self.getDevicesByAccount(accountId, function(data) {
				if ( data.length === 0 ) {
					dataTemplate.empty = true;
				} else {
					dataTemplate.empty = false;
					dataTemplate.data = data;
				}

				deviceTemplate = monster.template(self, "selectDevice", dataTemplate);

				parent.find('form').append(deviceTemplate);

				self.bindSelectDeviceEvents(parent);
			});
		},

		bindSelectDeviceEvents: function(parent) {
			var self = this;

			parent.find('.new-device').on('click', function() {
				self.renderNewDevice(parent);
			});

			parent.find('.existing-deivce').on('click', function() {
				self.renderDeviceParameters(parent, parent.find('#phones')[0].selectedOptions[0].value);
			});
		},

		renderNewDevice: function(parent) {
			var self = this;

			console.log('New Device');
		},

		renderDeviceParameters: function(parent, deviceId) {
			var self = this;

			self.getDeviceParameters(function(data) {
				var index,
					field,
					option,
					section,
					dataField,
					pathArray = [],
					formatData = function(data) {
						var i,
							key,
							_data,
							iterations;

						for ( key in data ) {
							if ( data[key].iterate ) {
								i = 0;
								_data = data[key].data;
								iterations = data[key].iterate;
								data[key].data = [];

								formatData(_data);

								for ( ; i < iterations; i++ ) {
									data[key].data.push(_data);
								}
							} else if (!data[key].iterate && data[key].data) {
								formatData(data[key].data);
							}
						}

						return data;
					},
					dataTemplate = {
						data: formatData(data)
					},
					parametersTemplate = $(monster.template(self, 'editDevice', dataTemplate));

				console.log(data);

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

									parametersTemplate
										.find('.container .content[data-content="' + section + '"] .sub-content[data-subcontent="' + index + '"] .' + option)
										.append($(monster.template(self, dataField.type + 'Field', dataField)));

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

								parametersTemplate
									.find('.container .content[data-content="' + section + '"] .' + option)
									.append($(monster.template(self, dataField.type + 'Field', dataField)));

								pathArray.splice(pathArray.length -1, 1);
							}
							pathArray.splice(pathArray.length - 1, 1);
						}
						pathArray.splice(pathArray.length - 1, 1);
					}
				}

				parametersTemplate.find('#mac').mask('hh:hh:hh:hh:hh:hh', {placeholder:' '});
				parametersTemplate.find('.nav-bar > .switch-link:first-child').addClass('active');
				parametersTemplate.find('.devices-options .container > .content:first-child').addClass('active');
				parametersTemplate.find('.nav-bar .switch-sublink:first-child').addClass('active');
				parametersTemplate.find('.container .content > div:nth-child(2)').addClass('active');
				parametersTemplate.find('.switch-sublink').each(function() {
					$(this).text(parseInt($(this).text(), 10) + 1);
				});

				parent
					.empty()
					.append(parametersTemplate);

				self.bindDeviceParametersEvents(parent);
			});
		},

		bindDeviceParametersEvents: function(parent) {
			var self = this;

			parent.on('click', '.switch-link', function() {
				parent.find('.switch-link.active').removeClass('active');
				$(this).addClass('active');
				parent.find('.devices-options .content.active').removeClass('active');
				parent.find('.devices-options .content[data-content="' + $(this).data('menu') + '"]').addClass('active');
			});

			parent.on('click', '.switch-sublink', function() {
				parent.find('.content[data-content="' + $(this).parent().parent().data('content') + '"] .switch-sublink.active').removeClass('active');
				$(this).addClass('active');
				parent.find('.content[data-content="' + $(this).parent().parent().data('content') + '"] .sub-content.active').removeClass('active');
				parent.find('.content[data-content="' + $(this).parent().parent().data('content') + '"] .sub-content[data-subcontent="' + $(this).data('submenu') + '"]').addClass('active');
			});

			parent.find('.save').on('click', function() {
				console.log(form2object('form2object'));
			});
		},










		getAccounts: function(callback) {
			var self = this;

			monster.request({
				resource: 'provisioner.getDescendants',
				data: {
					accountId: self.accountId
				},
				success: function(data, status) {
					callback(data);
				},
				error: function(data, status) {
					console.log(data);
				}
			});
		},

		getDevicesByAccount: function(accountId, callback) {
			var self = this;

			monster.request({
				resource: 'provisioner.getDevicesByAccount',
				data: {
					accountId: accountId
				},
				success: function(_data, status) {
					callback(_data.data);
				}
			});
		},

		getDeviceParameters: function(callback) {
			var self = this;

			monster.request({
				resource: "provisioner.getDeviceParameters",
				data: {},
				success: function(_data, status) {
					callback(_data);
				}
			});
		}
	};

	return app;
});
