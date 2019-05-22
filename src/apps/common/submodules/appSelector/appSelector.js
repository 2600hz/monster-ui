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
				initTemplate = function initTemplate(initTemplateCallback) {
					var dataTemplate = {
							filters: self.appFlags.appSelector.filters
						},
						$template = $(self.getTemplate({
							name: 'layout',
							data: dataTemplate,
							submodule: 'appSelector'
						}));

					self.appSelectorBindEvents({
						template: $template
					});

					self.appSelectorGetApps({
						callback: function(apps) {
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

							initTemplateCallback($template);
						}
					});
				};

			initTemplate(function($template) {
				$container.append($template);
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
				$appFilters = $template.find('.app-selector-menu .app-filter');

			$appFilters.on('click', function() {
				var $this = $(this),
					filter = $this.data('filter');

				if ($this.hasClass('active')) {
					return;
				}

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
