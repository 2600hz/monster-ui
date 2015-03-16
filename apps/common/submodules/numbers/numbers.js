define(function(require){
	var $ = require('jquery'),
		_ = require('underscore'),
		monster = require('monster'),
		toastr = require('toastr');

	var numbers = {

		requests: {
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
				container = args.container || $('#monster-content'),
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
			if('locality' in value) {
				value.isoCountry = value.locality.country || '';
				value.friendlyLocality = 'city' in value.locality ? value.locality.city + ('state' in value.locality ? ', ' + value.locality.state : '') : '';
			}

			_.each(value.features, function(feature) {
				if(feature in value.viewFeatures) {
					value.viewFeatures[feature].active = 'active';
				}
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
					outbound_cnam: { icon: 'icon-blue icon-user feature-outbound_cnam', help: self.i18n.active().numbers.cnamOutboundIconHelp },
					inbound_cnam: { icon: 'icon-green icon-user feature-inbound_cnam', help: self.i18n.active().numbers.cnamInboundIconHelp },
					dash_e911: { icon: 'icon-red icon-ambulance feature-dash_e911', help: self.i18n.active().numbers.e911IconHelp },
					local: { icon: 'icon-purple icon-rocket feature-local', help: self.i18n.active().numbers.localIconHelp },
					port: { icon: 'icon-phone icon-yellow feature-port' },
					prepend: { icon: 'icon-orange icon-file-text-alt feature-prepend', help: self.i18n.active().numbers.prependIconHelp }
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
							value.isLocal = value.features.indexOf('local') > -1;
							thisAccount.usedNumbers.push(value);
						}
					}
					else {
						value.isLocal = value.features.indexOf('local') > -1;
						thisAccount.usedNumbers.push(value);
					}
				}
				else {
					value.isLocal = value.features.indexOf('local') > -1;
					thisAccount.spareNumbers.push(value);
				}
			});

			thisAccount.countUsedNumbers = thisAccount.usedNumbers.length;
			thisAccount.countSpareNumbers = thisAccount.spareNumbers.length;
			thisAccount.open = 'open';

			mapAccounts[self.accountId] = thisAccount;

			var sortByDate = function(a,b) {
					return a.updated > b.updated ? -1 : 1;
				},
				sortByName = function(a,b) {
					return a.phoneNumber > b.phoneNumber;
				};

			/* Sort the list of numbers of the main account and add the subaccounts in a list to be ordered by name later */
			_.each(mapAccounts, function(value) {
				if(value.id !== self.accountId) {
					templateData.listAccounts.push(value);
				}
				else {
					value.spareNumbers.sort(sortByName);
					value.usedNumbers.sort(sortByName);
				}
			});

			/* Order the subaccount list by name */
			templateData.listAccounts.sort(function(a,b) {
				return a.name.toLowerCase() > b.name.toLowerCase() ? 1 :-1;
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
								usedNumbers = [],
								sortByName = function(a,b) {
									return a.phoneNumber > b.phoneNumber;
								};

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
								if(value.id === accountId) {
									value.spareNumbers = spareNumbers.sort(sortByName);
									value.usedNumbers = usedNumbers.sort(sortByName);
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

			if(dataNumbers.viewType === 'pbx') {
				parent.find('.list-numbers[data-type="spare"]').hide();
				parent.find('.half-box[data-type="used"]').addClass('selected');
			}
			else {
				parent.find('.list-numbers[data-type="used"]').hide();
				parent.find('.half-box[data-type="spare"]').addClass('selected');
			}

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
						}
					}
				});
			});

			parent.on('click', '.actions-wrapper .buy-numbers-dropdown .buy-numbers-link', function(e) {
				var accountId = self.accountId;

				monster.pub('common.buyNumbers', {
					accountId: self.accountId,
					searchType: $(this).data('type'),
					callbacks: {
						success: function(numbers) {
							displayNumberList(self.accountId, function(numbers) {}, true);
						}
					}
				});
			});

			parent.on('click', '.account-header .action-number.port', function(e) {
				var accountId = $(this).parents('.account-section').data('id');

				monster.pub('common.port.render', {
					accountId: accountId,
					callbacks: {
						success: function(numbers) {
							displayNumberList(accountId, function(numbers) {
								parent.find('.account-section[data-id="'+accountId+'"]').addClass('open');
							}, true);
						}
					}
				});
			});

			parent.on('click', '.actions-wrapper .action-number.port', function(e) {
				var accountId = self.accountId;

				monster.pub('common.port.render', {
					accountId: accountId,
					searchType: $(this).data('type'),
					callbacks: {
						success: function(numbers) {
							displayNumberList(accountId, function(numbers) {}, true);
						}
					}
				});
			});

			function syncNumbers (accountId) {
				self.numbersSyncUsedBy(accountId, function(numbers) {
					displayNumberList(accountId, function(numbers) {
						toastr.success(self.i18n.active().numbers.sync.success);
					}, true);
				});
			};

			parent.on('click', '.account-header .action-number.sync', function(e) {
				syncNumbers($(this).parents('.account-section').data('id'));
			});

			parent.on('click', '.actions-wrapper .action-number.sync', function(e) {
				syncNumbers(self.accountId);
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
					mapAccounts = {},
					dataTemplate = {
						delete: true,
						accountList: []
					}
					e911ErrorMessage = '';

				parent.find('.number-box.selected').each(function(k, v) {
					var box = $(v),
						number = box.data('phonenumber');
						accountId = box.parents('.account-section').data('id'),
						accountName = box.parents('.account-section').data('name').toString();

					if(!(accountId in mapAccounts)) {
						mapAccounts[accountId] = {};
						dataTemplate.accountList.push({
							accountName: accountName
						});
					}

					for (var account in dataTemplate.accountList) {
						if ( typeof dataTemplate.accountList[account].numbers == 'undefined' ) {
							dataTemplate.accountList[account].numbers = new Array();
						}

						if ( dataTemplate.accountList[account].accountName == accountName ) {
							dataTemplate.accountList[account].numbers.push(number);
						}
					}

					mapAccounts[accountId][number] = true;
					listNumbers.push(number);
				});

				dataTemplate.numberCount = listNumbers.length;

				_.each(dataTemplate.accountList, function(val) {

					var account = _.find(dataNumbers.listAccounts, function(account) { return account.name === val.accountName }),
						e911Numbers = _.filter(account.spareNumbers, function(num) {
										return num.features.indexOf('dash_e911') >= 0
									}).concat(_.filter(account.usedNumbers, function(num) {
										return num.features.indexOf('dash_e911') >= 0
									})),
						selectedE911Numbers = [];

						if(e911Numbers.length > 0) {
							_.each(e911Numbers, function(number) {
								if(val.numbers.indexOf(number.phoneNumber) >= 0) {
									selectedE911Numbers.push(number.phoneNumber);
								}
							});

							if(e911Numbers.length === selectedE911Numbers.length) {
								if(!e911ErrorMessage) {
									e911ErrorMessage = self.i18n.active().numbers.deleteE911Error.message;
								}
								e911ErrorMessage += "<br><br>" + self.i18n.active().numbers.deleteE911Error.account + " " + val.accountName;
								e911ErrorMessage += "<br>" + self.i18n.active().numbers.deleteE911Error.numbers + " " + selectedE911Numbers.join(', ');
							}
						}
				});

				if(e911ErrorMessage) {
					monster.ui.alert('error', e911ErrorMessage);
				} else {
					var dialogTemplate = $(monster.template(self, "numbers-actionsConfirmation", dataTemplate)),
						requestData = {
							numbers: listNumbers,
							accountId: self.accountId
						};

					monster.ui.dialog(dialogTemplate, {
						width: '540px',
						title: "Delete Numbers - Confirmation"
					});

					dialogTemplate.on('click', '.remove-number', function() {
						for (var number in requestData.numbers) {
							if ( $(this).parent().data('number') == requestData.numbers[number] ) {
								var tbody = $(this).parent().parent().parent(),
									childCount = tbody[0].childElementCount,
									numbersCount = dialogTemplate.find('h4').find('.monster-blue');

								requestData.numbers.splice(number, 1);
								$(this).parent().parent().remove();

								if ( childCount == 1 ) {
									tbody[0].previousElementSibling.remove();
									tbody.remove();
								}
								numbersCount.text(numbersCount.text() - 1);
							}

							if ( requestData.numbers.length == 0 ) {
								dialogTemplate.parent().parent().remove();
							}
						}
					});

					dialogTemplate.on('click', '.cancel-link', function() {
						dialogTemplate
							.parent()
							.parent()
							.remove();
					});

					dialogTemplate.on('click', '#delete_action', function() {
						self.numbersDelete(requestData, function(data) {
							var countDelete = 0;

							_.each(dataNumbers.listAccounts, function(account, indexAccount) {
								if(account.id in mapAccounts) {
									var newList = [];
									_.each(account.spareNumbers, function(number, indexNumber) {
										if(!data.hasOwnProperty('success') || !(number.phoneNumber in data.success)) {
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

								dialogTemplate.parent().parent().remove();

								toastr.success(template);
							});
						});
					});
				}

			});

			/* to plugin */
			var moveNumbersToAccount = function(accountId, accountName) {
				var listNumbers = [],
					destinationAccountId = accountId,
					destinationIndex = -1,
					mapAccounts = {},
					dataTemplate = {
						destinationAccountName: accountName,
						move: true,
						accountList: []
					};

				parent.find('.number-box.selected').each(function(k, v) {
					var box = $(v),
						number = box.data('phonenumber');
						accountId = box.parents('.account-section').data('id'),
						accountName = box.parents('.account-section').data('name');

					if(!(accountId in mapAccounts)) {
						mapAccounts[accountId] = {};
						dataTemplate.accountList.push({
							accountName: accountName
						});
					}

					for (var account in dataTemplate.accountList) {
						if ( typeof dataTemplate.accountList[account].numbers == 'undefined' ) {
							dataTemplate.accountList[account].numbers = new Array();
						}

						if ( dataTemplate.accountList[account].accountName == accountName ) {
							dataTemplate.accountList[account].numbers.push(number);
						}
					}

					mapAccounts[accountId][number] = true;
					listNumbers.push(number);
				});

				dataTemplate.numberCount = listNumbers.length;

				var dialogTemplate = $(monster.template(self, "numbers-actionsConfirmation", dataTemplate)),
					requestData = {
						numbers: listNumbers,
						accountId: destinationAccountId
					};

				monster.ui.dialog(dialogTemplate, {
					width: '540px',
					title: "Move Numbers - Confirmation"
				});

				dialogTemplate.on('click', '.remove-number', function() {
					for (var number in requestData.numbers) {
						if ( $(this).parent().data('number') == requestData.numbers[number] ) {
							var tbody = $(this).parent().parent().parent(),
								childCount = tbody[0].childElementCount,
								numbersCount = dialogTemplate.find('h4').find('.monster-blue:first-child');

							requestData.numbers.splice(number, 1);
							$(this).parent().parent().remove();

							if ( childCount == 1 ) {
								tbody[0].previousElementSibling.remove();
								tbody.remove();
							}
							numbersCount.text(numbersCount.text() - 1);
						}

						if ( requestData.numbers.length == 0 ) {
							dialogTemplate.parent().parent().remove();
						}
					}
				});

				dialogTemplate.on('click', '.cancel-link', function() {
					dialogTemplate
						.parent()
						.parent()
						.remove();
				});

				dialogTemplate.on('click', '#move_action', function() {
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

						self.numbersPaintSpare(parent, dataNumbers, function() {
							var dataTemplate = {
									count: countMove,
									accountName: dataNumbers.listAccounts[destinationIndex].name
								},
								template = monster.template(self, '!' + self.i18n.active().numbers.successMove, dataTemplate);

							dialogTemplate.parent().parent().remove();

							toastr.success(template);
						});
					});
				});
			};

			parent.on('click', '#move_numbers', function() {
				monster.pub('common.accountBrowser.render', {
					container: parent.find('.list-numbers[data-type="spare"] .accounts-dropdown'),
					customClass: 'ab-dropdown',
					onAccountClick: function(accountId, accountName) {
						moveNumbersToAccount(accountId, accountName);
						parent.find('.list-numbers[data-type="spare"] .dropdown-move').removeClass('open');
					}
				});
			});

			parent.on('click', '.cnam-number', function() {
				var cnamCell = $(this).parents('.number-box').first(),
					phoneNumber = cnamCell.data('phonenumber');

				if(phoneNumber) {
					var args = {
						phoneNumber: phoneNumber,
						callbacks: {
							success: function(data) {
								if('cnam' in data.data && data.data.cnam.display_name) {
									cnamCell.find('.features i.feature-outbound_cnam').addClass('active');
								} else {
									cnamCell.find('.features i.feature-outbound_cnam').removeClass('active');
								}

								if('cnam' in data.data && data.data.cnam.inbound_lookup) {
									cnamCell.find('.features i.feature-inbound_cnam').addClass('active');
								} else {
									cnamCell.find('.features i.feature-inbound_cnam').removeClass('active');
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

			parent.on('click', '.prepend-number', function() {
				var prependCell = $(this).parents('.number-box').first(),
					phoneNumber = prependCell.data('phonenumber');

				if(phoneNumber) {
					var args = {
						phoneNumber: phoneNumber,
						callbacks: {
							success: function(data) {
								if('prepend' in data.data && data.data.prepend.enabled) {
									prependCell.find('.features i.feature-prepend').addClass('active');
								} else {
									prependCell.find('.features i.feature-prepend').removeClass('active');
								}
							}
						}
					};

					monster.pub('common.numberPrepend.renderPopup', args);
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
								monster.ui.highlight(numberBox, {
									timer: 5000
								});
							}
							else {
								var type = parent.attr('data-type') === 'spare' ? 'notSpareNumber' : 'notUsedNumber',
									template = monster.template(self, '!' + self.i18n.active().numbers[type], { number: data.number, accountName: section.data('name') });

								toastr.warning(template);
							}
						});
					}
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

			self.callApi({
				resource: 'numbers.activateBlock',
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

		numbersSearchAccount: function(phoneNumber, success, error) {
			var self = this;

			self.callApi({
				resource: 'numbers.identify',
				data: {
					accountId: self.accountId,
					phoneNumber: phoneNumber,
					generateError: false
				},
				success: function(_data, status) {
					success && success(_data.data);
				},
				error: function(_data, status) {
					error && error(_data);

					toastr.error(self.i18n.active().numbers.numberNotFound);
				}
			});
		},

		numbersDelete: function(args, callback) {
			var self = this;

			self.callApi({
				resource: 'numbers.deleteBlock',
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
		numbersFormatDialogSpare: function(data, ignoreNumbers, extraNumbers) {
			var self = this,
				formattedData = {
					accountName: data.accountName,
					sortedNumbers: [],
					numbers: {}
				},
				sortByNumber = function(a,b) {
					return a.phoneNumber > b.phoneNumber;
				};

			_.each(data.numbers, function(number, id) {
				if((number.used_by === '' || extraNumbers.indexOf(id) >= 0) && ignoreNumbers.indexOf(id) === -1) {
					number.phoneNumber = id;
					number = self.numbersFormatNumber(number);

					formattedData.sortedNumbers.push(number);
					formattedData.numbers[id] = number;
				}
			});

			formattedData.sortedNumbers.sort(sortByNumber);

			return formattedData;
		},

		numbersDialogSpare: function(args) {
			var self = this,
				accountId = args.accountId,
				accountName = args.accountName || '',
				ignoreNumbers = args.ignoreNumbers || [],
				extraNumbers = args.extraNumbers || [],
				callback = args.callback;

			self.numbersList(accountId, function(data) {
				data.accountName = accountName;

				var formattedData = self.numbersFormatDialogSpare(data, ignoreNumbers, extraNumbers),
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
						remainingQuantity = formattedData.sortedNumbers.length - selectedNumbersRow.length,
						selectedNumbers = [];

					_.each(selectedNumbersRow, function(row) {
						var number = $(row).data('number');

						selectedNumbers.push(formattedData.numbers[number]);
					});

					if(selectedNumbers.length > 0) {
						args.callback && args.callback(selectedNumbers, remainingQuantity);

						popup.dialog('close').remove();
					}
					else {
						monster.ui.alert('error', self.i18n.active().numbers.dialogSpare.noNumberSelected);
					}
				});

				spareTemplate.find('.number-box:not(.no-data)').on('click', function(event) {
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

		numbersList: function(accountId, globalCallback) {
			var self = this;

			monster.parallel({
					callflows: function(callback) {
						self.numbersListCallflows(accountId, function(callflows) {
							callback && callback(null, callflows);
						});
					},
					groups: function(callback) {
						self.numbersListGroups(accountId, function(groups) {
							callback && callback(null, groups);
						});
					},
					users: function(callback) {
						self.numbersListUsers(accountId, function(users) {
							callback && callback(null, users);
						});
					},
					numbers: function(callback) {
						self.numbersListNumbers(accountId, function(numbers) {
							callback && callback(null, numbers);
						});
					}
				},
				function(err, results) {
					self.numbersFormatList(results);

					globalCallback && globalCallback(results.numbers);
				}
			);
		},

		numbersFormatList: function(data) {
			var self = this,
				mapUsers = {},
				mapGroups = {};

			_.each(data.users, function(user) {
				mapUsers[user.id] = user;
			});

			_.each(data.groups, function(group) {
				mapGroups[group.id] = group;
			});

			_.each(data.callflows, function(callflow) {
				_.each(callflow.numbers, function(number) {
					if(number in data.numbers.numbers) {
						if(callflow.owner_id && callflow.owner_id in mapUsers) {
							var user = mapUsers[callflow.owner_id];

							data.numbers.numbers[number].owner = user.first_name + ' ' + user.last_name;
							data.numbers.numbers[number].ownerType = 'user';
						}
						else if(callflow.group_id) {
							data.numbers.numbers[number].owner = mapGroups[callflow.group_id].name;
							data.numbers.numbers[number].ownerType = 'group';
						}
						else if(callflow.type && callflow.type === 'main') {
							data.numbers.numbers[number].owner = self.i18n.active().numbers.mainNumber;
							data.numbers.numbers[number].ownerType = 'main';
						}
						else if(callflow.type && callflow.type === 'conference') {
							data.numbers.numbers[number].owner = self.i18n.active().numbers.conferenceNumber;
							data.numbers.numbers[number].ownerType = 'conference';
						}
					}
				});
			});

			return data;
		},

		numbersSyncUsedBy: function(accountId, callback) {
			var self = this;

			self.callApi({
				resource: 'numbers.sync',
				data: {
					accountId: accountId
				},
				success: function(numbers) {
					callback && callback(numbers.data);
				}
			});
		},

		numbersListUsers: function(accountId, callback) {
			var self = this;

			self.callApi({
				resource: 'user.list',
				data: {
					accountId: accountId
				},
				success: function(users, status) {
					callback && callback(users.data);
				}
			});
		},

		numbersListCallflows: function(accountId, callback) {
			var self = this;

			self.callApi({
				resource: 'callflow.list',
				data: {
					accountId: accountId
				},
				success: function(callflows, status) {
					callback && callback(callflows.data);
				}
			});
		},

		numbersListGroups: function(accountId, callback) {
			var self = this;

			self.callApi({
				resource: 'group.list',
				data: {
					accountId: accountId
				},
				success: function(groups, status) {
					callback && callback(groups.data);
				}
			});
		},

		numbersListNumbers: function(accountId, callback) {
			var self = this;

			self.callApi({
				resource: 'numbers.list',
				data: {
					accountId: accountId
				},
				success: function(_dataNumbers, status) {
					callback && callback(_dataNumbers.data);
				}
			});
		},

		numbersListAccounts: function(callback) {
			var self = this;

			self.callApi({
				resource: 'account.listChildren',
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
