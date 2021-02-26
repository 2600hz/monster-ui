define(function(require) {
	var $ = require('jquery'),
		_ = require('lodash'),
		monster = require('monster');

	var app = {
		isMasqueradable: false,

		i18n: {
			'de-DE': { customCss: false },
			'en-US': { customCss: false },
			'fr-FR': { customCss: false },
			'ru-RU': { customCss: false }
		},

		appFlags: {
			modal: undefined
		},

		subscribe: {
			'auth.currentUser.updated': '_destroyAndMaybeReopen',
			'myaccount.closed': 'onMyaccountClosed',
			'apploader.destroy': '_destroy',
			'apploader.show': 'render',
			'apploader.hide': '_hide',
			'apploader.toggle': '_toggle',
			'apploader.current': '_currentApp',
			'apploader.getAppList': 'getAppList'
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

		_destroyAndMaybeReopen: function() {
			var self = this,
				isVisible = _.get(self.appFlags, 'modal.isVisible', function() { return false; })();

			self._destroy();

			if (isVisible) {
				self.render();
			}
		},

		/**
		 * @param  {Function} [pArgs.callback]
		 */
		render: function(pArgs) {
			var self = this,
				callback = _.get(pArgs, 'callback', function() {});

			monster.series([
				function shouldRender(next) {
					monster.pub('myaccount.hasToShowWalkthrough', next);
				}
			], function(err) {
				if (err) {
					return;
				}
				if (self.isRendered()) {
					return self.show({
						callback: callback
					});
				}
				var defaultApp = monster.util.getCurrentUserDefaultApp(),
					actionsPerId = _
						.chain([
							monster.util.listAppStoreMetadata('user'),
							monster.util.listAppLinks()
						])
						.flatten()
						.keyBy('id')
						.value(),
					appList = _
						.chain(_.get(monster.apps, 'auth.currentUser.appList', []))
						.map(_.partial(_.ary(_.get, 2), actionsPerId))
						.reject(_.isUndefined)
						.value(),
					templateTypes = {
						dropdown: {
							name: 'appList',
							insert: function(template) {
								self.bindDropdownApploaderEvents(template);

								$('#appList').empty().append(template);
							}
						},
						modal: {
							name: 'app',
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
						data: {
							defaultApp: defaultApp,
							allowAppstore: monster.apps.auth.currentUser.priv_level === 'admin' && !monster.config.whitelabel.hideAppStore,
							apps: appList
						}
					}));

				templateData.insert($template);

				callback();
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

			parent.on('click', '.right-div .app-element[data-type="link"]', function(event) {
				event.preventDefault();

				var $this = $(this),
					url = $this.data('id');

				window.open(url);
			});

			parent.on('click', '.right-div .app-element[data-type="app"], #launch_appstore, .default-app .app-element', function() {
				var $this = $(this),
					appName = $this.data('name');

				if (!appName) {
					return;
				}

				if (appName === 'appstore' || !(monster.util.isMasquerading() && !monster.util.getAppStoreMetadata(appName).masqueradable)) {
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
		_currentApp: function() {
			var self = this,
				apploader = $('#apploader'),
				activeApp = apploader.find('.right-div .app-element.active');

			if (activeApp.length) {
				//If apploader is loaded get data from document.
				return {
					id: activeApp.data('id'),
					name: activeApp.data('name')
				};
			} else {
				//This returns the default app, so only works when the apploader hasn't been loaded yet.
				return _.pick(monster.util.getCurrentUserDefaultApp(), [
					'id',
					'name'
				]);
			}
		},

		appListUpdate: function(parent, appList, callback) {
			var self = this,
				defaultActionId = parent.find('.default-app .app-element').data('id'),
				domActionIds = _.map(parent.find('.app-list .app-element'), function(element) {
					return $(element).data('id');
				}),
				actionIdsList = _
					.chain([
						[defaultActionId],
						_.reject(domActionIds, _.partial(_.isEqual, defaultActionId))
					])
					.flatten()
					.reject(_.isUndefined)
					.value(),
				actionsPerId = _.keyBy(appList, 'id');

			if (_.isEqual(actionIdsList, _.map(appList, 'id'))) {
				return callback(appList);
			}

			self.requestPatchCurrentUserAppList(actionIdsList, function(err) {
				if (err) {
					return callback(appList);
				}
				callback(_.map(actionIdsList, _.partial(_.get, actionsPerId)));
			});
		},

		/**
		 * Get app list
		 * @param  {Object} args
		 * @param  {String} [args.accountId]
		 * @param  {('all'|'account'|'user')} [args.scope='all']  App list scope
		 * @param  {Object} [args.user] User document to filter against when `scope='user'`.
		 * @param  {Function} [args.success]  Callback function to send the retrieved app list
		 * @param  {Function} [args.error]  Callback function to notify errors
		 */
		getAppList: function(args) {
			var self = this,
				accountId = _.get(args, 'accountId', self.accountId),
				customUser = _.get(args, 'user'),
				onSuccess = _.get(args, 'success', function() {}),
				onError = _.get(args, 'error', function() {}),
				activeAppsStoreAccountId = _.get(monster.apps.auth, monster.util.isMasquerading() ? 'originalAccount.id' : 'accountId'),
				shouldFetch = accountId !== activeAppsStoreAccountId,
				resolveScope = function(scope) {
					if (shouldFetch) {
						return scope === 'user' ? 'all' : scope;
					} else {
						return scope === 'user' && customUser ? 'all' : scope;
					}
				},
				scope = resolveScope(_.get(args, 'scope')),
				isUserPermittedApp = _.partial(monster.util.isUserPermittedApp, customUser || {}),
				maybeFilterByUser = customUser
					? _.partial(_.filter, _, isUserPermittedApp)
					: _.identity,
				listAppStoreMetadata = _.flow(
					_.partial(monster.util.listAppStoreMetadata, scope),
					maybeFilterByUser
				),
				listAppsMetadata = _.flow(
					_.partial(monster.util.listAppsMetadata, _, scope),
					maybeFilterByUser
				),
				getApps = _.partial(function(shouldFetch, next) {
					if (!shouldFetch) {
						return next(null, listAppStoreMetadata());
					}
					self.callApi({
						resource: 'appsStore.list',
						data: {
							accountId: accountId
						},
						success: _.flow(
							_.partial(_.get, _, 'data'),
							listAppsMetadata,
							_.partial(next, null)
						),
						error: next
					});
				}, shouldFetch);

			getApps(function(err, apps) {
				if (err) {
					return onError(err);
				}
				onSuccess(apps);
			});
		},

		requestPatchCurrentUserAppList: function(appList, callback) {
			var self = this;

			self.callApi({
				resource: 'user.patch',
				data: {
					accountId: self.accountId,
					userId: self.userId,
					data: {
						appList: appList
					}
				},
				success: _.partial(callback, null),
				error: callback
			});
		}
	};

	return app;
});
