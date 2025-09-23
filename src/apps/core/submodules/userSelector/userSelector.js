define(function(require) {
	var $ = require('jquery'),
		_ = require('lodash'),
		monster = require('monster');

	var userSelector = {
		// Defines API requests not included in the SDK
		requests: {},

		// Define the events available for other apps
		subscribe: {
			'core.userSelector.renderDialog': 'userSelectorRenderDialog'
		},

		appFlags: {
			alerts: {
			}
		},

		userSelectorRenderDialog: function(args) {
			var self = this,
				title = args.title,
				selectedUsers = args.selectedUsers,
				$layoutTemplate = $(self.getTemplate({
					name: 'layout',
					submodule: 'userSelector'
				})),
				$container = $layoutTemplate.find('#user_selector_container'),
				$popup = monster.ui.dialog($layoutTemplate, {
					title: title
				});

			monster.ui.insertTemplate($container, function(callback) {
				self.userSelectorInitTemplate({
					selectedUsers: selectedUsers,
					callback: function(err, $template) {
						if (err) {
							$popup.dialog('close').remove();
							return;
						}

						callback($template);
					}
				});
			});

			return $popup;
		},

		userSelectorInitTemplate: function(args) {
			var self = this,
				callback = args.callback,
				selectedUsers = args.selectedUsers,
				$template = $(self.getTemplate({
					name: 'selector',
					submodule: 'userSelector'
				}));

			monster.waterfall([
				function getUsers(next) {
					self.userSelectorGetUserList(next);
				}
			], function(err, users) {
				if (err) {
					return callback(err);
				}

				monster.ui.linkedColumns($template.find('#user_selector'), users, selectedUsers, {});

				callback(null, $template);
			});
		},

		userSelectorGetUserList: function(args) {
			var self = this,
				callback = args.callback;

			self.callApi({
				resource: 'user.list',
				data: {
					accountId: self.accountId,
					filters: {
						paginate: 'false'
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
