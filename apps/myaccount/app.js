define(function(require){
	var $ = require('jquery'),
		_ = require('underscore'),
		monster = require('monster'),

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
			'myaccount.updateMenu': '_updateMenu',
			'myaccount.addSubmodule': '_addSubmodule',
			'myaccount.renderSubmodule': '_renderSubmodule',
			'myaccount.clickSubmodule': '_clickSubmodule'
		},

		load: function(callback){
			var self = this;

			self.whappAuth(function() {
				self.render();

				callback && callback(self);
			});
		},

		_apps: ['myaccount-profile', 'myaccount-balance'/*, 'myaccount-transactions', 'myaccount-servicePlan', 'myaccount-trunks'*/],

		_defaultApp: 'myaccount-profile',

		_loadApps: function(callback) {
			var self = this;

			/* Once all the required apps are loaded, we render the myaccount app */
			if(!self._apps.length) {
				callback && callback();
			}
			else {
				var appName = self._apps.pop();

				/* We first load all the required apps */
				monster._loadApp(appName, function(app) {
					app.render();

					self._loadApps(callback);
				});
			}
		},

		whappAuth: function(_callback) {
			var self = this;

			monster.pub('auth.sharedAuth', {
				app: self,
				callback: _callback
			});
		},

		render: function(){
			/* render non-dependant stuff */
			var self = this,
				dataNav = {
					name: monster.apps['auth'].currentUser.first_name + ' ' + monster.apps['auth'].currentUser.last_name
				},
				myaccountHtml = $(monster.template(self, 'myaccount')),
				navHtml = $(monster.template(self, 'nav', dataNav));

			$('#topbar').after(myaccountHtml);

			$('#ws-navbar .links').append(navHtml);

			$(navHtml).on('click', function(e) {
				e.preventDefault();

				self._loadApps(function() {
					monster.pub('myaccount.display');
				});
			});

			self.groups = {
				'accountCategory': {
					id: 'accountCcategory',
					friendlyName: self.i18n.active().accountCategory,
					weight: 0
				},
				'billingCategory': {
					id: 'billing_category',
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
				monster.pub('auth.logout');
			});
		},

		// events
		_show: function() {
			var self = this,
				myaccount = $('#myaccount');

			if(myaccount.hasClass('myaccount-open')) {
				myaccount.find('.myaccount-right .myaccount-content').empty();

				myaccount
					.slideUp(300)
					.removeClass('myaccount-open');
			}
			else {
				var args = {
					module: self._defaultApp,
					callback: function() {
						myaccount
							.slideDown(300)
							.addClass('myaccount-open');
					}
				};

				monster.pub('myaccount.clickSubmodule', args);
			}
		},

		_renderSubmodule: function(template) {
			$('#myaccount .myaccount-right .myaccount-content').html(template);
		},

		_clickSubmodule: function(args) {
			var self = this,
				myaccount = $('#myaccount'),
				submodule = args.key ? myaccount.find('[data-module="'+args.module+'"][data-key="'+args.key+'"]') : myaccount.find('[data-module="'+args.module+'"]'),
				key = 'myaccount.' + submodule.data('module') + '.'  + (args.key ? args.key : 'title');

			myaccount.find('.myaccount-menu .nav li').removeClass('active');
			submodule.addClass('active');

			myaccount.find('.myaccount-module-title').html(self.i18n.active()[key]);

			monster.pub(args.module + '.renderContent');

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
				_weight = params.weight;

			menu.on('click', function() {
				var args = {
					module: menu.data('module'),
					key: menu.data('key') || ''
				};

				monster.pub('myaccount.clickSubmodule', args);
			});

			category = self.groups[category];

			if(navList.find('#'+category.id).size() === 0) {
				var inserted = false;
				navList.find('li.nav-header').each(function(k, v) {
					if($(this).data('weight') > category.weight) {
						$(this).before('<li id="'+category.id+'" data-weight="'+category.weight+'" class="nav-header hidden-phone blue-gradient-reverse">'+ category.friendlyName +'</li>');
						inserted = true;
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
	};

	return app;
});
