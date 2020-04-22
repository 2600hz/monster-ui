define(function(require) {
	var $ = require('jquery'),
		_ = require('lodash'),
		monster = require('monster');

	var app = {
		name: 'apploader',

		isMasqueradable: false,

		css: [ 'app' ],

		i18n: {
			'de-DE': { customCss: false },
			'en-US': { customCss: false },
			'fr-FR': { customCss: false },
			'ru-RU': { customCss: false }
		},

		requests: {
		},

		appFlags: {
			modal: undefined
		},

		subscribe: {
			'apploader.destroy': '_destroy',
			'apploader.show': 'render',
			'apploader.hide': '_hide',
			'apploader.toggle': '_toggle',
			'apploader.current': '_currentApp',
			'apploader.getAppList': 'getAppList'
		},

		load: function(callback) {
			var self = this;

			self.initApp(function() {
				callback && callback(self);
			});
		},

		initApp: function(callback) {
			var self = this;

			self.isMasqueradable = false;

			monster.pub('auth.initApp', {
				app: self,
				callback: callback
			});
		},

		_render: function() {
			var self = this;
		},

		isRendered: function() {
			var self = this;

			if (monster.config.whitelabel.useDropdownApploader) {
				return $('.app-list-dropdown-wrapper').length !== 0;
			} else {
				return typeof self.appFlags.modal !== 'undefined';
			}
		},

		_destroy: function() {
			var self = this;

			if (self.appFlags.modal) {
				self.appFlags.modal.destroy();
				self.appFlags.modal = undefined;
			}
		},

		/**
		 * @param  {Function} [pArgs.callback]
		 */
		render: function(pArgs) {
			var self = this,
				args = pArgs || {},
				template;

			if (!self.isRendered()) {
				self.getUserApps(function(appList) {
					if (monster.config.whitelabel.useDropdownApploader) {
						template = $(self.getTemplate({
							name: 'appList',
							data: {
								defaultApp: appList[0],
								apps: appList,
								allowAppstore: monster.apps.auth.currentUser.priv_level === 'admin' && !monster.config.whitelabel.hideAppStore
							}
						}));

						$('#appList').empty().append(template);

						self.bindDropdownApploaderEvents(template);
					} else {
						template = $(self.getTemplate({
							name: 'app',
							data: {
								allowAppstore: monster.apps.auth.currentUser.priv_level === 'admin' && !monster.config.whitelabel.hideAppStore,
								defaultApp: monster.ui.formatIconApp(appList[0]),
								apps: appList
							}
						}));

						self.bindEvents(template, appList);

						self.appFlags.modal = monster.ui.fullScreenModal(template, {
							hideClose: true,
							destroyOnClose: false
						});
					}
					args.callback && args.callback();
				});
			} else {
				self.show({
					callback: args.callback
				});
			}
		},

		bindDropdownApploaderEvents: function(parent) {
			var self = this;

			parent.find('.appSelector').on('click', function() {
				var $this = $(this),
					appName = $this.data('name');

				if (appName) {
					monster.routing.goTo('apps/' + appName);
				}
			});
		},

		bindEvents: function(parent, appList) {
			var self = this,
				updateAppInfo = function updateAppInfo(id) {
					var app = appList.filter(function(v) { return id === v.id; })[0];

					parent.find('.app-description')
							.find('h4')
							.text(app.label)
							.addBack()
							.find('p')
							.text(app.description);
				};

			setTimeout(function() { parent.find('.search-query').focus(); });

			parent.find('.app-container').sortable({
				cancel: '.ui-sortable-disabled',
				receive: function(event, ui) {
					var item = $(ui.item),
						itemId = item.data('id');

					item.addClass('ui-sortable-disabled');

					$.each(parent.find('.left-div .app-element'), function(idx, el) {
						if ($(el).data('id') !== itemId) {
							$(el).remove();
						}
					});

					updateAppInfo(itemId);

					$(ui.sender).data('copied', true);
				},
				over: function() {
					parent.find('.left-div .app-element.ui-sortable-disabled')
						.hide();
				},
				out: function() {
					parent.find('.left-div .app-element.ui-sortable-disabled')
						.show();
				}
			});

			parent.find('.app-list').sortable({
				delay: 100,
				appendTo: parent.find('.app-container'),
				connectWith: '.app-container',
				sort: function() {
					parent.find('.app-container')
						.addClass('dragging');
				},
				helper: function(event, ui) {
					this.copyHelper = ui.clone().css('opacity', '0.2').insertAfter(ui);

					$(this).data('copied', false);

					return ui.clone();
				},
				stop: function() {
					var copied = $(this).data('copied');

					$(this.copyHelper).css('opacity', '1');

					if (!copied) {
						this.copyHelper.remove();
					}

					this.copyHelper = null;

					parent.find('.app-container')
						.removeClass('dragging');
				},
				over: function(event) {
					parent.find('.right-div .ui-sortable-placeholder')
						.hide();
				}
			});

			parent.find('.search-query').on('keyup', function(e) {
				var searchString = $(this).val().toLowerCase(),
					items = parent.find('.right-div .app-element');

				_.each(items, function(item) {
					var $item = $(item);

					$item.data('search').toLowerCase().indexOf(searchString) < 0 ? $item.hide() : $item.show();
				});

				if (e.keyCode === 13) {
					parent
						.find('.right-div .app-element:visible')
							.first()
								.click();
				}
			});

			parent.find('.search-query').on('blur', function() {
				$(this)
					.val('');

				parent.find('.right-div .app-element')
					.show();
			});

			parent.find('.right-div').on('mouseenter', '.app-element', function() {
				updateAppInfo($(this).data('id'));
			});

			parent.find('.right-div').on('mouseleave', '.app-element', function() {
				updateAppInfo(parent.find('.left-div .app-element').data('id'));
			});

			parent.on('click', '.right-div .app-element, #launch_appstore, .default-app .app-element', function() {
				var $this = $(this),
					appName = $this.data('name');

				if (appName) {
					if (appName === 'appstore' || !(monster.util.isMasquerading() && monster.appsStore[appName].masqueradable === false)) {
						monster.routing.goTo('apps/' + appName);

						parent
							.find('.right-div .app-element.active')
								.removeClass('active');

						if (appName !== 'appstore') {
							$this.addClass('active');
						}

						self.appListUpdate(parent, appList, function(newAppList) {
							appList = newAppList;
						});
					} else {
						monster.ui.toast({
							type: 'error',
							message: self.i18n.active().noMasqueradingError
						});
					}
				}
			});

			parent.find('#close_app').on('click', function() {
				self.appListUpdate(parent, appList, function(newAppList) {
					appList = newAppList;

					self._hide(parent);
				});
			});

			$(document).on('keydown', function(e) {
				if (parent.is(':visible') && e.keyCode === 27) {
					var target = $(e.target);

					if (target.hasClass('search-query') && target.val() !== '') {
						target.blur();
						target.focus();
					} else {
						self.appListUpdate(parent, appList, function(newAppList) {
							appList = newAppList;

							self._hide(parent);
						});
					}
				}
			});
		},

		/**
		 * @param  {Function} [pArgs.callback]
		 */
		show: function(pArgs) {
			var self = this,
				args = pArgs || {};

			if (!monster.config.whitelabel.hasOwnProperty('useDropdownApploader') || monster.config.whitelabel.useDropdownApploader === false) {
				self.appFlags.modal.open({
					callback: args.callback
				});
			}
		},

		_hide: function() {
			var self = this;

			if (!monster.config.whitelabel.hasOwnProperty('useDropdownApploader') || monster.config.whitelabel.useDropdownApploader === false) {
				if (self.appFlags.modal) {
					self.appFlags.modal.close();
				}
			}
		},

		_toggle: function() {
			var self = this;

			if (self.isRendered()) {
				if (!monster.config.whitelabel.hasOwnProperty('useDropdownApploader') || monster.config.whitelabel.useDropdownApploader === false) {
					self.appFlags.modal.toggle();
					var apploader = $('#apploader');

					if (self.appFlags.modal.isVisible()) {
						apploader.find('.search-query').val('').focus();
					}
				}
			} else {
				self.render();
			}
		},

		/**
		 * Gets the currently loaded app.
		 */
		_currentApp: function(callback) {
			var self = this,
				apploader = $('#apploader'),
				activeApp = apploader.find('.right-div .app-element.active'),
				app = {};

			if (activeApp.length) {
				//If apploader is loaded get data from document.
				app = {
					id: activeApp.data('id'),
					name: activeApp.data('name')
				};
				callback && callback(app);
			} else {
				//This returns the default app, so only works when the apploader hasn't been loaded yet.
				self.getUserApps(function(apps) {
					app = {
						id: apps[0].id,
						name: apps[0].name
					};

					callback && callback(app);
				});
			}
		},

		getUserApps: function(callback) {
			var self = this;

			self.getAppList({
				scope: 'user',
				forceFetch: true,
				success: callback
			});
		},

		appListUpdate: function(parent, appList, callback) {
			var self = this,
				domAppList = $.map(parent.find('.right-div .app-element'), function(val) { return $(val).data('id'); }),
				sameOrder = appList.every(function(v, i) { return v.id === domAppList[i]; }),
				domDefaultAppId = parent.find('.left-div .app-element').data('id'),
				// If the user doesn't have any app in its list, we verify that the default app is still unset
				sameDefaultApp = appList.length ? appList[0].id === domDefaultAppId : (domDefaultAppId === undefined);

			// If new user with nothing configured, sameDefault App && sameOrder should be true
			if (sameDefaultApp && sameOrder) {
				callback(appList);
			} else {
				var newAppList = [];

				domAppList.unshift(domAppList.splice(domAppList.indexOf(domDefaultAppId), 1)[0]);

				appList.forEach(function(v) {
					newAppList[domAppList.indexOf(v.id)] = v;
				});

				monster.apps.auth.currentUser.appList = domAppList;
				monster.apps.auth.defaultApp = newAppList[0].name;

				self.userUpdate(callback(newAppList));
			}
		},

		userUpdate: function(callback) {
			var self = this;

			self.callApi({
				resource: 'user.update',
				data: {
					accountId: self.accountId,
					userId: self.userId,
					data: monster.apps.auth.currentUser
				},
				success: function(data, status) {
					callback && callback();
				}
			});
		},

		/**
		 * Get app list
		 * @param  {Object} args
		 * @param  {String} [args.accountId]
		 * @param  {('all'|'account'|'user')} [args.scope='all']  App list scope
		 * @param  {Boolean} [args.forceFetch=false]  Force to fetch app data from API instead of using the cached one
		 * @param  {Function} [args.success]  Callback function to send the retrieved app list
		 * @param  {Function} [args.error]  Callback function to notify errors
		 */
		getAppList: function(args) {
			var self = this,
				scope = _.get(args, 'scope', 'all'),
				forceFetch = _.get(args, 'forceFetch', false);

			monster.waterfall([
				// Get all apps
				function(waterfallCallback) {
					var allAps = monster.appsStore;

					if (!forceFetch && !_.isEmpty(allAps)) {
						waterfallCallback(null, allAps);
						return;
					}

					self.requestAppList({
						data: {
							accountId: _.get(args, 'accountId')
						},
						success: function(appList) {
							waterfallCallback(null, appList);
						},
						error: function() {
							waterfallCallback(true);
						}
					});
				},
				// Filter apps according to scope, if necessary
				function(allApps, waterfallCallback) {
					if (scope === 'all') {
						waterfallCallback(null, allApps);
						return;
					}

					var filteredAppList;

					if (scope === 'account') {
						filteredAppList = _.filter(allApps, function(app) {
							return _.has(app, 'allowed_users') && app.allowed_users !== 'specific';
						});

						waterfallCallback(null, filteredAppList);
						return;
					}

					var currentUser = monster.apps.auth.currentUser,
						userApps = _.get(currentUser, 'appList', []),
						updateUserApps = false,
						isAppInstalled = function(app) {
							if (app) {
								var appUsers = _
									.chain(app)
									.get('users', [])
									.map(function(val) {
										return val.id;
									})
									.value();

								if (app && app.allowed_users
									&& (
										(app.allowed_users === 'all')
										|| (app.allowed_users === 'admins' && currentUser.priv_level === 'admin')
										|| (app.allowed_users === 'specific' && _.includes(appUsers, currentUser.id))
									)) {
									return true;
								}
							}
							return false;
						};

					filteredAppList = [];
					allApps = _.keyBy(allApps, 'id');

					userApps = _.filter(userApps, function(appId) {
						var app = allApps[appId];
						if (isAppInstalled(app)) {
							filteredAppList.push(app);
							return true;
						} else {
							updateUserApps = true;
							return false;
						}
					});

					_.each(allApps, function(app) {
						if (!_.includes(userApps, app.id) && isAppInstalled(app)) {
							filteredAppList.push(app);

							userApps.push(app.id);
							updateUserApps = true;
						}
					});

					if (forceFetch && updateUserApps) {
						monster.apps.auth.currentUser.appList = userApps;
						self.userUpdate();
					}

					waterfallCallback(null, filteredAppList);
				},
				// Format app list
				function(appList, waterfallCallback) {
					var lang = monster.config.whitelabel.language,
						isoFormattedLang = lang.substr(0, 3).concat(lang.substr(lang.length - 2, 2).toUpperCase()),
						formattedApps = _.map(appList, function(app) {
							var currentLang = _.has(app.i18n, isoFormattedLang) ? isoFormattedLang : monster.defaultLanguage,
								i18n = app.i18n[currentLang];

							return {
								id: app.id,
								name: app.name,
								label: i18n.label,
								description: i18n.description,
								tags: app.tags
							};
						}),
						parallelRequests = _.map(formattedApps, function(formattedApp) {
							return function(parallelCallback) {
								formattedApp.icon = monster.util.getAppIconPath(formattedApp);
								monster.ui.formatIconApp(formattedApp);

								parallelCallback(null, formattedApp);
							};
						});

					monster.parallel(parallelRequests, function(err) {
						waterfallCallback(err, formattedApps);
					});
				}
			], function(err, appList) {
				if (err) {
					return _.has(args, 'error') && args.error(err);
				}

				_.has(args, 'success') && args.success(appList);
			});
		},

		/**
		 * Get app list from API
		 * @param  {Object}   args
		 * @param  {String}   [args.data.accountId]
		 * @param  {Function} [args.success]  Success callback
		 * @param  {Function} [args.error]    Error callback
		 */
		requestAppList: function(args) {
			var self = this;

			self.callApi({
				resource: 'appsStore.list',
				data: _.merge({
					accountId: self.accountId
				}, args.data),
				success: function(data) {
					_.has(args, 'success') && args.success(data.data);
				},
				error: function(parsedError) {
					_.has(args, 'error') && args.error(parsedError);
				}
			});
		}
	};

	return app;
});
