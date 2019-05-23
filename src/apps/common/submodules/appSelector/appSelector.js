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
			'common.appSelector.renderPopup': 'appSelectorRenderPopup'
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
				$template = $(self.getTemplate({
					name: 'appSelectorDialog',
					submodule: 'appSelector'
				}));

			self.appSelectorRender({
				container: $template.find('.popup-body'),
				callback: function() {
					var popup = monster.ui.dialog($template, {
						title: self.i18n.active().appSelector.dialog.title,
						autoScroll: false
					});
				}
			});
		},

		appSelectorBindEvents: function(args) {
			var self = this,
				$template = args.template,
				$appFilters = $template.find('.app-selector-menu .app-filter'),
				$appSelectorBody = $template.find('.app-selector-body'),
				$appList = $appSelectorBody.find('.app-list'),
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
		},

		appSelectorGetApps: function(args) {
			var apps = _.transform(monster.appsStore, function(apps, appData, appName) {
				var i18n = _.get(appData.i18n, monster.config.whitelabel.language, _.get(appData.i18n, 'en-US'));
				monster.ui.formatIconApp(appData);
				apps[appData.id] = {
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
