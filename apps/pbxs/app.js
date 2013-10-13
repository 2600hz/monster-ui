define(function(require){
	var $ = require('jquery'),
		_ = require('underscore'),
		monster = require('monster'),
		toastr = require('toastr'),
		nicescroll = require('nicescroll');

	var app = {

		name: "pbxs",

		i18n: [ 'en-US', 'fr-FR' ],

		requests: {
			'pbxsManager.listCallflows': {
				url: 'accounts/{accountId}/callflows',
				verb: 'GET'
			},
			'pbxsManager.getAccount': {
				url: 'accounts/{accountId}',
				verb: 'GET'
			},
			'pbxsManager.listNumbers': {
				url: 'accounts/{accountId}/phone_numbers',
				verb: 'GET'
			},
			'pbxsManager.get': {
				url: 'accounts/{accountId}/phone_numbers/{phoneNumber}',
				verb: 'GET'
			},
			'pbxsManager.update': {
				url: 'accounts/{accountId}/phone_numbers/{phoneNumber}',
				verb: 'POST'
			},
			'pbxsManager.activate': {
				url: 'accounts/{accountId}/phone_numbers/{phoneNumber}/activate',
				verb: 'PUT'
			},
			'pbxsManager.search': {
				url: 'phone_numbers?prefix={prefix}&quantity={quantity}',
				verb: 'GET'
			},
			'pbxsManager.delete': {
				url: 'accounts/{accountId}/phone_numbers/{phoneNumber}',
				verb: 'DELETE'
			},
			'pbxsManager.create': {
				url: 'accounts/{accountId}/phone_numbers/{phoneNumber}/docs/{fileName}',
				verb: 'PUT'
			},
			'pbxsManager.port': {
				url: 'accounts/{accountId}/phone_numbers/{phoneNumber}/port',
				verb: 'PUT'
			},
			'pbxsManager.createDoc': {
				url: 'accounts/{accountId}/phone_numbers/{phoneNumber}/docs/{fileName}',
				verb: 'PUT'
			},
			'oldTrunkstore.create': {
				url: 'accounts/{accountId}/connectivity',
				verb: 'PUT'
			},
			'oldTrunkstore.list': {
				url: 'accounts/{accountId}/connectivity',
				verb: 'GET'
			},
			'oldTrunkstore.get': {
				url: 'accounts/{accountId}/connectivity/{connectivityId}',
				verb: 'GET'
			},
			'oldTrunkstore.update': {
				url: 'accounts/{accountId}/connectivity/{connectivityId}',
				verb: 'POST'
			}
		},

		subscribe: {
			'pbxsManager.activate': '_render',
			'pbxsManager.edit': 'editServer',
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

		render: function(container){
			var self = this;

			self._render(container);
		},

		// subscription handlers
		_render: function(container) {
			var self = this,
				pbxsManager = $(monster.template(self, 'pbxsManager')),
				parent = _.isEmpty(container) ? $('#ws-content') : container;

			(parent)
				.empty()
				.append(pbxsManager);

			self.renderList(-1, parent, function(data) {
				self.refreshUnassignedList(function() {
					self.bindEvents(pbxsManager);

					if(data.length === 0) {
						monster.pub('pbxsManager.edit', {});
					}
					else if(data.length >= 1) {
						monster.pub('pbxsManager.edit', { id: 0 });

						pbxsManager.find('.pbx-wrapper[data-id="0"]').addClass('selected');
					}
				});
			});

			pbxsManager.find('#pbxs_manager_listpanel').niceScroll({
				cursorcolor:"#333",
				autohidemode:false,
				cursorborder:"1px solid #666"
			}).railh.addClass('pbx-fixed-hscroll');

			pbxsManager.find('#unassigned_numbers_wrapper').niceScroll({
				cursorcolor:"#333",
				cursoropacitymin:0.5,
				hidecursordelay:1000
			}).rail.addClass('unassigned-number-fixed-vscroll');
		},

		editServer: function(args) {
			var self = this;

			monster.parallel({
				realm: function(callback){
					 monster.request({
						resource: 'pbxsManager.getAccount',
						data: {
							accountId: self.accountId,
						},
						success: function(_data_account, status) {

							callback(null, _data_account.data.realm);
						}
					});
				},
				account: function(callback){
					self.getAccount(function(_data) {
						callback(null, _data);
					});
				},
				numbers: function(callback) {
					self.listAllNumbers(function(_data) {
						callback(null, _data);
					});
				}
			},
			function(err, results){
				var parent = args.parent || $('#ws-content'),
					target = args.target || parent.find('#pbxs_manager_view'),
					_callbacks = args.callbacks || {},
					callbacks = {
						saveSuccess: _callbacks.saveSuccess || function(_data) {
							var savedId = (args.id === 0 || args.id) ? args.id : _data.data.servers.length-1;

							self.renderList(savedId, parent, function() {
								self.renderPbxsManager(_data, $.extend(true, defaults, _data.data.servers[savedId]), target, callbacks);
							}, _data.data.servers);
						},

						saveError: _callbacks.saveError,

						deleteSuccess: _callbacks.deleteSuccess || function() {
							target.empty();

							 self.renderList();
						},

						cancelSuccess: _callbacks.cancelSuccess || function() {
							monster.pub('pbxsManager.edit', {
								id: args.id,
								parent: parent,
								target: target,
								callbacks: callbacks
							});
						},

						deleteError: _callbacks.deleteError,

						afterRender: _callbacks.afterRender
					},
					defaults = $.extend(true, {
						auth: {
							auth_user: 'user_' + monster.util.randomString(8),
							auth_password: monster.util.randomString(12),
							auth_method: 'IP'
						},
						options: {
							e911_info: {}
						},
						cfg: {
							register_time: '360',
							opening_pings: true,
							caller_id_header: 'p-asserted',
							supported_codecs: 'g722',
							signaling_type: 'rfc_2833',
							allow_refer: true,
							use_t38: true
						},
						extra: {
							support_email: (monster.config.port || {}).support_email || 'support@trunking.io',
							pbx_help_link: monster.config.pbx_help_link || 'https://2600hz.atlassian.net/wiki/display/docs/Trunking.io',
							pbx_help_configuration_link: monster.config.pbx_help_configuration_link || 'https://2600hz.atlassian.net/wiki/display/docs/Trunking_config.io',
							configure: 'manually',
							realm: results.realm,
							id: args.id || (args.id === 0 ? 0 : 'new')
						}
					}, args.data_defaults || {});

				if(results.account.data.servers) {
					$.each(results.account.data.servers, function(k, server) {
						$.each(server.DIDs, function(did, v) {
							if(did in results.numbers.data.numbers) {
								results.account.data.servers[k].DIDs[did].features = results.numbers.data.numbers[did].features;
							}
						});
					});
				}

				if(typeof args === 'object' && (args.id || args.id === 0)) {
					self.renderPbxsManager(results.account, $.extend(true, defaults, results.account.data.servers[args.id]), target, callbacks);
				}
				else {
					self.renderEndpoint(results.accounts, defaults, target, callbacks, parent);
				}
			});
		},

		listAvailablePbxs: function() {
			return ['allworks', 'altigen', 'asterisk', 'avaya', 'bluebox', 'cisco', 'digium', 'epygi', 'freepbx', 'freeswitch', 'mitel', 'objectworld', 'other', 'pingtel', 'responsepoint', 'samsung', 'shoretel', 'sutus', 'talkswitch', 'threecom', 'taridium'];
		},

		listAllNumbers: function(success, error) {
			var self = this;

			monster.request({
				resource: 'pbxsManager.listNumbers',
				data: {
					accountId: self.accountId,
				},
				success: function(data, status) {
					if(typeof success == 'function') {
						success(data, status);
					}
				},
				error: function(data, status) {
					if(typeof error == 'function') {
						error(data, status);
					}
				}
			});
		},

		listCallflows: function(success, error) {
			var self = this;

			monster.request({
				resource: 'pbxsManager.listCallflows',
				data: {
					accountId: self.accountId,
				},
				success: function(data, status) {
					if(typeof success == 'function') {
						success(data, status);
					}
				},
				error: function(data, status) {
					if(typeof error == 'function') {
						error(data, status);
					}
				}
			});
		},

		createAccount: function(success, error) {
			var self = this;

			monster.request({
				resource: 'pbxsManager.getAccount',
				data: {
					accountId: self.accountId,
				},
				success: function(_data, status) {
					var account_data = {
						account: {
							credits: {
								prepay: '0.00'
							},
							trunks: '0',
							inbound_trunks: '0',
							auth_realm: _data.data.realm
						},
						billing_account_id: self.accountId,
						DIDs_Unassigned: {},
						servers: []
					};

					monster.request({
						resource: 'oldTrunkstore.create',
						data: {
							accountId: self.accountId,
							data: account_data
						},
						success: function(data, status) {
							if(typeof success == 'function') {
								success(data, status);
							}
						},
						error: function(data, status) {
							if(typeof error == 'function') {
								error(data, status);
							}
						}
					});
				}
			});
		},

		listAccounts: function(success, error) {
			var self = this;

			monster.request({
				resource: 'oldTrunkstore.list',
				data: {
					accountId: self.accountId,
				},
				success: function(data, status) {
					if(typeof success == 'function') {
						success(data, status);
					}
				},
				error: function(data, status) {
					if(typeof error == 'function') {
						error(data, status);
					}
				}
			});
		},

		getAccount: function(success, error) {
			var self = this;

			monster.request({
				resource: 'oldTrunkstore.get',
				data: {
					accountId: self.accountId,
					connectivityId: self.connectivityId
				},
				success: function(data, status) {
					if(typeof success == 'function') {
						success(data, status);
					}
				},
				error: function(data, status) {
					if(typeof error == 'function') {
						error(data, status);
					}
				}
			});
		},

		getAutomaticStatus: function(data) {
			var self = this;
				list_steps = [
					'init',
					'registration',
					'options',
					'options_period',
					'outbound_call',
					'inbound_call',
					'dtmf_test',
					'reset_dtmf',
					'fax_test',
					'settings'
				],
				sip_id = monster.config.sip_id ? monster.config.sip_id : (monster.config.sip_id = monster.util.randomString(20));

			var step = list_steps.indexOf(data.step) > -1 ? data.step : 'init';

			monster.request({
				resource: 'pbxsManager.get_automatic_status',
				data: {
					sip_id: sip_id,
					settings_step: step
				},
				success: function(data, status) {
					if(typeof success == 'function') {
						success(data, status);
					}
				},
				error: function(data, status) {
					if(typeof error == 'function') {
						error(data, status);
					}
				}
			});
		},

		listServers: function(success, error) {
			var self = this,
				getAccount = function() {
					self.getAccount(
						function(_data, status) {
							success(_data.data.servers, status);
						}
					);
				};

			if(self.connectivityId) {
				getAccount();
			}
			else {
				self.listAccounts(function(data, status) {
					if(data.data.length) {
						self.connectivityId = data.data[0];

						getAccount();
					}
					else {
						self.createAccount(function(_data) {
								self.listAccounts(function(data, status) {
									self.connectivityId = data.data[0];

									getAccount();
								});
							},
							function(_data, status) {
								var template = monster.template(self, '!' + self.i18n.active().error_signup, { status: status });

								monster.ui.alert(template);
							}
						);
					}
				});
			}
		},

		getNumber: function(phone_number, success, error) {
			var self = this;

			monster.request({
				resource: 'pbxsManager.get',
				data: {
					accountId: self.accountId,
					phoneNumber: encodeURIComponent(phone_number)
				},
				success: function(_data, status) {
					if(typeof success === 'function') {
						success(_data);
					}
				},
				error: function(_data, status) {
					if(typeof error === 'function') {
						error(_data);
					}
				}
			});
		},

		updateNumber: function(phone_number, data, success, error) {
			var self = this;

			monster.request({
				resource: 'pbxsManager.update',
				data: {
					accountId: self.accountId,
					phoneNumber: encodeURIComponent(phone_number),
					data: data
				},
				success: function(_data, status) {
					if(typeof success === 'function') {
						success(_data);
					}
				},
				error: function(_data, status) {
					if(typeof error === 'function') {
						error(_data);
					}
				}
			});
		},

		portNumber: function(data, success, error) {
			var self = this;

			monster.request({
				resource: 'pbxsManager.port',
				data: {
					accountId: self.accountId,
					phoneNumber: encodeURIComponent(data.phone_number),
					data: data.options || {}
				},
				success: function(_data, status) {
					if(typeof success == 'function') {
						success(_data, status);
					}
				},
				error: function(_data, status) {
					if(typeof error == 'function') {
						error(_data, status);
					}
				}
			});
		},

		createNumber: function(phone_number, success, error) {
			var self = this;

			//TODO flag request Check to avoid multiple creation
			monster.request({
				resource: 'pbxsManager.create',
				data: {
					accountId: self.accountId,
					phoneNumber: encodeURIComponent(phone_number),
					data: {}
				},
				success: function(_data, status) {
					if(typeof success == 'function') {
						success(_data, status);
					}
				},
				error: function(_data, status) {
					if(typeof error == 'function') {
						error(_data, status);
					}
				}
			});
		},

		activateNumber: function(phone_number, success, error) {
			var self = this;

			//TODO flag request Check to avoid multiple creation
			monster.request({
				resource: 'pbxsManager.activate',
				data: {
					accountId: self.accountId,
					phoneNumber: encodeURIComponent(phone_number),
					data: {}
				},
				success: function(_data, status) {
					if(typeof success == 'function') {
						success(_data, status);
					}
				},
				error: function(_data, status) {
					if(typeof error == 'function') {
						error(_data, status);
					}
				}
			});
		},

		deleteNumber: function(phone_number, success, error) {
			var self = this;

			monster.request({
				resource: 'pbxsManager.delete',
				data: {
					accountId: self.accountId,
					phoneNumber: encodeURIComponent(phone_number)
				},
				success: function(data, status) {
					if(typeof success == 'function') {
						success(data, status);
					}
				},
				error: function(data, status) {
					if(typeof error == 'function') {
						error(data, status);
					}
				}
			});
		},

		searchNumbers: function(data, success, error) {
			var self = this;

			monster.request({
				resource: 'pbxsManager.search',
				data: {
					prefix: data.prefix,
					quantity: data.quantity || 15
				},
				success: function(_data, status) {
					if(typeof success == 'function') {
						success(_data, status);
					}
				},
				error: function(_data, status) {
					if(typeof error == 'function') {
						error(_data, status);
					}
				}
			});
		},

		createNumberDoc: function(data, success, error) {
			var self = this;

			monster.request({
				resource: 'pbxsManager.createDoc',
				data: {
					accountId: self.accountId,
					phoneNumber: encodeURIComponent(data.phone_number),
					fileName: data.file_name,
					data: data.file_data
				},
				success: function(_data, status) {
					if(typeof success == 'function') {
						success(_data, status);
					}
				},
				error: function(_data, status) {
					if(typeof error == 'function') {
						error(_data, status);
					}
				}
			});
		},

		submitPort: function(portData, number_data, callback) {
			var self = this,
				uploads_done = 0,
				put_port_data = function() {
					number_data.options.port = portData.port;

					//todo phone nbr/data/cb
					self.updateNumber(number_data.phone_number, number_data.options, function(data) {
						if(typeof callback == 'function') {
							callback(data);
						}
					});
				},
				put_port_doc = function(index) {
					/* Add files */
					self.createNumberDoc({
							phone_number: number_data.phone_number,
							fileName: portData.loa[0].file_name,
							file_data: portData.loa[0].file_data
						},
						function(_data, status) {
							self.createNumberDoc({
									phone_number: number_data.phone_number,
									file_name: portData.files[index].file_name,
									file_data: portData.files[index].file_data
								},
								function(_data, status) {
									put_port_data();
								}
							);
						}
					);
				};

			if(portData.port.main_number === number_data.phone_number) {
				put_port_doc(0);
			}
			else{
				put_port_data();
			}
		},

		addFreeformNumbers: function(numbersData, callback) {
			var self = this,
				numberData;

			if(numbersData.length > 0) {
				var phoneNumber = numbersData[0].phoneNumber.match(/^\+?1?([2-9]\d{9})$/),
					error = function() {
						var errorNumber = numbersData[0].phone_number,
							template = monster.template(self, '!' + self.i18n.active().error_acquire, { phoneNumber: errorNumber });

						monster.ui.confirm(template,
							function() {
								self.addFreeformNumbers(numbersData, callback);
							},
							function() {
								self.addFreeformNumbers(numbersData.slice(1), callback);
							}
						);
					};

				if(phoneNumber && phoneNumber[1]) {
					self.createNumber(phoneNumber[1],
						function() {
							self.activateNumber(phoneNumber[1],
								function(_data, status) {
									self.addFreeformNumbers(numbersData.slice(1), callback);
								},
								function(_data, status) {
									error();
								}
							);
						},
						function() {
							error();
						}
					);
				}
				else {
					error();
				}
			}
			else {
				if(typeof callback === 'function') {
					callback();
				}
			}
		},

		addNumbers: function(globalData, index, numbersData, callback) {
			var self = this,
				numberData;

			if(numbersData.length > 0) {
				var phoneNumber = numbersData[0].phone_number.match(/^\+?1?([2-9]\d{9})$/),
					error = function() {
						var errorNumber = numbersData[0].phone_number,
							template = monster.template(self, '!' + self.i18n.active().error_acquire, { phoneNumber: errorNumber });

						monster.ui.confirm(template,
							function() {
								self.addNumbers(globalData, index, numbersData, callback);
							},
							function() {
								self.addNumbers(globalData, index, numbersData.slice(1), callback);
							}
						);
					};

				if(phoneNumber[1]) {
					self.activateNumber(phoneNumber[1],
						function(_data, status) {
							globalData.data.servers[index].DIDs[_data.data.id] = {
								failover: false,
								cnam: false,
								dash_e911: false
							};

							self.addNumbers(globalData, index, numbersData.slice(1), callback);
						},
						function(_data, status) {
							error();
						}
					);
				}
				else {
					error();
				}
			}
			else {
				self.updateOldTrunkstore(globalData.data, function(updatedData) {
					self.renderList(index, undefined, undefined, updatedData.data.servers);
					if(typeof callback === 'function') {
						callback();
					}
				});
			}
		},

		cleanPhoneNumberData: function(data) {
			var self = this;

			return data;
		},

		normalizeEndpointData: function(data) {
			var self = this;

			if(data.server_name === '' || !('server_name' in data)) {
				data.server_name = "PBX " + data.extra.serverid;
			}

			delete data.extra;

			return data;
		},

		saveEndpoint: function(endpointData, data, success, error) {
			var self = this,
				index = endpointData.extra.serverid,
				new_data = $.extend(true, {}, data.data);

			self.normalizeEndpointData(endpointData);

			if(endpointData.server_name) {
				if((index || index === 0) && index != 'new') {
					$.extend(true, new_data.servers[index], endpointData);
				}
				else {
					new_data.servers.push($.extend(true, {
						DIDs: {},
						options: {
							enabled: true,
							inbound_format: 'e.164',
							international: false,
							caller_id: {},
							e911_info: {},
							failover: {}
						},
						permissions: {
							users: []
						},
						monitor: {
							monitor_enabled: false
						}
					}, endpointData));
				}

				monster.request({
					resource: 'oldTrunkstore.update',
					data: {
						accountId: self.accountId,
						connectivityId: self.connectivityId,
						data: new_data
					},
					success: function(_data, status) {
						if(typeof success == 'function') {
							success(_data, status);
						}
					},
					error: function(_data, status) {
						if(typeof error == 'function') {
							error(_data, status);
						}
					}
				});
			}
			else {
				monster.ui.alert('formatting_error');
			}
		},

		updateOldTrunkstore: function(data, success, error) {
			var self = this;

			monster.request({
				resource: 'oldTrunkstore.update',
				data: {
					accountId: self.accountId,
					connectivityId: self.connectivityId,
					data: data
				},
				success: function(_data, status) {
					if(typeof success == 'function') {
						success(_data, status);
					}
				},
				error: function(_data, status) {
					if(typeof error == 'function') {
						error(_data, status);
					}
				}
			});
		},

		loadSpecificStep: function(step_index, callbacks, parent) {
			$('.wizard-top-bar', parent).hide();
			$('.wizard-content-step', parent).hide();
			$('.wizard-content-step[data-step="'+ step_index +'"]', parent).show();

			$('.wizard-buttons button', parent).hide();
			$('.cancel', parent).show();
			$('.submit-btn', parent).show();

			if(step_index === 3) {
				$('#list_pbxs_navbar').hide();
			}

			$('.cancel', parent).off()
								.on('click', function(ev) {
				ev.preventDefault();

				if(typeof callbacks.cancelSuccess === 'function') {
					callbacks.cancelSuccess();
				}
			});
		},

		initializeWizard: function(parent, callback_submit) {
			var self = this,
				max_step = parseInt($('.wizard-top-bar', parent).attr('data-max_step'));

			$('.wizard-top-bar', parent).attr('data-active_step', '1');

			$('.wizard-content-step', parent).hide();
			$('.wizard-content-step[data-step="1"]', parent).show();

			$('.wizard-top-bar', parent).attr('data-active_step', '1');

			if(max_step !== 1) {
				$('.submit-btn', parent).hide();
			}
			else {
				$('.next-step', parent).hide();
			}

			$('.prev-step', parent).hide();

			$('.step', parent).on('click', function() {
				var step = $(this).data('step');
				if($(this).hasClass('completed')) {
					self.validate_step($('.wizard-top-bar', parent).attr('data-active_step'), parent, function() {
						self.change_step(step, max_step, parent);
					});
				}
			});

			$('.next-step', parent).on('click', function(ev) {
				ev.preventDefault();

				current_step = parseInt($('.wizard-top-bar', parent).attr('data-active_step'));
				self.validate_step(current_step, parent, function() {
					self.change_step(++current_step, max_step, parent);
				});
			});

			$('.prev-step', parent).on('click', function(ev) {
				ev.preventDefault();

				current_step = parseInt($('.wizard-top-bar', parent).attr('data-active_step'));
				self.change_step(--current_step, max_step, parent);
			});

			$('.cancel', parent).on('click', function(ev) {
				ev.preventDefault();

				monster.pub('pbxsManager.activate');
			});

			$('.submit-btn', parent).on('click', function(ev) {
				ev.preventDefault();

				if(typeof callback_submit === 'function') {
					callback_submit();
				}
			});
		},

		change_step: function(step_index, max_step, parent) {
			var self = this;

			$('.step', parent).removeClass('active');
			$('.step[data-step="'+step_index+'"]', parent).addClass('active');

			for(var i = step_index; i >= 1; --i) {
				$('.step[data-step="'+i+'"]', parent).addClass('completed');
			}

			$('.wizard-content-step', parent).hide();
			$('.wizard-content-step[data-step="'+ step_index +'"]', parent).show();

			$('.cancel', parent).hide();
			$('.prev-step', parent).show();
			$('.next-step', parent).show();
			$('.submit-btn', parent).hide();

			if(step_index === max_step) {
				$('.next-step', parent).hide();
				$('.submit-btn', parent).show();
			}

			if(step_index === 1) {
				$('.prev-step', parent).hide();
				$('.cancel', parent).show();
			}

			$('.wizard-top-bar', parent).attr('data-active_step', step_index);
		},

		validate_step: function(step, parent, callback) {
			var self = this,
				validated = true,
				step = parseInt(step),
				error_message = self.i18n.active().please_correct;

			var form_data = form2object('endpoint');

			if(step === 1) {
				if($('.pbx-brand-list .pbx.selected', parent).size() === 0) {
					error_message += '<br/>- ' + self.i18n.active().no_pbx_selected;
					validated = false;
				}
			}
			else if(step === 2) {
				/* IP */
				if($('input[type="radio"][name="auth.auth_method"]:checked', parent).val() === 'IP') {
					if(!($('#auth_ip', parent).val().match(/^(?:(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.){3}(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)$/) !== null)) {
						validated = false;
						error_message += '<br/>- ' + self.i18n.active().not_valid_ip;
					}
				}
				/* Auth */
				else {

				}
			}
			else if(step === 3) {
			}

			if(validated === true) {
				if(typeof callback === 'function') {
					callback();
				}
			}
			else {
				monster.ui.alert(error_message);
			}
		},

		renderEndpoint: function(data, endpointData, target, callbacks, parent) {
			if(!endpointData.server_name) {
				endpointData.server_name = null;
			}

			var self = this,
				interval,
				interval_bar,
				current_automatic_step = 1,
				pause_polling = false,
				submit_wizard_callback = function() {
					var form_data = form2object('endpoint');

					form_data.auth.auth_method = $('input[type="radio"][name="auth.auth_method"]:checked', endpointHtml).val(),
					form_data.server_type = $('.pbx-brand-list .pbx.selected', endpointHtml).data('pbx_name'),
					form_data.cfg = $.extend(true, cfg, form_data.cfg);

					self.getAccount(function(globalData) {
						self.saveEndpoint(form_data, globalData, function(_data) {
							if(typeof callbacks.saveSuccess == 'function') {
								callbacks.saveSuccess(_data);
							}
						});
					});
				},
				automatic_wizard_success = function() {
					array_substep[current_automatic_step - 2].current_step++;
					var i = current_automatic_step - 2;
					if(array_substep[i].current_step <= array_substep[i].total_step) {
						var step_success = array_substep[i].current_step - 1,
							total_step = array_substep[i].total_step,
							displayed_pct = (step_success / total_step)*100;

						array_substep[i].displayed_pct = displayed_pct;

						$('.wizard-automatic-step[data-value='+ current_automatic_step +'] tr:nth-child('+ step_success +') .icon-ok-sign', endpointHtml).show();
						$('.wizard-automatic-step[data-value='+ current_automatic_step +'] .progress .bar', endpointHtml).css('width', displayed_pct + '%');
						return;
					}
					else if(i+2 >= current_automatic_step) {
						$('.wizard-automatic-step[data-value='+ current_automatic_step +'] tr .icon-ok-sign', endpointHtml).show();
						$('.wizard-automatic-step[data-value='+ current_automatic_step +'] .progress .bar', endpointHtml).css('width', '100%');
						array_substep[i].displayed_pct = 100;
						setTimeout(function() {
							$('.wizard-automatic-step[data-value="' + current_automatic_step + '"]', endpointHtml).hide();
							$('.wizard-automatic-step[data-value="' + ++current_automatic_step +'"]', endpointHtml).show();
							$('.testing-progress .testing-step[data-step="' + (current_automatic_step - 2) + '"] .icon-ok-sign', endpointHtml).show();
						}, 2000);

						return;
					}
				},
				reset_auto_step = function() {
					clear_intervals();
					$('.wizard-automatic-step[data-value='+ current_automatic_step +'] .progress .bar', endpointHtml).css('width', '0%');
					$('td .icon-ok-sign:not(.result)', endpointHtml).hide();
					$.each(array_substep, function(k, v) {
						v.current_step = 1;
					});
				},
				clear_intervals = function(_interval) {
					if(typeof _interval !== 'undefined') {
						clearInterval(_interval);
					}
					else {
						clearInterval(interval);
						clearInterval(interval_bar);
					}
				},
				move_bar = function() {
					var array_index = array_substep[current_automatic_step-2],
						current_step = array_index.current_step,
						total_step = array_index.total_step;

					if(!('displayed_pct' in array_substep[current_automatic_step-2])) {
						array_substep[current_automatic_step-2].displayed_pct = ((current_step - 1) / total_step) * 100;
					}

					array_index = array_substep[current_automatic_step-2];

					var next_pct = ((current_step) / total_step) * 100,
						current_pct = array_index.displayed_pct,
						new_pct = current_pct + ((next_pct - current_pct) / 10);

					array_substep[current_automatic_step-2].displayed_pct = new_pct;

					$('.wizard-automatic-step[data-value='+ current_automatic_step +'] .progress .bar', endpointHtml).css('width', new_pct + '%');
				},
				array_substep = [
					{ current_step: 1, total_step: 3, api: ['registration', 'options', 'options_period']},
					{ current_step: 1, total_step: 4, api: ['outbound_call', 'inbound_call', 'dtmf_test']},
					{ current_step: 1, total_step: 4, api: []},
					{ current_step: 1, total_step: 2, api: []},
					{ current_step: 1, total_step: 1, api: []},
					{ current_step: 1, total_step: 2, api: []}
				],
				cfg = {},
				dataTemplate = _.extend({ i18n: { supportEmail: endpointData.extra.support_email }}, endpointData),
				endpointHtml = $(monster.template(self, 'endpoint', dataTemplate));

			$('.icon-question-sign[data-toggle="tooltip"]', endpointHtml).tooltip();

			$.each(endpointData.cfg, function(k, v) {
				if(typeof v === 'object') {
					$.each(v, function(k2, v2) {
						$('button[data-value="'+v2+'"]', $('.btn-group[data-type="'+k+'"]', endpointHtml)).addClass('btn-primary');
					});
				}
				else {
					$('button[data-value="'+v+'"]', $('.btn-group[data-type="'+k+'"]', endpointHtml)).addClass('btn-primary');
				}
			});

			self.initializeWizard(endpointHtml, submit_wizard_callback);

			$('.static-ip-block', endpointHtml).hide();
			$('.testing-block', endpointHtml).hide();
			$('.static-ip-block[data-value="'+ endpointData.auth.auth_method +'"]', endpointHtml).show();
			$('.testing-block[data-value="'+ endpointData.extra.configure +'"]', endpointHtml).show();

			$('#stop_tests', endpointHtml).on('click', function() {
				pause_polling = true;
				monster.ui.confirm(self.i18n.active().stop_test_warning, function() {
					reset_auto_step();
					$('.testing-block', endpointHtml).hide();
					$('.testing-block[data-value="manually"]', endpointHtml).slideDown();
					$('.wizard-automatic-step', endpointHtml).hide();
					$('input[type="radio"][value="manually"]', endpointHtml).prop('checked', true);

					current_automatic_step = 1;
					$('.wizard-buttons', endpointHtml).show();
				}, function() {
					pause_polling = false;
				});
			});

			$('.skip_test', endpointHtml).on('click', function() {
				array_substep[current_automatic_step - 2].current_step = array_substep[current_automatic_step - 2].total_step + 1;
				$('.wizard-automatic-step[data-value="' + current_automatic_step + '"]', endpointHtml).hide();

				var $automatic_step = $('.wizard-automatic-step[data-value='+ ++current_automatic_step +']', endpointHtml);
				$automatic_step.show();
				$('tr .icon-ok-sign', $automatic_step).hide();
				$('.progress .bar', $automatic_step).css('width', '0%');
			});

			$('.btn-group .btn', endpointHtml).on('click', function(ev) {
				ev.preventDefault();

				var $btn_group = $(this).parent('.btn-group');
				if($btn_group.data('select') === 'multi') {
					$(this).toggleClass('btn-primary');

					cfg[$btn_group.data('type')] = [];
					$('.btn', $btn_group).each(function(k, v) {
						if($(v).hasClass('btn-primary')) {
							cfg[$btn_group.data('type')].push($(v).data('value'));
						}
					});
				}
				else {
					if(!($(this).hasClass('btn-primary'))) {
						$('.btn', $(this).parent()).removeClass('btn-primary');
						$(this).addClass('btn-primary');
					}

					cfg[$btn_group.data('type')] = $(this).data('value');
				}
			});

			$('#submit_settings', endpointHtml).on('click', function(ev) {
				ev.preventDefault();

				submit_wizard_callback();
			});

			$('input[type="radio"][name="extra.configure"]', endpointHtml).on('click', function() {
				reset_auto_step();
				$('.testing-block', endpointHtml).hide();
				$('.testing-block[data-value="'+$(this).val()+'"]', endpointHtml).slideDown();
				$('.wizard-automatic-step', endpointHtml).hide();

				if($(this).val() === 'automatically') {
					$('.wizard-automatic-step[data-value="'+ current_automatic_step +'"]', endpointHtml).show();
					$('.header-step', endpointHtml).hide();
					$('.wizard-buttons', endpointHtml).hide();
				}
				else {
					current_automatic_step = 1;
					$('.wizard-buttons', endpointHtml).show();
				}
			});

			$('#phone_number_test', endpointHtml).on('click', function() {
				automatic_wizard_success();
			});

			$('#start_test', endpointHtml).click(function(ev) {
				ev.preventDefault();
				if(!('sip_id' in monster.config)) {
					monster.config.sip_id = monster.util.randomString(32);
				}

				reset_auto_step();
				pause_polling = false;

				var polling_interval = 2,
					move_bar_interval = 0.5,
					stop_polling = false,
					function_move_bar = function() {
						if(Math.floor((Math.random()*10)+1) > 3) {
							move_bar();
						}
					},
					function_polling = function() {
						if($('.testing-block[data-value="automatically"]:visible', endpointHtml).size() > 0) {
							if(pause_polling === false) {
								var api_name = '',
									v = array_substep[current_automatic_step - 2];

								if(v.current_step <= v.total_step) {
									if(v.api[v.current_step - 1] !== undefined) {
										api_name = v.api[v.current_step-1];
									}
									else {
										stop_polling = true;
									}
								}

								if(stop_polling) {
									clear_intervals();
								}
								else {
									monster.request({
										resource: 'pbxsManager.get_automatic_status',
										data: {
											sip_id: monster.config.sip_id,
											settings_step: api_name
										},
										success: function(_data) {
											if(_data.status === 'success' || _data.status === 'succes') {
												automatic_wizard_success();
											}
										},
										error: function(_data) {

										}
									});
								}
							}
						}
						else {
							clear_intervals();
						}
					};

				interval = setInterval(function_polling, polling_interval * 1000);
				interval_bar = setInterval(function_move_bar, move_bar_interval * 1000);

				$('#phone_number_test', endpointHtml).html(monster.util.formatPhoneNumber($('#test_number', endpointHtml).val()));
				$('.wizard-automatic-step', endpointHtml).hide();
				$('.wizard-automatic-step[data-value="'+ ++current_automatic_step +'"]', endpointHtml).show();
				$('.header-step', endpointHtml).show();
			});

			$('#cancel_test', endpointHtml).click(function(ev) {
				ev.preventDefault();

				if('cancelSuccess' in callbacks && typeof callbacks.cancelSuccess === 'function') {
					callbacks.cancelSuccess();
				}
			});

			$('input[type="radio"][name="auth.auth_method"]', endpointHtml).on('click', function() {
				$('.static-ip-block', endpointHtml).hide();
				$('.static-ip-block[data-value="'+$(this).val()+'"]', endpointHtml).slideDown();
			});

			$('.pbx-brand-list .pbx', endpointHtml).each(function() {
				if($(this).data('pbx_name') === endpointData.server_type) {
					$(this).addClass('selected');
					$('.pbx-brand-list .pbx:not(.selected)', endpointHtml).css('opacity', '0.2');
					return false;
				}
			});

			if(endpointData.server_type && $('.pbx-brand-list .pbx.selected', endpointHtml).size() === 0) {
				$('.pbx-brand-list .pbx.other', endpointHtml).addClass('selected');
				$('.pbx-brand-list .pbx:not(.selected)', endpointHtml).css('opacity', '0.2');
			}

			if(!endpointData.server_type) {
				$('.info_pbx', endpointHtml).hide();
			}

			$('.pbx-brand-list .pbx', endpointHtml).click(function() {
				$('.pbx-brand-list .pbx', endpointHtml).removeClass('selected').css('opacity', '0.2');
				$(this).addClass('selected');

				$('.selected-pbx', endpointHtml).html($('.pbx-brand-list .selected', endpointHtml).data('pbx_name'));
				$('.info_pbx', endpointHtml).slideDown();
			});

			if(endpointData.load_step && endpointData.load_step > 0) {
				self.loadSpecificStep(endpointData.load_step, callbacks, endpointHtml);
			}
			else {
				$('#list_pbxs_navbar', parent).hide();
			}

			(target)
				.empty()
				.append(endpointHtml);
		},

		refreshListNumbers: function(didsList, _parent) {
			var parent = _parent || $('#pbx_connector_container'),
				self = this,
				countDids = 0,
				numberWrapper = parent.find('#numbers_wrapper');

			numberWrapper.empty();

			if($.isEmptyObject(didsList)) {
				numberWrapper.append(monster.template(self, 'noNumbers'));
			}
			else {
				numberWrapper.append(monster.template(self, 'listNumbers', { DIDs: didsList }));

				$.each(didsList, function() {
					countDids++;
				});
			}

			$('#count_phones', parent).html(countDids);
			$('#trigger_links', parent).hide();
		},

		renderPbxsManager: function(data, endpointData, target, callbacks) {
			var self = this,
				serverId = endpointData.extra.id,
				img_link = endpointData.server_type ? endpointData.server_type.replace('.','').toLowerCase() : 'other';

			$.inArray(img_link, self.listAvailablePbxs()) < 0 ? img_link = 'other' : true;
			endpointData.img_link = img_link;

			endpointData.servers_list = [];

			$.each(data.data.servers, function(k, v) {
				if(k !== serverId) {
					var temp_img_link = v.server_type ? v.server_type.replace('.','').toLowerCase() : 'other';
					$.inArray(temp_img_link, self.listAvailablePbxs()) < 0 ? temp_img_link = 'other' : true;

					endpointData.servers_list.push({
						index: k,
						server_name: v.server_name,
						img_link: temp_img_link
					});
				}
			});

			var pbxsManager = $(monster.template(self, 'endpointNumbers', endpointData)),
				callback_listing = function(data_cb) {
					self.refreshListNumbers(data_cb, pbxsManager);
				};

			self.refreshListNumbers(endpointData.DIDs, pbxsManager);

			$('#list_pbxs_navbar').show();

			var searchResults = pbxsManager.find('#search_results'),
				numbersWrapper = pbxsManager.find('#numbers_wrapper');

			searchResults.hide();

			pbxsManager.find('.search-query').on('keyup', function() {
				var input = $(this),
					rows = numbersWrapper.find('.number-wrapper'),
					searchString = $.trim(input.val().toLowerCase().replace(/[^0-9]/g, '')),
					matches = [],
					cache = {};

				$.each(rows, function(k, v) {
					var data = $(this).data(),
						key = data.phone_number;

					cache[key] = $(this);
				});

				if (!searchString) {
					numbersWrapper.show();
					searchResults.empty().hide();
				}
				else {
					searchResults.show().empty();

					$.each(cache, function(phone_number, rowArray) {
						if (phone_number.indexOf(searchString)>-1) {
							matches.push({phone_number: phone_number, selected: $(rowArray).hasClass('selected')});
						}
					});

					if(matches.length > 0) {
						searchResults.append(monster.template(self, 'searchResults', _.extend({ i18n: { amountNumbers: matches.length }}, {matches: matches})));
					}
					else {
						searchResults.append(monster.template(self, 'noResults'));
					}

					numbersWrapper.hide();
				}
			});

			pbxsManager.on('click', '.number-wrapper', function(event) {
				if($(event.target).closest('.number-options').size() < 1) {
					var toggleNumberSelected = function(element, updateCb) {
							var currentCb = element.find('input[type="checkbox"]'),
								cbValue = currentCb.prop('checked');

							if(updateCb) {
								currentCb.prop('checked', !cbValue);
							}

							element.toggleClass('selected');
						},
						currentNumberWrapper = $(this);

					toggleNumberSelected(currentNumberWrapper, !$(event.target).is('input:checkbox'));

					if(currentNumberWrapper.parents('#search_results').size() > 0) {
						var $wrapper = pbxsManager.find('#numbers_wrapper .number-wrapper[data-phone_number="'+currentNumberWrapper.data('phone_number')+'"]');

						toggleNumberSelected($wrapper, true);
					}

					var links = pbxsManager.find('#trigger_links');

					pbxsManager.find('.number-wrapper.selected').size() > 0 ? links.show('fast') : links.hide();
				}
			});

			pbxsManager.find('#delete_pbx').on('click', function() {
				monster.ui.confirm(self.i18n.active().delete_pbx_confirmation, function() {
					self.getAccount(function(_globalData) {
						_globalData.data.servers.splice(endpointData.extra.id, 1);

						self.updateOldTrunkstore(_globalData.data, callbacks.deleteSuccess);
					});
				});
			});

			pbxsManager.find('.settings-pbx-link').on('click', function() {
				endpointData.load_step = parseInt($(this).data('step'));
				self.renderEndpoint(data, endpointData, target, callbacks, pbxsManager);
			});

			pbxsManager.find('.buy-numbers-link').on('click', function() {

				monster.pub('common.buyNumbers', {
					searchType: $(this).data('type'),
					callbacks: {
						success: function(numbers) {
							var numbersData = $.map(numbers, function(val, key) {
								return { phone_number: key };
							});

							self.getAccount(function(globalData) {
								self.addNumbers(globalData, serverId, numbersData, function() {
									self.listNumbersByPbx(serverId, callback_listing);
									self.renderList(serverId);
								});
							});
						}
					}
				});
				// self.renderAddNumberDialog(data, serverId, function() {
					// self.listNumbersByPbx(serverId, callback_listing);
					// self.renderList(serverId);
				// });
			});

			pbxsManager.find('.pbx-dropdown:not(.empty)').on('click', function(ev) {
				ev.preventDefault();

				var list_numbers = [];
				pbxsManager.find('.number-wrapper.selected').each(function() {
					list_numbers.push($(this).data('phone_number'));
				});

				if(list_numbers.length > 0) {
					var newIndex = $(this).data('index');

					self.getAccount(function(globalData) {
						var serverName = globalData.data.servers[newIndex].server_name,
							template = monster.template(self, '!' + self.i18n.active().confirm_move, { serverName: serverName });

						monster.ui.confirm(template, function() {
							$.each(list_numbers, function(k, v) {
								globalData.data.servers[newIndex].DIDs[v] = globalData.data.servers[serverId].DIDs[v];
								delete globalData.data.servers[serverId].DIDs[v];
							});

							self.updateOldTrunkstore(globalData.data, function(dataTrunkstore) {
								self.listNumbersByPbx(serverId, callback_listing, dataTrunkstore.data);
								self.renderList(serverId);
							});
						});
					});
				}
				else {
					monster.ui.alert(self.i18n.active().no_number_selected);
				}
			});

			pbxsManager.find('#port_numbers').on('click', function(ev) {
				ev.preventDefault();

				self.renderPortDialog(function(portData, popup) {
					monster.ui.confirm(self.i18n.active().chargeReminder.line1 + '<br/><br/>' + self.i18n.active().chargeReminder.line2,
						function() {
							self.getAccount(function(globalData) {
								var portsDone = 0;

								$.each(portData.phone_numbers, function(i, val) {
									var number_data = {
										phone_number: val
									};

									var check_update_trunkstore = function() {
										if(++portsDone > portData.phone_numbers.length - 1) {
											self.updateOldTrunkstore(globalData.data, function(_data) {
												_data.data.servers[serverId].extra = { id: serverId };

												if(callbacks && 'saveSuccess' in callbacks && typeof callbacks.saveSuccess == 'function') {
													callbacks.saveSuccess(_data);
												}

												popup.dialog('close');
											});
										}
									};

									self.portNumber(number_data, function(_number_data) {
											number_data.options = _number_data.data;

											if('id' in number_data.options) {
												delete number_data.options.id;
											}

											self.submitPort(portData, number_data, function(_data) {
												globalData.data.servers[serverId].DIDs[val] = { failover: false, cnam: false, dash_e911: false };

												check_update_trunkstore();
											});
										},
										function(_number_data) {
											check_update_trunkstore();
										}
									);
								});
							});
						}
					);
				});
			});

			pbxsManager.on('click', '.failover-number', function() {
				var failoverCell = $(this).parents('.number-wrapper').first(),
                    phoneNumber = failoverCell.data('phone_number');

                if(phoneNumber) {
                    var args = {
                        phoneNumber: phoneNumber,
                        callbacks: {
                            success: function(data) {
                                if('failover' in data.data) {
                                    if(failoverCell.find('.features i.icon-thumbs-down').size() === 0) {
                                        failoverCell
                                            .find('.features')
                                            .append('<i class="icon-green icon-thumbs-down"></i>')
                                    }
                                }
                                else {
                                    failoverCell
                                        .find('.features i.icon-thumbs-down')
                                        .remove()
                                }
                            }
                        }
                    };

                    monster.pub('common.failover.renderPopup', args);
                }
			});

			pbxsManager.on('click', '.cnam-number', function() {
                var cnamCell = $(this).parents('.number-wrapper').first(),
                    phoneNumber = cnamCell.data('phone_number');

                if(phoneNumber) {
					var args = {
						phoneNumber: phoneNumber,
						callbacks: {
							success: function(data) {
								if(!($.isEmptyObject(data.data.cnam))) {
									if(cnamCell.find('.features i.icon-user').size() === 0) {
                                		cnamCell
                                			.find('.features')
                                			.append('<i class="icon-green icon-user"></i>')
									}
                            	}
                            	else {
                                	cnamCell
                                		.find('.features i.icon-user')
                                		.remove()
                            	}
                            }
						}
					};

					monster.pub('common.callerId.renderPopup', args);
                }
			});

			pbxsManager.on('click', '.e911-number', function() {
                var e911Cell = $(this).parents('.number-wrapper').first(),
                    phoneNumber = e911Cell.data('phone_number');

				if(phoneNumber) {
					var args = {
						phoneNumber: phoneNumber,
						callbacks: {
							success: function(data) {
								if(!($.isEmptyObject(data.data.dash_e911))) {
                                    if(e911Cell.find('.features i.icon-ambulance').size() === 0) {
                                        e911Cell
                                            .find('.features')
                                            .append('<i class="icon-green icon-ambulance"></i>')
                                    }
                                }
                                else {
                                    e911Cell
                                        .find('.features i.icon-ambulance')
                                        .remove()
                                }
							}
						}
					};

					monster.pub('common.e911.renderPopup', args);
				}
			});

			pbxsManager.find('#remove_numbers').on('click', function() {
				var dataPhoneNumber,
					phone_number,
					$selected_numbers = pbxsManager.find('.number-wrapper.selected'),
					nb_numbers = $selected_numbers.size();

				if(nb_numbers > 0) {
					monster.ui.confirm(self.i18n.active().remove_number_confirmation, function() {
							var array_DIDs = [];

							$selected_numbers.each(function() {
								dataPhoneNumber = $(this).data('phone_number'),
								phone_number = dataPhoneNumber.match(/^\+?1?([2-9]\d{9})$/);

								if(phone_number[1]) {
									array_DIDs.push('+1' + phone_number[1]);
								}
							});

							self.getAccount(function(_globalData) {
								$.each(array_DIDs, function(i, k) {
									if(k in _globalData.data.servers[serverId].DIDs) {
										delete _globalData.data.servers[serverId].DIDs[k]
									}
								});

								self.updateOldTrunkstore(_globalData.data,
									function(dataTrunkstore) {
										self.refreshUnassignedList(function() {
											self.listNumbersByPbx(serverId, callback_listing, dataTrunkstore.data);

											self.renderList(serverId, undefined, undefined, dataTrunkstore.data.servers);
										});
									},
									function() {
										self.listNumbersByPbx(serverId, callback_listing);
									}
								);
							});
						},
						function() {

						}
					);
				}
				else {
					monster.ui.alert(self.i18n.active().no_number_selected);
				}
			});

			(target || $('#ws-content'))
				.empty()
				.append(pbxsManager);
		},

		renderAddNumberDialog: function(globalData, index, callback) {
			var self = this,
				numbers_data = [],
				popup_html = $(monster.template(self, 'addNumberDialog')),
				popup;

			$('.toggle_div', popup_html).hide();

			$('#search_numbers_button', popup_html).click(function(ev) {
				$('.toggle_div', popup_html).hide();

				var npa_data = {},
					npa = $('#sdid_npa', popup_html).val();
					//nxx = $('#sdid_nxx', popup_html).val();

				ev.preventDefault();

				npa_data.prefix = npa;// + nxx;

				self.searchNumbers(npa_data, function(results_data) {
					var results_html = $(monster.template(self, 'addNumberSearchResults', {numbers: results_data.data}));

					$('#foundDIDList', popup_html)
						.empty()
						.append(results_html);

					$('.selected_numbers', popup_html).html('0');
					$('.cost_numbers', popup_html).html('$0.00');

					$('.toggle_div', popup_html).show();
				});
			});

			$('#add_numbers_button', popup_html).click(function(ev) {
				ev.preventDefault();

				monster.ui.confirm(self.i18n.active().chargeReminder.line1 + '<br/><br/>' + self.i18n.active().chargeReminder.line2,
					function() {
						$('#foundDIDList .number-box.selected', popup_html).each(function() {
							numbers_data.push($(this).data());
						});

						self.getAccount(function(globalData) {
							self.addNumbers(globalData, index, numbers_data, function() {
								if(typeof callback === 'function') {
									callback();
								}

								popup.dialog('close');
							});
						});
					}
				);
			});

			$(popup_html).delegate('.number-box', 'click', function(event) {
				$(this).toggleClass('selected');

				if(!$(event.target).is('input:checkbox')) {
					var $current_cb = $('input[type="checkbox"]', $(this)),
						cb_value = $current_cb.prop('checked');

					$current_cb.prop('checked', !cb_value);
				}

				var selected_numbers =  $('.number-box.selected', popup_html).size(),
					sum_price = 0;

				$.each($('.number-box.selected', popup_html), function() {
					sum_price += parseFloat($(this).data('price'));
				});

				sum_price = '$'+sum_price+'.00';

				$('.selected_numbers', popup_html).html(selected_numbers);
				$('.cost_numbers', popup_html).html(sum_price);
			});

			popup = monster.ui.dialog(popup_html, {
				title: self.i18n.active().buy_dialog_title,
				width: '600px',
				position: ['center', 20]
			});
		},

		renderPortDialog: function(callback) {
			var self = this,
				port_form_data = {},
				popup_html = $(monster.template(self, 'portDialog', {
					company_name: monster.config.company_name || '2600hz',
					support_email: (monster.config.port || {}).support_email || 'support@trunking.io',
					support_file_upload: (File && FileReader)
				})),
				popup,
				files,
				loa,
				phone_numbers,
				current_step = 1,
				max_steps = 4,
				$prev_step = $('.prev_step', popup_html),
				$next_step = $('.next_step', popup_html),
				$submit_btn = $('.submit_btn', popup_html);

			/* White label links, have to do it in JS because template doesn't eval variables in href :( */
			$('#loa_link', popup_html).attr('href', ((monster.config.port || {}).loa) || 'http://2600hz.com/porting/2600hz_loa.pdf');
			$('#resporg_link', popup_html).attr('href', ((monster.config.port || {}).resporg) || 'http://2600hz.com/porting/2600hz_resporg.pdf');
			$('#features_link', popup_html).attr('href', ((monster.config.port || {}).features) || 'http://www.2600hz.com/features');
			$('#terms_link', popup_html).attr('href', ((monster.config.port || {}).terms) || 'http://www.2600hz.com/terms');

			$('.step_div:not(.first)', popup_html).hide();
			$prev_step.hide();
			$submit_btn.hide();

			$('.other_carrier', popup_html).hide();

			$('.carrier_dropdown', popup_html).change(function() {
				if($(this).val() === 'Other') {
					$('.other_carrier', popup_html).show();
				}
				else {
					$('.other_carrier', popup_html).empty().hide();
				}
			});

			$('#postal_code', popup_html).blur(function() {
				$.getJSON('http://www.geonames.org/postalCodeLookupJSON?&country=US&callback=?', { postalcode: $(this).val() }, function(response) {
					if (response && response.postalcodes.length && response.postalcodes[0].placeName) {
						$('#locality', popup_html).val(response.postalcodes[0].placeName);
						$('#region', popup_html).val(response.postalcodes[0].adminName1);
					}
				});
			});

			$('.prev_step', popup_html).click(function() {
				$next_step.show();
				$submit_btn.hide();
				$('.step_div', popup_html).hide();
				$('.step_div:nth-child(' + --current_step + ')', popup_html).show();
				$('.wizard_nav .steps_text li, .wizard_nav .steps_image .round_circle').removeClass('current');
				$('#step_title_'+current_step +', .wizard_nav .steps_image .round_circle:nth-child('+ current_step +')', popup_html).addClass('current');

				current_step === 1 ? $('.prev_step', popup_html).hide() : true;
			});

			$('.next_step', popup_html).click(function() {
				$prev_step.show();
				$('.step_div', popup_html).hide();
				$('.step_div:nth-child(' + ++current_step + ')', popup_html).show();
				$('.wizard_nav .steps_text li, .wizard_nav .steps_image .round_circle').removeClass('current');
				$('#step_title_'+current_step +', .wizard_nav .steps_image .round_circle:nth-child('+ current_step +')', popup_html).addClass('current');
				if(current_step === max_steps) {
					$next_step.hide();
					$submit_btn.show();
				}
			});

			$('.loa', popup_html).change(function(ev) {
				var slice = [].slice,
					raw_files = slice.call(ev.target.files, 0),
					file_reader = new FileReader(),
					file_name,
					read_file = function(file) {
						file_name = file.fileName || file.name || 'noname';
						file_reader.readAsDataURL(file);
					};

				loa = [];

				file_reader.onload = function(ev) {
					loa.push({
						file_name: file_name,
						file_data: ev.target.result
					});

					if(raw_files.length > 1) {
						raw_files = raw_files.slice(1);
						read_file(raw_files[0]);
					}
				};

				read_file(raw_files[0]);
			});

			$('.files', popup_html).change(function(ev) {
				var slice = [].slice,
					raw_files = slice.call(ev.target.files, 0),
					file_reader = new FileReader(),
					file_name,
					read_file = function(file) {
						file_name = file.fileName || file.name || 'noname';
						file_reader.readAsDataURL(file);
					};

				files = [];

				file_reader.onload = function(ev) {
					files.push({
						file_name: file_name,
						file_data: ev.target.result
					});

					if(raw_files.length > 1) {
						raw_files = raw_files.slice(1);
						read_file(raw_files[0]);
					}
					else {
						$('.number_of_docs', popup_html).html(files.length);
					}
				};

				read_file(raw_files[0]);
			});

			$('.submit_btn', popup_html).click(function(ev) {
				ev.preventDefault();
				port_form_data = form2object('port');

				var string_alert = '';

				if($('.carrier_dropdown', popup_html).val() === 'Other') {
					port_form_data.port.service_provider = $('.other_carrier', popup_html).val();
				}

				if(!port_form_data.extra.agreed) {
					string_alert += self.i18n.active().agree_to_the_terms + '<br/>';
				}

				$.each(port_form_data.extra.cb, function(k, v) {
					if(v === false) {
						string_alert += self.i18n.active().confirm_conditions + '<br/>';
						return false;
					}
				});

				port_form_data.phone_numbers = $('.numbers_text', popup_html).val().replace(/\n/g,',');
				port_form_data.phone_numbers = port_form_data.phone_numbers.replace(/[\s-\(\)\.]/g, '').split(',');

				port_form_data.port.main_number = port_form_data.port.main_number.replace(/[\s-\(\)\.]/g, '');

				var res = port_form_data.port.main_number.match(/^\+?1?([2-9]\d{9})$/);
				res ? port_form_data.port.main_number = '+1' + res[1] : string_alert += self.i18n.active().enter_main_number + '<br/>';

				var is_toll_free_main = self.checkTollFree(port_form_data.port.main_number);

				port_form_data.phone_numbers.push(port_form_data.port.main_number);

				phone_numbers = [];
				var error_toll_free = [];
				$.each(port_form_data.phone_numbers, function(i, val) {
					var result = val.match(/^\+?1?([2-9]\d{9})$/);

					if(result) {
						if(self.checkTollFree(result[1]) === is_toll_free_main) {
							phone_numbers.push('+1' + result[1]);
						}
						else {
							error_toll_free.push(result[1]);
						}
					}
					else {
						if(val !== '') {
							string_alert += val + ' : '+ self.i18n.active().invalid_number + '<br/>';
						}
					}
				});

				if(error_toll_free.length > 0) {
					$.each(error_toll_free, function(k, v) {
						string_alert += v + ', ';
					});

					if(is_toll_free_main) {
						string_alert += self.i18n.active().error_not_toll_free;
					}
					else {
						string_alert += self.i18n.active().error_toll_free;
					}
				}

				port_form_data.phone_numbers = phone_numbers;

				files ? port_form_data.files = files : string_alert += self.i18n.active().upload_bill + '<br/>';
				loa ? port_form_data.loa = loa : string_alert += self.i18n.active().upload_loa + '<br/>';

				if(string_alert === '') {
					delete port_form_data.extra;

					if(typeof callback === 'function') {
						callback(port_form_data, popup);
					}
					}
				else {
					monster.ui.alert(string_alert);
				}
			});

			popup = monster.ui.dialog(popup_html, {
				title: self.i18n.active().port_dialog_title
			});
		},

		checkTollFree: function(number) {
			var toll_free = false,
				toll_free_number = number.match(/^(\+?1)?(8(00|55|66|77|88)[2-9]\d{6})$/);

			if(toll_free_number && toll_free_number[0]) {
				toll_free = true;
			}

			return toll_free;
		},

		refreshUnassignedList: function(_callback) {
			var self = this;

			self.listAvailableNumbers(function(unassignedNumbers) {
				var data = {
					unassignedNumbers: unassignedNumbers
				};

				$('#unassigned_numbers_wrapper').empty()
												.append(monster.template(self, 'pbxsUnassignedNumbers', data));

				$('#unassigned_numbers_count').empty()
											  .html(unassignedNumbers.length);

				if(typeof _callback === 'function') {
					_callback();
				}
			});
		},

		bindEvents: function(parent) {
			var self = this,
				serverId;

			parent.find('.icon-question-sign[data-toggle="tooltip"]').tooltip();

			parent.find('.link-box.assign').on('click', function() {
				var numbersData = [];

				parent.find('#unassigned_numbers .unassigned-number.selected').each(function(k, v) {
					if($(v).data('phone_number')) {
						numbersData.push($(this).data('phone_number'));
					}
				});

				serverId = parseInt(parent.find('#pbx_connector_container').data('id'));

				if(serverId >= 0) {
					self.getAccount(function(globalData) {
						$.each(numbersData, function(k, v) {
							globalData.data.servers[serverId].DIDs[v] = {};
						});

						self.updateOldTrunkstore(globalData.data, function(dataTrunkstore) {
							self.refreshUnassignedList(function() {
								self.listNumbersByPbx(serverId, function(cb_data) {
									self.refreshListNumbers(cb_data, parent);
									self.renderList(serverId, undefined, undefined, dataTrunkstore.data.servers);
								}, dataTrunkstore.data);
							});
						});
					});
				}
				else {
					monster.ui.alert(self.i18n.active().no_pbx_selected);
				}
			});

			parent.find('#unassigned_numbers_header').on('click', function() {
				var $this = $(this),
					$content = parent.find('#unassigned_numbers .content'),
					niceScrollBar = $('#unassigned_numbers_wrapper', parent).getNiceScroll()[0];

				if($this.hasClass('open')) {
					$this.removeClass('open');
					$content.hide();
					niceScrollBar.resize();
				}
				else {
					$this.addClass('open');
					$content.slideDown(niceScrollBar.resize);
				}
			});

			parent.on('click', '.unassigned-number', function(event) {
				var $this = $(this);
				$this.toggleClass('selected');

				if(!$(event.target).is('input:checkbox')) {
					var $current_cb = $this.find('input[type="checkbox"]'),
						cb_value = $current_cb.prop('checked');

					$current_cb.prop('checked', !cb_value);
				}
			});

			parent.on('click', '#pbxs_manager_listpanel .pbx-wrapper', function() {
				$('#pbxs_manager_listpanel .pbx-wrapper', parent).removeClass('selected');
				serverId = $(this).data('id');
				monster.pub('pbxsManager.edit', { id: serverId });
				$(this).addClass('selected');
			});

			parent.find('#add_pbx').on('click', function() {
				monster.pub('pbxsManager.edit', {});
			});

			parent.find('.link-box.delete').on('click', function() {
				var dataPhoneNumber,
					phone_number,
					$selected_numbers = $('.unassigned-number.selected', parent),
					nb_numbers = $selected_numbers.size(),
					refresh_list = function() {
						nb_numbers--;
						if(nb_numbers === 0) {
							self.refreshUnassignedList();
						}
					};

				if(nb_numbers > 0) {
					monster.ui.confirm(self.i18n.active().delete_numbers_confirmation, function() {
							$selected_numbers.each(function() {
								dataPhoneNumber = $(this).data('phone_number');

								if(dataPhoneNumber) {
									self.deleteNumber(dataPhoneNumber,
										function() {
											refresh_list();
										},
										function() {
											refresh_list();
										}
									);
								}
							});
						},
						function() {
						}
					);
				}
				else {
					monster.ui.alert(self.i18n.active().no_number_selected);
				}
			});

			parent.find('#unassigned_numbers .search-query').on('keyup', function() {
				var input = $(this),
					rows = $('#unassigned_numbers .content .unassigned-number', parent),
					searchString = $.trim(input.val().toLowerCase().replace(/[^0-9]/g, '')),
					matches = [],
					cache = {};

				$.each(rows, function(k, v) {
					var data = $(this).data(),
						key = data.phone_number;

					cache[key] = $(this);
				});

				$('#empty_search', parent).hide();

				if (!searchString) {
					rows.show();
				}
				else {
					rows.hide();
					$.each(cache, function(phone_number, rowArray) {
						if (phone_number.indexOf(searchString)>-1) {
							matches.push(rowArray);
						}
					});

					if(matches.length > 0) {
						$.each(matches, function(k, v) {
							$(v).show();
						});
					}
					else {
						$('#empty_search', parent).show();
					}
				}
			});
		},

		renderList: function(_id, _parent, _callback, _data) {
			var self = this,
				callback = _callback,
				parent = _parent || $('#ws-content'),
				id = _id || 0,
				refreshList = function(data) {
					$('#list_pbxs_navbar', parent).show();
					$('#unassigned_numbers', parent).show();

					var mapCrossbarData = function(data) {
							var newList = [];

							if(data.length > 0) {
								var i = 0;
								$.each(data, function(key, val) {
									var countDids = 0;

									$.each(val.DIDs, function(number,obj){
										countDids ++
									});

									newList.push({
										id: i,
										name: val.server_name || '(no name)',
										count: countDids
									});
									i++;
								});
							}

							return newList;
						},
						dataTemplate = {
							numbers: mapCrossbarData(data)
						};

					$('#list_pbxs_navbar #pbxs_manager_listpanel', parent).empty()
																		  .append(monster.template(self, 'pbxsListElement', dataTemplate))
																		  .show();

					$('#list_pbxs_navbar #pbxs_manager_listpanel .pbx-wrapper[data-id='+id+']', parent).addClass('selected');

					$.each(data, function(k, v) {
						var imgLink = v.server_type ? v.server_type.replace('.','').toLowerCase() : 'other';

						$.inArray(imgLink, self.listAvailablePbxs()) < 0 ? imgLink = 'other' : true;

						$('#pbxs_manager_listpanel .pbx-wrapper[data-id="'+k+'"] .img-wrapper', parent).append('<img class="img_style" src="apps/pbxs/static/images/endpoints/'+ imgLink +'.png" height="49" width=72"/>');
					});

					callback && callback(data);
				};

			if(_data) {
				refreshList(_data);
			}
			 else {
				self.listServers(function(data, status) {
					refreshList(data);
				});
			}
		},

		listNumbersByPbx: function(id, _callback, _optional_data) {
			var self = this;

			if(id || id > -1) {
				monster.parallel({
					list_numbers: function(callback){
						self.listAllNumbers(function(_data_numbers) {
							callback(null, _data_numbers.data.numbers);
						});
					},
					account: function(callback){
						if(_optional_data) {
							callback(null, _optional_data);
						}
						else {
							self.getAccount(function(_data) {
								callback(null, _data.data);
							});
						}
					}
				},
				function(err, results){
					var json_data = {};

					$.each(results.account.servers[id].DIDs, function(k, v) {
						if(k in results.list_numbers) {
							json_data[k] = results.list_numbers[k];
						}
					});

					_callback && _callback(json_data);
				});
			}
		},

		listAvailableNumbers: function(_callback) {
			var self = this;

			monster.parallel({
				listNumbers: function(callback){
					self.listAllNumbers(function(_dataNumbers) {
						callback(null, _dataNumbers.data);
					});
				}
			},
			function(err, results){
				var tabData = [];

				//Build available numbers list
				if('numbers' in results.listNumbers) {
					$.each(results.listNumbers.numbers, function(k, v) {
						if(!v.used_by) {
							tabData.push(k);
						}
					});
				}

				_callback && _callback(tabData);
			});
		}
	};

	return app;
});
