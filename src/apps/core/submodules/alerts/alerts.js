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
		 * Store getter
		 * @param  {Array|String} [path]
		 * @param  {*} [defaultValue]
		 * @return {*}
		 */
		alertsGetStore: function(path, defaultValue) {
			var self = this,
				store = ['_store', 'alerts'];
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
		 * @param  {Array|String} [path]
		 * @param  {*} [value]
		 */
		alertsSetStore: function(path, value) {
			var self = this,
				hasValue = _.toArray(arguments).length === 2,
				store = ['_store', 'alerts'];
			_.set(
				self,
				hasValue
					? _.flatten([store, _.isString(path) ? path.split('.') : path])
					: store,
				hasValue ? value : path
			);
		},

		/**
		 * Trigger the alerts pulling process from API
		 */
		alertsRender: function() {
			var self = this,
				initTemplate = function initTemplate(alerts) {
					var alertGroups = self.alertsFormatData({ data: alerts }),
						alertCount = _.reduce(alertGroups, function(count, alertGroup) {
							return count + alertGroup.unreadCount;
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
						$topbarAlert = $navLinks.find('#main_topbar_alerts'),
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
				}
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
				throw new ReferenceError('The notifications template has not been loaded.');
			}

			$template.removeClass('open');
		},

		/**
		 * Bind template events
		 */
		alertsBindEvents: function() {
			var self = this,
				$template = self.appFlags.alerts.template,
				$alertsContainer = $template.find('#main_topbar_alerts_container');

			$template.find('#main_topbar_alerts_link').on('click', function(e) {
				e.preventDefault();

				var $this = $(this),
					readAlertIds = self.alertsGetStore('read', []),
					$parent = $this.parent();

				$this.find('.badge')
					.fadeOut(250, function() {
						$(this).remove();
					});

				if ($parent.hasClass('open')) {
					self.alertsHideDropdown();
				} else {
					monster.pub('core.hideTopbarDropdowns', { except: 'main_topbar_alerts_link' });
					$parent.addClass('open');

					$alertsContainer.find('.alert-item').each(function(index, el) {
						var id = $(this).data('alert_id');
						if (_.includes(readAlertIds, id)) {
							return;
						}
						readAlertIds.push(id);
					});
					self.alertsSetStore('read', readAlertIds);
				}
			});

			$alertsContainer.find('.alert-item .button-clear').on('click', function(e) {
				e.preventDefault();

				var $alertItem = $(this).closest('.alert-item'),
					itemHasSiblings = $alertItem.siblings('.alert-item').length > 0,
					$alertGroup = $alertItem.parent(),
					$elementToRemove = itemHasSiblings ? $alertItem : $alertGroup;

				$elementToRemove.slideUp(200, function() {
					$elementToRemove.remove();
				});

				if (!itemHasSiblings && $alertGroup.siblings('.alert-group').length === 0) {
					$alertGroup.siblings('.alert-group-empty').slideDown(200);
				}
			});

			$(window).on('resize',
				_.debounce(function() {
					self.alertsSetDropdownBodyMaxHeight({
						dropdownBody: $alertsContainer.find('.dropdown-body')
					});
				}, 100));
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
				readAlertIds = self.alertsGetStore('read', []),
				sortOrder = [
					'manual',
					'system'
				],
				metadataFormat = self.appFlags.alerts.metadataFormat,
				getMetadata = function(category, key) {
					return _.get(
						metadataFormat.categories,
						[category, key],
						_.get(metadataFormat.common, key)
					);
				},
				formatValue = function(type, value) {
					if (type === 'price') {
						return monster.util.formatPrice({
							price: value
						});
					}
					return value;
				};

			return _
				.chain(data)
				.filter(function(alert) {
					return _.has(alert, 'category');
				})
				.map(function(alert) {
					return _.merge({
						metadata: _
							.chain(alert.metadata)
							.reject(function(value, key) {
								return _.isUndefined(getMetadata(alert.category, key));
							})
							.map(function(value, key) {
								var metadata = getMetadata(alert.category, key);

								return {
									key: metadata.i18nKey,
									value: formatValue(metadata.valueType, value)
								};
							})
							.value()
					}, _.pick(alert, [
						'category',
						'clearable',
						'id',
						'message',
						'title'
					]));
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
						unreadCount: _.reduce(alerts, function(total, alert) {
							return total + _.includes(readAlertIds, alert.id) ? 0 : 1;
						}, 0),
						alerts: alerts
					};
				}).sortBy(function(alertGroup) {
					return _.includes(sortOrder, alertGroup.type) ? _.indexOf(sortOrder, alertGroup.type) : _.size(sortOrder);
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
				maxHeight = $(window).height() - 136;	// To expand dropdown up until it reaches
														// 24px (1.5rem) from viewport bottom
														// (112px top + 24px bottom)

			if (maxHeight < 200) {
				maxHeight = 200;
			}

			$dropdownBody.css({
				maxHeight: maxHeight + 'px'
			});
		},

		/**
		 * Request alerts list for current account to API
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
