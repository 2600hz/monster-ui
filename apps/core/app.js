define(function(require){
	var $ = require('jquery'),
		_ = require('underscore'),
		monster = require('monster'),
		toastr = require('toastr');

	var app = {
		name: 'core',

		css: [ 'app' ],

		i18n: {
			'en-US': { customCss: false },
			'fr-FR': { customCss: false },
			'ru-RU': { customCss: false }
		},

		requests: {},

		subscribe: {
			'core.loadApps': '_loadApps',
			'core.showAppName' : 'showAppName',
			'core.triggerMasquerading': 'triggerMasquerading',
			'core.restoreMasquerading': 'restoreMasquerading'
		},

		//List of apps required once the user is logged in (LIFO)
		_baseApps: ['apploader', 'appstore', 'myaccount', 'common'],

		//Default app to render if the user is logged in, can be changed by setting a default app
		_defaultApp: 'appstore',

		// Global var used to show the loading gif
		spinner: {
			requestAmount: 0,
			active: false
		},

		load: function(callback){
			var self = this;

			self.callApi({
				resource: 'whitelabel.getByDomain',
				data: {
					domain: window.location.hostname,
					generateError: false
				},
				success: function(data) {
					callback(self);
				},
				error: function(err) {
					callback(self);
				}
			});
		},

		render: function(container){
			var self = this,
				mainTemplate = $(monster.template(self, 'app', { hidePowered: monster.config.whitelabel.hide_powered }));
				
			document.title = monster.config.whitelabel.applicationTitle;

			self.bindEvents(mainTemplate);
			self.displayVersion(mainTemplate);
			self.displayLogo(mainTemplate);
			self.displayFavicon();

			container.append(mainTemplate);

			self.loadAuth(); // do this here because subsequent apps are dependent upon core layout
		},

		loadAuth: function(){
			var self = this;

			monster.apps.load('auth', function(app){
				app.render($('#monster-content'));
			});
		},

		showAppName: function(appName) {
			var self = this,
				navbar = $('#main_topbar'),
				currentApp = navbar.find('#main_topbar_current_app'),
				defaultApp;

			if (appName === 'myaccount') {
				var myaccount = {
						name: appName,
						label: 'Control Center'
					};

				if (currentApp.is(':empty')) {
					currentApp.append(monster.template(self, 'current-app', myaccount));

					navbar
						.find('#main_topbar_current_app_name')
						.data('originalName', 'appstore');

					navbar.find('#main_topbar_current_app_name').fadeIn(100);
				}
				else {
					var originalName = navbar.find('#main_topbar_current_app_name').data('name');

					navbar.find('#main_topbar_current_app_name').fadeOut(100, function() {
						currentApp
							.empty()
							.append(monster.template(self, 'current-app', myaccount));

						navbar
							.find('#main_topbar_current_app_name')
							.data('originalName', originalName);

						navbar.find('#main_topbar_current_app_name').fadeIn(100);
					});
				}
			}
			else {
				_.each(monster.apps.auth.installedApps, function(val) {
					if ( val.name === appName ) {
						defaultApp = val;
					}
				});

				if ( appName === 'appstore' ) {
					currentApp.empty();
				} else if ( currentApp.is(':empty') ) {
					currentApp.append(monster.template(self, 'current-app', defaultApp));

					navbar.find('#main_topbar_current_app_name').fadeIn(100);
				} else {
					navbar.find('#main_topbar_current_app_name').fadeOut(100, function() {
						currentApp
							.empty()
							.append(monster.template(self, 'current-app', defaultApp));

						navbar.find('#main_topbar_current_app_name').fadeIn(100);
					});
				}
			}
		},

		_loadApps: function(args) {
			var self = this;

			if(!self._baseApps.length) {
				/* If admin with no app, go to app store, otherwise, oh well... */
				var defaultApp = monster.apps['auth'].currentUser.priv_level === 'admin' ? args.defaultApp || self._defaultApp : args.defaultApp;

				// Now that the user information is loaded properly, check if we tried to force the load of an app via URL.
				monster.routing.parseHash();

				// If there wasn't any match, trigger the default app
				if(!monster.routing.hasMatch()) {
					if(typeof defaultApp !== 'undefined') {
						monster.apps.load(defaultApp, function(app) {
							self.showAppName(defaultApp);
							app.render($('#monster-content'));
						}, {}, true);
					}
					else {
						console.warn('Current user doesn\'t have a default app');
					}
				}
			}
			else {
				var appName = self._baseApps.pop();

				monster.apps.load(appName, function(app) {
					self._loadApps(args);
				});
			}
		},

		bindEvents: function(container) {
			var self = this,
				spinner = container.find('.loading-wrapper');

			window.onerror = function(message, fileName, lineNumber, columnNumber, error) {
				monster.error('js', {
					message: message,
					fileName: fileName,
					lineNumber: lineNumber,
					columnNumber: columnNumber || '',
					error: error || {}
				});
			};

			/* Only subscribe to the requestStart and End event when the spinner is loaded */
			monster.sub('monster.requestStart', function() {
				self.onRequestStart(spinner);
			});

			monster.sub('monster.requestEnd', function() {
				self.onRequestEnd(spinner);
			});

			container.find('#main_topbar_apploader_link').on('click', function(e) {
				e.preventDefault();
				monster.pub('apploader.toggle');
			});

			container.find('#main_topbar_account_toggle_link').on('click', function(e) {
				e.preventDefault();
				self.toggleAccountToggle();
			});

			container.find('#main_topbar_account_toggle').on('click', '.home-account-link', function() {
				self.restoreMasquerading({
					callback: function() {
						var currentApp = monster.apps.getActiveApp();
						if(currentApp in monster.apps) {
							monster.apps[currentApp].render();
						}
						self.hideAccountToggle();
					}
				});
			});

			container.find('#main_topbar_signout_link').on('click', function() {
				monster.pub('auth.clickLogout');
			});

			container.find('#main_topbar_current_app').on('click', function() {
				var appName = $(this).find('#main_topbar_current_app_name').data('name');

				if (appName === 'myaccount') {
					monster.apps.load(appName, function(app) {
						app.renderDropdown(false);
					});
				}
				else {
					monster.apps.load(appName, function(app) {
						app.render();
					});
				}
			});

			container.find('#main_topbar_brand').on('click', function() {
				var appName = monster.apps.auth.defaultApp;

				if(appName) {
					monster.pub('myaccount.hide');
					monster.apps.load(appName, function(app) {
						self.showAppName(appName);
						app.render();
					});
				}
			});

			$('body').on('click', '*[class*="monster-button"]:not(.disabled)', function(event) {
				var $this = $(this),
					splashDiv = $('<div class="monster-splash-effect"/>'),
					offset = $this.offset(),
					xPos = event.pageX - offset.left,
					yPos = event.pageY - offset.top;
				
				splashDiv.css({
					height: $this.height(),
					width: $this.height(),
					top: yPos - (splashDiv.height()/2),
					left: xPos - (splashDiv.width()/2)
				}).appendTo($this);

				window.setTimeout(function(){
					splashDiv.remove();
				}, 1500);
			});

			if(monster.config.whitelabel.hasOwnProperty('nav')) {
				if(monster.config.whitelabel.nav.hasOwnProperty('logout') && monster.config.whitelabel.nav.logout.length > 0) {
					container.find('#main_topbar_signout_link')
							 .unbind('click')
							 .attr('href', monster.config.whitelabel.nav.logout);
				}
			}

			container.find('[data-toggle="tooltip"]').tooltip();
		},

		hideAccountToggle: function() {
			$('#main_topbar_account_toggle_container .account-toggle-content').empty();
			 $('#main_topbar_account_toggle_container .current-account-container').empty();
			$('#main_topbar_account_toggle').removeClass('open');
		},

		showAccountToggle: function() {
			var self = this;
			monster.pub('common.accountBrowser.render', {
				container: $('#main_topbar_account_toggle_container .account-toggle-content'),
				breadcrumbsContainer: $('#main_topbar_account_toggle_container .current-account-container'),
				customClass: 'ab-dropdown',
				addBackButton: true,
				allowBackOnMasquerading: true,
				onAccountClick: function(accountId, accountName) {
					self.callApi({
						resource: 'account.get',
						data: {
							accountId: accountId
						},
						success: function(data, status) {
							self.triggerMasquerading({
								account: data.data,
								callback: function() {
									var currentApp = monster.apps.getActiveApp();
									if(currentApp in monster.apps) {
										if(monster.apps[currentApp].isMasqueradable) {
											monster.apps[currentApp].render();
										}
										else {
											toastr.warning(self.i18n.active().noMasqueradingAllowed);
											monster.apps.apploader.render();
										}
									}
									self.hideAccountToggle();
								}
							});
						}
					});
				}
			});
			$('#main_topbar_account_toggle').addClass('open');
		},

		toggleAccountToggle: function() {
			var self = this;
			if($('#main_topbar_account_toggle').hasClass('open')) {
				self.hideAccountToggle();
			} else {
				self.showAccountToggle();
			}
		},

		triggerMasquerading: function(args) {
			var self = this,
				account = args.account,
				callback = args.callback,
				afterGetData = function(account) {
					monster.apps.auth.currentAccount = $.extend(true, {}, account);
					self.updateApps(account.id);

					monster.pub('myaccount.renderNavLinks', {
						name: account.name,
						isMasquerading: true
					});
					$('#main_topbar_account_toggle').addClass('masquerading');

					toastr.info(monster.template(self, '!' + self.i18n.active().triggerMasquerading, { accountName: account.name }));

					callback && callback();
				};

			if(args.account.id === monster.apps.auth.originalAccount.id) {
				self.restoreMasquerading({
					callback: callback
				});
			}
			else if(!args.account.hasOwnProperty('name')) {
				self.callApi({
					resource: 'account.get',
					data: {
						accountId: account.id,
						generateError: false
					},
					success: function(data, status) {
						account = data.data;

						afterGetData(account);
					},
					error: function() {
						// If we couldn't get the account, the id must have been wrong, we just continue with the original callback
						callback && callback();
					}
				});
			}
			else {
				afterGetData(args.account);
			}
		},

		updateApps: function(accountId) {
			$.each(monster.apps, function(key, val) {
				if(val.hasOwnProperty('isMasqueradable') ? val.isMasqueradable : true) {
					val.accountId = accountId;
				}
			});
		},

		restoreMasquerading: function(args) {
			var self = this,
				callback = args.callback;

			monster.apps.auth.currentAccount = $.extend(true, {}, monster.apps.auth.originalAccount);
			self.updateApps(monster.apps.auth.originalAccount.id);

			monster.pub('myaccount.renderNavLinks');
			$('#main_topbar_account_toggle').removeClass('masquerading');

			toastr.info(self.i18n.active().restoreMasquerading);

			callback && callback();
		},

		displayVersion: function(container) {
			var self = this;

			monster.getVersion(function(version) {
				container.find('.footer-wrapper .tag-version').html('('+version+')');

				monster.config.version = version;
			});
		},

		displayLogo: function(container) {
			var self = this,
				domain = window.location.hostname,
				apiUrl = monster.config.api.default;

			self.callApi({
				resource: 'whitelabel.getLogoByDomain',
				data: {
					domain: domain,
					generateError: false,
					dataType: '*'
				},
				success: function(_data) {
					container.find('#main_topbar_brand').css('background-image', 'url(' + apiUrl + 'whitelabel/' + domain + '/logo?_='+new Date().getTime()+')');
				},
				error: function(error) {
					container.find('#main_topbar_brand').css('background-image', 'url("apps/core/style/static/images/logo.svg")');
				}
			});
		},

		displayFavicon: function() {
			var self = this,
				domain = window.location.hostname,
				apiUrl = monster.config.api.default,
				changeFavIcon = function(src) {
					var link = document.createElement('link'),
						oldLink = document.getElementById('dynamicFavicon');

					link.id = 'dynamicFavicon';
					link.rel = 'shortcut icon';
					link.href = src;

					if (oldLink) {
						document.head.removeChild(oldLink);
					}

					document.head.appendChild(link);
				};

			self.callApi({
				resource: 'whitelabel.getIconByDomain',
				data: {
					domain: domain,
					generateError: false,
					dataType: '*'
				},
				success: function(_data) {
					var src = apiUrl + 'whitelabel/' + domain + '/icon?_='+new Date().getTime();
					changeFavIcon(src);
				},
				error: function(error) {
					var src = 'apps/core/style/static/images/favicon.png';
					changeFavIcon(src);
				}
			});
		},

		onRequestStart: function(spinner) {
			var self = this,
				waitTime = 250;

			self.spinner.requestAmount++;

			// If we start a request, we cancel any existing timeout that was checking if the loading was over
			clearTimeout(self.spinner.endTimeout);

			// And we start a timeout that will check if there are still some active requests after %waitTime%.
			// If yes, it will then show the spinner. We do this to avoid showing the spinner to often, and just show it on long requests.
			self.spinner.startTimeout = setTimeout(function() {
				if(self.spinner.requestAmount !== 0 && self.spinner.active === false) {
					self.spinner.active = true;
					spinner.addClass('active');
					
					clearTimeout(self.spinner.startTimeout);
				}
			}, waitTime);
		},

		onRequestEnd: function(spinner) {
			var self = this,
				waitTime = 50;

			self.spinner.requestAmount--;

			// If there are no active requests, we set a timeout that will check again after %waitTime%
			// If there are no active requests after the timeout, then we can safely remove the spinner.
			// We do this to avoid showing and hiding the spinner too quickly
			if(self.spinner.requestAmount === 0) {
				self.spinner.endTimeout = setTimeout(function() {
					if(self.spinner.requestAmount === 0 && self.spinner.active === true) {
						spinner.removeClass('active');
						self.spinner.active = false;

						clearTimeout(self.spinner.startTimeout);
						clearTimeout(self.spinner.endTimeout);
					}
				}, waitTime)
			}
		}
	};

	return app;
});
