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
			// 'accountsManager.create': {
			// 	url: 'accounts/{accountId}',
			// 	verb: 'PUT'
			// },
			'accountsManager.update': {
				url: 'accounts/{accountId}',
				verb: 'POST'
			},
			// 'accountsManager.delete': {
			// 	url: 'accounts/{accountId}',
			// 	verb: 'DELETE'
			// },
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

			$('#account_search_input').keyup(function(e) {
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

			$('#main_account_link').click(function(e) {
				e.preventDefault();
				self.renderList(originalAccountList, parent);
				parent.find('.account-breadcrumb').remove();
			});

			self.renderList(originalAccountList, parent);
			$('#main_account_link').html(self.accountTree[self.accountId].name);

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
						monster.confirm('This user will be permanently deleted. Continue?', function() {
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
								monster.alert('error','Name and Email fields are mandatory!');
							} else if($adminPasswordDiv.is(":visible")
									&& (formData.password.length < 6 
										|| /\s/.test(formData.password) 
										|| !/\d/.test(formData.password) 
										|| !/[A-Za-z]/.test(formData.password) 
										)
									) {
								monster.alert('error','The password must contain at least 6 characters and include a letter and a number.');
							} else if($adminPasswordDiv.is(":visible") && formData.password !== formData.extra.password_confirm) {
								monster.alert('error','The password and confirmation do not match!');
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
								monster.alert('error','Name and Email fields are mandatory!');
							} else if(!autoGen 
									&& (formData.password.length < 6 
										|| /\s/.test(formData.password) 
										|| !/\d/.test(formData.password) 
										|| !/[A-Za-z]/.test(formData.password) 
										)
									) {
								monster.alert('error','The password must contain at least 6 characters and include a letter and a number.');
							} else if(!autoGen && formData.password !== formData.extra.password_confirm) {
								monster.alert('error','The password and confirmation do not match!');
							} else {
								formData = self.cleanFormData(formData);
								formData.priv_level = "admin";
								formData.username = formData.email;
								if(autoGen) {
									formData.password = monster.ui.randomString(4,'abcdefghjkmnpqrstuvwxyz')+monster.ui.randomString(4,'0123456789');
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
								callback(null, data.data);
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
							currentId: Object.keys(results.currentServicePlan.plans)[0],
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
				classifiers = $.map(params.classifiers, function(val, key) {
					var ret = {
						id: key,
						name: val.friendly_name,
						checked: true
					};
					if(accountData.call_restriction 
						&& key in accountData.call_restriction 
						&& accountData.call_restriction[key].action === "deny") {
						ret.checked = false;
					}
					return ret;
				}),
				templateData = {
					account: $.extend(true, {}, accountData),
					accountAdmins: admins,
					accountUsers: regularUsers,
					accountServicePlans: servicePlans,
					classifiers: classifiers,
					isReseller: monster.apps['auth'].currentAccount.reseller
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

					self.renderEditAdminsForm(parent);
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
			if(monster.apps['auth'].currentAccount.reseller) {
				var $btn_save = contentHtml.find('#accountsmanager_serviceplan_save'),
					$btn_rec = contentHtml.find('#accountsmanager_serviceplan_reconciliation'),
					$btn_sync = contentHtml.find('#accountsmanager_serviceplan_synchronization');

				$btn_save.click(function(e) {
					e.preventDefault();
					if(!$btn_save.hasClass('disabled')) {
						$btn_save.addClass('disabled');
						var newPlanId = contentHtml.find('#accountsmanager_serviceplan_select').val(),
							success = function() {
								toastr.success('Active service plan updated successfully!', '', {"timeOut": 5000});
								$btn_save.removeClass('disabled');
							},
							error = function() {
								toastr.error('An unexpected error occurred! Please try again.', '', {"timeOut": 5000});
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
								toastr.success('Reconciliation completed successfully!', '', {"timeOut": 5000});
								$btn_rec.removeClass('disabled');
								$btn_sync.removeClass('disabled');
							},
							error: function(data, status) {
								toastr.error('An error occurred during reconciliation process! Please try again later.', '', {"timeOut": 5000});
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
								toastr.success('Synchronization completed successfully!', '', {"timeOut": 5000});
								$btn_rec.removeClass('disabled');
								$btn_sync.removeClass('disabled');
							},
							error: function(data, status) {
								toastr.error('An error occurred during synchronization process! Please try again later.', '', {"timeOut": 5000});
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
			- parent
		*/
		renderLimitsTab: function(params) {
			var self = this,
				parent = params.parent,
				limits = params.limits,
				balance = params.balance,
				accountData = params.accountData,
				amountTwoway = 29.99,
				twoway = limits.twoway_trunks || 0,
				totalAmountTwoway = amountTwoway * twoway,
				twowayTrunksDiv = parent.find('.trunks-div.twoway'),
				amountInbound = 6.99,
				inbound = limits.inbound_trunks || 0,
				totalAmountInbound = amountInbound * inbound,
				inboundTrunksDiv = parent.find('.trunks-div.inbound'),
				adjustHandle = function(trunksDiv) {
					trunksDiv.find('.slider-value-wrapper').css('left', trunksDiv.find('.slider-div .ui-slider-handle').css('left'));
				};

			twowayTrunksDiv.find('.slider-div').slider({
				min: 0,
				max: 20,
				range: 'min',
				value: twoway,
				slide: function( event, ui ) {
					twowayTrunksDiv.find('.slider-value').html(ui.value);
					totalAmountTwoway = ui.value * amountTwoway;
					twowayTrunksDiv.find('.total-amount .total-amount-value').html(totalAmountTwoway.toFixed(2));

					adjustHandle(twowayTrunksDiv);
				},
				change: function(event, ui) {
					adjustHandle(twowayTrunksDiv);
				}
			});

			inboundTrunksDiv.find('.slider-div').slider({
				min: 0,
				max: 100,
				range: 'min',
				value: inbound,
				slide: function( event, ui ) {
					inboundTrunksDiv.find('.slider-value').html(ui.value);
					totalAmountInbound = ui.value * amountInbound;
					inboundTrunksDiv.find('.total-amount .total-amount-value').html(totalAmountInbound.toFixed(2));

					adjustHandle(inboundTrunksDiv);
				},
				change: function(event, ui) {
					adjustHandle(inboundTrunksDiv);
				}
			});

			twowayTrunksDiv.find('.slider-value').html(twoway);
			twowayTrunksDiv.find('.total-amount .total-amount-value').html(totalAmountTwoway.toFixed(2));
			adjustHandle(twowayTrunksDiv);
			inboundTrunksDiv.find('.slider-value').html(inbound);
			inboundTrunksDiv.find('.total-amount .total-amount-value').html(totalAmountInbound.toFixed(2));
			adjustHandle(inboundTrunksDiv);

			//TODO get currency
			parent.find('.manage-credit-div .credit-balance').html('$'+balance);

			parent.find('#accountsmanager_limits_save').click(function(e) {
				e.preventDefault();

				var newTwowayValue = twowayTrunksDiv.find('.slider-div').slider('value'),
					newInboundValue = inboundTrunksDiv.find('.slider-div').slider('value'),
					callRestrictions = form2object('accountsmanager_callrestrictions_form'),
					addCredit = parent.find('#accountsmanager_add_credit').val(),
					allowPrepay = parent.find('#accountsmanager_allow_prepay').is(':checked');

				if(addCredit.match(/^(\d+(\.\d{1,2})?)?$/)) {

					$.each(callRestrictions.call_restriction, function(k, v) {
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
										allow_prepay: allowPrepay
									})
								},
								success: function(data, status) {
									toastr.success('Trunk limits updated successfully!', '', {"timeOut": 5000});
								},
								error: function(data, status) {
									toastr.error('An unexpected error occured when updating the trunks, please try again later.', '', {"timeOut": 5000});
								}
							});

							self.updateData(accountData, callRestrictions,
								function(data, status) {
									toastr.success('Call restrictions updated successfully!', '', {"timeOut": 5000});
								},
								function(data, status) {
									toastr.error('An unexpected error occured when updating the call restrictions, please try again later.', '', {"timeOut": 5000});
								}
							);

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
										toastr.success('Credit successfully added to the current balance!', '', {"timeOut": 5000});
									},
									error: function(data, status) {
										toastr.error('An unexpected error occured when adding credit, please try again later.', '', {"timeOut": 5000});
									}
								});
							}
						}
					);

				} else {
					monster.ui.alert('Incorrect format for balance credit, you can only enter a number with up to 2 decimals.');
				}

			});
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
			monster.request({
				resource: 'accountsManager.update', 
				data: {
					accountId: data.id,
					data: $.extend(true, {}, data, newData)
				},
				success: function(_data, status) {
					if(typeof success == 'function') {
						success(_data, status);
					}
				},
				error: function(_data, status) {
					if(typeof error == 'function') {
						error(_data, status);
					}
				}
			});
		}


	};

	return app;
});
