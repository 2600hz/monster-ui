define(function(require) {
	var $ = require('jquery'),
		_ = require('lodash'),
		monster = require('monster');

	var notifications = {
		// Defines API requests not included in the SDK
		requests: {},

		/**
		 * Formats the notification data received from the API, into UI categories
		 * @param    {Object}   args
		 * @param    {Object[]} args.data  Array of notifications
		 * @returns  {Object}              Grouped notifications by UI categories
		 */
		notificationsFormatData: function(args) {
			var self = this;

			return _.groupBy(args.data, function(notification) {
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
				error: function(parsedError) {
					_.has(args, 'error') && args.error(parsedError);
				}
			});
		}
	};

	return notifications;
});
