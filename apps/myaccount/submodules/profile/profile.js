define(function(require){
	var $ = require('jquery'),
		_ = require('underscore'),
		monster = require('monster'),
		toastr = require('toastr'),
		timezone = require('monster-timezone'),
		chosen = require('chosen');

	var profile = {

		requests: {
			'myaccount.profile.getUser': {
				url: 'accounts/{accountId}/users/{userId}',
				verb: 'GET'
			},
			'myaccount.profile.updateUser': {
				url: 'accounts/{accountId}/users/{userId}',
				verb: 'POST'
			},
			'myaccount.profile.getAccount': {
				url: 'accounts/{accountId}',
				verb: 'GET'
			},
			'myaccount.profile.updateAccount': {
				url: 'accounts/{accountId}',
				verb: 'POST'
			},
			'myaccount.profile.getBilling': {
				url: 'accounts/{accountId}/braintree/customer',
				verb: 'GET'
			},
			'myaccount.profile.updateBilling': {
				url: 'accounts/{accountId}/braintree/customer',
				verb: 'POST'
			}
		},

		subscribe: {
			'myaccount.profile.renderContent': '_profileRenderContent',
			'myaccount.profile.showCreditTab': '_profileShowCreditTab'
		},

		_profileRenderContent: function(args) {
			var self = this;
			monster.parallel({
					billing: function(callback) {
						monster.request({
							resource: 'myaccount.profile.getBilling',
							data: {
								accountId: self.accountId
							},
							success: function(data, status) {
								callback(null, data.data);
							},
							error: function(data, status) {
								/* For some people billing is not via braintree, but we still ned to display the tab */
								callback(null, {});
							}
						});
					},
					user: function(callback) {
						if(self.userId) {
							monster.request({
								resource: 'myaccount.profile.getUser',
								data: {
									accountId: monster.apps['auth'].originalAccount.id,
									userId: self.userId
								},
								success: function(data, status) {
									callback(null, data.data);
								}
							});
						}
						else {
							// for now, if the user uses an SSO, we assume he's an admin to display account and billing info.
							// we could change that by adding a isAdmin flag to the sso auth payload and store it in the cookie, that we could then check here.
							callback(null, {
								priv_level: 'admin'
							});
						}
					},
					account: function(callback) {
						monster.request({
							resource: 'myaccount.profile.getAccount',
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
					results = self.profileFormatData(results);

					var profile = $(monster.template(self, 'profile-layout', results));

					self.profileBindEvents(profile, results);

					monster.pub('myaccount.renderSubmodule', profile);

					if(args.uiTab) {
						profile.find('a[href="#'+args.uiTab+'"]').tab('show');
					}

					if(typeof args.callback === 'function') {
						args.callback(profile);
					}
				}
			);
		},

		_profileShowCreditTab: function() {
			var self = this,
				profileContent = $('#myaccount .myaccount-content .profile-content-wrapper');

			profileContent.find('.nav-tabs a[href="#billing"]').tab('show');

			self.profileOpenTab(profileContent.find('.settings-item[data-name="credit_card"] .settings-link'));

			toastr.error(self.i18n.active().profile.missingCard);
		},

		profileCleanFormData: function(module, data) {
			if(module === 'billing') {
				data.credit_card.expiration_date = data.extra.expiration_date.month + '/' + data.extra.expiration_date.year;
			}

			return data;
		},


		cleanMergedData: function(data) {
			var self = this;

			delete data.extra;
			delete data[''];

			return data;
		},

		profileUpdateData: function(type, data, newData, success, error) {
			var self = this,
				params = {
					accountId: self.accountId,
					data: $.extend(true, {}, data, newData)
				};

			if(type === 'user') {
				params.accountId = monster.apps['auth'].originalAccount.id;
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

			params.data = self.cleanMergedData(params.data);

			monster.request({
				resource: 'myaccount.profile.update'+(type.slice(0,1).toUpperCase() + type.substr(1)),
				data: params,
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
		},

		profileFormatData: function(data) {
			// If standard user, hide account and billing
			if(data.hasOwnProperty('user') && data.user.hasOwnProperty('priv_level') && data.user.priv_level === 'user') {
				data.uiRestrictions.profile.show_account = false;
				data.uiRestrictions.profile.show_billing = false;
			}

			data.uiRestrictions = monster.apps['auth'].originalAccount.ui_restrictions || {};

			if(! _.isEmpty(data.billing) ) {
				data.billing.credit_card = data.billing.credit_cards[0] || {};

				/* If There is a credit card stored, we fill the fields with * */
				if(data.billing.credit_card.last_four) {
					data.billing.credit_card.fake_number = '************'+data.billing.credit_card.last_four;
					data.billing.credit_card.fake_cvv = '***';
					data.billing.credit_card.type = data.billing.credit_card.card_type.toLowerCase();
				}
			}
			else {
				data.uiRestrictions.profile = $.extend(data.uiRestrictions.profile || {}, { show_billing: false });
			}

			return data;
		},

		profileBindEvents: function(parent, data) {
			var self = this,
				profile = parent,
				liSettings = profile.find('li.settings-item'),
				liContent = liSettings.find('.settings-item-content'),
				aSettings = liSettings.find('a.settings-link'),
				closeContent = function() {
					liSettings.removeClass('open');
					liContent.slideUp('fast');
					aSettings.find('.update .text').text(self.i18n.active().profile.editSettings);
					aSettings.find('.update i').removeClass('icon-remove').addClass('icon-cog');
					liSettings.find('.uneditable').show();
					liSettings.find('.edition').hide();
				},
				successUpdating = function(key, parent) {
					profile = parent;

					var link = profile.find('li[data-name='+key+']');

					if(key === 'credit_card') {
						profile.find('.edition').hide();
						profile.find('.uneditable').show();
					}

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

					liContent.hide();
					aSettings.show();
				},
				settingsValidate = function(fieldName, dataForm, callbackSuccess, callbackError) {
					var validate = true,
						error = false;

					if(fieldName === 'password') {
						if(!(dataForm.password === dataForm.confirm_password)) {
							error = self.i18n.active().profile.passwords_not_matching;
						}
					}

					if(error && typeof callbackError === 'function') {
						callbackError(error);
					}
					else if(validate === true && error === false && typeof callbackSuccess === 'function') {
						callbackSuccess();
					}
				},
				getCardType = function(number) {
					var reg_visa = new RegExp('^4[0-9]{12}(?:[0-9]{3})?$'),
						reg_mastercard = new RegExp('^5[1-5][0-9]{14}$'),
						reg_amex = new RegExp('^3[47][0-9]{13}$'),
						reg_discover = new RegExp('^6(?:011|5[0-9]{2})[0-9]{12}$');
						//regDiners = new RegExp('^3(?:0[0-5]|[68][0-9])[0-9]{11}$'),
						//regJSB= new RegExp('^(?:2131|1800|35\\d{3})\\d{11}$');


					if(reg_visa.test(number))
						return 'visa';
					if (reg_mastercard.test(number))
						return 'mastercard';
					if (reg_amex.test(number))
						return 'amex';
					if (reg_discover.test(number))
						return 'discover';
					/*if (reg_diners.test(number))
						return 'DINERS';
					if (reg_JSB.test(number))
						return 'JSB';*/
				   return false;
				};

			profile.find('.change').on('click', function(e) {
				e.preventDefault();

				var currentElement = $(this),
					module = currentElement.data('module'),
					uiTab = currentElement.parents('.tab-pane').first().attr('id'),
					fieldName = currentElement.data('field'),
					newData = self.profileCleanFormData(module, form2object('form_'+fieldName));

				settingsValidate(fieldName, newData, function() {
						self.profileUpdateData(module, data[module], newData,
							function(data) {
								var args = {
									uiTab: uiTab,
									callback: function(parent) {
										successUpdating(fieldName, parent);

										/* TODO USELESS? */
										if(typeof callbackUpdate === 'function') {
											callbackUpdate();
										}
									}
								};

								self._profileRenderContent(args);
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

			timezone.populateDropdown(profile.find('#user_timezone'), data.user.timezone);
			profile.find('#user_timezone').chosen({ search_contains: true, width: '100%' });

			timezone.populateDropdown(profile.find('#account_timezone'), data.account.timezone);
			profile.find('#account_timezone').chosen({ search_contains: true, width: '100%' });

			profile.find('.edit-credit-card').on('click', function(e) {
				e.preventDefault();

				profile.find('.edition').show();
				profile.find('.uneditable').hide();
				displayCardType('');
			});

			var displayCardType = function(cardNumber) {
				var type = getCardType(cardNumber);

				if(type === false) {
					profile.find('.edition .card-type').hide();
					profile.find('.add-on i').show();
				}
				else if(!(profile.find('.card-type.'+type).is(':visible'))) {
					profile.find('.edition .card-type').hide();
					profile.find('.add-on i').hide();
					profile.find('.edition .card-type.'+type).css('display', 'inline-block');
				}
			};

			profile.find('#credit_card_number').on('keyup', function(e) {
				displayCardType($(this).val());
			});

			profile.find('#credit_card_number').on('paste', function(e) {
				var currentElement = $(this);
				//Hack for paste event: w/o timeout, the value is set to undefined...
				setTimeout(function() {
					displayCardType(currentElement.val());
				}, 0);
			});

			profile.find('#profile_settings a').on('click', function (e) {
				e.preventDefault();
				closeContent();

				$(this).tab('show');
			});

			profile.find('li.settings-item .settings-link').on('click', function(e) {
				var $this = $(this),
					isOpen = $this.parent().hasClass('open');

				closeContent();

				if(!isOpen) {
					self.profileOpenTab($this, _.isEmpty(data.billing.credit_cards));
				}
			});

			profile.find('.cancel').on('click', function(e) {
				e.preventDefault();
				closeContent();

				$(this).parents('form').first().find('input').each(function(k, v) {
					var currentElement = $(v);
					currentElement.val(currentElement.data('original_value'));
				});

				e.stopPropagation();
			});
		},

		profileOpenTab: function(link, hasEmptyCreditCardInfo) {
			var self = this,
				settingsItem = link.parents('.settings-item'),
				hasEmptyCreditCardInfo = hasEmptyCreditCardInfo === false ? false : true;

			settingsItem.addClass('open');
			link.find('.update .text').text(self.i18n.active().close);
			link.find('.update i').removeClass('icon-cog').addClass('icon-remove');
			settingsItem.find('.settings-item-content').slideDown('fast');

			if(settingsItem.data('name') === 'credit_card') {
				/* If there is no credit-card data, we skip the step that just displays the creditcard info */
				if(hasEmptyCreditCardInfo) {
					settingsItem.find('.uneditable').hide();
					settingsItem.find('.edition').show();
				}
			}
		}
	};

	return profile;
});
