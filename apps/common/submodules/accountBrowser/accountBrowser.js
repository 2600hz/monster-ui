define(function(require){
	var $ = require('jquery'),
		_ = require('underscore'),
		monster = require('monster');

	var accountBrowser = {
		requests: {

		},

		subscribe: {
			'common.accountBrowser.render': 'accountBrowserRender'
		},

		accountBrowserRender: function(args) {
			var self = this,
				container = args.container,
				breadcrumbsContainer = args.breadcrumbsContainer,
				breadcrumbsList = args.breadcrumbsList,
				parentId = args.parentId,
				selectedId = args.selectedId,
				onAccountClick = args.onAccountClick,
				onChildrenClick = args.onChildrenClick,
				onBreadcrumbClick = args.onBreadcrumbClick,
				onNewAccountClick = args.onNewAccountClick,
				callback = args.callback,
				layout = $(monster.template(self, 'accountBrowser-layout', {
					customClass: args.customClass || 'ab-sidebar',
					addAccountEnabled: (typeof onNewAccountClick === 'function')
				})),
				searchLink = layout.find('.account-search-link').remove();

			if(container) {
				container.empty()
						 .append(layout);
				
				self.accountBrowserRenderList({
					container: layout.find('.account-list-container'),
					parentId: parentId,
					selectedId: selectedId,
					callback: callback
				});

				if(breadcrumbsContainer) {
					if(breadcrumbsList && breadcrumbsList.length) {
						var breadcrumbsTemplate = $(monster.template(self, 'accountBrowser-breadcrumbs', {
								id: breadcrumbsList[0].id,
								name: breadcrumbsList[0].name
							}));

						for(var i=1; i<breadcrumbsList.length; i++) {
							breadcrumbsTemplate.append(monster.template(self, 'accountBrowser-breadcrumb', {
								id: breadcrumbsList[i].id,
								name: breadcrumbsList[i].name,
								parentId: breadcrumbsList[i].parentId
							}));
						}
						
						breadcrumbsContainer.empty().append(breadcrumbsTemplate);
					} else {
						var breadcrumbsTemplate = $(monster.template(self, 'accountBrowser-breadcrumbs', {
							id: self.accountId,
							name: monster.apps['auth'].currentAccount.name
						}));

						if(parentId && parentId !== self.accountId) {
							breadcrumbsTemplate.append(monster.template(self, 'accountBrowser-breadcrumb', {}));
						}

						breadcrumbsContainer.empty().append(breadcrumbsTemplate);
					}
				}

				self.accountBrowserBindEvents({
					template: layout,
					breadcrumbsTemplate: breadcrumbsContainer,
					onAccountClick: onAccountClick,
					onChildrenClick: onChildrenClick,
					onBreadcrumbClick: onBreadcrumbClick,
					onNewAccountClick: onNewAccountClick,
					searchLink: searchLink
				});
			} else {
				throw new ReferenceError('The "container" arg is required to load the account browser.');
			}
		},

		accountBrowserBindEvents: function(args) {
			var self = this,
				template = args.template,
				breadcrumbsTemplate = args.breadcrumbsTemplate,
				onAccountClick = args.onAccountClick,
				onChildrenClick = args.onChildrenClick,
				onBreadcrumbClick = args.onBreadcrumbClick,
				onNewAccountClick = args.onNewAccountClick,
				searchLink = args.searchLink;

			//Prevents autoclosing of dropdown on click
			template.on('click', function(e) {
				e.stopPropagation();
			});

			template.find('.account-list-add').on('click', function() {
				var currentAccountId = template.find('.account-list').data('current'),
					breadcrumbsList = $.map(
						breadcrumbsTemplate.find('.account-browser-breadcrumb a'),
						function(elem) {
							var $elem = $(elem);
							return {
								id: $elem.data('id'),
								name: $elem.text(),
								parentId: $elem.data('parent')
							}
						}
					);

				onNewAccountClick && onNewAccountClick(currentAccountId, breadcrumbsList);
			});

			template.find('.account-browser-search').on('keyup', function() {
				var $this = $(this),
					search = $this.val();

				searchLink.find('.account-search-value').text(search);
				if(search) {
					$.each(template.find('.account-list-element'), function() {
						var $elem = $(this);
						if($elem.find('.account-name').text().toLowerCase().indexOf(search.toLowerCase()) >= 0) {
							$elem.show();
						} else {
							$elem.hide();
						}
					});
					template.find('.account-list').append(searchLink);
				} else {
					template.find('.account-list-element').show();
					searchLink.remove();
				}
			});

			template.find('.account-list').on('click', '.account-link', function() {
				var accountElement = $(this).parents('.account-list-element');
				template.find('.account-list-element').removeClass('active');
				accountElement.addClass('active');

				onAccountClick && onAccountClick(accountElement.data('id'), accountElement.find('.account-name').text());
			});

			template.find('.account-list').on('click', '.account-children-link', function() {
				var parentElement = $(this).parents('.account-list-element'),
					accountId = parentElement.data('id'),
					accountName = parentElement.find('.account-name').text(),
					parentAccountId = template.find('.account-list').data('current'),
					isSearchResult = template.find('.account-list').data('search-value');

				template.find('.account-browser-search').val('');
				self.accountBrowserRenderList({
					container: template.find('.account-list-container'),
					parentId: accountId,
					slide: true,
					callback: function() {
						if(breadcrumbsTemplate) {
							var addBreadcrumb = function(_id, _name, _parentId) {
								var breadcrumbTemplate = (monster.template(self, 'accountBrowser-breadcrumb', {
									id: _id,
									name: _name,
									parentId: _parentId
								}));

								breadcrumbsTemplate.find('.account-browser-breadcrumbs')
												   .append(breadcrumbTemplate);
							};

							if(isSearchResult) {
								var homeBreadcrumb = breadcrumbsTemplate.find('.account-browser-breadcrumb').first(),
									homeId = homeBreadcrumb.find('a').data('id');
								homeBreadcrumb.nextAll()
											  .remove();

								self.callApi({
									resource: 'account.listParents',
									data: {
										accountId: accountId
									},
									success: function(data, status) {
										var previousId = null;
										_.each(data.data, function(val) {
											if(val.id === homeId) {
												previousId = val.id;
											} else if(previousId) {
												addBreadcrumb(val.id, val.name, previousId);
												previousId = val.id;
											}
										});
										addBreadcrumb(accountId, accountName, previousId || homeId);
									}
								});
							} else {
								addBreadcrumb(accountId, accountName, parentAccountId);
							}
						}

						onChildrenClick && onChildrenClick(accountId);
					}
				});
			});

			template.find('.account-list').on('click', '.account-search-link', function() {
				var searchValue = searchLink.find('.account-search-value').text();
				self.accountBrowserRenderList({
					container: template.find('.account-list-container'),
					searchValue: searchValue,
					slide: false,
					callback: function() {
						template.find('.account-browser-search').val('');
						searchLink.remove();
						if(breadcrumbsTemplate) {
							var breadcrumbTemplate = (monster.template(self, 'accountBrowser-breadcrumb', {
								search: monster.template(self, '!' + self.i18n.active().accountBrowser.breadcrumbSearchResults, { searchValue: searchValue })
							}));

							breadcrumbsTemplate.find('.account-browser-breadcrumb')
											   .first()
											   .nextAll()
											   .remove();

							breadcrumbsTemplate.find('.account-browser-breadcrumbs')
											   .append(breadcrumbTemplate);
						}
					}
				});
			});

			var accountList = template.find('.account-list'),
				isLoading = false,
				loader = $('<li class="content-centered account-list-loader"> <i class="icon-spin icon-spinner"></i></li>');

			accountList.on('scroll', function() {
				if(!isLoading && accountList.data('next-key') && (accountList.scrollTop() >= (accountList[0].scrollHeight - accountList.innerHeight() - 100))) {
					isLoading = true;
					accountList.append(loader);
					var searchValue = accountList.data('search-value'),
						apiResource = searchValue ? 'account.searchByName' : 'account.listChildren',
						apiData = searchValue ? { accountName: searchValue } : { accountId: accountList.data('current') };

					self.callApi({
						resource: apiResource,
						data: $.extend(true, apiData, {
							filters: {
								'start_key': accountList.data('next-key')
							}
						}),
						success: function(data, status) {
							var nextStartKey = data.next_start_key,
								listTemplate = $(monster.template(self, 'accountBrowser-list', {
									accounts: monster.util.sort(data.data)
								}));

							loader.remove();

							accountList.append(listTemplate);
							accountList.data('next-key', nextStartKey || null);
							isLoading = false;
						}
					});
				}
			});

			if(breadcrumbsTemplate) {
				breadcrumbsTemplate.on('click', '.account-browser-breadcrumb a', function() {
					var $this = $(this),
						accountId = $this.data('id'),
						parentId = $this.data('parent');

					if(parentId) {
						breadcrumbsTemplate
							.find('a[data-id="'+parentId+'"]')
							.parents('.account-browser-breadcrumb')
							.nextAll()
							.remove();
					} else {
						$this.parents('.account-browser-breadcrumb')
							 .nextAll()
							 .remove();
					}

					template.find('.account-browser-search').val('');
					self.accountBrowserRenderList({
						container: template.find('.account-list-container'),
						parentId: parentId || accountId,
						selectedId: parentId ? accountId : null,
						callback: function() {
							onBreadcrumbClick && onBreadcrumbClick(accountId, parentId);
						}
					});
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
				callback = args.callback,
				apiResource = searchValue ? 'account.searchByName' : 'account.listChildren',
				apiData = searchValue ? { accountName: searchValue } : { accountId: parentId };

			self.callApi({
				resource: apiResource,
				data: apiData,
				success: function(data, status) {
					var nextStartKey = data.next_start_key,
						slider = container.find('.account-list-slider'),
						list = container.find('.account-list'),
						template = $(monster.template(self, 'accountBrowser-list', {
							accounts: monster.util.sort(data.data),
							selectedId: selectedId
						}));

					if(slide) {
						slider.empty()
							  .append(template);

						list.animate({ marginLeft: -list.outerWidth() }, 400, 'swing', function() {
							list.empty()
								.append(slider.html())
								.css('marginLeft','0px');
							slider.empty();
						});

					} else {
						list.empty()
							.append(template);
					}

					list.data('next-key', nextStartKey || null);
					list.data('current', parentId);
					list.data('search-value', searchValue || null);

					callback && callback();
				}
			});
		}
	};

	return accountBrowser;
});
