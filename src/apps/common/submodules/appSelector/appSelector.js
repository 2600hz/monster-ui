define(function(require) {
	var $ = require('jquery'),
		_ = require('lodash'),
		isotope = require('isotope'),
		monster = require('monster');

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
		 * @param  {('all'|'account'|'user')} [args.scope='all'] App list scope
		 * @param  {Boolean} [args.forceFetch=false]  Force to fetch app data from API instead of using the cached one
		 * @param  {String[]} [args.selectedAppIds=[]]  Pre-selected application IDs
		 * @param  {Function} [args.callback]  Optional callback to be executed after render
		 */
		appSelectorRender: function(args) {
			var self = this,
				scope = _.get(args, 'scope', 'all'),
				forceFetch = _.get(args, 'forceFetch', false),
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
							apps: apps,
							filters: filters,
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
						apps: apps,
						template: $template
					});

					return $template;
				};

			monster.pub('apploader.getAppList', {
				scope: scope,
				forceFetch: forceFetch,
				callback: function(appList) {
					var $template;

					self.appSelectorSetStore('apps', _.keyBy(appList, 'id'));
					self.appSelectorSetStore('selectedAppIds', selectedAppIds);

					// Init template after saving selected apps to store, so they can be rendered
					$template = initTemplate(appList);

					$container.append($template);

					_.has(args, 'callback') && args.callback();

					// Init Isotope after callback, so the app list is already displayed.
					// If not, all items will be hidden, because Isotope is not able to calculate
					// its positions properly.
					$template.find('.app-selector-body .app-list').isotope({
						itemSelector: '.app-item',
						getSortData: {
							name: function($elem) {
								return $elem.find('.app-title').text();
							}
						},
						sortBy: 'name'
					});
				}
			});
		},

		/**
		 * Render app selector as a dialog
		 * @param  {Object} args
		 * @param  {('all'|'account'|'user')} [args.scope='all'] App list scope
		 * @param  {Boolean} [args.forceFetch=false]  Force to fetch app data from API instead of using the cached one
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
					.pick([ 'scope', 'forceFetch', 'selectedAppIds' ])
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
		 * @param  {Array} args.apps  List of available apps
		 * @param  {jQuery} args.template  App selector template
		 */
		appSelectorBindEvents: function(args) {
			var self = this,
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
					$appList.isotope({
						filter: _.chain(currentFilters).values().join('').value()
					});
				};

			// Filter by tag
			$appFilters.on('click', function() {
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

			$template.find('.cancel-link').on('click', function(e) {
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
