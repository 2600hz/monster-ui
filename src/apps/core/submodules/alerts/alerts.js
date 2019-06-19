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
				categoryActions: [
					{
						categories: [ 'no_payment_token', 'expired_payment_token' ],
						action: 'editCreditCard',
						restrictions: {
							balance: {
								show_credit: true,
								show_tab: true
							}
						}
					},
					{
						categories: [ 'low_balance' ],
						action: 'addCredit'
					}
				],
				actionTopics: {
					editCreditCard: 'myaccount.showCreditCardTab',
					addCredit: 'myaccount.showAddCreditDialog'
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
		 * @param  {Array|String|*} path|value
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
				initTemplate = function initTemplate(data) {
					var alerts = _.get(data, 'alerts'),
						uiRestrictions = _.get(data, 'uiRestrictions'),
						alertGroups = self.alertsFormatData({
							data: alerts,
							uiRestrictions: uiRestrictions
						}),
						alertCount = _.sumBy(alertGroups, 'unreadCount'),
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
				renderTemplate = function renderTemplate(data) {
					var $navLinks = $('#main_topbar_nav'),
						$topbarAlert = $navLinks.find('#main_topbar_alerts'),
						$template = initTemplate(data);

					if ($topbarAlert.length === 0) {
						$template.insertBefore($navLinks.find('#main_topbar_signout'));
					} else {
						$topbarAlert.replaceWith($template);
					}
				};

			monster.parallel({
				alerts: function(paralellCallback) {
					self.alertsRequestListAlerts({
						success: function(data) {
							paralellCallback(null, data);
						},
						error: function() {
							paralellCallback(null, []);
						}
					});
				},
				render: function(paralellCallback) {
					if (self.appFlags.alerts.template) {
						self.alertsHideDropdown();
					}

					// Display notifications topbar element without alerts
					renderTemplate();
					paralellCallback(null, true);
				},
				uiRestrictions: function(paralellCallback) {
					monster.pub('myaccount.UIRestrictionsCompatibility', {
						restrictions: monster.apps.auth.originalAccount.ui_restrictions,
						callback: function(uiRestrictions) {
							paralellCallback(null, uiRestrictions);
						}
					});
				}
			}, function(err, results) {
				if (err || _.isEmpty(results.alerts)) {
					return;
				}

				// If there is no error, re-render topbar element with alerts
				renderTemplate(_.pick(results, ['alerts', 'uiRestrictions']));
			});
		},

		/**
		 * Hide notifications dropdown from the DOM
		 */
		alertsHideDropdown: function() {
			var self = this,
				$template = self.appFlags.alerts.template;

			if (!($template instanceof $)) {
				return;
			}

			$template.removeClass('open');
		},

		/**
		 * Bind template events
		 */
		alertsBindEvents: function() {
			var self = this,
				$template = self.appFlags.alerts.template,
				$alertsContainer = $template.find('#main_topbar_alerts_container'),
				$alertItems = $alertsContainer.find('.alert-item');

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

			$alertItems.find('.button-clear').on('click', function(e) {
				e.preventDefault();
				e.stopPropagation();

				self.alertsDismissAlert({
					alertItem: $(this).closest('.alert-item')
				});
			});

			$alertItems.filter('.actionable').on('click', function() {
				var $alertItem = $(this),
					alertAction = $alertItem.data('alert_action'),
					actionTopic = _.get(self.appFlags.alerts.actionTopics, alertAction);

				if (actionTopic) {
					monster.pub(actionTopic);
				}

				self.alertsDismissAlert({
					alertItem: $alertItem,
					save: false,
					callback: function() {
						self.alertsHideDropdown();
					}
				});
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
		 * @param    {Object[]} args.data            Array of alerts
		 * @param    {Object}   args.uiRestrictions  UI restrictions
		 * @returns  {Object}   Grouped alerts by UI categories
		 */
		alertsFormatData: function(args) {
			var self = this,
				data = args.data,
				uiRestrictions = args.uiRestrictions,
				readAlertIds = self.alertsGetStore('read', []),
				dismissedAlertIds = self.alertsGetStore('dismissed', []),
				sortOrder = [
					'manual',
					'system'
				],
				metadataFormat = self.appFlags.alerts.metadataFormat,
				getMetadata = function(category, key) {
					return _.get(
						metadataFormat.categories,
						[category, key],
						_.get(metadataFormat.common, key, {})
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
				.reject(function(alert) {
					return _.includes(dismissedAlertIds, alert.id);
				})
				.map(function(alert) {
					return _.merge({
						metadata: _
							.chain(alert.metadata)
							.map(function(value, key) {
								var metadata = getMetadata(alert.category, key);

								return {
									key: _.get(metadata, 'i18nKey'),
									value: formatValue(_.get(metadata, 'valueType'), value)
								};
							})
							.reject({ key: undefined })
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
						dashIndex,
						iconName;

					if (alert.clearable) {
						alertType = 'manual';
						iconName = 'websockets';
					} else if (_.includes([ 'low_balance', 'no_payment_token', 'expired_payment_token' ], category)) {
						alertType = 'system';
						iconName = 'myaccount';
					} else {
						dashIndex = category.indexOf('_');
						alertType = category.substring(0, dashIndex > 0 ? dashIndex : category.length);
						iconName = alertType;
					}

					alert.iconPath = monster.util.getAppIconPath({ name: iconName });
					alert.action = self.alertsGetCategoryAction({
						category: category,
						uiRestrictions: uiRestrictions
					});

					return alertType;
				}).map(function(alerts, type) {
					return {
						type: type,
						unreadCount: _.sumBy(alerts, function(alert) {
							return _.includes(readAlertIds, alert.id) ? 0 : 1;
						}),
						alerts: alerts
					};
				}).sortBy(function(alertGroup) {
					return _.includes(sortOrder, alertGroup.type) ? _.indexOf(sortOrder, alertGroup.type) : _.size(sortOrder);
				}).value();
		},

		/**
		 * Get the action name for a specific alert category
		 * @param    {Object} args
		 * @param    {String} args.category        Alert category
		 * @param    {Object} args.uiRestrictions  UI restrictions
		 * @returns  {String} The found action name, or null otherwise
		 */
		alertsGetCategoryAction: function(args) {
			var self = this,
				category = args.category,
				uiRestrictions = args.uiRestrictions,
				categoryAction = _.find(self.appFlags.alerts.categoryActions, function(categoryActionItem) {
					return _.includes(categoryActionItem.categories, category);
				}),
				uiRestrictionsCheckResult;

			if (_.isUndefined(categoryAction)) {
				return null;
			}

			uiRestrictionsCheckResult = self.alertsCheckUIRestrictions({
				uiRestrictions: uiRestrictions,
				expectedRestrictions: categoryAction.restrictions
			});

			return uiRestrictionsCheckResult ? categoryAction.action : null;
		},

		/**
		 * Checks UI restrictions, and returns `true` if they are valid, or `false` otherwise
		 * @param    {Object}  args
		 * @param    {Object}  args.expectedRestrictions  Expected restrictions
		 * @param    {Object}  args.uiRestrictions        UI restrictions
		 * @returns  {Boolean} `True` or `false`, whether the expected restrictions are valid or not
		 */
		alertsCheckUIRestrictions: function(args) {
			var self = this,
				expectedRestrictions = args.expectedRestrictions,
				uiRestrictions = args.uiRestrictions,
				deepRestrictionCheck = function(obj1, obj2) {
					if (!_.isObject(obj1) || !_.isObject(obj2)) {
						return obj1 === obj2;
					}

					return _.reduce(obj1, function(result, value1, key1) {
						if (!result) {
							return false;
						}
						var value2 = _.get(obj2, key1);
						return deepRestrictionCheck(value1, value2);
					}, true);
				};

			return _.isUndefined(expectedRestrictions) || deepRestrictionCheck(expectedRestrictions, uiRestrictions);
		},

		/**
		 * Set max-height for dropdown body, based on viewport size
		 * @param  {Object} args
		 * @param  {jQuery} args.dropdownBody  JQuery object for dropdown body
		 */
		alertsSetDropdownBodyMaxHeight: function(args) {
			var self = this,
				$dropdownBody = args.dropdownBody,
				// Expand dropdown up until it reaches 24px (1.5rem) from viewport bottom
				// (112px top + 24px bottom)
				maxHeight = $(window).height() - 136;

			if (maxHeight < 200) {
				maxHeight = 200;
			}

			$dropdownBody.css({
				maxHeight: maxHeight + 'px'
			});
		},

		/**
		 * Dismiss an alert item from the dropdown
		 * @param  {Object}   args
		 * @param  {JQuery}   args.alertItem    Alert item element
		 * @param  {Boolean}  [args.save=true]  Save the alert as dismissed
		 * @param  {Function} [args.callback]   Callback function
		 */
		alertsDismissAlert: function(args) {
			var self = this,
				$alertItem = args.alertItem,
				save = _.get(args, 'save', true),
				alertId = $alertItem.data('alert_id'),
				itemHasSiblings = $alertItem.siblings('.alert-item').length > 0,
				$alertGroup = $alertItem.parent(),
				$elementToRemove = itemHasSiblings ? $alertItem : $alertGroup,
				dismissedAlertIds;

			if (save && !_.includes(dismissedAlertIds, alertId)) {
				dismissedAlertIds = self.alertsGetStore('dismissed', []);
				dismissedAlertIds.push(alertId);
				self.alertsSetStore('dismissed', dismissedAlertIds);
			}

			$elementToRemove.slideUp(200, function() {
				$elementToRemove.remove();

				_.has(args, 'callback') && args.callback();
			});

			if (!itemHasSiblings && $alertGroup.siblings('.alert-group').length === 0) {
				$alertGroup.siblings('.alert-group-empty').slideDown(200);
			}
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
					accountId: monster.apps.auth.currentAccount.id,
					generateError: false
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
