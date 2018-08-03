define(function(require) {
	var $ = require('jquery'),
		_ = require('lodash'),
		monster = require('monster'),
		timezone = require('monster-timezone');

	var account = {
		subscribe: {
			'myaccount.account.renderContent': '_accountRenderContent'
		},

		refreshAccessListHeader: function(parent) {
			var self = this,
				editAccountId = self.accountId,
				$settingsItem = parent.find('li.settings-item[data-name="accountsmanager_access_list"]');

			self.callApi({
				resource: 'accessLists.get',
				data: {
					accountId: editAccountId
				},
				success: function(data, status) {
					// Declare empty array for type safety as access lists API returns no data.data property when there are no CIDRs.
					var accessList = [];
					if (Object.getOwnPropertyNames(data.data).length !== 0) {
						accessList = data.data.cidrs;
						var order = data.data.order;
						$settingsItem.find('.total-cidrs').text(accessList.length);
						if (order === 'deny,allow') {
							$settingsItem.find('.first-cidr').text(self.i18n.active().account.denyFirst);
						} else if (order === 'allow,deny') {
							$settingsItem.find('.first-cidr').text(self.i18n.active().account.allowFirst);
						} else {
						//account does not have cidrs or order defined
							$settingsItem.find('.total-cidrs').text(accessList.length);
							$settingsItem.find('.first-cidr').text(self.i18n.active().account.cidrsNotConfigured);
						}
					}
				}
			});
		},

		renderEditAccessListForm: function(parent) {
			var self = this,
				$settingsItem = parent.find('li.settings-item[data-name="accountsmanager_access_list"]');

			self.callApi({
				resource: 'accessLists.get',
				data: {
					accountId: self.accountId
				},
				success: function(data, status) {
					if (Object.getOwnPropertyNames(data.data).length !== 0) {
						var allowOrDeny = data.data.order;
					}

					if ((typeof allowOrDeny !== 'undefined') && (allowOrDeny !== null) && allowOrDeny) {
						if (allowOrDeny === 'allow,deny') {
							$settingsItem.find('#account_deny_allow_order').val('allow,deny');
						} else if (allowOrDeny === 'deny,allow') {
							$settingsItem.find('#account_deny_allow_order').val('deny,allow');
						}
					} else {
						//allow,deny is default allow/deny order
						$settingsItem.find('#account_deny_allow_order').val('allow,deny');
					}

					//load cidrs into access list
					if (data.data.cidrs && (data.data.cidrs !== undefined) && (data.data.cidrs.length !== 0)) {
						//parse access list
						var displayAccessList = '' + data.data.cidrs[0];
						displayAccessList.append;
						for (var i = 1; i < data.data.cidrs.length; i++) {
							displayAccessList += '\n';
							displayAccessList += data.data.cidrs[i];
						}
						//find access list text area and populate
						$settingsItem.find('#access-list-input').val(displayAccessList);
					} else {
						$settingsItem.find('#access-list-input').val('');
					}
				},
				error: function(data, status) {

				}
			});

			self.refreshAccessListHeader(parent);
		},

		_accountRenderContent: function(args) {
			var self = this;

			self.accountGetData(function(data) {
				var accountTemplate = $(self.getTemplate({
					name: 'layout',
					data: data,
					submodule: 'account'
				}));

				if (data.allowAccessList) {
					self.renderEditAccessListForm(accountTemplate);
				}

				self.accountBindEvents(accountTemplate, data);

				monster.pub('myaccount.renderSubmodule', accountTemplate);

				args.callback && args.callback(accountTemplate);
			});
		},

		accountBindEvents: function(template, data) {
			var self = this;
			var editAccountId = self.accountId;

			timezone.populateDropdown(template.find('#account_timezone'), data.account.timezone);
			monster.ui.chosen(template.find('#account_timezone'));

			//Temporary button design fix until we redesign the Accounts Manager
			template.find('#accountsmanager_carrier_save')
					.removeClass('btn btn-success')
					.addClass('monster-button-success');

			monster.ui.chosen(template.find('#numbers_format_exceptions'));

			template.find('[name="ui_flags.numbers_format"]').on('change', function() {
				template.find('.group-for-exceptions').toggleClass('active', template.find('[name="ui_flags.numbers_format"]:checked').val() === 'international_with_exceptions');
			});

			//saving the access list settings
			template.find('li[data-name="accountsmanager_access_list"] .saveList').click(function() {
				var order = $('#account_deny_allow_order').val(),
					accessListText = $.trim($('#access-list-input').val()).split('\n');

				//is this a valid list of cidrs?
				var isValidCidrList = self.validateCidrList(accessListText);
				//if not valid, tell user and return
				if (!isValidCidrList) {
					return;
				}

				//if access list is empty, don't put cidrs in post request
				var cidrData = {
					order: order
				};
				if (JSON.stringify(accessListText) !== JSON.stringify([''])) {
					cidrData.cidrs = accessListText;
				} else {
					cidrData.cidrs = [];
				}

				self.callApi({
					resource: 'accessLists.update',
					data: {
						accountId: editAccountId,
						data: cidrData,
						removeMetadataAPI: true
					},
					success: function() {
						self.refreshAccessListHeader(template);
						monster.ui.toast({
							type: 'success',
							message: self.i18n.active().account.postCidrSuccess
						});
					},
					error: function() {

					}
				});
			});

			monster.ui.tooltips(template);

			monster.pub('myaccount.events', {
				template: template,
				data: data
			});
		},

		accountGetNoMatch: function(callback) {
			var self = this;

			self.callApi({
				resource: 'callflow.list',
				data: {
					accountId: self.accountId,
					filters: {
						filter_numbers: 'no_match'
					}
				},
				success: function(listCallflows) {
					if (listCallflows.data.length === 1) {
						self.callApi({
							resource: 'callflow.get',
							data: {
								callflowId: listCallflows.data[0].id,
								accountId: self.accountId
							},
							success: function(callflow) {
								callback(callflow.data);
							}
						});
					} else {
						callback({});
					}
				}
			});
		},

		accountGetData: function(globalCallback) {
			var self = this;

			monster.parallel({
				accessLists: function(callback) {
					self.callApi({
						resource: 'accessLists.get',
						data: {
							accountId: self.accountId,
							generateError: false
						},
						success: function(data, status) {
							callback(null, data.data);
						},
						error: function(parsedError, error, globalHandler) {
							if (error.status === 404) {
								callback(null, {});
							} else {
								globalHandler(error, {
									generateError: true
								});
							}
						}
					});
				},
				account: function(callback) {
					self.callApi({
						resource: 'account.get',
						data: {
							accountId: self.accountId
						},
						success: function(data, status) {
							callback && callback(null, data.data);
						}
					});
				},
				noMatch: function(callback) {
					self.accountGetNoMatch(function(data) {
						callback && callback(null, data);
					});
				},
				countries: function(callback) {
					callback && callback(null, timezone.getCountries());
				}
			}, function(err, results) {
				self.accountFormatData(results, globalCallback);
			});
		},

		validateCidrList: function(cidrList) {
			var self = this;
			// Handle the case where there are no cidrs.
			// This is allowed as it means the user has cleared their access list.
			if (cidrList.length === 1 && cidrList[0] === '') {
				console.log('corrrect');
				return true;
			}

			// Make sure the array does not contain duplicates
			if (new Set(cidrList).size !== cidrList.length) {
				monster.ui.toast({
					type: 'error',
					message: self.i18n.active().account.errorDuplicate
				});
				return false;
			}

			//cidr regex
			var cidrRegex = /^(([0-9]|[1-9][0-9]|1[0-9]{2}|2[0-4][0-9]|25[0-5])\.){3}([0-9]|[1-9][0-9]|1[0-9]{2}|2[0-4][0-9]|25[0-5])(\/([0-9]|[1-2][0-9]|3[0-2]))$/;
			//check the cidr list line by line, see if each line is a cidr
			for (var i = 0; i < cidrList.length; i++) {
				if (!cidrRegex.test(cidrList[i])) {
					monster.ui.toast({
						type: 'error',
						message: self.i18n.active().account.accessListInvalid
					});
					return false;
				}
			}

			//if looped through and all the lines match a cidr, return true
			return true;
		},

		accountFormatData: function(data, globalCallback) {
			var self = this;
			var whitelabel = monster.config.whitelabel;

			data.outboundPrivacy = _.map(self.appFlags.common.outboundPrivacy, function(strategy) {
				return {
					key: strategy,
					value: self.i18n.active().myAccountApp.common.outboundPrivacy.values[strategy]
				};
			});

			if (!(data.account.hasOwnProperty('ui_flags') && data.account.ui_flags.hasOwnProperty('numbers_format'))) {
				data.account.ui_flags = data.account.ui_flags || {};
				data.account.ui_flags.numbers_format = 'international';
			}

			if (_.isEmpty(data.accessLists)) {
				// Disable access lists when the kazoo module is unreachable
				data.allowAccessList = false;
			} else if (whitelabel.hasOwnProperty('allowAccessList')) {
				// Enable/Disable access lists following config.js configuration
				data.allowAccessList = whitelabel.allowAccessList;
			} else {
				data.allowAccessList = false;
			}

			globalCallback && globalCallback(data);
		}
	};

	return account;
});
