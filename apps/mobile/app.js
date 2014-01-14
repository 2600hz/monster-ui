define(function(require){
	var $ = require('jquery'),
		_ = require('underscore'),
		monster = require('monster'),
		toastr = require('toastr');

	var app = {

		name: 'mobile',

		i18n: [ 'en-US' ],

		requests: {
			'mobile.activatePhone': {
				url: 'accounts/{accountId}/devices',
				verb: 'GET'
			},
			'mobile.updatePhone': {
				url: 'accounts/{accountId}/devices',
				verb: 'GET'
			},
			'mobile.listActivations': {
				url: 'accounts/{accountId}/devices',
				verb: 'GET'
			},
			'mobile.getActivation': {
				apiRoot: 'apps/mobile/fixtures/',
				url: 'edit.json',
				verb: 'GET'
			},
			'mobile.checkCoverage': {
				apiRoot: 'http://192.168.0.29/sprintapi/html/sprint_api/index.php/v1/',
				url: 'accounts/{accountId}/checkCoverage',
				verb: 'POST'
			},
			'mobile.checkEsn': {
				apiRoot: 'http://192.168.0.29/sprintapi/html/sprint_api/index.php/v1/',
				url: 'accounts/{accountId}/checkDeviceInfo',
				verb: 'POST'
			}
		},

		subscribe: {
			'mobile.activate': 'render'
		},

		load: function(callback){
			var self = this;

			self.initApp(function() {
				callback && callback(self);
			});
		},

		initApp: function(callback) {
			var self = this;

			/* Used to init the auth token and account id */
			monster.pub('auth.initApp', {
				app: self,
				callback: callback
			});
		},

		render: function(container){
			var self = this;

			self._render(container);
		},

		// subscription handlers
		_render: function(container) {
			var self = this;

			self.listActivations(function(listActivations) {
				var	dataTemplate = {
						devices: listActivations
					},
					template = $(monster.template(self, 'list', dataTemplate)),
					parent = _.isEmpty(container) ? $('#ws-content') : container;

				self.bindEvents(template);

				(parent)
					.empty()
					.append(template);
			});
		},

		renderCheckDevice: function() {
			var self = this,
				template = $(monster.template(self, 'check')),
				parent = $('#ws-content');

			monster.ui.validate(template.find('#form_check'));

			self.bindCheckEvents(template);

			(parent)
				.empty()
				.append(template);
		},

		renderEditDevice: function(data) {
			var self = this,
				dataTemplate = self.formatEditData(data),
				template = $(monster.template(self, 'edit', dataTemplate)),
				parent = $('#ws-content');

			monster.ui.validate(template.find('#form_activation'));

			self.bindEditEvents(template);

			(parent)
				.empty()
				.append(template);
		},

		bindEvents: function(template) {
			var self = this;

			template.find('#addNewDevice').on('click', function() {
				self.renderEditDevice();
			});

			template.find('#checkDevice').on('click', function() {
				self.renderCheckDevice();
			});

			template.find('.device-action[data-action="edit"]').on('click', function() {
				var deviceId = $(this).parents('.device-line').data('id');

				self.getActivation(deviceId, function(activationDetails) {
					self.renderEditDevice(activationDetails);
				});
			});
		},

		bindEditEvents: function(template) {
			var self = this;

			template.find('#activate_sprint_phone').on('click', function(e) {
				if(monster.ui.valid(template.find('#form_activation'))) {
					var formData = form2object('form_activation'),
				    	formattedData = self.cleanEditData(formData);

					console.log(formattedData);
					console.log(JSON.stringify(formattedData));
					/*self.activatePhone(formattedData, function(device) {
						var template = monster.template(self, '!' + self.i18n.active().activationSuccess, { deviceName: device[0].name });

						toastr.success(template);
					});*/
				}
			});

			template.find('#update_sprint_phone').on('click', function(e) {
				if(monster.ui.valid(template.find('#form_activation'))) {
					var formData = form2object('form_activation'),
				    	formattedData = self.cleanEditData(formData);

					console.log(formattedData);
					console.log(JSON.stringify(formattedData));
					/*self.updatePhone(formattedData, function(device) {
						var template = monster.template(self, '!' + self.i18n.active().updateSuccess, { deviceName: device[0].name });

						toastr.success(template);
					});*/
				}
			});

			template.find('.cancel').on('click', function() {
				self.render();
			});
		},

		bindCheckEvents: function(template) {
			var self = this;

			template.find('.cancel').on('click', function() {
				self.render();
			});

			template.find('#check').on('click', function() {
				if(monster.ui.valid(template.find('#form_check'))) {
					var formData = form2object('form_check');

					monster.parallel({
							coverage: function(callback) {
								self.checkCoverage(formData.zipCode, function(coverage) {
									callback && callback(null, coverage);
								});
							},
							esn: function(callback) {
								self.checkEsn(formData.esn, function(availability) {
									callback && callback(null, availability);
								});
							}
						},
						function(err, results) {
							results = self.formatCheckData(results);

							var resultsTemplate = $(monster.template(self, 'checkResults', results));

							template
								.find('.results')
								.empty()
								.append(resultsTemplate)
								.show();
						}
					);
				}
			});
		},

		formatCheckData: function(data) {
			var self = this,
				formattedData = data;

			console.log(formattedData.esn.validationMessage);
			if(formattedData.esn.validationMessage === null) {
				formattedData.esn.validationMessage = self.i18n.active().checkView.unknownEsn;
			}

			return formattedData;
		},

		formatEditData: function(data) {
			var self = this;

			if(!_.isEmpty(data)) {
				data.extra = {};

				if('response' in data.voice.device_unavailable) {
					data.extra.method = 'response';
					data.extra.methodValue = data.voice.device_unavailable.response;
				}
				if('redirect' in data.voice.device_unavailable) {
					data.extra.method = 'redirect';
					data.extra.methodValue = data.voice.device_unavailable.redirect;
				}
			}

			return data;
		},

		cleanEditData: function(data) {
			var self = this,
				defaults = {
					voice: {
						device_unavailable: {},
						native_routing: false
					}
				};

			/* Setting defaults */
			data = $.extend(true, {}, data, defaults);

			if(data.extra.method) {
				data.voice.device_unavailable[data.extra.method] = data.extra.methodValue;
			}

			if(data.extra.esn) {
				var length = data.extra.esn.length;

				/* If ESN is 18 characters long, it is the decimal ESN, and we convert it to hexa manually.
				If it is 14 or 15 characters long, it is the hexa ESN, we need to strip the last character if it 15 char long. We then convert it to decimal manually */
				if(length === 18) {
					data.esn_dec = parseInt(data.extra.esn) + '';
					data.esn_hexa = data.esn_dec.toString(16);
				}
				else if(length === 14 || length === 15) {
					if(length === 15) {
						data.extra.esn = data.extra.esn.substring(0, 14);
					}

					data.esn_hexa = data.extra.esn;
					data.esn_dec = parseInt(data.extra.esn, 16) + '';
				}
			}

			delete data.extra;

			return data;
		},

		//utils
		activatePhone: function(data, callback) {
			var self = this;

			monster.request({
				resource: 'mobile.activatePhone',
				data: {
					accountId: self.accountId/*,
					data: data*/
				},
				success: function(device) {
					callback && callback(device.data);
				}
			});
		},

		getActivation: function(activationId, callback) {
			var self = this;

			monster.request({
				resource: 'mobile.getActivation',
				data: {
			/*		accountId: self.accountId,
					activationId: activationId*/
				},
				success: function(activation) {
					console.log(activation);
					//callback && callback(activationId.data);
					callback && callback(activation);
				},
				error: function(data) {
					console.log(data);
				}
			});
		},

		listActivations: function(callback) {
			var self = this;

			monster.request({
				resource: 'mobile.listActivations',
				data: {
					accountId: self.accountId/*,
					data: data*/
				},
				success: function(activations) {
					callback && callback(activations.data);
				}
			});
		},

		checkEsn: function(esn, callback) {
			var self = this;

			monster.request({
				resource: 'mobile.checkEsn',
				data: {
					accountId: self.accountId,
					data: {
						serial: esn
					}/*,
					data: data*/
				},
				success: function(availability) {
					callback && callback(availability);
				}
			});
		},

		checkCoverage: function(zipCode, callback) {
			var self = this;

			console.log(zipCode);

			monster.request({
				resource: 'mobile.checkCoverage',
				data: {
					accountId: self.accountId,
					data: {
						zip_code: zipCode
					}/*,
					data: data*/
				},
				success: function(coverage) {
					callback && callback(coverage);
				}
			});
		}
	};

	return app;
});
