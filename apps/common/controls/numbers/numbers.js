define(function(require){
	var $ = require('jquery'),
		_ = require('underscore'),
		monster = require('monster'),
		toastr = require('toastr');

	var numbers = {

		requests: {
			'common.numbers.list': {
				url: 'accounts/{accountId}/phone_numbers',
				verb: 'GET'
			},
			'common.numbers.delete': {
				url: 'accounts/{accountId}/phone_numbers/collection',
				verb: 'DELETE'
			},
			'common.numbers.move': {
				url: 'accounts/{accountId}/phone_numbers/collection/activate',
				verb: 'PUT'
			},
			'common.numbers.listChildren': {
				url: 'accounts/{accountId}/children',
				verb: 'GET'
			},
			'common.numbers.listDescendants': {
				url: 'accounts/{accountId}/descendants',
				verb: 'GET'
			},
			'common.numbers.searchAccounts': {
				url: 'accounts/{accountId}/phone_numbers/{phoneNumber}/identify',
				verb: 'GET'
			},
		},

		subscribe: {
			'common.numbers.dialogSpare': 'numbersDialogSpare',
			'common.numbers.render': 'numbersRender',
			'common.numbers.getListFeatures': 'numbersGetFeatures'
		},

		/* Arguments:
		** container: jQuery Div
		** callbackAfterRender: callback executed once we rendered the number control
		** viewType: default to 'pbx', can be set to 'pbx', basically changes the view from Number Manager to SmartPBX the if set to 'pbx'
		*/

		numbersRender: function(args){
			var self = this,
				container = args.container || $('#ws-content'),
				callbackAfterRender = args.callbackAfterRender;

			self.numbersGetData(function(data) {
				data.viewType = args.viewType || 'manager';
				data = self.numbersFormatData(data);

				var numbersView = $(monster.template(self, 'numbers-layout', data)),
					spareView = monster.template(self, 'numbers-spare', data),
					usedView = monster.template(self, 'numbers-used', data);

				numbersView.find('.list-numbers[data-type="spare"]').append(spareView);
				numbersView.find('.list-numbers[data-type="used"]').append(usedView);

				self.numbersBindEvents(numbersView, data);

				container
					.empty()
					.append(numbersView);

				callbackAfterRender && callbackAfterRender(container);
			});
		},

		//_util
		numbersFormatNumber: function(value) {
			var self = this;

			value.viewFeatures = self.numbersGetFeatures();

			_.each(value.features, function(feature) {
				value.viewFeatures[feature].active = 'active';
			});

			if('used_by' in value) {
				value.friendlyUsedBy = self.i18n.active().numbers[value.used_by];
			}

			return value;
		},

		numbersGetFeatures: function(callback) {
			var self = this,
				features = {
					failover: { icon: 'icon-green icon-thumbs-down feature-failover', help: self.i18n.active().numbers.failoverIconHelp },
					outbound_cnam: { icon: 'icon-blue icon-user feature-outbound_cnam', help: self.i18n.active().numbers.cnamIconHelp },
					dash_e911: { icon: 'icon-red icon-ambulance feature-dash_e911', help: self.i18n.active().numbers.e911IconHelp },
					local: { icon: 'icon-purple icon-android feature-local', help: self.i18n.active().numbers.localIconHelp },
					port: { icon: 'icon-phone icon-yellow feature-port' }
				};

			if(callback) {
				callback && callback(features);
			}
			else return features;
		},

		numbersFormatData: function(data) {
			var self = this,
				mapAccounts = {},
				templateLists = {
					spareNumbers: [],
					usedNumbers: []
				},
				templateData = {
					viewType: data.viewType,
					listAccounts: []
				};

			/* Initializing accounts metadata */
			var thisAccount = _.extend(monster.apps['auth'].currentAccount, templateLists);

			if(data.viewType !== 'pbx') {
				_.each(data.accounts, function(account) {
					mapAccounts[account.id] = account;
				});
			}

			/* assign each number to spare numbers or used numbers for main account */
			_.each(data.numbers.numbers, function(value, phoneNumber) {
				value.phoneNumber = phoneNumber;

				value = self.numbersFormatNumber(value);

				if(value.used_by) {
					if(data.viewType === 'pbx') {
						if(value.used_by === 'callflow') {
							thisAccount.usedNumbers.push(value);
						}
					}
					else {
						thisAccount.usedNumbers.push(value);
					}
				}
				else {
					thisAccount.spareNumbers.push(value);
				}
			});

			thisAccount.countUsedNumbers = thisAccount.usedNumbers.length;
			thisAccount.countSpareNumbers = thisAccount.spareNumbers.length;
			thisAccount.open = 'open';

			mapAccounts[self.accountId] = thisAccount;

			/* order all the list of numbers to display last updated number first */
			var sortByDate = function(a,b) {
				return a.updated > b.updated ? -1 : 1;
			}

			/* Sort the list of numbers of the main account and add the subaccounts in a list to be ordered by name later */
			_.each(mapAccounts, function(value) {
				if(value.id !== self.accountId) {
					templateData.listAccounts.push(value);
				}
				else {
					value.spareNumbers.sort(sortByDate);
					value.usedNumbers.sort(sortByDate);
				}
			});

			/* Order the subaccount list by name */
			templateData.listAccounts.sort(function(a,b) {
				return (a.name.toLowerCase() > b.name.toLowerCase());
			});

			/* Append our current account with the numbers at the top */
			templateData.listAccounts.unshift(mapAccounts[self.accountId]);

			return templateData;
		},

		numbersBindEvents: function(parent, dataNumbers) {
			var self = this,
				listSearchedAccounts = [ self.accountId ],
				showLinks = function() {
					if(parent.find('.number-box.selected').size() > 0) {
						parent.find('#trigger_links').show();
					}
					else {
						parent.find('#trigger_links').hide();
					}
				},
				displayNumberList = function(accountId, callback, forceRefresh) {
					var alreadySearched = _.indexOf(listSearchedAccounts, accountId) >= 0,
						forceRefresh = forceRefresh || false;

					if(!alreadySearched || forceRefresh) {
						self.numbersList(accountId, function(numbers) {
							var spareNumbers = [],
								usedNumbers = [];

							if(!alreadySearched) {
								listSearchedAccounts.push(accountId);
							}

							_.each(numbers.numbers, function(value, phoneNumber) {
								if(phoneNumber !== 'id' && phoneNumber !== 'quantity') {
									value.phoneNumber = phoneNumber;

									value = self.numbersFormatNumber(value);

									value.used_by ? usedNumbers.push(value) : spareNumbers.push(value);
								}
							});

							_.each(dataNumbers.listAccounts, function(value) {
								//TODO Sort
								if(value.id === accountId) {
									value.spareNumbers = spareNumbers;
									value.usedNumbers = usedNumbers;
									value.countSpareNumbers = spareNumbers.length;
									value.countUsedNumbers = usedNumbers.length;

									parent
										.find('.list-numbers[data-type="spare"] .account-section[data-id="'+accountId+'"] .numbers-wrapper')
										.empty()
										.append(monster.template(self, 'numbers-spareAccount', { spareNumbers: spareNumbers }))
										.parent()
										.find('.count')
										.html('('+ spareNumbers.length +')');

									parent
										.find('.list-numbers[data-type="used"] .account-section[data-id="'+accountId+'"] .numbers-wrapper')
										.empty()
										.append(monster.template(self, 'numbers-usedAccount', { usedNumbers: usedNumbers }))
										.parent()
										.find('.count')
										.html('('+ usedNumbers.length +')');

									return false;
								}
							});

							callback && callback();
						});
					}
					else {
						callback && callback();
					}
				};

			/* On init */
			parent.find('[data-toggle="tooltip"]').tooltip();
			parent.find('.list-numbers[data-type="used"]').hide();

			/* Events */
			/* Toggle between spare/used numbers view */
			parent.find('.half-box').on('click', function() {
				var box = $(this),
					type = box.data('type');

				if(!box.hasClass('selected')) {
					parent.find('.half-box').removeClass('selected');
					parent.find('.list-numbers').hide();

					box.addClass('selected');
					parent.find('.list-numbers[data-type="'+ type + '"]').show();
				}
			});


			/* Select all numbers when clicking on the account checkbox */
			parent.on('click', '.account-header input[type="checkbox"]', function(event) {
				var checkboxes = $(this).parents('.account-section').first().find('.number-box input[type="checkbox"]'),
					isChecked = $(this).prop('checked');

				checkboxes.prop('checked', isChecked);

				isChecked ? checkboxes.parent().addClass('selected') : checkboxes.parent().removeClass('selected');

				showLinks();
			});

			/* Click on an account header, open list of numbers of this account. Send an API call to search it if it has not been searched already */
			parent.on('click', '.expandable', function(event) {
				var section = $(this).parents('.account-section'),
					accountId = section.data('id'),
					toggle = function() {
						section.toggleClass('open');

						if(!section.hasClass('open')) {
							section.find('input[type="checkbox"]:checked').prop('checked', false);
							section.find('.number-box.selected').removeClass('selected');
						}

						_.each(dataNumbers.listAccounts, function(account) {
							if(account.id === accountId) {
								account.open = section.hasClass('open') ? 'open' : '';
							}
						});
					};

				displayNumberList(accountId, function() {
					toggle();
				});

				showLinks();
			});

			parent.on('click', '.account-header .buy-numbers-link', function(e) {
				var accountId = $(this).parents('.account-section').data('id');

				monster.pub('common.buyNumbers', {
					accountId: accountId,
					searchType: $(this).data('type'),
					callbacks: {
						success: function(numbers) {
							displayNumberList(accountId, function(numbers) {
								parent.find('.account-section[data-id="'+accountId+'"]').addClass('open');
							}, true);
							// var numbersData = $.map(numbers, function(val, key) {
							// 	return { phone_number: key };
							// });

							// self.getAccount(function(globalData) {
							// 	self.addNumbers(globalData, serverId, numbersData, function() {
							// 		self.listNumbersByPbx(serverId, callback_listing);
							// 		self.renderList(serverId);
							// 	});
							// });
						}
					}
				});
			});

			/* Add class selected when you click on a number box, check/uncheck  the account checkbox if all/no numbers are checked */
			parent.on('click', '.number-box:not(.disabled)', function(event) {
				var currentBox = $(this);

				if(!currentBox.hasClass('no-data')) {
					var section = currentBox.parents('.account-section').first(),
						accountCheckbox = section.find('.account-header input[type="checkbox"]');

					currentBox.toggleClass('selected');

					if(!$(event.target).is('input:checkbox')) {
						var currentCb = currentBox.find('input[type="checkbox"]'),
							cbValue = currentCb.prop('checked');

						currentCb.prop('checked', !cbValue);
					}

					/* Check account checkbox if all the numbers are checked */
					if(section.find('.numbers-wrapper input[type="checkbox"]:checked').size() === section.find('.numbers-wrapper input[type="checkbox"]').size()) {
						accountCheckbox.prop('checked', true);
					}
					else {
						accountCheckbox.prop('checked', false);
					}
				}

				showLinks();
			});

			/* Delete Numbers */
			parent.on('click', '#delete_numbers', function(event) {
				var listNumbers = [],
					mapAccounts = {};

				parent.find('.number-box.selected').each(function(k, v) {
					var box = $(v),
						number = box.data('phonenumber');
						accountId = box.parents('.account-section').data('id');

					if(!(accountId in mapAccounts)) {
						mapAccounts[accountId] = {};
					}

					mapAccounts[accountId][number] = true;
					listNumbers.push(number);
				});

				var requestData = {
					numbers: listNumbers,
					accountId: self.accountId
				};

				monster.ui.confirm(self.i18n.active().numbers.confirmDelete, function() {
					self.numbersDelete(requestData, function(data) {
						var countDelete = 0;

						_.each(dataNumbers.listAccounts, function(account, indexAccount) {
							if(account.id in mapAccounts) {
								var newList = [];
								_.each(account.spareNumbers, function(number, indexNumber) {
									if(!(number.phoneNumber in data.success)) {
										newList.push(number);
									}
									else {
										countDelete++;
									}
								});

								dataNumbers.listAccounts[indexAccount].spareNumbers = newList;
								dataNumbers.listAccounts[indexAccount].countSpareNumbers = newList.length;
							}
						});

						self.numbersPaintSpare(parent, dataNumbers, function() {
							var template = monster.template(self, '!' + self.i18n.active().numbers.successDelete, { count: countDelete });

							toastr.success(template);
						});
					});
				});
			});

			/* to plugin */
			var originalAccountTree = {},
				moveNumbersToAccount = function(accountId) {
					var listNumbers = [],
						destinationAccountId = accountId,
						destinationIndex = -1,
						mapAccounts = {};

					parent.find('.number-box.selected').each(function(k, v) {
						var box = $(v),
							number = box.data('phonenumber');
							accountId = box.parents('.account-section').data('id');

						if(!(accountId in mapAccounts)) {
							mapAccounts[accountId] = {};
						}

						mapAccounts[accountId][number] = true;
						listNumbers.push(number);
					});

					var requestData = {
						numbers: listNumbers,
						accountId: destinationAccountId
					};

					self.numbersMove(requestData, function(data) {
						var countMove = 0;

						_.each(dataNumbers.listAccounts, function(account, indexAccount) {
							if(account.id === destinationAccountId) {
								destinationIndex = indexAccount;
							}

							if(account.id in mapAccounts) {
								var newList = [];
								_.each(account.spareNumbers, function(number, indexNumber) {
									if(!(number.phoneNumber in data.success)) {
										newList.push(number);
									}
									else {
										data.success[number.phoneNumber] = number;
										countMove++;
									}
								});

								dataNumbers.listAccounts[indexAccount].spareNumbers = newList;
								dataNumbers.listAccounts[indexAccount].countSpareNumbers = newList.length;
							}
						});

						/* If we didn't open it yet, it will be automatically updated when we click on it */
						if(_.indexOf(listSearchedAccounts, destinationAccountId) > -1) {
							_.each(data.success, function(value, number) {
								dataNumbers.listAccounts[destinationIndex].spareNumbers.push(value);
							});

							dataNumbers.listAccounts[destinationIndex].countSpareNumbers = dataNumbers.listAccounts[destinationIndex].spareNumbers.length;
						}

						//TODO Sort date
						self.numbersPaintSpare(parent, dataNumbers, function() {
							var dataTemplate = {
									count: countMove,
									accountName: dataNumbers.listAccounts[destinationIndex].name
								},
								template = monster.template(self, '!' + self.i18n.active().numbers.successMove, dataTemplate);

							toastr.success(template);
						});
					});
				},
				dropdownAccount;

			parent.on('click', '#move_numbers', function() {
				var accountId = self.accountId,
					displayList = function() {
						dropdownAccount.reset();
					};

				if(_.isEmpty(originalAccountTree)) {
					self.numbersGetDescendants(accountId, function(listAccounts) {
						originalAccountTree = monster.util.accountArrayToTree(listAccounts, self.accountId);

						var args = {
							parent: parent.find('.list-numbers[data-type="spare"]'),
							accountsTree: originalAccountTree,
							callbacks: {
								clickAccount: moveNumbersToAccount,
								loaded: function(dropdown) {
									dropdownAccount = dropdown;
								}
							}
						};

						monster.pub('common.selectAccount', args);

						displayList();
					});
				}
				else {
					displayList();
				}
			});

			parent.on('click', '.cnam-number', function() {
				var cnamCell = $(this).parents('.number-box').first(),
					phoneNumber = cnamCell.data('phonenumber');

				if(phoneNumber) {
					var args = {
						phoneNumber: phoneNumber,
						callbacks: {
							success: function(data) {
								if(!($.isEmptyObject(data.data.cnam))) {
									cnamCell.find('.features i.feature-outbound_cnam').addClass('active');
								}
								else {
									cnamCell.find('.features i.feature-outbound_cnam').removeClass('active');
								}
							}
						}
					};

					monster.pub('common.callerId.renderPopup', args);
				}
			});

			parent.on('click', '.e911-number', function() {
				var e911Cell = $(this).parents('.number-box').first(),
					phoneNumber = e911Cell.data('phonenumber');

				if(phoneNumber) {
					var args = {
						phoneNumber: phoneNumber,
						callbacks: {
							success: function(data) {
								if(!($.isEmptyObject(data.data.dash_e911))) {
									e911Cell.find('.features i.feature-dash_e911').addClass('active');
								}
								else {
									e911Cell.find('.features i.feature-dash_e911').removeClass('active');
								}
							}
						}
					};

					monster.pub('common.e911.renderPopup', args);
				}
			});

			parent.on('click', '.failover-number', function() {
				var failoverCell = $(this).parents('.number-box').first(),
					phoneNumber = failoverCell.data('phonenumber');

				if(phoneNumber) {
					var args = {
						phoneNumber: phoneNumber,
						callbacks: {
							success: function(data) {
								if(!($.isEmptyObject(data.data.failover))) {
									failoverCell.find('.features i.feature-failover').addClass('active');
								}
								else {
									failoverCell.find('.features i.feature-failover').removeClass('active');
								}
							}
						}
					};

					monster.pub('common.failover.renderPopup', args);
				}
			});

			var searchListNumbers = function(searchString, parent) {
				var viewList = parent;

				searchString = monster.util.unformatPhoneNumber(searchString);

				self.numbersSearchAccount(searchString, function(data) {
					if(data.account_id) {
						displayNumberList(data.account_id, function() {
							var section = viewList.find('[data-id="' + data.account_id + '"]'),
								numberBox = section.find('[data-phonenumber="' + data.number + '"]');

							if(numberBox.size() > 0) {
								section.addClass('open');
								 $('html, body').animate({
									 scrollTop: numberBox.offset().top - 20
								 }, 1000);

								viewList.find('.number-box').removeClass('highlighted');

								if(!numberBox.hasClass('highlighted')) {
									numberBox.addClass('highlighted')
										.css('background', '#22ccff')
										.animate({ backgroundColor: '#BBFF99' }, 1000, function() { numberBox.css('background', ''); });
								}
							}
							else {
								var type = parent.attr('data-type') === 'spare' ? 'notSpareNumber' : 'notUsedNumber',
									template = monster.template(self, '!' + self.i18n.active().numbers[type], { number: data.number, accountName: section.data('name') });

								toastr.warning(template);
							}
						});
					}
				},
				function(data) {
					viewList.find('.number-box').removeClass('highlighted');
				});
			};

			parent.on('click', '.list-numbers[data-type="spare"] button.search-numbers', function(e) {
				var spareList = parent.find('.list-numbers[data-type="spare"]'),
					searchString = spareList.find('.search-custom input[type="text"]').val().toLowerCase();

				searchListNumbers(searchString, spareList);
			});

			parent.on('keyup', '.list-numbers[data-type="spare"] .search-custom input[type="text"]', function(e) {
				if(e.keyCode === 13) {
					var val = e.target.value.toLowerCase(),
						spareList = parent.find('.list-numbers[data-type="spare"]');

					if(val) {
						searchListNumbers(val, spareList);
					}
				}
			});

			parent.on('click', '.list-numbers[data-type="used"] button.search-numbers', function(e) {
				var usedList = parent.find('.list-numbers[data-type="used"]'),
					searchString = usedList.find('.search-custom input[type="text"]').val().toLowerCase();

				searchListNumbers(searchString, usedList);
			});

			parent.on('keyup', '.list-numbers[data-type="used"] .search-custom input[type="text"]', function(e) {
				if(e.keyCode === 13) {
					var val = e.target.value.toLowerCase(),
						usedList = parent.find('.list-numbers[data-type="used"]');

					if(val) {
						searchListNumbers(val, usedList);
					}
				}
			});
		},

		numbersPaintSpare: function(parent, dataNumbers, callback) {
			var self = this,
				template = monster.template(self, 'numbers-spare', dataNumbers);

			parent
				.find('.list-numbers[data-type="spare"]')
				.empty()
				.append(template);

			callback && callback();
		},

		numbersGetData: function(callback) {
			var self = this;

			monster.parallel({
					numbers: function(callback) {
						self.numbersList(self.accountId, function(numbers) {
							callback(null, numbers)
						});
					},
					accounts: function(callback) {
						self.numbersListAccounts(function(accounts) {
							callback(null, accounts);
						});
					}
				},
				function(err, results) {
					callback(results);
				}
			);
		},

		numbersMove: function(args, callback) {
			var self = this;

			monster.request({
				resource: 'common.numbers.move',
				data: {
					accountId: args.accountId,
					data: {
						numbers: args.numbers
					}
				},
				success: function(_dataNumbers, status) {
					callback && callback(_dataNumbers.data);
				}
			});
		},

		numbersGetDescendants: function(accountId, success, error) {
			var self = this;

			monster.request({
				resource: 'common.numbers.listDescendants',
				data: {
					accountId: accountId
				},
				success: function(_data, status) {
					success && success(_data.data);
				},
				error: function(_data, status) {
					error && error(_data);
				}
			});
		},

		numbersSearchAccount: function(phoneNumber, success, error) {
			var self = this;

			monster.request({
				resource: 'common.numbers.searchAccounts',
				data: {
					accountId: self.accountId,
					phoneNumber: phoneNumber
				},
				success: function(_data, status) {
					success && success(_data.data);
				},
				error: function(_data, status) {
					error && error(_data);
				}
			});
		},

		numbersDelete: function(args, callback) {
			var self = this;

			monster.request({
				resource: 'common.numbers.delete',
				data: {
					accountId: args.accountId,
					data: {
						numbers: args.numbers
					}
				},
				success: function(_dataNumbers, status) {
					callback && callback(_dataNumbers.data);
				}
			});
		},

		/* AccountID and Callback in args */
		numbersFormatDialogSpare: function(data) {
			var formattedData = {
				accountName: data.accountName,
				numbers: {}
			};

			_.each(data.numbers, function(number, id) {
				if(number.used_by === '') {
					number.phoneNumber = id;
					formattedData.numbers[id] = number;
				}
			});

			return formattedData;
		},

		numbersDialogSpare: function(args) {
			var self = this,
				accountId = args.accountId,
				accountName = args.accountName || '',
				callback = args.callback;

			self.numbersList(accountId, function(data) {
				data.accountName = accountName;

				var formattedData = self.numbersFormatDialogSpare(data),
				    spareTemplate = $(monster.template(self, 'numbers-dialogSpare', formattedData));

                spareTemplate.find('.empty-search-row').hide();

				spareTemplate.on('keyup', '.search-query', function() {
                	var rows = spareTemplate.find('.number-box'),
                    	emptySearch = spareTemplate.find('.empty-search-row'),
                    	currentRow;

                	currentNumberSearch = $(this).val().toLowerCase();

                	_.each(rows, function(row) {
                    	currentRow = $(row);
                    	currentRow.data('search').toLowerCase().indexOf(currentNumberSearch) < 0 ? currentRow.hide() : currentRow.show();
                	});

                	if(rows.size() > 0) {
                    	rows.is(':visible') ? emptySearch.hide() : emptySearch.show();
                	}
            	});

				spareTemplate.find('#proceed').on('click', function() {
					var selectedNumbersRow = spareTemplate.find('.number-box.selected'),
						selectedNumbers = [];

					_.each(selectedNumbersRow, function(row) {
						var number = $(row).data('number');

						selectedNumbers.push(formattedData.numbers[number]);
					});

					if(selectedNumbers.length > 0) {
						args.callback && args.callback(selectedNumbers);

						popup.dialog('close').remove();
					}
					else {
						monster.ui.alert('error', self.i18n.active().numbers.dialogSpare.noNumberSelected);
					}
				});

				spareTemplate.find('.number-box').on('click', function(event) {
					var $this = $(this);

					$this.toggleClass('selected');

					if(!$(event.target).is('input:checkbox')) {
						var $current_cb = $this.find('input[type="checkbox"]'),
							cb_value = $current_cb.prop('checked');

						$current_cb.prop('checked', !cb_value);
					}
				});

				spareTemplate.find('.cancel-link').on('click', function(e) {
					e.preventDefault();
					popup.dialog('close');
				});

				var popup = monster.ui.dialog(spareTemplate, {
					title: self.i18n.active().numbers.dialogSpare.title,
					position: ['center', 20]
				});
			});
		},

		numbersList: function(accountId, callback) {
			var self = this,
				mapCountry = {
					'FR': 'Paris, France',
					'DE': 'Berlin, Germany',
					'US': 'San Francisco, CA',
					'IN': 'Mumbai, India',
					'IT': 'Roma, Italy',
					'GB': 'London, Great-Britain',
					'IE': 'Dublin, Ireland',
					'BR': 'Rio de Jainero, Brazil',
					'RU': 'Moscow, Russia',
					'NZ': 'Wellington, New-Zealand',
					'UA': 'Kiev, Ukraine'
				},
				randomArray = ['FR', 'DE', 'US', 'IN', 'IT', 'GB', 'IE', 'BR', 'RU', 'NZ', 'UA'];

			monster.request({
				resource: 'common.numbers.list',
				data: {
					accountId: accountId
				},
				success: function(_dataNumbers, status) {
					/* TODO REMOVE */
					$.each(_dataNumbers.data.numbers, function(k, v) {
						v.isoCountry = randomArray[Math.floor((Math.random()*100)%(randomArray.length))];
						v.friendlyLocality = mapCountry[v.isoCountry];
					});

					callback && callback(_dataNumbers.data);
				}
			});
		},

		numbersListAccounts: function(callback) {
			var self = this;

			monster.request({
				resource: 'common.numbers.listChildren',
				data: {
					accountId: self.accountId
				},
				success: function(_dataAccounts, status) {
					callback && callback(_dataAccounts.data);
				}
			});
		}
	};

	return numbers;
});
