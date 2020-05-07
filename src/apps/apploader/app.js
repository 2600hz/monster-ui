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
			'myaccount.closed': 'onMyaccountClosed',
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

		onMyaccountClosed: function onMyaccountClosed() {
			var self = this;

			monster.pub('core.isActiveAppPlugin', _.bind(self.render, self));
		},

		_destroy: function() {
			var self = this;

			if (self.appFlags.modal) {
				if (self.appFlags.modal.isVisible()) {
					monster.pub('apploader.closed');
				}
				self.appFlags.modal.destroy();
				self.appFlags.modal = undefined;
			}
		},

		/**
		 * @param  {Function} [pArgs.callback]
		 */
		render: function(pArgs) {
			var self = this,
				globalCallback = _.get(pArgs, 'callback');

			monster.waterfall([
				function shouldRender(callback) {
					monster.pub('myaccount.hasToShowWalkthrough', function(hasToShowWalkthrough) {
						callback(hasToShowWalkthrough ? 'doNotRender' : null);
					});
				},
				function maybeFetchApps(callback) {
					if (self.isRendered()) {
						return callback('isRendered');
					}
					self.getUserApps(_.partial(callback, null));
				},
				function insertAppLinks(appList, callback) {
					callback(null, self.insertAppLinks(appList));
				},
				function renderTemplate(appList, callback) {
					var templateTypes = {
							dropdown: {
								name: 'appList',
								defaultApp: _.head(appList),
								insert: function(template) {
									self.bindDropdownApploaderEvents(template);

									$('#appList').empty().append(template);
								}
							},
							modal: {
								name: 'app',
								defaultApp: monster.ui.formatIconApp(appList[0]),
								insert: function(template) {
									self.bindEvents(template, appList);

									self.appFlags.modal = monster.ui.fullScreenModal(template, {
										hideClose: true,
										destroyOnClose: false
									});
								}
							}
						},
						templateData = _.get(templateTypes, monster.config.whitelabel.useDropdownApploader ? 'dropdown' : 'modal'),
						$template = $(self.getTemplate({
							name: templateData.name,
							data: _.merge({
								allowAppstore: monster.apps.auth.currentUser.priv_level === 'admin' && !monster.config.whitelabel.hideAppStore,
								apps: appList
							}, _.pick(templateData, [
								'defaultApp'
							]))
						}));

					templateData.insert($template);

					callback(null);
				}
			], function(exitReason) {
				if (exitReason === 'doNotRender') {
					return;
				}
				if (exitReason === 'isRendered') {
					return self.show({
						callback: globalCallback
					});
				}
				globalCallback && globalCallback();
			});
		},

		bindDropdownApploaderEvents: function(parent) {
			var self = this;

			parent.find('.appSelector').on('click', function(event) {
				event.preventDefault();

				var $this = $(this),
					appName = $this.data('name');

				if ($this.data('type') === 'link') {
					window.open($this.data('id'));
				} else if (appName) {
					monster.routing.goTo('apps/' + appName);
				}
			});
		},

		bindEvents: function(parent, appList) {
			var self = this,
				$appDescription = parent.find('.app-description'),
				$appDescriptionTitle = $appDescription.find('h4'),
				$appDescriptionTitleText = $appDescription.find('.title'),
				$appDescriptionParagraph = $appDescription.find('p'),
				updateAppInfo = function updateAppInfo(id) {
					var app = _.find(appList, { id: id }),
						isLink = _.includes(_.keys(monster.config.whitelabel.appLinks), id);

					$appDescriptionTitle[isLink ? 'addClass' : 'removeClass']('is-link');
					$appDescriptionTitleText.text(app.label);
					$appDescriptionParagraph.text(app.description || '');
				};

			setTimeout(function() { parent.find('.search-query').focus(); });

			parent.find('.app-container').sortable({
				cancel: '.ui-sortable-disabled',
				receive: function(event, ui) {
					if (ui.item.data('type') !== 'app') {
						return ui.sender.sortable('cancel');
					}
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

				if ($this.data('type') === 'link') {
					window.open($this.data('id'));
				} else if (appName) {
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
					monster.pub('apploader.closed');
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
					} else {
						monster.pub('apploader.closed');
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
						appLinks = _.keys(monster.config.whitelabel.appLinks),
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
						monster.apps.auth.currentUser.appList = _
							.chain(userApps)
							.concat(appLinks)
							.sortBy(self.sortByOrderOf(currentUser.appList))
							.value();
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
		 * Inserts app links to applist if any are defined
		 * @param  {Array} appList
		 * @return {Array}
		 */
		insertAppLinks: function insertAppLinks(appList) {
			var self = this,
				appLinks = _
					.chain(monster.config.whitelabel)
					.get('appLinks')
					.map(function(metadata, url) {
						var i18nKey = _.find([
								monster.config.whitelabel.language,
								monster.defaultLanguage,
								_.keys(metadata.i18n)[0]
							], function(key) {
								return _.has(metadata.i18n, key);
							}),
							i18n = _.get(metadata.i18n, i18nKey, {});

						return _.merge({
							id: url,
							icon: metadata.icon
						}, _.pick(i18n, [
							'label',
							'description'
						]));
					})
					.uniqBy('id')
					.reject(function(link) {
						return _.isEmpty(link.label);
					})
					.value();

			return _
				.chain(appList)
				.slice(0, 1)
				.concat(
					_
						.chain(appLinks)
						.concat(_.slice(appList, 1))
						.sortBy(self.sortByOrderOf(monster.apps.auth.currentUser.appList, 'id'))
						.value()
				)
				.value();
		},

		/**
		 * Returns a function that returns the index of an item/path in list
		 * @param  {Array} list
		 * @param  {String} [path]
		 * @return {Function}
		 */
		sortByOrderOf: function(list, path) {
			return function(item) {
				var value = path ? _.get(item, path) : item;

				return _.indexOf(list, value);
			};
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
