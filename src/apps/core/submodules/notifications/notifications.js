define(function(require) {
	var $ = require('jquery'),
		_ = require('lodash'),
		monster = require('monster');

	var notifications = {
		// Defines API requests not included in the SDK
		requests: {},

		// Define the events available for other apps
		subscribe: {
			'core.alerts.hideDropdown': 'notificationsHideDropdown',
			'core.alerts.refresh': 'notificationsRender'
		},

		/**
		 * Fetch alerts from API into the notifications dropdown, and resets component to default
		 * state (hide dropdown and show notifications count if any)
		 * @param  {Object}   args
		 * @param  {jQUery}   args.container            Dropdown container
		 * @param  {Object}   [args.callbacks]          Optional callbacks
		 * @param  {Function} [args.callbacks.success]  Success callback
		 */
		notificationsRender: function(args) {
			var self = this,
				$container = args.container,
				initTemplate = function initTemplate(notificationsData) {
					var formattedNotifications = self.notificationsFormatData({
							data: notificationsData
						}),
						dataTemplate = {
							notifications: formattedNotifications
						},
						$template = $(self.getTemplate({
							name: 'layout',
							data: dataTemplate,
							submodule: 'trunks'
						}));

					self.notificationsBindEvents({
						template: $template
					});
				};

			monster.waterfall([
				function(callback) {
					self.notificationsHideDropdown();

					self.notificationsRequestListAlerts({
						success: function(data) {
							callback(null, data);
						},
						error: function(parsedError) {
							callback(parsedError);
						}
					});
				}
			], function(err, data) {
				if (err) {
					_.has(args, 'callbacks.error') && args.callbacks.error(err);
				} else {
					initTemplate(data);

					_.has(args, 'callbacks.success') && args.callbacks.success();
				}
			});
		},

		/**
		 * Hides the notifications dropdown at the DOM
		 */
		notificationsHideDropdown: function() {
			// TODO
		},

		/**
		 * Formats the notification data received from the API, into UI categories
		 * @param    {Object}   args
		 * @param    {Object[]} args.data  Array of notifications
		 * @returns  {Object}              Grouped notifications by UI categories
		 */
		notificationsFormatData: function(args) {
			var self = this;

			return _.chain(args.data)
				.groupBy(function(notification) {
					var notificationType;

					if (notification.clearable) {
						notificationType = 'manual';
					} else if (_.includes([ 'low_balance', 'no_payment_token', 'expired_payment_token' ], notification.category)) {
						notificationType = 'system';
					} else {
						notificationType = 'apps';
					}

					return notificationType;
				}).value();
		},

		/**
		 * Bind template content events
		 * @param  {Object} args
		 * @param  {jQuery} args.template    Template to bind
		 */
		notificationsBindEvents: function(args) {
			var self = this,
				$template = args.template;

			// TODO
		},

		/**
		 * Request alerts list from API
		 * @param  {Object}   args
		 * @param  {Function} [args.success]  Success callback
		 * @param  {Function} [args.error]    Error callback
		 */
		notificationsRequestListAlerts: function(args) {
			var self = this;

			self.callApi({
				resource: 'alert.list',
				data: {
					accountId: self.accountId
				},
				success: function(data, status) {
					_.has(args, 'success') && args.success(data.data, status);
				},
				error: function(data, status) {
					_.has(args, 'error') && args.error(data, status);
				}
			});
		}
	};

	return notifications;
});
