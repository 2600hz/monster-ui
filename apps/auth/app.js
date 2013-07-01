define(function(require){
	var $ = require("jquery"),
		_ = require("underscore"),
		monster = require("monster");

	var app = {

		name: "auth",

		i18n: [ 'en-US' ],

		requests: {
			'auth.userAuth': {
				url: 'user_auth',
				verb: 'PUT'
			},
			'auth.sharedAuth': {
				url: 'shared_auth',
				verb: 'PUT'
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
			'auth.authenticate' : '_authenticate',
			'auth.loadAccount' : '_loadAccount',
			'auth.loginClick': '_loginClick',
			'auth.logout': '_logout',
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
				self.isReseller = cookieData.isReseller;

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
				resource: 'auth.userAuth',
				data: {
					data: login_data
				},
				success: function (data, status) {
					self.accountId = data.data.account_id;
					self.authToken = data.auth_token;
					self.userId = data.data.owner_id;
					self.isReseller = data.data.is_reseller;

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
					monster.ui.alert('error', self.i18n.active().errorLoadingAccount, function() {
						$.cookie('monster-auth', null);
						window.location.reload();
					});
				}
				else {
					results.user.account_name = results.account.name;
					results.user.apps = results.user.apps || {};

					self.currentUser = results.user;
					// This account will remain unchanged, it should be used by non-masqueradable apps
					self.originalAccount = results.account;
					// This account will be overriden when masquerading, it should be used by masqueradable apps
					self.currentAccount = $.extend(true, {}, self.originalAccount);

					$.each(results.user.apps, function(k, v) {
						if(v['default']) {
							hasDefaultApp = true;
							v.id = k;
							defaultApp = v;
						}
					});

					monster.pub('core.loadApps', {
						defaultApp: defaultApp
					});
				}
			});
		},

		_login: function() {
			var self = this,
				accountName = '',
				realm = '',
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
				loginHtml = monster.template(self, 'login', templateData),
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
		},

		_logout: function() {
			var self = this;

			monster.ui.confirm(self.i18n.active().confirmLogout, function() {
				$.cookie('monster-auth', null);

				window.location.reload();
			});
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
                    resource: 'auth.sharedAuth',
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
		}
	}

	return app;
});
