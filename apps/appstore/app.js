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
			'fr-FR': { customCss: false }
		},

		requests: {
			'appstore.list': {
				url: 'apps_store',
				verb: 'GET'
			},
			'appstore.get': {
				url: 'apps_store/{appId}',
				verb: 'GET'
			},
			'appstore.account.get': {
				url: 'accounts/{accountId}',
				verb: 'GET'
			},
			'appstore.account.update': {
				url: 'accounts/{accountId}',
				verb: 'POST'
			},
			'appstore.users.list': {
				url: 'accounts/{accountId}/users',
				verb: 'GET'
			}
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

			parent.find('.app-filter').on('click', function(e) {
				var $this = $(this),
					filter = $this.data('filter');

				parent.find('.app-filter').removeClass('active');
				$this.addClass('active');

				parent.find('.app-list').isotope({
					filter: '.app-element' + (filter ? '.'+filter : '')
				});

				searchInput.val('');
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
						monster.request({
							resource: 'appstore.list',
							data: {
								accountId: self.accountId,
							},
							success: function(data, status) {
								callback(null, data.data);
							}
						});
					},
					account: function(callback) {
						monster.request({
							resource: 'appstore.account.get',
							data: {
								accountId: self.accountId
							},
							success: function(data, status) {
								callback(null, data.data);
							}
						});
					},
					users: function(callback) {
						monster.request({
							resource: 'appstore.users.list',
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
					var installedAppIds = _.map(monster.apps['auth'].installedApps, function(val) {
							return val.id;
						}),
						getIcon = function(appId, iconCallback) {
							var request = new XMLHttpRequest(),
								url = self.apiUrl + 'apps_store/' + appId + '/icon?auth_token=' + self.authToken;
								
							request.open('GET', url, true);
							request.onreadystatechange = function() {
								if(request.readyState === 4) {
									if(request.status === 200) {
										iconCallback && iconCallback(url);
									} else {
										iconCallback && iconCallback(null);
									}
								}
							};
							request.send();
						},
						parallelIconRequests = [];

					if(!("apps" in results.account)) {
						results.account.apps = {};
					}
					results.apps = _.filter(results.apps, function(val, key) {
						if(installedAppIds.indexOf(val.id) >= 0) {
							if(val.id in results.account.apps) {
								/* Temporary code to allow retro-compatibility with old app structure (changed in v3.07) */
								if('all' in results.account.apps[val.id]) {
									results.account.apps[val.id].allowed_users = results.account.apps[val.id].all ? 'all' : 'specific';
									delete results.account.apps[val.id].all;
								}
								/*****************************************************************************************/
								if(results.account.apps[val.id].allowed_users !== 'specific' || results.account.apps[val.id].users.length > 0) {
									val.tags ? val.tags.push("installed") : val.tags = ["installed"];
								}
							}
							var i18n = val.i18n[monster.config.whitelabel.language] || val.i18n['en-US'];

							val.label = i18n.label;
							val.description = i18n.description;
							parallelIconRequests.push(function(parallelCallback) {
								getIcon(val.id, function(iconUrl) { parallelCallback(null, iconUrl); });
							});
							delete val.i18n;
							return true;
						} else {
							return false;
						}
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
				appList = appstoreData.apps
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
				userList = appstoreData.users,
				account = appstoreData.account;

			monster.request({
				resource: 'appstore.get',
				data: {
					accountId: self.accountId,
					appId: appId
				},
				success: function(data, status) {
					dataI18n = data.data.i18n[monster.config.whitelabel.language] || data.data.i18n['en-US'];

					var app = $.extend(true, data.data, {
							extra: {
								label: dataI18n.label,
								description: dataI18n.description,
								extendedDescription: dataI18n.extended_description,
								features: dataI18n.features,
								icon: _.find(appstoreData.apps, function(app) { return app.id === data.data.id }).icon,
								screenshots: $.map(data.data.screenshots, function(val, key) {
									return self.apiUrl + "apps_store/" + data.data.id + "/screenshot/" + key + "?auth_token=" + self.authToken
								})
							}
						}),
						selectedUsersLength = appId in account.apps ? account.apps[appId].users.length : 0,
						selectedUsersList = appId in account.apps ? $.extend(true, [], account.apps[appId].users) : [],
						users = $.map($.extend(true, [], userList), function(val, key) {
							if(selectedUsersList.length) {
								for(var i=0; i<selectedUsersList.length; i++) {
									if(selectedUsersList[i].id === val.id) {
										val.selected = true;
										selectedUsersList.slice(i, 1);
										break;
									}
								}
							}
							return val;
						}),
						template = $(monster.template(self, 'appPopup', {
							app: app,
							users: users,
						 	i18n: {
								selectedUsers: selectedUsersLength,
							  	totalUsers: users.length
						  	}
						})),
						leftContainer = template.find('.left-container'),
						rightContainer = template.find('.right-container'),
						userListContainer = rightContainer.find('.user-list'),
						appSwitch = rightContainer.find('.switch');

					appSwitch.bootstrapSwitch();

					if(!("apps" in account) || !(appId in account.apps) || (account.apps[appId].allowed_users === 'specific' && account.apps[appId].users.length === 0)) {
						appSwitch.bootstrapSwitch('setState', false);
						rightContainer.find('.permissions-bloc').hide();
					} else if(account.apps[appId].allowed_users === 'admins') {
						rightContainer.find('#app_popup_admin_only_radiobtn').prop('checked', true);
					} else if(account.apps[appId].users.length > 0) {
						rightContainer.find('#app_popup_specific_users_radiobtn').prop('checked', true);
						rightContainer.find('.permissions-link').show();
						rightContainer.find('#app_popup_select_users_link').html(
							monster.template(self, '!'+self.i18n.active().selectUsersLink, { selectedUsers: selectedUsersLength })
						);
					}

					self.bindPopupEvents(template, app, appstoreData);

					rightContainer.find('.selected-users-number').html(selectedUsersLength);
					rightContainer.find('.total-users-number').html(users.length);

					monster.ui.prettyCheck.create(userListContainer);
					monster.ui.dialog(template, {title: app.extra.label});

					// userListContainer.niceScroll({
					// 	cursorcolor:"#333",
					// 	cursoropacitymin:0.5,
					// 	hidecursordelay:1000
					// });

					// if(leftContainer.height() > rightContainer.height()) {
					// 	rightContainer.height(leftContainer.height());
					// } else {
					// 	leftContainer.height(rightContainer.height());
					// }
					// userListContainer.css('maxHeight', rightContainer.height()-182);

					template.find('#screenshot_carousel').carousel();
				}
			});
		},

		bindPopupEvents: function(parent, app, appstoreData) {
			var self = this,
				userList = parent.find('.user-list'),
				selectedUsersCount = app.id in appstoreData.account.apps ? appstoreData.account.apps[app.id].users.length : 0,
				updateAppInstallInfo = function(appInstallInfo, successCallback, errorCallback) {
					var icon = parent.find('.toggle-button-bloc i'),
						errorFunction = function() {
							icon.stop(true, true)
								.show()
								.removeClass('icon-spin icon-spinner')
								.addClass('icon-remove icon-red')
								.fadeOut(3000);
							errorCallback && errorCallback();
						};

					icon.stop(true, true)
						.removeClass('icon-remove icon-red icon-ok icon-green')
						.addClass('icon-spinner icon-spin')
						.show();

					monster.request({
						resource: 'appstore.account.get',
						data: {
							accountId: appstoreData.account.id
						},
						success: function(data, status) {
							appstoreData.account = data.data;
							if(!("apps" in appstoreData.account) || _.isArray(appstoreData.account.apps)) {
								appstoreData.account.apps = {};
							}
							appstoreData.account.apps[app.id] = appInstallInfo;
							monster.request({
								resource: 'appstore.account.update',
								data: {
									accountId: appstoreData.account.id,
									data: appstoreData.account
								},
								success: function(_data, status) {
									appstoreData.account = _data.data;
									icon.stop(true, true)
										.show()
										.removeClass('icon-spin icon-spinner')
										.addClass('icon-ok icon-green')
										.fadeOut(3000);

									$('#apploader').remove();
									successCallback && successCallback();
								},
								error: function(_data, status) {
									errorFunction();
								}
							});
						},
						error: function(_data, status) {
							errorFunction();
						}
					});
				};

			parent.find('.toggle-button-bloc .switch').on('switch-change', function(e, data) {
				var $this = $(this),
					previousSettings = $.extend(true, {}, appstoreData.account.apps[app.id]),
					isInstalled = (app.id in appstoreData.account.apps && (previousSettings.allowed_users !== 'specific' || previousSettings.users.length > 0));
				if(data.value != isInstalled) {
					if(data.value) {
						updateAppInstallInfo(
							{
								allowed_users: 'all',
								users: []
							},
							function() {
								parent.find('.permissions-bloc').slideDown();
								$('#appstore_container .app-element[data-id="'+app.id+'"]').addClass('installed');
								$('#appstore_container .app-filter.active').click();
							},
							function() {
								appstoreData.account.apps[app.id] = previousSettings;
								$this.bootstrapSwitch('setState', false);
							}
						);
					} else {
						updateAppInstallInfo(
							{
								allowed_users: 'specific',
								users: []
							},
							function() {
								parent.find('.permissions-bloc').slideUp();
								$('#appstore_container .app-element[data-id="'+app.id+'"]').removeClass('installed');
								$('#appstore_container .app-filter.active').click();
							},
							function() {
								appstoreData.account.apps[app.id] = previousSettings;
								$this.bootstrapSwitch('setState', true);
							}
						);
					}
				}
			});

			parent.find('.permissions-bloc input[name="permissions"]').on('change', function(e) {
				var allowedUsers = $(this).val();
				if(allowedUsers === 'specific') {
					parent.find('.permissions-link').show();
				} else {
					var previousSettings = $.extend(true, {}, appstoreData.account.apps[app.id]);
					updateAppInstallInfo(
						{
							allowed_users: allowedUsers,
							users: []
						},
						function() {
							parent.find('.permissions-link').hide();
						},
						function() {
							appstoreData.account.apps[app.id] = previousSettings;
							parent.find('#app_popup_specific_users_radiobtn').prop('checked', true);
						}
					);
				}
			});

			parent.find('#app_popup_select_users_link').on('click', function(e) {
				e.preventDefault();
				parent.find('.app-details-view').hide();
				parent.find('.user-list-view').show();

				parent.find('.user-list').css('height',(parent.find('.user-list-buttons').position().top - (parent.find('.user-list-links').position().top + parent.find('.user-list-links').outerHeight()))+'px');
				// userList.getNiceScroll()[0].resize();
			});

			userList.on('ifToggled', 'input', function(e) {
				if(this.checked) {
					selectedUsersCount++;
				} else {
					selectedUsersCount--;
				}
				parent.find('.selected-users-number').html(selectedUsersCount);
			});

			parent.find('.user-list-links a').on('click', function(e) {
				e.preventDefault();
				monster.ui.prettyCheck.action(userList, $(this).data('action'));
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
					monster.ui.prettyCheck.action($this, $this.data('original'));
				});
				parent.find('.user-list-view').hide();
				parent.find('.app-details-view').show();
				// userList.getNiceScroll()[0].resize();
			});

			parent.find('#user_list_save').on('click', function(e) {
				e.preventDefault();
				var selectedUsers = form2object('app_popup_user_list_form').users;
				if(selectedUsers) {
					var appInstallInfo = {
						allowed_users: 'specific',
						users: $.map(selectedUsers, function(val) {
							return { id: val };
						})
					};

					$.each(userList.find('input'), function() {
						$(this).data('original', (this.checked ? 'check' : 'uncheck'));
					});

					parent.find('#app_popup_select_users_link').html(
						monster.template(self, '!'+self.i18n.active().selectUsersLink, { selectedUsers: appInstallInfo.users.length })
					);

					parent.find('.user-list-view').hide();
					parent.find('.app-details-view').show();
					// userList.getNiceScroll()[0].resize();

					updateAppInstallInfo(appInstallInfo);
				} else {
					monster.ui.alert(self.i18n.active().alerts.noUserSelected)
				}
			});
		}

	};

	return app;
});
