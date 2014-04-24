define(function(require){
	var $ = require('jquery'),
		_ = require('underscore'),
		chosen = require('chosen'),
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
			'voip.users.listVMBoxes': {
				url: 'accounts/{accountId}/vmboxes',
				verb: 'GET'
			},
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
				url: 'accounts/{accountId}/callflows',
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
			'voip.users.listConfNumbers': {
				url: 'accounts/{accountId}/callflows?filter_type=conference',
				verb: 'GET'
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
				url: 'accounts/{accountId}/directories',
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
			/* Media */
			'voip.users.listMedia': {
				url: 'accounts/{accountId}/media?key_missing=type',
				verb: 'GET'
			},
			'voip.users.createMedia': {
				url: 'accounts/{accountId}/media',
				verb: 'PUT'
			},
			'voip.users.deleteMedia': {
				url: 'accounts/{accountId}/media/{mediaId}',
				verb: 'DELETE'
			},
            'voip.users.uploadMedia': {
                url: 'accounts/{accountId}/media/{mediaId}/raw',
                verb: 'POST',
                type: 'application/x-base64'
            },
			/* Misc */
			'voip.users.getNumbers': {
				url: 'accounts/{accountId}/phone_numbers',
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
				_userId = args.userId,
				_openedTab = args.openedTab;

			self.usersRemoveOverlay();

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
					var cells = parent.find('.grid-row[data-id=' + _userId + '] .grid-cell');

					monster.ui.fade(cells);
				}

				if ( dataTemplate.users.length == 0) {
					parent.find('.grid-row.title').css('display', 'none');
					parent.find('.no-users-row').css('display', 'block');
				} else {
					parent.find('.grid-row.title').css('display', 'block');
					parent.find('.no-users-row').css('display', 'none');
				}

				if(_userId && _openedTab) {
					template.find('.grid-row[data-id="'+ _userId +'"] .grid-cell[data-type="' + _openedTab + '"]').click();

					args.callback && args.callback();
				}
			});
		},

		usersFormatUserData: function(dataUser, _mainDirectory, _mainCallflow, _vmbox, _vmboxes) {
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
					differentEmail: dataUser.email !== dataUser.username,
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
							icon: 'icon-telicon-voicemail',
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
						},
						find_me_follow_me: {
							icon: 'icon-sitemap',
							iconColor: 'icon-purple',
							title: self.i18n.active().users.find_me_follow_me.title
						},
						music_on_hold: {
							icon: 'icon-music',
							iconColor: 'icon-pink',
							title: self.i18n.active().users.music_on_hold.title
						}
					}
				};

			if(!('extra' in dataUser)) {
				dataUser.extra = formattedUser;
			}

			_.each(dataUser.features, function(v) {
				dataUser.extra.mapFeatures[v].active = true;
			});

			dataUser.extra.countFeatures = dataUser.features.length;
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

			if(_vmbox) {
				dataUser.extra.vmbox = _vmbox;
			}

			if(!_.isEmpty(_vmbox) && !_.isEmpty(_vmboxes)) {
				var i = _vmboxes.indexOf(_vmbox.mailbox);

				_vmboxes.splice(i, 1);

				dataUser.extra.existingVmboxes = _vmboxes;
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
				if(callflow.type !== 'faxing') {
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

			var sortedUsers = [];

			_.each(mapUsers, function(user) {
				sortedUsers.push(user);
			});

			sortedUsers = monster.util.sort(sortedUsers, 'last_name');

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

				template.find('.edit-user').slideUp("400", function() {
					$(this).empty();
				});

				if(cell.hasClass('active')) {
					template.find('.grid-cell').removeClass('active');
					template.find('.grid-row').removeClass('active');

					self.usersRemoveOverlay();
					cell.css({
						'position': 'inline-block',
						'z-index': '0'
					});

					cell.parent().siblings('.edit-user').css({
						'position': 'block',
						'z-index': '0'
					});
				}
				else {
					template.find('.grid-cell').removeClass('active');
					template.find('.grid-row').removeClass('active');
					cell.toggleClass('active');
					row.toggleClass('active');

					cell.css({
						'position': 'relative',
						'z-index': '3'
					});

					cell.parent().siblings('.edit-user').css({
						'position': 'relative',
						'z-index': '2'
					});

					self.usersGetTemplate(type, userId, listUsers, function(template, data) {
						if(type === 'name') {
							currentUser = data;

							template.find('#user_timezone').chosen({search_contains: true, width: "61%"});

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

						row.find('.edit-user').append(template).slideDown();

						$('body').append($('<div id="users_container_overlay"></div>'));
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
				monster.parallel({
						callflows: function(callback) {
							self.usersListCallflows(function(callflows) {
								callback(null, callflows);
							});
						},
						vmboxes: function(callback) {
							self.usersListVMBoxes(function(vmboxes) {
								callback(null, vmboxes);
							});
						}
					},
					function(err, results) {
						var originalData = self.usersFormatAddUser(results),
							userTemplate = $(monster.template(self, 'users-creation', originalData));

						timezone.populateDropdown(userTemplate.find('#user_creation_timezone'));
						monster.ui.prettyCheck.create(userTemplate);

						monster.ui.validate(userTemplate.find('#form_user_creation'), {
							rules: {
								'callflow.extension': {
									checkList: originalData.listExtensions
								},
								'vmbox.number': {
									checkList: originalData.listVMBoxes
								}
							},
							messages: {
								'user.first_name': {
									required: self.i18n.active().validation.required
								},
								'user.last_name': {
									required: self.i18n.active().validation.required
								},
								'callflow.extension': {
									required: self.i18n.active().validation.required
								}
							}
						});

						userTemplate.find('#create_user').on('click', function() {
							if(monster.ui.valid(userTemplate.find('#form_user_creation'))) {
								var dataForm = form2object('form_user_creation'),
									formattedData = self.usersFormatCreationData(dataForm);

								self.usersCreate(formattedData, function(data) {
									popup.dialog('close').remove();

									self.usersRender({ userId: data.user.id });
								});
							}
						});

						userTemplate.find('#notification_email').on('ifChanged', function() {
							userTemplate.find('.email-group').toggleClass('hidden');
						});

						var popup = monster.ui.dialog(userTemplate, {
							title: self.i18n.active().users.dialogCreationUser.title
						});
					}
				);
			});

			template.on('click', '.cancel-link', function() {
				template.find('.edit-user').slideUp("400", function() {
					$(this).empty();
					template.find('.grid-cell.active').css({
						'position': 'inline-block',
						'z-index': '0'
					});
					template.find('.grid-row.active .edit-user').css({
						'position': 'block',
						'z-index': '0'
					});
					template.find('.grid-row.active').removeClass('active');

					self.usersRemoveOverlay();

					template.find('.grid-cell.active').removeClass('active');
				});


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

				monster.ui.confirm(self.i18n.active().users.confirmDeleteUser, function() {
					self.usersDelete(userId, function(data) {
						toastr.success(monster.template(self, '!' + toastrMessages.userDeleted));
					});
				});
			});

			template.on('ifChanged', '#notification_email', function() {
				template.find('.email-border').toggleClass('open');
				template.find('.email-group').toggleClass('hidden');
			});

			template.on('click', '.save-user', function() {
				var formData = form2object('form-'+currentUser.id),
					form = template.find('#form-'+currentUser.id);

				if(monster.ui.valid(form)) {
					currentUser.extra.vmbox.mailbox = formData.extra.vmboxNumber;
					currentUser.extra.vmbox.timezone = formData.timezone;

					var userToSave = $.extend(true, {}, currentUser, formData);

					monster.parallel({
							vmbox: function(callback) {
								self.usersSmartUpdateVMBox(userToSave, true, function(vmbox) {
									callback && callback(null, vmbox);
								});
							},
							user: function(callback) {
								self.usersUpdateUser(userToSave, function(userData) {
									callback && callback(null, userData.data);
								});
							}
						},
						function(error, results) {
							toastr.success(monster.template(self, '!' + toastrMessages.userUpdated, { name: results.user.first_name + ' ' + results.user.last_name }));

							self.usersRender({ userId: results.user.id });
						}
					);
				}
			});

			template.on('click', '#change_username', function() {
				var passwordTemplate = $(monster.template(self, 'users-changePassword', currentUser)),
					form = passwordTemplate.find('#form_new_username');

				monster.ui.validate(form);

				passwordTemplate.find('.save-new-username').on('click', function() {
					var formData = form2object('form_new_username'),
					    userToSave = $.extend(true, {}, currentUser, formData);

					if(monster.ui.valid(form)) {
						if(!currentUser.extra.differentEmail) {
							userToSave.email = userToSave.username;
						}

						self.usersUpdateUser(userToSave, function(userData) {
							currentUser.username = userData.data.username;
							template.find('#username').html(userData.data.username);

							if(!currentUser.extra.differentEmail) {
								template.find('#email').val(userData.data.email);
								currentUser.email = userData.username;
							}

							popup.dialog('close').remove();

							toastr.success(monster.template(self, '!' + toastrMessages.userUpdated, { name: userData.data.first_name + ' ' + userData.data.last_name }));
						});
					}
				});

				passwordTemplate.find('.cancel-link').on('click', function() {
					popup.dialog('close').remove();
				});

				var popup = monster.ui.dialog(passwordTemplate, {
					title: self.i18n.active().users.dialogChangePassword.title
				});
			});

			/* Events for Devices in Users */
			template.on('click', '.create-device', function() {
				var $this = $(this),
					type = $this.data('type'),
					userId = $this.parents('.grid-row').data('id');

				monster.pub('voip.devices.renderAdd', {
					type: type,
					callback: function(device) {
						var rowDevice = monster.template(self, 'users-rowSpareDevice', device),
							listUnassigned = template.find('.list-unassigned-items'),
							countSpare = template.find('.unassigned-list-header .count-spare');

						listUnassigned.find('.empty-row').hide();

						/* reset search */
						listUnassigned.find('.empty-search-row').hide();
						template.find('.unassigned-list-header .search-query').val('');
						listUnassigned.find('.item-row').show();


						/* Update count */
						countSpare.data('count', parseInt(countSpare.data('count')) + 1);
						template.find('.unassigned-list-header .count-spare').html(countSpare.data('count'));

						/* Add row */
						listUnassigned.append(rowDevice);
					}
				});
            });

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
			template.on('click', '.detail-numbers .list-assigned-items .remove-number', function() {
				var $this = $(this),
					userName = $this.parents('.grid-row').find('.grid-cell.name').text(),
					dataNumbers = $.extend(true, [], extensionsToSave),
					userId = $this.parents('.grid-row').data('id'),
					row = $this.parents('.item-row');

				row.slideUp(function() {
					row.remove();

					if ( !template.find('.list-assigned-items .item-row').is(':visible') ) {
						template.find('.list-assigned-items .empty-row').slideDown();
					}

					template.find('.item-row').each(function(idx, elem) {
						dataNumbers.push($(elem).data('id'));
					});

					self.usersUpdateCallflowNumbers(userId, (currentCallflow || {}).id, dataNumbers, function(callflowData) {
						toastr.success(monster.template(self, '!' + toastrMessages.numbersUpdated, { name: userName }));
						self.usersRender({ userId: callflowData.owner_id });
					});
				});
			});

			template.on('click', '.callerId-number', function() {
				var cnamCell = $(this).parents('.item-row').first(),
					phoneNumber = cnamCell.data('id');

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

			template.on('click', '.feature[data-feature="find_me_follow_me"]', function() {
				monster.parallel({
						userDevices: function(callback) {
							monster.request({
								resource: 'voip.users.listUserDevices',
								data: {
									accountId: self.accountId,
									userId: currentUser.id
								},
								success: function(data) {
									callback(null, data.data);
								}
							});
						},
						userCallflow: function(callback) {
							self.usersListCallflowsUser(currentUser.id, function(data) {
								if(data.length > 0) {
									monster.request({
										resource: 'voip.users.getCallflow',
										data: {
											accountId: self.accountId,
											callflowId: data[0].id
										},
										success: function(callflow) {
											callback(null, callflow.data)
										}
									});
								} else {
									callback(null, null);
								}
							});
						}
					},
					function(error, results) {
						self.usersRenderFindMeFollowMe($.extend(true, results, { currentUser: currentUser }));
					}
				);
			});

			template.on('click', '.feature[data-feature="music_on_hold"]', function() {
				self.usersRenderMusicOnHold(currentUser);
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
				self.usersGetConferenceFeature(currentUser.id, function(dataConf) {
					var data = {
						listConferences: dataConf.listConfNumbers,
						user: currentUser,
						conference: dataConf.conference
					};

					if(_.isEmpty(data.listConferences)) {
						monster.ui.alert('error', self.i18n.active().users.conferencing.noConfNumbers);
					}
					else {
						self.usersRenderConferencing(data);
					}
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

			template.on('click', '.actions .spare-link:not(.disabled)', function(e) {
				e.preventDefault();

				var $this = $(this),
					args = {
					accountName: monster.apps['auth'].currentAccount.name,
					accountId: self.accountId,
					callback: function(numberList) {
						var name = $this.parents('.grid-row').find('.grid-cell.name').text(),
							dataNumbers = $.extend(true, [], extensionsToSave),
							userId = $this.parents('.grid-row').data('id');

						template.find('.empty-row').hide();

						template.find('.item-row').each(function(idx, elem) {
							dataNumbers.push($(elem).data('id'));
						});

						_.each(numberList, function(val, idx) {
							dataNumbers.push(val.phoneNumber);

							template
								.find('.list-assigned-items')
								.append($(monster.template(self, 'users-numbersItemRow', { number: val })));
						});

						self.usersUpdateCallflowNumbers(userId, (currentCallflow || {}).id, dataNumbers, function(callflowData) {
							toastr.success(monster.template(self, '!' + toastrMessages.numbersUpdated, { name: name }));
							self.usersRender({ userId: callflowData.owner_id });
						});
					}
				}

				monster.pub('common.numbers.dialogSpare', args);
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

								template.find('.spare-link.disabled').removeClass('disabled');
							});
                        },
                        error: function(error) {
                        }
                    }
                });
            });

			$('body').on('click', '#users_container_overlay', function() {
				template.find('.edit-user').slideUp("400", function() {
					$(this).empty();
				});

				self.usersRemoveOverlay();

				template.find('.grid-cell.active').css({
					'position': 'inline-block',
					'z-index': '0'
				});

				template.find('.grid-row.active').parent().siblings('.edit-user').css({
					'position': 'block',
					'z-index': '0'
				});

				template.find('.grid-cell.active').removeClass('active');
				template.find('.grid-row.active').removeClass('active');

			});
		},

		usersFormatAddUser: function(data) {
			var formattedData = {
					sendToSameEmail: true,
					nextExtension: '',
					nextVMBox: '',
					listExtensions: {},
					listVMBoxes:{},
				},
				arrayExtensions = [],
				arrayVMBoxes = [];

			_.each(data.callflows, function(callflow) {
				_.each(callflow.numbers, function(number) {
					if(number.length < 7) {
						formattedData.listExtensions[number] = callflow;
						arrayExtensions.push(number);
					}
				});
			});

			arrayExtensions.sort(function(a, b) {
				return parseInt(a) > parseInt(b);
			});

			//Set the Next extension to 2001 if there are no extensions in the system, or to the latest extension + 1 if there are
			formattedData.nextExtension = (parseInt(arrayExtensions[arrayExtensions.length - 1] || 2000) + 1) + '';

			_.each(data.vmboxes, function(vmbox) {
				formattedData.listVMBoxes[vmbox.mailbox] = vmbox;
				arrayVMBoxes.push(vmbox.mailbox);
			});

			arrayVMBoxes.sort(function(a, b) {
				return parseInt(a) > parseInt(b);
			});

			//Set the VMBox Number to 2001 if there are no VMBox in the system, or to the latest vmbox number + 1 if there are
			formattedData.nextVMBox = (parseInt(arrayVMBoxes[arrayVMBoxes.length - 1] || 2000) + 1) + '';

			return formattedData;
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
				switchFeature = featureTemplate.find('.switch').bootstrapSwitch(),
				featureForm = featureTemplate.find('#conferencing_form');

			monster.ui.validate(featureForm);

			featureTemplate.find('.cancel-link').on('click', function() {
				popup.dialog('close').remove();
			});

			switchFeature.on('switch-change', function(e, data) {
				data.value ? featureTemplate.find('.content').slideDown() : featureTemplate.find('.content').slideUp();
			});

			featureTemplate.find('.save').on('click', function() {
				var args = {
					openedTab: 'features',
					callback: function() {
						popup.dialog('close').remove();
					}
				};

				if(monster.ui.valid(featureForm)) {
					data.conference = form2object('conferencing_form');

					if(switchFeature.bootstrapSwitch('status')) {
						self.usersUpdateConferencing(data, function(data) {
							args.userId = data.user.data.id;

							self.usersRender(args);
						});
					}
					else {
						self.usersDeleteConferencing(data.user.id, function(data) {
							args.userId = data.user.data.id;

							self.usersRender(args);
						});
					}
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
				var newNumber = popup.find('.dropdown-numbers').val(),
					args = {
						openedTab: 'features',
						callback: function() {
							popup.dialog('close').remove();
						}
					};

				if(switchFeature.bootstrapSwitch('status')) {
					self.usersUpdateFaxing(data, newNumber, function(results) {
						args.userId = results.callflow.owner_id;

						self.usersRender(args);
					});
				}
				else {
					self.usersDeleteFaxing(data.callflows.owner_id, function() {
						args.userId = data.callflows.owner_id;

						self.usersRender(args);
					});
				}
			});

			monster.ui.prettyCheck.create(featureTemplate.find('.content'));

			if(data.extra.listNumbers.length > 0) {
				var popup = monster.ui.dialog(featureTemplate, {
					title: data.user.extra.mapFeatures.faxing.title,
					position: ['center', 20]
				});
			}
			else {
				monster.ui.alert('error', self.i18n.active().users.errorNumberFaxing);
			}
		},


		usersRenderHotdesk: function(currentUser) {
			var self = this,
				featureTemplate = $(monster.template(self, 'users-feature-hotdesk', currentUser)),
				switchFeature = featureTemplate.find('.switch').bootstrapSwitch(),
				requirePin = featureTemplate.find('[name="require_pin"]'),
				featureForm = featureTemplate.find('#hotdesk_form');

			monster.ui.validate(featureForm);

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
				if(monster.ui.valid(featureForm)) {
					var formData = form2object('hotdesk_form'),
					args = {
						openedTab: 'features',
						callback: function() {
							popup.dialog('close').remove();
						}
					};

					formData.enabled = switchFeature.bootstrapSwitch('status');
					//formData.id = currentUser.extra.extension;
					if(formData.require_pin === false) { delete formData.pin; }
					delete currentUser.hotdesk;

					userToSave = $.extend(true, {}, currentUser, { hotdesk: formData });

					self.usersUpdateUser(userToSave, function(data) {
						args.userId = data.data.id;

						self.usersRender(args);
					});
				}
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
				switchFeature = featureTemplate.find('.switch').bootstrapSwitch(),
				featureForm = featureTemplate.find('#vm_to_email_form');

			monster.ui.validate(featureForm);

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
				    args = {
						callback: function() {
							popup.dialog('close').remove();
						},
				    	openedTab: 'features'
				    },
				    updateUser = function(user) {
						self.usersUpdateUser(user, function(data) {
							args.userId = data.data.id;

							self.usersRender(args);
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
					if(monster.ui.valid(featureForm)) {
						userToSave.email = formData.email;

						/* Update VMBoxes, then update user and finally close the popup */
						updateVMsDeleteAfterNotify(formData.delete_after_notify, userToSave.id, function() {
							updateUser(userToSave);
						});
					}
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
							internal: {},
							external: {},
						}
					}, currentUser),
					args = {
						openedTab: 'features',
						callback: function() {
							popup.dialog('close').remove();
						}
					};

				if(switchCallerId.bootstrapSwitch('status') === false) {
					if('internal' in userToSave.caller_id) {
						delete userToSave.caller_id.internal.number;
					}
				}
				else {
					var callerIdValue = featureTemplate.find('.caller-id-select').val();
					userToSave.caller_id.internal.number = callerIdValue;
					userToSave.caller_id.external.number = callerIdValue;
				}

				self.usersUpdateUser(userToSave, function(data) {
					args.userId = data.data.id;

					self.usersRender(args);
				});
			});

			if(currentUser.extra.listCallerId.length > 0){
				var popup = monster.ui.dialog(featureTemplate, {
					title: currentUser.extra.mapFeatures.caller_id.title,
					position: ['center', 20]
				});
			}
			else {
				monster.ui.alert('error', self.i18n.active().users.errorCallerId);
			}
		},

		usersRenderCallForward: function(currentUser) {
			var self = this,
				featureTemplate = $(monster.template(self, 'users-feature-call_forward', currentUser)),
				switchFeature = featureTemplate.find('.switch').bootstrapSwitch(),
				featureForm = featureTemplate.find('#call_forward_form'),
				args = {
					callback: function() {
						popup.dialog('close').remove()
					},
					openedTab: 'features'
				};

			monster.ui.validate(featureForm);

			featureTemplate.find('.cancel-link').on('click', function() {
				popup.dialog('close').remove();
			});

			switchFeature.on('switch-change', function(e, data) {
				data.value ? featureTemplate.find('.content').slideDown() : featureTemplate.find('.content').slideUp();
			});

			featureTemplate.find('#phoneType').on('change', function() {
				if ( $(this).val() === 'mobile' ) {
					featureTemplate.find('#number').mask('+1 (999) 999-9999');
				} else if ( $(this).val() === 'deskphone' ) {
					featureTemplate.find('#number').mask('(999) 999-9999');
				}
			});

			featureTemplate.find('.save').on('click', function() {
				if(monster.ui.valid(featureForm)) {
					var formData = form2object('call_forward_form');

					formData.enabled = switchFeature.bootstrapSwitch('status');
					formData.number = monster.util.unformatPhoneNumber(formData.number, 'keepPlus');
					delete formData.phoneType;

					var userToSave = $.extend(true, {}, currentUser, { call_forward: formData});

					self.usersUpdateUser(userToSave, function(data) {
						args.userId = data.data.id;

						self.usersRender(args);
					});
				}
			});

			monster.ui.prettyCheck.create(featureTemplate.find('.content'));

			if ( currentUser.call_forward.number && /^(\+1)/.test(currentUser.call_forward.number) ) {
				featureTemplate.find('#phoneType').val('mobile');
				featureTemplate.find('#number').mask('+1 (999) 999-9999');
			} else {
				featureTemplate.find('#phoneType').val('deskphone');
				featureTemplate.find('#number').mask('(999) 999-9999');
			}

			var popup = monster.ui.dialog(featureTemplate, {
				title: currentUser.extra.mapFeatures.call_forward.title,
				position: ['center', 20]
			});
		},

		usersRenderFindMeFollowMe: function(params) {
			var self = this;

			if(!params.userCallflow) {
				monster.ui.alert('error', self.i18n.active().users.find_me_follow_me.noNumber);
			} else if(!params.userDevices || params.userDevices.length === 0) {
				monster.ui.alert('error', self.i18n.active().users.find_me_follow_me.noDevice);
			} else {
				var currentUser = params.currentUser,
					userDevices = monster.util.sort(params.userDevices, 'name'),
					userCallflow = params.userCallflow,
					featureTemplate = $(monster.template(self, 'users-feature-find_me_follow_me', { currentUser: currentUser, devices: userDevices })),
					switchFeature = featureTemplate.find('.switch').bootstrapSwitch(),
					featureForm = featureTemplate.find('#find_me_follow_me_form'),
					args = {
						callback: function() {
							popup.dialog('close').remove();
						},
						openedTab: 'features'
					},
					scaleSections = 6, //Number of 'sections' in the time scales for the sliders
					scaleMaxSeconds = 60, //Maximum of seconds, corresponding to the end of the scale
					selectedDevices = {};

				if(userCallflow.flow.module === 'ring_group') {
					_.each(userCallflow.flow.data.endpoints, function(val) {
						selectedDevices[val.id] = val;
					});
				}

				featureTemplate.find('.cancel-link').on('click', function() {
					popup.dialog('close').remove();
				});

				switchFeature.on('switch-change', function(e, data) {
					data.value ? featureTemplate.find('.content').slideDown() : featureTemplate.find('.content').slideUp();
				});

				featureTemplate.find('.save').on('click', function() {
					var enabled = switchFeature.bootstrapSwitch('status'),
						enabledDevices = featureTemplate.find('.device-row[data-device_id]:not(.disabled)');

					currentUser.smartpbx = currentUser.smartpbx || {};
					currentUser.smartpbx.find_me_follow_me = currentUser.smartpbx.find_me_follow_me || {};
					currentUser.smartpbx.find_me_follow_me.enabled = (enabled && enabledDevices.length > 0);

					if(enabled && enabledDevices.length > 0) {
						userCallflow.flow.module = 'ring_group';
						userCallflow.flow.data = {
							strategy: "simultaneous",
							timeout: scaleMaxSeconds,
							endpoints: []
						}
						$.each(enabledDevices, function() {
							var $row = $(this),
								deviceId = $row.data('device_id'),
								values = $row.find('.slider-time').slider('values');

							userCallflow.flow.data.endpoints.push({
								id: deviceId,
								endpoint_type: "device",
								delay: values[0],
								timeout: (values[1] - values[0])
							});
						});
					} else {
						userCallflow.flow.module = 'user';
						userCallflow.flow.data = {
							can_call_self: false,
							id: currentUser.id,
							timeout: "20"
						}
					}

					monster.parallel({
							callflow: function(callbackParallel) {
								self.usersUpdateCallflow(userCallflow, function(data) {
									callbackParallel && callbackParallel(null, data.data);
								});
							},
							user: function(callbackParallel) {
								self.usersUpdateUser(currentUser, function(data) {
									callbackParallel && callbackParallel(null, data.data);
								});
							}
						},
						function(err, results) {
							args.userId = results.user.id;
							self.usersRender(args);
						}
					);
				});

				monster.ui.prettyCheck.create(featureTemplate.find('.disable-device'));

				var popup = monster.ui.dialog(featureTemplate, {
					title: currentUser.extra.mapFeatures.find_me_follow_me.title,
					position: ['center', 20]
				});

				var sliderTooltip = function(event, ui) {
						var val = ui.value,
							tooltip = '<div class="slider-tooltip"><div class="slider-tooltip-inner">' + val + '</div></div>';

						$(ui.handle).html(tooltip);
					},
					createTooltip = function(event, ui, deviceId, sliderObj) {
						var val1 = sliderObj.slider('values', 0),
							val2 = sliderObj.slider('values', 1),
							tooltip1 = '<div class="slider-tooltip"><div class="slider-tooltip-inner">' + val1 + '</div></div>',
							tooltip2 = '<div class="slider-tooltip"><div class="slider-tooltip-inner">' + val2 + '</div></div>';

						featureTemplate.find('.device-row[data-device_id="'+ deviceId + '"] .slider-time .ui-slider-handle').first().html(tooltip1);
						featureTemplate.find('.device-row[data-device_id="'+ deviceId + '"] .slider-time .ui-slider-handle').last().html(tooltip2);
					},
					createSlider = function(device) {
						var deviceRow = featureTemplate.find('.device-row[data-device_id="'+ device.id +'"]');
						deviceRow.find('.slider-time').slider({
							range: true,
							min: 0,
							max: scaleMaxSeconds,
							values: device.id in selectedDevices ? [ selectedDevices[device.id].delay, selectedDevices[device.id].delay+selectedDevices[device.id].timeout ] : [0,0],
							slide: sliderTooltip,
							change: sliderTooltip,
							create: function(event, ui) {
								createTooltip(event, ui, device.id, $(this));
							},
						});
						createSliderScale(deviceRow);
					},
					createSliderScale = function(container, isHeader) {
						var scaleContainer = container.find('.scale-container')
							isHeader = isHeader || false;

						for(var i=1; i<=scaleSections; i++) {
							var toAppend = '<div class="scale-element" style="width:'+(100/scaleSections)+'%;">'
										 + (isHeader ? '<span>'+(i*scaleMaxSeconds/scaleSections)+' Sec</span>' : '')
										 + '</div>';
							scaleContainer.append(toAppend);
						}
						if(isHeader) {
							scaleContainer.append('<span>0 Sec</span>');
						}
					};

				featureTemplate.find('.disable-device').on('ifToggled', function() {
					var parentRow = $(this).parents('.device-row');
					if(this.checked) {
						parentRow.find('.times').stop().animate({ opacity: 0 });
						parentRow.addClass('disabled')
					} else {
						parentRow.find('.times').stop().animate({ opacity: 1 });
						parentRow.removeClass('disabled')
					}
				});

				_.each(userDevices, function(device) {
					createSlider(device);
					if(currentUser.extra.mapFeatures.find_me_follow_me.active && !(device.id in selectedDevices)) {
						monster.ui.prettyCheck.action(featureTemplate.find('.device-row[data-device_id="'+device.id+'"] .disable-device'), 'check');
					}
				});
				createSliderScale(featureTemplate.find('.device-row.title'), true);
			}
		},

		usersRenderMusicOnHold: function(currentUser) {
			var self = this,
				silenceMediaId = 'silence_stream://300000';

			self.usersListMedias(function(medias) {
				var templateData = {
						user: currentUser,
						silenceMedia: silenceMediaId,
						mediaList: medias,
						media: 'music_on_hold' in currentUser && 'media_id' in currentUser.music_on_hold ? currentUser.music_on_hold.media_id : silenceMediaId
					},
					featureTemplate = $(monster.template(self, 'users-feature-music_on_hold', templateData)),
					switchFeature = featureTemplate.find('.switch').bootstrapSwitch(),
					popup,
					closeUploadDiv = function(newMedia) {
						var uploadInput = featureTemplate.find('.upload-input');
						uploadInput.wrap('<form>').closest('form').get(0).reset();
						uploadInput.unwrap();
						featureTemplate.find('.upload-div').slideUp(function() {
							featureTemplate.find('.upload-toggle').removeClass('active');
						});
						if(newMedia) {
							var mediaSelect = featureTemplate.find('.media-dropdown');
							mediaSelect.append('<option value="'+newMedia.id+'">'+newMedia.name+'</option>');
							mediaSelect.val(newMedia.id);
						}
					};

				featureTemplate.find('.cancel-link').on('click', function() {
					popup.dialog('close').remove();
				});

				switchFeature.on('switch-change', function(e, data) {
					data.value ? featureTemplate.find('.content').slideDown() : featureTemplate.find('.content').slideUp();
				});

				featureTemplate.find('.upload-toggle').on('click', function() {
					if($(this).hasClass('active')) {
						featureTemplate.find('.upload-div').stop(true, true).slideUp();
					} else {
						featureTemplate.find('.upload-div').stop(true, true).slideDown();
					}
				});

				featureTemplate.find('.upload-cancel').on('click', function() {
					closeUploadDiv();
				});

				featureTemplate.find('.upload-submit').on('click', function() {
					var file = featureTemplate.find('.upload-input')[0].files[0];
						fileReader = new FileReader();

					fileReader.onloadend = function(evt) {
						monster.request({
							resource: 'voip.users.createMedia',
							data: {
								accountId: self.accountId,
								data: {
									streamable: true,
									name: file.name,
									media_source: "upload",
									description: file.name
								}
							},
							success: function(data, status) {
								var media = data.data;
								monster.request({
									resource: 'voip.users.uploadMedia',
									data: {
										accountId: self.accountId,
										mediaId: media.id,
										data: evt.target.result
									},
									success: function(data, status) {
										closeUploadDiv(media);
									},
									error: function(data, status) {
										monster.request({
											resource: 'voip.users.deleteMedia',
											data: {
												accountId: self.accountId,
												mediaId: media.id,
												data: {}
											},
											success: function(data, status) {

											}
										});
									}
								});
							}
						});
					};

					if(file) {
						fileReader.readAsDataURL(file);
					} else {
						monster.ui.alert(self.i18n.active().users.music_on_hold.emptyUploadAlert);
					}
				});

				featureTemplate.find('.save').on('click', function() {
					var selectedMedia = featureTemplate.find('.media-dropdown option:selected').val(),
					    enabled = switchFeature.bootstrapSwitch('status');

					if(!('music_on_hold' in currentUser)) {
						currentUser.music_on_hold = {};
					}

					if('media_id' in currentUser.music_on_hold || enabled) {
						if(enabled) {
							currentUser.music_on_hold = {
								media_id: selectedMedia
							};
						} else {
							currentUser.music_on_hold = {};
						}
						self.usersUpdateUser(currentUser, function(updatedUser) {
							popup.dialog('close').remove();
							self.usersRender({ userId: currentUser.id });
						});
					} else {
						popup.dialog('close').remove();
						self.usersRender({ userId: currentUser.id });
					}
				});

				popup = monster.ui.dialog(featureTemplate, {
					title: currentUser.extra.mapFeatures.music_on_hold.title,
					position: ['center', 20]
				});
			});
		},

		usersCleanUserData: function(userData) {
			var userData = $.extend(true, {}, userData),
				fullName = userData.first_name + ' ' + userData.last_name,
				defaultCallerIdName = fullName.substring(0, 15),
			    defaults = {
			    	caller_id: {
						internal: {
							name: defaultCallerIdName
						},
						external: {
							name: defaultCallerIdName
						}
					}
				};

			userData = $.extend(true, defaults, userData);
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

				if('differentEmail' in userData.extra) {
					userData.email = userData.extra.differentEmail ? userData.extra.email : userData.username;
				}

				if('language' in userData.extra) {
					if(userData.extra.language !== 'auto') {
						userData.language = userData.extra.language;
					}
					else {
						delete userData.language;
					}
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
					},
					vmbox: function(callback) {
						self.usersListVMBoxesUser(userId, function(vmboxes) {
							if(vmboxes.length > 0) {
								self.usersGetVMBox(vmboxes[0].id, function(vmbox) {
									callback(null, vmbox);
								});
							}
							else {
								callback(null, {});
							}
						});
					},
					existingVmboxes: function(callback) {
						self.usersListVMBoxes(function(vmboxes) {
							var listVMBoxes = [];

							_.each(vmboxes, function(vmbox) {
								listVMBoxes.push(vmbox.mailbox);
							});

							callback(null, listVMBoxes);
						});
					}
				},
				function(error, results) {
					var userData = results.user;

					_.each(listUsers.users, function(user) {
						if(user.id === results.user.id) {
							userData = $.extend(true, user, userData);

							return false;
						}
					});

					var dataTemplate = self.usersFormatUserData(userData, results.mainDirectory, results.mainCallflow, results.vmbox, results.existingVmboxes);

					template = $(monster.template(self, 'users-name', dataTemplate));

					monster.ui.validate(template.find('form.user-fields'), {
						rules: {
							'extra.vmboxNumber': {
								checkList: dataTemplate.extra.existingVmboxes
							}
						},
						messages: {
							'first_name': {
								required: self.i18n.active().validation.required
							},
							'last_name': {
								required: self.i18n.active().validation.required
							}
						}
					});

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

						self.usersListCallflows(function(callflows) {
							response.list = callflows;

							var callflowId;

							$.each(callflows, function(k, callflowLoop) {
								/* Find Smart PBX Callflow of this user */
								if(callflowLoop.owner_id === userId && callflowLoop.type !== 'faxing') {
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
					assignedNumbers: [],
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
							if(feature in number.viewFeatures) {
								number.viewFeatures[feature].active = 'active';
							}
						});

						/* Adding to spare numbers */
						if(number.used_by === '') {
							response.countSpare++;
							response.unassignedNumbers[k] = number;
						}
					});
				}

				if(response.callflow) {
					/* If a number is in a callflow and is returned by the phone_numbers, add it to the assigned numbers  */
					_.each(response.callflow.numbers, function(number) {
						if(number in data.numbers.numbers) {
							var numberElement = data.numbers.numbers[number];
							numberElement.phoneNumber = number;

							response.assignedNumbers.push(numberElement);
						}
						else {
							response.extensions.push(number);
						}
					});
				}

				response.assignedNumbers = monster.util.sort(response.assignedNumbers, 'phoneNumber');

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
				defaultTimezone = timezone.getLocaleTimezone(),
				formattedData = {
					user: $.extend(true, {}, {
						caller_id: {
							internal: {
								name: fullName
							},
							external: {
								name: fullName
							}
						},
						email: data.extra.differentEmail ? data.extra.email : data.user.userName,
						priv_level: 'user',
						timezone: defaultTimezone
					}, data.user),
					vmbox: {
						//mailbox: (data.callflow || {}).extension,
						mailbox: data.vmbox.number,
						name: fullName + '\'s VMBox',
						timezone: defaultTimezone
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
							// self.usersDeleteDevice(device.id, function(data) {
							self.usersUnassignDevice(device.id, function(data) {
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

		usersUnassignDevice: function(deviceId, callback) {
			var self = this;

			self.usersGetDevice(deviceId, function(deviceGet) {
				delete deviceGet.owner_id;

				self.usersUpdateDevice(deviceGet, function(updatedDevice) {
					callback && callback(updatedDevice);
				});
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
				user.extra = {
					vmbox: {
						mailbox: listExtensions[0]
					}
				};

				var fullName = user.first_name + ' ' + user.last_name,
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

				self.usersSmartUpdateVMBox(user, false, function(_dataVM) {
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

		usersListCallflows: function(callback) {
			var self = this;

			monster.request({
				resource: 'voip.users.getCallflows',
				data: {
					accountId: self.accountId
				},
				success: function(data) {
					callback(data.data);
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

		usersListVMBoxes: function(callback) {
			var self = this;

			monster.request({
				resource: 'voip.users.listVMBoxes',
				data: {
					accountId: self.accountId
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
				}
			});
		},

		usersGetConferenceFeature: function(userId, globalCallback) {
			var self = this,
				dataResponse = {
					conference: {},
					listConfNumbers: []
				};

			monster.parallel({
					confNumbers: function(callback) {
						self.usersListConfNumbers(function(numbers) {
							callback && callback(null, numbers);
						});
					},
					listConferences: function(callback) {
						self.usersListConferences(userId, function(conferences) {
							if(conferences.length > 0) {
								self.usersGetConference(conferences[0].id, function(conference) {
									callback && callback(null, conference);
								});
							}
							else {
								callback && callback(null, {});
							}
						});
					}
				},
				function(err, results) {
					dataResponse.conference = results.listConferences;
					dataResponse.listConfNumbers = results.confNumbers;

					globalCallback && globalCallback(dataResponse);
				}
			);
		},

		usersListConfNumbers: function(callback) {
			var self = this;

			monster.request({
				resource: 'voip.users.listConfNumbers',
				data: {
					accountId: self.accountId
				},
				success: function(data) {
					var numbers = [];

					_.each(data.data, function(conf) {
						if(conf.name === 'MainConference') {
							if(conf.numbers.length > 0 && conf.numbers[0] !== 'undefinedconf') {
								numbers = numbers.concat(conf.numbers);
							}
						}
					});

					callback && callback(numbers);
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

		usersListMedias: function(callback) {
			var self = this;

			monster.request({
				resource: 'voip.users.listMedia',
				data: {
					accountId: self.accountId
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
						self.usersListCallflows(function(callflows) {
							callback(null, callflows);
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
			var self = this,
				updateDevices = function(userCallflow) {
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

					if(data.old.length > 0 && userCallflow && userCallflow.flow.module === 'ring_group') {
						var endpointsCount = userCallflow.flow.data.endpoints.length;
						userCallflow.flow.data.endpoints =_.filter(userCallflow.flow.data.endpoints, function(endpoint) {
							return (data.old.indexOf(endpoint.id) < 0);
						});
						if(userCallflow.flow.data.endpoints.length < endpointsCount) {
							if(userCallflow.flow.data.endpoints.length === 0) {
								userCallflow.flow.module = 'user';
								userCallflow.flow.data = {
									can_call_self: false,
									id: userId,
									timeout: "20"
								}
								listFnParallel.push(function(callback) {
									self.usersGetUser(userId, function(user) {
										user.smartpbx.find_me_follow_me.enabled = false;
										self.usersUpdateUser(user, function(data) {
											callback(null, data)
										});
									});
								});
							}
							listFnParallel.push(function(callback) {
								self.usersUpdateCallflow(userCallflow, function(data) {
									callback(null, data);
								});
							});
						}
					}

					monster.parallel(listFnParallel, function(err, results) {
						callbackAfterUpdate && callbackAfterUpdate(results);
					});
				};

			self.usersListCallflowsUser(userId, function(data) {
				if(data.length > 0) {
					monster.request({
						resource: 'voip.users.getCallflow',
						data: {
							accountId: self.accountId,
							callflowId: data[0].id
						},
						success: function(callflow) {
							updateDevices(callflow.data);
						}
					});
				} else {
					updateDevices(null);
				}
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

		/* If user has a vmbox, then only update it if it comes from the user form.
		If the check comes from the extension page, where we create a callflow,
		then only update the vmbox if there are no vmbox attached to this user */
		usersSmartUpdateVMBox: function(user, needVMUpdate, callback) {
			var self = this;

			self.usersListVMBoxesUser(user.id, function(vmboxes) {
				if(vmboxes.length > 0) {
					if(needVMUpdate) {
						self.usersGetVMBox(vmboxes[0].id, function(vmbox) {
							vmbox = $.extend(true, {}, vmbox, user.extra.vmbox);
							vmbox.name = user.first_name + ' ' + user.last_name + '\'s VMBox';

							self.usersUpdateVMBox(vmbox, function(vmbox) {
								callback && callback(vmbox);
							});
						});
					}
					else {
						callback && callback(vmboxes[0]);
					}
				}
				else {
					var vmbox = {
						owner_id: user.id,
						mailbox: user.extra.vmbox.mailbox,
						name: user.first_name + ' ' + user.last_name + '\'s VMBox',
						timezone: user.timezone
					};

					self.usersCreateVMBox(vmbox, function(vmbox) {
						callback && callback(vmbox);
					});
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
		},

		usersRemoveOverlay: function() {
			$('body').find('#users_container_overlay').remove();
		}
	};

	return app;
});
