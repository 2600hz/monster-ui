define(function(require){
	var $ = require('jquery'),
		_ = require('underscore'),
		monster = require('monster'),
		toastr = require('toastr');

	var app = {

		name: 'mobile',

		i18n: [ 'en-US', 'fr-FR' ],

		requests: {
			'mobile.activatePhone': {
				apiRoot: 'http://localhost/tower_of_power/sprintapi/html/sprint_api/index.php/v1/',
				url: 'accounts/{accountId}/activateDevice',
				verb: 'POST'
			},
			'mobile.updatePhone': {
				apiRoot: 'http://localhost/tower_of_power/sprintapi/html/sprint_api/index.php/v1/',
				url: 'accounts/{accountId}/updateDevice/{activationId}',
				verb: 'POST'
			},
			'mobile.listActivations': {
				apiRoot: 'http://localhost/tower_of_power/sprintapi/html/sprint_api/index.php/v1/',
				url: 'accounts/{accountId}/devices',
				verb: 'GET'
			},
			'mobile.getActivation': {
				apiRoot: 'http://localhost/tower_of_power/sprintapi/html/sprint_api/index.php/v1/',
				url: 'accounts/{accountId}/devices/{activationId}',
				verb: 'GET'
			},
			'mobile.cancelActivation': {
				apiRoot: 'http://localhost/tower_of_power/sprintapi/html/sprint_api/index.php/v1/',
				url: 'accounts/{accountId}/cancel/{activationId}',
				verb: 'GET'
			},
			'mobile.checkCoverage': {
				apiRoot: 'http://localhost/tower_of_power/sprintapi/html/sprint_api/index.php/v1/',
				url: 'accounts/{accountId}/checkCoverage',
				verb: 'POST'
			},
			'mobile.checkEsn': {
				apiRoot: 'http://localhost/tower_of_power/sprintapi/html/sprint_api/index.php/v1/',
				url: 'accounts/{accountId}/checkDeviceInfo',
				verb: 'POST'
			}
		},

		subscribe: {
			'mobile.dashboard.render': 'renderDashboard',
			'mobile.devices.render': 'renderDevices',
			'mobile.activate.render': 'renderActivate',
			'mobile.buy.render': 'renderBuy',
			'mobile.models.render': 'renderModels',
			'mobile.ideas.render': 'renderIdeas',
			'mobile.help.render': 'renderHelp'
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
			var	dataTemplate = {};
			template = $(monster.template(self, 'app', dataTemplate)),
			parent = _.isEmpty(container) ? $('#ws-content') : container;

			self.bindEvents(template);

			(parent)
				.empty()
				.append(template);
		},


		renderDashboard: function(container) {
			var self = this,
				template = $(monster.template(self, 'dashboard'));

			(container.parent)
				.empty()
				.append(template);
		},

		renderDevices: function(container) {
			var self = this;

			self.listActivations(function(listActivations) {
				var	dataTemplate = {
						devices: listActivations
					},
					template = $(monster.template(self, 'list', dataTemplate)),
					parent = _.isEmpty(container) ? $('#ws-content') : container;

				self.bindListEvents(template);

				(container.parent)
					.empty()
					.append(template);
			});
		},

		renderActivate: function(container) {
			var self = this,
				template = $(monster.template(self, 'check'));

			monster.ui.validate(template.find('#form_check'));

			self.bindActivateEvents(template);

			(container.parent)
				.empty()
				.append(template);
		},

		renderBuy: function(container) {
			var self = this,
				template = $(monster.template(self, 'buy'));

			(container.parent)
				.empty()
				.append(template);
		},

		renderModels: function(container) {
			var self = this,
				template = $(monster.template(self, 'models'));

			(container.parent)
				.empty()
				.append(template);
		},

		renderIdeas: function(container) {
			var self = this,
				template = $(monster.template(self, 'ideas'));

			(container.parent)
				.empty()
				.append(template);
		},

		renderHelp: function(container) {
			var self = this,
				template = $(monster.template(self, 'help'));

			(container.parent)
				.empty()
				.append(template);
		},

		renderEditDevice: function(data) {
			var self = this,
				dataTemplate = self.formatEditData(data),
				template = $(monster.template(self, 'edit', dataTemplate)),
				parent = $('#ws-content');

			monster.ui.validate(template.find('#form_activation'));

			self.bindEditEvents(template, data);
			console.log(data);

			(parent)
				.empty()
				.append(template);


			/*if ($('input[name="routingType"]:checked').val()=="native")
				$("#kazoorouting").hide();	*/

			template.find("#editTabs").tabs();

			if (!_.isEmpty(data) && 'voice' in data && data.voice.routingType) {
				$('button[data-value="'+data.voice.routingType+'"]').addClass('btn-primary');
				switch (data.voice.routingType) {
					case 'native': 
						template.find("#advancedrouting").hide();
						template.find("#kazoorouting").hide();
						break;
					case 'advanced':
						template.find("#advancedrouting").show();
						template.find("#kazoorouting").hide();
						break;
				};
			}
			else
				template.find('button[data-value="kazoo"]').addClass('btn-primary');


		},

		bindEvents: function(parent) {
			var self = this,
				container = parent.find('.right-content');

			parent.find('.category').on('click', function() {
				parent
					.find('.category')
					.removeClass('active');

				container.empty();

				$(this).toggleClass('active');
			});

			var args = {
				parent : container
			};

			parent.find('.category#dashboard').on('click', function() {
				monster.pub('mobile.dashboard.render', args);
			});

			parent.find('.category#devices').on('click', function() {
				monster.pub('mobile.devices.render', args);
			});

			parent.find('.category#activate').on('click', function() {
				monster.pub('mobile.activate.render', args);
			});

			parent.find('.category#buy').on('click', function() {
				monster.pub('mobile.buy.render', args);
			});

			parent.find('.category#models').on('click', function() {
				monster.pub('mobile.models.render', args);
			});

			parent.find('.category#ideas').on('click', function() {
				monster.pub('mobile.ideas.render', args);
			});

			parent.find('.category#help').on('click', function() {
				monster.pub('mobile.help.render', args);
			});

		},

		bindListEvents: function(template) {
			var self = this;

/*			template.find('#addNewDevice').on('click', function() {
				self.renderEditDevice();
			});

			template.find('#checkDevice').on('click', function() {
				self.renderCheckDevice();
			});*/

			template.find('.mobile-action[data-action="cancel"]').on('click', function() {
				var deviceId = $(this).parents('.mobile-row').data('id');

				self.cancelActivation(deviceId, function(activationDetails) {
					self.render();
				});
			});

			template.find('.mobile-action[data-action="edit"]').on('click', function() {
				var deviceId = $(this).parents('.mobile-row').data('id');

				self.getActivation(deviceId, function(activationDetails) {
					self.renderEditDevice(activationDetails);
				});
			});
		},

		bindEditEvents: function(template, data) {
			var self = this;
			console.log(data);

			template.find('#activate_sprint_phone').on('click', function(e) {
				if(monster.ui.valid(template.find('#form_activation'))) {
					var formData = form2object('form_activation'),
				    	formattedData = self.cleanEditData(formData);

					self.activatePhone(formattedData, function(device) {
						if(device.service_info) {
							self.renderEditDevice(device);
						}
						else {
							monster.ui.alert('error', device.error);
						}
						/*var template = monster.template(self, '!' + self.i18n.active().activationSuccess, { deviceName: device[0].name });

						toastr.success(template);*/
					});
				}
			});

			template.find('#update_sprint_phone').on('click', function(e) {
				if(monster.ui.valid(template.find('#form_activation'))) {
					var formData = form2object('form_activation'),
				    	formattedData = self.cleanEditData(formData);

				    formattedData = $.extend(true, data, formattedData);

					self.updatePhone(formattedData, function(device) {
						if (device.device_name) {
							var template = monster.template(self, '!' + self.i18n.active().updateSuccess, { deviceName: device.device_name });
							toastr.success(template);
						}
						else
							alert('failed');
					});
				}
			});

			template.find('.cancel').on('click', function() {
				self.render();
			});


			template.find('.routingType').on('click', function(e) {
				if ($(this).attr('data-value')=="native") {
					$("#kazoorouting").hide();
					$("#advancedrouting").hide();
				}

				if ($(this).attr('data-value')=="kazoo") { 
					$("#kazoorouting").show();
					$("#advancedrouting").hide();
				}					

				if ($(this).attr('data-value')=="advanced") { 
					$("#kazoorouting").hide();
					$("#advancedrouting").show();
				}	

			});

			template.find('.btn-group .btn').on('click', function(ev) {
				if(!($(this).hasClass('btn-primary'))) {
					$('.btn', $(this).parent()).removeClass('btn-primary');
					$(this).addClass('btn-primary');
					$("#voiceRoutingType").val( $(this).attr("data-value") );	



				}
			});

		},

		bindActivateEvents: function(template) {
			var self = this;

			template.find('#verifyDevice').on('click', function() {
				if(monster.ui.valid(template.find('#form_check'))) {
					var formData = form2object('form_check');

					monster.parallel({
							esn: function(callback) {
								self.checkEsn(formData.esn, function(availability) {
									callback && callback(null, availability);
								});
							}
						},
						function(err, results) {
							results = self.formatCheckData(results);

							var resultsTemplate = $(monster.template(self, 'checkDeviceResults', results));

							template
								.find('#device_results')
								.empty()
								.append(resultsTemplate)
								.show();
						}
					);
				}
			});

			template.find('#checkCoverage').on('click', function() {
				if(monster.ui.valid(template.find('#form_check'))) {
					var formData = form2object('form_check');

					monster.parallel({
							coverage: function(callback) {
								self.checkCoverage(formData.zip_code, function(coverage) {
									callback && callback(null, coverage);
								});
							}
						},
						function(err, results) {
							//results = self.formatCheckData(results);

							var resultsTemplate = $(monster.template(self, 'checkCoverageResults', results));

							template
								.find('#coverage_results')
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
						nativeRouting: false
					}
				};

			/* Setting defaults */
			data = $.extend(true, {}, data, defaults);

			if(data.extra.method) {
				data.voice.device_unavailable[data.extra.method] = data.extra.methodValue;
			}

			/*
			if(data.extra.esn) {
				var length = data.extra.esn.length;

				If ESN is 18 characters long, it is the decimal ESN, and we convert it to hexa manually.
				If it is 14 or 15 characters long, it is the hexa ESN, we need to strip the last character if it 15 char long. We then convert it to decimal manually
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
			}*/

			delete data.extra;

			return data;
		},

		//utils
		updatePhone: function(data, callback) {
			var self = this;

			monster.request({
				resource: 'mobile.updatePhone',
				data: {
					accountId: self.accountId,
					activationId:  encodeURIComponent(data.mdn),
					data: data
				},
				success: function(device) {
					callback && callback(device);
				}
			});
		},

		activatePhone: function(data, callback) {
			var self = this;

			monster.request({
				resource: 'mobile.activatePhone',
				data: {
					accountId: self.accountId,
					data: data
				},
				success: function(device) {
					callback && callback(device);
				}
			});
		},

		getActivation: function(activationId, callback) {
			var self = this;

			monster.request({
				resource: 'mobile.getActivation',
				data: {
					accountId: self.accountId,
					activationId: encodeURIComponent(activationId)
				},
				success: function(activation) {
					callback && callback(activation);
				}
			});
		},

		cancelActivation: function(activationId, callback) {
			var self = this;

			monster.request({
				resource: 'mobile.cancelActivation',
				data: {
					accountId: self.accountId,
					activationId: encodeURIComponent(activationId)
				},
				success: function(activation) {
					callback && callback(activation);
				}
			});
		},

		listActivations: function(callback) {
			var self = this;

			monster.request({
				resource: 'mobile.listActivations',
				data: {
					accountId: self.accountId
				},
				success: function(activations) {
					callback && callback(activations);
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
						esn: esn
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
