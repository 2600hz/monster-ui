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

					self.alertsSetDropdownBodyMaxHeight({
						dropdownBody: $template.find('.dropdown-body')
					});

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
				$template = self.appFlags.alerts.template,
				$alertsContainer = $template.find('#main_topbar_alerts_container'),
				$dropdownBody = $alertsContainer.find('.dropdown-body');

			self.appFlags.alerts.template.find('#main_topbar_alerts_link').on('click', function(e) {
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
					monster.pub('core.hideTopbarDropdowns', { except: 'main_topbar_alerts' });
					$parent.addClass('open');
				}
			});

			$alertsContainer.find('.alert-item .button-clear').on('click', function(e) {
				e.preventDefault();

				var $alertItem = $(this).closest('.alert-item'),
					itemHasSiblings = $alertItem.siblings('.alert-item').length > 0,
					$alertGroup = $alertItem.parent(),
					$elementToRemove = itemHasSiblings ? $alertItem : $alertGroup;

				$elementToRemove.slideUp({
					duration: 200,
					complete: function() {
						$elementToRemove.remove();
					}
				});

				if (!itemHasSiblings && $alertGroup.siblings('.alert-group').length === 0) {
					$alertGroup.siblings('.alert-group-empty').slideDown({
						duration: 200
					});
				}
			});

			$(window).on('resize', function() {
				self.alertsSetDropdownBodyMaxHeight({
					dropdownBody: $dropdownBody
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
				.filter(function(alert) {
					return _.has(alert, 'category');
				})
				.map(function(alert) {
					var category = alert.category,
						metadata = _.reduce(alert.metadata,
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
						id: alert.id,
						title: alert.title,
						metadata: metadata,
						message: alert.message,
						category: category,
						clearable: alert.clearable
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
		 * Set max-height for dropdown body, based on viewport size
		 * @param  {Object} args
		 * @param  {jQuery} args.dropdownBody  JQuery object for dropdown body
		 */
		alertsSetDropdownBodyMaxHeight: function(args) {
			var self = this,
				$dropdownBody = args.dropdownBody,
				estimatedMaxHeight = $(window).height() - 136;

			if (estimatedMaxHeight < 200) {
				estimatedMaxHeight = 200;
			}

			$dropdownBody.css({
				maxHeight: estimatedMaxHeight + 'px'
			});
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
