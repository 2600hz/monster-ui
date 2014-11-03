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

		/* Events */
		accountBrowserRenderX: function(args) {
			var self = this,
				originalAccountTree = args.accountsTree,
				currentAccountTree = originalAccountTree,
				parent = args.parent;

			var accountErrName = self.i18n.active().accountBrowser.missingAccount,
				layout = monster.template(self, 'accountBrowser-layout'),
				template = monster.template(self, 'accountBrowser-list', { 
					accounts: $.map(currentAccountTree, function(val, key) {
						val.id = key;
						return val;
					}).sort(function(a,b) {
						return (a.name || accountErrName).toLowerCase() > (b.name || accountErrName).toLowerCase() ? 1 :-1;
					})
				});

			parent
				.find('.accounts-dropdown')
				.empty()
				.append(layout)
				.find('.account-list')
				.append(template);

			parent.on('click', '.accounts-dropdown .account-children-link', function(e) {
				e.stopPropagation();

				var slider = parent.find('.account-slider'),
					list = parent.find('.account-list'),
					accountId = $(this).parent().data('id');

				currentAccountTree = currentAccountTree[accountId].children;

				var template = monster.template(self, 'accountBrowser-list', { 
					accounts: $.map(currentAccountTree, function(val, key) {
						val.id = key;
						return val;
					}).sort(function(a,b) {
						return (a.name || accountErrName).toLowerCase() > (b.name || accountErrName).toLowerCase() ? 1 :-1;
					})
				});

				slider
					.empty()
					.append(template);

				list.animate({ marginLeft: -list.outerWidth() }, 400, 'swing', function() {
					list.empty()
						 .append(template)
						 .css('marginLeft','0px');

					slider.empty();
				});
			});

			/* When clicking on a bootstrap dropdown, it hides the dropdown, that's a hack to prevent it and allow us to type in the search field! */
			parent.on('click', '.accounts-dropdown .search-box', function(e) {
				e.stopPropagation();
			});

			parent.on('keyup', '.accounts-dropdown .account-browser-search', function(e) {
				e.stopPropagation();
				var search = $(this).val();

				if(search) {
					$.each(parent.find('.account-list-element'), function(k, v) {
						var current = $(v);

						current.find('.account-link').html().toLowerCase().indexOf(search.toLowerCase()) >= 0 ? current.show() : current.hide();
					});
				}
				else {
					parent.find('.account-list-element').show();
				}
			});

			/* Move Numbers */
			parent.on('click', '.accounts-dropdown .account-link', function(event) {
				var $this = $(this);
				if($this.hasClass('disabled')) {
					event.stopPropagation();
				} else {
					var destinationAccountId = $this.parent().data('id'),
						destinationAccountName = $this.find('.account-name').text();

					args.callbacks.clickAccount && args.callbacks.clickAccount(destinationAccountId, destinationAccountName);
				}
			});

			var dropdown = {
				reset: function() {
					currentAccountTree = originalAccountTree;

					var layout = monster.template(self, 'accountBrowser-layout'),
						template = monster.template(self, 'accountBrowser-list', { 
							accounts: $.map(currentAccountTree, function(val, key) {
								val.id = key;
								return val;
							}).sort(function(a,b) {
								return (a.name || accountErrName).toLowerCase() > (b.name || accountErrName).toLowerCase() ? 1 :-1;
							})
						});

					parent
						.find('.accounts-dropdown')
						.empty()
						.append(layout)
						.find('.account-list')
						.append(template);
				}
			};

			args.callbacks.loaded && args.callbacks.loaded(dropdown);
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
					addAccountEnabled: (typeof onNewAccountClick === 'function')
				}));

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
					onNewAccountClick: onNewAccountClick
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
				onNewAccountClick = args.onNewAccountClick;

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
				if(search) {
					$.each(template.find('.account-list-element'), function() {
						if($this.find('.account-link').html().toLowerCase().indexOf(search.toLowerCase()) >= 0) {
							$this.show();
						} else {
							$this.hide();
						}
					});
				} else {
					template.find('.account-list-element').show();
				}
			});

			template.find('.account-list').on('click', '.account-link', function() {
				var accountElement = $(this).parents('.account-list-element');
				template.find('.account-list-element').removeClass('active');
				accountElement.addClass('active');

				onAccountClick && onAccountClick(accountElement.data('id'));
			});

			template.find('.account-list').on('click', '.account-children-link', function() {
				var parentElement = $(this).parents('.account-list-element'),
					accountId = parentElement.data('id'),
					accountName = parentElement.find('.account-name').text(),
					parentAccountId = template.find('.account-list').data('current');

				template.find('.account-browser-search').val('');
				self.accountBrowserRenderList({
					container: template.find('.account-list-container'),
					parentId: accountId,
					slide: true,
					callback: function() {
						if(breadcrumbsTemplate) {
							var breadcrumbTemplate = (monster.template(self, 'accountBrowser-breadcrumb', {
								id: accountId,
								name: accountName,
								parentId: parentAccountId
							}));

							breadcrumbsTemplate.find('.account-browser-breadcrumbs')
											   .append(breadcrumbTemplate);
						}

						onChildrenClick && onChildrenClick(accountId);
					}
				});
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
				callback = args.callback;

			self.callApi({
				resource: 'account.listChildren',
				data: {
					accountId: parentId
				},
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

					if(nextStartKey) {
						//Handle pagination
					}

					list.data('current', parentId);

					callback && callback();
				}
			});
		}
	};

	return accountBrowser;
});
