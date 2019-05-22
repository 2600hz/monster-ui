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

					$template.find('.app-selector-body .app-list').isotope({
						filter: '.app-item'
					});

					return $template;
				};

			self.appSelectorGetApps({
				callback: function(apps) {
					$container.append(initTemplate(apps));
				}
			});
		},

		appSelectorRenderPopup: function(args) {
			var self = this,
				$template = $(self.getTemplate({
					name: 'appSelectorDialog',
					submodule: 'appSelector'
				})),
				popup;

			self.appSelectorRender({
				container: $template.find('.popup-body')
			});

			popup = monster.ui.dialog($template, {
				title: self.i18n.active().appSelector.dialog.title,
				autoScroll: false
			});
		},

		appSelectorBindEvents: function(args) {
			var self = this,
				$template = args.template,
				$appFilters = $template.find('.app-selector-menu .app-filter'),
				$appItems = $template.find('.app-selector-body .app-list .app-item');

			$appFilters.on('click', function() {
				var $this = $(this),
					filter = $this.data('filter'),
					filterClass,
					$toShow,
					$toHide;

				if ($this.hasClass('active')) {
					return;
				}

				$template.find('.app-selector-body .app-list').isotope({
					filter: '.app-item' + (filter ? '.' + filter : '')
				});

				/*
				if (filter) {
					filterClass = '.' + filter;

					$toShow = $appItems.filter(filterClass + '.app-item-hidden');
					$toHide = $appItems.not(filterClass).not('.app-item-hidden');
					$toShow.slideDown(500).removeClass('app-item-hidden');
					$toHide.slideUp(500).addClass('app-item-hidden');
				} else {
					$appItems.slideDown(500);	//.filter('.hidden');
				}
				*/

				$appFilters.removeClass('active');
				$this.addClass('active');
			});
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
