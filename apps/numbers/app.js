define(function(require){
	var $ = require('jquery'),
		_ = require('underscore'),
		monster = require('monster'),
		toastr = require('toastr');

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
			'numbers.move': {
				url: 'accounts/{accountId}/phone_numbers/collection/activate',
				verb: 'PUT'
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

				var numbersView = $(monster.template(self, 'app', data)),
					spareView = monster.template(self, 'spareNumbers', data),
					usedView = monster.template(self, 'usedNumbers', data);

				numbersView.find('.list-numbers[data-type="spare"]').append(spareView);
				numbersView.find('.list-numbers[data-type="used"]').append(usedView);

				self.bindEvents(numbersView, data);

				$('#ws-content')
					.empty()
					.append(numbersView);
			});
		},

		//_util
		formatNumber: function(value) {
			var self = this;

			value.viewFeatures = {
                failover: { icon: 'icon-green icon-thumbs-down feature-failover' },
                outbound_cnam: { icon: 'icon-blue icon-user feature-outbound_cnam' },
                dash_e911: { icon: 'icon-red icon-ambulance feature-dash_e911' },
                local: { icon: 'icon-purple icon-android feature-local' }
            };

            _.each(value.features, function(feature) {
                value.viewFeatures[feature].active = 'active';
            });

            if('used_by' in value) {
                value.friendlyUsedBy = self.i18n.active()[value.used_by];
            }

			return value;
		},

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
			var thisAccount = _.extend(monster.apps['auth'].currentAccount, templateLists);

			_.each(data.accounts, function(account) {
				mapAccounts[account.id] = account;
			});

			/* assign each number to spare numbers or used numbers for main account */
			_.each(data.numbers.numbers, function(value, phoneNumber) {
				value.phoneNumber = phoneNumber;

				value = self.formatNumber(value);

                value.used_by ? thisAccount.usedNumbers.push(value) : thisAccount.spareNumbers.push(value);
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

		bindEvents: function(parent, dataNumbers) {
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

				if(_.indexOf(listSearchedAccounts, accountId) === -1) {
					self.listNumbers(accountId, function(numbers) {
						var spareNumbers = [],
							usedNumbers = [];

						listSearchedAccounts.push(accountId);

						_.each(numbers.numbers, function(value, phoneNumber) {
                			if(phoneNumber !== 'id' && phoneNumber !== 'quantity') {
                    			value.phoneNumber = phoneNumber;

								value = self.formatNumber(value);

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
									.append(monster.template(self, 'spareNumbersAccount', { spareNumbers: spareNumbers }))
									.parent()
									.find('.count')
									.html('('+ spareNumbers.length +')');

								parent
									.find('.list-numbers[data-type="used"] .account-section[data-id="'+accountId+'"] .numbers-wrapper')
									.empty()
									.append(monster.template(self, 'usedNumbersAccount', { usedNumbers: usedNumbers }))
									.parent()
									.find('.count')
									.html('('+ usedNumbers.length +')');

								return false;
							}
						});

						toggle();
					});
				}
				else {
					toggle();
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

				monster.ui.confirm(self.i18n.active().confirmDelete, function() {
					self.deleteNumbers(requestData, function(data) {
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

						self.paintSpareNumbers(parent, dataNumbers, function() {
							var template = monster.template(self, '!' + self.i18n.active().successDelete, { count: countDelete });

							toastr.success(template);
						});
					});
				});
			});

			/* Move Numbers */
			parent.on('click', '.account-dropdown', function(event) {
                var listNumbers = [],
					destinationAccountId = $(this).data('id'),
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

                self.moveNumbers(requestData, function(data) {
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
                    self.paintSpareNumbers(parent, dataNumbers, function() {
                    	var dataTemplate = {
								count: countMove,
								accountName: dataNumbers.listAccounts[destinationIndex].name
                    		},
                        	template = monster.template(self, '!' + self.i18n.active().successMove, dataTemplate);

                        toastr.success(template);
                    });
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
                                if(!($.isEmptyObject(data.data.cnam))) {
                                    cnamCell.find('.features i.feature-outbound_cnam').addClass('active');
                                }
                                else {
                                    cnamCell.find('.features i.feature-outbound_cnam').removeClass('active');
                                }
                            }
                        }
                    };

                    monster.apps.load('callerId', function(app) {
                        monster.pub('callerId.editPopup', args);
                    });
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

                    monster.apps.load('e911', function(app) {
                        monster.pub('e911.editPopup', args);
                    });
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

                    monster.apps.load('failover', function(app) {
                        monster.pub('failover.editPopup', args);
                    });
                }
            });
		},

		paintSpareNumbers: function(parent, dataNumbers, callback) {
			var self = this,
				template = monster.template(self, 'spareNumbers', dataNumbers);

			parent
				.find('.list-numbers[data-type="spare"]')
				.empty()
				.append(template);

			callback && callback();
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

		moveNumbers: function(args, callback) {
			var self = this;

            monster.request({
                resource: 'numbers.move',
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
					'RU': 'Moscow, Russia,',
					'NZ': 'Wellington, New-Zealand',
					'UA': 'Kiev, Ukraine'
				},
				randomArray = ['FR', 'DE', 'US', 'IN', 'IT', 'GB', 'IE', 'BR', 'RU', 'NZ', 'UA'];

			monster.request({
				resource: 'numbers.list',
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
