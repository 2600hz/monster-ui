define(function(require){
	var $ = require('jquery'),
		_ = require('underscore'),
		monster = require('monster'),
		nicescroll = require('nicescroll');

	var app = {

		name: 'myaccount',

		i18n: [ 'en-US', 'fr-FR' ],

		requests: {
			'myaccount.getAccount': {
				url: 'accounts/{accountId}',
				verb: 'GET'
			},
			'myAccount.getBraintree': {
				url: 'accounts/{accountId}/braintree/customer',
				verb: 'GET'
			}
		},

		subscribe: {
			'myaccount.hide': '_hide',
			'myaccount.updateMenu': '_updateMenu',
			'myaccount.renderSubmodule': '_renderSubmodule',
			'myaccount.renderNavLinks': '_renderNavLinks',
			'myaccount.UIRestrictionsCompatibility': '_UIRestrictionsCompatibility'
		},

		subModules: ['profile', 'trunks', 'balance', 'servicePlan', 'transactions'],

		mainContainer: '#myaccount',
		defaultApp: {
			name: 'profile'
		},

		load: function(callback){
			var self = this;

			self.initApp(function() {
				self.render();

				callback && callback(self);
			});
		},

		initApp: function(_callback) {
			var self = this;

			monster.pub('auth.initApp', {
				app: self,
				callback: _callback
			});
		},

		getDefaultRestrictions: function() {
			return {
				balance: {
					show_credit: true,
					show_header: true,
					show_minutes: true,
					show_tab: true
				},
				inbound: {
					show_tab: true
				},
				outbound: {
					show_tab: true
				},
				profile: {
					show_account: true,
					show_billing: true,
					show_tab: true,
					show_user: true
				},
				service_plan: {
					show_tab: true
				},
				transactions: {
					show_tab: true
				}
			};
		},

		_UIRestrictionsCompatibility: function(args) {
			var self = this,
				showMyaccount = false;

			if ( args.hasOwnProperty('restrictions') && args.restrictions.hasOwnProperty('myaccount') ) {
				args.restrictions = args.restrictions.myaccount;
			} else if ( !args.hasOwnProperty('restrictions') ) {
				args.restrictions = self.getDefaultRestrictions();
			}

			_.each(args.restrictions, function(value, key){
				if ( value.show_tab ) {
					showMyaccount = true;
				}
			});

			args.callback(args.restrictions, showMyaccount);
		},

		formatUiRestrictions: function(restrictions, callback) {
			var self = this,
				categories = {
					account: ['profile'],
					billing: ['transactions', 'service_plan', 'balance'],
					trunking: ['inbound', 'outbound']
				};

			self._UIRestrictionsCompatibility({
				restrictions: restrictions,
				callback: function(uiRestrictions) {
					uiRestrictions.categories = {};

					for(var i in categories) {
						var category = categories[i],
							countDisplay = category.length;

						category.forEach(function(element) {
							if(!uiRestrictions.hasOwnProperty(element) || !uiRestrictions[element].show_tab) {
								countDisplay--;
							}
						});

						uiRestrictions.categories[i] = {
							show: countDisplay > 0 ? true : false
						};
					}

					callback(uiRestrictions);
				}
			});
		},

		render: function(){
			var self = this;

			self.formatUiRestrictions(monster.apps.auth.originalAccount.ui_restrictions, function(uiRestrictions) {
				var dataTemplate = {
						restrictions: uiRestrictions
					},
					myaccountHtml = $(monster.template(self, 'app', dataTemplate));

				if ( !monster.apps.auth.originalAccount.hasOwnProperty('ui_restrictions') ) {
					self.callApi({
						resource: 'account.get',
						data: {
							accountId: self.accountId
						},
						success: function(data, status) {
							data.data.ui_restrictions.myaccount = self.getDefaultRestrictions();

							self.callApi({
								resource: 'account.update',
								data: {
									accountId: self.accountId,
									data: data.data
								}
							});
						}
					});
				}

				$('#topbar').after(myaccountHtml);

				self._renderNavLinks();

				self.bindEvents(myaccountHtml);

				if(monster.apps['auth'].resellerId === monster.config.resellerId && uiRestrictions.profile.show_tab) {
					self.checkCreditCard();
				}

			});
		},

		// Also used by masquerading, account app
		_renderNavLinks: function(args) {
			var self = this;

			self._UIRestrictionsCompatibility({
				restrictions: monster.apps.auth.originalAccount.ui_restrictions,
				callback: function(uiRestrictions, showMyaccount) {
					var navLinks = $('#ws-navbar .links'),
						dataTemplate = {
							name: args && args.name || monster.apps['auth'].currentUser.first_name + ' ' + monster.apps['auth'].currentUser.last_name,
							isMasquerading: args && args.isMasquerading || false,
							showMyaccount: false
						},
						navHtml = $(monster.template(self, 'nav', dataTemplate)),
						mainContainer = $(self.mainContainer);
console.log(dataTemplate);
console.log(navHtml);
					/* Hack to redraw myaccount links on masquerading */
					navLinks.find('.myaccount-common-link').remove();
					navLinks.append(navHtml);
				}
			});
		},

		renderDropdown: function(callback) {
			var self = this,
				countBadges = 3;

			monster.pub('myaccount.refreshBadges', {
				callback: function() {
					/* when all the badges have been updated, display my account */
					if(!--countBadges) {
						self.toggle({
							callback: callback
						});
					}
				}
			});
		},

		bindEvents: function(container) {
			var self = this,
				mainContainer = $(self.mainContainer);
				navLinks = $('#ws-navbar .links');

			container.find('.myaccount-close').on('click', function() {
				self.toggle();
            });

			container.find('.myaccount-element').on('click', function() {
				var $this = $(this),
					key = $this.data('key'),
					module = $this.data('module'),
					args = {
						module: module
					};

				if(key) {
					args.title = self.i18n.active()[module][key + 'Title'];
					args.key = key;
				}
				else {
					args.title = self.i18n.active()[module].title;
				}

				self.activateSubmodule(args);

				// Otherwise sometimes the data isn't synced
				monster.pub('myaccount.refreshBadges');
			});

			navLinks.on('click', '.myaccount-link', function(e) {
				e.preventDefault();

				self._UIRestrictionsCompatibility({
					restrictions: monster.apps.auth.originalAccount.ui_restrictions,
					callback: function(uiRestrictions, showMyaccount) {
						if ( showMyaccount ) {
							if(mainContainer.hasClass('myaccount-open')) {
								self.hide();
							}
							else {
								self.renderDropdown();
							}
						}
					}
				});
			});

			navLinks.on('click', '.restore-masquerading-link', function(e) {
				e.preventDefault();

				// Closing myaccount (if open) before restoring from masquerading
				if(mainContainer.hasClass('myaccount-open')) {
					self.toggle();
				}
				monster.pub('accountsManager.restoreMasquerading');
				monster.pub('core.showAppName', 'accounts');
			});
		},

		// events
		toggle: function(args) {
			var self = this,
				callback = (args || {}).callback,
				myaccount = $(self.mainContainer),
				scrollingUL = myaccount.find('.myaccount-menu ul.nav.nav-list'),
                niceScrollBar = scrollingUL.getNiceScroll()[0] || scrollingUL.niceScroll({
                                                                    cursorcolor:"#333",
                                                                    cursoropacitymin:0.5,
                                                                    hidecursordelay:1000
                                                                }),
                firstTab = myaccount.find('.myaccount-menu .myaccount-element').first(),
                uiRestrictions = monster.apps.auth.originalAccount.ui_restrictions ? monster.apps.auth.originalAccount.ui_restrictions.myaccount || monster.apps.auth.originalAccount.ui_restrictions : {};

			if (uiRestrictions && uiRestrictions[self.defaultApp.name] && uiRestrictions[self.defaultApp.name].show_tab === false) {
				self.defaultApp.name = firstTab.data('module');
				if (firstTab.data('key')) {
					self.defaultApp.key =  firstTab.data('key');
				};
			}
            var defaultApp = self.defaultApp.name;

			if(myaccount.hasClass('myaccount-open')) {
				self.hide(myaccount, niceScrollBar);
			}
			else {
				var args = {
					title: self.i18n.active()[defaultApp].title,
					module: defaultApp,
					callback: function() {
						myaccount
							.slideDown(300, function() {
								niceScrollBar.show().resize();
							})
							.addClass('myaccount-open');

						callback && callback();
					}
				};

				if (self.defaultApp.key) {
					args.key = self.defaultApp.key;
				};

				self.activateSubmodule(args);
			}
		},

		activateSubmodule: function(args) {
            var self = this,
                myaccount = $(self.mainContainer),
                submodule = args.key ? myaccount.find('[data-module="'+args.module+'"][data-key="'+args.key+'"]') : myaccount.find('[data-module="'+args.module+'"]');

            myaccount.find('.myaccount-menu .nav li').removeClass('active');
            submodule.addClass('active');

            myaccount.find('.myaccount-module-title').html(args.title);
            myaccount.find('.myaccount-content').empty();

            monster.pub('myaccount.' + args.module + '.renderContent', args);
        },

        _renderSubmodule: function(template) {
			var parent = $('#myaccount');

			parent.find('.myaccount-right .myaccount-content').html(template);

			if (parent.find('.myaccount-menu .nav li.active')) {
				parent.find('.myaccount-right .nav li').first().addClass('active');
				parent.find('.myaccount-right .tab-content div').first().addClass('active');
			};
		},

		hide: function(myaccount, scrollbar) {
			var self = this,
				myaccount = myaccount || $(self.mainContainer),
				niceScrollBar = scrollbar || myaccount.find('.myaccount-menu ul.nav.nav-list').getNiceScroll()[0];

			myaccount.find('.myaccount-right .myaccount-content').empty();
			niceScrollBar.hide();
			myaccount
				.slideUp(300, niceScrollBar.resize)
				.removeClass('myaccount-open');
		},

		_hide: function() {
			var self = this,
				myaccount = $(self.mainContainer);

			if(myaccount.hasClass('myaccount-open')) {
				self.hide(myaccount);
			}
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

			params.callback && params.callback();
		},

		checkCreditCard: function() {
			var self = this;

			self.getBraintree(function(data) {
				if(data.credit_cards.length === 0) {
					self.renderDropdown(function() {
						monster.pub('myaccount.profile.showCreditTab');
					});
				}
			});
		},

		getBraintree: function(callback) {
			var self = this;

			monster.request({
				resource: 'myAccount.getBraintree',
				data: {
					accountId: self.accountId
				},
				success: function(dataBraintree) {
					callback && callback(dataBraintree.data);
				}
			});
		}
	};

	return app;
});
