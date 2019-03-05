define(function(require) {
	var $ = require('jquery'),
		_ = require('lodash'),
		monster = require('monster');

	var alerts = {
		// Defines API requests not included in the SDK
		requests: {},

		// Define the events available for other apps
		subscribe: {
			'core.alerts.refresh': 'alertsRender'
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
							alertCount: alertCount > 9 ? '9+' : alertCount.toString()
						},
						$template = $(self.getTemplate({
							name: 'nav',
							data: dataTemplate,
							submodule: 'alerts'
						}));

					monster.ui.tooltips($template);

					self.alertsBindEvents({ template: $template });

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

			monster.waterfall([
				function(callback) {
					// Display notifications topbar element without alerts
					renderTemplate();
					callback(null);
				},
				function(callback) {
					// Get alerts from API
					self.alertsRequestListAlerts({
						success: function(data) {
							callback(null, data);
						},
						error: function(parsedError) {
							callback(parsedError);
						}
					});
				}
			], function(err, alerts) {
				if (err) {
					return;
				}

				// If there is no error, re-render topbar element with alerts
				renderTemplate(alerts);
			});
		},

		/**
		 * Bind template content events
		 * @param  {Object} args
		 * @param  {jQuery} args.template  Template to bind
		 */
		alertsBindEvents: function(args) {
			var self = this,
				$template = args.template;

			$template.find('#main_topbar_alert_link').on('click', function(e) {
				e.preventDefault();

				var $this = $(this);

				$this.parent().toggleClass('open');
				$this.find('.badge')
					.fadeOut(250, function() {
						$(this).remove();
					});
			});
		},

		/**
		 * Formats the alert data received from the API, into UI categories
		 * @param    {Object}   args
		 * @param    {Object[]} args.data  Array of alerts
		 * @returns  {Object}              Grouped alerts by UI categories
		 */
		alertsFormatData: function(args) {
			var self = this,
				data = args.data,
				sortOrder = {
					manual: '1',
					system: '2'
				};

			if (_.isEmpty(data)) {
				return [];
			}

			return _.chain(data)
				.each(function(alert) {
					if (_.has(alert, 'metadata') && _.isEmpty(alert.metadata)) {
						delete alert.metadata;
					}
				})
				.groupBy(function(alert) {
					var alertType,
						category = alert.category;

					if (alert.clearable) {
						alertType = 'manual';
					} else if (_.includes([ 'low_balance', 'no_payment_token', 'expired_payment_token' ], category)) {
						alertType = 'system';
					} else {
						alertType = alert.category.substring(0, category.indexOf('_'));
					}

					return alertType;
				}).map(function(alerts, type) {
					return {
						type: type,
						alerts: alerts
					};
				}).sortBy(function(alertGroup) {
					return _.get(sortOrder, alertGroup.type, '3' + alertGroup.type);
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
