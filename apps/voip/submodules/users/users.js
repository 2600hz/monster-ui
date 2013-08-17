define(function(require){
	var $ = require('jquery'),
		_ = require('underscore'),
		monster = require('monster'),
		timezone = require('monster-timezone'),
		toastr = require('toastr');

	var app = {

		requests: {
			'voip.getUser': {
				url: 'accounts/{accountId}/users/{userId}',
				verb: 'GET'
			},
			'voip.getCallflows': {
				url: 'accounts/{accountId}/callflows',
				verb: 'GET'
			},
			'voip.getDevices': {
				url: 'accounts/{accountId}/devices',
				verb: 'GET'
			},
			'voip.getUsers': {
				url: 'accounts/{accountId}/users',
				verb: 'GET'
			}
		},

		subscribe: {
			'voip.users.render': 'usersRender'
		},

		/* Users */
		usersRender: function(parent) {
			var self = this;

			monster.parallel({
					users: function(callback) {
						monster.request({
							resource: 'voip.getUsers',
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
							resource: 'voip.getCallflows',
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
							resource: 'voip.getDevices',
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
					dataTemplate = self.usersFormatData(results);

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
				}
			);
		},

		usersFormatUserData: function(dataUser) {
			var defaultUser = {
					extension: '7200',
					phoneNumber: '415-202-4332',
					devices: [ 'softPhone', 'deskPhone' ],
					additionalDevices: 2,
					features: [ 'call_forward' ] //TODO LIST of Features
				},
				formattedData = {
					isAdmin: dataUser.priv_level === 'admin'
				};

			dataUser = $.extend(true, {}, defaultUser, formattedData, dataUser);

			return dataUser;
		},

		usersFormatData: function(data) {
			var self = this,
				dataTemplate = {},
			    mapUsers = {};

			console.log(data);

			_.each(data.users, function(user) {
				mapUsers[user.id] = self.usersFormatUserData(user);
			});

			dataTemplate.users = mapUsers;

			console.log(dataTemplate);

			return dataTemplate;
		},

		usersBindEvents: function(template, parent) {
			var self = this;

			template.find('.grid-row:not(.title) .grid-cell').on('click', function() {
				var cell = $(this),
					type = cell.data('type'),
					row = cell.parents('.grid-row'),
					userId = row.data('id');

				template.find('.edit-user').empty().hide();

				template.find('.grid-cell').removeClass('active');
				cell.toggleClass('active');

				self.usersGetRowTemplate(type, userId, function(template) {
					row.find('.edit-user').append(template).show();
				});
			});

			template.find('.users-header .search-query').on('keyup', function() {
				var searchString = $(this).val().toLowerCase(),
					rows = template.find('.grid-row:not(.title)');

				_.each(rows, function(row) {
					var row = $(row);

					console.log(row);
					if(row.data('search').toLowerCase().indexOf(searchString) < 0) {
						row.hide();
					}
					else {
						row.show();
					}
				});
			});
		},

		usersGetRowTemplate: function(type, userId, callback) {
			var self = this,
				template;

			if(type === 'name') {
				monster.request({
					resource: 'voip.getUser',
					data: {
						accountId: self.accountId,
						userId: userId
					},
					success: function(data) {
						data = self.usersFormatUserData(data.data);

						console.log(data);

						template = $(monster.template(self, 'users-' + type, data));

						timezone.populateDropdown(template.find('#user_timezone'), data.timezone);

						callback && callback(template, data);
					}
				});
			}
		}
	};

	return app;
});
