define(function(require) {
	var $ = require('jquery'),
		_ = require('lodash'),
		monster = require('monster');

	var alerts = {
		// Defines API requests not included in the SDK
		requests: {},

		// Define the events available for other apps
		subscribe: {
			'core.alerts.hideDropdown': 'alertsHideDropdown',
			'core.alerts.refresh': 'alertsRender'
		},

		appFlags: {
			alerts: {
				metadataFormat: {
					common: {
						available: {
							i18nKey: 'current_balance',
							valueType: 'price'
						}
					}
					/*
					// Format data can also be defined per category
					categories: {
						low_balance: {
							available: {
								i18nKey: 'current_balance',
								valueType: 'price'
							}
						}
					}
					*/
				},
				template: null
			}
		},

		/**
		 * Trigger the alerts pulling process from API.
		 */
		alertsRender: function() {
			var self = this,
				initTemplate = function initTemplate(alerts) {
					var alertGroups = self.alertsFormatData({ data: alerts }),
						alertCount = _.reduce(alertGroups, function(count, alertGroup) {
							return count + alertGroup.length;
						}, 0),
						dataTemplate = {
							showAlertCount: alertCount > 0,
							alertCount: alertCount > 9 ? '9+' : alertCount.toString(),
							alertGroups: alertGroups
						},
						$template = $(self.getTemplate({
							name: 'nav',
							data: dataTemplate,
							submodule: 'alerts'
						}));

					self.appFlags.alerts.template = $template;

					monster.ui.tooltips($template);

					self.alertsBindEvents();

					return $template;
				},
				renderTemplate = function renderTemplate(alerts) {
					var $navLinks = $('#main_topbar_nav'),
						$topbarAlert = $navLinks.find('#main_topbar_alert'),
						$template = initTemplate(alerts);

					if ($topbarAlert.length === 0) {
						$template.insertBefore($navLinks.find('#main_topbar_signout'));
					} else {
						$topbarAlert.replaceWith($template);
					}
				};

			monster.parallel({
				alerts: function(callback) {
					self.alertsRequestListAlerts({
						success: function(data) {
							callback(null, data);
						},
						error: function(parsedError) {
							callback(parsedError);
						}
					});
				},
				render: function(callback) {
					if (self.appFlags.alerts.template) {
						self.alertsHideDropdown();
					}

					// Display notifications topbar element without alerts
					renderTemplate();
					callback(null, true);
				},
			}, function(err, results) {
				if (err) {
					return;
				}

				// If there is no error, re-render topbar element with alerts
				renderTemplate(results.alerts);
			});
		},

		/**
		 * Hide notifications dropdown from the DOM
		 */
		alertsHideDropdown: function() {
			var self = this,
				$template = self.appFlags.alerts.template;

			if (!$template) {
				throw new ReferenceError('The notifications template has not been loaded yet.');
			}

			$template.removeClass('open');
		},

		/**
		 * Bind template content events
		 */
		alertsBindEvents: function() {
			var self = this,
				$template = self.appFlags.alerts.template;

			self.appFlags.alerts.template.find('#main_topbar_alert_link').on('click', function(e) {
				e.preventDefault();

				var $this = $(this),
					$parent = $this.parent();

				$this.find('.badge')
					.fadeOut(250, function() {
						$(this).remove();
					});

				if ($parent.hasClass('open')) {
					self.alertsHideDropdown();
				} else {
					monster.pub('core.hideTopbarDropdowns', { except: 'main_topbar_alert' });
					$parent.addClass('open');
				}
			});

			$template.find('#main_topbar_alert_toggle_container .alert-toggle-item .button-clear').on('click', function(e) {
				e.preventDefault();

				var $alertItem = $(this).closest('.alert-toggle-item'),
					hasSiblings = $alertItem.siblings('.alert-toggle-item').length > 0,
					$alertGroup = $alertItem.parent(),
					$elementToRemove = hasSiblings ? $alertItem : $alertGroup;

				$elementToRemove.slideUp({
					duration: 200,
					complete: function() {
						$elementToRemove.remove();
					}
				});
			});
		},

		/**
		 * Formats the alert data received from the API, into UI category groups
		 * @param    {Object}   args
		 * @param    {Object[]} args.data  Array of alerts
		 * @returns  {Object}              Grouped alerts by UI categories
		 */
		alertsFormatData: function(args) {
			var self = this,
				data = args.data,
				sortOrder = {
					manual: '1',
					system: '2',
					apps: '3'
				},
				metadataFormat = self.appFlags.alerts.metadataFormat;

			if (_.isEmpty(data)) {
				return [];
			}

			return _.chain(data)
				.map(function(alert) {
					var alertData = _.get(alert, 'value', alert),
						category = alertData.category,
						metadata = _.reduce(alertData.metadata,
							function(metadataArray, value, key) {
								var formatData = _.get(
									metadataFormat.categories,
									category + '.' + key,
									_.get(metadataFormat.common, key)
								);

								if (formatData) {
									var metadataItem = {
										key: formatData.i18nKey,
										value: value
									};

									switch (formatData.valueType) {
										case 'price':
											metadataItem.value = monster.util.formatPrice({
												price: metadataItem.value
											});
											break;
										default: break;
									}

									metadataArray.push(metadataItem);
								}

								return metadataArray;
							}, []);

					return {
						id: alertData.id,
						title: alertData.title,
						metadata: metadata,
						message: alertData.message,
						category: category,
						clearable: Math.random() >= 0.5	//alertData.clearable
					};
				})
				.groupBy(function(alert) {
					var category = alert.category,
						alertType,
						dashIndex;

					if (alert.clearable) {
						alertType = 'manual';
						alert.iconPath = monster.util.getAppIconPath({ name: 'websockets' });
					} else if (_.includes([ 'low_balance', 'no_payment_token', 'expired_payment_token' ], category)) {
						alertType = 'system';
					} else {
						dashIndex = category.indexOf('_');
						alertType = category.substring(0, dashIndex > 0 ? dashIndex : category.length);
						alert.iconPath = monster.util.getAppIconPath({ name: alertType });
					}

					return alertType;
				}).map(function(alerts, type) {
					return {
						type: type,
						alerts: alerts
					};
				}).sortBy(function(alertGroup) {
					return _.get(sortOrder, alertGroup.type) + alertGroup.type;
				}).value();
		},

		/**
		 * Request alerts list from API
		 * @param  {Object}   args
		 * @param  {Function} [args.success]  Success callback
		 * @param  {Function} [args.error]    Error callback
		 */
		alertsRequestListAlerts: function(args) {
			var self = this;

			self.callApi({
				resource: 'alert.list',
				bypassProgressIndicator: true,
				data: {
					accountId: monster.apps.auth.currentAccount.id
				},
				success: function(data, status) {
					_.has(args, 'success') && args.success(data.data, status);
				},
				error: function(parsedError) {
					_.has(args, 'error') && args.error(parsedError);
				}
			});
		}
	};

	return alerts;
});
