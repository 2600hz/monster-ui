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
				filters: [
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

		appSelectorRender: function(args) {
			var self = this,
				$container = args.container,
				initTemplate = function initTemplate(apps) {
					var dataTemplate = {
							filters: self.appFlags.appSelector.filters,
							apps: apps
						},
						$template = $(self.getTemplate({
							name: 'layout',
							data: dataTemplate,
							submodule: 'appSelector'
						}));

					self.appSelectorBindEvents({
						apps: apps,
						template: $template
					});

					return $template;
				};

			self.appSelectorGetApps({
				callback: function(apps) {
					var $template = initTemplate(apps);

					$container.append($template);

					_.has(args, 'callback') && args.callback();

					// Init Isotope after callback, so the app list is already displayed
					// If not, all items are hidden, because Isotope is not able to calculate
					// its positions properly
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

		appSelectorRenderPopup: function(args) {
			var self = this,
				callbacks = args.callbacks,
				$template = $(self.getTemplate({
					name: 'appSelectorDialog',
					submodule: 'appSelector'
				}));

			self.appSelectorRender({
				container: $template.find('.popup-body'),
				callback: function(getSelectedApps) {
					var $popup = monster.ui.dialog($template, {
						title: self.i18n.active().appSelector.dialog.title,
						autoScroll: false
					});

					self.appSelectorBindPopupEvents({
						template: $template,
						popup: $popup,
						callbacks: callbacks
					});
				}
			});
		},

		appSelectorGetSelectedApps: function(args) {
			var self = this,
				selectedApps = self.appSelectorGetStore('selectedApps', []);

			if (_.has(args, 'callback')) {
				args.callback(selectedApps);
			} else {
				return selectedApps;
			}
		},

		appSelectorBindEvents: function(args) {
			var self = this,
				apps = args.apps,
				$template = args.template,
				$appFilters = $template.find('.app-selector-menu .app-filter'),
				$appSelectorBody = $template.find('.app-selector-body'),
				$appList = $appSelectorBody.find('.app-list'),
				$searchInput = $appSelectorBody.find('input.search-query'),
				$selectedAppsCounter = $appSelectorBody.find('.selected-count'),
				$selectedAppsList = $appSelectorBody.find('.selected-list'),
				currentFilters = {
					classNames: '',
					data: ''
				},
				applyFilters = function() {
					$appList.isotope({
						filter: _.chain(currentFilters).values().join('').value()
					});
				};

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

			$searchInput.on('keyup', _.debounce(function(e) {
				var $this = $(this),
					value = _.chain($this.val()).trim().lowerCase().value();

				currentFilters.data = _.isEmpty(value) ? '' : '[data-name*="' + value + '"]';

				applyFilters();
			}, 200));

			$appList.find('.app-item').on('click', function() {
				var $this = $(this),
					appId = $this.data('id'),
					$selectedAppsTemplate,
					// Get selected apps from store
					selectedApps = self.appSelectorGetStore('selectedApps', []);

				$this.toggleClass('selected');

				// Create a new array with or without the clicked app,
				// in order to keep the store inmutable
				if ($this.hasClass('selected')) {
					selectedApps = _.concat(selectedApps, apps[appId]);
				} else {
					selectedApps = _.reject(selectedApps, function(app) {
						return app.id === appId;
					});
				}

				// Save selected apps to store
				self.appSelectorSetStore('selectedApps', selectedApps);

				$selectedAppsCounter.text(selectedApps.length.toString());

				$selectedAppsTemplate = $(self.getTemplate({
					name: 'selectedApps',
					data: {
						apps: selectedApps
					},
					submodule: 'appSelector'
				}));

				$selectedAppsTemplate.css({
					maxWidth: (selectedApps.length * 1.5) + 'rem'
				});

				$selectedAppsList.replaceWith($selectedAppsTemplate);

				$selectedAppsList = $selectedAppsTemplate;
			});
		},

		appSelectorBindPopupEvents: function(args) {
			var self = this,
				$popup = args.popup,
				$template = args.template;

			$template.find('.accept').on('click', function(e) {
				e.preventDefault();

				var selectedApps = self.appSelectorGetSelectedApps();

				$popup.dialog('close').remove();

				_.has(args, 'callbacks.accept') && args.callbacks.accept(selectedApps);
			});

			$template.find('.cancel-link').on('click', function(e) {
				e.preventDefault();

				$popup.dialog('close').remove();

				_.has(args, 'callbacks.cancel') && args.callbacks.cancel();
			});
		},

		appSelectorGetApps: function(args) {
			var apps = _.transform(monster.appsStore, function(apps, appData, appName) {
				var i18n = _.get(appData.i18n, monster.config.whitelabel.language, _.get(appData.i18n, 'en-US'));
				monster.ui.formatIconApp(appData);
				apps[appData.id] = {
					id: appData.id,
					name: appName,
					label: i18n.label,
					description: i18n.description,
					tags: appData.tags,
					icon: {
						path: monster.util.getAppIconPath(appData),
						extraCssClass: appData.extraCssClass
					}
				};
			});

			args.callback(apps);
		}
	};

	return appSelector;
});
