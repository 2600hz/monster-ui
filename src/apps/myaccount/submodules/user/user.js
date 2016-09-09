define(function(require) {
	var $ = require('jquery'),
		_ = require('underscore'),
		chosen = require('chosen'),
		monster = require('monster'),
		timezone = require('monster-timezone');

	var user = {

		subscribe: {
			'myaccount.user.renderContent': '_userRenderContent'
		},

		_userRenderContent: function(args) {
			var self = this;

			self.callApi({
				resource: 'user.get',
				data: {
					accountId: monster.apps.auth.originalAccount.id,
					userId: self.userId
				},
				success: function(data, status) {
					var data = { user: data.data },
						userTemplate = $(monster.template(self, 'user-layout', data));

					self.userBindingEvents(userTemplate, data);

					monster.pub('myaccount.renderSubmodule', userTemplate);

					if ( typeof args.callback === 'function') {
						args.callback(userTemplate);
					}
				}
			});
		},

		userBindingEvents: function(template, data) {
			var self = this;

			timezone.populateDropdown(template.find('#user_timezone'), data.user.timezone||'inherit', {inherit: self.i18n.active().defaultTimezone});
			template.find('#user_timezone').chosen({ search_contains: true, width: '220px' });
			monster.ui.showPasswordStrength(template.find('#password'));

			monster.pub('myaccount.events', {
				template: template,
				data: data
			});
		}
	};

	return user;
});