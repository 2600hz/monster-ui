define(function(require) {
	var $ = require('jquery'),
		_ = require('lodash'),
		monster = require('monster');

	var app = {
		subModules: [
			'alerts',
			'socket'
		],

		i18n: {
			'de-DE': { customCss: false },
			'en-US': { customCss: false },
			'fr-FR': { customCss: false },
			'ru-RU': { customCss: false }
		},

		subscribe: {
			'core.isActiveAppPlugin': 'isActiveAppPlugin',
			'core.loadApps': '_loadApps',
			'core.showAppName': 'showAppName',
			'core.triggerMasquerading': 'triggerMasquerading',
			'core.restoreMasquerading': 'restoreMasquerading',
			'core.initializeShortcuts': 'initializeShortcuts',
			'webphone.start': 'startWebphone',
			'core.hideTopbarDropdowns': 'hideTopbarDropdowns'
		},

		//Default app to render if the user is logged in, can be changed by setting a default app
		_defaultApp: 'appstore',

		/**
		 * Holds timeout IDs for global progress indicator
		 * @type {Object}
		 */
		indicator: {},

		// Global var to determine if there is a request in progress
		request: {
			active: false,
			counter: 0
		},

		appFlags: {},

		load: function(callback) {
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

		render: function(container) {
			var self = this,
				urlVars = monster.util.getUrlVars(),
				dataTemplate = {
					hidePowered: monster.config.whitelabel.hide_powered,
					jiraFeedback: {
						enabled: monster.config.whitelabel.hasOwnProperty('jiraFeedback') && monster.config.whitelabel.jiraFeedback.enabled === true,
						url: monster.config.whitelabel.hasOwnProperty('jiraFeedback') ? monster.config.whitelabel.jiraFeedback.url : ''
					},
					useDropdownApploader: monster.config.whitelabel.useDropdownApploader
				},
				mainTemplate = $(self.getTemplate({
					name: 'app',
					data: dataTemplate
				})),
				crossSiteMessaging = monster.config.crossSiteMessaging;

			document.title = monster.config.whitelabel.applicationTitle;

			self.checkURLVars(urlVars);

			self.loadAdditionalStyles();
			self.bindEvents(mainTemplate);
			self.displayVersion(mainTemplate);
			self.displayLogo(mainTemplate);
			self.displayFavicon();
			self.loadSVG();

			if (!_.isUndefined(crossSiteMessaging)) {
				self.bindCrossSiteMessagingHandler(crossSiteMessaging);
			}

			container.append(mainTemplate);

			monster.waterfall([
				_.bind(self.loadIncludes, self)
			], _.bind(self.loadAuth, self));
		},

		bindCrossSiteMessagingHandler: function(crossSiteMessaging) {
			var origin = crossSiteMessaging.origin,
				topics = crossSiteMessaging.topics;

			var handleCrossSiteMessages = function handleCrossSiteMessages(event) {
				var activeApp = monster.apps.getActiveApp(),
					eventData = event.data;

				if (!_.isString(eventData) || activeApp !== eventData.split('.')[0]) {
					return;
				}

				if (event.origin !== origin || !topics.includes(eventData) || !monster.util.isAuthorizedTopicForCrossSiteMessaging(eventData)) {
					return;
				}

				monster.pub('core.crossSiteMessage.' + activeApp, eventData);
			};

			window.addEventListener('message', handleCrossSiteMessages);
		},

		loadSVG: function() {
			var self = this,
				svgTemplate = $(self.getTemplate({
					name: 'svg-container'
				}));

			$('.core-wrapper').append(svgTemplate);
		},

		// We need the whitelabel profile to be loaded to execute this, that's why it's in core and not in monster directly
		loadAdditionalStyles: function() {
			var self = this;

			_.each(monster.config.whitelabel.additionalCss, function(path) {
				monster.css(self, 'css/' + path);
			});
		},

		checkURLVars: function(urlVars) {
			var self = this;

			// In dashboard mode we want to disable the logout timer, and also remove some css elements
			if (urlVars.hasOwnProperty('view') && urlVars.view === 'dashboard') {
				$('.core-wrapper').addClass('dashboard');
				monster.config.whitelabel.logoutTimer = 0;
			}
		},

		startWebphone: function() {
			var self = this;

			monster.webphone.init();
		},

		loadIncludes: function(callback) {
			var requireUrl = function(url, next) {
					require([url], next, _.partial(_.ary(next, 1), null));
				},
				requireUrlFactory = function(url) {
					return _.partial(requireUrl, url);
				};

			monster.series(_.map(
				monster.config.whitelabel.includes,
				requireUrlFactory
			), callback);
		},

		loadAuth: function() {
			var self = this;

			monster.apps.load('auth', function(err, app) {
				app.render($('#monster_content'));
			});
		},

		/**
		 * Updates topbar current app with active/specified app
		 * @param  {String} pName Unique app name
		 */
		showAppName: function(pName) {
			var self = this,
				apps = monster.util.listAppStoreMetadata('user'),
				name = _.isString(pName) ? pName : monster.apps.getActiveApp(),
				$navbar = $('.core-topbar'),
				$current = $navbar.find('#main_topbar_current_app'),
				app = _
					.chain([{
						name: 'myaccount',
						label: self.i18n.active().controlCenter,
						icon: monster.util.getAppIconPath({ name: 'myaccount' })
					}])
					.concat(apps)
					.find({ name: name })
					.value(),
				$new = name !== 'appstore' ? $(self.getTemplate({
					name: 'current-app',
					data: app
				})) : '';

			$current
				.hide()
				.empty()
				.append($new)
				.fadeIn(200);
		},

		isActiveAppPlugin: function isActiveAppPlugin(callback) {
			var self = this;

			if (!_.includes(self.getPlugins(), monster.apps.getActiveApp())) {
				return;
			}

			callback && callback();
		},

		getPlugins: function getPlugins(callback) {
			var plugins = [
				'apploader',
				'common',
				'myaccount'
			];
			return _.isFunction(callback) ? callback(plugins) : plugins;
		},

		/**
		 * @param  {Object} args
		 * @param  {String} [args.defaultApp]
		 */
		_loadApps: function(args) {
			var self = this,
				loggedInAppsToLoad = _
					.chain(monster.config.whitelabel)
					.get('additionalLoggedInApps', [])
					.concat(self.getPlugins())
					.reject(function(name) {
						return _.has(monster.apps, name);
					})
					.value();

			monster.parallel(_.map(loggedInAppsToLoad, function(name) {
				return function(callback) {
					monster.apps.load(name, callback);
				};
			}), function afterBaseAppsLoad(err, result) {
				// If admin with no app, go to app store, otherwite, oh well...
				var defaultApp = monster.util.isAdmin()
					? args.defaultApp || self._defaultApp
					: args.defaultApp;

				// Now that the user information is loaded properly, check if we tried to force the load of an app via URL.
				monster.routing.parseHash();

				// If there wasn't any match, trigger the default app
				if (!monster.routing.hasMatch()) {
					if (_.isUndefined(defaultApp)) {
						monster.pub('apploader.show');
						console.warn('Current user doesn\'t have a default app');
					} else {
						monster.routing.goTo('apps/' + defaultApp);
					}
				}
			});
		},

		bindEvents: function(container) {
			var self = this,
				indicator = container.find('.progress-indicator');

			window.onerror = function(message, fileName, lineNumber, columnNumber, error) {
				monster.error('js', {
					message: message,
					fileName: fileName,
					lineNumber: lineNumber,
					columnNumber: columnNumber || '',
					error: error || {}
				});
			};

			/* Only subscribe to the requestStart and End event when the indicator is loaded */
			monster.sub('monster.requestStart', function(params) {
				self.onRequestStart(_.merge({
					indicator: indicator
				}, params));
			});

			monster.sub('monster.requestEnd', function(params) {
				self.onRequestEnd(_.merge({
					indicator: indicator
				}, params));
			});

			// Hide dropdowns when clicking anywhere outside the topbar nav links
			$(document).on('click',
				_.throttle(function(e) {
					if ($(e.target).closest('#main_topbar_nav').length > 0) {
						return;
					}
					e.stopPropagation();
					self.hideTopbarDropdowns();
				}, 250));

			// Hide dropdowns on click at any topbar link
			container.find('.core-topbar .links').on('click', function() {
				self.hideTopbarDropdowns({ except: $(this).attr('id') });
			});

			// Different functionality depending on whether default apploader or dropdown apploader to be opened
			var eventType = monster.config.whitelabel.useDropdownApploader ? 'mouseover' : 'click';
			container.find('#main_topbar_apploader_link').on(eventType, function(e) {
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
						if (currentApp in monster.apps) {
							monster.apps[currentApp].render();
						}
						self.hideAccountToggle();
					}
				});
			});

			container.find('#main_topbar_account_toggle').on('click', '.current-account-container', function() {
				var $this = $(this);

				if ($this.attr('data-id') !== monster.apps.auth.currentAccount.id) {
					self.triggerMasquerading({
						account: {
							id: $this.attr('data-id'),
							name: $this.text()
						},
						callback: function() {
							var currentApp = monster.apps.getActiveApp();
							if (currentApp in monster.apps) {
								if (monster.apps[currentApp].isMasqueradable) {
									monster.apps[currentApp].render();
								} else {
									monster.ui.toast({
										type: 'warning',
										message: self.i18n.active().noMasqueradingAllowed
									});
									monster.apps.apploader.render();
								}
							}
							self.hideAccountToggle();
						}
					});
				}
			});

			container.find('#main_topbar_signout_link').on('click', function() {
				monster.pub('auth.clickLogout');
			});

			container.find('#main_topbar_current_app').on('click', function() {
				var appName = $(this).find('#main_topbar_current_app_name').data('name');

				if (appName === 'myaccount') {
					monster.apps.load(appName, function(err, app) {
						app.renderDropdown(false);
					});
				} else {
					monster.routing.goTo('apps/' + appName);
				}
			});

			container.find('#main_topbar_brand').on('click', function() {
				var appName = monster.apps.auth.defaultApp;

				if (appName) {
					monster.routing.goTo('apps/' + appName);
				}
			});

			if (monster.config.whitelabel.hasOwnProperty('nav')) {
				if (monster.config.whitelabel.nav.hasOwnProperty('logout') && monster.config.whitelabel.nav.logout.length > 0) {
					container
						.find('#main_topbar_signout_link')
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
			var self = this,
				mainContainer = $('#main_topbar_account_toggle_container');

			monster.pub('common.accountBrowser.render', {
				container: mainContainer.find('.account-toggle-content'),
				customClass: 'ab-dropdown',
				addBackButton: true,
				allowBackOnMasquerading: true,
				onSearch: function(searchValue) {
					if (searchValue) {
						var template = $(self.getTemplate({
							name: 'accountToggle-search',
							data: {
								searchValue: searchValue
							}
						}));

						mainContainer.find('.current-account-container').html(template);
					} else {
						mainContainer.find('.current-account-container').html(monster.apps.auth.currentAccount.name).attr('data-id', monster.apps.auth.currentAccount.id);
					}
				},
				onAccountClick: function(accountId, accountName) {
					self.callApi({
						resource: 'account.get',
						data: {
							accountId: accountId
						},
						success: function(data, status) {
							self.triggerMasquerading({
								account: data,
								callback: function() {
									var currentApp = monster.apps.getActiveApp();
									if (currentApp in monster.apps) {
										if (monster.apps[currentApp].isMasqueradable) {
											monster.apps[currentApp].render();
										} else {
											monster.ui.toast({
												type: 'warning',
												message: self.i18n.active().noMasqueradingAllowed
											});
											monster.apps.apploader.render();
										}
									}
									self.hideAccountToggle();
								}
							});
						}
					});
				},
				onChildrenClick: function(data) {
					mainContainer.find('.current-account-container').html(data.parentName).attr('data-id', data.parentId);
				},
				onBackToParentClick: function(data) {
					mainContainer.find('.current-account-container').html(data.parentName).attr('data-id', data.parentId);
				},
				callback: function(data) {
					mainContainer.find('.current-account-container').html(monster.apps.auth.currentAccount.name).attr('data-id', monster.apps.auth.currentAccount.id);
				}
			});
			$('#main_topbar_account_toggle').addClass('open');
		},

		toggleAccountToggle: function() {
			var self = this;
			if ($('#main_topbar_account_toggle').hasClass('open')) {
				self.hideAccountToggle();
			} else {
				self.showAccountToggle();
			}
		},

		triggerMasquerading: function(args) {
			var self = this,
				account = args.account.data,
				callback = args.callback,
				afterGetData = function(account) {
					monster.apps.auth.currentAccount = $.extend(true, {}, account);
					self.updateApps(account.id);

					monster.apps.auth.currentAccount.reseller_id = _.get(args, 'account.metadata.reseller_id');
					monster.apps.auth.currentAccount.is_reseller = _.get(args, 'account.metadata.is_reseller');

					monster.pub('myaccount.renderNavLinks', {
						name: account.name,
						isMasquerading: true
					});
					$('#main_topbar_account_toggle').addClass('masquerading');

					monster.ui.toast({
						type: 'info',
						message: self.getTemplate({
							name: '!' + self.i18n.active().triggerMasquerading,
							data: {
								accountName: account.name
							}
						})
					});

					monster.pub('core.changedAccount');

					callback && callback();
				};

			if (args.account.id === monster.apps.auth.originalAccount.id) {
				self.restoreMasquerading({
					callback: callback
				});
			} else if (!args.account.hasOwnProperty('name')) {
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
			} else {
				afterGetData(args.account);
			}
		},

		updateApps: function(accountId) {
			$.each(monster.apps, function(key, val) {
				if (val.hasOwnProperty('isMasqueradable') ? val.isMasqueradable : true) {
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

			monster.ui.toast({
				type: 'info',
				message: self.i18n.active().restoreMasquerading
			});

			monster.pub('core.changedAccount');

			callback && callback();
		},

		/* Had to update that code because mainTemplate is no longer the main container, it's an array of divs, where one of them is the core-footer,
			so we look through that array and once we found it we add the version */
		displayVersion: function(mainTemplate) {
			var self = this,
				version = monster.util.getVersion(),
				container,
				$potentialContainer;

			_.each(mainTemplate, function(potentialContainer) {
				$potentialContainer = $(potentialContainer);

				if ($potentialContainer.hasClass('core-footer')) {
					container = $potentialContainer;
				}
			});

			if (container) {
				container.find('.tag-version').html('(' + version + ')');
			}
		},

		displayLogo: function(container) {
			var self = this,
				domain = window.location.hostname,
				apiUrl = monster.config.api.default,
				fillLogo = function(url) {
					var formattedURL = url.indexOf('src/') === 0 ? url.substr(4, url.length) : url;
					container.find('#main_topbar_brand').css('background-image', 'url(' + formattedURL + ')');
				};

			self.callApi({
				resource: 'whitelabel.getLogoByDomain',
				data: {
					domain: domain,
					generateError: false,
					dataType: '*'
				},
				success: function(_data) {
					fillLogo(apiUrl + 'whitelabel/' + domain + '/logo?_=' + new Date().getTime());
				},
				error: function(error) {
					if (monster.config.whitelabel.hasOwnProperty('logoPath') && monster.config.whitelabel.logoPath.length) {
						fillLogo(monster.config.whitelabel.logoPath);
					} else {
						fillLogo('apps/core/style/static/images/logo.svg');
					}
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
					var src = apiUrl + 'whitelabel/' + domain + '/icon?_=' + new Date().getTime();
					changeFavIcon(src);
				},
				error: function(error) {
					var src = 'apps/core/style/static/images/favicon.png';
					changeFavIcon(src);
				}
			});
		},

		onRequestStart: function(args) {
			var self = this,
				waitTime = 250,
				$indicator = args.indicator,
				bypassProgressIndicator = _.get(args, 'bypassProgressIndicator', false);

			// If indicated, bypass progress indicator display/hide process
			if (bypassProgressIndicator) {
				return;
			}

			self.request.counter++;

			// If we start a request, we cancel any existing timeout that was checking if the loading was over
			clearTimeout(self.indicator.endTimeout);

			if (self.request.counter) {
				self.request.active = true;
			}

			// And we start a timeout that will check if there are still some active requests after %waitTime%.
			// If yes, it will then show the indicator. We do this to avoid showing the indicator to often, and just show it on long requests.
			self.indicator.startTimeout = setTimeout(function() {
				if (self.request.counter && !$indicator.hasClass('active')) {
					$indicator.addClass('active');
				}

				clearTimeout(self.indicator.startTimeout);
			}, waitTime);
		},

		onRequestEnd: function(args) {
			var self = this,
				waitTime = 50,
				$indicator = args.indicator,
				bypassProgressIndicator = _.get(args, 'bypassProgressIndicator', false);

			// If indicated, bypass progress indicator display/hide process
			if (bypassProgressIndicator) {
				return;
			}

			self.request.counter--;

			// If there are no active requests, we set a timeout that will check again after %waitTime%
			// If there are no active requests after the timeout, then we can safely remove the indicator.
			// We do this to avoid showing and hiding the indicator too quickly
			if (!self.request.counter) {
				self.request.active = false;

				self.indicator.endTimeout = setTimeout(function() {
					if ($indicator.hasClass('active')) {
						$indicator.removeClass('active');
					}

					clearTimeout(self.indicator.startTimeout);
					clearTimeout(self.indicator.endTimeout);
				}, waitTime);
			}
		},

		initializeShortcuts: function(apps) {
			var self = this,
				isEnabled = _.partial(_.get, _, 'isEnabled', true),
				shortcuts = _
					.chain([
						{
							isEnabled: !monster.config.whitelabel.useDropdownApploader,
							category: 'general',
							key: '#',
							title: self.i18n.active().globalShortcuts.keys['#'].title,
							callback: function() {
								monster.pub('apploader.toggle');
							}
						},
						{
							category: 'general',
							key: '?',
							title: self.i18n.active().globalShortcuts.keys['?'].title,
							callback: function() {
								self.showShortcutsPopup();
							}
						},
						{
							category: 'general',
							key: '@',
							title: self.i18n.active().globalShortcuts.keys['@'].title,
							callback: function() {
								monster.pub('myaccount.renderDropdown');
							}
						},
						{
							adminOnly: true,
							category: 'general',
							key: 'a',
							title: self.i18n.active().globalShortcuts.keys.a.title,
							callback: function() {
								self.toggleAccountToggle();
							}
						},
						{
							adminOnly: true,
							category: 'general',
							key: 'shift+m',
							title: self.i18n.active().globalShortcuts.keys['shift+m'].title,
							callback: function() {
								self.restoreMasquerading({
									callback: function() {
										var currentApp = monster.apps.getActiveApp();
										if (currentApp in monster.apps) {
											monster.apps[currentApp].render();
										}
										self.hideAccountToggle();
									}
								});
							}
						},
						{
							adminOnly: true,
							category: 'general',
							key: 'shift+s',
							title: self.i18n.active().globalShortcuts.keys['shift+s'].title,
							callback: function() {
								monster.util.protectSensitivePhoneNumbers();
							}
						},
						{
							category: 'general',
							key: 'd',
							title: self.i18n.active().globalShortcuts.keys.d.title,
							callback: function() {
								self.showDebugPopup();
							}
						},
						{
							category: 'general',
							key: 'r',
							title: self.i18n.active().globalShortcuts.keys.r.title,
							callback: function() {
								monster.routing.goTo('apps/' + monster.apps.getActiveApp());
							}
						},
						{
							category: 'general',
							key: 'shift+l',
							title: self.i18n.active().globalShortcuts.keys['shift+l'].title,
							callback: function() {
								monster.pub('auth.logout');
							}
						}
					])
					.filter(isEnabled)
					.concat(self.getGoToAppsShortcuts(apps))
					.value();

			_.forEach(shortcuts, _.bind(monster.ui.addShortcut, monster.ui));
		},

		showDebugPopup: function() {
			if ($('.debug-dialog').length) {
				return;
			}
			var self = this,
				acc = monster.apps.auth.currentAccount,
				socketInfo = monster.socket.getInfo(),
				activeApp = monster.apps.getActiveApp(),
				dataTemplate = {
					account: acc,
					authToken: self.getAuthToken(),
					apiUrl: self.apiUrl,
					version: _.merge({
						kazoo: monster.config.developerFlags.kazooVersion
					}, !monster.isDev() && {
						app: self.getTemplate({
							name: '!' + self.i18n.active().debugAccountDialog.versioning.app.pattern,
							data: {
								app: activeApp,
								version: _.get(monster.apps, [activeApp, 'data', 'version'])
							}
						}),
						monster: monster.util.getVersion()
					}),
					hideURLs: monster.util.isWhitelabeling() && !monster.util.isSuperDuper(),
					socket: _.pick(socketInfo, [
						'isConfigured',
						'isConnected',
						'uri'
					])
				},
				template = $(self.getTemplate({
					name: 'dialog-accountInfo',
					data: dataTemplate
				}));

			template.find('.copy-clipboard').each(function() {
				var $this = $(this);
				monster.ui.clipboard($this, function() {
					return $this.siblings('.to-copy').html();
				});
			});

			monster.ui.tooltips(template);

			monster.ui.dialog(template, {
				title: self.i18n.active().debugAccountDialog.title
			});
		},

		showShortcutsPopup: function() {
			if (!$('.shortcuts-dialog').length) {
				var self = this,
					shortcuts = monster.ui.getShortcuts(),
					shortcutsTemplate = $(self.getTemplate({
						name: 'shortcuts',
						data: {
							categories: shortcuts
						}
					}));

				monster.ui.dialog(shortcutsTemplate, {
					title: self.i18n.active().globalShortcuts.popupTitle,
					width: 700
				});
			}
		},

		getGoToAppsShortcuts: function(apps) {
			var self = this,
				getCallback = function(app) {
					return _.bind(monster.routing.goTo, monster.routing, 'apps/' + app.name);
				},
				appsToBind = {
					userportal: 'shift+u',
					voip: 'shift+v',
					accounts: 'shift+a',
					callflows: 'shift+c',
					branding: 'shift+b',
					provisioner: 'shift+p'
				};

			return _
				.chain(apps)
				.filter(_.flow(
					_.partial(_.get, _, 'name'),
					_.partial(_.has, appsToBind)
				))
				.map(function(app) {
					return {
						category: 'apps',
						key: appsToBind[app.name],
						title: app.label,
						callback: getCallback(app)
					};
				})
				.value();
		},

		/**
		 * Hide topbar dropdowns
		 * @param  {Object} [args]
		 * @param  {String} [args.except]  ID of any element that does not want to be hidden
		 */
		hideTopbarDropdowns: function(args) {
			if (!monster.util.isLoggedIn()) {
				// If user is not logged in, there is no menu displayed, so there is no need
				// to hide topbar dropdowns
				return;
			}

			var except = _.get(args, 'except');

			if (except !== 'main_topbar_account_toggle_link') {
				$('#main_topbar_account_toggle').removeClass('open');
			}
			if (except !== 'main_topbar_alerts_link') {
				monster.pub('core.alerts.hideDropdown');
			}
		}
	};

	return app;
});
