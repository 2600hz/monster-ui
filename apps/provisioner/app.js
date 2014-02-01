define(function(require){
	var $ = require('jquery'),
		_ = require('underscore'),
		mask = require('mask'),
		monster = require('monster');

	var app = {

		name: 'provisioner',

		i18n: [ 'en-US', 'fr-FR' ],

		requests: {
			// 'provisioner.getParametersByModel': {
			// 	'apiRoot': 'apps/provisioner/static/',
			// 	'url': 'data.json',
			// 	'verb': "GET"
			// },
			'provisioner.getParametersByModel': {
				'apiRoot': 'http://10.26.0.194:8888/Provisioner-2600hz/api/',
				'url': 'ui/{brand}/{model}',
				'verb': "GET"
			},
			'provisioner.getAccountsByProvider': {
				'apiRoot': 'http://10.26.0.194:8888/Provisioner-2600hz/api/',
				'url': 'accounts/provider/{provider_id}',
				'verb': "GET",
				'generateError': false
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
				provisionerTemplate,
				parent = parent || $('#ws-content');

			self.getAccountsByProvider(function(data) {
				provisionerTemplate = $(monster.template(self, 'app', data));

				parent
					.empty()
					.append(provisionerTemplate);

				self.bindEvents(parent);

				// self.renderDeviceParameters(parent);
			}, function() {
				monster.ui.alert('error', 'Francis\' Server is Down!');
			});
		},

		bindEvents: function(parent) {
			var self = this;

		},

		renderDeviceParameters: function(parent, deviceId) {
			var self = this;

			self.getParametersByModel(function(data) {
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
										.find('.container .content[data-key="' + section + '"] .sub-content[data-key="' + index + '"] .' + option)
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
									.find('.container .content[data-key="' + section + '"] .' + option)
									.append($(monster.template(self, dataField.type + 'Field', dataField)));

								pathArray.splice(pathArray.length -1, 1);
							}
							pathArray.splice(pathArray.length - 1, 1);
						}
						pathArray.splice(pathArray.length - 1, 1);
					}
				}

				parametersTemplate.find('.nav-bar > .switch-link:first-child').addClass('active');
				parametersTemplate.find('.devices-options .container > .content:first-child').addClass('active');
				parametersTemplate.find('.nav-bar .switch-sublink:first-child').addClass('active');
				parametersTemplate.find('.container .content [data-key="0"]').addClass('active');

				parametersTemplate.find('#mac').mask('hh:hh:hh:hh:hh:hh', {placeholder:' '});
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
				parent.find('.devices-options .content[data-key="' + $(this).data('key') + '"]').addClass('active');
			});

			parent.on('click', '.switch-sublink', function() {
				parent.find('.content[data-key="' + $(this).parent().parent().data('key') + '"] .switch-sublink.active').removeClass('active');
				$(this).addClass('active');
				parent.find('.content[data-key="' + $(this).parent().parent().data('key') + '"] .sub-content.active').removeClass('active');
				parent.find('.content[data-key="' + $(this).parent().parent().data('key') + '"] .sub-content[data-key="' + $(this).data('key') + '"]').addClass('active');
			});

			parent.find('.save').on('click', function() {
				console.log(form2object('form2object'));
			});
		},










		getParametersByModel: function(callback) {
			var self = this;

			monster.request({
				resource: 'provisioner.getParametersByModel',
				data: {
					brand: 'yealink',
					model: 't22'
				},
				success: function(data, status) {
					callback(data.data);
				}
			});
		},

		getAccountsByProvider: function(success, error) {
			var self = this;

			monster.request({
				resource: 'provisioner.getAccountsByProvider',
				data: {
					provider_id: '383ce0b13d6592d94ad6e78aea0001f6'
				},
				success: function(data, status) {
					success(data);
				},
				error: function(data, status) {
					error();
				}
			});
		}
	};

	return app;
});
