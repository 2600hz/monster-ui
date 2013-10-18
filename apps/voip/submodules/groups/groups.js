define(function(require){
	var $ = require('jquery'),
		_ = require('underscore'),
		monster = require('monster'),
		timezone = require('monster-timezone'),
		toastr = require('toastr');

	var app = {

		requests: {
			/* Groups */
			'voip.groups.listGroups': {
				url: 'accounts/{accountId}/groups',
				verb: 'GET'
			},
			'voip.groups.getGroup': {
				url: 'accounts/{accountId}/groups/{groupId}',
				verb: 'GET'
			},
			'voip.groups.createGroup': {
				url: 'accounts/{accountId}/groups',
				verb: 'PUT'
			},
			'voip.groups.updateGroup': {
				url: 'accounts/{accountId}/groups/{groupId}',
				verb: 'POST'
			},
			'voip.groups.deleteGroup': {
				url: 'accounts/{accountId}/groups/{groupId}',
				verb: 'DELETE'
			},
			/* Users */
			'voip.groups.listUsers': {
				url: 'accounts/{accountId}/users',
				verb: 'GET'
			},
			/* Callflows */
			'voip.groups.listRingGroups': {
				url: 'accounts/{accountId}/callflows?has_key=group_id',
				verb: 'GET'
			},
			'voip.groups.getCallflows': {
				url: 'accounts/{accountId}/callflows/',
				verb: 'GET'
			},
			'voip.groups.createCallflow': {
				url: 'accounts/{accountId}/callflows',
				verb: 'PUT'
			},
			'voip.groups.listGroupCallflows': {
				url: 'accounts/{accountId}/callflows?filter_group_id={groupId}',
				verb: 'GET'
			},
			'voip.groups.getCallflow': {
				url: 'accounts/{accountId}/callflows/{callflowId}',
				verb: 'GET'
			},
			'voip.groups.updateCallflow': {
				url: 'accounts/{accountId}/callflows/{callflowId}',
				verb: 'POST'
			},
			'voip.groups.deleteCallflow': {
				url: 'accounts/{accountId}/callflows/{callflowId}',
				verb: 'DELETE'
			},
			/* Misc */
			'voip.groups.getNumbers': {
				url: 'accounts/{accountId}/phone_numbers/',
				verb: 'GET'
			}
		},

		subscribe: {
			'voip.groups.render': 'groupsRender'
		},

		/* Users */
		/* args: parent and groupId */
		groupsRender: function(args) {
			var self = this,
				args = args || {},
				parent = args.parent || $('.right-content'),
				_groupId = args.groupId;

			self.groupsGetData(function(data) {
				var dataTemplate = self.groupsFormatListData(data),
				    template = $(monster.template(self, 'groups-layout', dataTemplate)),
					templateGroup;

				_.each(dataTemplate.groups, function(group) {
					templateGroup = monster.template(self, 'groups-row', group);

					template.find('.groups-rows').append(templateGroup);
				});

				self.groupsBindEvents(template, parent);

				parent
					.empty()
					.append(template);

				if(_groupId) {
					parent.find('.grid-row[data-id=' + _groupId + ']')
						.css('background-color', '#22CCFF')
						.animate({
							backgroundColor: '#fcfcfc'
						}, 2000
					);
				}
			});
		},

		groupsFormatListData: function(data) {
			var self = this,
				mapGroups = {};

			_.each(data.groups, function(group) {
				mapGroups[group.id] = group;
				mapGroups[group.id].extra = {};
			});

			_.each(data.callflows, function(callflow) {
				if(callflow.group_id in mapGroups) {
					var listExtensions = [],
						listNumbers = [];

					_.each(callflow.numbers, function(number) {
						number.length < 6 ? listExtensions.push(number) : listNumbers.push(number);
					});

					if(listExtensions.length > 0) {
						mapGroups[callflow.group_id].extra.extension = listExtensions[0];
					}
					mapGroups[callflow.group_id].extra.additionalExtensions = listExtensions.length > 1;

					if(listNumbers.length > 0) {
						mapGroups[callflow.group_id].extra.mainNumber = listNumbers[0];
					}
					mapGroups[callflow.group_id].extra.additionalNumbers = listNumbers.length > 1;
				}
			});

			data.groups = mapGroups;

			return data;
		},

		groupsBindEvents: function(template, parent) {
			var self = this;

			template.find('.grid-row:not(.title) .grid-cell').on('click', function() {
				var cell = $(this),
					type = cell.data('type'),
					row = cell.parents('.grid-row'),
					groupId = row.data('id');

				template.find('.edit-groups').empty().hide();

				if(cell.hasClass('active')) {
					template.find('.grid-cell').removeClass('active');
				}
				else {
					template.find('.grid-cell').removeClass('active');
					cell.toggleClass('active');

					self.groupsGetTemplate(type, groupId, function(template, data) {
						if(type === 'name') {
						}
						else if(type === 'numbers') {
						}
						else if(type === 'extensions') {
						}
						else if(type === 'features') {
						}

						//FancyCheckboxes.
						monster.ui.prettyCheck.create(template);

						row.find('.edit-groups').append(template).show();
					});
				}
			});

			template.find('.groups-header .search-query').on('keyup', function() {
				var searchString = $(this).val().toLowerCase(),
					rows = template.find('.groups-rows .grid-row:not(.title)'),
					emptySearch = template.find('.groups-rows .empty-search-row');

				_.each(rows, function(row) {
					var row = $(row);

					row.data('search').toLowerCase().indexOf(searchString) < 0 ? row.hide() : row.show();
				});

				if(rows.size() > 0) {
					rows.is(':visible') ? emptySearch.hide() : emptySearch.show();
				}
			});

			template.on('click', '.cancel-link', function() {
				template.find('.edit-groups').hide().empty();

				template.find('.grid-cell.active').removeClass('active');
			});

			template.find('.groups-header .add-group').on('click', function() {
				self.groupsGetCreationData(function(data) {
				     var groupTemplate = $(monster.template(self, 'groups-creation', data));

					groupTemplate.find('#create_group').on('click', function() {
						var formattedData = self.groupsCreationMergeData(data, groupTemplate);

						self.groupsCreate(formattedData, function(data) {
							popup.dialog('close').remove();

							self.groupsRender({ groupId: data.id });
						});
					});

					groupTemplate.find('#group_user_selector .selected-users, #group_user_selector .available-users').sortable({
			  			connectWith: '.connectedSortable'
					}).disableSelection();

					var popup = monster.ui.dialog(groupTemplate, {
						title: self.i18n.active().groups.dialogCreationGroup.title
					});
				});
			});
		},

		groupsCreationMergeData: function(data, template) {
			var formData = form2object('form_group_creation'),
				fixedTimeout = '20',
				fixedDelay = '0',
				settings = {
					timeout: fixedTimeout,
					delay: fixedDelay,
					endpoint_type: 'user'
				},
				listUserRingGroup = [],
				listUserGroup = {};

			template.find('.selected-users li').each(function() {
				var userId = $(this).data('user_id'),
					ringGroupUser = $.extend(true, {}, settings, { id: userId });

				listUserGroup[userId] = { type: 'user' };
				listUserRingGroup.push(ringGroupUser);
			});

			var formattedData = {
				group: {
					name: formData.name,
					endpoints: listUserGroup
				},
				callflow: {
					numbers: [ formData.extra.extension ],
					flow: {
						name: formData.name + ' Ring Group',
						module: 'ring_group',
						children: {},
						data: {
							name: formData.name + ' Ring Group',
							strategy: 'simultaneous',
							timeout: parseInt(fixedTimeout) + parseInt(fixedDelay),
							endpoints: listUserRingGroup
						}
					}
				}
			};

			return formattedData;
		},

		groupsGetTemplate: function(type, groupId, callbackAfterData) {
			var self = this,
				template;

			if(type === 'name') {
				self.groupsGetNameTemplate(groupId, callbackAfterData);
			}
			else if(type === 'numbers') {
			}
			else if(type === 'extensions') {
				self.groupsGetExtensionsTemplate(groupId, callbackAfterData);
			}
			else if(type === 'features') {
			}
			else if(type === 'members') {
				self.groupsGetMembersTemplate(groupId, callbackAfterData);
			}
		},

		groupsGetNameTemplate: function(groupId, callback) {
			var self = this;

			self.groupsGetNameData(groupId, function(data) {
				template = $(monster.template(self, 'groups-name', data));

				self.groupsBindName(template, data);

				callback && callback(template, data);
			});
		},

		groupsGetExtensionsTemplate: function(groupId, callback) {
			var self = this;

			self.groupsGetExtensionsData(groupId, function(data) {
				var data = self.groupsFormatExtensionsData(data);

				template = $(monster.template(self, 'groups-extensions', data));

				self.groupsBindExtensions(template, data);

				callback && callback(template, results);
			});
		},

		groupsGetMembersTemplate: function(groupId, callback) {
			var self = this;

			self.groupsGetMembersData(groupId, function(results) {
				var results = self.groupsFormatMembersData(results);

				template = $(monster.template(self, 'groups-members', results));

				self.groupsBindMembers(template, results);

				callback && callback(template, results);
			});
		},

		groupsBindName: function(template, data) {
			var self = this;

			template.find('.save-group').on('click', function() {
				var formData = form2object('form-name');

				//formData = self.groupsCleanNameData(formData);

				data = $.extend(true, {}, data, formData);

				self.groupsUpdate(data, function(data) {
					self.groupsRender({ groupId: data.id });
				});
			});

			template.find('.delete-group').on('click', function() {
				self.groupsDelete(data.id, function(data) {
					toastr.success(monster.template(self, '!' + self.i18n.active().groups.groupDeleted, { name: data.group.name }));

					self.groupsRender();
				});
			});
		},

		groupsBindExtensions: function(template, data) {
			var self = this;
			/*template.on('click', '.save-extensions', function() {
				var numbers = $.extend(true, [], numbersToSave),
					name = $(this).parents('.grid-row').find('.grid-cell.name').text();

				template.find('.extensions .list-assigned-items .item-row').each(function(k, row) {
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
			});*/
		},

		groupsBindMembers: function(template, data) {
			var self = this;

			template.find('.save-groups').on('click', function() {
				var endpoints = [],
					groupId = data.id;

				_.each(template.find('.group-row:not(.title)'), function(row) {
					var $row = $(row),
						userId = $row.data('user_id'),
						values = $row.find('.slider-time').slider('values'),
						user = {
							delay: values[0] + '',
							timeout: (values[1] - values[0])+ '',
							id: userId,
							endpoint_type: 'user'
						};


					endpoints.push(user);
				});

				self.groupsUpdateRingGroup(groupId, endpoints, function(data) {
					self.groupsRender({ groupId: groupId });
				});
			});

			template.on('click', '.remove-user', function() {
				$(this).parents('.group-row').remove();
			});

			var sliderTooltip = function(event, ui) {
				var val = ui.value,
					tooltip = '<div class="slider-tooltip"><div class="slider-tooltip-inner">' + val + '</div></div>';

				$(ui.handle).html(tooltip);
			};

			var createTooltip = function(event, ui, userId, sliderObj) {
				var val1 = sliderObj.slider('values', 0),
					val2 = sliderObj.slider('values', 1),
					tooltip1 = '<div class="slider-tooltip"><div class="slider-tooltip-inner">' + val1 + '</div></div>',
					tooltip2 = '<div class="slider-tooltip"><div class="slider-tooltip-inner">' + val2 + '</div></div>';

				template.find('.group-row[data-user_id="'+ userId + '"] .slider-time .ui-slider-handle').first().html(tooltip1);
				template.find('.group-row[data-user_id="'+ userId + '"] .slider-time .ui-slider-handle').last().html(tooltip2);
			};

			_.each(data.extra.ringGroup, function(endpoint) {
				template.find('.group-row[data-user_id="'+ endpoint.id +'"] .slider-time').slider({
					range: true,
					min: 0,
					max: 60,
					values: [ endpoint.delay, endpoint.delay+endpoint.timeout ],
					slide: sliderTooltip,
					change: sliderTooltip,
					create: function(event, ui) {
						createTooltip(event, ui, endpoint.id, $(this));
					},
				});
			});
		},

		groupsGetCreationData: function(callback) {
			var self = this;

			self.groupsListUsers(function(dataUsers) {
				dataUsers.sort(function(a, b) {
					return a.last_name > b.last_name;
				});

				var dataTemplate = {
					extra: {
						listUsers: dataUsers
					}
				};

				callback && callback(dataTemplate);
			});
		},

		groupsListUsers: function(callback) {
			var self = this;

			monster.request({
				resource: 'voip.groups.listUsers',
				data: {
					accountId: self.accountId
				},
				success: function(data) {
					callback && callback(data.data);
				}
			});
		},

		groupsGetNameData: function(groupId, callback) {
			var self = this;

			self.groupsGetGroup(groupId, function(data) {
				callback && callback(data);
			});
		},

		groupsGetMembersData: function(groupId, globalCallback) {
			var self = this;

			monster.parallel({
					users: function(callback) {
						monster.request({
							resource: 'voip.groups.listUsers',
							data: {
								accountId: self.accountId
							},
							success: function(data) {
								callback(null, data.data);
							}
						});
					},
					group: function(callback) {
						self.groupsGetGroup(groupId, function(data) {
							callback(null, data);
						});

					},
					callflow: function(callback) {
						self.groupsGetRingGroup(groupId, function(data) {
							callback(null, data);
						});

					}
				},
				function(err, results) {
					globalCallback && globalCallback(results);
				}
			);

		},

		groupsFormatMembersData: function(data) {
			var self = this,
				mapUsers = {};

			_.each(data.users, function(user) {
				mapUsers[user.id] = user;
			});

			var endpoints = data.callflow.flow.data.endpoints;

			_.each(endpoints, function(endpoint) {
				user = mapUsers[endpoint.id];

				endpoint.delay = parseInt(endpoint.delay);
				endpoint.timeout = parseInt(endpoint.timeout);

				endpoint.name = endpoint.id in mapUsers ? user.first_name + ' ' + user.last_name : 'Not a user';
			});

			data.group.extra = {
				ringGroup: endpoints
			};

			return data.group;
		},

		groupsCreate: function(data, callback) {
			var self = this;

			monster.request({
				resource: 'voip.groups.createGroup',
				data: {
					accountId: self.accountId,
					data: data.group
				},
				success: function(dataGroup) {
					data.callflow.group_id = dataGroup.data.id;

					monster.request({
						resource: 'voip.groups.createCallflow',
						data: {
							accountId: self.accountId,
							data: data.callflow
						},
						success: function(data) {
							callback && callback(dataGroup.data);
						}
					});
				}
			});
		},

		groupsGetRingGroup: function(groupId, callback, callbackError) {
			var self = this;

			monster.request({
				resource: 'voip.groups.listGroupCallflows',
				data: {
					groupId: groupId,
					accountId: self.accountId
				},
				success: function(data) {
					if(data.data.length > 0) {
						monster.request({
							resource: 'voip.groups.getCallflow',
							data: {
								accountId: self.accountId,
								callflowId: data.data[0].id
							},
							success: function(data) {
								callback && callback(data.data);
							}
						});
					}
					else {
						callbackError && callbackError(data);

						toastr.error(self.i18n.active().groups.ringGroupMissing);
					}
				},
				error: function(data) {
					callbackError && callbackError(data);
				}
			});
		},

		groupsComputeTimeout: function(endpoints) {
			var globalTimeout = 0;

			_.each(endpoints, function(endpoint) {
				var delay = parseInt(endpoint.delay),
					timeout = parseInt(endpoint.timeout),
					total = delay + timeout;

				if(total > globalTimeout) {
					globalTimeout = total;
				}
			});

			return globalTimeout;
		},

		groupsUpdateRingGroup: function(groupId, endpoints, callback) {
			var self = this;

			monster.parallel({
					group: function(callback) {
						self.groupsGetGroup(groupId, function(data) {
							var areDifferent = false;

							_.each(endpoints, function(endpoint) {
								if(endpoint.id in data.endpoints) {
									delete data.endpoints[endpoint.id];
								}
								else {
									areDifferent = true;
									return false;
								}
							});

							if(!_.isEmpty(data.endpoints)) {
								areDifferent = true;
							}

							if(areDifferent) {
								data.endpoints = {};

								_.each(endpoints, function(v) {
									data.endpoints[v.id] = { type: 'user' };
								});

								self.groupsUpdate(data, function(data) {
									callback && callback(null, data);
								});
							}
							else {
								callback && callback(null, data);
							}
						});
					},
					callflow: function(callback) {
						self.groupsGetRingGroup(groupId, function(ringGroup) {
							ringGroup.flow.data.endpoints = endpoints;

							ringGroup.flow.data.timeout = self.groupsComputeTimeout(endpoints);

							self.groupsUpdateCallflow(ringGroup, function(data) {
								callback && callback(null, data);
							});
						});
					},
				},
				function(error, results) {
					callback && callback(results);
				}
			);
		},

		groupsUpdate: function(data, callback) {
			var self = this;

			monster.request({
				resource: 'voip.groups.updateGroup',
				data: {
					accountId: self.accountId,
					groupId: data.id,
					data: data
				},
				success: function(data) {
					callback && callback(data.data);
				}
			});
		},

		groupsUpdateCallflow: function(callflow, callback) {
			var self = this;

			monster.request({
				resource: 'voip.groups.updateCallflow',
				data: {
					accountId: self.accountId,
					callflowId: callflow.id,
					data: callflow
				},
				success: function(data) {
					callback && callback(data.data);
				}
			});
		},

		groupsGetGroup: function(groupId, callback) {
			var self = this;

			monster.request({
				resource: 'voip.groups.getGroup',
				data: {
					groupId: groupId,
					accountId: self.accountId
				},
				success: function(data) {
					callback && callback(data.data);
				}
			});
		},

		groupsDelete: function(groupId, callback) {
			var self = this;

			monster.parallel({
					group: function(callback) {
						monster.request({
							resource: 'voip.groups.deleteGroup',
							data: {
								accountId: self.accountId,
								groupId: groupId,
								data: {}
							},
							success: function(data) {
								callback && callback(null, data.data);
							}
						});
					},
					callflow: function(callback) {
						self.groupsGetRingGroup(groupId, function(data) {
							monster.request({
								resource: 'voip.groups.deleteCallflow',
								data: {
									accountId: self.accountId,
									callflowId: data.id,
									data: {}
								},
								success: function(data) {
									callback && callback(null, data);
								}
							});
						},
						function(data) {
							callback && callback(null, data);
						});
					}
				},
				function(err, results) {
					callback && callback(results);
				}
			);
		},

		groupsGetData: function(callback) {
			var self = this;

			monster.parallel({
					groups: function(callback) {
						monster.request({
							resource: 'voip.groups.listGroups',
							data: {
								accountId: self.accountId
							},
							success: function(dataGroups) {
								callback(null, dataGroups.data);
							}
						});
					},
					callflows: function(callback) {
						monster.request({
							resource: 'voip.groups.listRingGroups',
							data: {
								accountId: self.accountId
							},
							success: function(dataCallflows) {
								callback(null, dataCallflows.data);
							}
						});
					}
				},
				function(err, results) {
					callback && callback(results);
				}
			);
		}
	};

	return app;
});
