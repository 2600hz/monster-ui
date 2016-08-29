define(function(require){
	var $ = require('jquery'),
		_ = require('underscore'),
		monster = require('monster'),
		toastr = require('toastr');

	var app = {
		name: 'apploader',

		isMasqueradable: false,

		css: [ 'app' ],

		i18n: { 
			'en-US': { customCss: false },
			'fr-FR': { customCss: false },
			'ru-RU': { customCss: false }
		},

		requests: {
		},

		subscribe: {
			'apploader.show': 'render',
			'apploader.hide': '_hide',
			'apploader.toggle': '_toggle',
			'apploader.current': '_currentApp'
		},

		load: function(callback){
			var self = this;

			self.initApp(function() {
				callback && callback(self);
			});
		},

		initApp: function(callback) {
			var self = this;

			self.isMasqueradable = false;

			monster.pub('auth.initApp', {
				app: self,
				callback: callback
			});
		},

		_render: function() {
			var self = this;
		},

		isRendered: function() {
			return $('#apploader').length !== 0;
		},

		render: function() {
			var self = this;

			if(!self.isRendered()) {
				self.getUserApps(function(appList) {
					var template = $(monster.template(self, 'app', {
							allowAppstore: monster.apps.auth.currentUser.priv_level === "admin",
							defaultApp: monster.ui.formatIconApp(appList[0]),
							apps: appList
						}));

					$('.core-absolute').append(template);

					self.bindEvents(template, appList);
					self.show();
				});
			} else {
				self.show();
			}
		},

		bindEvents: function(parent, appList) {
			var self = this,
				defaultDiv = parent.find('.app-default'),
				updateAppInfo = function updateAppInfo(id) {
					var app = appList.filter(function(v, i) { return id === v.id })[0];
					parent.find('.app-description')
						.find('h4')
							.text(app.label)
						.addBack().find('p')
							.text(app.description);
				};

			setTimeout(function() { parent.find('.search-query').focus(); });

			parent.find('.app-container').sortable({
				cancel: '.ui-sortable-disabled',
				receive: function(event, ui) {
					var item = $(ui.item),
						itemId = item.data('id');

					item.addClass('ui-sortable-disabled');

					$.each(parent.find('.left-div .app-element'), function(idx, el) {

						if ($(el).data('id') !== itemId) {
							$(el).remove();
						}
					});

					updateAppInfo(itemId);

					$(ui.sender).data('copied', true);
				},
				over: function() {
					parent.find('.left-div .app-element.ui-sortable-disabled')
						.hide();
				},
				out: function() {
					parent.find('.left-div .app-element.ui-sortable-disabled')
						.show();
				}
			});

			parent.find('.app-list').sortable({
				delay: 100,
				appendTo: parent.find('.app-container'),
				connectWith: '.app-container',
				sort: function() {
					parent.find('.app-container')
						.addClass('dragging');
				},
				helper: function (event, ui) {
					this.copyHelper = ui.clone().css('opacity', '0.2').insertAfter(ui);

					$(this).data('copied', false);

					return ui.clone();
				},
				stop: function () {
					var copied = $(this).data('copied');

					$(this.copyHelper).css('opacity', '1');

					if (!copied) {
						this.copyHelper.remove();
					}

					this.copyHelper = null;


					parent.find('.app-container')
						.removeClass('dragging');
				},
				over: function(event, ui) {
					parent.find('.right-div .ui-sortable-placeholder')
						.hide();
				}
			});

			parent.find('.search-query').on('keyup', function(e) {
				var searchString = $(this).val().toLowerCase(),
				items = parent.find('.right-div .app-element');

				_.each(items, function(item) {
					var $item = $(item);

					$item.data('search').toLowerCase().indexOf(searchString) < 0 ? $item.hide() : $item.show();
				});

				if(e.keyCode === 13 && parent.find('.right-div .app-element:visible').length === 1) {
					parent.find('.right-div .app-element:visible').trigger('click');
				}
			});

			parent.find('.search-query').on('blur', function() {
				$(this)
					.val('');

				parent.find('.right-div .app-element')
					.show();
			});

			parent.find('.right-div').on('mouseenter', '.app-element', function() {
				updateAppInfo($(this).data('id'));
			});

			parent.find('.right-div').on('mouseleave', '.app-element', function() {
				updateAppInfo(parent.find('.left-div .app-element').data('id'));
			});

			parent.on('click', '.right-div .app-element, #launch_appstore, .default-app .app-element', function() {
				var $this = $(this),
					appName = $this.data('name');

				if(appName) {
					if(appName === 'appstore' || !(monster.util.isMasquerading() && monster.appsStore[appName].masqueradable === false)) {
						monster.routing.goTo('apps/' + appName);

						parent.find('.right-div .app-element.active')
							  .removeClass('active');

						if (appName !== 'appstore') {
							$this.addClass('active');
						}

						self.appListUpdate(parent, appList, function(newAppList) {
							appList = newAppList;
						});
					}
					else {
						toastr.error(self.i18n.active().noMasqueradingError);
					}
				}
			});

			parent.find('#close_app').on('click', function() {
				self.appListUpdate(parent, appList, function(newAppList) {
					appList = newAppList;

					self._hide(parent);
				});
			});

			$(document).on('keydown', function(e) {
				if (parent.is(':visible') && e.keyCode === 27) {
					var target = $(e.target);

					if (target.hasClass('search-query') && target.val() !== '') {
						target.blur();
						target.focus();
					}
					else {
						self.appListUpdate(parent, appList, function(newAppList) {
							appList = newAppList;

							self._hide(parent);
						});
					}
				}
			});
		},

		show: function() {
			var self = this,
				apploader = $('#apploader');

			if (!apploader.hasClass('active')) {
				monster.pub('myaccount.hide');
				apploader
					.addClass('active')
					.fadeIn(250, function() {
						$('#monster-content').hide();
					});
			}
		},

		_hide: function() {
			var self =  this,
				apploader = $('#apploader');

			if (apploader.hasClass('active')) {
				$('#monster-content').show();

				apploader
					.removeClass('active')
					.fadeOut(250, function() {
						// Put the default app at the beginning of the list in the DOM
						if (defaultAppId !== apploader.find('.right-div .app-element').first().data('id')) {
							var defaultAppId = apploader.find('.left-div .app-element').data('id');

							apploader.find('.right-div .app-list')
								.prepend(apploader.find('.right-div .app-element[data-id="' + defaultAppId + '"]'));
						}
					});
			}
		},

		_toggle: function() {
			var self = this;

			if (self.isRendered()) {
				var apploader = $('#apploader');

				if (apploader.hasClass('active')) {
					self._hide(apploader);
				}
				else {
					self.show(apploader);

					apploader.find('.search-query').val('').focus();
				}
			}
			else {
				self.render();
			}
		},

		/**
		 * Gets the currently loaded app.
		 */
		_currentApp: function (callback) {
			var self = this,
				apploader = $('#apploader'),
				activeApp = apploader.find('.right-div .app-element.active'),
				app = {};

			if(activeApp.length) {
				//If apploader is loaded get data from document.
				app = {
					id: activeApp.data('id'),
					name: activeApp.data('name')
				}
				callback && callback(app);
			} else {
				//This returns the default app, so only works when the apploader hasn't been loaded yet.
				self.getUserApps(function (apps) {
					app = {
						id: apps[0].id,
						name: apps[0].name
					}

					callback && callback(app);
				});
			}
		},

		getUserApps: function(callback) {
			var self = this;

			self.callApi({
				resource: 'appsStore.list',
				data: {
					accountId: self.accountId
				},
				success: function(data, status) {
					var parallelRequest = {},
					lang = monster.config.whitelabel.language,
					isoFormattedLang = lang.substr(0, 3).concat(lang.substr(lang.length -2, 2).toUpperCase());

					_.each(data.data, function(val) {
						var currentLang = val.i18n.hasOwnProperty(isoFormattedLang) ? isoFormattedLang : 'en-US';
						val.description = val.i18n[currentLang].description;
						val.label = val.i18n[currentLang].label;
						parallelRequest[val.id] = function(parallelCallback) {
							//This API is only called to check whether the icon can be loaded, but is not used to load the actual icon
							/*self.callApi({
								resource: 'appsStore.getIcon',
								data: {
									accountId: self.accountId,
									appId: val.id,
									generateError: false
								},
								success: function(data, status) {*/
									val.icon = monster.util.getAppIconPath(val);

									parallelCallback && parallelCallback(null, val);
								/*},
								error: function(data, status) {
									val.icon = null;
									parallelCallback && parallelCallback(null, val);
								}
							});*/
						}
					});

					monster.parallel(parallelRequest, function(err, results) {
						var allApps = results, // List of apps available on the account, with list of enabled user
							currentUser = monster.apps.auth.currentUser,
							userApps = currentUser.appList || [], // List of apps on the user, used for ordering and default app only
							updateUserApps = false,
							appList = [], // List of apps available for this user, to be return
							isAppInstalled = function(app) {
								if(app) {
									var appUsers = _.map(app.users||[], function(val) { return val.id });
									if (app &&
										app.allowed_users && 
										(
											(app.allowed_users === 'all') ||
											(app.allowed_users === 'admins' && currentUser.priv_level === 'admin') ||
											(app.allowed_users === 'specific' && appUsers.indexOf(currentUser.id) >= 0)
										)) {
										return true;
									}
								}
								return false;
							};

						userApps = _.filter(userApps, function(appId) {
							var app = allApps[appId];
							if(isAppInstalled(app)) {
								var formattedApp = {
									id: app.id,
									name: app.name,
									icon: app.icon,
									label: app.label,
									description: app.description
								};

								monster.ui.formatIconApp(formattedApp);
								appList.push(formattedApp);
								return true;
							} else {
								updateUserApps = true;
								return false;
							}
						});

						_.each(allApps, function(app) {
							if(userApps.indexOf(app.id) === -1 && isAppInstalled(app)) {
								var formattedApp = {
									id: app.id,
									name: app.name,
									icon: app.icon,
									label: app.label,
									description: app.description
								};

								monster.ui.formatIconApp(formattedApp);
								appList.push(formattedApp);

								userApps.push(app.id);
								updateUserApps = true;
							}
						});

						if(updateUserApps) {
							monster.apps.auth.currentUser.appList = userApps;
							self.userUpdate();
						}

						callback && callback(appList);
					});
				}
			});
		},

		appListUpdate: function(parent, appList, callback) {
			var self = this,
				domAppList = $.map(parent.find('.right-div .app-element'), function(val) { return $(val).data('id'); }),
				sameOrder = appList.every(function(v, i) { return v.id === domAppList[i] }),
				domDefaultAppId = parent.find('.left-div .app-element').data('id'),
				// If the user doesn't have any app in its list, we verify that the default app is still unset
				sameDefaultApp = appList.length ? appList[0].id === domDefaultAppId : (domDefaultAppId === undefined);

			// If new user with nothing configured, sameDefault App && sameOrder should be true
			if (sameDefaultApp && sameOrder) {
				callback(appList);
			}
			else {
				var newAppList = [];

				domAppList.unshift(domAppList.splice(domAppList.indexOf(domDefaultAppId), 1)[0]);

				appList.forEach(function(v, i) {
					newAppList[domAppList.indexOf(v.id)] = v;
				});

				monster.apps.auth.currentUser.appList = domAppList;
				monster.apps.auth.defaultApp = newAppList[0].name;

				self.userUpdate(callback(newAppList));
			}
		},

		userUpdate: function(callback) {
			var self = this;

			self.callApi({
				resource: 'user.update',
				data: {
					accountId: self.accountId,
					userId: self.userId,
					data: monster.apps.auth.currentUser
				},
				success: function(data, status) {
					callback && callback();
				}
			});
		}
	};

	return app;
});
