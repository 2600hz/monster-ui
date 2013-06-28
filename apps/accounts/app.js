define(function(require){
	var $ = require('jquery'),
		_ = require('underscore'),
		monster = require('monster'),
		toastr = require('toastr'),
		timezone = require('monster-timezone'),
		nicescroll = require('nicescroll');

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
				url: 'accounts',
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
			}
		},

		subscribe: {
			'accountsManager.activate': '_render'
		},

		load: function(callback) {
			var self = this;

			self.whappAuth(function() {
				callback && callback(self);
			});
		},

		whappAuth: function(callback) {
			var self = this;

			monster.pub('auth.sharedAuth', {
				app: self,
				callback: callback
			});
		},

		render: function(container){
			var self = this;

			self._render(container);
		},

		// subscription handlers
		_render: function(container) {
			var self = this,
				accountsManager = $(monster.template(self, 'accountsManager')),
				parent = container || $('#ws-content');

			(parent)
				.empty()
				.append(accountsManager);

			self.loadAccountList(function() {
				self.renderAccountsManager(accountsManager);
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

		renderAccountsManager: function(parent) {
			var self = this,
				originalAccountList = self.accountTree[self.accountId].children;

			// Adjusting the layout divs height to always fit the window's size
			$(window).resize(function(e) {
				var $accountList = parent.find('.account-list'),
					$accountListSlider = parent.find('.account-list-slider'),
					$mainContent = parent.find('.main-content'),
					height = this.innerHeight-$accountList.position().top+'px';
				$accountList.css('height', height);
				$accountListSlider.css('height', height);
				$mainContent.css('height', height);
			});
			$(window).resize();

			parent.find('#account_search_input').keyup(function(e) {
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

			parent.find('#main_account_link').click(function(e) {
				e.preventDefault();
				self.render();
			});

			parent.find('#add_account_link').click(function(e) {
				e.preventDefault();
				self.renderNewAccountWizard({
					parent: parent
				});
			});

			self.renderList(originalAccountList, parent);
			parent.find('#main_account_link').html(self.accountTree[self.accountId].name);

			parent.find('.account-list').niceScroll({
				cursorcolor:"#333",
				cursoropacitymin:0.5,
				hidecursordelay:1000
			});
		},

		renderList: function(accountList, parent, slide) {
			var self = this,
				accountListHtml = $(monster.template(self, 'accountsList', {
					accounts: $.map(accountList, function(val, key) {
						val.id = key;
						return val;
					}),
					selectedId: self.editAccountId
				})),
				$list = parent.find('.account-list'),
				$slider = parent.find('.account-list-slider'),
				bindLinkClicks = function() {
					$list.find('.account-children-link').click(function() {
						var acc_id = $(this).parent().data('account_id'),
							$breadcrumbs = parent.find('.account-breadcrumbs'),
							breadcrumbStep = $breadcrumbs.find('.account-breadcrumb').length+1,
							$breadcrumb = $(monster.template(self, 'accountsBreadcrumb', {
								name: accountList[acc_id].name,
								step: breadcrumbStep
							}));

						$breadcrumbs.append($breadcrumb);
						$breadcrumb.find('a').click(function(e) {
							e.preventDefault();
							self.renderList(accountList[acc_id].children, parent, false);
							$.each($breadcrumbs.find('.account-breadcrumb'), function() {
								if(parseInt($(this).data('step'),10) > breadcrumbStep) {
									$(this).remove();
								}
							});
							parent.find('.main-content').empty();
						});

						self.renderList(accountList[acc_id].children, parent, true);
					});

					$list.find('.account-link').click(function() {
						self.edit($(this).parent().data('account_id'), parent);
						self.renderList(accountList, parent, false);
					});
				};

			if(slide) {
				$slider.empty()
					   .append(accountListHtml);

				$list.animate({ marginLeft: -$list.outerWidth() }, 400, "swing", function() {
					$list.empty()
						 .append($slider.html())
						 .css('marginLeft','0px');
					$slider.empty();

					bindLinkClicks();
				});

			} else {
				$list.empty().append(accountListHtml);

				bindLinkClicks();
			}

			$('#account_search_input').val("").keyup();
		},

		renderNewAccountWizard: function(params) {
			var self = this,
				parent = params.parent,
				newAccountWizard = $(monster.template(self, 'newAccountWizard', {

				})),
				maxStep = parseInt(newAccountWizard.find('.wizard-top-bar').data('max_step'));

			newAccountWizard.find('.wizard-top-bar').data('active_step', '1');

			newAccountWizard.find('.wizard-content-step').hide();
			newAccountWizard.find('.wizard-content-step[data-step="1"]').show();

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
				if($(this).hasClass('completed')) {
					self.validateStep(currentStep, 
									  newAccountWizard.find('.wizard-content-step[data-step="'+currentStep+'"]'), 
									  function() {
						self.changeStep(newStep, maxStep, newAccountWizard);
					});
				}
			});

			newAccountWizard.find('.next-step').on('click', function(ev) {
				ev.preventDefault();

				var currentStep = parseInt(newAccountWizard.find('.wizard-top-bar').data('active_step'));
				self.validateStep(currentStep, newAccountWizard.find('.wizard-content-step[data-step="'+currentStep+'"]'), function() {
					self.changeStep(++currentStep, maxStep, newAccountWizard);
				});
			});

			newAccountWizard.find('.prev-step').on('click', function(ev) {
				ev.preventDefault();

				var currentStep = parseInt(newAccountWizard.find('.wizard-top-bar').data('active_step'));
				self.changeStep(--currentStep, maxStep, newAccountWizard);
			});

			newAccountWizard.find('.cancel').on('click', function(ev) {
				ev.preventDefault();

				parent.find('.edition-view').show();
				parent.find('.account-list').getNiceScroll()[0].resize();

				parent.find('.creation-view').empty();
			});

			newAccountWizard.find('.submit-btn').on('click', function(ev) {
				ev.preventDefault();

				var currentStep = parseInt(newAccountWizard.find('.wizard-top-bar').data('active_step'));
				self.validateStep(currentStep, newAccountWizard.find('.wizard-content-step[data-step="'+currentStep+'"]'), function() {

					var formData = form2object('accountsmanager_new_account_form');

					$.each(formData.limits.call_restriction, function(k, v) {
						if(v.action === false) { v.action = "deny"; }
					});

					//TODO: submit new account
					monster.request({
						resource: 'accountsManager.create', 
						data: {
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
												twoway_trunks: parseInt(formData.limits.twoway_trunks, 10)
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
											console.log('get limits error');
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
								}
							},
							function(err, results) {
								console.log('SUCCESS!');
							},
							function(err, results) {
								console.log('ERROR!');
							});

							self.render();
						},
						error: function(data, status) {
							toastr.error(self.i18n.active().toastrMessages.newAccount.accountError, '', {"timeOut": 5000});
						}
					});

				});
			});

			self.renderWizardSteps(newAccountWizard);


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
				}
			);
		},

		renderRestrictionsStep: function(params) {
			var self = this,
				parent = params.parent;/*,
				stepTemplate = self.getRestrictionsTabContent({
					parent: parent
				})
				//TODO create getRestrictionsTabContent
				parent.append(stepTemplate);*/
		},

		renderLimitsStep: function(params) {
			var self = this,
				parent = params.parent,
				formattedClassifiers = $.map(params.classifiers, function(val, key) {
					return {
						id: key,
						name: val.friendly_name,
						checked: true
					};
				}),
				stepTemplate = self.getLimitsTabContent({
					parent: parent,
					formattedClassifiers: formattedClassifiers
				})

				parent.append(stepTemplate);
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

		renderAccountInfoStep: function(params) {
			var self = this,
				parent = params.parent,
				autogenSwitch = parent.find('#accountsmanager_autogen_switch');

			timezone.populateDropdown(parent.find('#accountsmanager_new_account_timezone'));

			parent.find('.add-admin-toggle > a').on('click', function(e) {
				e.preventDefault();
				var newAdminDiv = parent.find('.new-admin-div');
				if(newAdminDiv.hasClass('active')) {
					newAdminDiv.slideUp();
					newAdminDiv.removeClass('active');
					newAdminDiv.find('input[type="text"], input[type="email"]').val('');
					autogenSwitch.bootstrapSwitch('setState', true);
				} else {
					newAdminDiv.slideDown();
					newAdminDiv.addClass('active');
				}
			});

			autogenSwitch.bootstrapSwitch();
			autogenSwitch.on('switch-change', function(e, data) {
				var pwdToggleDiv = parent.find('.password-toggle-div');
				if(data.value) {
					pwdToggleDiv.find('input[type=password]').val('');
					pwdToggleDiv.slideUp();
				} else {
					pwdToggleDiv.slideDown();
				}
			});
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
				validated = true,
				step = parseInt(step),
				errorMessage = self.i18n.active().wizardErrorMessages.pleaseCorrect,
				formData = form2object('accountsmanager_new_account_form');

			switch(step) {
				case 1: 
					if(!formData.account.name || !formData.account.realm) {
						errorMessage += '<br/>- ' + self.i18n.active().wizardErrorMessages.accountMandatoryFields;
						validated = false;
					}
					if(parent.find('.new-admin-div').hasClass('active')) {
						if(!formData.user.first_name || !formData.user.last_name || !formData.user.email) {
							errorMessage += '<br/>- ' + self.i18n.active().wizardErrorMessages.adminMandatoryFields;
							validated = false;
						}
						if(!formData.extra.autogenPassword) {
							if(formData.user.password.length < 6 || !/[A-Za-z]/.test(formData.user.password) || !/[0-9]/.test(formData.user.password)) {
								errorMessage += '<br/>- ' + self.i18n.active().wizardErrorMessages.adminPasswordError;
								validated = false;
							} else if(!formData.user.password || formData.user.password !== formData.extra.confirmPassword) {
								errorMessage += '<br/>- ' + self.i18n.active().wizardErrorMessages.adminPasswordConfirmError;
								validated = false;
							}
						}
					}
					break;
				case 2:
					break;
				case 3: 
					if(!/^(\d+(\.\d{1,2})?)?$/.test(formData.addCreditBalance)) {
						errorMessage += '<br/>- ' + self.i18n.active().wizardErrorMessages.incorrectBalanceFormat;
						validated = false;
					} else {
						if(formData.addCreditBalance && parseFloat(formData.addCreditBalance) < 5.0) {
							errorMessage += '<br/>- ' + self.i18n.active().wizardErrorMessages.balanceMinimumAmount;
							validated = false;
						}
					}
					break;
				case 4:
					break;
				default:
					validated = false;
					break;
			}

			if(validated) {
				callback && callback();
			} else {
				monster.ui.alert(errorMessage);
			}
		},

		renderEditAdminsForm: function(parent) {
			var self = this,
				$settingsItem = parent.find('li.settings-item[data-name="accountsmanager_account_admins"]'),
				closeAdminsSetting = function() {
					$settingsItem.removeClass('open');
					$settingsItem.find('.settings-item-content').hide();
					$settingsItem.find('a.settings-link').show();
				};

			monster.request({
				resource: 'accountsManager.users.list',
				data: {
					accountId: self.editAccountId,
				},
				success: function(data, status) {
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
									accountId: self.editAccountId,
									userId: userId
								},
								success: function(data, status) {
									self.renderEditAdminsForm(parent);
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
							var formData = form2object($adminElement.find('form')[0]);
							
							if(!(formData.first_name && formData.last_name && formData.email)) {
								monster.alert('error',self.i18n.active().wizardErrorMessages.adminMandatoryFields);
							} else if($adminPasswordDiv.is(":visible")
									&& (formData.password.length < 6 
										|| /\s/.test(formData.password) 
										|| !/\d/.test(formData.password) 
										|| !/[A-Za-z]/.test(formData.password) 
										)
									) {
								monster.alert('error',self.i18n.active().wizardErrorMessages.adminPasswordError);
							} else if($adminPasswordDiv.is(":visible") && formData.password !== formData.extra.password_confirm) {
								monster.alert('error',self.i18n.active().wizardErrorMessages.adminPasswordConfirmError);
							} else {
								formData = self.cleanFormData(formData);
								if(!$adminPasswordDiv.is(":visible")) {
									delete formData.password;
								}
								monster.request({
									resource: 'accountsManager.users.get', 
									data: {
										accountId: self.editAccountId,
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
												accountId: self.editAccountId,
												userId: userId,
												data: newData
											},
											success: function(data, status) {
												self.renderEditAdminsForm(parent);
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
							if(!(formData.first_name && formData.last_name && formData.email)) {
								monster.alert('error',self.i18n.active().wizardErrorMessages.adminMandatoryFields);
							} else if(!autoGen 
									&& (formData.password.length < 6 
										|| /\s/.test(formData.password) 
										|| !/\d/.test(formData.password) 
										|| !/[A-Za-z]/.test(formData.password) 
										)
									) {
								monster.alert('error',self.i18n.active().wizardErrorMessages.adminPasswordError);
							} else if(!autoGen && formData.password !== formData.extra.password_confirm) {
								monster.alert('error',self.i18n.active().wizardErrorMessages.adminPasswordConfirmError);
							} else {
								formData = self.cleanFormData(formData);
								formData.priv_level = "admin";
								formData.username = formData.email;
								if(autoGen) {
									formData.password = self.autoGeneratePassword();
								}

								monster.request({
									resource: 'accountsManager.users.create', 
									data: {
										accountId: self.editAccountId,
										data: formData
									},
									success: function(data, status) {
										self.renderEditAdminsForm(parent);
									}
								});
							}
						} else {
							var userId = contentHtml.find('#accountsmanager_promote_user_select option:selected').val();
							monster.request({
								resource: 'accountsManager.users.get', 
								data: {
									accountId: self.editAccountId,
									userId: userId
								},
								success: function(data, status) {
									data.data.priv_level = "admin";
									monster.request({
										resource: 'accountsManager.users.update', 
										data: {
											accountId: self.editAccountId,
											userId: userId,
											data: data.data
										},
										success: function(data, status) {
											self.renderEditAdminsForm(parent);
										}
									});
								}
							});
						}
						$newAdminBtn.click();
					});

					parent.find('#form_accountsmanager_account_admins').empty().append(contentHtml);
				}
			});
		},

		edit: function(accountId, parent) {
			var self = this;
			
			self.editAccountId = accountId;

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
							accountUsers: results.users,
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
						name: val.friendly_name,
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
					isReseller: monster.apps['auth'].isReseller
				};

			if($.isNumeric(templateData.account.created)) {
				templateData.account.created = monster.ui.toFriendlyDate(accountData.created, "short");
			}			

			var contentHtml = $(monster.template(self, 'edit', templateData)),
				$liSettings = contentHtml.find('li.settings-item'),
				$liContent = $liSettings.find('.settings-item-content'),
				$aSettings = $liSettings.find('a.settings-link'),
				closeTabsContent = function() {
					$liSettings.removeClass('open');
					$liContent.hide();
					$aSettings.show();
				};

			contentHtml.find('.account-tabs a').click(function(e) {
				e.preventDefault();
				if(!$(this).parent().hasClass('disabled')) {
					closeTabsContent();
					$(this).tab('show');
				}
			});

			contentHtml.find('li.settings-item').on('click', function(e) {
				var $this = $(this);

				if(!$this.hasClass('open') && !$this.hasClass('disabled')) {
					closeTabsContent();

					$this.addClass('open');
					$this.find('a.settings-link').hide();
					$this.find('.settings-item-content').slideDown('fast');

					if($this.data('name') === 'accountsmanager_account_admins') {
						self.renderEditAdminsForm(parent);
					}
				}
			});

			contentHtml.find('button.cancel').on('click', function(e) {
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
							self.render();
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

				//TODO: handle masquerading
				console.log(monster.apps);

				e.stopPropagation();
			});

			contentHtml.find('.change').on('click', function(e) {
				e.preventDefault();

				var $this = $(this),
					module = $this.data('module'),
					fieldName = $this.data('field'),
					newData = self.cleanFormData(form2object('form_'+fieldName));

				self.updateData(accountData, newData,
					function(data) {
						self.editAccount(
							$.extend(true, params, {
								accountData: data.data,
								callback: function(parent) {
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
								}
							})
						);
					},
					function(data) {
						if(data && data.data && 'api_error' in data.data && 'message' in data.data.api_error) {
							monster.alert(data.data.api_error.message);
						}
					}
				);
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
						if(servicePlans.currentId) {
							monster.request({
								resource: 'accountsManager.servicePlans.delete', 
								data: {
									accountId: self.editAccountId,
									planId: servicePlans.currentId,
									data: {}
								},
								success: function(data, status) {
									if (newPlanId) {
										monster.request({
											resource: 'accountsManager.servicePlans.add', 
											data: {
												accountId: self.editAccountId,
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
									accountId: self.editAccountId,
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
								accountId: self.editAccountId,
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
								accountId: self.editAccountId,
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

			self.renderLimitsTab({
				accountData: accountData,
				limits: accountLimits,
				balance: accountBalance,
				formattedClassifiers: formattedClassifiers,
				parent: contentHtml.find('#accountsmanager_limits_tab')
			});

			parent.find('.main-content').empty()
										.append(contentHtml);

			self.adjustTabsWidth(contentHtml.find('ul.account-tabs > li'));

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
				tabContentTemplate = self.getLimitsTabContent(params);

			//TODO get currency
			tabContentTemplate.find('.manage-credit-div .credit-balance').html('$'+balance);

			parent.find('#accountsmanager_limits_save').click(function(e) {
				e.preventDefault();

				var newTwowayValue = twowayTrunksDiv.find('.slider-div').slider('value'),
					newInboundValue = inboundTrunksDiv.find('.slider-div').slider('value'),
					callRestrictions = form2object('accountsmanager_callrestrictions_form').limits.call_restriction,
					addCredit = tabContentTemplate.find('.add-credit-input').val(),
					allowPrepay = tabContentTemplate.find('.allow-prepay-ckb').is(':checked');

				if(/^(\d+(\.\d{1,2})?)?$/.test(addCredit)) {

					$.each(callRestrictions, function(k, v) {
						if(v.action === false) { v.action = "deny"; }
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
										toastr.success(self.i18n.active().toastrMessages.creditAddSuccess, '', {"timeOut": 5000});
									},
									error: function(data, status) {
										toastr.error(self.i18n.active().toastrMessages.creditAddError, '', {"timeOut": 5000});
									}
								});
							}
						}
					);

				} else {
					monster.ui.alert(self.i18n.active().wizardErrorMessages.balanceMinimumAmount);
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
					classifiers: formattedClassifiers
				})),
				amountTwoway = 29.99,
				twoway = limits.twoway_trunks || 0,
				totalAmountTwoway = amountTwoway * twoway,
				twowayTrunksDiv = template.find('.trunks-div.twoway'),
				amountInbound = 6.99,
				inbound = limits.inbound_trunks || 0,
				totalAmountInbound = amountInbound * inbound,
				inboundTrunksDiv = template.find('.trunks-div.inbound'),
				adjustHandle = function(trunksDiv) {
					trunksDiv.find('.slider-value-wrapper').css('left', trunksDiv.find('.slider-div .ui-slider-handle').css('left'));
				},
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
							adjustHandle(trunksDiv);
						},
						change: function(event, ui) {
							adjustHandle(trunksDiv);
						}
					});
				};

			createSlider({
				trunksDiv: twowayTrunksDiv,
				minValue: 0,
				maxValue: 20,
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
			adjustHandle(twowayTrunksDiv);
			inboundTrunksDiv.find('.slider-value').html(inbound);
			inboundTrunksDiv.find('.total-amount .total-amount-value').html(totalAmountInbound.toFixed(2));
			adjustHandle(inboundTrunksDiv);

			return template;
		},

		adjustTabsWidth: function($tabs) {
			var maxWidth = 0;
			$.each($tabs, function() {
				if($(this).width() > maxWidth) { maxWidth = $(this).width(); }
			});
			$tabs.css('min-width',maxWidth+'px');
		},

		cleanFormData: function(formData) {
			delete formData.extra;

			if("enabled" in formData) {
				formData.enabled = formData.enabled === "false" ? false : true;
			}

			return formData;
		},

		updateData: function(data, newData, success, error) {
			var dataToUpdate = $.extend(true, {}, data, newData);
			if('reseller' in dataToUpdate) {
				delete dataToUpdate.reseller;
			}
			monster.request({
				resource: 'accountsManager.update', 
				data: {
					accountId: data.id,
					data: $.extend(true, {}, data, newData)
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
		}


	};

	return app;
});
