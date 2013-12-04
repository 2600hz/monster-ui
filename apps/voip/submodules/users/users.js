define(function(require){
	var $ = require('jquery'),
		_ = require('underscore'),
		monster = require('monster'),
		timezone = require('monster-timezone'),
		toastr = require('toastr');

	var app = {

		requests: {
			/* Users */
			'voip.users.getUsers': {
				url: 'accounts/{accountId}/users',
				verb: 'GET'
			},
			'voip.users.updateUser': {
				url: 'accounts/{accountId}/users/{userId}',
				verb: 'POST'
			},
			'voip.users.createUser': {
				url: 'accounts/{accountId}/users',
				verb: 'PUT'
			},
			'voip.users.getUser': {
				url: 'accounts/{accountId}/users/{userId}',
				verb: 'GET'
			},
			'voip.users.deleteUser': {
				url: 'accounts/{accountId}/users/{userId}',
				verb: 'DELETE'
			},
			/* VMBoxes*/
			'voip.users.createVMBox': {
				url: 'accounts/{accountId}/vmboxes',
				verb: 'PUT'
			},
			'voip.users.getVMBox': {
				url: 'accounts/{accountId}/vmboxes/{vmboxId}',
				verb: 'GET'
			},
			'voip.users.updateVMBox': {
				url: 'accounts/{accountId}/vmboxes/{vmboxId}',
				verb: 'POST'
			},
			'voip.users.deleteVMBox': {
				url: 'accounts/{accountId}/vmboxes/{vmboxId}',
				verb: 'DELETE'
			},
			'voip.users.listUserVMBoxes': {
				url: 'accounts/{accountId}/vmboxes?filter_owner_id={userId}',
				verb: 'GET'
			},
			/* Callflows */
			'voip.users.getCallflows': {
				url: 'accounts/{accountId}/callflows/',
				verb: 'GET'
			},
			'voip.users.createCallflow': {
				url: 'accounts/{accountId}/callflows',
				verb: 'PUT'
			},
			'voip.users.listUserCallflows': {
				url: 'accounts/{accountId}/callflows?filter_owner_id={userId}',
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
			'voip.users.deleteCallflow': {
				url: 'accounts/{accountId}/callflows/{callflowId}',
				verb: 'DELETE'
			},
			/* Devices */
			'voip.users.listDevices': {
				url: 'accounts/{accountId}/devices',
				verb: 'GET'
			},
			'voip.users.listUserDevices': {
				url: 'accounts/{accountId}/devices?filter_owner_id={userId}',
				verb: 'GET'
			},
			'voip.users.getDevice': {
				url: 'accounts/{accountId}/devices/{deviceId}',
				verb: 'GET'
			},
			'voip.users.updateDevice': {
				url: 'accounts/{accountId}/devices/{deviceId}',
				verb: 'POST'
			},
			'voip.users.deleteDevice': {
				url: 'accounts/{accountId}/devices/{deviceId}',
				verb: 'DELETE'
			},
			/* Directories */
			'voip.users.listDirectories': {
				url: 'accounts/{accountId}/directories/',
				verb: 'GET'
			},
			'voip.users.createDirectory': {
				url: 'accounts/{accountId}/directories',
				verb: 'PUT'
			},
			/* Conferences */
			'voip.users.createConference': {
				url: 'accounts/{accountId}/conferences',
				verb: 'PUT'
			},
			'voip.users.getConference': {
				url: 'accounts/{accountId}/conferences/{conferenceId}',
				verb: 'GET'
			},
			'voip.users.updateConference': {
				url: 'accounts/{accountId}/conferences/{conferenceId}',
				verb: 'POST'
			},
			'voip.users.deleteConference': {
				url: 'accounts/{accountId}/conferences/{conferenceId}',
				verb: 'DELETE'
			},
			'voip.users.listUserConferences': {
				url: 'accounts/{accountId}/conferences?filter_owner_id={userId}',
				verb: 'GET'
			},
			/* Misc */
			'voip.users.getNumbers': {
				url: 'accounts/{accountId}/phone_numbers/',
				verb: 'GET'
			},
			'voip.users.resendInstructions': {
				apiRoot: 'apps/voip/submodules/users/fixtures/',
				url: 'resendInstructions.json',
				verb: 'POST'
			},
			'voip.users.resetPassword': {
				apiRoot: 'apps/voip/submodules/users/fixtures/',
				url: 'resetPassword.json',
				verb: 'POST'
			}
			/*,
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
				args = args || {},
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

				self.usersBindEvents(template, parent, dataTemplate);

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

		usersFormatUserData: function(dataUser, _mainDirectory, _mainCallflow) {
			var self = this,
				formattedUser = {
					additionalDevices: 0,
					additionalExtensions: 0,
					additionalNumbers: 0,
					devices: [],
					extension: '',
					hasFeatures: false,
					isAdmin: dataUser.priv_level === 'admin',
					listCallerId: [],
					listExtensions: [],
					listNumbers: [],
					phoneNumber: '',
					sameEmail: dataUser.email === dataUser.username,
					mapFeatures: {
						caller_id: {
							icon: 'icon-user',
							iconColor: 'icon-blue',
							title: self.i18n.active().users.caller_id.title
						},
						call_forward: {
							icon: 'icon-mail-forward',
							iconColor: 'icon-yellow',
							title: self.i18n.active().users.call_forward.title
						},
						hotdesk: {
							icon: 'icon-fire',
							iconColor: 'icon-orange',
							title: self.i18n.active().users.hotdesk.title
						},
						vm_to_email: {
							icon: 'icon-envelope',
							iconColor: 'icon-green',
							title: self.i18n.active().users.vm_to_email.title
						},
						faxing: {
							icon: 'icon-telicon-fax',
							iconColor: 'icon-red',
							title: self.i18n.active().users.faxing.title
						},
						conferencing: {
							icon: 'icon-comments',
							iconColor: 'icon-gray',
							title: self.i18n.active().users.conferencing.title
						}
					}
				};

			if(!('extra' in dataUser)) {
				dataUser.extra = formattedUser;
			}

			_.each(dataUser.features, function(v) {
				dataUser.extra.mapFeatures[v].active = true;
			});

			if(dataUser.features.length > 0) {
				dataUser.extra.hasFeatures = true;
			}

			if(_mainDirectory) {
				dataUser.extra.mainDirectoryId = _mainDirectory.id;

				if('directories' in dataUser && _mainDirectory.id in dataUser.directories) {
					dataUser.extra.includeInDirectory = true;
				}
				else {
					dataUser.extra.includeInDirectory = false;
				}
			}

			if(_mainCallflow) {
				dataUser.extra.mainCallflowId = _mainCallflow.id;
			}

			return dataUser;
		},

		usersFormatListData: function(data) {
			var self = this,
				dataTemplate = {
					existingExtensions: [],
					countUsers: data.users.length
				},
			    mapUsers = {};

			_.each(data.users, function(user) {
				mapUsers[user.id] = self.usersFormatUserData(user);
			});

			_.each(data.callflows, function(callflow) {
				var userId = callflow.owner_id;

				_.each(callflow.numbers, function(number) {
					if(number && number.length < 7) {
						dataTemplate.existingExtensions.push(number);
					}
				});

				if(userId in mapUsers) {
					var user = mapUsers[userId];

					//User can only have one phoneNumber and one extension displayed with this code
					_.each(callflow.numbers, function(number) {
						if(number.length < 7) {
							user.extra.listExtensions.push(number);

							if(user.extra.extension === '') {
								user.extra.extension = number;
							}
							else {
								user.extra.additionalExtensions++;
							}
						}
						else {
							user.extra.listCallerId.push(number);

							user.extra.listNumbers.push(number);

							if(user.extra.phoneNumber === '') {
								user.extra.phoneNumber = number;
							}
							else {
								user.extra.additionalNumbers++;
							}
						}
					});
				}
			});

			dataTemplate.existingExtensions.sort(self.usersSortExtensions);

			_.each(data.devices, function(device) {
				var userId = device.owner_id;

				if(userId in mapUsers) {
					if(mapUsers[userId].extra.devices.length == 2) {
						mapUsers[userId].extra.additionalDevices++;
					}
					else {
						mapUsers[userId].extra.devices.push(device.device_type);
					}
				}
			});

			/* Sort by last name */
			var sortedUsers = [];
			_.each(mapUsers, function(user) {
				sortedUsers.push(user);
			});

			sortedUsers.sort(function(a, b) {
				return a.last_name > b.last_name;
			});

			dataTemplate.users = sortedUsers;

			return dataTemplate;
		},

		usersBindEvents: function(template, parent, data) {
			var self = this,
				currentNumberSearch = '',
				currentUser,
				currentCallflow,
				existingExtensions = data.existingExtensions,
				extensionsToSave,
				numbersToSave,
				toastrMessages = self.i18n.active().users.toastrMessages,
				mainDirectoryId,
				mainCallflowId,
				listUsers = data;

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

					self.usersGetTemplate(type, userId, listUsers, function(template, data) {
						if(type === 'name') {
							currentUser = data;

							if(data.extra.mainDirectoryId) {
								mainDirectoryId = data.extra.mainDirectoryId;
							}

							if(data.extra.mainCallflowId) {
								mainCallflowId = data.extra.mainCallflowId;
							}
						}
						else if(type === 'numbers') {
							extensionsToSave = [];
							currentCallflow = data.callflow;

							_.each(data.extensions, function(number) {
								extensionsToSave.push(number);
							});
						}
						else if(type === 'extensions') {
							existingExtensions = data.allExtensions;
							currentCallflow = data.callflow;
							numbersToSave = [];

							_.each(data.assignedNumbers, function(v, k) {
								numbersToSave.push(k);
							});
						}
						else if(type === 'features') {
							currentUser = data;
						}

						//FancyCheckboxes.
						monster.ui.prettyCheck.create(template);

						row.find('.edit-user').append(template).show();
					});
				}
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

			template.find('.users-header .add-user').on('click', function() {
				var defaults = {
						sendToSameEmail: true,
						nextExtension: (parseInt(existingExtensions[existingExtensions.length - 1]) || 2000) + 1 + '',
					},
				    userTemplate = $(monster.template(self, 'users-creation', defaults));

				timezone.populateDropdown(userTemplate.find('#user_creation_timezone'));
				monster.ui.prettyCheck.create(userTemplate);
				// userTemplate.find('#form_user_creation').validate({
				// 	errorClass: "monster-invalid",
				// 	validClass: "monster-valid"/*,
				// 	groups: {
				// 		fullName: "user.first_name user.last_name"
				// 	}*/
				// });
				monster.ui.validate(userTemplate.find('#form_user_creation'), {
					messages: {
						'user.first_name': {
							required: 'Required'
						},
						'user.last_name': {
							required: 'Required'
						},
						'callflow.extension': {
							required: 'Required'
						}
					},
				});

				userTemplate.find('#create_user').on('click', function() {
					if(monster.ui.valid(userTemplate.find('#form_user_creation'))) {
						var dataForm = form2object('form_user_creation'),
							formattedData = self.usersFormatCreationData(dataForm);

						self.usersCreate(formattedData, function(data) {
							popup.dialog('close').remove();

							self.usersRender({ userId: data.user.id });
						});
					} else {
						console.log('invalid!!');
					}
				});

				userTemplate.find('#notification_email').on('ifChanged', function() {
					userTemplate.find('.email-group').toggleClass('hidden');
				});

				var popup = monster.ui.dialog(userTemplate, {
					title: self.i18n.active().users.dialogCreationUser.title
				});
			});

			template.on('click', '.cancel-link', function() {
				template.find('.edit-user').hide().empty();

				template.find('.grid-cell.active').removeClass('active');
			});

			/* Events for Extensions details */
			template.on('click', '.save-extensions', function() {
				var $this = $(this),
					numbers = $.extend(true, [], numbersToSave),
					name = $this.parents('.grid-row').find('.grid-cell.name').text(),
					userId = $this.parents('.grid-row').data('id');

				template.find('.extensions .list-assigned-items .item-row').each(function(k, row) {
					var row = $(row),
						number;

					number = (row.data('id') ? row.data('id') : row.find('.input-extension').val()) + '';

					numbers.push(number);
				});

				self.usersUpdateCallflowNumbers(userId, (currentCallflow || {}).id, numbers, function(callflowData) {
					toastr.success(monster.template(self, '!' + toastrMessages.numbersUpdated, { name: name }));
					self.usersRender({ userId: callflowData.owner_id });
				});
			});

			template.on('click', '#add_extensions', function() {
				var nextExtension = (parseInt(existingExtensions[existingExtensions.length - 1]) || 2000) + 1 + '',
					dataTemplate = {
						recommendedExtension: nextExtension
					},
					newLineTemplate = $(monster.template(self, 'users-newExtension', dataTemplate)),
					listExtensions = template.find('.extensions .list-assigned-items');

				listExtensions.find('.empty-row').hide();

				listExtensions.append(newLineTemplate);

				existingExtensions.push(nextExtension);
			});

			template.on('click', '.remove-extension', function() {
				var phoneRow = $(this).parents('.item-row'),
					emptyRow = phoneRow.siblings('.empty-row');

				if(phoneRow.siblings('.item-row').size() === 0) {
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

				$(this).parents('.item-row').remove();
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

			template.on('click', '#delete_user', function() {
				var userId = $(this).parents('.grid-row').data('id');

				self.usersDelete(userId, function(data) {
					toastr.success(monster.template(self, '!' + toastrMessages.userDeleted));
				});
			});

			template.on('ifChanged', '#notification_email', function() {
				template.find('.email-group').toggleClass('hidden');
			});

			template.on('click', '.save-user', function() {
				var formData = form2object('form-'+currentUser.id),
					userToSave = $.extend(true, {}, currentUser, formData);

				self.usersUpdateUser(userToSave, function(userData) {
					toastr.success(monster.template(self, '!' + toastrMessages.userUpdated, { name: userData.data.first_name + ' ' + userData.data.last_name }));

					self.usersRender({ userId: userData.data.id });
				});
			});

			template.on('click', '#change_username', function() {
				var passwordTemplate = $(monster.template(self, 'users-changePassword', currentUser));

				passwordTemplate.find('.save-new-username').on('click', function() {
					var formData = form2object('form_new_username'),
					    userToSave = $.extend(true, {}, currentUser, formData);

					self.usersUpdateUser(userToSave, function(userData) {
						popup.dialog('close').remove();

						toastr.success(monster.template(self, '!' + toastrMessages.userUpdated, { name: userData.data.first_name + ' ' + userData.data.last_name }));

						self.usersRender({ userId: userData.data.id });
					});
				});

				passwordTemplate.find('.cancel-link').on('click', function() {
					popup.dialog('close').remove();
				});

				var popup = monster.ui.dialog(passwordTemplate, {
					title: self.i18n.active().users.dialogChangePassword.title
				});
			});

			/* Events for Devices in Users */
			template.on('click', '.save-devices', function() {
				var dataDevices = {
						new: [],
						old: []
					},
					name = $(this).parents('.grid-row').find('.grid-cell.name').text(),
					userId = $(this).parents('.grid-row').data('id');

				template.find('.detail-devices .list-assigned-items .item-row.updated').each(function(k, row) {
					dataDevices.new.push($(row).data('id'));
				});
				template.find('.detail-devices .list-unassigned-items .item-row.updated').each(function(k, row) {
					dataDevices.old.push($(row).data('id'));
				});

				self.usersUpdateDevices(dataDevices, userId, function() {
					toastr.success(monster.template(self, '!' + toastrMessages.devicesUpdated, { name: name }));
					self.usersRender({ userId: userId });
				});
			});

			template.on('click', '.detail-devices .list-unassigned-items .add-device', function() {
				var row = $(this).parents('.item-row'),
					spare = template.find('.count-spare'),
					countSpare = spare.data('count') - 1,
					assignedList = template.find('.detail-devices .list-assigned-items');

				spare
					.html(countSpare)
					.data('count', countSpare);

				row.toggleClass('updated')
					.find('button')
					.removeClass('add-device btn-primary')
					.addClass('remove-device btn-danger')
					.text(self.i18n.active().remove);

				assignedList.find('.empty-row').hide();
				assignedList.append(row);

				var rows = template.find('.list-unassigned-items .item-row');

				if(rows.size() === 0) {
					template.find('.detail-devices .list-unassigned-items .empty-row').show();
				}
				else if(rows.is(':visible') === false) {
					template.find('.detail-devices .list-unassigned-items .empty-search-row').show();
				}
			});

			template.on('click', '.detail-devices .list-assigned-items .remove-device', function() {
				var row = $(this).parents('.item-row'),
					spare = template.find('.count-spare'),
					countSpare = spare.data('count') + 1,
					unassignedList = template.find('.detail-devices .list-unassigned-items');

				/* Alter the html */
				row.hide();

				row.toggleClass('updated')
					.find('button')
					.removeClass('remove-device btn-danger')
					.addClass('add-device btn-primary')
					.text(self.i18n.active().add);

				unassignedList.append(row);
				unassignedList.find('.empty-row').hide();

				spare
					.html(countSpare)
					.data('count', countSpare);

				var rows = template.find('.detail-devices .list-assigned-items .item-row');
				/* If no rows beside the clicked one, display empty row */
				if(rows.is(':visible') === false) {
					template.find('.detail-devices .list-assigned-items .empty-row').show();
				}

				/* If it matches the search string, show it */
				if(row.data('search').indexOf(currentNumberSearch) >= 0) {
					row.show();
					unassignedList.find('.empty-search-row').hide();
				}
			});

			/* Events for Numbers in Users */
			template.on('click', '.save-numbers', function() {
				var $this = $(this),
					numbers = $.extend(true, [], extensionsToSave),
					name = $this.parents('.grid-row').find('.grid-cell.name').text(),
					userId = $this.parents('.grid-row').data('id');

				template.find('.detail-numbers .list-assigned-items .item-row').each(function(k, row) {
					numbers.push($(row).data('id'));
				});

				self.usersUpdateCallflowNumbers(userId, (currentCallflow || {}).id, numbers, function(callflowData) {
					toastr.success(monster.template(self, '!' + toastrMessages.numbersUpdated, { name: name }));
					self.usersRender({ userId: callflowData.owner_id });
				});
			});

			template.on('click', '.detail-numbers .list-unassigned-items .add-number', function() {
				var row = $(this).parents('.item-row'),
					spare = template.find('.count-spare'),
					countSpare = spare.data('count') - 1,
					assignedList = template.find('.detail-numbers .list-assigned-items');

				spare
					.html(countSpare)
					.data('count', countSpare);

				row.find('button')
					.removeClass('add-number btn-primary')
					.addClass('remove-number btn-danger')
					.text(self.i18n.active().remove);

				assignedList.find('.empty-row').hide();
				assignedList.append(row);

				var rows = template.find('.list-unassigned-items .item-row');

				if(rows.size() === 0) {
					template.find('.detail-numbers .list-unassigned-items .empty-row').show();
				}
				else if(rows.is(':visible') === false) {
					template.find('.detail-numbers .list-unassigned-items .empty-search-row').show();
				}
			});

			template.on('click', '.detail-numbers .list-assigned-items .remove-number', function() {
				var row = $(this).parents('.item-row'),
					spare = template.find('.count-spare'),
					countSpare = spare.data('count') + 1,
					unassignedList = template.find('.detail-numbers .list-unassigned-items');

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

				var rows = template.find('.detail-numbers .list-assigned-items .item-row');
				/* If no rows beside the clicked one, display empty row */
				if(rows.is(':visible') === false) {
					template.find('.detail-numbers .list-assigned-items .empty-row').show();
				}

				/* If it matches the search string, show it */
				if(row.data('search').indexOf(currentNumberSearch) >= 0) {
					row.show();
					unassignedList.find('.empty-search-row').hide();
				}
			});

			template.on('keyup', '.list-wrapper .unassigned-list-header .search-query', function() {
				var rows = template.find('.list-unassigned-items .item-row'),
					emptySearch = template.find('.list-unassigned-items .empty-search-row'),
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
				var cnamCell = $(this).parents('.item-row').first(),
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
				var e911Cell = $(this).parents('.item-row').first(),
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

			template.on('click', '.feature[data-feature="caller_id"]', function() {
				self.usersRenderCallerId(currentUser);
			});

			template.on('click', '.feature[data-feature="call_forward"]', function() {
				self.usersRenderCallForward(currentUser);
			});

			template.on('click', '.feature[data-feature="hotdesk"]', function() {
				self.usersRenderHotdesk(currentUser);
			});

			template.on('click', '.feature[data-feature="vm_to_email"]', function() {
				self.usersListVMBoxesUser(currentUser.id, function(vmboxes) {
					currentUser.extra.deleteAfterNotify = true;
					if(vmboxes.length > 0) {
						self.usersGetVMBox(vmboxes[0].id, function(data) {
							currentUser.extra.deleteAfterNotify = data.delete_after_notify;

							self.usersRenderVMToEmail(currentUser);
						});
					}
					else {
						self.usersRenderVMToEmail(currentUser);
					}
				});
			});

			template.on('click', '.feature[data-feature="conferencing"]', function() {
				self.usersGetConferenceFeature(currentUser.id, function(conference) {
					var data = {
						user: currentUser,
						conference: conference
					};

					self.usersRenderConferencing(data);
				});
			});

			template.on('click', '.feature[data-feature="faxing"]', function() {
				monster.parallel({
						numbers: function(callback) {
							self.usersListNumbers(function(listNumbers) {
								var spareNumbers = {};

								_.each(listNumbers.numbers, function(number, key) {
									if(number.used_by === '') {
										spareNumbers[key] = number;
									}
								});

								callback && callback(null, spareNumbers);
							});
						},
						callflows: function(callback) {
							self.usersListCallflowsUser(currentUser.id, function(callflows) {
								var existingCallflow;

								_.each(callflows, function(callflow) {
									if(callflow.type === 'faxing') {
										existingCallflow = callflow;

										return false;
									}
								});

								callback && callback(null, existingCallflow)
							});
						}
					},
					function(err, results) {
						results.user = currentUser;

						self.usersRenderFaxing(results);
					}
				);
			});

			template.on('click', '.actions .buy-link', function(e) {
                e.preventDefault();
                monster.pub('common.buyNumbers', {
                    searchType: $(this).data('type'),
                    callbacks: {
                        success: function(numbers) {
                        	var countNew = 0;

                        	monster.pub('common.numbers.getListFeatures', function(features) {
								_.each(numbers, function(number, k) {
									countNew++;

									/* Formating number */
									number.viewFeatures = $.extend(true, {}, features);

									var rowTemplate = monster.template(self, 'users-rowSpareNumber', number);

									template.find('.list-unassigned-items .empty-row').hide();
									template.find('.list-unassigned-items').append(rowTemplate);
								});

								var previous = parseInt(template.find('.unassigned-list-header .count-spare').data('count')),
									newTotal = previous + countNew;

								template.find('.unassigned-list-header .count-spare')
									.data('count', newTotal)
									.html(newTotal);
							});
                        },
                        error: function(error) {
                        }
                    }
                });
            });
		},

		usersFormatFaxingData: function(data) {
			var listNumbers = [];

			if(data.callflows) {
				if(data.callflows.numbers.length > 0) {
					listNumbers.push(data.callflows.numbers[0]);
				}
			}

			_.each(data.numbers, function(value, number) {
				listNumbers.push(number);
			});

			data.extra = $.extend(true, {}, data.extra, {
				listNumbers: listNumbers
			});

			return data;
		},

		usersRenderConferencing: function(data) {
			var self = this,
				data = self.usersFormatConferencingData(data),
				featureTemplate = $(monster.template(self, 'users-feature-conferencing', data)),
				switchFeature = featureTemplate.find('.switch').bootstrapSwitch();

			featureTemplate.find('.cancel-link').on('click', function() {
				popup.dialog('close').remove();
			});

			switchFeature.on('switch-change', function(e, data) {
				data.value ? featureTemplate.find('.content').slideDown() : featureTemplate.find('.content').slideUp();
			});

			featureTemplate.find('.save').on('click', function() {
				data.conference = form2object('conferencing_form');

				if(switchFeature.bootstrapSwitch('status')) {
					self.usersUpdateConferencing(data, function(user) {
						popup.dialog('close').remove();

						self.usersRender({ userId: user.id });
					});
				}
				else {
					self.usersDeleteConferencing(data.user.id, function(user) {
						popup.dialog('close').remove();

						self.usersRender({ userId: user.id });
					});
				}
			});

			monster.ui.prettyCheck.create(featureTemplate.find('.content'));

			var popup = monster.ui.dialog(featureTemplate, {
				title: data.user.extra.mapFeatures.conferencing.title,
				position: ['center', 20]
			});
		},

		usersFormatConferencingData: function(data) {
			return data;
		},

		usersRenderFaxing: function(data) {
			var self = this,
				data = self.usersFormatFaxingData(data),
				featureTemplate = $(monster.template(self, 'users-feature-faxing', data)),
				switchFeature = featureTemplate.find('.switch').bootstrapSwitch();

			featureTemplate.find('.cancel-link').on('click', function() {
				popup.dialog('close').remove();
			});

			switchFeature.on('switch-change', function(e, data) {
				data.value ? featureTemplate.find('.content').slideDown() : featureTemplate.find('.content').slideUp();
			});

			featureTemplate.find('.save').on('click', function() {
				var newNumber = popup.find('.dropdown-numbers').val();

				if(switchFeature.bootstrapSwitch('status')) {
					self.usersUpdateFaxing(data, newNumber, function(results) {
						popup.dialog('close').remove();

						self.usersRender({ userId: results.callflow.owner_id });
					});
				}
				else {
					self.usersDeleteFaxing(data.callflows.owner_id, function() {
						popup.dialog('close').remove();

						self.usersRender({ userId: data.callflows.owner_id });
					});
				}
			});

			monster.ui.prettyCheck.create(featureTemplate.find('.content'));

			var popup = monster.ui.dialog(featureTemplate, {
				title: data.user.extra.mapFeatures.faxing.title,
				position: ['center', 20]
			});
		},


		usersRenderHotdesk: function(currentUser) {
			var self = this,
				featureTemplate = $(monster.template(self, 'users-feature-hotdesk', currentUser)),
				switchFeature = featureTemplate.find('.switch').bootstrapSwitch(),
				requirePin = featureTemplate.find('[name="require_pin"]');

			featureTemplate.find('.cancel-link').on('click', function() {
				popup.dialog('close').remove();
			});

			switchFeature.on('switch-change', function(e, data) {
				data.value ? featureTemplate.find('.content').slideDown() : featureTemplate.find('.content').slideUp();
			});

			requirePin.on('ifChanged', function() {
				if(requirePin.is(':checked')) {
					featureTemplate.find('#pin')
						.removeAttr('disabled', 'disabled')
						.focus();
				}
				else {
					featureTemplate.find('#pin')
						.val('')
						.attr('disabled', 'disabled');
				}
			});

			featureTemplate.find('.save').on('click', function() {
				var formData = form2object('hotdesk_form');

				formData.enabled = switchFeature.bootstrapSwitch('status');
				formData.id = currentUser.extra.extension;
				delete currentUser.hotdesk;

				userToSave = $.extend(true, {}, currentUser, { hotdesk: formData });

				self.usersUpdateUser(userToSave, function(data) {
					popup.dialog('close').remove();

					self.usersRender({ userId: data.data.id });
				});
			});

			monster.ui.prettyCheck.create(featureTemplate.find('.content'));

			var popup = monster.ui.dialog(featureTemplate, {
				title: currentUser.extra.mapFeatures.hotdesk.title,
				position: ['center', 20]
			});
		},

		usersRenderVMToEmail: function(currentUser) {
			var self = this,
				featureTemplate = $(monster.template(self, 'users-feature-vm_to_email', currentUser)),
				switchFeature = featureTemplate.find('.switch').bootstrapSwitch();

			featureTemplate.find('.cancel-link').on('click', function() {
				popup.dialog('close').remove();
			});

			switchFeature.on('switch-change', function(e, data) {
				data.value ? featureTemplate.find('.content').slideDown() : featureTemplate.find('.content').slideUp();
			});

			featureTemplate.find('.save').on('click', function() {
				var formData = form2object('vm_to_email_form'),
				    userToSave = $.extend(true, {}, currentUser),
				    enabled = switchFeature.bootstrapSwitch('status'),
				    updateUser = function(user) {
						self.usersUpdateUser(user, function(data) {
							popup.dialog('close').remove();

							self.usersRender({ userId: data.data.id });
						});
					},
					/* updates all the vmboxes with the new delete after notify setting, and then calls the callback*/
					updateVMsDeleteAfterNotify = function(val, userId, callbackAfterUpdate) {
						self.usersListVMBoxesUser(userId, function(vmboxes) {
							var listFnParallel = [];

							_.each(vmboxes, function(vm) {
								listFnParallel.push(function(callback) {
									self.usersGetVMBox(vm.id, function(data) {
										/* Only update vms if the deleteAfterNotify value is different than before */
										if(data.delete_after_notify !== val) {
											data.delete_after_notify = val;

											self.usersUpdateVMBox(data, function(data) {
												callback(null, data);
											});
										}
										else {
											callback(null, data);
										}
									});
								});
							});

							monster.parallel(listFnParallel, function(err, results) {
								callbackAfterUpdate && callbackAfterUpdate(results);
							});
						});
					};

				userToSave.vm_to_email_enabled = enabled;

				/* Only update the email and the checkboxes if the setting is enabled */
				if(enabled === true) {
					userToSave.email = formData.email;

					/* Update VMBoxes, then update user and finally close the popup */
					updateVMsDeleteAfterNotify(formData.delete_after_notify, userToSave.id, function() {
						updateUser(userToSave);
					});
				}
				else {
					updateUser(userToSave);
				}
			});

			monster.ui.prettyCheck.create(featureTemplate.find('.content'));

			var popup = monster.ui.dialog(featureTemplate, {
				title: currentUser.extra.mapFeatures.vm_to_email.title,
				position: ['center', 20]
			});
		},

		usersRenderCallerId: function(currentUser) {
			var self = this,
				featureTemplate = $(monster.template(self, 'users-feature-caller_id', currentUser)),
				switchFeature = featureTemplate.find('.switch').bootstrapSwitch();

			featureTemplate.find('.cancel-link').on('click', function() {
				popup.dialog('close').remove();
			});

			switchFeature.on('switch-change', function(e, data) {
				data.value ? featureTemplate.find('.content').slideDown() : featureTemplate.find('.content').slideUp();
			});

			featureTemplate.find('.save').on('click', function() {
				var switchCallerId = featureTemplate.find('.switch'),
					userData = currentUser,
					userToSave = $.extend(true, {}, {
						caller_id: {
							internal: {}
						}
					}, currentUser);

				if(switchCallerId.bootstrapSwitch('status') === false) {
					if('internal' in userToSave.caller_id) {
						delete userToSave.caller_id.internal.number;
					}
				}
				else {
					userToSave.caller_id.internal.number = featureTemplate.find('.caller-id-select').val();
				}

				self.usersUpdateUser(userToSave, function(data) {
					popup.dialog('close').remove();

					self.usersRender({ userId: data.data.id });
				});
			});

			if(currentUser.extra.listCallerId.length > 0){
				var popup = monster.ui.dialog(featureTemplate, {
					title: currentUser.extra.mapFeatures.caller_id.title,
					position: ['center', 20]
				});
			}
			else {
				monster.ui.alert('error', 'Before configuring the Caller-ID of this user, you need to assign him a number');
			}
		},

		usersRenderCallForward: function(currentUser) {
			var self = this,
				featureTemplate = $(monster.template(self, 'users-feature-call_forward', currentUser)),
				switchFeature = featureTemplate.find('.switch').bootstrapSwitch();

			featureTemplate.find('.cancel-link').on('click', function() {
				popup.dialog('close').remove();
			});

			switchFeature.on('switch-change', function(e, data) {
				data.value ? featureTemplate.find('.content').slideDown() : featureTemplate.find('.content').slideUp();
			});

			featureTemplate.find('.save').on('click', function() {
				var formData = form2object('call_forward_form');

				formData.enabled = switchFeature.bootstrapSwitch('status');
				formData.number = monster.util.unformatPhoneNumber(formData.number, 'keepPlus');

				var userToSave = $.extend(true, {}, currentUser, { call_forward: formData});

				self.usersUpdateUser(userToSave, function(data) {
					popup.dialog('close').remove();

					self.usersRender({ userId: data.data.id });
				});
			});

			monster.ui.prettyCheck.create(featureTemplate.find('.content'));

			var popup = monster.ui.dialog(featureTemplate, {
				title: currentUser.extra.mapFeatures.call_forward.title,
				position: ['center', 20]
			});
		},

		usersCleanUserData: function(userData) {
			/* If the user has been removed from the directory */
			if(userData.extra) {
				if(userData.extra.includeInDirectory === false) {
					if('directories' in userData && userData.extra.mainDirectoryId && userData.extra.mainDirectoryId in userData.directories) {
						delete userData.directories[userData.extra.mainDirectoryId];
					}
				}
				else {
					userData.directories = userData.directories || {};

					if(userData.extra.mainCallflowId) {
						userData.directories[userData.extra.mainDirectoryId] = userData.extra.mainCallflowId;
					}
				}

				if('sameEmail' in userData.extra) {
					userData.email = userData.extra.sameEmail ? userData.username : userData.extra.email;
				}
			}

			delete userData.include_directory;
			delete userData.features;
			delete userData.extra;
			delete userData[''];

			return userData;
		},

		usersGetTemplate: function(type, userId, listUsers, callbackAfterData) {
			var self = this,
				template;

			if(type === 'name') {
				self.usersGetNameTemplate(userId, listUsers, callbackAfterData);
			}
			else if(type === 'numbers') {
				self.usersGetNumbersTemplate(userId, callbackAfterData);
			}
			else if(type === 'extensions') {
				self.usersGetExtensionsTemplate(userId, callbackAfterData);
			}
			else if(type === 'features') {
				self.usersGetFeaturesTemplate(userId, listUsers, callbackAfterData);
			}
			else if(type === 'devices') {
				self.usersGetDevicesTemplate(userId, callbackAfterData);
			}
		},

		usersGetFeaturesTemplate: function(userId, listUsers, callback) {
			var self = this;

			self.usersGetUser(userId, function(userData) {
				_.each(listUsers.users, function(user) {
					if(user.id === userData.id) {
						userData = $.extend(true, userData, user);
					}
				});

				var dataTemplate = self.usersFormatUserData(userData);

				template = $(monster.template(self, 'users-features', dataTemplate));

				callback && callback(template, dataTemplate);
			});
		},
		usersGetNameTemplate: function(userId, listUsers, callbackAfterFormat) {
			var self = this;

			monster.parallel({
					mainCallflow: function(callback) {
						self.usersGetMainCallflow(userId, function(mainCallflow) {
							callback(null, mainCallflow);
						});
					},
					mainDirectory: function(callback) {
						self.usersGetMainDirectory(function(mainDirectory) {
							callback(null, mainDirectory);
						});
					},
					user: function(callback) {
						self.usersGetUser(userId, function(userData) {
							callback(null, userData);
						});
					}
				},
				function(error, results) {
					var userData = results.user;

					_.each(listUsers.users, function(user) {
						if(user.id === results.user.id) {
							userData = $.extend(true, userData, user);
						}
					});

					var dataTemplate = self.usersFormatUserData(userData, results.mainDirectory, results.mainCallflow);

					template = $(monster.template(self, 'users-name', dataTemplate));

					timezone.populateDropdown(template.find('#user_timezone'), dataTemplate.timezone);

					callbackAfterFormat && callbackAfterFormat(template, dataTemplate);
				}
			);
		},

		usersGetDevicesData: function(callback) {
			var self = this;

			monster.request({
				resource: 'voip.users.listDevices',
				data: {
					accountId: self.accountId
				},
				success: function(data) {
					callback && callback(data.data);
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
						self.usersListNumbers(function(listNumbers) {
							callbackParallel && callbackParallel(null, listNumbers);
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
		usersGetDevicesTemplate: function(userId, callback) {
			var self = this;

			self.usersGetDevicesData(function(results) {
				var results = self.usersFormatDevicesData(userId, results);

				template = $(monster.template(self, 'users-devices', results));

				callback && callback(template, results);
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
		usersFormatDevicesData: function(userId, data) {
			var self = this,
				formattedData = {
					countSpare: 0,
					assignedDevices: {},
					unassignedDevices: {}
				};

			_.each(data, function(device) {
				if(device.owner_id === userId) {
					formattedData.assignedDevices[device.id] = device;
				}
				else if(device.owner_id === '' || !('owner_id' in device)) {
					formattedData.countSpare++;
					formattedData.unassignedDevices[device.id] = device;
				}
			});

			formattedData.emptyAssigned = _.isEmpty(formattedData.assignedDevices);
			formattedData.emptySpare = _.isEmpty(formattedData.unassignedDevices);

			return formattedData;
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

				if(response.callflow) {
					/* If a number is in a callflow and is set as used by callflows in the number manager, then we display it as an assigned number */
					_.each(response.callflow.numbers, function(number) {
						if(number in data.numbers.numbers && data.numbers.numbers[number].used_by === 'callflow') {
							response.assignedNumbers[number] = data.numbers.numbers[number];
						}
						else {
							response.extensions.push(number);
						}
					});
				}

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
		},

		usersFormatCreationData: function(data, callback) {
			var self = this,
				fullName = data.user.first_name + ' ' + data.user.last_name,
				formattedData = {
					user: $.extend(true, {}, {
						email: data.extra.sameEmail ? data.user.username : data.extra.email
					}, data.user),
					vmbox: {
						mailbox: (data.callflow || {}).extension,
						name: fullName + '\'s VMBox',
						timezone: data.user.timezone
					},
					callflow: {
						contact_list: {
							exclude: false
						},
						flow: {
							children: {
								_: {
									children: {},
									data: {},
									module: 'voicemail'
								}
							},
							data: {
								can_call_self: false,
								timeout: 20
							},
							module: 'user'
						},
						name: fullName + ' SmartPBX\'s Callflow',
						numbers: [ (data.callflow || {}).extension ]
					},
					extra: data.extra
				};

			return formattedData;
		},

		/* Utils */
		usersDelete: function(userId, callback) {
			var self = this;

			monster.parallel({
					devices: function(callback) {
						monster.request({
							resource: 'voip.users.listUserDevices',
							data: {
								accountId: self.accountId,
								userId: userId
							},
							success: function(data) {
								callback(null, data.data);
							}
						});
					},
					vmbox: function(callback) {
						self.usersListVMBoxesUser(userId, function(data) {
							callback(null, data);
						});
					},
					callflows: function(callback) {
						self.usersListCallflowsUser(userId, function(data) {
							callback(null, data);
						});
					}
				},
				function(error, results) {
					var listFnDelete = [];

					_.each(results.devices, function(device) {
						listFnDelete.push(function(callback) {
							self.usersDeleteDevice(device.id, function(data) {
								callback(null, '');
							});
						});
					});

					_.each(results.callflows, function(callflow) {
						listFnDelete.push(function(callback) {
							self.usersDeleteCallflow(callflow.id, function(data) {
								callback(null, '');
							});
						});
					});

					_.each(results.vmbox, function(vmbox) {
						listFnDelete.push(function(callback) {
							self.usersDeleteVMBox(vmbox.id, function(data) {
								callback(null, '');
							});
						});
					});

					monster.parallel(listFnDelete, function(err, resultsDelete) {
						self.usersDeleteUser(userId, function(data) {
							toastr.success(monster.template(self, '!' + self.i18n.active().users.toastrMessages.userDelete, { name: data.first_name + ' ' + data.last_name }));
							self.usersRender();
						});
					});
				}
			);
		},

		usersDeleteUser: function(userId, callback) {
			var self = this;

			monster.request({
				resource: 'voip.users.deleteUser',
				data: {
					userId: userId,
					accountId: self.accountId,
					data: {}
				},
				success: function(data) {
					callback(data.data);
				}
			});
		},
		usersDeleteVMBox: function(vmboxId, callback) {
			var self = this;

			monster.request({
				resource: 'voip.users.deleteVMBox',
				data: {
					vmboxId: vmboxId,
					accountId: self.accountId,
					data: {}
				},
				success: function(data) {
					callback(data.data);
				}
			});
		},
		usersDeleteDevice: function(deviceId, callback) {
			var self = this;

			monster.request({
				resource: 'voip.users.deleteDevice',
				data: {
					deviceId: deviceId,
					accountId: self.accountId,
					data: {}
				},
				success: function(data) {
					callback(data.data);
				}
			});
		},
		usersDeleteCallflow: function(callflowId, callback) {
			var self = this;

			monster.request({
				resource: 'voip.users.deleteCallflow',
				data: {
					callflowId: callflowId,
					accountId: self.accountId,
					data: {}
				},
				success: function(data) {
					callback(data.data);
				}
			});
		},

		usersCreate: function(data, callback) {
			var self = this;

			monster.request({
				resource: 'voip.users.createUser',
				data: {
					accountId: self.accountId,
					data: data.user
				},
				success: function(_dataUser) {
					var userId = _dataUser.data.id;
					data.user.id = userId;
					data.vmbox.owner_id = userId;

					self.usersCreateVMBox(data.vmbox, function(_dataVM) {
						data.callflow.owner_id = userId;
						data.callflow.flow.data.id = userId;
						data.callflow.flow.children['_'].data.id = _dataVM.id;

						self.usersCreateCallflow(data.callflow, function(_dataCF) {
							if(data.extra.includeInDirectory) {
								self.usersAddUserToMainDirectory(_dataUser.data, _dataCF.id, function(dataDirectory) {
									callback(data);
								});
							}
							else {
								callback(data);
							}
						});
					});
				}
			});
		},

		/* Hack to support users from previous version */
		usersMigrateFromExtensions: function(userId, listExtensions, callback) {
			var self = this;

			self.usersGetUser(userId, function(user) {
				var fullName = user.first_name + ' ' + user.last_name,
					vmbox = {
						owner_id: user.id,
						mailbox: listExtensions[0], //TODO
						name: fullName + '\'s VMBox',
						timezone: user.timezone
					},
					callflow = {
						contact_list: {
							exclude: false
						},
						flow: {
							children: {
								_: {
									children: {},
									data: {
									},
									module: 'voicemail'
								}
							},
							data: {
								id: user.id,
								can_call_self: false,
								timeout: 20
							},
							module: 'user'
						},
						name: fullName + ' SmartPBX\'s Callflow',
						numbers: listExtensions,
						owner_id: user.id
					};

				self.usersCreateVMBox(vmbox, function(_dataVM) {
					callflow.flow.children['_'].data.id = _dataVM.id;

					self.usersCreateCallflow(callflow, function(_dataCF) {
						callback && callback(_dataCF);
					});
				});
			});
		},

		usersAddUserToMainDirectory: function(dataUser, callflowId, callback) {
			var self = this;

			self.usersGetMainDirectory(function(directory) {
				dataUser.directories = dataUser.directories || {};
				dataUser.directories[directory.id] = callflowId;

				self.usersUpdateUser(dataUser, function(data) {
					callback && callback(data);
				});
			});
		},

		usersGetMainCallflow: function(userId, callback) {
			var self = this;

			self.usersListCallflowsUser(userId, function(listCallflows) {
				var indexMain = -1;

				_.each(listCallflows, function(callflow, index) {
					if(callflow.owner_id === userId) {
						indexMain = index;
						return false;
					}
				});

				if(indexMain === -1) {
					//toastr.error(self.i18n.active().users.noUserCallflow);
					callback(null);
				}
				else {
					callback(listCallflows[indexMain]);
				}
			});
		},

		usersGetMainDirectory: function(callback) {
			var self = this;

			self.usersListDirectories(function(listDirectories) {
				var indexMain = -1;

				_.each(listDirectories, function(directory, index) {
					if(directory.name === 'SmartPBX Directory') {
						indexMain = index;

						return false;
					}
				});

				if(indexMain === -1) {
					self.usersCreateMainDirectory(function(data) {
						callback(data);
					});
				}
				else {
					callback(listDirectories[indexMain]);
				}
			});
		},

		usersListDirectories: function(callback) {
			var self = this;

			monster.request({
				resource: 'voip.users.listDirectories',
				data: {
					accountId: self.accountId
				},
				success: function(data) {
					callback && callback(data.data);
				}
			});
		},

		usersCreateMainDirectory: function(callback) {
			var self = this,
				dataDirectory = {
					confirm_match: false,
					max_dtmf: '0',
					min_dtmf: '3',
					name: 'SmartPBX Directory',
					sort_by: 'last_name'
				};

			monster.request({
				resource: 'voip.users.createDirectory',
				data: {
					accountId: self.accountId,
					data: dataDirectory
				},
				success: function(data) {
					callback && callback(data.data);
				}
			});
		},

		usersListCallflowsUser: function(userId, callback) {
			var self = this;

			monster.request({
				resource: 'voip.users.listUserCallflows',
				data: {
					accountId: self.accountId,
					userId: userId
				},
				success: function(data) {
					callback(data.data);
				}
			});
		},

		usersListVMBoxesUser: function(userId, callback) {
			var self = this;

			monster.request({
				resource: 'voip.users.listUserVMBoxes',
				data: {
					accountId: self.accountId,
					userId: userId
				},
				success: function(data) {
					callback(data.data);
				}
			});
		},

		usersGetVMBox: function(vmboxId, callback) {
			var self = this;

			monster.request({
				resource: 'voip.users.getVMBox',
				data: {
					accountId: self.accountId,
					vmboxId: vmboxId
				},
				success: function(data) {
					callback(data.data);
				}
			});
		},

		usersCreateVMBox: function(vmData, callback) {
			var self = this;

			monster.request({
				resource: 'voip.users.createVMBox',
				data: {
					accountId: self.accountId,
					data: vmData
				},
				success: function(data) {
					callback(data.data);
				}
			});
		},

		usersUpdateVMBox: function(vmData, callback) {
			var self = this;

			monster.request({
				resource: 'voip.users.updateVMBox',
				data: {
					accountId: self.accountId,
					data: vmData,
					vmboxId: vmData.id
				},
				success: function(data) {
					callback(data.data);
				}
			});
		},

		usersCreateCallflow: function(callflowData, callback) {
			var self = this;

			monster.request({
				resource: 'voip.users.createCallflow',
				data: {
					accountId: self.accountId,
					data: callflowData
				},
				success: function(data) {
					callback(data.data);
				}
			});
		},

		usersGetUser: function(userId, callback) {
			var self = this;

			monster.request({
				resource: 'voip.users.getUser',
				data: {
					accountId: self.accountId,
					userId: userId
				},
				success: function(user) {
					callback && callback(user.data);
				}
			});
		},

		usersUpdateUser: function(userData, callback) {
			var self = this;

			userData = self.usersCleanUserData(userData);

			monster.request({
				resource: 'voip.users.updateUser',
				data: {
					accountId: self.accountId,
					userId: userData.id,
					data: userData
				},
				success: function(userData) {
					callback && callback(userData);
				},
				error: function(data) {
					monster.ui.handleError(data);
				}
			});
		},

		usersGetConferenceFeature: function(userId, callback) {
			var self = this;

			self.usersListConferences(userId, function(conferences) {
				if(conferences.length > 0) {
					self.usersGetConference(conferences[0].id, function(conference) {
						callback && callback(conference);
					});
				}
				else {
					callback && callback();
				}
			});
		},

		usersListConferences: function(userId, callback) {
			var self = this;

			monster.request({
				resource: 'voip.users.listUserConferences',
				data: {
					accountId: self.accountId,
					userId: userId
				},
				success: function(data) {
					callback(data.data);
				}
			});
		},

		usersGetConference: function(conferenceId, callback) {
			var self = this;

			monster.request({
				resource: 'voip.users.getConference',
				data: {
					accountId: self.accountId,
					conferenceId: conferenceId
				},
				success: function(data) {
					callback(data.data);
				}
			});
		},

		usersUpdateConference: function(conference, callback) {
			var self = this;

			monster.request({
				resource: 'voip.users.updateConference',
				data: {
					accountId: self.accountId,
					conferenceId: conference.id,
					data: conference
				},
				success: function(data) {
					callback(data.data);
				}
			});
		},

		usersCreateConference: function(conference, callback) {
			var self = this;

			monster.request({
				resource: 'voip.users.createConference',
				data: {
					accountId: self.accountId,
					data: conference
				},
				success: function(data) {
					callback(data.data);
				}
			});
		},

		usersDeleteConference: function(conferenceId, callback) {
			var self = this;

			monster.request({
				resource: 'voip.users.deleteConference',
				data: {
					accountId: self.accountId,
					conferenceId: conferenceId,
					data: {}
				},
				success: function(data) {
					callback(data.data);
				}
			});
		},

		usersGetDevice: function(deviceId, callback) {
			var self = this;

			monster.request({
				resource: 'voip.users.getDevice',
				data: {
					accountId: self.accountId,
					deviceId: deviceId
				},
				success: function(data) {
					callback(data.data);
				}
			});
		},

		usersUpdateDevice: function(data, callback) {
			var self = this;

			monster.request({
				resource: 'voip.users.updateDevice',
				data: {
					accountId: self.accountId,
					data: data,
					deviceId: data.id
				},
				success: function(data) {
					callback(data.data);
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
							resource: 'voip.users.listDevices',
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

		usersUpdateDevices: function(data, userId, callbackAfterUpdate) {
			var self = this;

			monster.parallel
			var listFnParallel = [];

			_.each(data.new, function(deviceId) {
				listFnParallel.push(function(callback) {
					self.usersGetDevice(deviceId, function(data) {
						data.owner_id = userId;

						self.usersUpdateDevice(data, function(data) {
							callback(null, data);
						});
					});
				});
			});

			_.each(data.old, function(deviceId) {
				listFnParallel.push(function(callback) {
					self.usersGetDevice(deviceId, function(data) {
						delete data.owner_id;

						self.usersUpdateDevice(data, function(data) {
							callback(null, data);
						});
					});
				});
			});

			monster.parallel(listFnParallel, function(err, results) {
				callbackAfterUpdate && callbackAfterUpdate(results);
			});
		},

		usersUpdateCallflowNumbers: function(userId, callflowId, numbers, callback) {
			var self = this;

			if(numbers.length > 0) {
				if(callflowId) {
					monster.request({
						resource: 'voip.users.getCallflow',
						data: {
							accountId: self.accountId,
							callflowId: callflowId
						},
						success: function(getCallflowData) {
							getCallflowData.data.numbers = numbers;

							self.usersUpdateCallflow(getCallflowData.data, function(callflowData) {
								callback && callback(callflowData);
							});
						}
					});
				}
				else {
					if(numbers[0].length < 7) {
						self.usersMigrateFromExtensions(userId, numbers, function(data) {
							callback && callback(data);
						});
					}
					else {
						toastr.error(self.i18n.active().users.needExtensionFirst);
					}
				}
			}
			else {
				toastr.error(self.i18n.active().users.noNumberCallflow);
			}
		},

		usersListNumbers: function(callback) {
			var self = this;

			monster.request({
				resource: 'voip.users.getNumbers',
				data: {
					accountId: self.accountId
				},
				success: function(numbers) {
					callback && callback(numbers.data);
				}
			});
		},

		usersUpdateCallflow: function(callflow, callback) {
			var self = this;

			monster.request({
				resource: 'voip.users.updateCallflow',
				data: {
					accountId: self.accountId,
					callflowId: callflow.id,
					data: callflow
				},
				success: function(callflowData) {
					callback && callback(callflowData.data);
				}
			});
		},

		usersCreateCallflow: function(callflow, callback) {
			var self = this;

			monster.request({
				resource: 'voip.users.createCallflow',
				data: {
					accountId: self.accountId,
					data: callflow
				},
				success: function(callflowData) {
					callback && callback(callflowData.data);
				}
			});
		},

		usersUpdateConferencing: function(data, globalCallback) {
			var self = this;

			monster.parallel({
					conference: function(callback) {
						var baseConference = {
							name: data.user.first_name + ' ' + data.user.last_name + ' SmartPBX Conference',
							owner_id: data.user.id,
							play_name_on_join: true,
							member: {
								numbers: []
							}
						};

						baseConference = $.extend(true, {}, baseConference, data.conference);

						self.usersListConferences(data.user.id, function(conferences) {
							var conferenceToSave = baseConference;
							if(conferences.length > 0) {
								conferenceToSave = $.extend(true, {}, conferences[0], baseConference);

								self.usersUpdateConference(conferenceToSave, function(conference) {
									callback && callback(null, conference);
								});
							}
							else {
								self.usersCreateConference(conferenceToSave, function(conference) {
									callback && callback(null, conference);
								});
							}
						});
					},
					user: function(callback) {
						if(data.user.smartpbx && data.user.smartpbx.conferencing && data.user.smartpbx.conferencing.enabled === true) {
							callback && callback(null, data.user);
						}
						else {
							data.user.smartpbx = data.user.smartpbx || {};
							data.user.smartpbx.conferencing = data.user.smartpbx.conferencing || {};

							data.user.smartpbx.conferencing.enabled = true;

							self.usersUpdateUser(data.user, function(user) {
								callback && callback(null, user);
							});
						}
					}
				},
				function(err, results) {
					globalCallback && globalCallback(results);
				}
			);
		},

		usersUpdateFaxing: function(data, newNumber, globalCallback) {
			var self = this;

			monster.parallel({
					callflow: function(callback) {
						var baseCallflow = {
							type: 'faxing',
							owner_id: data.user.id,
							numbers: [ newNumber ],
							flow: {
								data: {
									owner_id: data.user.id
								},
								module: 'receive_fax',
								children: {}
							}
						};

						self.usersListCallflowsUser(data.user.id, function(callflows) {
							_.each(callflows, function(callflow) {
								if(callflow.type === 'faxing') {
									baseCallflow.id = callflow.id;

									return false;
								}
							});

							self.usersUpdateCallflowFaxing(baseCallflow, function(callflow) {
								callback && callback(null, callflow);
							});
						});
					},
					user: function(callback) {
						if(data.user.smartpbx && data.user.smartpbx.faxing && data.user.smartpbx.faxing.enabled === true) {
							callback && callback(null, data.user);
						}
						else {
							data.user.smartpbx = data.user.smartpbx || {};
							data.user.smartpbx.faxing = data.user.smartpbx.faxing || {};

							data.user.smartpbx.faxing.enabled = true;

							self.usersUpdateUser(data.user, function(user) {
								callback && callback(null, user);
							});
						}
					}
				},
				function(err, results) {
					globalCallback && globalCallback(results);
				}
			);
		},

		usersUpdateCallflowFaxing: function(callflow, callback) {
			var self = this;

			if(callflow.id) {
				self.usersUpdateCallflow(callflow, function(callflow) {
					callback && callback(callflow);
				});
			}
			else {
				self.usersCreateCallflow(callflow, function(callflow) {
					callback && callback(callflow);
				});
			}
		},

		usersDeleteConferencing: function(userId, globalCallback) {
			var self = this;

			monster.parallel({
					conferences: function(callback) {
						self.usersListConferences(userId, function(conferences) {
							var listRequests = [];

							_.each(conferences, function(conference) {
								listRequests.push(function(subCallback) {
									self.usersDeleteConference(conference.id, function(data) {
										subCallback(null, data);
									});
								});
							});

							monster.parallel(listRequests, function(err, results) {
								callback && callback(results);
							});
						});
					},
					user: function(callback) {
						self.usersGetUser(userId, function(user) {
							//user.conferencing_enabled = false;
							user.smartpbx = user.smartpbx || {};
							user.smartpbx.conferencing = user.smartpbx.conferencing || {};

							user.smartpbx.conferencing.enabled = false;

							self.usersUpdateUser(user, function(user) {
								callback(null, user);
							});
						});

					}
				},
				function(err, results) {
					globalCallback && globalCallback(results);
				}
			);
		},

		usersDeleteFaxing: function(userId, globalCallback) {
			var self = this;

			monster.parallel({
					callflows: function(callback) {
						self.usersListCallflowsUser(userId, function(callflows) {
							var listRequests = [];

							_.each(callflows, function(callflow) {
								if(callflow.type === 'faxing') {
									listRequests.push(function(subCallback) {
										self.usersDeleteCallflow(callflow.id, function(data) {
											subCallback(null, data);
										});
									});
								}
							});

							monster.parallel(listRequests, function(err, results) {
								callback && callback(results);
							});
						});
					},
					user: function(callback) {
						self.usersGetUser(userId, function(user) {
							//user.faxing_enabled = false;
							user.smartpbx = user.smartpbx || {};
							user.smartpbx.faxing = user.smartpbx.faxing || {};

							user.smartpbx.faxing.enabled = false;

							self.usersUpdateUser(user, function(user) {
								callback(null, user);
							});
						});

					}
				},
				function(err, results) {
					globalCallback && globalCallback(results);
				}
			);
		},

		usersSortExtensions: function(a, b) {
			var parsedA = parseInt(a),
				parsedB = parseInt(b),
				result = -1;

			if(parsedA > 0 && parsedB > 0) {
				result = parsedA > parsedB;
			}

			return result;
		}
	};

	return app;
});
