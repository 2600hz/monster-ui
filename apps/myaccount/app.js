define(function(require){
	var $ = require('jquery'),
		_ = require('underscore'),
		monster = require('monster'),
		nicescroll = require('nicescroll'),

		templates = {
			nav: 'nav',
			myaccount: 'myaccount'
		};

	var app = {

		name: 'myaccount',

		i18n: [ 'en-US', 'fr-FR' ],

		requests: {
			'myaccount.getAccount': {
				url: 'accounts/{accountId}',
				verb: 'GET'
			}
		},

		subscribe: {
			'myaccount.display': '_show',
			'myaccount.hide': '_hide',
			'myaccount.updateMenu': '_updateMenu',
			'myaccount.addSubmodule': '_addSubmodule',
			'myaccount.renderSubmodule': '_renderSubmodule',
			'myaccount.activateSubmodule': '_activateSubmodule',
			'myaccount.renderNavLinks': '_renderNavLinks'
		},

		load: function(callback){
			var self = this;

			self.initApp(function() {
				self.render();

				callback && callback(self);
			});
		},

		_apps: ['myaccount-profile', 'myaccount-balance', 'myaccount-transactions', 'myaccount-servicePlan', 'myaccount-trunks'],

		_defaultApp: {
			name: 'myaccount-profile'
		},

		_loadApps: function(callback) {
			var self = this;

			if(self._apps.length) {
				var appName = self._apps.pop();

				// We first load all the required apps
				monster.apps.load(appName, function(app) {
					app.render(function() {
						if(!self._apps.length) {
							callback && callback();
						}
						else {
							self._loadApps(callback);
						}
					});
				});
			}
			else {
				callback && callback();
			}
		},

		initApp: function(_callback) {
			var self = this;

			monster.pub('auth.initApp', {
				app: self,
				callback: _callback
			});
		},

		_renderNavLinks: function(args) {
			var self = this,
				navHtml = $(monster.template(self, 'nav', {
					name: args && args.name || monster.apps['auth'].currentUser.first_name + ' ' + monster.apps['auth'].currentUser.last_name,
					isMasquerading: args && args.isMasquerading || false
				}));

			$('#ws-navbar .links').empty()
								  .append(navHtml);
		},

		render: function(){
			/* render non-dependant stuff */
			var self = this,
				myaccountHtml = $(monster.template(self, 'myaccount')),
				navContainer = $('#ws-navbar .links');

			$('#topbar').after(myaccountHtml);

			self._renderNavLinks();

			navContainer.on('click', '.myaccount-link', function(e) {
				e.preventDefault();

				self._loadApps(function() {
					monster.pub('myaccount.display');
				});
			});

			navContainer.on('click', '.restore-masquerading-link', function(e) {
				e.preventDefault();

				// Closing myaccount (if open) before restoring from masquerading
				if($('#myaccount').hasClass('myaccount-open')) {
					monster.pub('myaccount.display');
				}
				monster.pub('accountsManager.restoreMasquerading');
			});

			self.groups = {
				'accountCategory': {
					id: 'accountCategory',
					friendlyName: self.i18n.active().accountCategory,
					weight: 0
				},
				'billingCategory': {
					id: 'billingCategory',
					friendlyName: self.i18n.active().billingCategory,
					weight: 10
				},
				'trunkingCategory': {
					id: 'trunkingCategory',
					friendlyName: self.i18n.active().trunkingCategory,
					weight: 20
				}
			};

			self.bindEvents(myaccountHtml);
		},

		bindEvents: function(container) {
			var self = this;

			container.find('.myaccount-close').on('click', function() {
                monster.pub('myaccount.display');
            });

			container.find('.signout').on('click', function() {
				monster.pub('auth.clickLogout');
			});
		},

		// events
		_show: function() {
			var self = this,
				myaccount = $('#myaccount'),
				scrollingUL = myaccount.find('.myaccount-menu ul.nav.nav-list'),
                niceScrollBar = scrollingUL.getNiceScroll()[0] || scrollingUL.niceScroll({
                                                                    cursorcolor:"#333",
                                                                    cursoropacitymin:0.5,
                                                                    hidecursordelay:1000
                                                                }),
                firstTab = myaccount.find('.myaccount-menu li:not(.nav-header)').first(),
                uiRestrictions = monster.apps['auth'].originalAccount.ui_restrictions,
                defaultApp = self._defaultApp.name.match(/-(?:[a-zA-Z]+)/)[0].replace('-', '');

			if (uiRestrictions && uiRestrictions[defaultApp] && uiRestrictions[defaultApp].show_tab === false) {
				self._defaultApp.name = firstTab.data('module');
				if (firstTab.data('key')) {
					self._defaultApp.key =  firstTab.data('key');
				};
			}

			if(myaccount.hasClass('myaccount-open')) {
				self.hide(myaccount, niceScrollBar);
			}
			else {
				var args = {
					title: monster.apps[self._defaultApp.name].i18n.active().title,
					module: self._defaultApp.name,
					callback: function() {
						myaccount
							.slideDown(300, function() {
								niceScrollBar.show().resize();
							})
							.addClass('myaccount-open');
					}
				};

				if (self._defaultApp.key) {
					args.key = self._defaultApp.key;
				};

				monster.pub('myaccount.activateSubmodule', args);
			}
		},

		hide: function(myaccount, scrollbar) {
			var self = this,
				myaccount = myaccount || $('#myaccount'),
				niceScrollBar = scrollbar || myaccount.find('.myaccount-menu ul.nav.nav-list').getNiceScroll()[0];

			myaccount.find('.myaccount-right .myaccount-content').empty();
			niceScrollBar.hide();
			myaccount
				.slideUp(300, niceScrollBar.resize)
				.removeClass('myaccount-open');
		},

		_hide: function() {
			var self = this,
				myaccount = $('#myaccount');

			if(myaccount.hasClass('myaccount-open')) {
				self.hide(myaccount);
			}
		},

		_renderSubmodule: function(template) {
			var parent = $('#myaccount');

			parent.find('.myaccount-right .myaccount-content').html(template);

			if (parent.find('.myaccount-menu .nav li.active')) {
				parent.find('.myaccount-right .nav li').first().addClass('active');
				parent.find('.myaccount-right .tab-content div').first().addClass('active');
			};
		},

		_activateSubmodule: function(args) {
			var self = this,
				myaccount = $('#myaccount'),
				submodule = args.key ? myaccount.find('[data-module="'+args.module+'"][data-key="'+args.key+'"]') : myaccount.find('[data-module="'+args.module+'"]');

			myaccount.find('.myaccount-menu .nav li').removeClass('active');
			submodule.addClass('active');

			myaccount.find('.myaccount-module-title').html(args.title);
			myaccount.find('.myaccount-content').empty();

			monster.pub(args.module + '.renderContent', args);

			args.callback && args.callback();
		},

		_updateMenu: function(params) {
			if(params.data !== undefined) {
				if(params.key) {
					$('[data-key="'+params.key+'"] .badge').html(params.data);
				}
				else {
					$('[data-module="'+params.module+'"] .badge').html(params.data);
				}
			}
		},

		_addSubmodule: function(params) {
			var self = this,
				inserted = false,
				myaccount = $('body #myaccount'),
				navList = myaccount.find('.myaccount-menu .nav'),
				category = params.category || 'accountCategory',
				menu = params.menu,
				_weight = params.weight,
				module = params.name,
				restriction = menu.data('key') ? menu.data('key') : menu.data('module')
																.match(/-(?:[a-zA-Z]+)/)[0]
																.replace(/([a-z])([A-Z])/, '$1_$2')
																.toLowerCase()
																.replace('-', ''),
				uiRestrictions = monster.apps['auth'].originalAccount.ui_restrictions;

			if(module === self._defaultApp.name) {
				self._defaultApp.title = params.title;
			}

			menu.on('click', function() {
				var args = {
					module: module,
					title: params.title,
					key: menu.data('key') || ''
				};

				monster.pub('myaccount.activateSubmodule', args);
			});

			category = self.groups[category];

			if (!uiRestrictions || !uiRestrictions[restriction] || uiRestrictions[restriction].show_tab) {

				if(navList.find('#'+category.id).size() === 0) {
					var inserted = false;
					navList.find('li.nav-header').each(function(k, v) {
						if($(this).data('weight') > category.weight) {
							$(this).before('<li id="'+category.id+'" data-weight="'+category.weight+'" class="nav-header hidden-phone blue-gradient-reverse">'+ category.friendlyName +'</li>');
							inserted = true;
							return false;
						}
					});

					if(inserted === false) {
						navList.append('<li id="'+category.id+'" data-weight="'+category.weight+'" class="nav-header hidden-phone blue-gradient-reverse">'+ category.friendlyName +'</li>');
					}
				}

				if(_weight) {
					menu.data('weight', _weight);

					var categoryReached = false;

					navList.find('li').each(function(index,v) {
						if(categoryReached) {
							var weight = $(this).data('weight');

							if(_weight < weight || $(v).hasClass('nav-header')) {
								$(this)
									.before(menu);

								return false;
							}
						}

						if($(v).attr('id') === category.id) {
							categoryReached = true;
						}

						if(index >= (navList.find('li').length - 1)) {
							$(this).after(menu);

							return false;
						}
					});
				}
				else {
					navList.find('#'+category.id).after(menu);
				}
			}
		}
	};

	return app;
});
