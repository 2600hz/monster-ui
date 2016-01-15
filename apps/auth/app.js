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

		requests: {
			'auth.upgradeTrial': {
				apiRoot: monster.config.api.screwdriver,
				url: 'upgrade',
				verb: 'POST'
			}
		},

		subscribe: {
			'auth.logout': '_logout',
			'auth.clickLogout': '_clickLogout',
			'auth.initApp' : '_initApp',
			'auth.afterAuthenticate': '_afterSuccessfulAuth',
			'auth.showTrialInfo': 'showTrialInfo'
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

			//Adding the authtoken to the Core app
			monster.apps.core.authToken = data.auth_token;

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
				appsStore: function(callback) {
					self.getAppsStore(function(data) {
						callback(null, data);
					});
				},
				account: function(callback) {
					self.getAccount(self.accountId, function(data) {
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
						var fullAppList = _.indexBy(self.installedApps, 'id'),
							defaultAppId = _.find(results.user.appList || [], function(appId) {
								return fullAppList.hasOwnProperty(appId);
							});

						if(defaultAppId) {
							defaultApp = fullAppList[defaultAppId].name;
						} else if(self.installedApps.length > 0) {
							defaultApp = self.installedApps[0].name;
						}

						monster.appsStore = _.indexBy(results.appsStore, 'name');

						self.currentUser = results.user;
						// This account will remain unchanged, it should be used by non-masqueradable apps
						self.originalAccount = results.account;
						// This account will be overriden when masquerading, it should be used by masqueradable apps
						self.currentAccount = $.extend(true, {}, self.originalAccount);

						self.defaultApp = defaultApp;

						self.showAnnouncement(self.originalAccount.announcement);

						if('ui_flags' in results.user && results.user.ui_flags.colorblind) {
							$('body').addClass('colorblind');
						}

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
				}
			});
		},

		showAnnouncement: function() {
			var self = this,
				announcement = self.originalAccount.announcement || monster.config.whitelabel.announcement;

			if(announcement) {
				monster.ui.alert('info', announcement, null, { title: self.i18n.active().announcementTitle });
			}
		},

		showTrialInfo: function(timeLeft) {
			var self = this,
				daysLeft = timeLeft > 0 ? Math.ceil(timeLeft / (60*60*24*4)) : -1,
				hasAlreadyLogIn = self.uiFlags.user.get('hasLoggedIn') ? true : false,
				template = $(monster.template(self, 'trial-message', { daysLeft: daysLeft }));

			template.find('.links').on('click', function() {
				self.showTrialPopup(daysLeft);
			});

			$('#main_topbar_nav').prepend(template);

			hasAlreadyLogIn ? self.showTrialPopup(daysLeft) : self.showFirstTrialGreetings();
		},

		showFirstTrialGreetings: function() {
			var self = this,
				updateUser = function(callback) {
					var userToSave = self.uiFlags.user.set('hasLoggedIn', true);

					self.updateUser(userToSave, function(user) {
						callback && callback(user);
					});

					monster.pub('auth.continueTrial');
				};

			var popup = $(monster.template(self, 'trial-greetingsDialog'));

			popup.find('#acknowledge').on('click', function() {
				dialog.dialog('close').remove();

				updateUser && updateUser();
			});

			var dialog = monster.ui.dialog(popup, {
				title: self.i18n.active().trialGreetingsDialog.title
			});

			// Update the flag of the walkthrough is they don't care about it
			dialog.siblings().find('.ui-dialog-titlebar-close').on('click', function() {
				updateUser && updateUser()
			});
		},

		updateUser: function(data, callback) {
			var self = this;

			self.callApi({
				resource: 'user.update',
				data: {
					accountId: self.accountId,
					data: data
				},
				success: function(data) {
					callback && callback(data.data);
				}
			});
		},

		showTrialPopup: function(daysLeft) {
			var self = this,
				dialog,
				alreadyUpgraded = self.uiFlags.account.get('trial_upgraded');

			if(alreadyUpgraded) {
				monster.ui.alert('info', self.i18n.active().trialPopup.alreadyUpgraded);
			}
			else {
				if(daysLeft >= 0) {
					monster.ui.confirm(
						'', // Marketing content goes here
						function() {
							self.handleUpgradeClick();
						},
						function() {
							monster.pub('auth.continueTrial');
						},
						{
							title: monster.template(self, '!' + self.i18n.active().trialPopup.mainMessage, { variable: daysLeft }),
							cancelButtonText: self.i18n.active().trialPopup.closeButton,
							confirmButtonText: self.i18n.active().trialPopup.upgradeButton,
							confirmButtonClass: 'monster-button-primary',
							type: 'warning'
						}
					);
				} else {
					monster.ui.alert(
						'error',
						'', // Marketing content goes here
						function() {
							self.handleUpgradeClick();
						},
						{
							closeOnEscape: false,
							title: self.i18n.active().trialPopup.trialExpired,
							closeButtonText: self.i18n.active().trialPopup.upgradeButton,
							closeButtonClass: 'monster-button-primary'
						}
					);
				}
			}
		},

		handleUpgradeClick: function() {
			var self = this;

			monster.pub('myaccount.hasCreditCards', function(response) {
				if(response) {
					self.upgradeAccount(self.accountId, function() {
						monster.ui.alert('info', self.i18n.active().trial.successUpgrade.content, null, {
							title: self.i18n.active().trial.successUpgrade.title
						});
					});
				}
				else {
					monster.pub('myaccount.showCreditCardTab');

					toastr.error(self.i18n.active().trial.noCreditCard);
				}
			});
		},

		upgradeAccount: function(accountId, callback) {
			var self = this;

			self.sendUpgradeTrialRequest(accountId, function() {
				self.setUpgradeFlagAccount(accountId, function(data) {
					callback && callback(data);
				});
			});
		},

		sendUpgradeTrialRequest: function(accountId, callback) {
			var self = this;

			monster.request({
				resource: 'auth.upgradeTrial',
				data: {
					envelopeKeys: { 
						id: accountId 
					}
				},
				success: function(data, status) {
					callback && callback(data);
				}
			});
		},

		setUpgradeFlagAccount: function(accountId, callback) {
			var self = this;

			self.getAccount(accountId, function(data) {
				var accountData = self.uiFlags.account.set('trial_upgraded', true, data.data);

				self.callApi({
					resource: 'account.update',
					data: {
						accountId: self.accountId,
						data: accountData
					},
					success: function(data) {
						callback && callback(data.data);
					}
				});
			});
		},

		renderLoginPage: function(container) {
			var self = this,
				accountName = '',
				realm = '',
				cookieLogin = $.parseJSON($.cookie('monster-login')) || {},
				templateData = {
					username: cookieLogin.login || '',
					requestAccountName: (realm || accountName) ? false : true,
					accountName: cookieLogin.accountName || '',
					rememberMe: cookieLogin.login || cookieLogin.accountName ? true : false,
					showRegister: monster.config.hide_registration || false,
					hidePasswordRecovery: monster.config.whitelabel.hidePasswordRecovery || false
				},
				template = $(monster.template(self, 'app', templateData)),
				loadWelcome = function() {
					if(monster.config.whitelabel.custom_welcome) {
						template.find('.welcome-message').empty().html((monster.config.whitelabel.custom_welcome_message || '').replace(/\r?\n/g, '<br />'));
					}

					container.append(template);
					self.bindLoginBlock(templateData);
					template.find('.powered-by-block').append($('#main .footer-wrapper .powered-by'));
					self.appFlags.mainContainer.removeClass('monster-content');
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

		bindLoginBlock: function(templateData) {
			var self = this,
				content = $('#auth_container');

			content.find(templateData.username !== '' ? '#password' : '#login').focus();

			content.find('.btn-submit.login').on('click', function(e){
				e.preventDefault();

				/*var dataLogin = {
					realm: realm,
					accountName: accountName
				};*/

				self.loginClick();
			});

			// New Design stuff
			if (content.find('.input-wrap input[type="text"], input[type="password"], input[type="email"]').val() !== '' ) {
				content.find('.placeholder-shift').addClass('fixed');
			}

			content.find('.input-wrap input[type="text"], input[type="password"], input[type="email"]').on('change' , function() {
				if( this.value !== '') {
					$(this).next('.placeholder-shift').addClass('fixed'); 
				}
				else {
					$(this).next('.placeholder-shift').removeClass('fixed'); 
				}
			});

			// ----------------
			// FORM TYPE TOGGLE
			// ----------------

			content.find('.form-toggle').on('click', function() {
				var formType = $(this).data('form');

				content.find('.form-container').toggleClass('hidden');
				content.find('.form-container[data-form="'+ formType +'"]').addClass('fadeInDown');

				content.find('.form-content').removeClass('hidden');
				content.find('.reset-notification').addClass('hidden');
			}); 

			// ------------------------
			// PASSWORD RECOVERY SUBMIT
			// ------------------------
			var form = content.find('#form_password_recovery');

			monster.ui.validate(form);

			content.find('.recover-password').on('click', function() {
				if ( monster.ui.valid(form) ) {
					var object = monster.ui.getFormData('form_password_recovery', '.', true);

					object.ui_url = window.location.href;

					if ( object.hasOwnProperty('account_name') || object.hasOwnProperty('phone_number') ) {
						self.callApi({
							resource: 'auth.recovery',
							data: {
								data:object,
								generateError: false
							},
							success: function(data, success) {
								content.find('.form-content').addClass('hidden');
								content.find('.reset-notification').addClass('animated fadeIn').removeClass('hidden');
							},
							error: function(data, error) {
								if ( error.status === 400) {
									_.keys(data.data).forEach(function(val) {
										if ( self.i18n.active().recoverPassword.toastr.error.reset.hasOwnProperty(val) ) {
											toastr.error(self.i18n.active().recoverPassword.toastr.error.reset[val]);
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
						toastr.error(self.i18n.active().recoverPassword.toastr.error.missing);
					}
				}
			});
		},

		loginClick: function(data) {
			var self = this,
				loginUsername = $('#login').val(),
				loginPassword = $('#password').val(),
				loginAccountName = $('#account_name').val(),
				hashedCreds = $.md5(loginUsername + ':' + loginPassword),
				loginData = {
					credentials: hashedCreds,
					account_name: loginAccountName
				};

			self.putAuth(loginData, function (data) {
				if($('#remember_me').is(':checked')) {
					var cookieLogin = {
						login: loginUsername,
						accountName: loginAccountName
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
					data: loginData,
					generateError: false
				},
				success: function (data, status) {
					callback && callback(data);
				},
				error: function(errorPayload, data, globalHandler) {
					if(data.status === 423 && errorPayload.data.hasOwnProperty('account') && errorPayload.data.account.hasOwnProperty('expired')) {
						var date = monster.util.toFriendlyDate(monster.util.gregorianToDate(errorPayload.data.account.expired.cause), 'short'),
							errorMessage = monster.template(self, '!' + self.i18n.active().expiredTrial, { date: date });

						monster.ui.alert('warning', errorMessage);
					}
					else if(data.status === 423) {
						monster.ui.alert('error', self.i18n.active().disabledAccount);
					}
					else {
						globalHandler(errorPayload, { generateError: true });
					}
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

		getAccount: function(accountId, success, error) {
			var self = this;

			self.callApi({
				resource: 'account.get',
				data: {
					accountId: accountId
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
					// If isMasqueradable flag is set in the code itself, use it, otherwise check if it's set in the DB, otherwise defaults to true
					app.isMasqueradable = app.hasOwnProperty('isMasqueradable') ? app.isMasqueradable : (monster.appsStore.hasOwnProperty(app.name) ? monster.appsStore[app.name].masqueradable : true);
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
