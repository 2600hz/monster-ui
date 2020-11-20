define(function(require) {
	var $ = require('jquery'),
		_ = require('lodash'),
		monster = require('monster');

	require('isotope');

	var appSelector = {
		// Defines API requests not included in the SDK
		requests: {},

		// Define the events available for other apps
		subscribe: {
			'common.appSelector.render': 'appSelectorRender',
			'common.appSelector.renderPopup': 'appSelectorRenderPopup',
			'common.appSelector.getSelectedApps': 'appSelectorGetSelectedApps'
		},

		appFlags: {
			appSelector: {
				tagFilters: [
					'all',
					'reseller',
					'carrier',
					'developer',
					'end_user',
					'reporting',
					'integration',
					'admin',
					'system_admin'
				]
			}
		},

		/**
		 * Store getter
		 * @param  {Array|String} [path]
		 * @param  {*} [defaultValue]
		 * @return {*}
		 */
		appSelectorGetStore: function(path, defaultValue) {
			var self = this,
				store = ['_store', 'appSelector'];
			return _.get(
				self,
				_.isUndefined(path)
					? store
					: _.flatten([store, _.isString(path) ? path.split('.') : path]),
				defaultValue
			);
		},

		/**
		 * Store setter
		 * @param  {Array|String|*} path|value
		 * @param  {*} [value]
		 */
		appSelectorSetStore: function(path, value) {
			var self = this,
				hasValue = _.toArray(arguments).length === 2,
				store = ['_store', 'appSelector'];
			_.set(
				self,
				hasValue
					? _.flatten([store, _.isString(path) ? path.split('.') : path])
					: store,
				hasValue ? value : path
			);
		},

		/**
		 * Render app selector
		 * @param  {Object} args
		 * @param  {jQuery} args.container  Element that will contain the app selector
		 * @param  {String} [args.accountId=self.accountId]  ID of the account from which to get
		 *                                                   the app list
		 * @param  {('all'|'account'|'user')} [args.scope='all']  App list scope
		 *                                            using the cached one
		 * @param  {String[]} [args.availableApps=[]]  List of IDs for the specific apps to be
		 *                                             displayed. This is applied on top of the
		 *                                             selected scope, and takes precedence over
		 *                                             args.excludedApps.
		 * @param  {String[]} [args.excludedApps=[]]  List of App IDs of the apps to be excluded
		 *                                            from the list. This is applied on top of the
		 *                                            selected scope.
		 * @param  {String[]} [args.selectedAppIds=[]]  Pre-selected application IDs
		 * @param  {Function} [args.callback]  Optional callback to be executed after render
		 */
		appSelectorRender: function(args) {
			var self = this,
				accountId = _.get(args, 'accountId', self.accountId),
				scope = _.get(args, 'scope', 'all'),
				availableApps = _.get(args, 'availableApps'),
				excludedApps = _.get(args, 'excludedApps'),
				selectedAppIds = _.get(args, 'selectedAppIds', []),
				$container = args.container,
				initTemplate = function initTemplate(apps) {
					var selectedAppIds = self.appSelectorGetSelectedApps(),
						tagCount = _.chain(apps).flatMap('tags').countBy().value(),
						filters = _.map(self.appFlags.appSelector.tagFilters, function(filter) {
							return {
								filter: filter,
								count: filter === 'all' ? _.size(apps) : _.get(tagCount, filter, 0)
							};
						}),
						dataTemplate = {
							apps: _
								.chain(apps)
								.map(function(app, index) {
									return _.merge({
										isEven: (index % 2 === 0)
									}, app);
								})
								.sortBy(_.flow([
									_.partial(_.get, _, 'label'),
									_.toLower
								]))
								.value(),
							filters: filters,
							scope: scope,
							selectedAppIds: selectedAppIds,
							selectedApps: self.appSelectorGetAppsByIds(selectedAppIds)
						},
						$template = $(self.getTemplate({
							name: 'layout',
							data: dataTemplate,
							submodule: 'appSelector'
						}));

					monster.ui.tooltips($template, {
						selector: '.selected-title .selected-text',
						options: {
							placement: 'bottom',
							title: function() {
								var currentSelectedAppIds = self.appSelectorGetSelectedApps();

								return _
									.chain(self.appSelectorGetAppsByIds(currentSelectedAppIds))
									.map('label')
									.sortBy()
									.join(', ')
									.value();
							}
						}
					});

					self.appSelectorBindEvents({
						appCount: apps.length,
						template: $template
					});

					return $template;
				};

			monster.pub('apploader.getAppList', {
				accountId: accountId,
				scope: scope,
				success: function(appList) {
					var $template;

					self.appSelectorSetStore('apps', _.keyBy(appList, 'id'));
					self.appSelectorSetStore('selectedAppIds', selectedAppIds);

					// Filter apps
					if (
						!_.isUndefined(availableApps)
						&& _.isArray(availableApps)
					) {
						appList = _.filter(appList, function(app) {
							return _.includes(availableApps, app.id);
						});
					} else if (
						!_.isUndefined(excludedApps)
						&& _.isArray(excludedApps)
					) {
						appList = _.reject(appList, function(app) {
							return _.includes(excludedApps, app.id);
						});
					}

					// Init template after saving selected apps to store, so they can be rendered
					$template = initTemplate(appList);

					$container.append($template);

					_.has(args, 'callback') && args.callback();

					if (_.isEmpty(appList)) {
						return;
					}

					// Init Isotope after callback, so the app list is already displayed.
					// If not, all items will be hidden, because Isotope is not able to calculate
					// its positions properly.
					$template.find('.app-selector-body .app-list').isotope({
						itemSelector: 'li',
						filter: '.app-item'
					});
				}
			});
		},

		/**
		 * Render app selector as a dialog
		 * @param  {Object} args
		 * @param  {String} [args.accountId=self.accountId]  ID of the account from which to get
		 *                                                   the app list
		 * @param  {('all'|'account'|'user')} [args.scope='all'] App list scope
		 *                                            using the cached one
		 * @param  {String[]} [args.availableApps=[]]  List of IDs for the specific apps to be
		 *                                              displayed. This is applied on top of the
		 *                                              selected scope.
		 * @param  {String[]} [args.excludedApps=[]]  List of App IDs of the apps to be excluded
		 *                                             from the list. This is applied on top of the
		 *                                             selected scope.
		 * @param  {String[]} [args.selectedAppIds=[]]  Pre-selected application IDs
		 * @param  {Object} [args.callbacks]  Callback functions
		 * @param  {Function} [args.callbacks.accept]  Optional callback for accept action
		 * @param  {Function} [args.callbacks.cancel]  Optional callback for cancel action
		 */
		appSelectorRenderPopup: function(args) {
			var self = this,
				callbacks = args.callbacks,
				$template = $(self.getTemplate({
					name: 'dialog',
					submodule: 'appSelector'
				})),
				$popupBody = $template.find('.popup-body'),
				renderArgs = _
					.chain(args)
					.pick([
						'accountId',
						'scope',
						'availableApps',
						'excludedApps',
						'selectedAppIds'
					])
					.merge({
						container: $popupBody,
						callback: function() {
							var $popup = monster.ui.dialog($template, {
								title: self.i18n.active().appSelector.dialog.title,
								autoScroll: false,
								onClose: function() {
									// Clean selected apps on close
									self.appSelectorSetStore('selectedAppIds', []);
								}
							});

							self.appSelectorBindPopupEvents({
								template: $template,
								popup: $popup,
								callbacks: callbacks
							});

							// Hack for Chrome. It somehow forces the browser to properly fit the
							// popup-body element into the dialog, and enable the scroll.
							$popupBody.css({
								height: 'auto'
							});
						}
					})
					.value();

			self.appSelectorRender(renderArgs);
		},

		/**
		 * Gets the IDs of the currently selected apps
		 * @param  {Object} [args]
		 * @param  {Function} [args.callback]  Callback function to be invoked when the selected
		 *                                     apps have been retrieved
		 * @returns {String[]}  Selected apps, when no callback was provided
		 */
		appSelectorGetSelectedApps: function(args) {
			var self = this,
				selectedAppIds = self.appSelectorGetStore('selectedAppIds', []);

			if (_.has(args, 'callback')) {
				args.callback(selectedAppIds);
			} else {
				return selectedAppIds;
			}
		},

		/**
		 * Bind app selector events
		 * @param  {Object} args
		 * @param  {Array} args.appCount  Available apps count
		 * @param  {jQuery} args.template  App selector template
		 */
		appSelectorBindEvents: function(args) {
			var self = this,
				appCount = args.appCount,
				$template = args.template,
				$appFilters = $template.find('.app-selector-menu .app-filter'),
				$appSelectorBody = $template.find('.app-selector-body'),
				$appList = $appSelectorBody.find('.app-list'),
				$selectedAppsCounter = $appSelectorBody.find('.selected-count'),
				$selectedAppsList = $appSelectorBody.find('.selected-list'),
				$searchInput = $appSelectorBody.find('input.search-query'),
				currentFilters = {
					classNames: '',
					data: ''
				},
				applyFilters = function() {
					if (appCount === 0) {
						return;
					}

					var rowCount = 0;

					$appList
						.find('.app-item' + currentFilters.classNames + currentFilters.data)
							.each(function() {
								var $this = $(this);
								if (rowCount % 2 === 0) {
									$this.addClass('even');
								} else {
									$this.removeClass('even');
								}
								rowCount += 1;
							});

					if (rowCount > 0) {
						$appList.isotope({
							filter: '.app-item' + _.chain(currentFilters).values().join('').value()
						});
					} else {
						$appList.isotope({
							filter: '.no-apps-item'
						});
					}
				};

			// Filter by tag
			$appFilters
				.on('dragstart', function() {
					// Make items non-draggable
					return false;
				})
				.on('click', function(e) {
					e.preventDefault();

					var $this = $(this),
						filter;

					if ($this.hasClass('active')) {
						return;
					}

					filter = $this.data('filter');
					currentFilters.classNames = (filter === 'all') ? '' : '.' + filter;
					currentFilters.data = '';

					$searchInput.val('');

					$appFilters.removeClass('active');
					$this.addClass('active');

					applyFilters();
				});

			// Search
			$searchInput.on('keyup', _.debounce(function(e) {
				var $this = $(this),
					value = _.chain($this.val()).trim().lowerCase().value();

				currentFilters.data = _.isEmpty(value) ? '' : '[data-name*="' + value + '"]';

				applyFilters();
			}, 200));

			// Select app
			$appList.find('.app-item').on('click', function() {
				var $this = $(this),
					appId = $this.data('id'),
					selectedAppIds = self.appSelectorGetSelectedApps(),
					$selectedAppIcon;

				$this.toggleClass('selected');

				// Create a new array with or without the clicked app,
				// in order to keep the store inmutable
				if ($this.hasClass('selected')) {
					selectedAppIds = _.concat(selectedAppIds, appId);

					$selectedAppIcon = $(self.getTemplate({
						name: 'selectedApp',
						data: _.head(self.appSelectorGetAppsByIds([ appId ])),
						submodule: 'appSelector'
					}));

					$selectedAppIcon.appendTo($selectedAppsList);

					// Defer to wait for the icon to be appendend, in order to trigger the transitions
					_.defer(function() {
						$selectedAppIcon.addClass('show');
					});
				} else {
					selectedAppIds = _.reject(selectedAppIds, function(id) {
						return id === appId;
					});

					$selectedAppIcon = $selectedAppsList.find('[data-id="' + appId + '"]');
					$selectedAppIcon.removeClass('show');

					// Wait for animations to finish, before removing the element
					setTimeout(function() {
						$selectedAppIcon.remove();
					}, 250);
				}

				self.appSelectorSetStore('selectedAppIds', selectedAppIds);

				$selectedAppsCounter.text(selectedAppIds.length.toString());
			});
		},

		/**
		 * Bind app selector dialog events
		 * @param  {Object} args
		 * @param  {jQuery} args.popup  Dialog element
		 * @param  {jQUery} args.template  App selector template
		 * @param  {Object} [args.callbacks]  Callback functions
		 * @param  {Function} [args.callbacks.accept]  Optional callback for accept action
		 * @param  {Function} [args.callbacks.cancel]  Optional callback for cancel action
		 */
		appSelectorBindPopupEvents: function(args) {
			var self = this,
				$popup = args.popup,
				$template = args.template;

			$template.find('.accept').on('click', function(e) {
				e.preventDefault();

				var selectedAppIds = self.appSelectorGetSelectedApps();

				$popup.dialog('close').remove();

				_.has(args, 'callbacks.accept') && args.callbacks.accept(selectedAppIds);
			});

			$template.find('.cancel').on('click', function(e) {
				e.preventDefault();

				$popup.dialog('close').remove();

				_.has(args, 'callbacks.cancel') && args.callbacks.cancel();
			});
		},

		/**
		 * Get a list of applications by its IDs
		 * @param  {String[]} appIds  List of app ID's to be searched
		 * @returns {Array}  Array of applications data
		 */
		appSelectorGetAppsByIds: function(appIds) {
			var self = this,
				apps = self.appSelectorGetStore('apps');
			return _.map(appIds, function(appId) {
				return apps[appId];
			});
		}
	};

	return appSelector;
});
