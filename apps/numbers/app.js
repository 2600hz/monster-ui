define(function(require){
	var $ = require('jquery'),
		_ = require('underscore'),
		monster = require('monster');

	var app = {

		name: 'numbers',

		i18n: [ 'en-US' ],

		requests: {
			'numbers.list': {
				url: 'accounts/{accountId}/phone_numbers',
				verb: 'GET'
			},
			'numbers.delete': {
				url: 'accounts/{accountId}/phone_numbers/collection',
				verb: 'DELETE'
			},
			'accounts.list': {
				url: 'accounts/{accountId}/children',
				verb: 'GET'
			}
		},

		subscribe: {
		},

		load: function(callback){
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

		render: function(container){
			var self = this;

			self.getData(function(data) {
				data = self.formatData(data);

				var numbersView = $(monster.template(self, 'app', data));

				/* Append list of spare numbers for our account, and the count */
				numbersView
					.find('.account-section[data-id="' + self.accountId + '"] .numbers-wrapper')
					.append(monster.template(self, 'spareNumbers', data.listAccounts[0]))
					.parent()
					.find('.count')
					.html('('+ data.listAccounts[0].spareNumbers.length + ')');

				self.bindEvents(numbersView);

				$('#ws-content')
					.empty()
					.append(numbersView);
			});
		},

		//_util
		formatData: function(data) {
			var self = this,
				mapAccounts = {},
				templateLists = {
					spareNumbers: [],
					usedNumbers: []
				},
				templateData = {
					listAccounts: []
				};

			/* Initializing accounts metadata */
			mapAccounts[self.accountId] = _.extend(monster.apps['auth'].currentAccount, templateLists);

			_.each(data.accounts, function(account) {
				mapAccounts[account.id] = account;
			});

			/* assign each number to spare numbers or used numbers for main account */
			_.each(data.numbers, function(value, phoneNumber) {
				if(phoneNumber !== 'id') {
					value.phoneNumber = phoneNumber;

					value.used_by ? mapAccounts[self.accountId].usedNumbers.push(value) : mapAccounts[self.accountId].spareNumbers.push(value);
				}
			});

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

		bindEvents: function(parent) {
			var self = this,
				listSearchedAccounts = [ self.accountId ],
				showLinks = function() {
					if(parent.find('.number-box.selected').size() > 0) {
						parent.find('#trigger_links').show();
					}
					else {
						parent.find('#trigger_links').hide();
					}
				};

			/* On init */
			parent.find('[data-toggle="tooltip"]').tooltip();
			parent.find('.account-section').first().addClass('open searched');

			/* Events */
			/* Select all numbers when clicking on the account checkbox */
			parent.find('.account-header input[type="checkbox"]').on('click', function(event) {
				var checkboxes = $(this).parents('.account-section').first().find('.number-box input[type="checkbox"]'),
					isChecked = $(this).prop('checked');

				checkboxes.prop('checked', isChecked);

				isChecked ? checkboxes.parent().addClass('selected') : checkboxes.parent().removeClass('selected');

				showLinks();
			});

			/* Click on an account header, open list of numbers of this account. Send an API call to search it if it has not been searched already */
			parent.find('.expandable').on('click', function(event) {
				var section = $(this).parents('.account-section'),
				    accountId = section.data('id'),
					target = $(event.target),
					openIfNotCheckbox = function() {
						if(!target.is('input:checkbox')) {
							if(section.hasClass('open')) {
								parent.find('.account-section').removeClass('open');
							}
							else {
								parent.find('.account-section').removeClass('open');
								section.addClass('open');
							}

							parent.find('input[type="checkbox"]:checked').prop('checked', false);
							parent.find('.number-box.selected').removeClass('selected');
						}
					};

				if(_.indexOf(listSearchedAccounts, accountId) === -1) {
					self.listNumbers(accountId, function(numbers) {
						var spareNumbers = [],
							usedNumbers = [];

						_.each(numbers, function(value, phoneNumber) {
                			if(phoneNumber !== 'id') {
                    			value.phoneNumber = phoneNumber;

                    			value.used_by ? usedNumbers.push(value) : spareNumbers.push(value);
                			}
            			});

						listSearchedAccounts.push(accountId);

						section
							.addClass('searched')
							.find('.numbers-wrapper')
							.empty()
							.append(monster.template(self, 'spareNumbers', { spareNumbers: spareNumbers }))
							.parent()
							.find('.count')
							.html('(' + spareNumbers.length + ')');

						openIfNotCheckbox();
					});
				}
				else {
					openIfNotCheckbox();
				}

				showLinks();
			});

			/* Add class selected when you click on a number box, check/uncheck  the account checkbox if all/no numbers are checked */
			parent.on('click', '.number-box', function(event) {
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

			/* Delete Numbers */
			parent.find('#delete_numbers').on('click', function(event) {
				var listNumbers = [];

				parent.find('.number-box.selected').each(function(k, v) {
					listNumbers.push($(v).data('phonenumber'));
				});

				var section = parent.find('.number-box.selected').first().parents('.account-section')
					accountId = section.data('id'),
				    requestData = {
						numbers: listNumbers,
						accountId: accountId
					};

				self.deleteNumbers(requestData, function(data) {
					self.listNumbers(accountId, function(numbers) {
                        var spareNumbers = [],
                            usedNumbers = [];

                        _.each(numbers, function(value, phoneNumber) {
                            if(phoneNumber !== 'id') {
                                value.phoneNumber = phoneNumber;

                                value.used_by ? usedNumbers.push(value) : spareNumbers.push(value);
                            }
                        });

                        section
                            .find('.numbers-wrapper')
                            .empty()
                            .append(monster.template(self, 'spareNumbers', { spareNumbers: spareNumbers }))
                            .parent()
                            .find('.count')
                            .html('(' + spareNumbers.length + ')');
                    });
				});
			});
		},

		getData: function(callback) {
			var self = this;

			monster.parallel({
                    numbers: function(callback) {
                        self.listNumbers(self.accountId, function(numbers) {
                            callback(null, numbers)
						});
                    },
                    accounts: function(callback) {
                        self.listAccounts(function(accounts) {
                            callback(null, accounts);
                        });
                    }
                },
                function(err, results) {
					callback(results);
                }
            );
		},

		deleteNumbers: function(args, callback) {
			var self = this;

            monster.request({
                resource: 'numbers.delete',
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

		listNumbers: function(accountId, callback) {
			var self = this;

			monster.request({
				resource: 'numbers.list',
				data: {
					accountId: accountId
				},
				success: function(_dataNumbers, status) {
					callback && callback(_dataNumbers.data);
				}
			});
		},

		listAccounts: function(callback) {
			var self = this;

			monster.request({
				resource: 'accounts.list',
				data: {
					accountId: self.accountId
				},
				success: function(_dataAccounts, status) {
					callback && callback(_dataAccounts.data);
				}
			});
		}
	};

	return app;
});
