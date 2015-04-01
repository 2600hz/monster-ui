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

		requests: {},

		subscribe: {
			'auth.logout': '_logout',
			'auth.clickLogout': '_clickLogout',
			'auth.initApp' : '_initApp',
			'auth.afterAuthenticate': '_afterAuthenticate'
		},

		load: function(callback){
			var self = this,
				mainContainer = $('#monster-content');

			if(!$.cookie('monster-auth')) {
				if('authentication' in monster.config.whitelabel) {
					self.customAuth = monster.config.whitelabel.authentication;

					var options = {
						sourceUrl: self.customAuth.source_url,
						apiUrl: self.customAuth.api_url
					};

					monster.apps.load(self.customAuth.name, function(app) {
						app.render(mainContainer);
					}, options);
				}
				else {
					self.renderLoginPage(mainContainer);
				}

				callback && callback(self);
			}
			else {
				var cookieData = $.parseJSON($.cookie('monster-auth'));

				self.authToken = cookieData.authToken;
				self.accountId = cookieData.accountId;
				self.userId = cookieData.userId;
				self.isReseller = cookieData.isReseller;
				self.resellerId = cookieData.resellerId;
				
				self.transformAppIdsToData(cookieData.installedApps, cookieData.language, function(data) {
					self.installedApps = data;

					self.afterLoggedIn();

					callback && callback(self);
				});
			}
		},

		// Transform an array of app ids to a array of object with apps information
		// We didn't want to store all the metadata in the cookie (because otherwise it would become too big) so we created this
		transformAppIdsToData: function(apps, lang, callback) {
			var self = this,
				formattedApps = [],
				mapApps = {};

			self.getAppsStore(function(appData) {
				_.each(appData, function(app) {
					var i18nLabel = app.i18n.hasOwnProperty(lang) ? app.i18n[lang].label : app.i18n['en-US'].label;

					// We use this formatting to match whatever is sent from the user_auth request
					mapApps[app.id] = {
						api_url: app.api_url,
						id: app.id,
						label: i18nLabel,
						name: app.name,
						source_url: app.source_url
					};
				});

				_.each(apps, function(id) {
					if(mapApps.hasOwnProperty(id)) {
						formattedApps.push(mapApps[id]);
					}
				});

				callback && callback(formattedApps);
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
		afterLoggedIn: function() {
			var self = this;

			$('#home_link').addClass('active');

			self.loadAccount();
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

		_afterAuthenticate: function(data) {
			var self = this;

			self.accountId = data.data.account_id;
			self.authToken = data.auth_token;
			self.userId = data.data.owner_id;
			self.isReseller = data.data.is_reseller;
			self.resellerId = data.data.reseller_id;

			if('apps' in data.data) {
				self.installedApps = data.data.apps;
			} else {
				self.installedApps = [];
				toastr.error(self.i18n.active().toastrMessages.appListError);
			}

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

			var cookieAuth = {
				language: data.data.language,
				authToken: self.authToken,
				accountId: self.accountId,
				userId: self.userId,
				isReseller: self.isReseller,
				resellerId: self.resellerId
			};

			cookieAuth.installedApps = _.map(self.installedApps, function(app) { return app.id });

			$.cookie('monster-auth', JSON.stringify(cookieAuth));

			$('#monster-content').addClass('monster-content');
			$('#main .footer-wrapper').append($('#monster-content .powered-by-block .powered-by'));
			$('#monster-content ').empty();

			self.afterLoggedIn();
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
					$.cookie('monster-auth', null);
					window.location.reload();
				}
				else {
					if ( results.user.hasOwnProperty('require_password_update') && results.user.require_password_update ) {
						self.newPassword(results.user);
					}

					monster.util.autoLogout();
					$('.signout').show();

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

		renderLoginPage: function(container) {
			var self = this,
				template = $(monster.template(self, 'app')),
				callback = function() {
					container.append(template);
					self.renderLoginBlock();
					template.find('.powered-by-block').append($('#main .footer-wrapper .powered-by'));
					$('#monster-content').removeClass('monster-content');
				};

			if(monster.config.whitelabel.custom_welcome) {
				self.callApi({
					resource: 'whitelabel.getWelcomeByDomain',
					data: {
						domain: window.location.hostname,
						generateError: false
					},
					success: function(data, status) {
						template.find('.left-div').empty().html(data);
						callback();
					},
					error: function(data, status) {
						callback();
					}
				});
			} else {
				callback();
			}
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

					$('#monster-content').empty();

					monster.apps.load('conferences', function(app) {
						app.userType = 'unregistered';
						app.user = formData;
						app.isModerator = data.data.is_moderator;
						app.conferenceId = data.data.conference_id;
						app.render($('#monster-content'));
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
		}
	}

	return app;
});
