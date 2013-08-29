define(function(require){
	var $ = require('jquery'),
		_ = require('underscore'),
		monster = require('monster'),
		timezone = require('monster-timezone'),
		toastr = require('toastr');

	var app = {

		requests: {
			'voip.users.resendInstructions': {
				apiRoot: 'apps/voip/submodules/users/fixtures/',
				url: 'resendInstructions.json',
				verb: 'POST'
			},
			'voip.users.resetPassword': {
				apiRoot: 'apps/voip/submodules/users/fixtures/',
				url: 'resetPassword.json',
				verb: 'POST'
			},
			'voip.users.getCallflows': {
				apiRoot: 'apps/voip/submodules/users/fixtures/',
				url: 'getCallflows.json',
				verb: 'GET'
			},
			'voip.users.getDevices': {
				apiRoot: 'apps/voip/submodules/users/fixtures/',
				url: 'getDevices.json',
				verb: 'GET'
			},
			'voip.users.getNumbers': {
				apiRoot: 'apps/voip/submodules/users/fixtures/',
				url: 'getNumbers.json',
				verb: 'GET'
			},
			'voip.users.getUsers': {
				apiRoot: 'apps/voip/submodules/users/fixtures/',
				url: 'getUsers.json',
				verb: 'GET'
			},
			'voip.users.getUser': {
				url: 'accounts/{accountId}/users/{userId}',
				verb: 'GET'
			}/*,
			'voip.users.getNumbers': {
				url: 'accounts/{accountId}/phone_numbers',
				verb: 'GET'
			},
			'voip.users.resendInstructions': {
				url: 'accounts/{accountId}/users/{userId}/resend_instructions',
				verb: 'POST'
			},
			'voip.users.resetPassword': {
				url: 'accounts/{accountId}/users/{userId}/reset_password',
				verb: 'POST'
			},

			'voip.users.getCallflows': {
				url: 'accounts/{accountId}/callflows',
				verb: 'GET'
			},
			'voip.users.getDevices': {
				url: 'accounts/{accountId}/devices',
				verb: 'GET'
			},
			'voip.users.getUsers': {
				url: 'accounts/{accountId}/users',
				verb: 'GET'
			}*/
		},

		subscribe: {
			'voip.users.render': 'usersRender'
		},

		/* Users */
		usersRender: function(parent) {
			var self = this;

			self.usersGetData(function(dataTemplate) {
				var template = $(monster.template(self, 'users-layout', dataTemplate)),
					templateUser;

				_.each(dataTemplate.users, function(user) {
					templateUser = monster.template(self, 'users-row', user);

					template.find('.user-rows').append(templateUser);
				});

				self.usersBindEvents(template, parent);

				parent
					.empty()
					.append(template);
			});
		},

		usersGetData: function(callback) {
			var self = this;

			monster.parallel({
					users: function(callback) {
						monster.request({
							resource: 'voip.users.getUsers',
							data: {
								accountId: self.accountId
							},
							success: function(dataUsers) {
								callback(null, dataUsers.data);
							}
						});
					},
					callflows: function(callback) {
						monster.request({
							resource: 'voip.users.getCallflows',
							data: {
								accountId: self.accountId
							},
							success: function(dataCallflows) {
								callback(null, dataCallflows.data);
							}
						});
					},
					devices: function(callback) {
						monster.request({
							resource: 'voip.users.getDevices',
							data: {
								accountId: self.accountId
							},
							success: function(dataDevices) {
								callback(null, dataDevices.data);
							}
						});
					}
				},
				function(err, results) {
					dataTemplate = self.usersFormatListData(results);

					callback && callback(dataTemplate);
				}
			);
		},

		usersFormatUserData: function(dataUser) {
			var formattedUser = {
					additionalDevices: 0,
					additionalExtensions: 0,
					additionalNumbers: 0,
					devices: [],
					extension: '',
					isAdmin: dataUser.priv_level === 'admin',
					phoneNumber: ''
				};

			dataUser = $.extend(true, {}, formattedUser, dataUser);

			return dataUser;
		},

		usersFormatListData: function(data) {
			var self = this,
				dataTemplate = {},
			    mapUsers = {};

			_.each(data.users, function(user) {
				mapUsers[user.id] = self.usersFormatUserData(user);
			});

			_.each(data.callflows, function(callflow) {
				var userId = callflow.owner_id;

				if(userId in mapUsers) {
					user = mapUsers[userId];

					//User can only have one phoneNumber and one extension displayed with this code
					_.each(callflow.numbers, function(number) {
						if(number.length < 6) {
							if(user.extension === '') {
								user.extension = number;
							}
							else {
								user.additionalExtensions++;
							}
						}
						else {
							if(user.phoneNumber === '') {
								user.phoneNumber = number;
							}
							else {
								user.additionalNumbers++;
							}
						}
					});
				}
			});

			_.each(data.devices, function(device) {
				var userId = device.owner_id;

				if(userId in mapUsers) {
					if(mapUsers[userId].devices.length == 2) {
						mapUsers[userId].additionalDevices++;
					}
					else {
						mapUsers[userId].devices.push(device.device_type);
					}
				}
			});

			dataTemplate.users = mapUsers;

			return dataTemplate;
		},

		usersBindEvents: function(template, parent) {
			var self = this,
				currentUser,
				toastrMessages = self.i18n.active().users.toastrMessages;

			template.on('click', '.cancel-link', function() {
				template.find('.edit-user').empty().hide();
			});


			template.on('click', '#resend_instructions', function() {
				var userId = $(this).parents('.grid-row').data('id');

				monster.request({
					resource: 'voip.users.resendInstructions',
					data: {
						accountId: self.accountId,
						userId: userId
					},
					success: function(data) {
						toastr.success(monster.template(self, '!' + toastrMessages.instructionsSent, { email: currentUser.email }));
					}
				});
			});

			template.on('click', '#reset_password', function() {
				var userId = $(this).parents('.grid-row').data('id');

				monster.request({
					resource: 'voip.users.resetPassword',
					data: {
						accountId: self.accountId,
						userId: userId
					},
					success: function(data) {
						toastr.success(monster.template(self, '!' + toastrMessages.passwordReseted, { email: currentUser.email }));
					}
				});
			});

			template.find('.grid-row:not(.title) .grid-cell').on('click', function() {
				var cell = $(this),
					type = cell.data('type'),
					row = cell.parents('.grid-row'),
					userId = row.data('id');

				template.find('.edit-user').empty().hide();

				template.find('.grid-cell').removeClass('active');
				cell.toggleClass('active');

				self.usersGetTemplate(type, userId, function(template, data) {
					if(type === 'user') {
						currentUser = data;
					}

					row.find('.edit-user').append(template).show();
				});
			});

			template.find('.users-header .search-query').on('keyup', function() {
				var searchString = $(this).val().toLowerCase(),
					rows = template.find('.grid-row:not(.title)');

				_.each(rows, function(row) {
					var row = $(row);

					if(row.data('search').toLowerCase().indexOf(searchString) < 0) {
						row.hide();
					}
					else {
						row.show();
					}
				});
			});
		},

		usersGetTemplate: function(type, userId, callbackAfterData) {
			var self = this,
				template;

			if(type === 'name') {
				self.usersGetNameTemplate(userId, callbackAfterData);
			}
			else if(type === 'numbers') {
				self.usersGetNumbersTemplate(userId, callbackAfterData);
			}
		},

		usersGetNameTemplate: function(userId, callback) {
			var self = this;

			monster.request({
				resource: 'voip.users.getUser',
				data: {
					accountId: self.accountId,
					userId: userId
				},
				success: function(data) {
					data = self.usersFormatUserData(data.data);

					template = $(monster.template(self, 'users-name', data));

					timezone.populateDropdown(template.find('#user_timezone'), data.timezone);

					callback && callback(template, data);
				}
			});
		},

		usersGetNumbersTemplate: function(userId, callback) {
			var self = this;

			monster.parallel({
					callflows: function(callbackParallel) {
						monster.request({
							resource: 'voip.users.getCallflows',
							data: {
								accountId: self.accountId
							},
							success: function(callflows) {
								callbackParallel && callbackParallel(null, callflows.data);
							}
						});
					},
					numbers: function(callbackParallel) {
						monster.request({
							resource: 'voip.users.getNumbers',
							data: {
								accountId: self.accountId
							},
							success: function(numbers) {
								callbackParallel && callbackParallel(null, numbers.data);
							}
						});
					}
				},
				function(err, results) {
					results = self.usersFormatNumbersData(userId, results);

					console.log(results);
					template = $(monster.template(self, 'users-numbers', results));

					callback && callback(template, results);
				}
			);
		},

		usersFormatNumbersData: function(userId, data) {
			console.log(data);
			var numbers = {
				assignedNumbers: {},
				unassignedNumbers: {}
			};

			/* If a number is in a callflow and is set as used by callflows in the number manager, then we display it as an assigned number */
			_.each(data.callflows, function(callflow) {
				if(callflow.owner_id === userId) {
					_.each(callflow.numbers, function(number) {
						if(number in data.numbers.numbers && data.numbers.numbers[number].used_by === 'callflow') {
							numbers.assignedNumbers[number] = data.numbers.numbers[number];
						}
					});
				}
			});

			if('numbers' in data.numbers) {
				_.each(data.numbers.numbers, function(v, k) {
					if(v.used_by === '') {
						numbers.unassignedNumbers[k] = v;
					}
				});
			}

			return numbers;
		}
	};

	return app;
});
