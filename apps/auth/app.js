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
			'auth.user.update': {
				url: 'accounts/{accountId}/users/{userId}',
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
			'auth.getUser': {
				url: 'accounts/{accountId}/users/{userId}',
				verb: 'GET'
			},
			'auth.getAccount': {
				url: 'accounts/{accountId}',
				verb: 'GET'
			}
		},

		subscribe: {
			'auth.activate' : '_activate',
			'auth.authenticate' : '_authenticate',
			'auth.landing': '_landing',
			'auth.loadAccount' : '_loadAccount',
			'auth.loginClick': '_loginClick',
			'auth.logout': '_logout',
			'auth.newPassword': '_newPassword',
			'auth.recoverPassword' : '_recover',
			'auth.register' : '_register',
			'auth.sharedAuth' : '_sharedAuth',
			'auth.welcome' : '_login',
		},

		load: function(callback){
			var self = this;

			if(!$.cookie('monster-auth')) {
				monster.pub('auth.welcome');
			}
			else {
				var cookieData = $.parseJSON($.cookie('monster-auth'));

				self.authToken = cookieData.authToken;
				self.accountId = cookieData.accountId;
				self.userId = cookieData.userId;


				monster.pub('auth.loadAccount');
			}

			callback && callback(self);
		},

		render: function(container){

		},

		_activate: function() {
			var self = this;

			if(self.authToken == null) {
				monster.pub('auth.login');
			}
			else {
				monster.ui.confirm('Are you sure that you want to log out?', function() {
					$.cookie('monster-auth', null);

					$('#ws-content').empty();
				});
			}
		},

		_authenticate: function(login_data) {
			var self = this;

			monster.request({
				resource: 'auth.user_auth',
				data: {
					data: login_data
				},
				success: function (data, status) {
					self.accountId = data.data.account_id;
					self.authToken = data.auth_token;
					self.userId = data.data.owner_id;

					$('#ws-content').empty();

					if($('#remember_me').is(':checked')) {
						var cookieLogin = {};
						loginUsername ? cookieLogin.login = loginUsername : true;
						loginData.account_name ? cookieLogin.account_name = loginData.account_name : true;
						$.cookie('c_monster_login', JSON.stringify(cookieLogin), {expires: 30});
					}
					else{
						$.cookie('c_monster_login', null);
					}

					$.cookie('monster-auth', JSON.stringify(self, {expires: 30}));

					monster.pub('auth.loadAccount');
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

		_landing: function(args) {
			var self = this,
				parent = args.parent || $('.ws-content'),
				html = monster.template(self, templates.landing, args.data);

			parent
			.empty()
			.append(html);
		},

		_loadAccount: function(args) {
			var self = this;

			monster.parallel({
				account: function(callback) {
					self._getAccount(function(data) {
						callback(null, data.data);
					},
					function(data) {
						callback('error account', data);
					});
				},
				user: function(callback) {
					self._getUser(function(data) {
						callback(null, data.data);
					},
					function(data) {
						callback('error user', data);
					});
				}
			},
			function(err, results) {
				var hasDefaultApp = false,
					defaultApp;

				if(err) {
					monster.ui.alert('error', 'An error occurred while loading your account.', function() {
						$.cookie('monster-auth', null);
						window.location.reload();
					});
				}
				else {
					self.accountName = results.account.name;

					results.user.account_name = results.account.name;
					results.user.apps = results.user.apps || {};

					monster.apps['auth'].currentUser = results.user;
					monster.apps['auth'].currentAccount = results.account;

					$.each(results.user.apps, function(k, v) {
						if(v['default']) {
							hasDefaultApp = true;
							v.id = k;
							defaultApp = v;
						}
					});


					if(results.user.require_password_update) {
						monster.pub('auth.new_password', json.data);
					}

					if(!hasDefaultApp) {
						monster.pub('auth.landing', {
							parent: $('.ws-content'),
							data: results.user
						});
					}
					else {
						monster.pub('core.loadApps', {
							defaultApp: defaultApp
						});
					}
				}
			});
		},

		_login: function() {
			var self = this,
				accountName = self._getAccountName(),
				realm = self._getRealm(),
				cookieLogin = $.parseJSON($.cookie('monster.login')) || {},
				templateData = {
					label: {
						login: 'Login:'
					},
					username: cookieLogin.login || '',
					requestAccountName: (realm || accountName) ? false : true,
					accountName: accountName || cookieLogin.accountName || '',
					rememberMe: cookieLogin.login || cookieLogin.accountName ? true : false,
					showRegister: monster.config.hide_registration || false
				},
				loginHtml = monster.template(self, templates.login, templateData),
				codeHtml = monster.template(self, templates.code, templateData),
				content = $('#welcome_page .right_div');

			content.empty().append(loginHtml);

			content.find(templateData.username !== '' ? '#password' : '#login').focus();

			content.find('.login').on('click', function(event){
				event.preventDefault();

				monster.pub('auth.loginClick', {
					realm: realm,
					accountName: accountName
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

		_logout: function() {
			var self = this;

			monster.ui.confirm(self.i18n.active().confirmLogout, function() {
				$.cookie('monster-auth', null);

				window.location.reload();
			});
		},

		_newPassword: function(user_data) {
			var self = this,
				template = monster.template(self, templates.newPassword),
				dialog = monster.ui.dialog(template, {
					title: 'Please set a new password',
					width: '500px'
				});

			monster.validate.set(monster.config.validation_new_password, dialog);

			dialog.find('.btn_new_password').click(self.newPasswordClick);
		},

		_recover: function(args) {
			var self = this,
				dialog = monster.ui.dialog(monster.template(self, templates.recover, {}), {
					title: self.i18n.active().recover.title,
					width: '400px'
				});

			monster.validate.set(self.config.validation_recover, dialog);

			$('.btn_recover_password', dialog).click(function(event) {
				event.preventDefault();
				var data_recover = form2object('recover_password_form');

				data_recover.account_realm == '' ? delete data_recover.account_realm : true;
				data_recover.account_name == '' ? delete data_recover.account_name : true;
				data_recover.phone_number == '' ? delete data_recover.phone_number : true;

				monster.validate.is_valid(self.config.validation_recover, dialog, function() {
					monster.request({
						resource: 'auth.recover_password',
						data: {
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

			var dialogRegister = monster.ui.dialog(self.templates.register.tmpl({}), {
				title: 'Register a New Account',
				resizable : false,
				modal: true
			});

			$('#username', dialogRegister).focus();

			monster.validate.set(monster.config.validation, dialogRegister);

			$('button.register', dialogRegister).click(self._registerClick);
		},

		_sharedAuth: function (args) {
			var self = this;

			var restData = {
					data: {
						realm : self.realm,
						accountId : self.accountId,
						shared_token : self.authToken
					}
				},
				success = function(app) {
					app.accountId = self.accountId;
					app.userId = self.userId;

                    args.callback && args.callback();
				};

			if(self.apiUrl !== args.app.apiUrl) {
				monster.request({
                    resource: 'auth.shared_auth',
                    data: restData,
                    success: function (json, xhr) {
						args.app.authToken = json.auth_token;

						success(args.app);
                    }
                });
			}
			else {
				args.app.authToken = this.authToken;

				success(args.app);
			}
		},

		_getAccount: function(success, error) {
			var self = this;

			monster.request({
				resource: 'auth.getAccount',
				data: {
					accountId: self.accountId
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

		_getUser: function(success, error) {
			var self = this;

			monster.request({
				resource: 'auth.getUser',
				data: {
					accountId: self.accountId,
					userId: self.userId,
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

			if(monster.querystring('name') != null) {
				name = monster.querystring('name');
			}
			else {
				host = window.location.href.match(/^(?:https?:\/\/)*([^\/?#]+).*$/)[1];
				host_parts = host.split('.');

				if(typeof monster.config.base_urls == 'object' && host_parts.slice(1).join('.') in monster.config.base_urls) {
					name = host_parts[0];
				}
			}

			return name;
		},

		_getRealm: function() {
			var self = this,
				realm = '';

			if(monster.querystring('realm') != null) {
				realm = monster.querystring('realm');
			}

			return realm;
		},

		_loginClick: function(data) {
			var self = this,
				loginUsername = $('#login').val(),
				loginPassword = $('#password').val(),
				loginAccountName = $('#account_name').val(),
				hashedCreds = $.md5(loginUsername + ':' + loginPassword),
				loginData = {};

			if(data.realm) {
				loginData.realm = data.realm;
			}
			else if(data.accountName) {
				loginData.account_name = data.accountName;
			}
			else if(loginAccountName) {
				loginData.account_name = loginAccountName;
			}
			else {
				loginData.realm = loginUsername + (typeof monster.config.realm_suffix === 'object' ? monster.config.realm_suffix.login : monster.config.realm_suffix);
			}

			monster.pub('auth.authenticate', _.extend({ credentials: hashedCreds }, loginData));
		},

		loginRegisterClick: function(e) {
			e.preventDefault();

			var self = this,
				code = $('input#code', code_html).val();

			if(code != "" && code != null) {
				monster.request({
					resource: 'auth.invite_code',
					data: {
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

			var self = this,
				data_new_password = form2object('new_password_form');

			monster.validate.is_valid(self.config.validation_new_password, dialog_new_password, function() {
				if(data_new_password.new_password1 === data_new_password.new_password2) {
					user_data.password = data_new_password.new_password1;
					user_data.require_password_update = false;

					monster.request({
						resource: 'auth.user.update',
						data: {
							accountId: self.accountId,
							userId: user_data.id,
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

		recoverClick: function(e) {
			e.preventDefault();

			monster.pub('auth.recoverPassword');
		},

		registerClick: function(event) {
			event.preventDefault();

			var self = this;

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

						if(monster.querystring('realm') != null) {
							realm = monster.querystring('realm');
						}

						var rest_data = {
							crossbar : true,
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
