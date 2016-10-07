define(function(require){
	var $ = require('jquery'),
		_ = require('underscore'),
		monster = require('monster'),
		toastr = require('toastr'),
		isotope = require('isotope');

	var app = {

		name: 'appstore',

		css: [ 'app' ],

		i18n: { 
			'en-US': { customCss: false },
			'fr-FR': { customCss: false },
			'ru-RU': { customCss: false }
		},

		requests: {
		},

		subscribe: {

		},

		load: function(callback) {
			var self = this;

			self.initApp(function() {
				callback && callback(self);
			});
		},

		initApp: function(callback) {
			var self = this;

			monster.pub('auth.initApp', {
				app: self,
				callback: callback
			});
		},

		render: function(container) {
			var self = this,
				template = $(monster.template(self, 'app')),
				parent = container || $('#monster-content');

			self.loadData(function(appstoreData) {
				self.renderApps(template, appstoreData);
				self.bindEvents(template, appstoreData);
			});

			parent.empty()
				  .append(template);
		},

		bindEvents: function(parent, appstoreData) {
			var self = this,
				searchInput = parent.find('.search-bar input.search-query');

			setTimeout(function () { searchInput.focus(); });

			parent.find('.app-filter').on('click', function(e) {
				var $this = $(this),
					filter = $this.data('filter');

				parent.find('.app-filter').removeClass('active');
				$this.addClass('active');

				parent.find('.app-list').isotope({
					filter: '.app-element' + (filter ? '.'+filter : '')
				});

				searchInput.val('').focus();;
			});

			parent.find('.app-list-container').on('click', '.app-element', function(e) {
				self.showAppPopup($(this).data('id'), appstoreData);
			});

			searchInput.on('keyup', function(e) {
				var value = $(this).val(),
					selectedFilter = parent.find('.app-filter.active').data('filter'),
					filter = '.app-element' + (selectedFilter ? '.'+selectedFilter : '');

				if(value) {
					filter += '[data-name*="'+value+'"]';
				}

				parent.find('.app-list').isotope({
					filter: '.app-element' + filter
				});
			});
		},

		loadData: function(callback) {
			var self = this;

			monster.parallel({
					apps: function(callback) {
						self.callApi({
							resource: 'appsStore.list',
							data: {
								accountId: self.accountId,
							},
							success: function(data, status) {
								callback(null, data.data);
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
								callback(null, data.data);
							}
						});
					},
					users: function(callback) {
						self.callApi({
							resource: 'user.list',
							data: {
								accountId: self.accountId
							},
							success: function(data, status) {
								callback(null, data.data);
							}
						});
					}
				},
				function(err, results) {
					var parallelIconRequests = [];

					results.apps.forEach(function(val, idx) {
						if((val.hasOwnProperty('allowed_users') && val.allowed_users !== 'specific') || (val.hasOwnProperty('users') && val.users.length > 0)) {
							val.tags ? val.tags.push("installed") : val.tags = ["installed"];
						}
						var i18n = val.i18n[monster.config.whitelabel.language] || val.i18n['en-US'];

						val.label = i18n.label;
						val.description = i18n.description;
						monster.ui.formatIconApp(val);
						parallelIconRequests.push(function(parallelCallback) {
							parallelCallback(null, monster.util.getAppIconPath(val));
						});
						delete val.i18n;
					});

					monster.parallel(parallelIconRequests, function(iconsErr, iconsResults) {
						_.each(results.apps, function(app, index) {
							app.icon = iconsResults[index];
						});
						callback(results);
					});
				}
			);
		},

		renderApps: function(parent, appstoreData) {
			var self = this,
				appList = appstoreData.apps,
				template = $(monster.template(self, 'appList', {
				apps: appList
			}));

			parent.find('.app-list-container')
				  .empty()
				  .append(template);

			parent.find('.app-list').isotope({
				getSortData : {
					name : function ( $elem ) {
						return $elem.find('.app-title').text();
					}
				},
				sortBy : 'name'
			});
		},

		showAppPopup: function(appId, appstoreData) {
			var self = this,
				userList = $.extend(true, [], appstoreData.users);

			self.callApi({
				resource: 'appsStore.get',
				data: {
					accountId: self.accountId,
					appId: appId
				},
				success: function(data, status) {
					var appData = monster.ui.formatIconApp(data.data),
						dataI18n = appData.i18n[monster.config.whitelabel.language] || appData.i18n['en-US'],
						app = $.extend(true, appData, {
							extra: {
								label: dataI18n.label,
								description: dataI18n.description,
								extendedDescription: dataI18n.extended_description,
								features: dataI18n.features,
								icon: _.find(appstoreData.apps, function(app) { return app.id === appData.id }).icon,
								screenshots: _.map(appData.screenshots || [], function(val, key) {
									return self.apiUrl + "apps_store/" + appData.id + "/screenshot/" + key + "?auth_token=" + self.getAuthToken()
								})
							}
						}),
						selectedUsersLength = app.users ? app.users.length : 0,
						selectedUsersList = _.map(app.users || [], function(val) {
							return val.id;
						}),
						users = _.map(userList, function(val, key) {
							if(selectedUsersList.indexOf(val.id) >= 0) {
								val.selected = true;
							}
							return val;
						}),
						template = $(monster.template(self, 'appPopup', {
							isWhitelabeling: monster.util.isWhitelabeling(),
							app: app,
							users: users,
							i18n: {
								selectedUsers: selectedUsersLength,
								totalUsers: users.length
							}
						})),
						leftContainer = template.find('.left-container'),
						rightContainer = template.find('.right-container'),
						userListContainer = rightContainer.find('.user-list');

					if(!app.hasOwnProperty('allowed_users') || (app.allowed_users === 'specific' && (app.users||[]).length === 0)) {
						rightContainer.find('#app_switch').prop('checked', false);
						rightContainer.find('.permissions-bloc').hide();
					} else if(app.allowed_users === 'admins') {
						rightContainer.find('#app_popup_admin_only_radiobtn').prop('checked', true);
					} else if(app.users && app.users.length > 0) {
						rightContainer.find('#app_popup_specific_users_radiobtn').prop('checked', true);
						rightContainer.find('.permissions-link').show();
						rightContainer.find('#app_popup_select_users_link').html(
							monster.template(self, '!'+self.i18n.active().selectUsersLink, { selectedUsers: selectedUsersLength })
						);
					}

					self.bindPopupEvents(template, app, appstoreData);

					rightContainer.find('.selected-users-number').html(selectedUsersLength);
					rightContainer.find('.total-users-number').html(users.length);

					monster.ui.dialog(template, {title: app.extra.label});

					template.find('#screenshot_carousel').carousel();
				}
			});
		},

		bindPopupEvents: function(parent, app, appstoreData) {
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
						success: function(_data, status) {
							$('#apploader').remove();
							successCallback && successCallback();
						},
						error: function(_data, status) {
							errorCallback && errorCallback();
						}
					});
				};

			parent.find('#app_switch').on('change', function() {
				if($(this).is(':checked')) {
					parent.find('.permissions-bloc').slideDown();
				} else {
					parent.find('.permissions-bloc').slideUp();
				}
			});

			parent.find('.permissions-bloc input[name="permissions"]').on('change', function(e) {
				var allowedUsers = $(this).val();
				if(allowedUsers === 'specific') {
					parent.find('.permissions-link').show();
				} else {
					parent.find('.permissions-link').hide();
				}
			});

			parent.find('#app_popup_select_users_link').on('click', function(e) {
				e.preventDefault();
				parent.find('.app-details-view').hide();
				parent.find('.user-list-view').show();
				parent.find('.search-query').focus();

				parent.find('.user-list').css('height',(parent.find('.user-list-buttons').position().top - (parent.find('.user-list-links').position().top + parent.find('.user-list-links').outerHeight()))+'px');
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
				if(search) {
					$.each(userList.find('.user-list-element'), function() {
						var $this = $(this);
						if($this.data('name').toLowerCase().indexOf(search) >= 0) {
							$this.show();
						} else {
							$this.hide();
						}
					})
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
				if(selectedUsers) {
					$.each(userList.find('input'), function() {
						$(this).data('original', (this.checked ? 'check' : 'uncheck'));
					});

					parent.find('#app_popup_select_users_link').html(
						monster.template(self, '!'+self.i18n.active().selectUsersLink, { selectedUsers: selectedUsers.length })
					);

					parent.find('.user-list-view').hide();
					parent.find('.app-details-view').show();
				} else {
					monster.ui.alert(self.i18n.active().alerts.noUserSelected);
				}
			});

			parent.find('#appstore_popup_cancel').on('click', function() {
				parent.closest(':ui-dialog').dialog('close');
			});

			parent.find('#appstore_popup_save').on('click', function() {
				if(parent.find('#app_switch').is(':checked')) {
					var allowedUsers = parent.find('.permissions-bloc input[name="permissions"]:checked').val(),
						selectedUsers = monster.ui.getFormData('app_popup_user_list_form').users || [];

					if(allowedUsers === 'specific' && selectedUsers.length === 0) {
						monster.ui.alert(self.i18n.active().alerts.noUserSelected);
					} else {
						updateAppInstallInfo({
							allowed_users: allowedUsers,
							users: allowedUsers === 'specific' ? $.map(selectedUsers, function(val) {
								return { id: val };
							}) : []
						},
						function() {
							var lang = monster.config.whitelabel.language,
								isoFormattedLang = lang.substr(0, 3).concat(lang.substr(lang.length -2, 2).toUpperCase()),
								currentLang = app.i18n.hasOwnProperty(isoFormattedLang) ? isoFormattedLang : 'en-US',
								appData = {
									api_url: app.api_url,
									icon: monster.util.getAppIconPath(app),
									id: app.id,
									label: app.i18n[currentLang].label,
									name: app.name
								};

							// Add source_url only if it defined 
							if(app.hasOwnProperty('source_url')) {
								appData.source_url = app.source_url;
							}

							// Only update variable if we're not masquerading and app isn't in installed apps yet.
							if(!monster.util.isMasquerading() && !_.find(monster.apps.auth.installedApps, function(val) { return val.id === app.id })) {
								// Update local installedApps list by adding the new app
								monster.apps.auth.installedApps.push(appData);
							}
							
							$('#appstore_container .app-element[data-id="'+app.id+'"]').addClass('installed');
							$('#appstore_container .app-filter.active').click();

							parent.closest(':ui-dialog').dialog('close');
						});
					}
				} else {
					updateAppInstallInfo({},
					function() {
						// Only update variable if we're not masquerading. Otherwise it would uninstall apps for the main account as well!
						if(!monster.util.isMasquerading()) {
							// Remove app from local installedApp list
							monster.apps.auth.installedApps = monster.apps.auth.installedApps.filter(function(val, idx) { return val.id !== app.id; });
						}

						$('#appstore_container .app-element[data-id="'+app.id+'"]').removeClass('installed');
						$('#appstore_container .app-filter.active').click();

						parent.closest(':ui-dialog').dialog('close');
					});
				}
			});
		}

	};

	return app;
});
