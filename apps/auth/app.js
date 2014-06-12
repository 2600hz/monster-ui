define(function(require){
	var $ = require("jquery"),
		_ = require("underscore"),
		monster = require("monster"),
		toastr = require("toastr");

	var app = {

		name: 'auth',

		i18n: [ 'en-US', 'fr-FR' ],

		requests: {},

		subscribe: {
			'auth.logout': '_logout',
			'auth.clickLogout': '_clickLogout',
			'auth.initApp' : '_initApp',
			'auth.afterAuthenticate': '_afterAuthenticate'
		},

		load: function(callback){
			var self = this,
				mainContainer = $('#ws-content');

			self.getWhitelabel(function(data) {
				self.whitelabel = data;

				if(!$.cookie('monster-auth')) {
					// If it uses custom authentication, load the auth module
					if(self.whitelabel.hasOwnProperty('authentication')) {
						var options = {
							sourceUrl: self.whitelabel.authentication.source_url,
							apiUrl: self.whitelabel.authentication.api_url
						};

						monster.apps.load(self.whitelabel.authentication.name, function(app) {
							app.render(mainContainer);
						}, options);
					}
					//Otherwise just render our own login page
					else {
						self.renderLoginPage(mainContainer);
					}
				}
				else {
					var cookieData = $.parseJSON($.cookie('monster-auth'));

					self.authToken = cookieData.authToken;
					self.isReseller = cookieData.isReseller;
					self.resellerId = cookieData.resellerId;

					// The following attributes don't always come back, when using custom-auth for example.
					if (cookieData.hasOwnProperty('accountId')) {
						self.accountId = cookieData.accountId;
					}

					if (cookieData.hasOwnProperty('userId')) {
						self.userId = cookieData.userId;
					}

					if (cookieData.hasOwnProperty('installedApps')) {
						self.installedApps = cookieData.installedApps;
					}

					if (cookieData.hasOwnProperty('sso')) {
						self.currentUser = {
							first_name: cookieData.sso.firstName,
							last_name: cookieData.sso.lastName
						};
					}

					self.afterLoggedIn();
				}

				callback && callback(self);
			});
		},

		render: function(container){

		},

		//Events handler
		_clickLogout: function() {
			var self = this;

			monster.ui.confirm(self.i18n.active().confirmLogout, function() {
				self._logout();
			});
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

					if (self.hasOwnProperty('userId')) {
						app.userId = self.userId;
					}

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
				self.callApi({
					apiUrl: args.app.apiUrl,
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

		//Methods
		afterLoggedIn: function(data) {
			var self = this;

			$('#ws-content').empty();

			// If user has only access to a single app, hide apps menu
			if(!(self.whitelabel.hasOwnProperty('single_app'))) {
				$('#home_link').addClass('active');
			}

			self.loadAccount(data);
		},

		authenticate: function(loginData) {
			var self = this;

			self.callApi({
				resource: 'auth.userAuth',
				data: {
					data: loginData
				},
				success: function (data, status) {
					self._afterAuthenticate(data);
				}
			});
		},

		createCookies: function(data) {
			var self = this;

			// monster-login cookie
			// Only if non-custom auth
			if(!(self.whitelabel && self.whitelabel.hasOwnProperty('authentication'))) {
				if($('#remember_me').is(':checked')) {
					var templateLogin = $('.login-block form');
				    	cookieLogin = {
							login: templateLogin.find('#login').val(),
							accountName: templateLogin.find('#account_name').val()
						};

					$.cookie('monster-login', JSON.stringify(cookieLogin), {expires: 30});
				}
				else{
					$.cookie('monster-login', null);
				}
			}

			// monster-auth cookie
			var cookieAuth = {
				language: data.data.language,
				authToken: self.authToken,
				isReseller: self.isReseller,
				resellerId: self.resellerId,
			};

			// These attributes don't always come back with custom-auth, so we need to make sure that they exist before saving them in the cookie
			if (self.hasOwnProperty('accountId')) {
				cookieAuth.accountId = self.accountId;
			}

			if (self.hasOwnProperty('userId')) {
				cookieAuth.userId = self.userId;
			}

			if (self.hasOwnProperty('installedApps')) {
				cookieAuth.installedApps = self.installedApps;
			}

			if (data.data.hasOwnProperty('sso')) {
				cookieAuth.sso = {
					firstName: data.data.sso.first_name,
					lastName: data.data.sso.last_name
				};
			}

			$.cookie('monster-auth', JSON.stringify(cookieAuth));
		},

		_afterAuthenticate: function(data) {
			var self = this;

			if (data.data.hasOwnProperty('account_id')) {
				self.accountId = data.data.account_id;
			}

			if (data.data.hasOwnProperty('owner_id')) {
				self.userId = data.data.owner_id;
			}

			self.authToken = data.auth_token;
			self.isReseller = data.data.is_reseller;
			self.resellerId = data.data.reseller_id;

			if('apps' in data.data) {
				self.installedApps = data.data.apps;
			} else {
				self.installedApps = [];
				toastr.error(self.i18n.active().toastrMessages.appListError);
			}

			self.createCookies(data);

			self.afterLoggedIn(data);
		},

		loadAccount: function(_data) {
			var self = this;

			monster.parallel({
				account: function(callback) {
					// accountId missing Can happen if user doesn't have an account yet, for example with custom auth
					if(self.hasOwnProperty('accountId')) {
						self.getAccount(function(data) {
							callback(null, data.data);
						},
						function(data) {
							callback('error account', data);
						});
					}
					else {
						callback(null, {});
					}
				},
				user: function(callback) {
					// userid missing Can happen if user is using a custom auth
					if(self.hasOwnProperty('userId')) {
						self.getUser(function(data) {
							callback(null, data.data);
						},
						function(data) {
							callback('error user', data);
						});
					}
					else {
						var user = {};

						if (self.hasOwnProperty('currentUser')) {
							user = self.currentUser;
						}
						else if (_data && _data.data && _data.data.sso) {
							user.first_name = _data.data.sso.first_name;
							user.last_name = _data.data.sso.last_name;
						}


						callback(null, user);
					}
				}
			},
			function(err, results) {
				var defaultApp,
					loadAppsOptions = {};

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

					var afterLanguageLoaded = function() {
						// If the user is not using a single app, check his apps order to get the default app
						if(!(self.whitelabel.hasOwnProperty('single_app'))) {
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
										/* Temporary code to allow retro-compatibility with old app structure (changed in v3.07) */
										if('all' in accountApps[appId]) {
											accountApps[appId].allowed_users = accountApps[appId].all ? 'all' : 'specific';
											delete accountApps[appId].all;
										}
										/*****************************************************************************************/
										if(accountApps[appId].allowed_users === 'all'
										|| (accountApps[appId].allowed_users === 'admins' && results.user.priv_level === 'admin')
										|| accountAppUsers.indexOf(results.user.id) >= 0) {
											defaultApp = fullAppList[appId].name;
											break;
										}
									}
								}
							} else {
								var userAppList = $.map(fullAppList, function(val) {
									if(val.id in accountApps) {
										var accountAppUsers = $.map(accountApps[val.id].users, function(val) {return val.id;});
										/* Temporary code to allow retro-compatibility with old app structure (changed in v3.07) */
										if('all' in accountApps[val.id]) {
											accountApps[val.id].allowed_users = accountApps[val.id].all ? 'all' : 'specific';
											delete accountApps[val.id].all;
										}
										/*****************************************************************************************/
										if(accountApps[val.id].allowed_users === 'all'
										|| (accountApps[val.id].allowed_users === 'admins' && results.user.priv_level === 'admin')
										|| accountAppUsers.indexOf(results.user.id) >= 0) {
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

									self.callApi({
										resource: 'user.update',
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
						}
						else {
							var singleApp = self.whitelabel.single_app;

							defaultApp = singleApp.name;

							loadAppsOptions = {
								sourceUrl: singleApp.source_url,
								apiUrl: singleApp.api_url
							};
						}

						self.currentUser = results.user;
						// This account will remain unchanged, it should be used by non-masqueradable apps
						self.originalAccount = results.account;
						// This account will be overriden when masquerading, it should be used by masqueradable apps
						self.currentAccount = $.extend(true, {}, self.originalAccount);

						monster.pub('core.loadApps', {
							defaultApp: defaultApp,
							options: loadAppsOptions
						});
					};

					/* If user has a preferred language, then set the i18n flag with this value, and download the customized i18n
					if not, check if the account has a default preferred language */
					var loadCustomLanguage = function(language, callback) {
						if(language !== monster.config.language) {
							monster.apps.loadLocale(monster.apps.core, language, function() {
								monster.apps.loadLocale(self, language, function() {
									monster.config.language = language;

									callback && callback();
								});
							});
						}
						else {
							callback && callback();
						}
					};

					if('language' in results.user) {
						loadCustomLanguage(results.user.language, afterLanguageLoaded);
					}
					else if('language' in results.account) {
						loadCustomLanguage(results.account.language, afterLanguageLoaded);
					}
					else {
						afterLanguageLoaded && afterLanguageLoaded();
					}
				}
			});
		},

		renderLoginPage: function(container) {
			var self = this;

			var template = monster.template(self, 'app');

			container.append(template);

			self.renderLoginBlock();
		},

		renderLoginBlock: function() {
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
					self.conferenceLogin();
				} else {
					var dataLogin = {
						realm: realm,
						accountName: accountName
					};

					self.loginClick(dataLogin);
				}
			});
		},

		_logout: function() {
			var self = this;

			$.cookie('monster-auth', null);

			window.location.reload();
		},

		loginClick: function(data) {
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

			loginData =  _.extend({ credentials: hashedCreds }, loginData);

			self.authenticate(loginData);
		},

		conferenceLogin: function() {
			var self = this,
				formData = form2object('user_login_form');

			_.each(formData.update, function(val, key) {
				if(!val) { delete formData.update[key]; }
			});
			self.callApi({
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
		},

		getAccount: function(success, error) {
			var self = this;

			self.callApi({
				resource: 'account.get',
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

		getUser: function(success, error) {
			var self = this;

			self.callApi({
				resource: 'user.get',
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

		getWhitelabel: function(callback) {
			var self = this;

			self.callApi({
				resource: 'whitelabel.get',
				data: {
					domain: window.location.hostname,
					generateError: false
				},
				success: function(_data) {
					callback && callback(data.data);
				},
				error: function(err) {
					var expectedPayload = {
						'authentication': {
							name: 'ubiquiti-auth',
							api_url: 'http://10.26.0.41:8000/v2/',
							source_url: 'http://webdev/monster-modules/ubiquiti/design/Resources/monster-app-auth-example/',
						},
						'single_app': {
							name: 'ubiquiti',
							api_url: 'http://10.26.0.41:8000/v2/',
							source_url: 'http://webdev/monster-modules/ubiquiti',
							label: 'Ubiquiti PBX'
						}
					};

					callback && callback(expectedPayload);
					//callback && callback({});
				}
			});
		}
	}

	return app;
});
