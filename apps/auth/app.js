define(function(require){
	var $ = require("jquery"),
		_ = require("underscore"),
		monster = require("monster"),
		toastr = require("toastr");

	var app = {

		name: 'auth',

		css: [ 'app' ],

		i18n: { 
			'en-US': { customCss: false },
			'fr-FR': { customCss: false },
			'ru-RU': { customCss: false }
		},

		appFlags: {
			mainContainer: undefined,
			isAuthentified: false
		},

		requests: {},

		subscribe: {
			'auth.logout': '_logout',
			'auth.clickLogout': '_clickLogout',
			'auth.initApp' : '_initApp',
			'auth.afterAuthenticate': '_afterSuccessfulAuth'
		},

		load: function(callback) {
			var self = this;

			callback && callback(self);
		},

		render: function(mainContainer) {
			var self = this;

			self.appFlags.mainContainer = mainContainer;

			self.triggerLoginMechanism();
		},

		// Order of importance: Cookie > GET Parameters > External Auth > Default Case
		triggerLoginMechanism: function() {
			var self = this,
				urlParams = monster.util.getUrlVars(),
				successfulAuth = function(authData) {
					self._afterSuccessfulAuth(authData);
				};

			// First check if there is a custom authentication mechanism
			if('authentication' in monster.config.whitelabel) {
				self.customAuth = monster.config.whitelabel.authentication;

				var options = {
					sourceUrl: self.customAuth.source_url,
					apiUrl: self.customAuth.api_url
				};

				monster.apps.load(self.customAuth.name, function(app) {
					app.render(self.appFlags.mainContainer);
				}, options);
			}
			// otherwise, we handle it ourself, and we check if the authentication cookie exists, try to log in with its information
			else if($.cookie('monster-auth')) {
				var cookieData = $.parseJSON($.cookie('monster-auth'));

				self.authenticateAuthToken(cookieData.accountId, cookieData.authToken, successfulAuth);
			}
			// Otherwise, we check if some GET parameters are defined, and if they're formatted properly
			else if(urlParams.hasOwnProperty('t') && urlParams.hasOwnProperty('a') && urlParams.t.length === 32 && urlParams.a.length === 32) {
				self.authenticateAuthToken(urlParams.a, urlParams.t, successfulAuth);
			}
			// Default case, we didn't find any way to log in automatically, we render the login page
			else {
				self.renderLoginPage(self.appFlags.mainContainer);
			}
		},

		authenticateAuthToken: function(accountId, authToken, callback) {
			var self = this;

			// Hack: We set the auth token on the app because otherwise the getAuth request won't send any X-Auth-Token HTTP Header
			// If the request fails, we delete the Auth-Token so it doesn't impact anything else
			self.authToken = authToken;

			self.getAuth(accountId, authToken, 
				function(authData) {
					callback && callback(authData);
				},
				function() {
					delete self.authToken;

					self.renderLoginPage(self.appFlags.mainContainer);
				}
			);
		},

		_afterSuccessfulAuth: function(data) {
			var self = this;

			self.accountId = data.data.account_id;
			self.authToken = data.auth_token;
			self.userId = data.data.owner_id;
			self.isReseller = data.data.is_reseller;
			self.resellerId = data.data.reseller_id;

			self.appFlags.isAuthentified = true;

			if('apps' in data.data) {
				self.installedApps = data.data.apps;
			} else {
				self.installedApps = [];
				toastr.error(self.i18n.active().toastrMessages.appListError);
			}

			var cookieAuth = {
				language: data.data.language,
				authToken: self.authToken,
				accountId: self.accountId
			};

			$.cookie('monster-auth', JSON.stringify(cookieAuth));

			self.appFlags.mainContainer.addClass('monster-content');
			$('#main .footer-wrapper').append(self.appFlags.mainContainer.find('.powered-by-block .powered-by'));
			self.appFlags.mainContainer.empty();

			self.afterLoggedIn();
		},

		//Events handler
		_clickLogout: function() {
			var self = this;

			monster.ui.confirm(self.i18n.active().confirmLogout, function() {
				self._logout();
			});
		},

		//Methods
		afterLoggedIn: function() {
			var self = this;

			$('#main_topbar_apploader').show();

			self.loadAccount();
		},

		loadAccount: function() {
			var self = this;

			monster.parallel({
				account: function(callback) {
					self.getAccount(function(data) {
						callback(null, data.data);
					},
					function(data) {
						callback('error account', data);
					});
				},
				user: function(callback) {
					self.getUser(function(data) {
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
					monster.util.logoutAndReload();
				}
				else {
					if ( results.user.hasOwnProperty('require_password_update') && results.user.require_password_update ) {
						self.newPassword(results.user);
					}

					monster.util.autoLogout();
					$('#main_topbar_signout').show();

					results.user.account_name = results.account.name;
					results.user.apps = results.user.apps || {};
					results.account.apps = results.account.apps || {};

					var afterLanguageLoaded = function() {
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

						self.currentUser = results.user;
						// This account will remain unchanged, it should be used by non-masqueradable apps
						self.originalAccount = results.account;
						// This account will be overriden when masquerading, it should be used by masqueradable apps
						self.currentAccount = $.extend(true, {}, self.originalAccount);

						self.defaultApp = defaultApp;

						monster.pub('core.loadApps', {
							defaultApp: defaultApp
						});
					};

					// If the user or the account we're logged into has a language settings, and if it's different than
					var loadCustomLanguage = function(language, callback) {
						if(language !== monster.config.whitelabel.language && language !== monster.apps.defaultLanguage) {
							monster.apps.loadLocale(monster.apps.core, language, function() {
								monster.apps.loadLocale(self, language, function() {
									monster.config.whitelabel.language = language;

									callback && callback();
								});
							});
						}
						else {
							monster.config.whitelabel.language = language;
							callback && callback();
						}
					};

					/* If user has a preferred language, then set the i18n flag with this value, and download the customized i18n
					if not, check if the account has a default preferred language */
					if('language' in results.user) {
						loadCustomLanguage(results.user.language, afterLanguageLoaded);
					}
					else if('language' in results.account) {
						loadCustomLanguage(results.account.language, afterLanguageLoaded);
					}
					else {
						afterLanguageLoaded && afterLanguageLoaded();
					}

					if('ui_flags' in results.user && results.user.ui_flags.colorblind) {
						$('body').addClass('colorblind');
					}
				}
			});
		},

		renderLoginPage: function(container) {
			var self = this,
				template = $(monster.template(self, 'app')),
				callback = function() {
					container.append(template);
					self.renderLoginBlock();
					template.find('.powered-by-block').append($('#main .footer-wrapper .powered-by'));
					self.appFlags.mainContainer.removeClass('monster-content');
				}
				loadWelcome = function() {
					// if(monster.config.whitelabel.custom_welcome) {
					// 	self.callApi({
					// 		resource: 'whitelabel.getWelcomeByDomain',
					// 		data: {
					// 			domain: window.location.hostname,
					// 			generateError: false
					// 		},
					// 		success: function(data, status) {
					// 			template.find('.left-div').empty().html(data);
					// 			callback();
					// 		},
					// 		error: function(data, status) {
					// 			callback();
					// 		}
					// 	});
					// } else {
					// 	callback();
					// }
					if(monster.config.whitelabel.custom_welcome_message) {
						template.find('.left-div .hello').empty().html(monster.config.whitelabel.custom_welcome_message.replace(/\r?\n/g, '<br />'));
					}
					callback();
				},
				domain = window.location.hostname;

			self.callApi({
				resource: 'whitelabel.getLogoByDomain',
				data: {
					domain: domain,
					generateError: false,
					dataType: '*'
				},
				success: function(_data) {
					template.find('.logo-block').css('background-image', 'url(' + monster.config.api.default + 'whitelabel/' + domain + '/logo?_='+new Date().getTime()+')');
					loadWelcome();
				},
				error: function(error) {
					template.find('.logo-block').css('background-image', 'url("apps/auth/style/static/images/logo.svg")');
					loadWelcome();
				}
			});
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
					showRegister: monster.config.hide_registration || false,
					hidePasswordRecovery: monster.config.whitelabel.hidePasswordRecovery || false
				},
				loginHtml = $(monster.template(self, templateName, templateData)),
				content = $('#auth_container .right-div .login-block');

			loginHtml.find('.login-tabs a').click(function(e) {
				e.preventDefault();
				$(this).tab('show');
			});

			content.empty().append(loginHtml);

			content.find(templateData.username !== '' ? '#password' : '#login').focus();

			content.find('.forgot-password').on('click', function() {
				var template = $(monster.template(self, 'dialogPasswordRecovery')),
					form = template.find('#form_password_recovery'),
					popup = monster.ui.dialog(template, { title: self.i18n.active().passwordRecovery.title });

				monster.ui.validate(form);

				template.find('.recover-password').on('click', function() {
					if ( monster.ui.valid(form) ) {
						var object = monster.ui.getFormData('form_password_recovery', '.', true);

						if ( object.hasOwnProperty('account_name') || object.hasOwnProperty('account_realm') || object.hasOwnProperty('phone_number') ) {
							self.callApi({
								resource: 'auth.recovery',
								data: {
									data:object,
									generateError: false
								},
								success: function(data, success) {
									popup.dialog('close');

									toastr.success(self.i18n.active().passwordRecovery.toastr.success.reset);
								},
								error: function(data, error) {
									if ( error.status === 400) {
										_.keys(data.data).forEach(function(val) {
											if ( self.i18n.active().passwordRecovery.toastr.error.reset.hasOwnProperty(val) ) {
												toastr.error(self.i18n.active().passwordRecovery.toastr.error.reset[val]);
											} else {
												if ( data.data[val].hasOwnProperty('not_found') ) {
													toastr.error(data.data[val].not_found);
												}
											}
										});
									}
								}
							});
						} else {
							toastr.error(self.i18n.active().passwordRecovery.toastr.error.missing);
						}
					}
				});

				template.find('.cancel-link').on('click', function() {
					popup.dialog('close').remove();
				});
			});

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

			self.putAuth(loginData, function (data) {
				if($('#remember_me').is(':checked')) {
					var templateLogin = $('.login-block form');
						cookieLogin = {
							login: templateLogin.find('#login').val(),
							accountName: templateLogin.find('#account_name').val()
						};

					$.cookie('monster-login', JSON.stringify(cookieLogin), {expires: 30});
				}
				else {
					$.cookie('monster-login', null);
				}

				self._afterSuccessfulAuth(data);
			});
		},

		_logout: function() {
			var self = this;

			monster.util.logoutAndReload();
		},

		newPassword: function(userData) {
			var self = this,
				template = $(monster.template(self, 'dialogPasswordUpdate')),
				form = template.find('#form_password_update'),
				popup = monster.ui.dialog(template, { title: self.i18n.active().passwordUpdate.title });

			monster.ui.validate(form);

			template.find('.update-password').on('click', function() {
				if ( monster.ui.valid(form) ) {
					var formData = monster.ui.getFormData('form_password_update');

					if ( formData.new_password === formData.new_password_confirmation ) {
						var newUserData = {
								password: formData.new_password,
								require_password_update: false
							},
							data = $.extend(true, {}, userData, newUserData);

						self.callApi({
							resource: 'user.update',
							data: {
								accountId: self.accountId,
								userId: self.userId,
								data: data
							},
							success: function(data, status) {
								popup.dialog('close').remove();
								toastr.success(self.i18n.active().passwordUpdate.toastr.success.update);
							}
						});
					} else {
						toastr.error(self.i18n.active().passwordUpdate.toastr.error.password);
					}
				}
			});

			template.find('.cancel-link').on('click', function() {
				popup.dialog('close').remove();
			});
		},

		conferenceLogin: function() {
			var self = this,
				formData = monster.ui.getFormData('user_login_form');

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

					self.appFlags.mainContainer.empty();

					monster.apps.load('conferences', function(app) {
						app.userType = 'unregistered';
						app.user = formData;
						app.isModerator = data.data.is_moderator;
						app.conferenceId = data.data.conference_id;
						app.render(self.appFlags.mainContainer);
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

		// API Calls
		putAuth: function(loginData, callback) {
			var self = this;

			self.callApi({
				resource: 'auth.userAuth',
				data: {
					data: loginData
				},
				success: function (data, status) {
					callback && callback(data);
				}
			});
		},

		getAuth: function(accountId, authToken, callbackSuccess, callbackError) {
			var self = this;

			self.callApi({
				resource: 'auth.get',
				data: {
					accountId: accountId,
					token: authToken,
					generateError: false
				},
				success: function(data) {
					callbackSuccess && callbackSuccess(data);
				},
				error: function(data) {
					callbackError && callbackError();
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

		getAppsStore: function(callback) {
			var self = this;

			self.callApi({
				resource: 'appsStore.list',
				data: {
					accountId: self.accountId
				},
				success: function(_data) {
					callback && callback(_data.data)
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

		// Method used to authenticate other apps
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

			args.app.authToken = this.authToken;

			success(args.app);
		}
	}

	return app;
});
