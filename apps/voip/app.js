define(function(require){
	var $ = require('jquery'),
		_ = require('underscore'),
		monster = require('monster'),
		timezone = require('monster-timezone'),
		toastr = require('toastr');

	var app = {

		name: 'conferences',

		i18n: [ 'en-US' ],

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
			var self = this,
				parent = container || $('#ws-content'),
				template = $(monster.template(self, 'app'));

			/* On first Load, load my office */
			template.find('.category#my_office').addClass('active');
			self.renderMyOffice(template);

			self.bindEvents(template);

			parent
				.empty()
				.append(template);
		},

		//_util
		formatData: function(data) {
			var self = this;
		},

		bindEvents: function(parent) {
			var self = this;

			parent.find('.category').on('click', function() {
				parent
					.find('.category')
					.removeClass('active');

				parent
					.find('.right-content')
					.empty();

				$(this).toggleClass('active');
			});

			parent.find('.category#my_office').on('click', function() {
				self.renderMyOffice(parent);
			});

			parent.find('.category#users').on('click', function() {
				self.renderUsers(parent);
			});

			parent.find('.category#groups').on('click', function() {
				self.renderGroups(parent);
			});

			parent.find('.category#numbers').on('click', function() {
				self.renderNumbers(parent);
			});

			parent.find('.category#devices').on('click', function() {
				self.renderDevices(parent);
			});

			parent.find('.category#strategy').on('click', function() {
				self.renderStrategy(parent);
			});

			parent.find('.category#call_logs').on('click', function() {
				self.renderCallLogs(parent);
			});

			parent.find('.category#quick_links').on('click', function() {
				self.renderQuickLinks(parent);
			});
		},
		/* TO COPY PASTE and replace TOCHANGE
		renderTOCHANGE: function(parent) {
			var self = this,
			dataTemplate = {

			};

			dataTemplate = self.formatTOCHANGEData(dataTemplate);

			var template = monster.template(self, 'TOCHANGE', dataTemplate);

			self.bindTOCHANGEEvents(template, parent);

			parent
				.find('.right-content')
				.empty()
				.append(template);
		},

		formatTOCHANGEData: function(data) {

			return data;
		},

		bindTOCHANGEEvents: function(template, parent) {

		}
		*/

		/* Numbers */
		renderNumbers: function(parent) {
			monster.apps.load('numbers', function(app) {
				app.render(parent.find('.right-content'));
			});
		},

		/* My Office */
		renderMyOffice: function(parent) {
			var self = this,
				dataTemplate = {

				};

			dataTemplate = self.formatMyOfficeData(dataTemplate);

			var template = monster.template(self, 'myOffice', dataTemplate);

			self.bindMyOfficeEvents(template, parent);

			parent
				.find('.right-content')
				.empty()
				.append(template);
		},

		formatMyOfficeData: function(data) {

			return data;
		},

		bindMyOfficeEvents: function(template, parent) {

		},

		renderUsers: function(parent) {
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
					dataTemplate = self.formatUsersData(results);

					var template = $(monster.template(self, 'users', dataTemplate)),
						templateUser;

					_.each(dataTemplate.users, function(user) {
						templateUser = monster.template(self, 'userRow', user);

						template.find('.user-rows').append(templateUser);
					});

					self.bindUsersEvents(template, parent);

					parent
						.find('.right-content')
						.empty()
						.append(template);
				}
			);
		},

		formatUserData: function(dataUser) {
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

		formatUsersData: function(data) {
			var self = this,
				dataTemplate = {},
			    mapUsers = {};

			_.each(data.users, function(user) {
				mapUsers[user.id] = self.formatUserData(user);
			});

			dataTemplate.users = mapUsers;

			console.log(dataTemplate);

			return dataTemplate;
		},

		bindUsersEvents: function(template, parent) {
			var self = this;

			template.find('.grid-row:not(.title) .grid-cell').on('click', function() {
				var cell = $(this),
					type = cell.data('type'),
					row = cell.parents('.grid-row'),
					userId = row.data('id');

				template.find('.edit-user').empty().hide();

				template.find('.grid-cell').removeClass('active');
				cell.toggleClass('active');

				self.getTemplateUserRow(type, userId, function(template) {
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

		getTemplateUserRow: function(type, userId, callback) {
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
						data = self.formatUserData(data.data);

						console.log(data);

						template = $(monster.template(self, type + 'User', data));

						timezone.populateDropdown(template.find('#user_timezone'), data.timezone);

						callback && callback(template, data);
					}
				});
			}
		}
	};

	return app;
});
