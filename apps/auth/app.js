define(function(require){
	var $ = require("jquery"),
		_ = require("underscore"),
		monster = require("monster"),
		toastr = require("toastr");

	var app = {

		name: 'auth',

		i18n: [ 'en-US', 'fr-FR' ],

		requests: {
			'auth.userAuth': {
				url: 'user_auth',
				verb: 'PUT'
			},
			'auth.sharedAuth': {
				url: 'shared_auth',
				verb: 'PUT'
			},
			'auth.pinAuth': {
				url: 'pin_auth',
				verb: 'PUT'
			},
			'auth.getUser': {
				url: 'accounts/{accountId}/users/{userId}',
				verb: 'GET'
			},
			'auth.updateUser': {
				url: 'accounts/{accountId}/users/{userId}',
				verb: 'POST'
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
			'auth.conferenceLogin': '_conferenceLogin',
			'auth.clickLogout': '_clickLogout',
			'auth.logout': '_logout',
			'auth.initApp' : '_initApp',
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
				self.resellerId = cookieData.resellerId;
				self.installedApps = cookieData.installedApps;

				monster.pub('auth.loadAccount');
			}

			callback && callback(self);
		},

		render: function(container){

		},

		_authenticate: function(loginData) {
			var self = this;

			monster.request({
				resource: 'auth.userAuth',
				data: {
					data: loginData
				},
				success: function (data, status) {
					self.accountId = data.data.account_id;
					self.authToken = data.auth_token;
					self.userId = data.data.owner_id;
					self.isReseller = data.data.is_reseller;
					self.resellerId = data.data.reseller_id;
					if("apps" in data.data) {
						self.installedApps = data.data.apps;
					} else {
						self.installedApps = [];
						toastr.error(self.i18n.active().toastrMessages.appListError);
					}

					if($('#remember_me').is(':checked')) {
						var cookieLogin = {
							login: $('#login').val(),
							accountName: loginData.account_name
						};

						$.cookie('monster-login', JSON.stringify(cookieLogin), {expires: 30});
					}
					else{
						$.cookie('monster-login', null);
					}

					var cookieAuth = {
						language: data.data.language,
						authToken: self.authToken,
						accountId: self.accountId,
						userId: self.userId,
						isReseller: self.isReseller,
						resellerId: self.resellerId,
						installedApps: self.installedApps
					};

					$.cookie('monster-auth', JSON.stringify(cookieAuth));

					$('#ws-content').empty();

					monster.pub('auth.loadAccount');
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
				var defaultApp;

				if(err) {
					$.cookie('monster-auth', null);
					window.location.reload();
				}
				else {
					monster.util.autoLogout();
					$('.signout').show();

					results.user.account_name = results.account.name;
					results.user.apps = results.user.apps || {};
					results.account.apps = results.account.apps || {};

					/* If user has a preferred language, then set the i18n flag with this value, if not, check if the account has a default preferred language */
					if('language' in results.user) {
						monster.config.i18n.active = results.user.language;
					}
					else if('language' in results.account) {
						monster.config.i18n.active = results.account.language;
					}

					var accountApps = results.account.apps,
						fullAppList = {};

					_.each(self.installedApps, function(val) {
						fullAppList[val.id] = val;
					});

					if(results.user.appList && results.user.appList.length > 0) {
						for(var i = 0; i < results.user.appList.length; i++) {
							var appId = results.user.appList[i];
							if(appId in fullAppList && appId in accountApps) {
								var accountAppUsers = $.map(accountApps[appId].users, function(val) {return val.id;});
								if(accountApps[appId].all || accountAppUsers.indexOf(results.user.id) >= 0) {
									defaultApp = fullAppList[appId].name;
									break;
								}
							}
						}
					} else {
						var userAppList = $.map(fullAppList, function(val) {
							if(val.id in accountApps) {
								var accountAppUsers = $.map(accountApps[val.id].users, function(val) {return val.id;});
								if(accountApps[val.id].all || accountAppUsers.indexOf(results.user.id) >= 0) {
									return val;
								}
							}
						});

						if(userAppList && userAppList.length > 0) {
							userAppList.sort(function(a, b) {
								return a.label < b.label ? -1 : 1;
							});

							results.user.appList = $.map(userAppList, function(val) {
								return val.id;
							});

							defaultApp = fullAppList[results.user.appList[0]].name;

							monster.request({
								resource: 'auth.updateUser',
								data: {
									accountId: results.account.id,
									userId: results.user.id,
									data: results.user
								},
								success: function(_data, status) {},
								error: function(_data, status) {}
							});
						}
					}

					self.currentUser = results.user;
					// This account will remain unchanged, it should be used by non-masqueradable apps
					self.originalAccount = results.account;
					// This account will be overriden when masquerading, it should be used by masqueradable apps
					self.currentAccount = $.extend(true, {}, self.originalAccount);

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
				cookieLogin = $.parseJSON($.cookie('monster-login')) || {},
				templateName = monster.config.appleConference ? 'conferenceLogin' : 'login',
				templateData = {
					label: {
						login: 'Login:'
					},
					username: cookieLogin.login || '',
					requestAccountName: (realm || accountName) ? false : true,
					accountName: cookieLogin.accountName || '',
					rememberMe: cookieLogin.login || cookieLogin.accountName ? true : false,
					showRegister: monster.config.hide_registration || false
				},
				loginHtml = $(monster.template(self, templateName, templateData)),
				content = $('#welcome_page .right_div');

			loginHtml.find('.login-tabs a').click(function(e) {
				e.preventDefault();
				$(this).tab('show');
			});
			content.empty().append(loginHtml);

			content.find(templateData.username !== '' ? '#password' : '#login').focus();

			content.find('.login').on('click', function(event){
				event.preventDefault();

				if($(this).data('login_type') === 'conference') {
					monster.pub('auth.conferenceLogin');
				} else {
					monster.pub('auth.loginClick', {
						realm: realm,
						accountName: accountName
					});
				}
			});
		},

		_clickLogout: function() {
			var self = this;

			monster.ui.confirm(self.i18n.active().confirmLogout, function() {
				self._logout();
			});
		},

		_logout: function() {
			var self = this;

			$.cookie('monster-auth', null);

			window.location.reload();
		},

		_initApp: function (args) {
			var self = this,
				restData = {
					data: {
						realm : self.realm,
						accountId : self.accountId,
						shared_token : self.authToken
					}
				},
				success = function(app) {
					if(app.isMasqueradable !== false) { app.isMasqueradable = true; }
					app.accountId = app.isMasqueradable && self.currentAccount ? self.currentAccount.id : self.accountId;
					app.userId = self.userId;

                    args.callback && args.callback();
				},
				installedApp = _.find(self.installedApps, function(val) {
					return val.name === args.app.name;
				});

			if(installedApp && installedApp.api_url) {
				args.app.apiUrl = installedApp.api_url;
				if(args.app.apiUrl.substr(args.app.apiUrl.length-1) !== "/") {
					args.app.apiUrl += "/";
				}
			}

			if(self.apiUrl !== args.app.apiUrl) {
				/* Hacking the API URL */
				monster.request({
					apiUrl: args.app.apiUrl + 'shared_auth',
                    data: restData,
					resource: 'auth.sharedAuth',
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
		},

		_conferenceLogin: function(data) {
			var self = this,
				formData = form2object('user_login_form');

			_.each(formData.update, function(val, key) {
				if(!val) { delete formData.update[key]; }
			});
			monster.request({
				resource: 'auth.pinAuth',
				data: {
					data: formData
				},
				success: function (data, status) {
					self.accountId = data.data.account_id;
					self.authToken = data.auth_token;
					self.userId = null;
					self.isReseller = data.data.is_reseller;
					self.resellerId = data.data.reseller_id;

					$('#ws-content').empty();

					monster.apps.load('conferences', function(app) {
						app.userType = 'unregistered';
						app.user = formData;
						app.isModerator = data.data.is_moderator;
						app.conferenceId = data.data.conference_id;
						app.render($('#ws-content'));
					});
				},
				error: function(apiResponse, rawError) {
					var errorMessage = self.i18n.active().errors.generic;

					if(rawError.status in self.i18n.active().errors) {
						errorMessage = self.i18n.active().errors[rawError.status];
					}
					else if(apiResponse.message) {
						errorMessage += "<br/><br/>" + self.i18n.active().errors.genericLabel + ': ' + apiResponse.message;
					}

					monster.ui.alert('error', errorMessage);
				}
			});
		}
	}

	return app;
});
