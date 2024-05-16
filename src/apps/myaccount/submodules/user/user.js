define(function(require) {
	var $ = require('jquery'),
		_ = require('lodash'),
		monster = require('monster'),
		timezone = require('monster-timezone');

	var user = {

		subscribe: {
			'myaccount.user.renderContent': '_userRenderContent'
		},

		_userRenderContent: function(args) {
			var self = this;

			monster.parallel({
				'user': function(callback) {
					self.callApi({
						resource: 'user.get',
						data: {
							accountId: monster.apps.auth.originalAccount.id,
							userId: self.userId
						},
						success: function(data, status) {
							callback && callback(null, data.data);
						}
					});
				},
				'countries': function(callback) {
					callback && callback(null, timezone.getCountries());
				}
			}, function(err, results) {
				var formattedData = self.userLayoutFormatData(results),
					userTemplate = $(self.getTemplate({
						name: 'layout',
						data: formattedData,
						submodule: 'user'
					}));

				self.userBindingEvents(userTemplate, results);

				monster.pub('myaccount.renderSubmodule', userTemplate);

				if (typeof args.callback === 'function') {
					args.callback(userTemplate);
				}
			});
		},

		userLayoutFormatData: function(data) {
			var self = this;

			data.defaultNumbersFormat = self.i18n.active().numbersFormat[monster.util.getDefaultNumbersFormat()];
			data.outboundPrivacy = _.map(self.appFlags.common.outboundPrivacy, function(strategy) {
				return {
					key: strategy,
					value: self.i18n.active().myAccountApp.common.outboundPrivacy.values[strategy]
				};
			});

			if (!(data.user.hasOwnProperty('ui_flags') && data.user.ui_flags.hasOwnProperty('numbers_format'))) {
				data.user.ui_flags = data.user.ui_flags || {};
				data.user.ui_flags.numbers_format = 'inherit';
			}

			return data;
		},

		userBindingEvents: function(template, data) {
			var self = this;

			timezone.populateDropdown(template.find('#user_timezone'), data.user.timezone || 'inherit', { inherit: self.i18n.active().defaultTimezone });
			monster.ui.chosen(template.find('#user_timezone'));
			monster.ui.showPasswordStrength(template.find('#password'));

			monster.ui.chosen(template.find('#numbers_format_exceptions'));

			template.find('[name="ui_flags.numbers_format"]').on('change', function() {
				template.find('.group-for-exceptions').toggleClass('active', template.find('[name="ui_flags.numbers_format"]:checked').val() === 'international_with_exceptions');
			});

			monster.ui.tooltips(template);

			monster.pub('myaccount.events', {
				template: template,
				data: data,
				validateCallback: function(callback) {
					var formPassword = template.find('#form_password');

					monster.ui.validate(formPassword, {
						rules: {
							'password': {
								minlength: 6
							},
							'confirm_password': {
								equalTo: 'input[name="password"]'
							}
						}
					});

					if (monster.ui.valid(formPassword)) {
						callback && callback(null);
					}
				}
			});
		}
	};

	return user;
});
