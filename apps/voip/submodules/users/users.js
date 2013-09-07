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
			'voip.users.getDevices': {
				url: 'accounts/{accountId}/devices',
				verb: 'GET'
			},
			'voip.users.getNumbers': {
				url: 'accounts/{accountId}/phone_numbers/',
				verb: 'GET'
			},
			'voip.users.getCallflows': {
				url: 'accounts/{accountId}/callflows/',
				verb: 'GET'
			},
			'voip.users.getCallflow': {
				url: 'accounts/{accountId}/callflows/{callflowId}',
				verb: 'GET'
			},
			'voip.users.updateCallflow': {
				url: 'accounts/{accountId}/callflows/{callflowId}',
				verb: 'POST'
			},
			'voip.users.getUsers': {
				url: 'accounts/{accountId}/users',
				verb: 'GET'
			},
			'voip.users.updateUser': {
				url: 'accounts/{accountId}/users/{userId}',
				verb: 'POST'
			},
			'voip.users.getUser': {
				url: 'accounts/{accountId}/users/{userId}',
				verb: 'GET'
			}/*,
			'voip.users.resendInstructions': {
				url: 'accounts/{accountId}/users/{userId}/resend_instructions',
				verb: 'POST'
			},
			'voip.users.resetPassword': {
				url: 'accounts/{accountId}/users/{userId}/reset_password',
				verb: 'POST'
			},
			*/
		},

		subscribe: {
			'voip.users.render': 'usersRender'
		},

		/* Users */
		/* args: parent and userId */
		usersRender: function(args) {
			var self = this,
				parent = args.parent || $('.right-content'),
				_userId = args.userId;

			self.usersGetData(function(data) {
				var dataTemplate = self.usersFormatListData(data),
				    template = $(monster.template(self, 'users-layout', dataTemplate)),
					templateUser;

				_.each(dataTemplate.users, function(user) {
					templateUser = monster.template(self, 'users-row', user);

					template.find('.user-rows').append(templateUser);
				});

				self.usersBindEvents(template, parent);

				parent
					.empty()
					.append(template);

				if(_userId) {
					parent.find('.grid-row[data-id=' + _userId + ']')
						.css('background-color', '#22CCFF')
						.animate({
							backgroundColor: '#fcfcfc'
						}, 2000
					);
				}
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
					callback && callback(results);
				}
			);
		},

		usersUpdateCallflowNumbers: function(callflowId, numbers, callback) {
			var self = this;

			monster.request({
				resource: 'voip.users.getCallflow',
				data: {
					accountId: self.accountId,
					callflowId: callflowId
				},
				success: function(getCallflowData) {
					getCallflowData.data.numbers = numbers;

					monster.request({
						resource: 'voip.users.updateCallflow',
						data: {
							accountId: self.accountId,
							callflowId: callflowId,
							data: getCallflowData.data
						},
						success: function(callflowData) {
							callback && callback(callflowData);
						}
					});
				}
			});
		},

		usersFormatUserData: function(dataUser) {
			var formattedUser = {
					additionalDevices: 0,
					additionalExtensions: 0,
					additionalNumbers: 0,
					devices: [],
					features: [],
					extension: '',
					isAdmin: dataUser.priv_level === 'admin',
					phoneNumber: ''
				};

			dataUser = $.extend(true, {}, formattedUser, dataUser);

			return dataUser;
		},

		usersFormatListData: function(data) {
			var self = this,
				dataTemplate = {
					countUsers: data.users.length
				},
			    mapAllUsers = {},
			    mapResultUsers = {};

			_.each(data.users, function(user) {
				mapAllUsers[user.id] = self.usersFormatUserData(user);
			});

			_.each(data.callflows, function(callflow) {
				var userId = callflow.owner_id;

				if(userId in mapAllUsers) {
					var user = $.extend(true, {}, mapAllUsers[userId]);

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

					mapResultUsers[userId] = user;
				}
			});

			_.each(data.devices, function(device) {
				var userId = device.owner_id;

				if(userId in mapResultUsers) {
					if(mapResultUsers[userId].devices.length == 2) {
						mapResultUsers[userId].additionalDevices++;
					}
					else {
						mapResultUsers[userId].devices.push(device.device_type);
					}
				}
			});

			dataTemplate.users = mapResultUsers;

			return dataTemplate;
		},

		usersBindEvents: function(template, parent) {
			var self = this,
				currentNumberSearch = '',
				currentUser,
				currentCallflow,
				existingExtensions,
				extensionsToSave,
				numbersToSave,
				toastrMessages = self.i18n.active().users.toastrMessages;

			template.find('.grid-row:not(.title) .grid-cell').on('click', function() {
				var cell = $(this),
					type = cell.data('type'),
					row = cell.parents('.grid-row'),
					userId = row.data('id');

				template.find('.edit-user').empty().hide();

				if(cell.hasClass('active')) {
					template.find('.grid-cell').removeClass('active');
				}
				else {
					template.find('.grid-cell').removeClass('active');
					cell.toggleClass('active');

					self.usersGetTemplate(type, userId, function(template, data) {
						if(type === 'name') {
							currentUser = data;
						}
						else if(type === 'numbers') {
							extensionsToSave = [];
							currentCallflow = data.callflow;

							_.each(data.extensions, function(number) {
								extensionsToSave.push(number);
							});
						}
						else if(type === 'extensions') {
						console.log(data);
							existingExtensions = data.allExtensions;
							currentCallflow = data.callflow;
							numbersToSave = [];

							_.each(data.assignedNumbers, function(v, k) {
								numbersToSave.push(k);
							});
						}

						//FancyCheckboxes.
						monster.ui.prettyCheck.create(template);

						row.find('.edit-user').append(template).show();
					});
				}
			});

			template.on('click', '.cancel-link', function() {
				template.find('.edit-user').hide().empty();

				template.find('.grid-cell.active').removeClass('active');
			});

			/* Events for Extensions details */
			template.on('click', '.save-extensions', function() {
				var numbers = $.extend(true, [], numbersToSave),
					name = $(this).parents('.grid-row').find('.grid-cell.name').text();

				template.find('.list-assigned-extensions .phone-number-row').each(function(k, row) {
					var row = $(row),
						number;

					number = (row.data('id') ? row.data('id') : row.find('.input-extension').val()) + '';

					numbers.push(number);
				});

				self.usersUpdateCallflowNumbers(currentCallflow.id, numbers, function(callflowData) {
					toastr.success(monster.template(self, '!' + toastrMessages.numbersUpdated, { name: name }));
					self.usersRender({ userId: callflowData.data.owner_id });
				});
			});

			template.on('click', '#add_extensions', function() {
				var nextExtension = (parseInt(existingExtensions[existingExtensions.length - 1]) || 2000) + 1 + '',
					dataTemplate = {
						recommendedExtension: nextExtension
					},
					newLineTemplate = $(monster.template(self, 'users-newExtension', dataTemplate)),
					listExtensions = template.find('.list-assigned-extensions');
					console.log(nextExtension);
					console.log(existingExtensions);

				listExtensions.find('.empty-row').hide();

				listExtensions.append(newLineTemplate);

				existingExtensions.push(nextExtension);
			});

			template.on('click', '.remove-extension', function() {
				var phoneRow = $(this).parents('.phone-number-row'),
					emptyRow = phoneRow.siblings('.empty-row');

				if(phoneRow.siblings('.phone-number-row').size() === 0) {
					emptyRow.show();
				}

				phoneRow.remove();
			});

			template.on('click', '.cancel-extension-link', function() {
				var extension = $(this).siblings('input').val(),
				    index = existingExtensions.indexOf(extension);

				if(index > -1) {
					existingExtensions.splice(index, 1);
				}

				$(this).parents('.phone-number-row').remove();
			});


			/* Events for Users detail */
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

			template.on('click', '.save-user', function() {
				var formData = form2object('form-'+currentUser.id);

				$.extend(true, currentUser, formData);

				monster.request({
					resource: 'voip.users.updateUser',
					data: {
						accountId: self.accountId,
						userId: currentUser.id,
						data: currentUser
					},
					success: function(userData) {
						toastr.success(monster.template(self, '!' + toastrMessages.userUpdated, { name: userData.data.first_name + ' ' + userData.data.last_name }));
						self.usersRender({ userId: userData.data.id });
					}
				});
			});

			/* Events for Numbers in Users */
			template.on('click', '.save-numbers', function() {
				var numbers = $.extend(true, [], extensionsToSave),
					name = $(this).parents('.grid-row').find('.grid-cell.name').text();

				template.find('.list-assigned-numbers .phone-number-row').each(function(k, row) {
					numbers.push($(row).data('id'));
				});

				self.usersUpdateCallflowNumbers(currentCallflow.id, numbers, function(callflowData) {
					toastr.success(monster.template(self, '!' + toastrMessages.numbersUpdated, { name: name }));
					self.usersRender({ userId: callflowData.data.owner_id });
				});

			});

			template.find('.users-header .search-query').on('keyup', function() {
				var searchString = $(this).val().toLowerCase(),
					rows = template.find('.user-rows .grid-row:not(.title)'),
					emptySearch = template.find('.user-rows .empty-search-row');

				_.each(rows, function(row) {
					var row = $(row);

					row.data('search').toLowerCase().indexOf(searchString) < 0 ? row.hide() : row.show();
				});

				if(rows.size() > 0) {
					rows.is(':visible') ? emptySearch.hide() : emptySearch.show();
				}
			});

			template.on('click', '.detail-numbers .list-unassigned-numbers .add-number', function() {
				var row = $(this).parents('.phone-number-row'),
					spare = template.find('.count-spare'),
					countSpare = spare.data('count') - 1,
					assignedList = template.find('.detail-numbers .list-assigned-numbers');

				spare
					.html(countSpare)
					.data('count', countSpare);

				row.find('button')
					.removeClass('add-number btn-primary')
					.addClass('remove-number btn-danger')
					.text(self.i18n.active().remove);

				assignedList.find('.empty-row').hide();
				assignedList.append(row);

				var rows = template.find('.list-unassigned-numbers .phone-number-row');

				if(rows.size() === 0) {
					template.find('.detail-numbers .list-unassigned-numbers .empty-row').show();
				}
				else if(rows.is(':visible') === false) {
					template.find('.detail-numbers .list-unassigned-numbers .empty-search-row').show();
				}
			});

			template.on('click', '.detail-numbers .list-assigned-numbers .remove-number', function() {
				var row = $(this).parents('.phone-number-row'),
					spare = template.find('.count-spare'),
					countSpare = spare.data('count') + 1,
					unassignedList = template.find('.detail-numbers .list-unassigned-numbers');

				/* Alter the html */
				row.hide();

				row.find('button')
					.removeClass('remove-number btn-danger')
					.addClass('add-number btn-primary')
					.text(self.i18n.active().add);

				unassignedList.append(row);
				unassignedList.find('.empty-row').hide();

				spare
					.html(countSpare)
					.data('count', countSpare);

				var rows = template.find('.detail-numbers .list-assigned-numbers .phone-number-row');
				/* If no rows beside the clicked one, display empty row */
				if(rows.is(':visible') === false) {
					template.find('.detail-numbers .list-assigned-numbers .empty-row').show();
				}

				/* If it matches the search string, show it */
				if(row.data('search').indexOf(currentNumberSearch) >= 0) {
					row.show();
					unassignedList.find('.empty-search-row').hide();
				}
			});

			template.on('keyup', '.detail-numbers .unassigned-list-header .search-query', function() {
				var rows = template.find('.list-unassigned-numbers .phone-number-row'),
					emptySearch = template.find('.list-unassigned-numbers .empty-search-row'),
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

			template.on('click', '.callerId-number', function() {
				var cnamCell = $(this).parents('.phone-number-row').first(),
					phoneNumber = cnamCell.data('id');

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

			template.on('click', '.e911-number', function() {
				var e911Cell = $(this).parents('.phone-number-row').first(),
					phoneNumber = e911Cell.data('id');

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

			template.on('click', '.failover-number', function() {
				var failoverCell = $(this).parents('.phone-number-row').first(),
					phoneNumber = failoverCell.data('id');

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
			else if(type === 'extensions') {
				self.usersGetExtensionsTemplate(userId, callbackAfterData);
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
					var dataTemplate = self.usersFormatUserData(data.data);

					template = $(monster.template(self, 'users-name', dataTemplate));

					timezone.populateDropdown(template.find('#user_timezone'), dataTemplate.timezone);

					callback && callback(template, data.data);
				}
			});
		},

		usersGetNumbersData: function(userId, callback) {
			var self = this;

			monster.parallel({
					callflow: function(callbackParallel) {
						var response = {};

						monster.request({
							resource: 'voip.users.getCallflows',
							data: {
								accountId: self.accountId
							},
							success: function(callflows) {
								response.list = callflows.data;

								var callflowId;

								$.each(callflows.data, function(k, callflowLoop) {
									/* Find Smart PBX Callflow of this user */
									if(callflowLoop.owner_id === userId) {
										callflowId = callflowLoop.id;

										return false;
									}
								});

								if(callflowId) {
									monster.request({
										resource: 'voip.users.getCallflow',
										data: {
											accountId: self.accountId,
											callflowId: callflowId
										},
										success: function(callflow) {
											response.userCallflow = callflow.data;

											callbackParallel && callbackParallel(null, response);
										}
									});
								}
								else {
									callbackParallel && callbackParallel(null, response);
								}
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
					callback && callback(results);
				}
			);
		},
		usersGetNumbersTemplate: function(userId, callback) {
			var self = this;

			self.usersGetNumbersData(userId, function(results) {
				self.usersFormatNumbersData(userId, results, function(results) {
					template = $(monster.template(self, 'users-numbers', results));

					callback && callback(template, results);
				});
			});
		},

		usersGetExtensionsTemplate: function(userId, callback) {
			var self = this;
			self.usersGetNumbersData(userId, function(results) {
				self.usersFormatNumbersData(userId, results, function(results) {
					template = $(monster.template(self, 'users-extensions', results));

					callback && callback(template, results);
				});
			});
		},

		usersFormatNumbersData: function(userId, data, callback) {
			var self = this,
				response = {
					countSpare: 0,
					assignedNumbers: {},
					unassignedNumbers: {},
					callflow: data.callflow.userCallflow,
					extensions: []
				};

			monster.pub('common.numbers.getListFeatures', function(features) {
				if('numbers' in data.numbers) {
					_.each(data.numbers.numbers, function(number, k) {
						/* Formating number */
						number.viewFeatures = $.extend(true, {}, features);
						/* TODO: Once locality is enabled, we need to remove it */
						number.localityEnabled = 'locality' in number ? true : false;

						_.each(number.features, function(feature) {
							number.viewFeatures[feature].active = 'active';
						});

						/* Adding to spare numbers */
						if(number.used_by === '') {
							response.countSpare++;
							response.unassignedNumbers[k] = number;
						}
					});
				}

				/* If a number is in a callflow and is set as used by callflows in the number manager, then we display it as an assigned number */
				_.each(response.callflow.numbers, function(number) {
					if(number in data.numbers.numbers && data.numbers.numbers[number].used_by === 'callflow') {
						response.assignedNumbers[number] = data.numbers.numbers[number];
					}
					else {
						response.extensions.push(number);
					}
				});

				/* List of extensions */
				response.allExtensions = [];

				_.each(data.callflow.list, function(callflow) {
					_.each(callflow.numbers, function(number) {
						/* If it's a valid extension number (ie: a number that's not in the number database) */
						if(!(number in data.numbers.numbers) && !(_.isNaN(parseInt(number)))) {
							response.allExtensions.push(number);
						}
					});
				});

				/* Sort extensions so that we can recommend an available extension to a user whom would add a new one */
				response.allExtensions.sort(function(a, b) {
					var parsedA = parseInt(a),
						parsedB = parseInt(b),
						result = -1;

					if(parsedA > 0 && parsedB > 0) {
						result = parsedA > parsedB;
					}

					return result;
				});
				response.emptyAssigned = _.isEmpty(response.assignedNumbers);
				response.emptySpare = _.isEmpty(response.unassignedNumbers);
				response.emptyExtensions = _.isEmpty(response.extensions);


				callback && callback(response);
			});
		}
	};

	return app;
});
