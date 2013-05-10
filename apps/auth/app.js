define(function(require){
	var $ = require("jquery"),
		_ = require("underscore"),
		monster = require("monster"),

		templates = {
			recover: 'recover-password',
			login: 'login',
			register: 'register',
			newPassword: 'new-password',
			code: 'code',
			landing: 'landing'
		},

		recoverRegex = [
			{ name: '#username', regex: /^.+$/ },
			{ name: '#account_name', regex: /^.*$/ },
			{ name: '#account_realm', regex: /^.*$/ },
			{ name: '#phone_number', regex: /^.*$/ }
		];

	var app = {

		name: "auth",

		i18n: [ 'en-US' ],

		requests: {
			'auth.user_auth': {
				url: 'user_auth',
				verb: 'PUT'
			},
			'auth.shared_auth': {
				url: 'shared_auth',
				verb: 'PUT'
			},
			'auth.register': {
				url: 'signup',
				verb: 'PUT'
			},
			'auth.activate': {
				url: 'signup/{activation_key}',
				verb: 'POST'
			},
			'auth.get_user': {
				url: 'accounts/{account_id}/users/{user_id}',
				verb: 'GET'
			},
			'auth.user.update': {
				url: 'accounts/{account_id}/users/{user_id}',
				verb: 'POST'
			},
			'auth.recover_password': {
				url: 'user_auth/recovery',
				verb: 'PUT'
			},
			'auth.invite_code': {
				url: 'onboard/invite/{invite_code}',
				verb: 'GET'
			},
			'auth.get_account': {
				url: 'accounts/{account_id}',
				verb: 'GET'
			}
		},

		subscribe: {

			'auth.activate' : '_activate',
			'auth.authenticate' : '_authenticate',
			'auth.landing': '_landing',
			'auth.loadAccount' : '_loadAccount',
			'auth.login' : '_loginPopup',
			'auth.login-click': '_loginClick',
			'auth.logout': '_logout',
			'auth.newPassword': '_newPassword',
			'auth.recoverPassword' : '_recover',
			'auth.register' : '_register',
			'auth.sharedAuth' : '_sharedAuth',
			'auth.welcome' : '_login',

			'core.loaded': '_coreLoaded'

			//'auth.saveRegistration' : 'save_registration',
		},

		load: function(callback){
			var self = this,
				accountName = monster.querystring('account_name'),
				authUrl = monster.querystring('auth_url');

			if(!$.cookie('monster-auth')) {
				monster.pub('auth.welcome');
			}

			if(authUrl) {
				monster.apps['auth'].api_url = authUrl;
			}
			else {
				var host = window.location.hostname; //URL.match(/^(?:https?:\/\/)*([^\/?#]+).*$/)[1];

				if(typeof monster.config.base_urls == 'object' && host in monster.config.base_urls) {
					if('auth_url' in monster.config.base_urls[host]) {
						monster.apps['auth'].api_url = monster.config.base_urls[host].auth_url;
					}
				}
			}

			callback && callback(self);
		},

		render: function(container){

		},

		// subscription handlers

		_activate: function() {
			if(monster.apps['auth'].auth_token == null) {
				monster.pub('auth.login');
			}
			else {
				monster.confirm('Are you sure that you want to log out?', function() {
					// Remove any individual keys
					_.each(monster.apps, function(k, v) {
						// TODO: ADD APP UNLOADING CODE HERE. Remove CSS and scripts. This should inherently delete apps.

						monster.apps[k].realm = null;
						monster.apps[k].auth_token = null;
						monster.apps[k].user_id = null;
						monster.apps[k].account_id = null;
					});

					$.cookie('monster-auth', null);

					$('#ws-content').empty();
				});
			}
		},

		_authenticate: function() {
			var self = this;
			monster.request({
				resource: 'auth.establish',
				data : {
					username: '',
					passwordhash: ''
				},
				success: function(data) {
					self.session.authenticated = true;
					self.session.token         = data.auth_token;
					self.session.expires       = data.expires;
					monster.ui.alert('User authenticated');
				}
			});
		},

		_coreLoaded: function () {

			if(monster.querystring('activation_key')) {
				var data = {
					crossbar: true,
					api_url : monster.apps['auth'].api_url,
					activation_key: monster.querystring('activation_key'),
					data: {}
				};

				monster.postJSON('auth.activate', data, function(data) {

					monster.ui.alert('info','You are now registered! Please log in.', function() {
						monster.pub('auth.welcome', {username: data.data.user.username});
					});

					if(data.authToken != '' && data.authToken != 'null'){
						monster.apps['auth'].account_id = data.data.account.id;
						monster.apps['auth'].authToken = data.authToken;
						monster.apps['auth'].user_id = data.data.user.id;
						monster.apps['auth'].realm = data.data.account.realm;
						monster.pub('auth.load_account');
					}
				});
			}
			else if(monster.querystring('recover_password')) {
				monster.ui.alert('You are in the Recover Password tool.');
			}

			if(cookie_data = $.cookie('monster-auth')) {
				$('#ws-content').empty();
				eval('monster.apps["auth"] = ' + cookie_data);
				monster.pub('auth.load_account');
			}
		},

		_landing: function(parent) {
			var self = this,
			parent = parent || $('.ws-content'),
			html = monster.template(self, templates.landing);

			parent
				.empty()
				.append(html);
		},

		_loadAccount: function(args) {
			monster.log('Loading your apps!');

			var self = this,
				authData = {
					crossbar : true,
					account_id : monster.apps['auth'].account_id,
					api_url : monster.apps['auth'].api_url,
					user_id : monster.apps['auth'].user_id
				};

			function success(data){
				monster.getJSON('auth.get_user', rest_data,
					function (json, xhr) {
						json.data.account_name = (_data.data || {}).name || monster.config.company_name;
						json.data.apps = json.data.apps || {};

						monster.pub('auth.account.loaded', json.data);

						$.each(json.data.apps, function(k, v) {
							monster.log('WhApps: Loading ' + k + ' from URL ' + v.api_url);
							monster.apps[k] = v;

							if(!('account_id' in v)) {
								monster.apps[k].account_id = monster.apps['auth'].account_id;
							}

							if(!('user_id' in v)) {
								monster.apps[k].user_id = monster.apps['auth'].user_id;
							}

							monster.module.loadApp(k, function() {
								this.init();
								monster.log('WhApps: Initializing ' + k);
							});
						});

						if(json.data.require_password_update) {
							monster.pub('auth.new_password', json.data);
						}

						var landing = true;

						/* We check if there are no default application */
						$.each(json.data.apps, function(k, v) {
							if(v['default']) {
								landing = false;
							}
						});

						if(landing) {
							monster.pub('auth.landing', $('.ws-content'));
						}

					},
					function(data, status) {
						monster.ui.alert('error', 'An error occurred while loading your account.', function() {
							$.cookie('c_monster_auth', null);
							window.location.reload();
						});
					}
					);
			};

			function failure(error){
				monster.ui.alert('error', 'An error occurred while loading your account.', function() {
					$.cookie('c_monster_auth', null);
					window.location.reload();
				});
			};

			self._getAccount(success, failure);
		},

		_login: function(args) {
			var self = this,
			username = (typeof args == 'object' && 'username' in args) ? args.username : '',
			account_name = self._getAccountName(),
			realm = self._getRealm(),
			cookie_login = $.parseJSON($.cookie('monster.login')) || {},
			templateData = {
				label: {
					login: 'Login:'
				},
				username: username || cookie_login.login || '',
				requestAccountName: (realm || account_name) ? false : true,
				accountName: account_name || cookie_login.account_name || '',
				rememberMe: cookie_login.login || cookie_login.account_name ? true : false,
				showRegister: monster.config.hide_registration || false
			};
			var loginHtml = monster.template(self, templates.login, templateData);
			var codeHtml = monster.template(self, templates.code, templateData);
			var content = $('.right_div', '#welcome_page');

			content.empty().append(loginHtml);

			if(templateData.username != '') {
				content.find('#password').focus();
			}
			else {
				content.find('#login').focus();
			}

			content.find('.login').click(function(event){

				event.preventDefault();

				monster.pub('auth.login-click', {
					realm: realm,
					accountName: account_name
				});
			});
			content.find('a.recover_password').click(self.recoverClick);

			content.find('button.register').click(function(e) {
				e.preventDefault();

				if(!monster.config.nav.register) {
					if(monster.config.register_type == "onboard") {
						var code = $(codeHtml);

						code.find('button.register').click(self.loginRegisterClick);

						$('#ws-content')
						.empty()
						.append(code);
					}
					else {
						monster.pub('auth.register');
					}
				}
				else {
					window.location.href = monster.config.nav.register;
				}
			});

		},

		_loginPopup: function(args) {
			var self = this,
			username = (typeof args == 'object' && 'username' in args) ? args.username : '',
			account_name = self._getAccountName(),
			realm = self._getRealm(),
			data = {
				username: username,
				request_account_name: (realm || account_name) ? false : true,
				account_name: account_name
			},
			html = monster.template(self, templates.login, data);

			var dialog = monster.dialog(html, {
				title : 'Login',
				resizable : false,
				width: '340',
				modal: true
			});

			if(username != '') {
				dialog.find('#password').focus();
			}

			dialog.find('.login').click(self.popupLoginClick);

			$('a.register', dialogDiv).click(function(event) {
				event.preventDefault();

				monster.pub('auth.register');

				$(dialogDiv).dialog('close');
			});

			$('a.recover_password', dialogDiv).click(function(event) {
				event.preventDefault();

				monster.pub('auth.recover_password');

				$(dialogDiv).dialog('close');
			});
		},

		_logout: function() {
			monster.confirm('Are you sure that you want to log out?', function() {

				_.each(monster.apps, function(k, v) { // Remove any individual keys
				// TODO: ADD APP UNLOADING CODE HERE. Remove CSS and scripts. This should inherently delete apps.

					monster.apps[k].realm = null;
					monster.apps[k].authToken = null;
					monster.apps[k].user_id = null;
					monster.apps[k].account_id = null;
				});

				$.cookie('monster-auth', null);

				$('#ws-content').empty();
			});
		},

		_newPassword: function(user_data) {
			var self = this;

			var template = monster.template(self, templates.newPassword),
				dialog = monster.dialog(template, {
					title: 'Please set a new password',
					width: '500px'
				});

			monster.validate.set(monster.config.validation_new_password, dialog);

			dialog.find('.btn_new_password').click(self.newPasswordClick);
		},

		_recover: function(args) {
			var self = this;

			var dialog = monster.dialog(THIS.templates.recover_password.tmpl({}), {
				title: i18n.t('auth.auth.recover_popup_title'),
				width: '400px'
			});

			monster.validate.set(THIS.config.validation_recover, dialog);

			$('.btn_recover_password', dialog).click(function(event) {
				event.preventDefault();
				var data_recover = form2object('recover_password_form');

				data_recover.account_realm == '' ? delete data_recover.account_realm : true;
				data_recover.account_name == '' ? delete data_recover.account_name : true;
				data_recover.phone_number == '' ? delete data_recover.phone_number : true;

				monster.validate.is_valid(THIS.config.validation_recover, dialog, function() {
					monster.request({
						resource: 'auth.recover_password',
						data: {
							api_url: monster.apps['auth'].api_url,
							data: data_recover
						},
						success: function(_data) {
							monster.ui.alert('info', _data.data);
							dialog.dialog('close');
						},
						error: function(error) {
							var message = 'Error ' + error.statusText + '<br/>';
							message.data = error.responseText;
							monster.ui.alert('error', message);
						}
					});
				});
			});
		},

		_register: function () {
			var self = this;

			var dialogRegister = monster.dialog(THIS.templates.register.tmpl({}), {
				title: 'Register a New Account',
				resizable : false,
				modal: true
			});

			$('#username', dialogRegister).focus();

			monster.validate.set(monster.config.validation, dialogRegister);

			$('button.register', dialogRegister).click(self._registerClick);
		},

		_sharedAuth: function (args) {
				var THIS = this;

				var rest_data = {
					api_url : monster.apps[args.appName].api_url,
					data: {
						realm : monster.apps['auth'].realm,                     // Treat auth as global
						account_id : monster.apps['auth'].account_id,           // Treat auth as global
						shared_token : monster.apps['auth'].authToken          // Treat auth as global
					}
				};

				if(monster.apps['auth'].api_url != monster.apps[args.appName].api_url) {
					monster.putJSON('auth.shared_auth', rest_data, function (json, xhr) {
                    // If this is successful, we'll get a server-specific auth token back
                    _getUser(json.authToken, args.appName, args.callback);
                  });
				}
				else {
					_getUser(monster.apps['auth'].authToken, args.appName, args.callback);
				}
		},


		// util methods

		_getAccount: function(success, error) {
			monster.request({
				resource: 'auth.get_account',
				data: {
					api_url: monster.apps['auth'].api_url,
					account_id: monster.apps['auth'].account_id
				},
				success: function(_data) {
				 if(typeof success === 'function') {
				  success(_data);
				 }
				},
				error: function(err) {
					if(typeof error === 'function') {
						error(err);
					}
				}
			});
		},

		_getAccountName: function() {
			var name = '',
			host,
			host_parts;

			if('name' in monster.querystring) {
				name = monster.querystring['name'];
			}
			else {
				host = URL.match(/^(?:https?:\/\/)*([^\/?#]+).*$/)[1];
				host_parts = host.split('.');

				if(typeof monster.config.base_urls == 'object' && host_parts.slice(1).join('.') in monster.config.base_urls) {
					name = host_parts[0];
				}
			}

			return name;
		},

		_getRealm: function() {
			var realm = '';

			if('realm' in monster.querystring) {
				realm = monster.querystring['realm'];
			}

			return realm;
		},

		_getUser: function(authToken, appName, callback) {
			var options = {
				account_id: monster.apps['auth'].account_id,
				api_url : monster.apps['auth'].api_url,
				user_id: monster.apps['auth'].user_id
			};

			monster.apps[appName] = $.extend(true, {}, options, monster.apps[appName]);
			monster.apps[appName]['authToken'] = authToken;

			monster.getJSON('auth.get_user', options, function(json, xhr) {
				if(typeof callback == 'function') {
					callback();
				}
			});
		},

		// event handlers

		_loginClick: function(data) {

			var login_username = $('#login').val(),
				login_password = $('#password').val(),
				login_account_name = $('#account_name').val(),
				hashed_creds = $.md5(login_username + ':' + login_password),
				login_data = {};


			if(data.realm) {
				login_data.realm = data.realm;
			}
			else if(data.accountName) {
				login_data.account_name = data.accountName;
			}
			else if(login_account_name) {
				login_data.account_name = login_account_name;
			}
			else {
				login_data.realm = login_username + (typeof monster.config.realm_suffix === 'object' ? monster.config.realm_suffix.login : monster.config.realm_suffix);
			}

			monster.request({
				resource: 'auth.user_auth',
				data: _.extend({ credentials: hashed_creds }, login_data),
				success: function (data, status) {
					monster.apps['auth'].account_id = data.data.account_id;
					monster.apps['auth'].auth_token = data.auth_token;
					monster.apps['auth'].user_id = data.data.owner_id;
					monster.apps['auth'].realm = realm;

		      // Deleting the welcome message
		      $('#ws-content').empty();

		      if($('#remember_me').is(':checked')) {
		      	var cookie_login = {};
		      	login_username ? cookie_login.login = login_username : true;
		      	login_data.account_name ? cookie_login.account_name = login_data.account_name : true;
		      	$.cookie('c_monster_login', JSON.stringify(cookie_login), {expires: 30});
		      }
		      else{
		      	$.cookie('c_monster_login', null);
		      }

		      $.cookie('c_monster_auth', JSON.stringify(monster.apps['auth']), {expires: 30});

		      monster.pub('auth.load_account');
		    },
		    error: function(error) {
		    	if(error.status === 400) {
		    		monster.ui.alert('Invalid credentials, please check that your username and account name are correct.');
		    	}
		    	else if($.inArray(error.status, [401, 403]) > -1) {
		    		monster.ui.alert('Invalid credentials, please check that your password and account name are correct.');
		    	}
		    	else if(error.statusText === 'error') {
		    		monster.ui.alert('Oh no! We are having trouble contacting the server, please try again later...');
		    	}
		    	else {
		    		monster.ui.alert('An error was encountered while attempting to process your request (Error: ' + status + ')');
		    	}
		    }
	    });
		},

		loginRegisterClick: function(e) {
			e.preventDefault();
			var code = $('input#code', code_html).val();

			if(code != "" && code != null) {
				monster.request({
					resource: 'auth.invite_code',
					data: {
						api_url: monster.apps.auth.api_url,
						invite_code: code,
					},
					success: function(_data, status) {
						monster.pub('onboard.register', {
							invite_code: code
						});
					},
					error: function(error) {
						switch(error.status) {
							case '404':
							monster.ui.alert('error', 'Invalid invite code !');
							break;
							case '410':
							monster.ui.alert('error', 'Invite code already used !');
							break;
							default:
							monster.ui.alert('error', '<p>An error occurred</p>' + monster.print_r(_data));
							break;
						}
					}
				});
			}
		},

		newPasswordClick: function(event) {
			event.preventDefault();
			var data_new_password = form2object('new_password_form');

			monster.validate.is_valid(THIS.config.validation_new_password, dialog_new_password, function() {
				if(data_new_password.new_password1 === data_new_password.new_password2) {
					user_data.password = data_new_password.new_password1;
					user_data.require_password_update = false;

					monster.request({
						resource: 'auth.user.update',
						data: {
							api_url: monster.apps.auth.api_url,
							account_id: monster.apps.auth.account_id,
							user_id: user_data.id,
							data: user_data
						},
						success: function(_data, status) {
							monster.ui.alert('info', 'Password updated !');
							dialog_new_password.dialog('close');
						},
						error: function(error) {
							monster.ui.alert('error', 'Error :' + error.status);
						}
					});
				}
				else {
					$('#new_password1', dialog_new_password).val('');
					$('#new_password2', dialog_new_password).val('');
					monster.ui.alert('Password typed don\'t match. Please retype your new password');
				}
			});
		},

		popupLoginClick: function(event) {
			event.preventDefault();

			var login_username = $('#login', dialogDiv).val(),
			login_password = $('#password', dialogDiv).val(),
			login_account_name = $('#account_name', dialogDiv).val(),
			hashed_creds = $.md5(login_username + ':' + login_password),
			login_data = {};

			if(realm) {
				login_data.realm = realm;
			}
			else if(account_name) {
				login_data.account_name = account_name;
			}
			else if(login_account_name) {
				login_data.account_name = login_account_name;
			}
			else {
				login_data.realm = login_username + (typeof monster.config.realm_suffix === 'object' ? monster.config.realm_suffix.login : monster.config.realm_suffix);
			}

			monster.putJSON('auth.user_auth', {
				api_url: monster.apps['auth'].api_url,
				data: $.extend(true, {
					credentials: hashed_creds
				}, login_data)
			},
			function (data, status) {
				monster.apps['auth'].account_id = data.data.account_id;
				monster.apps['auth'].auth_token = data.auth_token;
				monster.apps['auth'].user_id = data.data.owner_id;
				monster.apps['auth'].realm = realm;

				$(dialogDiv).dialog('close');

					// Deleting the welcome message
					$('#ws-content').empty();

					$.cookie('c_monster_auth', JSON.stringify(monster.apps['auth']), {expires: 30});

					monster.pub('auth.load_account');
				},
				function(data, status) {
					if(status === 400) {
						monster.ui.alert('Invalid credentials, please check that your username and account name are correct.');
					}
					else if($.inArray(status, [401, 403]) > -1) {
						monster.ui.alert('Invalid credentials, please check that your password and account name are correct.');
					}
					else if(status === 'error') {
						monster.ui.alert('Oh no! We are having trouble contacting the server, please try again later...');
					}
					else {
						monster.ui.alert('An error was encountered while attempting to process your request (Error: ' + status + ')');
					}
				}
			);
		},

		recoverClick: function(e) {
			e.preventDefault();

			monster.pub('auth.recover_password');
		},

		registerClick: function(event) {

			event.preventDefault();

			monster.validate.is_valid(monster.config.validation, dialogRegister, function() {
				if ($('#password', dialogRegister).val() == $('#password2', dialogRegister).val()) {
					if(monster.is_password_valid($('#password', dialogRegister).val())) {
						var realm;

						if(app.request_realm) {
							realm = $('#realm', dialogRegister).val();
						}
						else {
							realm = $('#username', dialogRegister).val() + (typeof monster.config.realm_suffix === 'object' ? monster.config.realm_suffix.register : monster.config.realm_suffix);
						}

						// If realm was set in the URL, override all
						if('realm' in monster.querystring) {
							realm = monster.querystring['realm'];
						}

						var rest_data = {
							crossbar : true,
							api_url : monster.apps['auth'].api_url,
							data : {
								'account': {
									'realm': realm,
									'name' :$('#name', dialogRegister).val(),
									'app_url': URL
								},
								'user': {
									'username':$('#username', dialogRegister).val(),
									'password' : $('#password', dialogRegister).val(),
									'first_name': $('#first_name', dialogRegister).val() ,
									'last_name':$('#last_name', dialogRegister).val(),
									'email': $('#email', dialogRegister).val(),
									'apps': monster.config.register_apps
								}
							}
						};

						monster.putJSON('auth.register', rest_data, function (json, xhr) {
							$.cookie('c_monster.login', null);
							monster.ui.alert('info','Registered successfully. Please check your e-mail to activate your account!');
							dialogRegister.dialog('close');
						});
					}
				}
				else {
					monster.ui.alert('Please confirm your password');
				}
			},
			function() {
				monster.ui.alert('There were errors on the form, please correct!');
			});
		}

	}

	return app;
});
