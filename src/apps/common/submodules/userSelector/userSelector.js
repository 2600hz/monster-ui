define(function(require) {
	var _ = require('lodash'),
		monster = require('monster');

	var userSelector = {
		// Define the events available for other apps
		subscribe: {
			'common.userSelector.renderDialog': 'userSelectorRenderDialog'
		},

		/**
		 * Renders a dialog to select one or more users from the list of all available users in the account.
		 * @param   {Object} args
		 * @param   {String} args.title Dialog title.
		 * @param   {String[]} args.selectedUserIds List of pre-selected user IDs.
		 * @param   {Function} [args.okCallback] Callback function to be invoked when the OK button is pressed, which will receie the list of selected items.
		 * @param   {Function} [args.cancelCallback] Callback function to be invoked when the Cancel button is pressed.
		 * @param   {Object} [args.i18n] Object that contains translations for labels.
		 * @param   {String} [args.i18n.okButton] Label for the OK button.
		 * @param   {String} [args.i18n.cancelButton] Label for the Cancel button.
		 * @param   {String} [args.i18n.search] Label for the Search input placeholder.
		 * @param   {Object} [args.i18n.columnsTitles] Object that contains labels for the linked columns titles.
		 * @param   {String} [args.i18n.columnsTitles.available] Label for the column of available items.
		 * @param   {String} [args.i18n.columnsTitles.selected] Label for the column of selected items.
		 * @returns {jQuery} JQuery dialog container element.
		 */
		userSelectorRenderDialog: function(args) {
			var self = this,
				title = args.title,
				selectedUserIds = args.selectedUserIds,
				i18n = _.get(args, 'i18n', {}),
				okCallback = args.okCallback,
				cancelCallback = args.cancelCallback,
				getItems = function(callback) {
					monster.waterfall([
						_.bind(self.userSelectorGetUserList, self)
					], function(err, users) {
						if (err) {
							return callback(err);
						}

						var items = _.map(users, function(user) {
							return {
								key: user.id,
								value: monster.util.getUserFullName(user)
							};
						});

						callback(null, items);
					});
				};

			return monster.pub('common.monsterMultiSelector.renderDialog', {
				title: title,
				selectedKeys: selectedUserIds,
				getItems: getItems,
				okCallback: okCallback,
				cancelCallback: cancelCallback,
				i18n: i18n
			});
		},

		/**
		 * Gets the list of users for the current account.
		 * @param  {Function} callback Callback function to be executed when the API call is finished, with the error or the list of users.
		 */
		userSelectorGetUserList: function(callback) {
			var self = this;

			self.callApi({
				resource: 'user.list',
				data: {
					accountId: self.accountId,
					filters: {
						paginate: false
					}
				},
				success: function(dataUsers) {
					callback && callback(null, dataUsers.data);
				},
				error: function(parsedError) {
					callback && callback(parsedError);
				}
			});
		}
	};

	return userSelector;
});
