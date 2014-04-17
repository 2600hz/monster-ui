define(function(require){
	var $ = require('jquery'),
		_ = require('underscore'),
		chosen = require('chosen'),
		monster = require('monster'),
		toastr = require('toastr'),
		timezone = require('monster-timezone'),
		nicescroll = require('nicescroll'),
		hotkeys = require('hotkeys'),
		wysiwyg = require('wysiwyg');

	var app = {

		name: "accounts",

		i18n: [ 'en-US', 'fr-FR' ],

		requests: {
			'accountsManager.listAll': {
				url: 'accounts/{accountId}/descendants',
				verb: 'GET'
			},
			'accountsManager.get': {
				url: 'accounts/{accountId}',
				verb: 'GET'
			},
			'accountsManager.create': {
				url: 'accounts/{accountId}',
				verb: 'PUT'
			},
			'accountsManager.update': {
				url: 'accounts/{accountId}',
				verb: 'POST'
			},
			'accountsManager.delete': {
				url: 'accounts/{accountId}',
				verb: 'DELETE'
			},
			'accountsManager.users.list': {
				url: 'accounts/{accountId}/users',
				verb: 'GET'
			},
			'accountsManager.users.listAdmins': {
				url: 'accounts/{accountId}/users?filter_priv_level=admin',
				verb: 'GET'
			},
			'accountsManager.users.get': {
				url: 'accounts/{accountId}/users/{userId}',
				verb: 'GET'
			},
			'accountsManager.users.update': {
				url: 'accounts/{accountId}/users/{userId}',
				verb: 'POST'
			},
			'accountsManager.users.create': {
				url: 'accounts/{accountId}/users',
				verb: 'PUT'
			},
			'accountsManager.users.delete': {
				url: 'accounts/{accountId}/users/{userId}',
				verb: 'DELETE'
			},
			'accountsManager.servicePlans.list': {
				url: 'accounts/{accountId}/service_plans',
				verb: 'GET'
			},
			'accountsManager.servicePlans.current': {
				url: 'accounts/{accountId}/service_plans/current',
				verb: 'GET'
			},
			'accountsManager.servicePlans.get': {
				url: 'accounts/{accountId}/service_plans/{planId}',
				verb: 'GET'
			},
			'accountsManager.servicePlans.add': {
				url: 'accounts/{accountId}/service_plans/{planId}',
				verb: 'POST'
			},
			'accountsManager.servicePlans.delete': {
				url: 'accounts/{accountId}/service_plans/{planId}',
				verb: 'DELETE'
			},
			'accountsManager.servicePlans.reconciliation': {
				url: 'accounts/{accountId}/service_plans/reconciliation',
				verb: 'POST'
			},
			'accountsManager.servicePlans.synchronization': {
				url: 'accounts/{accountId}/service_plans/synchronization',
				verb: 'POST'
			},
			'accountsManager.limits.get': {
				url: 'accounts/{accountId}/limits',
				verb: 'GET'
			},
			'accountsManager.limits.update': {
				url: 'accounts/{accountId}/limits',
				verb: 'POST'
			},
			'accountsManager.classifiers.get': {
				url: 'accounts/{accountId}/phone_numbers/classifiers',
				verb: 'GET'
			},
			'accountsManager.balance.get': {
				url: 'accounts/{accountId}/transactions/current_balance',
				verb: 'GET'
			},
			'accountsManager.balance.add': {
				url: 'accounts/{accountId}/braintree/credits',
				verb: 'PUT'
			},
			'accountsManager.callflows.add': {
				url: 'accounts/{accountId}/callflows',
				verb: 'PUT'
			}
		},

		subscribe: {
			'accountsManager.activate': '_render',
			'accountsManager.restoreMasquerading': '_restoreMasquerading'
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

		render: function(container, selectedId, callback){
			var self = this;

			self._render(container, selectedId, callback);
		},

		// subscription handlers
		_render: function(container, selectedId, callback) {
			var self = this,
				accountsManager = $(monster.template(self, 'accountsManager')),
				parent = container || $('#ws-content');

			parent.empty()
				  .append(accountsManager);

			self.loadAccountList(function() {
				self.renderAccountsManager(accountsManager, selectedId);
				callback && callback(parent);
			});
		},

		loadAccountList: function(callback) {
			var self = this;
			monster.request({
				resource: 'accountsManager.listAll',
				data: {
					accountId: self.accountId,
				},
				success: function(data, status) {
					self.accountTree = monster.ui.accountArrayToTree(data.data, self.accountId);
					callback && callback();
				}
			});
		},

		renderAccountsManager: function(parent, selectedId) {
			var self = this,
				originalAccountList = self.accountTree[self.accountId].children;

			// Adjusting the layout divs height to always fit the window's size
			$(window).resize(function(e) {
				var $accountList = parent.find('.account-list'),
					$accountListSlider = parent.find('.account-list-slider'),
					$mainContent = parent.find('.main-content'),
					topBarHeight = $('#topbar').outerHeight(),
					listHeight = this.innerHeight-$accountList.position().top-topBarHeight+'px'; //
				$accountList.css('height', listHeight);
				$accountListSlider.css('height', listHeight);
				$mainContent.css('height', this.innerHeight-$mainContent.position().top-topBarHeight+'px');
			});
			$(window).resize();

			self.bindAccountManagerEvents(parent);

			self.renderList(originalAccountList, parent, selectedId);
			parent.find('#main_account_link').html(self.accountTree[self.accountId].name);

			parent.find('.account-list').niceScroll({
				cursorcolor:"#333",
				cursoropacitymin:0.5,
				hidecursordelay:1000
			});
		},

		bindAccountManagerEvents: function(parent) {
			var self = this;

			parent.find('#account_search_input').on('keyup', function(e) {
				var search = $(this).val();
				if(search) {
					$.each(parent.find('.account-list-element'), function() {
						if($(this).find('.account-link').html().toLowerCase().indexOf(search.toLowerCase()) >= 0) {
							$(this).show();
						} else {
							$(this).hide();
						}
					});
				} else {
					parent.find('.account-list-element').show();
				}
			});

			parent.find('#main_account_link').on('click', function(e) {
				e.preventDefault();
				self.render();
			});

			parent.on('click', '.account-list-add', function(e) {
				e.preventDefault();
				self.renderNewAccountWizard({
					parent: parent,
					accountId: parent.find('.account-breadcrumb').last().data('id') || self.accountId
				});
			});

			parent.on('click', '.account-breadcrumb a', function(e) {
				e.preventDefault();
				var $this = $(this),
					accountId = $this.parent().data('id');
				parent.find('.main-content').empty();
				self.renderList(self.accountTree, parent, accountId);
				if(!$this.hasClass('disabled')) {
					self.edit(accountId, parent);
				}
			});

			parent.on('click', '.account-children-link', function() {
				var accountId = $(this).parent().data('account_id'),
					breadcrumbTemplate = $(monster.template(self, 'accountsBreadcrumb', {
						id: accountId,
						name: self.currentAccountList[accountId].name
					}));

				parent.find('.account-breadcrumbs').append(breadcrumbTemplate);

				self.renderList(self.currentAccountList[accountId].children, parent, null, true);
			});

			parent.on('click', '.account-link:not(.disabled)', function() {
				var accountId = $(this).parent().data('account_id');
				parent.find('.main-content').empty();
				self.edit(accountId, parent);
				self.renderList(self.currentAccountList, parent, accountId);
			});
		},

		findAccountInTree: function(accountTree, accountId) {
			var self = this,
				results = null;

			if(accountId in accountTree) {
				return {
					accountList: accountTree,
					breadcrumbs: [{
						id: accountId,
						name: accountTree[accountId].name
					}]
				};
			} else {
				$.each(accountTree, function(key, value) {
					if('children' in value) {
						results = self.findAccountInTree(value.children, accountId);
					}
					if(results !== null) {
						results.breadcrumbs.splice(0, 0, {
							id: key,
							name: value.name
						})
						return false;
					}
				});
				return results;
			}
		},

		renderList: function(accountList, parent, selectedId, slide) {
			var self = this,
				accountList = accountList || [],
				accountListHtml,
				$list = parent.find('.account-list'),
				$slider = parent.find('.account-list-slider');

			if(selectedId && !(selectedId in accountList)) {
				var selectedAccount = self.findAccountInTree(accountList, selectedId),
					breadcrumbsContainer = parent.find('.account-breadcrumbs');

				self.currentAccountList = selectedAccount.accountList;

				breadcrumbsContainer.find('.account-breadcrumb').remove();
				_.each(selectedAccount.breadcrumbs, function(val) {
					if(val.id !== self.accountId && val.id !== selectedId) {
						breadcrumbsContainer.append(monster.template(self, 'accountsBreadcrumb', val));
					}
				});
			} else {
				self.currentAccountList = accountList;
			}
			accountListHtml = $(monster.template(self, 'accountsList', {
				accounts: $.map(self.currentAccountList, function(val, key) {
					val.id = key;
					return val;
				}).sort(function(a,b) {
					return (a.name || self.i18n.active().missingAccount).toLowerCase() > (b.name || self.i18n.active().missingAccount).toLowerCase() ? 1 :-1;
				}),
				selectedId: selectedId
			}));

			if(slide) {
				$slider.empty()
					   .append(accountListHtml);

				$list.animate({ marginLeft: -$list.outerWidth() }, 400, "swing", function() {
					$list.empty()
						 .append($slider.html())
						 .css('marginLeft','0px');
					$slider.empty();
				});

			} else {
				$list.empty().append(accountListHtml);
			}

			$('#account_search_input').val("").keyup();
		},

		renderNewAccountWizard: function(params) {
			var self = this,
				parent = params.parent,
				parentAccountId = params.accountId,
				newAccountWizard = $(monster.template(self, 'newAccountWizard')),
				maxStep = parseInt(newAccountWizard.find('.wizard-top-bar').data('max_step'));

			newAccountWizard.find('.wizard-top-bar').data('active_step', '1');

			newAccountWizard.find('.wizard-content-step').hide();
			newAccountWizard.find('.wizard-content-step[data-step="1"]').show();

			if(!monster.apps['auth'].isReseller) {
				newAccountWizard.find('.wizard-top-bar .step[data-step="2"]').hide();
			}

			if(maxStep > 1) {
				newAccountWizard.find('.submit-btn').hide();
			}
			else {
				newAccountWizard.find('.next-step').hide();
			}

			newAccountWizard.find('.prev-step').hide();

			newAccountWizard.find('.step').on('click', function() {
				var currentStep = newAccountWizard.find('.wizard-top-bar').data('active_step'),
					newStep = $(this).data('step');
				if($(this).hasClass('completed') && currentStep !== newStep) {
					self.validateStep(currentStep,
									  newAccountWizard.find('.wizard-content-step[data-step="'+currentStep+'"]'),
									  function() {
						self.changeStep(newStep, maxStep, newAccountWizard);
					});
				}
			});

			newAccountWizard.find('.next-step').on('click', function(ev) {
				ev.preventDefault();

				var currentStep = parseInt(newAccountWizard.find('.wizard-top-bar').data('active_step')),
					newStep = currentStep+1;
				if(newStep === 2 && !monster.apps['auth'].isReseller) {
					newStep++;
				}
				self.validateStep(currentStep, newAccountWizard.find('.wizard-content-step[data-step="'+currentStep+'"]'), function() {
					self.changeStep(newStep, maxStep, newAccountWizard);
				});
			});

			newAccountWizard.find('.prev-step').on('click', function(ev) {
				ev.preventDefault();

				var newStep = parseInt(newAccountWizard.find('.wizard-top-bar').data('active_step'))-1;
				if(newStep === 2 && !monster.apps['auth'].isReseller) {
					newStep--;
				}
				self.changeStep(newStep, maxStep, newAccountWizard);
			});

			newAccountWizard.find('.cancel').on('click', function(ev) {
				ev.preventDefault();

				parent.find('.edition-view').show();
				parent.find('.account-list').getNiceScroll()[0].resize();

				parent.find('.creation-view').empty();
			});

			newAccountWizard.find('.submit-btn').on('click', function(ev) {
				ev.preventDefault();

				var currentStep = parseInt(newAccountWizard.find('.wizard-top-bar').data('active_step')),
					toggleProcessing = function(show) {
						var stepsDiv = newAccountWizard.find('#accountsmanager_new_account_form'),
							processingDiv = newAccountWizard.find('.processing-div');

						if(show) {
							stepsDiv.hide();
							processingDiv.show();
							processingDiv.find('i.icon-spinner').addClass('icon-spin');
							newAccountWizard.find('.step').removeClass('completed');
						} else {
							stepsDiv.show();
							processingDiv.hide();
							processingDiv.find('i.icon-spinner').removeClass('icon-spin');
							newAccountWizard.find('.step').addClass('completed');
						}
					};
				self.validateStep(currentStep, newAccountWizard.find('.wizard-content-step[data-step="'+currentStep+'"]'), function() {

					var formData = form2object('accountsmanager_new_account_form'),
						callRestrictions = {}; // Can't use form data for this since unchecked checkboxes are not retrieved by form2object

					$.each(newAccountWizard.find('.call-restrictions-element input[type="checkbox"]'), function() {
						var $this = $(this);
						callRestrictions[$this.data('id')] = {
							action: $this.is(':checked') ? 'allow' : 'deny'
						};
					});

					toggleProcessing(true);

					monster.request({
						resource: 'accountsManager.create',
						data: {
							accountId: parentAccountId,
							data: formData.account
						},
						success: function(data, status) {
							var newAccountId = data.data.id;
							monster.parallel({
								admin: function(callback) {
									if(formData.user.email) {
										if(formData.extra.autogenPassword === true) {
											formData.user.password = self.autoGeneratePassword();
										}
										formData.user.username = formData.user.email;
										formData.user.priv_level = "admin";
										monster.request({
											resource: 'accountsManager.users.create',
											data: {
												accountId: newAccountId,
												data: formData.user
											},
											success: function(data, status) {
												callback(null, data.data);
											},
											error: function(data, status) {
												toastr.error(self.i18n.active().toastrMessages.newAccount.adminError, '', {"timeOut": 5000});
											}
										});
									} else {
										callback();
									}
								},
								noMatch: function(callback) {
									var noMatchCallflow = {
										numbers: ['no_match'],
										flow: {
											children: {},
											data: {},
											module: 'offnet'
										}
									};

									monster.request({
										resource: 'accountsManager.callflows.add',
										data: {
											accountId: newAccountId,
											data: noMatchCallflow
										},
										success: function(data, status) {
											callback(null, data.data);
										}
									});
								},
								limits: function(callback) {
									monster.request({
										resource: 'accountsManager.limits.get',
										data: {
											accountId: newAccountId
										},
										success: function(data, status) {
											var newLimits = {
												allow_prepay: formData.limits.allow_prepay,
												inbound_trunks: parseInt(formData.limits.inbound_trunks, 10),
												twoway_trunks: parseInt(formData.limits.twoway_trunks, 10),
												call_restriction: callRestrictions
											};
											monster.request({
												resource: 'accountsManager.limits.update',
												data: {
													accountId: newAccountId,
													data: $.extend(true, {}, data.data, newLimits)
												},
												success: function(data, status) {
													callback(null, data.data);
												},
												error: function(data, status) {
													toastr.error(self.i18n.active().toastrMessages.newAccount.limitsError, '', {"timeOut": 5000});
												}
											});
										},
										error: function(data, status) {
										}
									});
								},
								credit: function(callback) {
									if(formData.addCreditBalance) {
										monster.request({
											resource: 'accountsManager.balance.add',
											data: {
												accountId: newAccountId,
												data: {
													amount: parseFloat(formData.addCreditBalance)
												}
											},
											success: function(data, status) {
												callback(null, data.data);
											},
											error: function(data, status) {
												toastr.error(self.i18n.active().toastrMessages.newAccount.creditError, '', {"timeOut": 5000});
											}
										});
									} else {
										callback();
									}
								},
								servicePlans: function(callback) {
									if(formData.servicePlan) {
										monster.request({
											resource: 'accountsManager.servicePlans.add',
											data: {
												accountId: newAccountId,
												planId: formData.servicePlan,
												data: {}
											},
											success: function(data, status) {
												callback(null, data.data);
											},
											error: function(data, status) {
												toastr.error(self.i18n.active().toastrMessages.newAccount.servicePlanError, '', {"timeOut": 5000});
											}
										});
									} else {
										callback();
									}
								}
							},
							function(err, results) {

							});

							self.render(null, newAccountId, function(container) {
								// var originalAccountList = self.accountTree[self.accountId].children;
								// self.renderList(originalAccountList, parent, newAccountId);
								self.edit(newAccountId, container);
							});
						},
						error: function(data, status) {
							toastr.error(self.i18n.active().toastrMessages.newAccount.accountError, '', {"timeOut": 5000});
							toggleProcessing(false);
						}
					});

				});
			});

			self.renderWizardSteps(newAccountWizard);
			monster.ui.validate(newAccountWizard.find('#accountsmanager_new_account_form'), {
				rules: {
					'extra.confirmPassword': {
						equalTo: 'input[name="user.password"]'
					},
					'addCreditBalance': {
						number: true,
						min: 5
					}
				}
			});

			parent.find('.edition-view').hide();
			parent.find('.creation-view').append(newAccountWizard);
			parent.find('.account-list').getNiceScroll()[0].resize();
		},

		renderWizardSteps: function(parent) {
			var self = this;

			monster.parallel({
					servicePlans: function(callback) {
						if(monster.apps['auth'].isReseller) {
							monster.request({
								resource: 'accountsManager.servicePlans.list',
								data: {
									accountId: self.accountId
								},
								success: function(data, status) {
									callback(null, data.data);
								}
							});
						} else {
							callback(null, {});
						}
					},
					classifiers: function(callback) {
						monster.request({
							resource: 'accountsManager.classifiers.get',
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
					self.renderAccountInfoStep({
						parent: parent.find('.wizard-content-step[data-step="1"]')
					});

					self.renderServicePlanStep({
						parent: parent.find('.wizard-content-step[data-step="2"]'),
						servicePlans: results.servicePlans
					});

					self.renderLimitsStep({
						parent: parent.find('.wizard-content-step[data-step="3"]'),
						classifiers: results.classifiers
					});

					self.renderRestrictionsStep({
						parent: parent.find('.wizard-content-step[data-step="4"]')
					});

					monster.ui.prettyCheck.create(parent);
				}
			);
		},

		renderAccountInfoStep: function(params) {
			var self = this,
				parent = params.parent,
				newAdminDiv = parent.find('.new-admin-div'),
				autogenBtn = newAdminDiv.find('.autogen-button'),
				manualBtn = newAdminDiv.find('.manual-button'),
				autogenCheckbox = newAdminDiv.find('.autogen-ckb'),
				pwdToggleDiv = newAdminDiv.find('.password-toggle-div');

			timezone.populateDropdown(parent.find('#accountsmanager_new_account_timezone'));

			parent.find('.change-realm').on('click', function(e) {
				parent.find('.generated-realm').hide();
				parent.find('.manual-realm')
					.show()
					.find('input')
					.focus();
			});

			parent.find('.cancel-edition').on('click', function(e) {
				parent.find('.manual-realm').hide();
				parent.find('.generated-realm').show();
			});

			parent.find('.add-admin-toggle > a').on('click', function(e) {
				e.preventDefault();
				var $this = $(this);
				if(newAdminDiv.hasClass('active')) {
					newAdminDiv.slideUp();
					newAdminDiv.removeClass('active');
					newAdminDiv.find('input[type="text"], input[type="email"]').val('');
					autogenBtn.click();
					$this.html(self.i18n.active().addAdminLink.toggleOn);
					$this.next('i').show();
				} else {
					newAdminDiv.slideDown();
					newAdminDiv.addClass('active');
					$this.html(self.i18n.active().addAdminLink.toggleOff);
					$this.next('i').hide();
				}
			});

			manualBtn.on('click', function(e) {
				autogenCheckbox.prop('checked', false);
				pwdToggleDiv.slideDown();
			});

			autogenBtn.on('click', function(e) {
				autogenCheckbox.prop('checked', true);
				pwdToggleDiv.find('input[type=password]').val('');
				pwdToggleDiv.slideUp();
			});
		},

		renderServicePlanStep: function(params) {
			var self = this,
				parent = params.parent,
				stepTemplate = $(monster.template(self, 'servicePlanWizardStep', {
					servicePlans: params.servicePlans,
					isReseller: monster.apps['auth'].isReseller
				}));

				parent.append(stepTemplate);
		},

		renderLimitsStep: function(params) {
			var self = this,
				parent = params.parent,
				formattedClassifiers = $.map(params.classifiers, function(val, key) {
					return {
						id: key,
						name: (self.i18n.active().classifiers[key] || {}).name || val.friendly_name,
						help: (self.i18n.active().classifiers[key] || {}).help,
						checked: true
					};
				}),
				stepTemplate = self.getLimitsTabContent({
					parent: parent,
					formattedClassifiers: formattedClassifiers
				});

			parent.append(stepTemplate);
		},

		renderRestrictionsStep: function(params) {
			var self = this,
				parent = params.parent,
				stepTemplate = self.getRestrictionsTabContent({
					parent: parent
				})

				parent.append(stepTemplate);

				parent.find('[data-toggle="tooltip"]').tooltip();
		},

		changeStep: function(stepIndex, maxStep, parent) {
			var self = this;

			parent.find('.step').removeClass('active');
			parent.find('.step[data-step="'+stepIndex+'"]').addClass('active');

			for(var i = stepIndex; i >= 1; --i) {
				parent.find('.step[data-step="'+i+'"]').addClass('completed');
			}

			parent.find('.wizard-content-step').hide();
			parent.find('.wizard-content-step[data-step="'+ stepIndex +'"]').show();

			parent.find('.cancel').hide();
			parent.find('.prev-step').show();
			parent.find('.next-step').show();
			parent.find('.submit-btn').hide();

			if(stepIndex === maxStep) {
				parent.find('.next-step').hide();
				parent.find('.submit-btn').show();
			}

			if(stepIndex === 1) {
				parent.find('.prev-step').hide();
				parent.find('.cancel').show();
			}

			parent.find('.wizard-top-bar').data('active_step', stepIndex);
		},

		validateStep: function(step, parent, callback) {
			var self = this,
				validated = monster.ui.valid($('#accountsmanager_new_account_form'));/*,
				step = parseInt(step),
				errorMessage = self.i18n.active().wizardErrorMessages.pleaseCorrect,
				formData = form2object('accountsmanager_new_account_form');*/



			// switch(step) {
			// 	case 1:
			// 		if(!formData.account.name) {
			// 			errorMessage += '<br/>- ' + self.i18n.active().wizardErrorMessages.accountMandatoryFields;
			// 			validated = false;
			// 		}
			// 		if(parent.find('.new-admin-div').hasClass('active')) {
			// 			if(!formData.user.first_name || !formData.user.last_name || !formData.user.email) {
			// 				errorMessage += '<br/>- ' + self.i18n.active().wizardErrorMessages.adminMandatoryFields;
			// 				validated = false;
			// 			}
			// 			if(!formData.extra.autogenPassword) {
			// 				if(formData.user.password.length < 6 || !/[A-Za-z]/.test(formData.user.password) || !/[0-9]/.test(formData.user.password)) {
			// 					errorMessage += '<br/>- ' + self.i18n.active().wizardErrorMessages.adminPasswordError;
			// 					validated = false;
			// 				} else if(!formData.user.password || formData.user.password !== formData.extra.confirmPassword) {
			// 					errorMessage += '<br/>- ' + self.i18n.active().wizardErrorMessages.adminPasswordConfirmError;
			// 					validated = false;
			// 				}
			// 			}
			// 		}
			// 		break;
			// 	case 2:
			// 		break;
			// 	case 3:
			// 		if(!/^(\d+(\.\d{1,2})?)?$/.test(formData.addCreditBalance)) {
			// 			errorMessage += '<br/>- ' + self.i18n.active().wizardErrorMessages.incorrectBalanceFormat;
			// 			validated = false;
			// 		} else {
			// 			if(formData.addCreditBalance && parseFloat(formData.addCreditBalance) < 5.0) {
			// 				errorMessage += '<br/>- ' + self.i18n.active().wizardErrorMessages.balanceMinimumAmount;
			// 				validated = false;
			// 			}
			// 		}
			// 		break;
			// 	case 4:
			// 		break;
			// 	default:
			// 		validated = false;
			// 		break;
			// }

			if(validated) {
				callback && callback();
			}/* else {
				monster.ui.alert(errorMessage);
			}*/
		},

		renderEditAdminsForm: function(parent, editAccountId) {
			var self = this,
				editAccountId = editAccountId;
				$settingsItem = parent.find('li.settings-item[data-name="accountsmanager_account_admins"]'),
				closeAdminsSetting = function() {
					$settingsItem.removeClass('open');
					$settingsItem.find('.settings-item-content').hide();
					$settingsItem.find('a.settings-link').show();
				},
				refreshAdminsHeader = function() {
					monster.request({
						resource: 'accountsManager.users.listAdmins',
						data: {
							accountId: editAccountId
						},
						success: function(data, status) {
							$settingsItem.find('.total-admins').text(data.data.length);
							if(data.data.length > 0) {
								data.data = data.data.sort(function(a,b) {
									return (a.first_name+a.last_name).toLowerCase() > (b.first_name+b.last_name).toLowerCase() ? 1 : -1;
								});
								$settingsItem.find('.first-admin-name').text(data.data[0].first_name + " " + data.data[0].last_name);
								$settingsItem.find('.first-admin-email').text(data.data[0].email);
							} else {
								$settingsItem.find('.first-admin-name').text("-");
								$settingsItem.find('.first-admin-email').empty();
							}
						}
					});
				};

			monster.request({
				resource: 'accountsManager.users.list',
				data: {
					accountId: editAccountId,
				},
				success: function(data, status) {
					data.data = data.data.sort(function(a,b) {
						return (a.first_name+a.last_name).toLowerCase() > (b.first_name+b.last_name).toLowerCase() ? 1 : -1;
					});
					var admins = $.map(data.data, function(val) {
							return val.priv_level === "admin" ? val : null;
						}),
						regularUsers = $.map(data.data, function(val) {
							return val.priv_level !== "admin" ? val : null;
						}),
						contentHtml = $(monster.template(self, 'accountsAdminForm', {
							accountAdmins: admins,
							accountUsers: regularUsers
						})),
						$createUserDiv = contentHtml.find('.create-user-div'),
						$adminElements = contentHtml.find('.admin-element'),
						$newAdminBtn = contentHtml.find('#accountsmanager_new_admin_btn'),
						$newAdminElem = contentHtml.find('.new-admin-element');

					contentHtml.find('.close-admin-settings').click(function(e) {
						e.preventDefault();
						closeAdminsSetting();
						e.stopPropagation();
					});

					contentHtml.find('.new-admin-tabs a').click(function(e) {
						e.preventDefault();
						$(this).tab('show');
					});

					$newAdminBtn.click(function(e) {
						e.preventDefault();
						var $this = $(this);
						if(!$this.hasClass('disabled')) {
							if($this.hasClass('active')) {
								$this.find('i').removeClass('icon-caret-up').addClass('icon-caret-down');
								$newAdminElem.slideUp();
							} else {
								$this.find('i').removeClass('icon-caret-down').addClass('icon-caret-up');
								$newAdminElem.slideDown();
							}
						} else {
							e.stopPropagation();
						}
					});

					$createUserDiv.find('input[name="extra.autogen_password"]').change(function(e) {
						$(this).val() === "true" ? $createUserDiv.find('.new-admin-password-div').slideUp() : $createUserDiv.find('.new-admin-password-div').slideDown();
					});

					contentHtml.find('.admin-element-link.delete').click(function(e) {
						e.preventDefault();
						var userId = $(this).parent().parent().data('user_id');
						monster.ui.confirm(self.i18n.active().deleteUserConfirm, function() {
							monster.request({
								resource: 'accountsManager.users.delete',
								data: {
									accountId: editAccountId,
									userId: userId,
									data: {}
								},
								success: function(data, status) {
									self.renderEditAdminsForm(parent, editAccountId);
									refreshAdminsHeader();
								}
							});
						});
					});

					contentHtml.find('.admin-element-link.edit').click(function(e) {
						e.preventDefault();
						var $adminElement = $(this).parent().parent(),
							userId = $adminElement.data('user_id');

						contentHtml.find('.admin-element-edit .admin-cancel-btn').click();

						if($newAdminBtn.hasClass('active')) {
							$newAdminBtn.click();
						}
						$newAdminBtn.addClass('disabled');

						$adminElement.find('.admin-element-display').hide();
						$adminElement.find('.admin-element-edit').show();

					});

					$adminElements.each(function() {
						var $adminElement = $(this),
							userId = $adminElement.data('user_id'),
							$adminPasswordDiv = $adminElement.find('.edit-admin-password-div');

						$adminPasswordDiv.hide();

						$adminElement.find('.admin-cancel-btn').click(function(e) {
							e.preventDefault();
							$adminElement.find('input').each(function() {
								$(this).val($(this).data('original_value'));
							});
							$adminElement.find('.admin-element-display').show();
							$adminElement.find('.admin-element-edit').hide();
							$newAdminBtn.removeClass('disabled');
						});

						$adminElement.find('input[name="email"]').change(function() { $(this).keyup(); });
						$adminElement.find('input[name="email"]').keyup(function(e) {
							var $this = $(this);
							if($this.val() !== $this.data('original_value')) {
								$adminPasswordDiv.slideDown();
							} else {
								$adminPasswordDiv.slideUp(function() {
									$adminPasswordDiv.find('input[type="password"]').val("");
								});
							}
						})

						$adminElement.find('.admin-save-btn').click(function(e) {
							e.preventDefault();
							var form = $adminElement.find('form'),
								formData = form2object(form[0]);

							if(monster.ui.valid(form)) {
								formData = self.cleanFormData(formData);
								if(!$adminPasswordDiv.is(":visible")) {
									delete formData.password;
								}
								monster.request({
									resource: 'accountsManager.users.get',
									data: {
										accountId: editAccountId,
										userId: userId
									},
									success: function(data, status) {
										if(data.data.email !== formData.email) {
											formData.username = formData.email;
										}
										var newData = $.extend(true, {}, data.data, formData);

										monster.request({
											resource: 'accountsManager.users.update',
											data: {
												accountId: editAccountId,
												userId: userId,
												data: newData
											},
											success: function(data, status) {
												self.renderEditAdminsForm(parent, editAccountId);
												refreshAdminsHeader();
											}
										});
									}
								});
							}
						});

					});

					$newAdminElem.find('.admin-cancel-btn').click(function(e) {
						e.preventDefault();
						$newAdminBtn.click();
					});

					$newAdminElem.find('.admin-add-btn').click(function(e) {
						e.preventDefault();
						if($newAdminElem.find('.tab-pane.active').hasClass('create-user-div')) {
							var formData = form2object('accountsmanager_add_admin_form'),
								autoGen = ($createUserDiv.find('input[name="extra.autogen_password"]:checked').val() === "true");

							if(monster.ui.valid(contentHtml.find('#accountsmanager_add_admin_form'))) {
								formData = self.cleanFormData(formData);
								formData.priv_level = "admin";
								formData.username = formData.email;
								if(autoGen) {
									formData.password = self.autoGeneratePassword();
								}

								monster.request({
									resource: 'accountsManager.users.create',
									data: {
										accountId: editAccountId,
										data: formData
									},
									success: function(data, status) {
										self.renderEditAdminsForm(parent, editAccountId);
										refreshAdminsHeader();
									}
								});
								$newAdminBtn.click();
							}
						} else {
							var userId = contentHtml.find('#accountsmanager_promote_user_select option:selected').val();
							monster.request({
								resource: 'accountsManager.users.get',
								data: {
									accountId: editAccountId,
									userId: userId
								},
								success: function(data, status) {
									data.data.priv_level = "admin";
									monster.request({
										resource: 'accountsManager.users.update',
										data: {
											accountId: editAccountId,
											userId: userId,
											data: data.data
										},
										success: function(data, status) {
											self.renderEditAdminsForm(parent, editAccountId);
											refreshAdminsHeader();
										}
									});
								}
							});
							$newAdminBtn.click();
						}
					});

					parent.find('#form_accountsmanager_account_admins').empty().append(contentHtml);

					$.each(contentHtml.find('form'), function() {
						monster.ui.validate($(this), {
							rules: {
								'extra.password_confirm': {
									equalTo: 'input[name="password"]'
								}
							},
							messages: {
								'extra.password_confirm': {
									equalTo: self.i18n.active().validationMessages.invalidPasswordConfirm
								}
							},
							errorPlacement: function(error, element) {
								error.appendTo(element.parent());
							}
						});
					});

				}
			});
		},

		edit: function(accountId, parent) {
			var self = this;

			monster.parallel({
					account: function(callback) {
						monster.request({
							resource: 'accountsManager.get',
							data: {
								accountId: accountId
							},
							success: function(data, status) {
								callback(null, data.data);
							}
						});
					},
					users: function(callback) {
						monster.request({
							resource: 'accountsManager.users.list',
							data: {
								accountId: accountId
							},
							success: function(data, status) {
								callback(null, data.data);
							}
						});
					},
					listServicePlans: function(callback) {
						monster.request({
							resource: 'accountsManager.servicePlans.list',
							data: {
								accountId: accountId
							},
							success: function(data, status) {
								callback(null, data.data);
							}
						});
					},
					currentServicePlan: function(callback) {
						monster.request({
							resource: 'accountsManager.servicePlans.current',
							data: {
								accountId: accountId
							},
							success: function(data, status) {
								if(!$.isEmptyObject(data.data.plans)) {
									monster.request({
										resource: 'accountsManager.servicePlans.get',
										data: {
											accountId: accountId,
											planId: Object.keys(data.data.plans)[0]
										},
										success: function(data, status) {
											callback(null, {
												id: data.data.id,
												name: data.data.name
											});
										}
									});
								} else {
									callback(null, {});
								}
							}
						});
					},
					limits: function(callback) {
						monster.request({
							resource: 'accountsManager.limits.get',
							data: {
								accountId: accountId
							},
							success: function(data, status) {
								callback(null, data.data);
							}
						});
					},
					classifiers: function(callback) {
						monster.request({
							resource: 'accountsManager.classifiers.get',
							data: {
								accountId: accountId
							},
							success: function(data, status) {
								callback(null, data.data);
							}
						});
					},
					currentBalance: function(callback) {
						monster.request({
							resource: 'accountsManager.balance.get',
							data: {
								accountId: accountId
							},
							success: function(data, status) {
								callback(null, data.data);
							}
						});
					}
				},
				function(err, results) {
					var servicePlans = {
							current: results.currentServicePlan,
							list: results.listServicePlans
						},
						params = {
							accountData: results.account,
							accountUsers: results.users.sort(function(a,b) {
								return (a.first_name+a.last_name).toLowerCase() > (b.first_name+b.last_name).toLowerCase() ? 1 : -1;
							}),
							servicePlans: servicePlans,
							accountLimits: results.limits,
							classifiers: results.classifiers,
							accountBalance: 'balance' in results.currentBalance ? results.currentBalance.balance : 0,
							parent: parent
						};

					self.editAccount(params);
				}
			);
		},

		/** Expected params:
			- accountData
			- accountUsers
			- servicePlans
			- accountLimits
			- classifiers (call restriction)
			- parent
			- callback [optional]
		*/
		editAccount: function(params) {
			var self = this,
				accountData = params.accountData,
				accountUsers = params.accountUsers,
				servicePlans = params.servicePlans,
				accountLimits = params.accountLimits,
				accountBalance = params.accountBalance,
				parent = params.parent,
				callback = params.callback,
				admins = $.map(accountUsers, function(val) {
					return val.priv_level === "admin" ? val : null;
				}),
				regularUsers = $.map(accountUsers, function(val) {
					return val.priv_level !== "admin" ? val : null;
				}),
				formattedClassifiers = $.map(params.classifiers, function(val, key) {
					var ret = {
						id: key,
						name: (self.i18n.active().classifiers[key] || {}).name || val.friendly_name,
						help: (self.i18n.active().classifiers[key] || {}).help,
						checked: true
					};
					if(accountLimits.call_restriction
						&& key in accountLimits.call_restriction
						&& accountLimits.call_restriction[key].action === "deny") {
						ret.checked = false;
					}
					return ret;
				}),
				templateData = {
					account: $.extend(true, {}, accountData),
					accountAdmins: admins,
					accountUsers: regularUsers,
					accountServicePlans: servicePlans,
					isReseller: monster.apps['auth'].isReseller,
					wysiwygColorList: [
						'ffffff','000000','eeece1','1f497d','4f81bd','c0504d','9bbb59','8064a2','4bacc6','f79646','ffff00',
						'f2f2f2','7f7f7f','ddd9c3','c6d9f0','dbe5f1','f2dcdb','ebf1dd','e5e0ec','dbeef3','fdeada','fff2ca',
						'd8d8d8','595959','c4bd97','8db3e2','b8cce4','e5b9b7','d7e3bc','ccc1d9','b7dde8','fbd5b5','ffe694',
						'bfbfbf','3f3f3f','938953','548dd4','95b3d7','d99694','c3d69b','b2a2c7','b7dde8','fac08f','f2c314',
						'a5a5a5','262626','494429','17365d','366092','953734','76923c','5f497a','92cddc','e36c09','c09100',
						'7f7f7f','0c0c0c','1d1b10','0f243e','244061','632423','4f6128','3f3151','31859b','974806','7f6000'
					]
				};

			if($.isNumeric(templateData.account.created)) {
				templateData.account.created = monster.util.toFriendlyDate(accountData.created, "short");
			}

			var contentHtml = $(monster.template(self, 'edit', templateData)),
				$liSettings = contentHtml.find('li.settings-item'),
				$liContent = $liSettings.find('.settings-item-content'),
				$aSettings = $liSettings.find('a.settings-link'),
				closeTabsContent = function() {
					$liSettings.removeClass('open');
					$liContent.slideUp('fast');
					$aSettings.find('.update .text').text(self.i18n.active().editSetting);
					$aSettings.find('.update i').removeClass('icon-remove').addClass('icon-cog');
				},
				notesTab = contentHtml.find('#accountsmanager_notes_tab');

			contentHtml.find('.account-tabs a').click(function(e) {
				e.preventDefault();
				if(!$(this).parent().hasClass('disabled')) {
					closeTabsContent();
					$(this).tab('show');
				}
			});

			contentHtml.find('li.settings-item .settings-link').on('click', function(e) {
				var $this = $(this),
					settingsItem = $this.parents('.settings-item');

				if(!settingsItem.hasClass('disabled')) {
					var isOpen = settingsItem.hasClass('open');
					closeTabsContent();
					if(!isOpen){
						settingsItem.addClass('open');
						$this.find('.update .text').text(self.i18n.active().closeSetting);
						$this.find('.update i').removeClass('icon-cog').addClass('icon-remove');
						settingsItem.find('.settings-item-content').slideDown('fast');

						if(settingsItem.data('name') === 'accountsmanager_account_admins') {
							self.renderEditAdminsForm(parent, accountData.id);
						}
					}
				}
			});

			contentHtml.find('.settings-item .cancel').on('click', function(e) {
				e.preventDefault();
				closeTabsContent();

				$(this).parents('form').first().find('input, select').each(function(k, v) {
					$(v).val($(v).data('original_value'));
				});

				e.stopPropagation();
			});

			contentHtml.find('#accountsmanager_delete_account_btn').on('click', function(e) {
				e.preventDefault();

				monster.ui.confirm(self.i18n.active().deleteAccountConfirm, function() {
					monster.request({
						resource: 'accountsManager.delete',
						data: {
							accountId: accountData.id,
							data: {}
						},
						success: function(data, status) {
							// self.render();
							parent.find('.main-content').empty();
							parent.find('.account-list-element[data-account_id="'+accountData.id+'"]').remove();
							delete self.findAccountInTree(self.accountTree, accountData.id).accountList[accountData.id];
						},
						error: function(data, status) {
							toastr.error(self.i18n.active().toastrMessages.deleteAccountError, '', {"timeOut": 5000});
						}
					});
				});

				e.stopPropagation();
			});

			contentHtml.find('#accountsmanager_use_account_btn').on('click', function(e) {
				e.preventDefault();

				self.triggerMasquerading(accountData);

				e.stopPropagation();
			});

			contentHtml.find('.change').on('click', function(e) {
				e.preventDefault();

				var $this = $(this),
					module = $this.data('module'),
					fieldName = $this.data('field'),
					newData = self.cleanFormData(form2object('form_'+fieldName));

				if(monster.ui.valid(contentHtml.find('#form_'+fieldName))) {
					self.updateData(accountData, newData,
						function(data) {
							params.accountData = data.data;
							params.callback = function(parent) {
								var $link = parent.find('li[data-name='+fieldName+']');

								$link.find('.update').hide();
								$link.find('.changes-saved').show()
														  .fadeOut(1500, function() {
															  $link.find('.update').fadeIn(500);
														  });

								$link.css('background-color', '#22ccff')
									   .animate({
										backgroundColor: '#eee'
									}, 2000
								);

								parent.find('.settings-item-content').hide();
								parent.find('a.settings-link').show();
							};

							self.editAccount(params);

							if(self.currentAccountList) {
								self.currentAccountList[data.data.id].name = data.data.name;
								self.currentAccountList[data.data.id].realm = data.data.realm;
								self.renderList(self.currentAccountList, parent, data.data.id);
							}
						},
						function(data) {
							if(data && data.data && 'api_error' in data.data && 'message' in data.data.api_error) {
								monster.ui.alert(data.data.api_error.message);
							}
						}
					);
				}
			});

			// If reseller
			if(monster.apps['auth'].isReseller) {
				var $btn_save = contentHtml.find('#accountsmanager_serviceplan_save'),
					$btn_rec = contentHtml.find('#accountsmanager_serviceplan_reconciliation'),
					$btn_sync = contentHtml.find('#accountsmanager_serviceplan_synchronization');

				$btn_save.click(function(e) {
					e.preventDefault();
					if(!$btn_save.hasClass('disabled')) {
						$btn_save.addClass('disabled');
						var newPlanId = contentHtml.find('#accountsmanager_serviceplan_select').val(),
							success = function() {
								toastr.success(self.i18n.active().toastrMessages.servicePlanUpdateSuccess, '', {"timeOut": 5000});
								$btn_save.removeClass('disabled');
							},
							error = function() {
								toastr.error(self.i18n.active().toastrMessages.servicePlanUpdateError, '', {"timeOut": 5000});
								$btn_save.removeClass('disabled');
							};
						if(servicePlans.current.id) {
							monster.request({
								resource: 'accountsManager.servicePlans.delete',
								data: {
									accountId: accountData.id,
									planId: servicePlans.current.id,
									data: {}
								},
								success: function(data, status) {
									if (newPlanId) {
										monster.request({
											resource: 'accountsManager.servicePlans.add',
											data: {
												accountId: accountData.id,
												planId: newPlanId,
												data: {}
											},
											success: function(data, status) {
												success();
											},
											error: function(data, status) {
												error();
											}
										});
									} else {
										success();
									}
								},
								error: function(data, status) {
									error();
								}
							});
						} else if (newPlanId) {
							monster.request({
								resource: 'accountsManager.servicePlans.add',
								data: {
									accountId: accountData.id,
									planId: newPlanId,
									data: {}
								},
								success: function(data, status) {
									success();
								},
								error: function(data, status) {
									error();
								}
							});
						} else {
							$btn_save.removeClass('disabled');
						}
					}
				});

				$btn_rec.click(function(e) {
					e.preventDefault();
					if(!$btn_rec.hasClass('disabled') && !$btn_sync.hasClass('disabled')) {
						$btn_rec.addClass('disabled');
						$btn_sync.addClass('disabled');
						monster.request({
							resource: 'accountsManager.servicePlans.reconciliation',
							data: {
								accountId: accountData.id,
								data: {}
							},
							success: function(data, status) {
								toastr.success(self.i18n.active().toastrMessages.servicePlanReconciliationSuccess, '', {"timeOut": 5000});
								$btn_rec.removeClass('disabled');
								$btn_sync.removeClass('disabled');
							},
							error: function(data, status) {
								toastr.error(self.i18n.active().toastrMessages.servicePlanReconciliationError, '', {"timeOut": 5000});
								$btn_rec.removeClass('disabled');
								$btn_sync.removeClass('disabled');
							}
						});
					}

				});

				$btn_sync.click(function(e) {
					e.preventDefault();
					if(!$btn_rec.hasClass('disabled') && !$btn_sync.hasClass('disabled')) {
						$btn_rec.addClass('disabled');
						$btn_sync.addClass('disabled');
						monster.request({
							resource: 'accountsManager.servicePlans.synchronization',
							data: {
								accountId: accountData.id,
								data: {}
							},
							success: function(data, status) {
								toastr.success(self.i18n.active().toastrMessages.servicePlanSynchronizationSuccess, '', {"timeOut": 5000});
								$btn_rec.removeClass('disabled');
								$btn_sync.removeClass('disabled');
							},
							error: function(data, status) {
								toastr.error(self.i18n.active().toastrMessages.servicePlanSynchronizationError, '', {"timeOut": 5000});
								$btn_rec.removeClass('disabled');
								$btn_sync.removeClass('disabled');
							}
						});
					}
				});
			}

			timezone.populateDropdown(contentHtml.find('#accountsmanager_account_timezone'), accountData.timezone);

			contentHtml.find('#accountsmanager_account_timezone').chosen({search_contains: true, width: "100%"});

			self.renderLimitsTab({
				accountData: accountData,
				limits: accountLimits,
				balance: accountBalance,
				formattedClassifiers: formattedClassifiers,
				parent: contentHtml.find('#accountsmanager_limits_tab')
			});

			self.renderRestrictionsTab({
				accountData: accountData,
				parent: contentHtml.find('#accountsmanager_restrictions_tab')
			});

			monster.ui.prettyCheck.create(contentHtml);

			monster.ui.validate(contentHtml.find('#form_accountsmanager_account_realm'), {
				rules: {
					'realm': {
						'realm': true
					}
				}
			});

			parent.find('.main-content').empty()
										.append(contentHtml);

			notesTab.find('a[title]').tooltip({container:'body'});
			notesTab.find('div.dropdown-menu input')
					.on('click', function () {
						return false;
					})
					.change(function () {
						$(this).parents('div.dropdown-menu').siblings('a.dropdown-toggle').dropdown('toggle');
					})
					.keydown('esc', function () {
						this.value='';
						$(this).change();
					}
			);
			notesTab.find('#editor').wysiwyg();
			notesTab.find('#editor').html(accountData.custom_notes);
			notesTab.find('#accountsmanager_notes_save').on('click', function() {
				var notesContent = notesTab.find('#editor').html();
				self.updateData(
					accountData,
					{ custom_notes: notesContent },
					function(data, status) {
						accountData = data.data;
						toastr.success(self.i18n.active().toastrMessages.notesUpdateSuccess, '', {"timeOut": 5000});
					},
					function(data, status) {
						toastr.error(self.i18n.active().toastrMessages.notesUpdateError, '', {"timeOut": 5000});
					}
				);
			});

			// self.adjustTabsWidth(contentHtml.find('ul.account-tabs > li'));

			$.each(contentHtml.find('form'), function() {
				var options = {};
				if(this.id === 'accountsmanager_callrestrictions_form') {
					options.rules = {
						'addCreditBalance': {
							number: true,
							min: 5
						}
					};
				}
				monster.ui.validate($(this), options);
			});

			if(typeof callback === 'function') {
				callback(contentHtml);
			}
		},

		/** Expected params:
			- accountData
			- limits
			- balance
			- formattedClassifiers
			- parent
		*/
		renderLimitsTab: function(params) {
			var self = this,
				parent = params.parent,
				limits = params.limits,
				balance = params.balance,
				accountData = params.accountData,
				tabContentTemplate = self.getLimitsTabContent(params),
				creditBalanceSpan = tabContentTemplate.find('.manage-credit-div .credit-balance'),
				addCreditInput = tabContentTemplate.find('.add-credit-input');

			creditBalanceSpan.html(self.i18n.active().currencyUsed+balance);
			parent.find('#accountsmanager_limits_save').click(function(e) {
				e.preventDefault();

				var newTwowayValue = twowayTrunksDiv.find('.slider-div').slider('value'),
					newInboundValue = inboundTrunksDiv.find('.slider-div').slider('value'),
					callRestrictions = form2object('accountsmanager_callrestrictions_form').limits.call_restriction,
					addCredit = addCreditInput.val(),
					allowPrepay = tabContentTemplate.find('.allow-prepay-ckb').is(':checked');

				if(monster.ui.valid(parent.find('#accountsmanager_callrestrictions_form'))) {

					$.each(params.formattedClassifiers, function(k, v) {
						if(!(v.id in callRestrictions) || callRestrictions[v.id].action !== "allow") {
							callRestrictions[v.id] = {
								action: "deny"
							};
						}
					});

					monster.ui.confirm(self.i18n.active().chargeReminder.line1 + '<br/><br/>' + self.i18n.active().chargeReminder.line2,
						function() {

							monster.request({
								resource: 'accountsManager.limits.update',
								data: {
									accountId: accountData.id,
									data: $.extend(true, {}, limits, {
										twoway_trunks: newTwowayValue,
										inbound_trunks: newInboundValue,
										allow_prepay: allowPrepay,
										call_restriction: callRestrictions
									})
								},
								success: function(data, status) {
									toastr.success(self.i18n.active().toastrMessages.limitsUpdateSuccess, '', {"timeOut": 5000});
								},
								error: function(data, status) {
									toastr.error(self.i18n.active().toastrMessages.limitsUpdateError, '', {"timeOut": 5000});
								}
							});

							if(addCredit) {
								monster.request({
									resource: 'accountsManager.balance.add',
									data: {
										accountId: accountData.id,
										data: {
											amount: parseFloat(addCredit)
										}
									},
									success: function(data, status) {
										balance += parseFloat(addCredit);
										creditBalanceSpan.html(self.i18n.active().currencyUsed+balance);
										addCreditInput.val('');
										toastr.success(self.i18n.active().toastrMessages.creditAddSuccess, '', {"timeOut": 5000});
									},
									error: function(data, status) {
										toastr.error(self.i18n.active().toastrMessages.creditAddError, '', {"timeOut": 5000});
									}
								});
							}
						}
					);

				}

			});

			parent.find('#accountsmanager_callrestrictions_form').append(tabContentTemplate);
		},

		/**
		 * This function is shared by both the edition tab and the creation wizard step.
		 */
		getLimitsTabContent: function(params) {
			var self = this,
				formattedClassifiers = params.formattedClassifiers,
				limits = params.limits || {};
				template = $(monster.template(self, 'limitsTabContent', {
					classifiers: formattedClassifiers,
					allowPrepay: limits.allow_prepay
				})),
				amountTwoway = 29.99,
				twoway = limits.twoway_trunks || 0,
				totalAmountTwoway = amountTwoway * twoway,
				twowayTrunksDiv = template.find('.trunks-div.twoway'),
				amountInbound = 6.99,
				inbound = limits.inbound_trunks || 0,
				totalAmountInbound = amountInbound * inbound,
				inboundTrunksDiv = template.find('.trunks-div.inbound'),
				createSlider = function(args) {
					var trunksDiv = args.trunksDiv,
						sliderValue = trunksDiv.find('.slider-value'),
						totalAmountValue = trunksDiv.find('.total-amount .total-amount-value'),
						trunksValue = trunksDiv.find('.trunks-value');
					trunksDiv.find('.slider-div').slider({
						min: args.minValue,
						max: args.maxValue,
						range: 'min',
						value: args.currentValue,
						slide: function(event, ui) {
							var totalAmount = ui.value * args.amount;
							sliderValue.html(ui.value);
							totalAmountValue.html(totalAmount.toFixed(2));
							trunksValue.val(ui.value);
						}
					});
				};

			createSlider({
				trunksDiv: twowayTrunksDiv,
				minValue: 0,
				maxValue: 100,
				currentValue: twoway,
				amount: amountTwoway
			});

			createSlider({
				trunksDiv: inboundTrunksDiv,
				minValue: 0,
				maxValue: 100,
				currentValue: inbound,
				amount: amountInbound
			});

			twowayTrunksDiv.find('.slider-value').html(twoway);
			twowayTrunksDiv.find('.total-amount .total-amount-value').html(totalAmountTwoway.toFixed(2));
			inboundTrunksDiv.find('.slider-value').html(inbound);
			inboundTrunksDiv.find('.total-amount .total-amount-value').html(totalAmountInbound.toFixed(2));
			$.each(template.find('.trunks-div'), function() {
				var $this = $(this);
				$this.find('.ui-slider-handle').append($this.find('.section-slider-value'));
			});

			template.find('[data-toggle="tooltip"]').tooltip();

			return template;
		},

		/** Expected params:
			- accountData
			- parent
		*/
		renderRestrictionsTab: function(params) {
			var self = this,
				parent = params.parent,
				accountData = params.accountData,
				tabContentTemplate = self.getRestrictionsTabContent(params);

			parent.find('#accountsmanager_uirestrictions_form').append(tabContentTemplate);

			parent.find('[data-toggle="tooltip"]').tooltip();

			parent.find('#accountsmanager_uirestrictions_save').click(function(event) {
				event.preventDefault();

				var UIRestrictions = form2object('accountsmanager_uirestrictions_form').account;

				self.updateData(accountData, UIRestrictions,
					function(data, status) {
						toastr.success(self.i18n.active().toastrMessages.uiRestrictionsUpdateSuccess, '', {"timeOut": 5000});
					},
					function(data, status) {
						toastr.error(self.i18n.active().toastrMessages.uiRestrictionsUpdateError, '', {"timeOut": 5000});
					}
				);
			});
		},

		getRestrictionsTabContent: function(params) {
			var self = this,
				template = $(monster.template(self, 'restrictionsTabContent', {
					account: params.accountData
				}));

			template.find('.restrictions-element input').each(function() {
				if ($(this).is(':checked')) {
					$(this).closest('a').addClass('enabled');
				} else {
					$(this).closest('a').removeClass('enabled');
				};
			});

			template.find('.restrictions-element input').on('ifToggled', function(e) {
				var $this = $(this),
					restrictionElement = $this.closest('li'),
					restrictionType = (restrictionElement.data('content')) ? restrictionElement.data('content') : false;
				if ($this.is(':checked')) {
					$this.closest('a').addClass('enabled');

					monster.ui.prettyCheck.action(template.find('.restrictions-right .' + restrictionType + ' input'), 'check');
				} else {
					$this.closest('a').removeClass('enabled');

					monster.ui.prettyCheck.action(template.find('.restrictions-right .' + restrictionType + ' input'), 'uncheck');
				};
					restrictionElement.click();
			});

			template.find('.restrictions-element[data-content]').on('click', function() {
				var $this = $(this),
					restrictionType = $this.data('content');

				if ($this.find('input').is(':checked')) {
					template.find('.restrictions-menu .restrictions-element').each(function() {
						$(this).removeClass('active');
					});
					template.find('.restrictions-right > div').each(function() {
						$(this).removeClass('active');
					});

					template.find('.restrictions-right .' + restrictionType).addClass('active');
					$this.addClass('active');
				} else {
					template.find('.restrictions-right .' + restrictionType).removeClass('active');
					$this.removeClass('active');
				}
			});

			template.find('.restrictions-right input').on('ifToggled', function(e) {
				var restrictionsContainer = $(this).parents().eq(2),
					isChecked = false;

				if ( restrictionsContainer.data('content') != 'restrictions-balance' ) {
					restrictionsContainer.find('input').each(function() {
						if ($(this).is(':checked')) {
							isChecked = true;
						}
					});

					if (!isChecked) {
						monster.ui.prettyCheck.action(template.find('.restrictions-menu li[data-content="' + restrictionsContainer.data('content') + '"] input'), 'uncheck');
					}
				}
			});

			return template;
		},

		adjustTabsWidth: function($tabs) {
			var maxWidth = 0;
			$.each($tabs, function() {
				if($(this).width() > maxWidth) { maxWidth = $(this).width(); }
			});
			$tabs.css('min-width',maxWidth+'px');
		},

		cleanMergedData: function(data) {
			var self = this;

			if('reseller' in data) {
				delete data.reseller;
			}

			if('language' in data) {
				if(data.language === 'auto') {
					delete data.language;
				}
			}

			return data;
		},

		cleanFormData: function(formData) {
			if('enabled' in formData) {
				formData.enabled = formData.enabled === 'false' ? false : true;
			}

			delete formData.extra;

			return formData;
		},

		updateData: function(data, newData, success, error) {
			var self = this,
				dataToUpdate = $.extend(true, {}, data, newData);

			dataToUpdate = self.cleanMergedData(dataToUpdate);

			monster.request({
				resource: 'accountsManager.update',
				data: {
					accountId: data.id,
					data: dataToUpdate
				},
				success: function(_data, status) {
					success && success(_data, status);
				},
				error: function(_data, status) {
					error && error(_data, status);
				}
			});
		},

		autoGeneratePassword: function() {
			return monster.util.randomString(4,'abcdefghjkmnpqrstuvwxyz')+monster.util.randomString(4,'0123456789');
		},

		triggerMasquerading: function(account) {
            var self = this;

            monster.apps['auth'].currentAccount = $.extend(true, {}, account);
            self.updateApps(account.id);

            monster.pub('myaccount.renderNavLinks', {
				name: account.name,
				isMasquerading: true
			});

			self.render();
        },

        updateApps: function(accountId) {
            $.each(monster.apps, function(key, val) {
                if( (val.isMasqueradable && val.apiUrl === monster.apps['accounts'].apiUrl) || key === 'auth' ) {
                    val.accountId = accountId;
                }
            });
        },

        _restoreMasquerading: function() {
            var self = this;

            monster.apps['auth'].currentAccount = $.extend(true, {}, monster.apps['auth'].originalAccount);
            self.updateApps(monster.apps['auth'].originalAccount.id);

            monster.pub('myaccount.renderNavLinks');

			self.render();
        }


	};

	return app;
});
