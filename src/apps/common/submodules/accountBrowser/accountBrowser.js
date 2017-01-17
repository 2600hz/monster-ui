define(function(require){
	var $ = require('jquery'),
		_ = require('underscore'),
		monster = require('monster');

	var accountBrowser = {
		requests: {

		},

		appFlags: {
			accountBrowser: {
				documentEventInitialized: false
			}
		},

		subscribe: {
			'common.accountBrowser.render': 'accountBrowserRender'
		},

		accountBrowserRender: function(args) {
			var self = this,
				container = args.container,
				parentId = args.parentId,
				selectedId = args.selectedId,
				onAccountClick = args.onAccountClick,
				onChildrenClick = args.onChildrenClick,
				onBackToParentClick = args.onBackToParentClick,
				onNewAccountClick = args.onNewAccountClick,
				onSearch = args.onSearch,
				addCurrentAccount = args.addCurrentAccount || false,
				addBackButton = args.addBackButton || false,
				noFocus = args.noFocus || false,
				allowBackOnMasquerading = args.allowBackOnMasquerading || false, // needs addBackButton to be true, add back button up to original account when masquerading
				callback = args.callback,
				dataTemplate = {
					customClass: args.customClass || 'ab-sidebar',
					addAccountEnabled: (typeof onNewAccountClick === 'function')
				},
				layout = $(self.getTemplate({
					name: 'accountBrowser-layout',
					submodule: 'accountBrowser',
					data: dataTemplate
				})),
				searchLink = layout.find('.account-search-link').remove();

			if(container) {
				container.empty()
						 .append(layout);
				
				self.accountBrowserRenderList({
					container: layout.find('.account-list-container'),
					parentId: parentId,
					selectedId: selectedId,
					addCurrentAccount: addCurrentAccount,
					addBackButton: addBackButton,
					allowBackOnMasquerading: allowBackOnMasquerading,
					callback: callback
				});

				self.accountBrowserBindEvents({
					template: layout,
					onAccountClick: onAccountClick,
					onChildrenClick: onChildrenClick,
					onBackToParentClick: onBackToParentClick,
					onNewAccountClick: onNewAccountClick,
					addCurrentAccount: addCurrentAccount,
					addBackButton: addBackButton,
					noFocus: noFocus,
					allowBackOnMasquerading: allowBackOnMasquerading,
					searchLink: searchLink,
					onSearch: onSearch
				});
			} else {
				throw new ReferenceError('The "container" arg is required to load the account browser.');
			}
		},

		accountBrowserBindEvents: function(args) {
			var self = this,
				template = args.template,
				onAccountClick = args.onAccountClick,
				onChildrenClick = args.onChildrenClick,
				onBackToParentClick = args.onBackToParentClick,
				onNewAccountClick = args.onNewAccountClick,
				searchLink = args.searchLink,
				addCurrentAccount = args.addCurrentAccount,
				addBackButton = args.addBackButton,
				noFocus = args.noFocus,
				allowBackOnMasquerading = args.allowBackOnMasquerading,
				onSearch = args.onSearch,
				accountList = template.find('.account-list'),
				isLoading = false,
				loader = $('<li class="content-centered account-list-loader"> <i class="fa fa-spinner fa-spin"></i></li>');

			if(!noFocus) {
				setTimeout(function () { template.find('.search-query').focus(); });
			}

			//Prevents autoclosing of dropdown on click
			template.on('click', function(e) {
				e.stopPropagation();
			});

			template.find('.account-list-add').on('click', function() {
				onNewAccountClick && onNewAccountClick();
			});

			var findElemInData = function(searchString, data) {
				var found = false;

				_.each(data, function(val) {
					if(val.toString().toLowerCase().indexOf(searchString.toLowerCase()) >= 0) {
						found = true;
					}
				});

				return found;
			};

			// We have to do it on keydown because of a weird behavior in Firefox.
			// Pressing escape "restors the old value" of the field if the field is emptied, this is triggered on keydown.
			// So if we used keyup, it's too late and the field has a value set.
			// So we use keydown and preventDefault to prevent that behavior
			// More details on that bug: https://bugzilla.mozilla.org/show_bug.cgi?id=598819
			template.find('.account-browser-search').on('keydown', function(e) {
				var $this = $(this);

				// Escape KEY
				if(e.which === 27) {
					e.preventDefault();
					if($this.val() !== '') {
						$this.val('');
						template.find('.account-list-element').show();
						searchLink.remove();
					}
					else {
						$this.parents('#main_topbar_account_toggle').removeClass('open')
					}
				}
			});

			template.find('.account-browser-search').on('keyup', function(e) {
				var $this = $(this),
					search = $this.val();

				searchLink.find('.account-search-value').text(search);
				// When they press enter, we want to trigger the global search
				if(e.which === 13) {
					template.find('.account-search-link').click();
				}
				else if(search) {
					$.each(template.find('.account-list-element'), function() {
						var $elem = $(this),
							data = $elem.data();

						findElemInData(search, data) ? $elem.show() : $elem.hide();
					});
					accountList.prepend(searchLink);
				} else {
					template.find('.account-list-element').show();
					searchLink.remove();
				}
			});

			// We can't bind on anything else than document for this event, since the input is disabled, it won't fire
			if(self.appFlags.accountBrowser.documentEventInitialized === false) {
				self.appFlags.accountBrowser.documentEventInitialized = true;
				var container = $('#main_topbar_account_toggle');
				$(document).on('keydown', function(e) {
					if(e.which === 13) {
						if(container.hasClass('open') && container.find('.account-list-element').length === 0 && container.find('.account-search-link').hasClass('active')) {
							container.find('.account-search-link.active').trigger('click');
						}
					}
				});
			}

			accountList.on('click', '.account-link', function() {
				var accountElement = $(this).parents('.account-list-element');
				template.find('.account-list-element').removeClass('active');
				accountElement.addClass('active');

				onAccountClick && onAccountClick(accountElement.data('id'), accountElement.data('name'));
			});

			accountList.on('click', '.account-children-link:not(.disabled)', function() {
				var $this = $(this),
					parentElement = $this.parents('.account-list-element'),
					accountId = parentElement.data('id'),
					accountName = parentElement.data('name'),
					parentAccountId = accountList.data('current'),
					isSearchResult = accountList.data('search-value'),
					isLocalBackButton = $this.hasClass('local-back');

				$this.addClass('disabled');

				template.find('.account-browser-search').prop('disabled', false)
														.val('');

				var renderList = function(accountId, selectedId, dataBackButton) {
					self.accountBrowserRenderList({
						container: template.find('.account-list-container'),
						parentId: accountId,
						selectedId: selectedId,
						slide: dataBackButton ? false : true,
						addCurrentAccount: addCurrentAccount,
						addBackButton: addBackButton,
						allowBackOnMasquerading: allowBackOnMasquerading,
						callback: function(data) {
							var callbackData = {
								parentId: accountId,
								parentName: accountName,
								children: data.accounts
							};

							if(dataBackButton) {
								if(selectedId) {
									template.find('.account-list').scrollTop(0);
									var pos = template.find('.account-list li.active').position().top - template.find('.account-list li:first-child').position().top;
									template.find('.account-list').scrollTop(pos);
								}

								_.each(dataBackButton, function(account) {
									if(account.id === accountId) {
										callbackData.parentName = account.name;
									}
								});
							}

							onChildrenClick && onChildrenClick(callbackData);
						}
					});
				}

				template.find('.account-search-link').removeClass('active').remove();

				if(isLocalBackButton) {
					self.callApi({
						resource: 'account.listParents',
						data: {
							accountId: accountId
						},
						success: function(data, status) {
							// if account we clicked back on has more than 2 levels in the tree, then we render the sub-accounts of it's grandfather
							if(data.data.length > 1) {
								renderList(data.data[data.data.length-2].id, data.data[data.data.length-1].id, data.data);
							}
							// otherwise, we just render the sub-accounts of the father
							else {
								renderList(data.data[data.data.length-1].id, null, data.data);
							}
						}
					});
				}
				else {
					renderList(accountId);
				}
			});

			accountList.on('click', '.account-search-link', function() {
				if(searchLink.hasClass('active')) {
					accountList.data('search-value', null);
					searchLink.removeClass('active')
							  .remove();
					template.find('.account-browser-search').prop('disabled', false)
															.val('')
															.focus();

					onSearch && onSearch();

					self.accountBrowserRenderList({
						container: template.find('.account-list-container'),
						addBackButton: addBackButton,
						allowBackOnMasquerading: allowBackOnMasquerading,
						addCurrentAccount: addCurrentAccount
					});
				} else {
					var searchValue = searchLink.find('.account-search-value').text();
					searchLink.addClass('active')
							  .remove();

					onSearch && onSearch(searchValue);

					self.accountBrowserRenderList({
						container: template.find('.account-list-container'),
						searchValue: searchValue,
						slide: false,
						addCurrentAccount: addCurrentAccount,
						addBackButton: addBackButton,
						allowBackOnMasquerading: allowBackOnMasquerading,
						showLocalBackButton: true,
						callback: function() {
							// We blur it so we can still detect keydown events
							// if focus on disabled field, it won't fire
							template.find('.account-browser-search')
									.prop('disabled', true)
									.blur();

							accountList.prepend(searchLink);
						}
					});
				}
			});

			accountList.on('scroll', function() {
				if(!isLoading && accountList.data('next-key') && (accountList.scrollTop() >= (accountList[0].scrollHeight - accountList.innerHeight() - 100))) {
					isLoading = true;
					accountList.append(loader);
					var searchValue = accountList.data('search-value'),
						apiResource = searchValue ? 'account.searchByName' : 'account.listChildren',
						apiData = searchValue ? { accountName: searchValue } : { accountId: accountList.data('current') },
						nextStartKey = accountList.data('next-key');

					self.callApi({
						resource: apiResource,
						data: $.extend(true, apiData, {
							filters: {
								'start_key': encodeURIComponent(nextStartKey)
							}
						}),
						success: function(data, status) {
							var nextStartKey = data.next_start_key,
								listTemplate = $(self.getTemplate({
									name: 'accountBrowser-list',
									submodule: 'accountBrowser',
									data: {
										accounts: monster.util.sort(data.data)
									}
								}));

							loader.remove();

							accountList.append(listTemplate);
							accountList.data('next-key', nextStartKey || null);
							isLoading = false;
						}
					});
				}
			});

			if(addBackButton) {
				accountList.on('click', '.account-previous-link', function() {
					var currentAccountId = accountList.data('current') || self.accountId,
						topAccountId = allowBackOnMasquerading ? monster.apps.auth.originalAccount.id : self.accountId;

					if(currentAccountId !== topAccountId) {

						self.callApi({
							resource: 'account.listParents',
							data: {
								accountId: currentAccountId
							},
							success: function(data, status) {
								if(data.data && data.data.length > 0) {
									var accountId = data.data[data.data.length-1].id,
										accountName = data.data[data.data.length-1].name;

									template.find('.account-browser-search').prop('disabled', false)
																			.val('');

									self.accountBrowserRenderList({
										container: template.find('.account-list-container'),
										parentId: accountId,
										addCurrentAccount: addCurrentAccount,
										addBackButton: addBackButton,
										allowBackOnMasquerading: allowBackOnMasquerading,
										callback: function(data) {
											var callbackData = {
												parentId: accountId,
												parentName: accountName,
												children: data.accounts
											};

											onBackToParentClick && onBackToParentClick(callbackData);
										}
									});
								}
							}
						});
					}
				});
			}

		},

		accountBrowserRenderList: function(args) {
			var self = this,
				container = args.container,
				parentId = args.parentId || self.accountId,
				selectedId = args.selectedId,
				slide = args.slide,
				searchValue = args.searchValue,
				addCurrentAccount = args.addCurrentAccount,
				addBackButton = args.addBackButton,
				showLocalBackButton = args.showLocalBackButton,
				allowBackOnMasquerading = args.allowBackOnMasquerading,
				callback = args.callback,
				topAccountId = allowBackOnMasquerading ? monster.apps.auth.originalAccount.id : self.accountId;

			if(parentId === topAccountId) {
				addBackButton = false;
			}

			self.accountBrowserGetData(searchValue, parentId, function(data) {
				var nextStartKey = data.next_start_key,
					slider = container.find('.account-list-slider'),
					list = container.find('.account-list'),
					templateData = {
						accounts: monster.util.sort(data.data),
						selectedId: selectedId,
						addBackButton: addBackButton,
						showLocalBackButton: showLocalBackButton
					};

				if(addCurrentAccount) {
					templateData.currentAccount = monster.apps.auth.currentAccount;
				}

				var template = $(self.getTemplate({
									name: 'accountBrowser-list',
									submodule: 'accountBrowser',
									data: templateData
								})),
					afterRender = function() {
						hackMacChrome();

						list.data('next-key', nextStartKey || null);
						list.data('current', parentId);
						list.data('search-value', searchValue || null);

						callback && callback(templateData);
					}, 
					// For some god damn reason, the text doesn't display normally for accounts who have less than a screen of sub-accounts
					// The css works fine on all environment except mac/chrome, where the text gets hidden.
					// Trying to debug the code is hard because as soon as you inspect the element, the text appears again
					// Suspecting the scrollbar from mac/chrome to mess up our CSS but can't find a good way to fix it consistently
					// Hiding/showing the list resolve the issue even though it's super dirty, we'll leave it like that for the moment
					// Need to investigate further...
					// Current fix is just to force the browser to re-render the element, which seems to fix the issue.
					// So we just set the margin-left to a set value and reset it 1ms after
					hackMacChrome = function() {
						if (navigator.userAgent.indexOf('Mac OS X') != -1 && navigator.userAgent.toLowerCase().indexOf('chrome') != -1) {
							var oldMargin = list.css('margin-left');
							list.css('margin-left','1px');

							setTimeout(function(){
								list.css('margin-left',oldMargin);
							}, 1);
						}
					};

				if(slide) {
					slider.empty()
						  .append(template);

					list.animate({ marginLeft: -list.outerWidth() }, 400, 'swing', function() {
						list.empty()
							.append(slider.html())
							.css('marginLeft','0px');
						slider.empty();

						afterRender();
					});
				}
				else {
					list.empty()
						.append(template);

					afterRender();
				}
			});
		},

		accountBrowserGetData: function(searchValue, parentId, callback) {
			var self = this,
				apiResource = searchValue ? 'account.searchAll' : 'account.listChildren',
				apiData = searchValue ? { searchValue: searchValue } : { accountId: parentId };

			self.callApi({
				resource: apiResource,
				data: apiData,
				success: function(data) {
					var formattedData = self.accountBrowserFormatGetData(data);

					callback && callback(formattedData);
				}
			});
		},

		accountBrowserFormatGetData: function(data) {
			var self = this,
				formattedData = {
					data: []
				};

			// Normal use case, just listing children
			if(_.isArray(data.data)) {
				formattedData = data;
			}
			// the Search API returns 3 arrays, we merge them together and remove duplicated before continuing
			else {
				var mapAdded = {},
					addAccounts = function(arr) {
						_.each(arr, function(account) {
							if(!mapAdded.hasOwnProperty(account.id)) {
								formattedData.data.push(account);
								mapAdded[account.id] = true;
							}
						})
					};

				_.each(data.data, function(arrayField) {
					addAccounts(arrayField);
				});
			}

			return formattedData;
		}
	};

	return accountBrowser;
});
