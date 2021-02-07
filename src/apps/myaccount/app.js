define(function(require) {
	var $ = require('jquery'),
		_ = require('lodash'),
		monster = require('monster');

	var app = {
		subModules: [
			'account',
			'balance',
			'billing',
			'errorTracker',
			'servicePlan',
			'transactions',
			'trunks',
			'user'
		],

		i18n: {
			'de-DE': { customCss: false },
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
			'apploader.closed': 'onAppLoaderClosed',
			'myaccount.hide': '_hide',
			'myaccount.updateMenu': '_updateMenu',
			'myaccount.events': '_myaccountEvents',
			'myaccount.renderNavLinks': '_renderNavLinks',
			'myaccount.renderSubmodule': '_renderSubmodule',
			'myaccount.openAccordionGroup': '_openAccordionGroup',
			'myaccount.UIRestrictionsCompatibility': '_UIRestrictionsCompatibility',
			'myaccount.showCreditCardTab': 'showCreditCardTab',
			'myaccount.hasCreditCards': 'hasCreditCards',
			'core.changedAccount': 'refreshMyAccount',
			'myaccount.hasToShowWalkthrough': 'hasToShowWalkthrough',
			'myaccount.renderDropdown': 'clickMyAccount',
			'myaccount.showAddCreditDialog': 'showAddCreditDialog'
		},

		appFlags: {
			/**
			 * Whether myaccount should be rendered
			 * @type {Boolean}
			 */
			showMyAccount: false,
			common: {
				outboundPrivacy: [
					'inherit',
					'none',
					'number',
					'name',
					'full'
				]
			}
		},

		mainContainer: '#myaccount',

		onAppLoaderClosed: function onAppLoaderClosed() {
			var self = this;

			if ($(self.mainContainer).hasClass('myaccount-open')) {
				return;
			}

			monster.pub('core.isActiveAppPlugin', _.bind(self.clickMyAccount, self));
		},

		getDefaultCategory: function() {
			var self = this,
				defaultApp = {
					name: 'user'
				};

			if (monster.util.isMasquerading()) {
				defaultApp.name = 'account';
			}

			return defaultApp;
		},

		getDefaultRestrictions: function() {
			var restrictions = {
				account: ['show_tab'],
				balance: ['show_credit', 'show_header', 'show_minutes', 'show_tab'],
				billing: ['show_tab'],
				errorTracker: ['show_tab'],
				inbound: ['show_tab'],
				outbound: ['show_tab'],
				service_plan: ['show_tab'],
				transactions: ['show_tab'],
				twoway: ['show_tab'],
				user: ['show_tab']
			};
			return _
				.chain(restrictions)
				.keys()
				.map(function(tabId) {
					return {
						tabId: tabId,
						toggles: _
							.chain(restrictions[tabId])
							.map(function(toggle) {
								return {
									toggle: toggle,
									isEnabled: !(monster.apps.auth.currentUser.priv_level === 'user' && !_.includes(['errorTracker', 'user'], tabId))
								};
							})
							.keyBy('toggle')
							.mapValues('isEnabled')
							.value()
					};
				})
				.keyBy('tabId')
				.mapValues('toggles')
				.value();
		},

		/**
		 * @param  {Object} args
		 * @param  {Object} [args.restrictions]
		 * @param  {Function} args.callback
		 */
		_UIRestrictionsCompatibility: function(args) {
			var self = this,
				defaultRestrictions = self.getDefaultRestrictions(),
				validTabIds = _.keys(defaultRestrictions),
				restrictions = _
					.chain({})
					.merge(
						defaultRestrictions,
						_.get(args, 'restrictions.myaccount', {})
					)
					// Remove legacy properties no longer used
					.omitBy(function(toggles, tabId) {
						return !_.includes(validTabIds, tabId);
					})
					.value();

			self.appFlags.showMyAccount = _.some(restrictions, _.partial(_.get, _, 'show_tab', false));

			args.callback(restrictions, self.appFlags.showMyAccount);
		},

		formatUiRestrictions: function(restrictions, callback) {
			var self = this,
				categories = {
					settings: ['account', 'user'],
					billing: ['billing', 'transactions', 'service_plan', 'balance'],
					trunking: ['inbound', 'outbound'],
					misc: ['errorTracker']
				},
				_callback = function(billing, uiRestrictions) {
					if (_.isEmpty(billing)) {
						uiRestrictions.billing.show_tab = false;
					}

					uiRestrictions.categories = {};

					for (var i in categories) {
						var category = categories[i],
							countDisplay = category.length;

						category.forEach(function(element) {
							if (!uiRestrictions.hasOwnProperty(element) || !uiRestrictions[element].show_tab) {
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
			var self = this,
				resolveCurrencyCode = function resolveCurrencyCode() {
					var fontAwesomeSupported = ['eur', 'gbp', 'ils', 'inr', 'jpy', 'krw', 'usd', 'rub', 'try'],
						currencyCode = _.toLower(monster.config.currencyCode);

					return _.find(fontAwesomeSupported, _.partial(_.isEqual, currencyCode));
				};

			self.formatUiRestrictions(monster.apps.auth.originalAccount.ui_restrictions, function(uiRestrictions) {
				var dataTemplate = {
						currencyCode: resolveCurrencyCode(),
						restrictions: uiRestrictions
					},
					myaccountHtml = $(self.getTemplate({
						name: 'app',
						data: dataTemplate
					}));

				if (!monster.apps.auth.originalAccount.hasOwnProperty('ui_restrictions')) {
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

				$('.core-absolute').append(myaccountHtml);

				self._renderNavLinks();

				self.bindEvents(myaccountHtml);

				self.afterRender(myaccountHtml, uiRestrictions);
			});
		},

		// Once myaccount is rendered, we need to check some things:
		// First we check if we need to display the first time walkthrough
		// If yes, we display it and update that user to not display it again once it's completed
		// If no, we check if we need to remind them to fill their credit card info
		afterRender: function(template, uiRestrictions) {
			var self = this,
				currentAccount = monster.apps.auth.currentAccount,
				currentUser = monster.apps.auth.currentUser,
				requirePasswordUpdate = currentUser.hasOwnProperty('require_password_update') && currentUser.require_password_update;

			// Only show information if we're not already showing a password update popup
			if (!requirePasswordUpdate) {
				if (currentAccount.hasOwnProperty('trial_time_left') && monster.config.api.hasOwnProperty('screwdriver')) {
					monster.pub('auth.showTrialInfo', currentAccount.trial_time_left);
				// Only direct them to my account walkthrough if it's not a trial account
				} else if (self.hasToShowWalkthrough()) {
					self.showWalkthrough(template, function() {
						self.updateWalkthroughFlagUser();
					});
				}
			}
		},

		// Also used by masquerading, account app
		_renderNavLinks: function(args) {
			var self = this;

			self._UIRestrictionsCompatibility({
				restrictions: monster.apps.auth.originalAccount.ui_restrictions,
				callback: function(uiRestrictions, showMyaccount) {
					var navLinks = $('#main_topbar_nav'),
						dataTemplate = {
							name: (args && args.name) || monster.util.getUserFullName(),
							showMyaccount: showMyaccount,
							initials: monster.util.getUserInitials(),
							account: monster.apps.auth.currentAccount.name,
							isMasquerading: monster.util.isMasquerading()
						},
						navHtml = $(self.getTemplate({
							name: 'nav',
							data: dataTemplate
						}));

					/* Hack to redraw myaccount links on masquerading */
					navLinks.find('.myaccount-common-link').remove();
					navHtml.insertAfter(navLinks.find('#main_topbar_apploader'));
				}
			});
		},

		/**
		 * Refresh myaccount information
		 * @param  {boolean}   toggle   mandatory : toggle or not myaccount dropdown
		 * @param  {Function} callback  optional  : callback called once dropdown is toggled
		 */
		renderDropdown: function(toggle, callback) {
			var self = this,
				countBadges = 3;

			monster.pub('myaccount.refreshBadges', {
				callback: function() {
					if (toggle) {
						/* when all the badges have been updated, display my account */
						if (!--countBadges) {
							monster.pub('core.showAppName', 'myaccount');
							self.toggle({
								callback: callback
							});
						}
					}
				}
			});
		},

		// Hack created to trigger when we masquerade
		refreshMyAccount: function() {
			var self = this,
				myaccount = $(self.mainContainer);

			if (myaccount.hasClass('myaccount-open')) {
				self.displayUserSection();

				var firstTab = myaccount.find('.myaccount-menu .myaccount-element.active').first(),
					module = firstTab.data('module'),
					args = {
						module: module,
						title: self.i18n.active()[module].title
					};

				if (firstTab.data('key')) {
					args.key = firstTab.data('key');
				}

				self.activateSubmodule(args);

				monster.pub('myaccount.refreshBadges', {
					except: module
				});
			}

			monster.pub('core.alerts.refresh');
		},

		bindEvents: function(container) {
			var self = this,
				navLinks = $('#main_topbar_nav');

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

				if (key) {
					args.title = self.i18n.active()[module][key + 'Title'];
					args.key = key;
				} else {
					args.title = self.i18n.active()[module].title;
				}

				self.activateSubmodule(args);

				// Use this click to update the other badges so that the badges stay up to date even if we don't open the tabs
				// We added the except keys, because we already update the badge when we load the module we just clicked on, so we don't need to do it twice
				monster.pub('myaccount.refreshBadges', {
					except: args.module
				});
			});

			navLinks.on('click', '#main_topbar_myaccount', function(e) {
				e.preventDefault();

				monster.pub('core.hideTopbarDropdowns');
				self.clickMyAccount();
			});
		},

		clickMyAccount: function() {
			var self = this,
				mainContainer = $(self.mainContainer);

			self._UIRestrictionsCompatibility({
				restrictions: monster.apps.auth.originalAccount.ui_restrictions,
				callback: function(uiRestrictions, showMyaccount) {
					if (showMyaccount) {
						if (mainContainer.hasClass('myaccount-open')) {
							self.hide();
						} else {
							if (self.hasToShowWalkthrough()) {
								self.showWalkthrough(mainContainer, function() {
									self.updateWalkthroughFlagUser();
								});
							} else {
								self.renderDropdown(true);
							}
						}
					}
				}
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
						defaultApp = self.getDefaultCategory();

					if (uiRestrictions && uiRestrictions[defaultApp.name] && uiRestrictions[defaultApp.name].show_tab === false) {
						defaultApp.name = firstTab.data('module');
						if (firstTab.data('key')) {
							defaultApp.key = firstTab.data('key');
						}
					}

					if (myaccount.hasClass('myaccount-open')) {
						self.hide(myaccount);
					} else {
						var args = {
							title: self.i18n.active()[defaultApp.name].title,
							module: defaultApp.name,
							callback: function() {
								self.displayUserSection();

								myaccount.addClass('myaccount-open');
								$('#main_topbar_myaccount').addClass('open');

								myaccount.one('transitionend', function() {
									$('#monster_content').hide();
									callback && callback();
								});
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

		displayUserSection: function() {
			var self = this;

			if (monster.util.isMasquerading()) {
				var userTab = $('.myaccount-menu .myaccount-element[data-module="user"]');

				userTab.hide();

				if (userTab.hasClass('active')) {
					userTab.removeClass('active');
					$('.myaccount-menu .myaccount-element:visible').first().addClass('active');
				}
			} else {
				$('.myaccount-menu .myaccount-element[data-module="user"]').show();
			}
		},

		activateSubmodule: function(args) {
			var self = this,
				myaccount = $(self.mainContainer),
				submodule = args.key ? myaccount.find('[data-module="' + args.module + '"][data-key="' + args.key + '"]') : myaccount.find('[data-module="' + args.module + '"]');

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

		hide: function(myaccount) {
			var self = this,
				myaccount = myaccount || $(self.mainContainer);

			monster.pub('core.showAppName');
			myaccount.find('.myaccount-right .myaccount-content').empty();
			myaccount.find('.myaccount-dialog-container').empty();
			myaccount.removeClass('myaccount-open');
			$('#main_topbar_myaccount').removeClass('open');
			$('#monster_content').show();

			monster.pub('myaccount.closed');
		},

		_hide: function() {
			var self = this,
				myaccount = $(self.mainContainer);

			if (myaccount.hasClass('myaccount-open')) {
				self.hide(myaccount);
			}
		},

		_updateMenu: function(params) {
			if (params.data !== undefined) {
				var container = params.hasOwnProperty('key') ? '[data-key="' + params.key + '"] .badge' : '[data-module="' + params.module + '"] .badge';

				$(container).html(params.data);
			}

			params.callback && params.callback();
		},

		hasCreditCards: function(callback) {
			var self = this,
				response = false;

			self.getBraintree(
				function(data) {
					response = (data.credit_cards || []).length > 0;

					callback && callback(response);
				},
				function() {
					callback && callback(response);
				}
			);
		},

		showCreditCardTab: function() {
			var self = this;

			self.showSubmodule({
				module: 'billing',
				callback: function() {
					var billingContent = $('#myaccount .myaccount-content .billing-content-wrapper');

					self._openAccordionGroup({
						link: billingContent.find('.settings-item[data-name="credit_card"] .settings-link')
					});

					monster.ui.toast({
						type: 'error',
						message: self.i18n.active().billing.missingCard
					});
				}
			});
		},

		// if flag "showfirstUseWalkthrough" is not set to false, we need to show the walkthrough
		hasToShowWalkthrough: function(callback) {
			var self = this,
				response = self.appFlags.showMyAccount && self.uiFlags.user.get('showfirstUseWalkthrough') !== false;

			if (typeof callback === 'function') {
				callback(response);
			} else {
				return response;
			}
		},

		// function to set the flag "showfirstUseWalkthrough" to false and update the user in the database.
		updateWalkthroughFlagUser: function(callback) {
			var self = this,
				userToSave = self.uiFlags.user.set('showfirstUseWalkthrough', false);

			self.updateUser(userToSave, function(user) {
				callback && callback(user);
			});
		},

		// Triggers firstUseWalkthrough. First we render the dropdown, then we show a greeting popup, and once they click go, we render the step by step.
		showWalkthrough: function(template, callback) {
			var self = this;

			self.showMyAccount(function() {
				if (monster.apps.auth.currentAccount.hasOwnProperty('trial_time_left')) {
					self.renderStepByStepWalkthrough(template, callback);
				} else {
					self.showGreetingWalkthrough(function() {
						self.renderStepByStepWalkthrough(template, callback);
					}, callback);
				}
			});
		},

		// Render the myaccount dropdown
		showMyAccount: function(callback) {
			var self = this,
				module = 'user';

			self.renderDropdown(true, function() {
				self.activateSubmodule({
					title: self.i18n.active()[module].title,
					module: module,
					callback: function() {
						callback && callback();
					}
				});
			});
		},

		showGreetingWalkthrough: function(callback, callbackClose) {
			var self = this,
				popup = $(self.getTemplate({
					name: 'walkthrough-greetingsDialog'
				}));

			popup.find('#start_walkthrough').on('click', function() {
				dialog.dialog('close').remove();

				callback && callback();
			});

			var dialog = monster.ui.dialog(popup, {
				title: self.i18n.active().walkthrough.greetingsDialog.title
			});

			// Update the flag of the walkthrough is they don't care about it
			dialog.siblings().find('.ui-dialog-titlebar-close').on('click', function() {
				callbackClose && callbackClose();
			});
		},

		showEndWalkthrough: function(callback) {
			var self = this,
				popup = $(self.getTemplate({
					name: 'walkthrough-endDialog'
				}));

			popup.find('#end_walkthrough').on('click', function() {
				dialog.dialog('close').remove();

				callback && callback();
			});

			var dialog = monster.ui.dialog(popup, {
				title: self.i18n.active().walkthrough.endDialog.title
			});
		},

		renderStepByStepWalkthrough: function(template, callback) {
			var self = this,
				steps = [
					{
						element: $('#main_topbar_myaccount')[0],
						intro: self.i18n.active().walkthrough.steps['1'],
						position: 'left'
					},
					{
						element: template.find('.myaccount-element[data-module="user"]')[0],
						intro: self.i18n.active().walkthrough.steps['2'],
						position: 'right'
					},
					{
						element: template.find('.myaccount-element[data-module="account"]')[0],
						intro: self.i18n.active().walkthrough.steps['3'],
						position: 'right'
					},
					{
						element: template.find('.myaccount-element[data-module="billing"]')[0],
						intro: self.i18n.active().walkthrough.steps['4'],
						position: 'right'
					},
					{
						element: template.find('.myaccount-element[data-module="balance"]')[0],
						intro: self.i18n.active().walkthrough.steps['5'],
						position: 'right'
					},
					{
						element: template.find('.myaccount-element[data-module="servicePlan"]')[0],
						intro: self.i18n.active().walkthrough.steps['6'],
						position: 'right'
					},
					{
						element: template.find('.myaccount-element[data-module="transactions"]')[0],
						intro: self.i18n.active().walkthrough.steps['7'],
						position: 'right'
					}
				];

			monster.ui.stepByStep(steps, function() {
				self.showEndWalkthrough(callback);
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
				},
				error: function(data, status) {
					callback && callback({});
				}
			});
		},

		validatePasswordForm: function(formPassword, callback) {
			var self = this;

			monster.ui.validate(formPassword, {
				rules: {
					'password': {
						minlength: 6
					},
					'confirm_password': {
						equalTo: 'input[name="password"]'
					}
				}
			});

			if (monster.ui.valid(formPassword)) {
				callback && callback();
			}
		},

		validateAccountAdministratorForm: function(formAccountAdministrator, callback) {
			var self = this;

			monster.ui.validate(formAccountAdministrator, {
				rules: {
					'contact.billing.name': {
						required: true
					},
					'contact.billing.email': {
						required: true,
						email: true
					},
					'contact.billing.number': {
						required: true
					},
					'contact.billing.street_address': {
						required: true
					},
					'contact.billing.locality': {
						required: true
					},
					'contact.billing.region': {
						required: true
					},
					'contact.billing.country': {
						required: true
					},
					'contact.billing.postal_code': {
						required: true,
						digits: true
					}
				}
			});

			if (monster.ui.valid(formAccountAdministrator)) {
				callback && callback();
			}
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
						aSettings.find('.update i').removeClass('fa-times').addClass('fa-cog');
						liSettings.removeClass('open');
						liSettings.find('.uneditable').show();
						liSettings.find('.edition').hide();
					});
				},
				settingsValidate = function(fieldName, dataForm, callback) {
					var formPassword = template.find('#form_password');
					var formAccountAdministrator = template.find('#form_account_administrator');

					// This is still ghetto, I didn't want to re-factor the whole code to tweak the validation
					// If the field is password, we start custom validation

					if (formPassword.length) {
						self.validatePasswordForm(formPassword, callback);
					// otherwise we don't have any validation for this field, we execute the callback
					} else if (formAccountAdministrator.length) {
						self.validateAccountAdministratorForm(formAccountAdministrator, callback);
					} else {
						callback && callback();
					}
				};

			template.find('.settings-link').on('click', function() {
				var isOpen = $(this).parent().hasClass('open');

				closeContent();

				if (!isOpen) {
					var args = { link: $(this) };

					if (data.hasOwnProperty('billing')) {
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
					moduleToUpdate = currentElement.data('module'),
					fieldName = currentElement.data('field'),
					newData = (function cleanFormData(moduleToUpdate, data) {
						if (moduleToUpdate === 'billing') {
							data.credit_card.expiration_date = data.extra.expiration_date.month + '/' + data.extra.expiration_date.year;
						}

						return data;
					})(moduleToUpdate, monster.ui.getFormData('form_' + fieldName));

				settingsValidate(fieldName, newData,
					function() {
						self.settingsUpdateData(moduleToUpdate, data[moduleToUpdate], newData,
							function(data) {
								var args = {
									callback: function(parent) {
										if (fieldName === 'credit_card') {
											parent.find('.edition').hide();
											parent.find('.uneditable').show();
										} else if (fieldName === 'colorblind') {
											$('body').toggleClass('colorblind', data.data.ui_flags.colorblind);
										}

										self.highlightField(parent, fieldName);

										/* TODO USELESS? */
										if (typeof callbackUpdate === 'function') {
										}
									}
								};

								monster.pub('myaccount.' + module + '.renderContent', args);
							}
						);
					}
				);
			});
		},

		highlightField: function(parent, fieldName) {
			var	link = parent.find('li[data-name=' + fieldName + ']');

			link.find('.update').hide();
			link
				.find('.changes-saved')
					.show()
					.fadeOut(1500, function() {
						link.find('.update').fadeIn(500);
					});

			link
				.css('background-color', '#2297FF')
				.animate({
					backgroundColor: '#f6f6f6'
				}, 2000);

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
			link.find('.update i').removeClass('fa-cog').addClass('fa-times');
			settingsItem.find('.settings-item-content').slideDown('fast');

			/* If there is no credit-card data, we skip the step that just displays the creditcard info */
			if (settingsItem.data('name') === 'credit_card' && hasEmptyCreditCardInfo) {
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

			if (type === 'user') {
				params.accountId = monster.apps.auth.originalAccount.id;
				params.userId = self.userId;
				if (params.data.timezone && params.data.timezone === 'inherit') {
					delete params.data.timezone;
				}

				// We have to do the cleaning here because the $.extend doesn't work as we expect with arrays...
				if (newData.hasOwnProperty('ui_flags') && newData.ui_flags.hasOwnProperty('numbers_format')) {
					if (newData.ui_flags.numbers_format !== 'international_with_exceptions') {
						delete params.data.ui_flags.numbers_format_exceptions;
					} else {
						params.data.ui_flags.numbers_format_exceptions = newData.ui_flags.numbers_format_exceptions;
					}

					// If it's set to default, then we want to delete the custom setting, so we can get properly inherit the account setting
					if (newData.ui_flags.numbers_format === 'inherit') {
						delete params.data.ui_flags.numbers_format;
					}
				}
			} else if (type === 'account') {
				// We have to do the cleaning here because the $.extend doesn't work as we expect with arrays...
				if (newData.hasOwnProperty('ui_flags') && newData.ui_flags.hasOwnProperty('numbers_format')) {
					if (newData.ui_flags.numbers_format !== 'international_with_exceptions') {
						delete params.data.ui_flags.numbers_format_exceptions;
					} else {
						params.data.ui_flags.numbers_format_exceptions = newData.ui_flags.numbers_format_exceptions;
					}
				}
			} else if (type === 'billing') {
				params.data = newData;
			}

			if (newData.hasOwnProperty('caller_id_options') && newData.caller_id_options.hasOwnProperty('outbound_privacy') && newData.caller_id_options.outbound_privacy === 'inherit') {
				delete params.data.caller_id_options.outbound_privacy;

				if (_.isEmpty(params.data.caller_id_options)) {
					delete params.data.caller_id_options;
				}
			}

			if ('language' in params.data) {
				if (params.data.language === 'auto') {
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
					if (typeof callbackSuccess === 'function') {
						callbackSuccess(_data, status);
					}
				},
				error: function(_data, status) {
					if (typeof callbackError === 'function') {
						callbackError(_data, status);
					}
				}
			});
		},

		updateUser: function(userToUpdate, callback) {
			var self = this;

			self.callApi({
				resource: 'user.update',
				data: {
					userId: userToUpdate.id,
					accountId: monster.apps.auth.originalAccount.id,
					data: userToUpdate
				},
				success: function(savedUser) {
					callback && callback(savedUser.data);
				}
			});
		},

		/**
		 * Open balance tab and show add credit dialog
		 */
		showAddCreditDialog: function() {
			var self = this;

			self.showSubmodule({
				module: 'balance',
				callback: function() {
					monster.pub('myaccount.balance.addCreditDialog');
				}
			});
		},

		/**
		 * Displays the main view (if not displayed already), and activates the specified submodule
		 * @param  {Object}   args
		 * @param  {String}   args.module    Submodule name
		 * @param  {Function} args.callback  Function called after the submodule has been activated
		 */
		showSubmodule: function(args) {
			var self = this,
				moduleName = args.module,
				callback = args.callback;

			monster.series([
				function(seriesCallback) {
					if ($(self.mainContainer).hasClass('myaccount-open')) {
						seriesCallback(null);
					} else {
						self.renderDropdown(true, function() {
							seriesCallback(null);
						});
					}
				},
				function(seriesCallback) {
					self.activateSubmodule({
						title: self.i18n.active()[moduleName].title,
						module: moduleName,
						callback: function() {
							seriesCallback(null);
						}
					});
				}
			], function(err) {
				if (err) {
					return;
				}
				callback && callback();
			});
		}
	};

	return app;
});
