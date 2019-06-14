define(function(require) {
	var $ = require('jquery'),
		_ = require('lodash'),
		monster = require('monster');

	var accountAncestors = {

		requests: {},

		subscribe: {
			'common.accountAncestors.render': 'accountAncestorsRender'
		},

		accountAncestorsRender: function(args) {
			var self = this;

			if (!_.isBoolean(args.isMasqueradable)) {
				args.isMasqueradable = true;
			}

			self.accountAncestorsRequestGetData({
				data: {
					accountId: args.accountId
				},
				success: function(accounts) {
					var account = accounts[accounts.length - 1],
						dataToTemplate = $.extend(true, self.accountAncestorsFormatDataToTemplate(args.entity, account), {
							isMasqueradable: args.isMasqueradable,
							parents: accounts
						}),
						template = $(self.getTemplate({
							name: 'layout',
							data: dataToTemplate,
							submodule: 'accountAncestors'
						})),
						popup = monster.ui.dialog(template, {
							title: self.accountAncestorsGeneratePopupTitle(args.entity, account)
						});

					monster.ui.tooltips(popup);

					self.accountAncestorsBindEvents({
						container: popup,
						data: {
							account: account
						}
					});
				}
			});
		},

		accountAncestorsBindEvents: function(args) {
			var self = this,
				container = args.container;

			container
				.find('#masqueradable')
					.on('click', function(event) {
						event.preventDefault();

						monster.pub('core.triggerMasquerading', {
							account: args.data.account,
							callback: function() {
								var currentApp = monster.apps.getActiveApp();

								if (_.has(monster.apps, currentApp)) {
									container.dialog('close');
									monster.apps[currentApp].render();
								}
							}
						});
					});
		},

		accountAncestorsGeneratePopupTitle: function(entity, account) {
			var type = entity ? entity.type : 'account';

			if (type === 'number') {
				return monster.util.formatPhoneNumber(entity.data.id);
			} else if (type === 'macAddress') {
				return entity.data.mac_address.match(/[0-9a-f]{2}/gi).join(':');
			} else if (type === 'account') {
				return account.name;
			}
		},

		accountAncestorsFormatDataToTemplate: function(entity, account) {
			var self = this,
				type = entity ? entity.type : 'account',
				data = entity ? entity.data : undefined,
				i18n = self.i18n.active().accountAncestors.entities[type],
				dataToTemplate = {};

			if (type === 'number') {
				if (data.hasOwnProperty('used_by')) {
					dataToTemplate.usedBy = i18n.usedBy.replace('{{variable}}', self.i18n.active().numbers[data.used_by]);
				} else {
					dataToTemplate.usedBy = i18n.notUsed;
				}
				dataToTemplate.ownedBy = i18n.ownedBy.replace('{{variable}}', account.name);
			} else if (type === 'macAddress') {
				dataToTemplate.usedBy = i18n.usedBy.replace('{{variable}}', data.name);
				dataToTemplate.ownedBy = i18n.ownedBy.replace('{{variable}}', account.name);
			}

			return dataToTemplate;
		},

		accountAncestorsRequestGetData: function(args) {
			var self = this;

			monster.parallel({
				account: function(callback) {
					self.callApi({
						resource: 'account.get',
						data: {
							accountId: args.data.accountId
						},
						success: function(data, status) {
							callback(null, data.data);
						}
					});
				},
				parents: function(callback) {
					self.callApi({
						resource: 'account.listParents',
						data: {
							accountId: args.data.accountId
						},
						success: function(data, status) {
							callback(null, data.data);
						}
					});
				}
			}, function(err, results) {
				results.parents.push(results.account);

				args.hasOwnProperty('success') && args.success(results.parents);
			});
		}
	};

	return accountAncestors;
});
