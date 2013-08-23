define(function(require){
	var $ = require('jquery'),
		_ = require('underscore'),
		monster = require('monster'),
		toastr = require('toastr'),
		isotope = require('isotope');

	var app = {

		name: "appstore",

		i18n: [ 'en-US' ],

		requests: {
			'appstore.list': {
				url: 'accounts/{accountId}/apps_store',
				verb: 'GET'
			},
			'appstore.get': {
				url: 'accounts/{accountId}/apps_store/{appId}',
				verb: 'GET'
			},
			'appstore.update': {
				url: 'accounts/{accountId}/apps_store/{appId}',
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
				parent = container || $('#ws-content');

			self.loadData(function(apps, users) {
				self.renderApps(template, apps);
				self.bindEvents(template, apps, users);
			});

			parent.empty()
				  .append(template);
		},

		bindEvents: function(parent, appList, userList) {
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
				self.showAppPopup($(this).data('id'), userList);
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
					var apps = results.apps,
						users = results.users;

					_.each(apps, function(val, key) {
						if(val.installed) {
							val.tags ? val.tags.push("installed") : val.tags = ["installed"];
						}
						val.label = val.i18n['en-US'].label;
						val.description = val.i18n['en-US'].description;
						delete val.i18n;
					});

					callback(apps, users);
				}
			);
		},

		renderApps: function(parent, appList) {
			var self = this,
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

		showAppPopup: function(appId, userList) {
			var self = this;

			monster.request({
				resource: 'appstore.get',
				data: {
					accountId: self.accountId,
					appId: appId
				},
				success: function(data, status) {
					var app = $.extend(true, data.data, {
							label: data.data.i18n['en-US'].label,
							description: data.data.i18n['en-US'].description,
						}),
						selectedUsersList = $.extend(true, [], app.installed.users),
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
								selectedUsers: app.installed.users.length,
							  	totalUsers: users.length
						  	}
						})),
						leftContainer = template.find('.left-container'),
						rightContainer = template.find('.right-container'),
						userListContainer = rightContainer.find('.user-list'),
						appSwitch = rightContainer.find('.switch');

					appSwitch.bootstrapSwitch();

					if(app.installed.users.length > 0) {
						rightContainer.find('#app_popup_specific_users_radiobtn').prop('checked', true);
						rightContainer.find('.permissions-link').show();
						rightContainer.find('#app_popup_select_users_link').html(
							monster.template(self, '!'+self.i18n.active().selectUsersLink, { selectedUsers: app.installed.users.length })
						);
					} else if(!app.installed.all) {
						appSwitch.bootstrapSwitch('setState', false);
						rightContainer.find('.permissions-bloc').hide();
					}

					self.bindPopupEvents(template, app);

					rightContainer.find('.selected-users-number').html(app.installed.users.length);
					rightContainer.find('.total-users-number').html(users.length);

					monster.ui.prettyCheck.create(userListContainer);
					monster.ui.contentDialog(template, app.label);

					if(leftContainer.height() > rightContainer.height()) {
						rightContainer.height(leftContainer.height());
					} else {
						leftContainer.height(rightContainer.height());
					}
					userListContainer.css('maxHeight', rightContainer.height()-182);

				}
			});
		},

		bindPopupEvents: function(parent, app) {
			var self = this,
				userList = parent.find('.user-list'),
				selectedUsersCount = app.installed.users.length,
				updateApp = function(app, successCallback, errorCallback) {
					var icon = parent.find('.toggle-button-bloc i');
					
					icon.show()
						.addClass('icon-spin');
					
					delete app.label;
					delete app.description;
					monster.request({
						resource: 'appstore.update',
						data: {
							accountId: self.accountId,
							appId: app.id,
							data: app
						},
						success: function(_data, status) {
							var updateCookie = function() {
								var cookieData = $.parseJSON($.cookie('monster-auth'));
								cookieData.installedApps = monster.apps['auth'].installedApps;
								$.cookie('monster-auth', JSON.stringify(cookieData, {expires: 30}));
							};

							icon.stop(true, true)
								.show()
								.removeClass('icon-spin icon-spinner')
								.addClass('icon-ok icon-green')
								.fadeOut(3000, function() {
									icon.removeClass('icon-ok icon-green')
										.addClass('icon-spinner');
								});

							if(_data.data.installed.all
							|| _data.data.installed.users.indexOf(self.userId) >= 0) {
								if(!monster.apps['auth'].installedApps[_data.data.id]) {
									monster.apps['auth'].installedApps[_data.data.id] = {
										name: _data.data.name,
										i18n: _data.data.i18n,
										icon: _data.data.icon
									};
									
									updateCookie();
									$('#apploader').remove();
								}
							} else if(_data.data.installed.users.length === 0) {
								if(monster.apps['auth'].installedApps[_data.data.id]) {
									delete monster.apps['auth'].installedApps[_data.data.id];

									updateCookie();
									$('#apploader').remove();
								}
							}

							successCallback && successCallback();
						},
						error: function(_data, status) {
							icon.stop(true, true)
								.show()
								.removeClass('icon-spin icon-spinner')
								.addClass('icon-remove icon-red')
								.fadeOut(3000, function() {
									icon.removeClass('icon-remove icon-red')
										.addClass('icon-spinner');
								});
							errorCallback && errorCallback();
						}
					});
				};

			parent.find('.toggle-button-bloc .switch').on('switch-change', function(e, data) {
				var $this = $(this),
					previousSettings = app.installed,
					isInstalled = (previousSettings.all || previousSettings.users.length > 0);
				if(data.value != isInstalled) {
					if(data.value) {
						app.installed = {
							all: true,
							users: []
						};
						updateApp(
							app, 
							function() {
								parent.find('.permissions-bloc').slideDown();
								$('#appstore_container .app-element[data-id="'+app.id+'"]').addClass('installed');
								$('#appstore_container .app-filter.active').click();
							}, 
							function() {
								app.installed = previousSettings;
								$this.bootstrapSwitch('setState', false);
							}
						);
					} else {
						app.installed = {
							all: false,
							users: []
						};
						updateApp(
							app, 
							function() {
								parent.find('.permissions-bloc').slideUp();
								$('#appstore_container .app-element[data-id="'+app.id+'"]').removeClass('installed');
								$('#appstore_container .app-filter.active').click();
							}, 
							function() {
								app.installed = previousSettings;
								$this.bootstrapSwitch('setState', true);
							}
						);
					}
				}
			});

			parent.find('.permissions-bloc input[name="permissions"]').on('change', function(e) {
				if($(this).val() === 'specific') {
					parent.find('.permissions-link').show();
				} else {
					var previousSettings = app.installed;
					app.installed = {
						all: true,
						users: []
					};
					updateApp(
						app, 
						function() {
							parent.find('.permissions-link').hide();
						}, 
						function() {
							app.installed = previousSettings;
							parent.find('#app_popup_specific_users_radiobtn').prop('checked', true);
						}
					);
				}
			});

			parent.find('#app_popup_select_users_link').on('click', function(e) {
				e.preventDefault();
				parent.find('.app-details-view').hide();
				parent.find('.user-list-view').show();
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
			});

			parent.find('#user_list_save').on('click', function(e) {
				e.preventDefault();
				var selectedUsers = form2object('app_popup_user_list_form').users;
				if(selectedUsers) {
					app.installed.all = false;
					app.installed.users = $.map(selectedUsers, function(val) {
						return { id: val };
					});

					$.each(userList.find('input'), function() {
						$(this).data('original', (this.checked ? 'check' : 'uncheck'));
					});

					parent.find('#app_popup_select_users_link').html(
						monster.template(self, '!'+self.i18n.active().selectUsersLink, { selectedUsers: app.installed.users.length })
					);

					parent.find('.user-list-view').hide();
					parent.find('.app-details-view').show();

					updateApp(app);
				} else {
					monster.ui.alert(self.i18n.active().alerts.noUserSelected)
				}
			});
		}

	};

	return app;
});
