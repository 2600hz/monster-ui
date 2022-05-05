define(function(require) {
	var $ = require('jquery'),
		_ = require('lodash'),
		monster = require('monster');

	require('isotope');

	var app = {

		i18n: {
			'de-DE': { customCss: false },
			'en-US': { customCss: false },
			'fr-FR': { customCss: false },
			'ru-RU': { customCss: false }
		},
		requests: {
			'marketplace.get': {
				url: 'apps_store/marketplace',
				verb: 'GET'
			},
			'marketplace.action': {
				apiRoot: monster.config.api.default,
				url: 'apps_store/marketplace',
				verb: 'PATCH'
			}
		},

		render: function(container) {
			var self = this,
				shouldShowMarket = monster.util.isSuperDuper() && !monster.util.isMasquerading(),
				template = $(self.getTemplate({
					name: 'app',
					data: {
						shouldShowMarket: shouldShowMarket
					}
				})),
				parent = container || $('#monster_content');

			if (!monster.config.whitelabel.hasOwnProperty('hideAppStore') || monster.config.whitelabel.hideAppStore === false) {
				self.loadData(function(err, appstoreData) {
					self.renderAppList(template, appstoreData);
					self.bindEvents(template, appstoreData, shouldShowMarket);
				}, shouldShowMarket);

				parent
					.empty()
					.append(template);
			} else {
				monster.ui.toast({
					type: 'error',
					message: self.i18n.active().appStoreDisabled
				});
			}
		},

		appstoreData: null,

		bindEvents: function(parent, appstoreData, shouldShowMarket) {
			var self = this,
				searchInput = parent.find('.search-bar input.search-query'),
				appListContent = null;

			setTimeout(function() { searchInput.focus(); });

			parent.find('.app-filter').on('click', function(e) {
				var $this = $(this),
					filter = $this.data('filter');

				parent.find('.app-filter').removeClass('active');
				$this.addClass('active');

				if (appListContent) {
					parent.find('.left-menu .marketplace .launch-market').removeClass('active');
					parent
						.find('.right-container')
						.empty()
						.append(appListContent)
						.find('> *')
						.fadeIn();
					appListContent = null;
				}
				parent.find('.app-list').isotope({
					filter: '.app-element' + (filter ? '.' + filter : '')
				});

				searchInput.val('').focus();
			});

			parent.find('.right-container .app-list').on('click', '.app-element', function(e) {
				self.showAppPopup($(this).data('id'), appstoreData);
			});

			searchInput.on('keyup', function(e) {
				var value = $(this).val(),
					selectedFilter = parent.find('.app-filter.active').data('filter'),
					filter = '.app-element' + (selectedFilter ? '.' + selectedFilter : '');

				if (value) {
					filter += '[data-name*="' + value + '"]';
				}

				parent.find('.app-list').isotope({
					filter: '.app-element' + filter
				});
			});

			if (shouldShowMarket) {
				parent.find('.left-menu .marketplace').on('click', '.launch-market', function(e) {
					var $this = $(this);

					parent.find('.app-filter').removeClass('active');
					$this.addClass('active');

					appListContent = parent
						.find('.right-container > *')
						.fadeOut(function() {
							$(this).detach();
						});
					self.showMarketplaceConnector(parent);
				});
			}
		},

		loadData: function(callback, shouldShowMarket) {
			var self = this;

			monster.parallel({
				apps: function(next) {
					monster.pub('apploader.getAppList', {
						accountId: self.accountId,
						scope: 'all',
						success: _.partial(next, null),
						error: next
					});
				},
				users: function(next) {
					self.callApi({
						resource: 'user.list',
						data: {
							accountId: self.accountId,
							filters: {
								paginate: false
							}
						},
						success: function(data, status) {
							next(null, data.data);
						}
					});
				},
				marketplace: function(next) {
					// use this fake to test ui without calling API
					//
					// let fake = {
					// 	cluster_id: 'lolololololol',
					// 	enabled: false,
					// 	app_exchange_url: 'http://localhost:8080/',
					// 	marketplace_url: 'http://localhost:3030',
					// 	is_linked: false,
					// 	_read_only: {}
					// };
					// next(null, fake);

					if (!shouldShowMarket) {
					   return next();
					}
					monster.request({
						resource: 'marketplace.get',
						success: function(response) {
							next(null, response.data);
						},
						error: function() {
							next();
						}
					});
				}
			}, function(err, data) {
				if (!err) {
					self.appstoreData = data;
				}
				callback(err, data);
			});
		},

		renderAppList: function(parent, appstoreData) {
			var self = this,
				appList = appstoreData.apps,
				isAppInstalled = function(app) {
					return _.get(app, 'allowed_users', 'specific') !== 'specific'
						|| !_.isEmpty(_.get(app, 'users', []));
				},
				template = $(self.getTemplate({
					name: 'appList',
					data: {
						apps: _.map(appList, function(app) {
							return _.merge({
								isInstalled: isAppInstalled(app)
							}, app);
						})
					}
				}));

			parent
				.find('.right-container')
					.empty()
					.append(template);

			parent
				.find('.app-list')
					.isotope({
						getSortData: {
							name: function($elem) {
								return $elem.find('.app-title').text();
							}
						},
						sortBy: 'name'
					});
		},

		showAppPopup: function(appId, appstoreData) {
			var self = this,
				metadata = _.find(appstoreData.apps, { id: appId }),
				userList = $.extend(true, [], appstoreData.users),
				app = _.merge({
					extra: _.merge({
						extendedDescription: metadata.extended_description,
						screenshots: _.map(metadata.screenshots || [], function(val, key) {
							return self.apiUrl + 'apps_store/' + appId + '/screenshot/' + key + '?auth_token=' + self.getAuthToken();
						})
					}, _.pick(metadata, [
						'label',
						'description',
						'features',
						'icon'
					]))
				}, metadata),
				selectedUsersLength = app.users ? app.users.length : 0,
				selectedUsersList = _.map(app.users || [], function(val) {
					return val.id;
				}),
				users = _.map(userList, function(val, key) {
					if (selectedUsersList.indexOf(val.id) >= 0) {
						val.selected = true;
					}
					return val;
				}),
				template = $(self.getTemplate({
					name: 'appPopup',
					data: {
						isWhitelabeling: monster.util.isWhitelabeling(),
						app: app,
						users: users,
						i18n: {
							selectedUsers: selectedUsersLength,
							totalUsers: users.length
						}
					}
				})),
				rightContainer = template.find('.right-container'),
				isActive = true;

			if (!app.hasOwnProperty('allowed_users') || (app.allowed_users === 'specific' && (app.users || []).length === 0)) {
				rightContainer.find('#app_switch').prop('checked', false);
				rightContainer.find('.permissions-bloc').hide();
				isActive = false;
			} else if (app.allowed_users === 'admins') {
				rightContainer.find('#app_popup_admin_only_radiobtn').prop('checked', true);
			} else if (app.users && app.users.length > 0) {
				rightContainer.find('#app_popup_specific_users_radiobtn').prop('checked', true);
				rightContainer.find('.permissions-link').show();
				rightContainer
					.find('#app_popup_select_users_link')
						.html(self.getTemplate({
							name: '!' + self.i18n.active().selectUsersLink,
							data: {
								selectedUsers: selectedUsersLength
							}
						}));
			}

			self.bindPopupEvents(template, app, isActive, appstoreData.apps);

			rightContainer.find('.selected-users-number').html(selectedUsersLength);
			rightContainer.find('.total-users-number').html(users.length);

			monster.ui.dialog(template, { title: app.extra.label });

			template.find('#screenshot_carousel').carousel();
		},

		bindPopupEvents: function(parent, app, isActive, apps) {
			var self = this,
				userList = parent.find('.user-list'),
				updateAppInstallInfo = function(appInstallInfo, successCallback, errorCallback) {
					var apiResource = appInstallInfo.hasOwnProperty('allowed_users') ? (app.hasOwnProperty('allowed_users') ? 'appsStore.update' : 'appsStore.add') : 'appsStore.delete';

					self.callApi({
						resource: apiResource,
						data: {
							accountId: self.accountId,
							appId: app.id,
							data: appInstallInfo
						},
						success: function(data, status) {
							var storedApp = _.find(apps, { id: app.id });

							if (_.includes(apiResource, 'delete')) {
								_.forEach(['allowed_users', 'users'], _.partial(_.unset, storedApp));
							} else {
								_.assign(storedApp, _.pick(data.data, [
									'allowed_users',
									'users'
								]));
							}
							successCallback && successCallback();
						},
						error: function(_data, status) {
							errorCallback && errorCallback();
						}
					});
				},

				appStorePopUpButtonDisable = function(disabled) {
					parent.find('#appstore_popup_save').prop('disabled', disabled);
				},

				appStorePopUpDirtyCheck = function() {
					var allowedUsers = parent.find('.permissions-bloc input[name="permissions"]:checked').val(),
						selectedUsers = (allowedUsers === 'specific') ? (monster.ui.getFormData('app_popup_user_list_form').users || []) : app.users;

					selectedUsers = _.map(selectedUsers, function(id) { return { id: id }; });

					if (!_.isEqual(allowedUsers, app.allowed_users) || !_.isEqual(selectedUsers, app.users)) {
						appStorePopUpButtonDisable(false);
					} else {
						appStorePopUpButtonDisable(true);
					}
				};

			parent.find('#app_switch').on('change', function() {
				var appSwitch = $(this).is(':checked');

				if (appSwitch !== isActive) {
					appStorePopUpButtonDisable(false);
				} else {
					appStorePopUpButtonDisable(true);
				}

				if (appSwitch) {
					parent.find('.permissions-bloc').slideDown();
					appStorePopUpDirtyCheck();
				} else {
					parent.find('.permissions-bloc').slideUp();
				}
			});

			parent.find('.permissions-bloc input[name="permissions"]').on('change', function(e) {
				var allowedUsers = $(this).val();
				if (allowedUsers === 'specific') {
					parent.find('.permissions-link').show();
				} else {
					parent.find('.permissions-link').hide();
				}

				appStorePopUpDirtyCheck();
			});

			parent.find('#app_popup_select_users_link').on('click', function(e) {
				e.preventDefault();
				parent.find('.app-details-view').hide();
				parent.find('.user-list-view').show();
				parent.find('.search-query').focus();

				parent.find('.user-list').css('height', (parent.find('.user-list-buttons').position().top - (parent.find('.user-list-links').position().top + parent.find('.user-list-links').outerHeight())) + 'px');
			});

			userList.on('change', 'input', function(e) {
				parent.find('.selected-users-number').html(userList.find('input[type="checkbox"]:checked').length);
			});

			parent.find('.user-list-links a').on('click', function(e) {
				e.preventDefault();
				userList.find('input[type="checkbox"]').prop('checked', $(this).data('action') === 'check');

				parent.find('.selected-users-number').html(userList.find('input[type="checkbox"]:checked').length);
			});

			parent.find('.user-list-filter input.search-query').on('keyup', function(e) {
				var search = $(this).val().toLowerCase();
				if (search) {
					$.each(userList.find('.user-list-element'), function() {
						var $this = $(this);
						if ($this.data('name').toLowerCase().indexOf(search) >= 0) {
							$this.show();
						} else {
							$this.hide();
						}
					});
				} else {
					userList.find('.user-list-element').show();
				}
			});

			parent.find('#user_list_cancel').on('click', function(e) {
				e.preventDefault();
				$.each(userList.find('input'), function() {
					var $this = $(this);
					$this.prop('checked', $this.data('original') === 'check');
				});
				parent.find('.user-list-view').hide();
				parent.find('.app-details-view').show();
			});

			parent.find('#user_list_save').on('click', function(e) {
				e.preventDefault();
				var selectedUsers = monster.ui.getFormData('app_popup_user_list_form').users;
				if (selectedUsers) {
					$.each(userList.find('input'), function() {
						$(this).data('original', (this.checked ? 'check' : 'uncheck'));
					});

					parent
						.find('#app_popup_select_users_link')
							.html(self.getTemplate({
								name: '!' + self.i18n.active().selectUsersLink,
								data: {
									selectedUsers: selectedUsers.length
								}
							}));

					parent.find('.user-list-view').hide();
					parent.find('.app-details-view').show();
				} else {
					monster.ui.alert(self.i18n.active().alerts.noUserSelected);
				}

				appStorePopUpDirtyCheck();
			});

			parent.find('#appstore_popup_cancel').on('click', function() {
				parent.closest(':ui-dialog').dialog('close');
			});

			parent.find('#appstore_popup_save').on('click', function() {
				var $button = $(this),
					toObjectWithProp = function(prop) {
						return function(value) {
							return _.set({}, prop, value);
						};
					},
					isEnabled = parent.find('#app_switch').is(':checked'),
					allowedUsers = parent.find('.permissions-bloc input[name="permissions"]:checked').val(),
					isUsersSpecific = allowedUsers === 'specific',
					selectedUserIds = isUsersSpecific ? monster.ui.getFormData('app_popup_user_list_form').users : [],
					areNoSelectedUsers = isUsersSpecific && _.isEmpty(selectedUserIds);

				if (isEnabled && areNoSelectedUsers) {
					return monster.ui.alert(self.i18n.active().alerts.noUserSelected);
				}

				$button.prop('disabled', 'disabled');

				updateAppInstallInfo(isEnabled ? {
					allowed_users: allowedUsers,
					users: _.map(selectedUserIds, toObjectWithProp('id'))
				} : {}, function() {
					parent.closest(':ui-dialog').dialog('close');
					$('#appstore_container .app-element[data-id="' + app.id + '"]').toggleClass('installed', isEnabled);
					$('#appstore_container .app-filter.active').click();
				});
			});
		},

		showMarketplaceConnector: function(parent) {
			const self = this;
			const marketConfig = self.appstoreData.marketplace || {};
			const enabled = marketConfig.enabled;
			const is_linked = marketConfig.is_linked;

			if (enabled && is_linked) {
				self.renderMarketSettings(parent);
			} else if (marketConfig.enabled) {
				self.renderMarketLink(parent);
			} else {
				self.renderMarketWelcome(parent);
			}
		},

		renderMarketLink: function(parent) {
			const self = this;
			const marketConfig = self.appstoreData.marketplace;
			const template = $(self.getTemplate({
				name: 'marketClusterLink',
				data: {
					config: marketConfig
				}
			}));
			const linkForm = template.find('#cluster_link_form');

			parent
				.find('.right-container')
				.fadeOut(function() {
					$(this)
						.empty()
						.append(template)
						.fadeIn();
					monster.ui.validate(linkForm);
					self.bindMarketLinkEvents(parent, template);
				});
		},

		bindMarketLinkEvents: function(parent, template) {
			const self = this;
			const linkForm = template.find('#cluster_link_form');
			const maybeSetApiUrl = function() {
				if (!self.appstoreData.marketplace.api_url && monster.config.api.default) {
					self.updateMarketConnector({
						action: 'api_url',
						api_url: monster.config.api.default
					});
				}
			};

			parent.find('.market-link #save').on('click', function(e) {
				e.preventDefault();

				const saveThis = $(this);

				saveThis.prop({ disabled: true });

				if (monster.ui.valid(linkForm)) {
					const formData = monster.ui.getFormData('cluster_link_form');

					maybeSetApiUrl();
					self.updateMarketConnector(
						{
							action: 'link',
							access_code: formData.access_code,
							name: formData.cluster_name
						},
						function() {
							self.showMarketplaceConnector(
								parent
							);
						},
						function() {
							saveThis.prop({ 'disabled': false });
						});
				} else {
					saveThis.prop({ disabled: false });
				}
			});
		},

		renderMarketSettings: function(parent) {
			const self = this;
			const marketConfig = self.appstoreData.marketplace;
			const template = $(self.getTemplate({
				name: 'marketConnectorSettings',
				data: {
					config: marketConfig
				}
			}));
			const linkForm = template.find('#cluster_link_form');

			parent
				.find('.right-container')
				.fadeOut(function() {
					$(this)
						.empty()
						.append(template)
						.fadeIn();

					monster.ui.validate(linkForm);
					self.bindMarketSettingsEvents(parent, template);
				});
		},

		bindMarketSettingsEvents: function(parent, template) {
			const self = this;
			const configForm = template.find('#configuration_form');

			const marketAction = function(payload, varName, formThis) {
				self.updateMarketConnector(
					payload,
					function() {
						monster.ui.toast({
							type: 'success',
							message: self.getTemplate({
								name: '!' + self.i18n.active().marketplace.edition.successUpdate,
								data: {
									variable: varName
								}
							})
						});
						self.showMarketplaceConnector(
							parent
						);
					},
					function() {
						formThis.prop({ 'disabled': false });
					});
			};

			$('.market-settings #save').on('click', function(e) {
				e.preventDefault();
				const saveThis = $(this);
				saveThis.prop({ disabled: true });

				if (monster.ui.valid(configForm)) {
					const formData = monster.ui.getFormData('configuration_form');
					marketAction({ action: 'api_url', api_url: formData.api_url }, 'api_url', saveThis);
				} else {
					saveThis.prop({ disabled: false });
				}
			});

			$('.market-settings #disable').on('click', function(e) {
				e.preventDefault();
				const saveThis = $(this);

				self.confirmDisableDialog(function() {
					saveThis.prop({ disabled: true });
					marketAction({ action: 'disable' }, 'enabled', saveThis);
				});
			});

			$('.market-settings #disconnect').on('click', function(e) {
				e.preventDefault();
				const saveThis = $(this);

				self.confirmDisconnectDialog(function() {
					saveThis.prop({ disabled: true });
					marketAction({ action: 'unlink' }, 'unlink', saveThis);
				});
			});
		},

		confirmDisableDialog: function(callbackSuccess) {
			const self = this;
			const content = self.i18n.active().marketplace.dangerDisableDialog.content;
			monster.ui.confirm(
				content,
				function() {
					callbackSuccess && callbackSuccess();
				}
			);
		},

		confirmDisconnectDialog: function(callbackSuccess) {
			const self = this;
			const actionKey = self.i18n.active().marketplace.dangerDisconnectDialog.actionKey;
			const confirmPopup = monster.ui.confirm(
				$(self.getTemplate({
					name: 'dangerConfirmDialog',
					data: {
						clusterId: self.appstoreData.marketplace.cluster_id
					}
				})),
				function() {
					callbackSuccess && callbackSuccess();
				},
				null,
				{
					title: self.i18n.active().marketplace.dangerDisconnectDialog.title,
					confirmButtonText: self.i18n.active().marketplace.dangerDisconnectDialog.actionBtn,
					htmlContent: true
				}
			);

			confirmPopup.find('#confirm_button').prop('disabled', true);

			confirmPopup.find('#action_input').on('keyup', function() {
				if ($(this).val() === actionKey) {
					confirmPopup.find('#confirm_button').prop('disabled', false);
				} else {
					confirmPopup.find('#confirm_button').prop('disabled', true);
				}
			});
		},

		renderMarketWelcome: function(parent, appstoreData) {
			const self = this;
			const template = $(self.getTemplate({
				name: 'marketWelcome'
			}));

			parent
				.find('.right-container')
				.fadeOut(function() {
					$(this)
						.empty()
						.append(template)
						.fadeIn();
					self.bindMarketWelcomeEvents(parent);
				});
		},

		bindMarketWelcomeEvents: function(parent) {
			const self = this;
			const maybeSetApiUrl = function() {
				if (!self.appstoreData.marketplace.api_url && monster.config.api.default) {
					self.updateMarketConnector({
						action: 'api_url',
						api_url: monster.config.api.default
					});
				}
			};

			parent.find('#market_enable_connector_btn').on('click', function(e) {
				e.preventDefault();

				maybeSetApiUrl();
				self.updateMarketConnector(
					{ action: 'enable' },
					function() {
						self.showMarketplaceConnector(
							parent
						);
					});
			});
		},

		updateMarketConnector: function(payload, onSuccess, onError) {
			const self = this;

			// use this to test ui without calling API
			//
			// if (payload.action === 'enable') {
			// 	self.appstoreData.marketplace.enabled = true;
			// } else if (payload.action === 'disable') {
			// 	self.appstoreData.marketplace.enabled = false;
			// } else if (payload.action === 'link') {
			// 	self.appstoreData.marketplace.is_linked = true;
			// } else if (payload.action === 'unlink') {
			// 	self.appstoreData.marketplace.is_linked = false;
			// } else if (payload.action === 'api_url') {
			// 	self.appstoreData.marketplace.api_url = payload.api_url;
			// } else if (payload.action === 'revoke_token') {
			// 	self.appstoreData.marketplace.is_linked = false;
			// }
			// onSuccess && onSuccess();

			monster.request({
				resource: 'marketplace.action',
				data: {
					data: payload
				},
				success: function(response) {
					if (response && response.data) {
						self.appstoreData.marketplace = response.data;
						onSuccess && onSuccess();
					} else {
						onError();
					}
				},
				error: function() {
					onError && onError();
				}
			});
		}
	};

	return app;
});
