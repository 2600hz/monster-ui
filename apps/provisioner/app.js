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

			self.getAccounts(function(data) {
				provisionerTemplate = $(monster.template(self, 'app', data));

				parent
					.empty()
					.append(provisionerTemplate);

				self.bindEvents(parent);
			});
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
				var dataTemplate = {
						data: data
					},
					deviceTemplate = $(monster.template(self, 'editDevice', dataTemplate));

				deviceTemplate.find('#mac').mask('hh:hh:hh:hh:hh:hh', {placeholder:' '});
				deviceTemplate.find('.nav-bar > .switch-link:first-child').addClass('active');
				deviceTemplate.find('.devices-options .container > .content:first-child').addClass('active');

				for ( var section in data ) {
					for ( var option in data[section].data ) {
						for ( var field in data[section].data[option].data) {
							console.log(data[section].data[option].data[field]);
							if ( data[section].data[option].data[field].type == 'select' ) {
								deviceTemplate
									.find('.container .content[data-content="' + section + '"] .' + option + '')
									.append($(monster.template(self, 'selectField', data[section].data[option].data[field])));
							} else if ( data[section].data[option].data[field].type == 'text' ) {
								deviceTemplate
									.find('.container .content[data-content="' + section + '"] .' + option + '')
									.append($(monster.template(self, 'textField', data[section].data[option].data[field])));
							}
						}
					}
				}



				parent
					.empty()
					.append(deviceTemplate);

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
