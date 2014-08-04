define(function(require){
	var $ = require('jquery'),
		_ = require('underscore'),
		monster = require('monster'),
		timezone = require('monster-timezone');

	var account = {

		subscribe: {
			'myaccount.account.renderContent': '_accountRenderContent'
		},

		_accountRenderContent: function(args){
			var self = this;

			self.callApi({
				resource: 'account.get',
				data: {
					accountId: self.accountId
				},
				success: function(data, status) {
					var data = { account: data.data },
						accountTemplate = $(monster.template(self, 'account-layout', data));

					self.accountBindEvents(accountTemplate, data);

					monster.pub('myaccount.renderSubmodule', accountTemplate);

					if ( typeof args.callback === 'function') {
						args.callback(accountTemplate);
					}
				}
			})
		},

		accountBindEvents: function(template, data) {
			var self = this;

			timezone.populateDropdown(template.find('#account_timezone'), data.account.timezone);
			template.find('#account_timezone').chosen({ search_contains: true, width: '100%' });

			monster.pub('myaccount.events', {
				template: template,
				data: data
			});
		}
	};

	return account;
});