define(function(require){
	var $ = require('jquery'),
		_ = require('underscore'),
		monster = require('monster'),
		toastr = require('toastr');

	var app = {
		name: 'myaccount',

		css: [ 'app' ],

		i18n: { 
			'en-US': { customCss: false },
			'fr-FR': { customCss: false },
			'ru-RU': { customCss: false }
		},

		requests: {
			'myaccount.getAccount': {
				url: 'accounts/{accountId}',
				verb: 'GET'
			}
		},

		subscribe: {
			'myaccount.hide': '_hide',
			'myaccount.updateMenu': '_updateMenu',
			'myaccount.events': '_myaccountEvents',
			'myaccount.renderNavLinks': '_renderNavLinks',
			'myaccount.renderSubmodule': '_renderSubmodule',
			'myaccount.openAccordionGroup': '_openAccordionGroup',
			'myaccount.UIRestrictionsCompatibility': '_UIRestrictionsCompatibility'
		},

		subModules: ['account', 'balance', 'billing', 'servicePlan', 'transactions', 'trunks', 'user'],

		mainContainer: '#myaccount',
		defaultApp: {
			name: 'user'
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
				account: {
					show_tab: true
				},
				balance: {
					show_credit: true,
					show_header: true,
					show_minutes: true,
					show_tab: true
				},
				billing: {
					show_tab: true
				},
				inbound: {
					show_tab: true
				},
				outbound: {
					show_tab: true
				},
				twoway: {
					show_tab: true
				},
				service_plan: {
					show_tab: true
				},
				transactions: {
					show_tab: true
				},
				user: {
					show_tab: true
				}
			};
		},

		_UIRestrictionsCompatibility: function(args) {
			var self = this,
				showMyaccount = false;

			if ( args.hasOwnProperty('restrictions') && typeof args.restrictions !== 'undefined' && args.restrictions.hasOwnProperty('myaccount') ) {
				args.restrictions = $.extend(true, {}, self.getDefaultRestrictions(), args.restrictions.myaccount);// = args.restrictions.myaccount;
			} else {
				args.restrictions = self.getDefaultRestrictions();
			}

			if ( !args.restrictions.hasOwnProperty('user') ) {
				args.restrictions = $.extend(args.restrictions, {
					account: {
						show_tab: true
					},
					billing: {
						show_tab: true
					},
					user: {
						show_tab: true
					},
				});

				delete args.restrictions.profile;
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
					settings: ['account', 'user'],
					billing: ['billing', 'transactions', 'service_plan', 'balance'],
					trunking: ['inbound', 'outbound']
				},
				_callback = function(billing, uiRestrictions) {
					if ( _.isEmpty(billing) ) {
						uiRestrictions.billing.show_tab = false;
					}

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
				};

			self._UIRestrictionsCompatibility({
				restrictions: restrictions,
				callback: function(uiRestrictions) {
					self.callApi({
						resource: 'billing.get',
						data: {
							accountId: self.accountId,
							generateError: false
						},
						success: function(data, status) {
							_callback(data.data, uiRestrictions);
						},
						error: function(data, status) {
							_callback({}, uiRestrictions);
						}
					});
				}
			});
		},

		render: function() {
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
						success: function(_data, status) {
							_data.data.ui_restrictions = _data.data.ui_restrictions || {};

							_data.data.ui_restrictions.myaccount = self.getDefaultRestrictions();

							self.callApi({
								resource: 'account.update',
								data: {
									accountId: self.accountId,
									data: _data.data
								}
							});
						}
					});
				}

				$('#topbar').after(myaccountHtml);

				self._renderNavLinks();

				self.bindEvents(myaccountHtml);

				if(monster.apps['auth'].resellerId === monster.config.resellerId && uiRestrictions.billing.show_tab) {
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
							showMyaccount: showMyaccount
						},
						navHtml = $(monster.template(self, 'nav', dataTemplate)),
						mainContainer = $(self.mainContainer);

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

				// Use this click to update the other badges so that the badges stay up to date even if we don't open the tabs
				// We added the except keys, because we already update the badge when we load the module we just clicked on, so we don't need to do it twice
				monster.pub('myaccount.refreshBadges', {
					except: args.module
				});
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

				var appList = $('.app-list');

				// Closing myaccount (if open) before restoring from masquerading
				if(mainContainer.hasClass('myaccount-open')) {
					self.toggle();
				}
				monster.pub('accountsManager.restoreMasquerading');
				monster.pub('core.showAppName', 'accounts');

				appList.find('.app-list-element.active').removeClass('active');
				appList.find('.app-list-element[data-name="accounts"]').addClass('active');
			});
		},

		// events
		toggle: function(args) {
			var self = this,
				callback = (args || {}).callback;

			self._UIRestrictionsCompatibility({
				restrictions: monster.apps.auth.originalAccount.ui_restrictions,
				callback: function(uiRestrictions) {
					var myaccount = $(self.mainContainer),
						firstTab = myaccount.find('.myaccount-menu .myaccount-element').first(),
						uiRestrictions = uiRestrictions,
						defaultApp = self.defaultApp;

					if (uiRestrictions && uiRestrictions[defaultApp.name] && uiRestrictions[defaultApp.name].show_tab === false) {
						defaultApp.name = firstTab.data('module');
						if (firstTab.data('key')) {
							defaultApp.key =  firstTab.data('key');
						};
					}

					if(myaccount.hasClass('myaccount-open')) {
						self.hide(myaccount);
					}
					else {
						var args = {
							title: self.i18n.active()[defaultApp.name].title,
							module: defaultApp.name,
							callback: function() {
								myaccount
									.slideDown(300, function() { $('#monster-content').hide(); })
									.addClass('myaccount-open');

								callback && callback();
							}
						};

						if (defaultApp.key) {
							args.key = defaultApp.key;
						};

						self.activateSubmodule(args);
					}
				}
			});
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
				myaccount = myaccount || $(self.mainContainer);

			myaccount.find('.myaccount-right .myaccount-content').empty();
			myaccount
				.slideUp(300)
				.removeClass('myaccount-open');
			$('#monster-content').show();
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
				var container = params.hasOwnProperty('key') ? '[data-key="'+params.key+'"] .badge' : '[data-module="'+params.module+'"] .badge';

				$(container).html(params.data);
			}

			params.callback && params.callback();
		},

		checkCreditCard: function() {
			var self = this;

			self.getBraintree(function(data) {
				if(data.credit_cards.length === 0) {
					self.renderDropdown(function() {
						var module = 'billing';

						self.activateSubmodule({
							title: self.i18n.active()[module].title,
							module: module,
							callback: function() {
								var billingContent = $('#myaccount .myaccount-content .billing-content-wrapper');

								self._openAccordionGroup({
									link: billingContent.find('.settings-item[data-name="credit_card"] .settings-link')
								});

								toastr.error(self.i18n.active().billing.missingCard);
							}
						});
					});
				}
			});
		},

		getBraintree: function(callback) {
			var self = this;

			self.callApi({
				resource: 'billing.get',
				data: {
					accountId: self.accountId,
					generateError: false
				},
				success: function(dataBraintree) {
					callback && callback(dataBraintree.data);
				}
			});
		},

		_myaccountEvents: function(args) {
			var self = this,
				data = args.data,
				template = args.template,
				closeContent = function() {
					var liSettings = template.find('li.settings-item.open'),
						aSettings = liSettings.find('a.settings-link');

					liSettings.find('.settings-item-content').slideUp('fast', function() {
						aSettings.find('.update .text').text(self.i18n.active().editSettings);
						aSettings.find('.update i').removeClass('icon-remove').addClass('icon-cog');
						liSettings.removeClass('open');
						liSettings.find('.uneditable').show();
						liSettings.find('.edition').hide();
					});
				},
				settingsValidate = function(fieldName, dataForm, callbackSuccess, callbackError) {
					var validate = true,
						error = false;

					if(fieldName === 'password') {
						if(!(dataForm.password === dataForm.confirm_password)) {
							error = self.i18n.active().user.passwordsNotMatching;
						}
					}

					if(error && typeof callbackError === 'function') {
						callbackError(error);
					}
					else if(validate === true && error === false && typeof callbackSuccess === 'function') {
						callbackSuccess();
					}
				};

			template.find('.settings-link').on('click', function() {
				var isOpen = $(this).parent().hasClass('open');

				closeContent();

				if ( !isOpen ) {
					var args = { link: $(this) };

					if ( data.hasOwnProperty('billing') ) {
						args.hasEmptyCreditCardInfo = _.isEmpty(data.billing.credit_cards);
					}

					self._openAccordionGroup(args);
				}
			});

			template.find('.cancel').on('click', function(e) {
				e.preventDefault();
				closeContent();

				$(this).parents('form').first().find('input').each(function(k, v) {
					var currentElement = $(v);
					currentElement.val(currentElement.data('original_value'));
				});
			});

			template.find('.change').on('click', function(e) {
				e.preventDefault();

				var currentElement = $(this),
					module = currentElement.parents('#myaccount').find('.myaccount-menu .myaccount-element.active').data('module'),
					moduleToUpdate = currentElement.data('module');
					fieldName = currentElement.data('field'),
					newData = (function cleanFormData(moduleToUpdate, data) {
						if ( moduleToUpdate === 'billing' ) {
							data.credit_card.expiration_date = data.extra.expiration_date.month + '/' + data.extra.expiration_date.year;
						}

						return data;
					})(moduleToUpdate, monster.ui.getFormData('form_'+fieldName));

				settingsValidate(fieldName, newData,
					function() {
						self.settingsUpdateData(moduleToUpdate, data[moduleToUpdate], newData,
							function(data) {
								var args = {
									callback: function(parent) {
										if(fieldName === 'credit_card') {
											parent.find('.edition').hide();
											parent.find('.uneditable').show();
										} else if(fieldName === 'colorblind') {
											$('body').toggleClass('colorblind', data.data.ui_flags.colorblind);
										}

										self.highlightField(parent, fieldName);

										/* TODO USELESS? */
										if(typeof callbackUpdate === 'function') {
											callbackUpdate();
										}
									}
								};

								monster.pub('myaccount.' + module + '.renderContent', args);
							},
							function(dataError) {
								monster.ui.friendlyError(dataError);
							}
						);
					},
					function(error) {
						monster.ui.alert(error);
					}
				);
			});
		},

		highlightField: function(parent, fieldName) {
			var	link = parent.find('li[data-name='+fieldName+']');

			link.find('.update').hide();
			link.find('.changes-saved').show()
										.fadeOut(1500, function() {
												link.find('.update').fadeIn(500);
										});

			link.css('background-color', '#22ccff')
					.animate({
					backgroundColor: '#f6f6f6'
				}, 2000
			);

			parent.find('li.settings-item .settings-item-content').hide();
			parent.find('li.settings-item a.settings-link').show();

		},

		_openAccordionGroup: function(args) {
			var self = this,
				link = args.link,
				settingsItem = link.parents('.settings-item'),
				hasEmptyCreditCardInfo = args.hasEmptyCreditCardInfo === false ? false : true;

			settingsItem.addClass('open');
			link.find('.update .text').text(self.i18n.active().close);
			link.find('.update i').removeClass('icon-cog').addClass('icon-remove');
			settingsItem.find('.settings-item-content').slideDown('fast');

			/* If there is no credit-card data, we skip the step that just displays the creditcard info */
			if(settingsItem.data('name') === 'credit_card' && hasEmptyCreditCardInfo) {
				settingsItem.find('.uneditable').hide();
				settingsItem.find('.edition').show();
			}
		},

		settingsUpdateData: function(type, data, newData, callbackSuccess, callbackError) {
			var self = this,
				params = {
					accountId: self.accountId,
					data: $.extend(true, {}, data, newData)
				};

			if(type === 'user') {
				params.accountId = monster.apps.auth.originalAccount.id;
				params.userId = self.userId;
			}
			else if(type === 'billing') {
				params.data = newData;
			}

			if('language' in params.data) {
				if(params.data.language === 'auto') {
					delete params.data.language;
				}
			}

			params.data = (function cleanMergedData(data) {
				var self = this;

				delete data.extra;
				delete data[''];

				return data;
			})(params.data);

			self.callApi({
				resource: type.concat('.update'),
				data: params,
				success: function(_data, status) {
					if ( typeof callbackSuccess === 'function' ) {
						callbackSuccess(_data, status);
					}
				},
				error: function() {
					if ( typeof callbackError === 'function' ) {
						callbackError(_data, status);
					}
				}
			});
		},
	};

	return app;
});
