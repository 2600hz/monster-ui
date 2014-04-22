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
			'voip.groups.listUserCallflows': {
				url: 'accounts/{accountId}/callflows?has_key=owner_id&key_missing=type',
				verb: 'GET'
			},
			'voip.groups.listMainCallflows': {
				url: 'accounts/{accountId}/callflows?filter_type=main',
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
			},
			'voip.groups.listMedia': {
				url: 'accounts/{accountId}/media?key_missing=type',
				verb: 'GET'
			},
			'voip.groups.createMedia': {
				url: 'accounts/{accountId}/media',
				verb: 'PUT'
			},
			'voip.groups.deleteMedia': {
				url: 'accounts/{accountId}/media/{mediaId}',
				verb: 'DELETE'
			},
            'voip.groups.uploadMedia': {
                url: 'accounts/{accountId}/media/{mediaId}/raw',
                verb: 'POST',
                type: 'application/x-base64'
            },
			'voip.groups.listVMBoxes': {
				url: 'accounts/{accountId}/vmboxes',
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
				_groupId = args.groupId,
				noGroup = true;

			self.groupsRemoveOverlay();

			self.groupsGetData(function(data) {
				var dataTemplate = self.groupsFormatListData(data),
				    template = $(monster.template(self, 'groups-layout', { countGroups: Object.keys(dataTemplate.groups).length })),
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
					var cells =  parent.find('.grid-row[data-id=' + _groupId + '] .grid-cell');

					monster.ui.fade(cells);
				}

				for (var group in dataTemplate.groups) {
					noGroup = ( typeof dataTemplate.groups[group] === 'undefined' ) ? true : false;
				}

				if ( noGroup ) {
					parent.find('.grid-row.title').css('display', 'none');
					parent.find('.no-groups-row').css('display', 'block');
				} else {
					parent.find('.grid-row.title').css('display', 'block');
					parent.find('.no-groups-row').css('display', 'none');
				}
			});
		},

		groupsFormatListData: function(data) {
			var self = this,
				mapGroups = {};

			_.each(data.groups, function(group) {
				mapGroups[group.id] = group;

				mapGroups[group.id].extra = self.groupsGetGroupFeatures(group);
			});

			_.each(data.callflows, function(callflow) {
				if(callflow.group_id in mapGroups) {
					var listExtensions = [],
						listNumbers = [];

					_.each(callflow.numbers, function(number) {
						number.length < 7 ? listExtensions.push(number) : listNumbers.push(number);
					});

					mapGroups[callflow.group_id].extra.listCallerId = [];

					if(listExtensions.length > 0) {
						mapGroups[callflow.group_id].extra.extension = listExtensions[0];

						_.each(listExtensions, function(number) {
							mapGroups[callflow.group_id].extra.listCallerId.push(number);
						});
					}
					mapGroups[callflow.group_id].extra.additionalExtensions = listExtensions.length > 1;

					if(listNumbers.length > 0) {
						mapGroups[callflow.group_id].extra.mainNumber = listNumbers[0];

						_.each(listNumbers, function(number) {
							mapGroups[callflow.group_id].extra.listCallerId.push(number);
						});
					}
					mapGroups[callflow.group_id].extra.additionalNumbers = listNumbers.length > 1;
					mapGroups[callflow.group_id].extra.callflowId = callflow.id;
				}
			});

			data.groups = mapGroups;

			return data;
		},

		groupsGetGroupFeatures: function(group) {
			var self = this,
				result = {
					mapFeatures: {
						call_recording: {
							icon: 'icon-microphone',
							iconColor: 'icon-blue',
							title: self.i18n.active().groups.callRecording.title
						},
						music_on_hold: {
							icon: 'icon-music',
							iconColor: 'icon-yellow',
							title: self.i18n.active().groups.musicOnHold.title
						}
					},
					hasFeatures: false
				};

			_.each(result.mapFeatures, function(val, key) {
				if(('features' in group && group.features.indexOf(key) >= 0) // If data from view
				|| ('smartpbx' in group && key in group.smartpbx && group.smartpbx[key].enabled) // If data from document
				|| (key === 'music_on_hold' && key in group && 'media_id' in group[key])){ // special case for music_on_hold since it's an old feature
					val.active = true;
					result.hasFeatures = true;
				}
			});

			return result;
		},

		groupsBindEvents: function(template, parent) {
			var self = this;

			template.find('.grid-row:not(.title) .grid-cell').on('click', function() {
				var cell = $(this),
					type = cell.data('type'),
					row = cell.parents('.grid-row'),
					groupId = row.data('id');

				template.find('.edit-groups').slideUp("400", function() {
					$(this).empty();
				});

				if(cell.hasClass('active')) {
					template.find('.grid-cell').removeClass('active');
					template.find('.grid-row').removeClass('active');

					self.groupsRemoveOverlay();
					cell.css({
						'position': 'inline-block',
						'z-index': '0'
					});

					cell.parent().siblings('.edit-groups').css({
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

					cell.parent().siblings('.edit-groups').css({
						'position': 'relative',
						'z-index': '2'
					});

					self.groupsGetTemplate(type, groupId, function(template, data) {
						//FancyCheckboxes.
						monster.ui.prettyCheck.create(template);

						row.find('.edit-groups').append(template).slideDown();

						$('body').append($('<div id="groups_container_overlay"></div>'));
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
				template.find('.edit-groups').slideUp("400", function() {
					$(this).empty();
					template.find('.grid-cell.active').css({
						'position': 'inline-block',
						'z-index': '0'
					});
					template.find('.grid-row.active .edit-groups').css({
						'position': 'block',
						'z-index': '0'
					});
					template.find('.grid-row.active').removeClass('active');
					self.groupsRemoveOverlay();

					template.find('.grid-cell.active').removeClass('active');
				});
			});

			template.find('.groups-header .add-group').on('click', function() {
				self.groupsGetCreationData(function(data) {
					var groupTemplate = $(monster.template(self, 'groups-creation', data)),
						groupForm = groupTemplate.find('#form_group_creation');

					monster.ui.validate(groupForm);

					groupTemplate.find('#create_group').on('click', function() {
						var formattedData = self.groupsCreationMergeData(data, groupTemplate);
						// if(formattedData.group.name && formattedData.callflow.numbers[0]) {
						if(monster.ui.valid(groupForm)) {
							self.groupsCreate(formattedData, function(data) {
								popup.dialog('close').remove();

								self.groupsRender({ groupId: data.id });
							});
						}/* else {
							monster.ui.alert('error', self.i18n.active().groups.dialogCreationGroup.missingDataAlert)
						}*/
					});

					groupTemplate.find('#group_user_selector .selected-users, #group_user_selector .available-users').sortable({
			  			connectWith: '.connectedSortable'
					}).disableSelection();

					var popup = monster.ui.dialog(groupTemplate, {
						title: self.i18n.active().groups.dialogCreationGroup.title
					});
				});
			});

			$('body').on('click', '#groups_container_overlay', function() {
				template.find('.edit-groups').slideUp("400", function() {
					$(this).empty();
				});

				self.groupsRemoveOverlay();

				template.find('.grid-cell.active').css({
					'position': 'inline-block',
					'z-index': '0'
				});

				template.find('.grid-row.active').parent().siblings('.edit-groups').css({
					'position': 'block',
					'z-index': '0'
				});

				template.find('.grid-cell.active').removeClass('active');
				template.find('.grid-row.active').removeClass('active');
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
					name: formData.name + ' Ring Group',
					flow: {
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
				self.groupsGetNumbersTemplate(groupId, callbackAfterData);
			}
			else if(type === 'extensions') {
				self.groupsGetExtensionsTemplate(groupId, callbackAfterData);
			}
			else if(type === 'features') {
				self.groupsGetFeaturesTemplate(groupId, callbackAfterData);
			}
			else if(type === 'members') {
				self.groupsGetMembersTemplate(groupId, callbackAfterData);
			}
		},

		groupsGetFeaturesTemplate: function(groupId, callback) {
			var self = this;

			self.groupsGetFeaturesData(groupId, function(data) {
				template = $(monster.template(self, 'groups-features', data.group));

				self.groupsBindFeatures(template, data);

				callback && callback(template, data);
			});
		},

		groupsGetNameTemplate: function(groupId, callback) {
			var self = this;

			self.groupsGetNameData(groupId, function(data) {
				template = $(monster.template(self, 'groups-name', data));

				self.groupsBindName(template, data);

				callback && callback(template, data);
			});
		},

		groupsGetNumbersTemplate: function(groupId, callback) {
			var self = this;

			self.groupsGetNumbersData(groupId, function(data) {
				self.groupsFormatNumbersData(data, function(data) {
					template = $(monster.template(self, 'groups-numbers', data));

					self.groupsBindNumbers(template, data);

					callback && callback(template, data);
				});
			});
		},

		groupsGetExtensionsTemplate: function(groupId, callback) {
			var self = this;

			self.groupsGetNumbersData(groupId, function(data) {
				self.groupsFormatNumbersData(data, function(data) {
					template = $(monster.template(self, 'groups-extensions', data));

					self.groupsBindExtensions(template, data);

					callback && callback(template, data);
				});
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

		groupsBindFeatures: function(template, data) {
			var self = this;

			template.find('.feature[data-feature="call_recording"]').on('click', function() {
				self.groupsRenderCallRecording(data);
			});

			template.find('.feature[data-feature="music_on_hold"]').on('click', function() {
				self.groupsRenderMusicOnHold(data);
			});
		},

		groupsRenderCallRecording: function(data) {
			var self = this,
				templateData = $.extend(true, {
												group: data.group
											},
											(data.group.extra.mapFeatures.call_recording.active ? {
												url: data.callflow.flow.data.url,
												format: data.callflow.flow.data.format,
												timeLimit: data.callflow.flow.data.time_limit
											} : {})
										),
				featureTemplate = $(monster.template(self, 'groups-feature-call_recording', templateData)),
				switchFeature = featureTemplate.find('.switch').bootstrapSwitch(),
				featureForm = featureTemplate.find('#call_recording_form'),
				popup;

			monster.ui.validate(featureForm, {
				rules: {
					'time_limit': {
						digits: true
					}
				}
			});

			featureTemplate.find('.cancel-link').on('click', function() {
				popup.dialog('close').remove();
			});

			switchFeature.on('switch-change', function(e, data) {
				data.value ? featureTemplate.find('.content').slideDown() : featureTemplate.find('.content').slideUp();
			});

			featureTemplate.find('.save').on('click', function() {
				if(monster.ui.valid(featureForm)) {
					var formData = form2object('call_recording_form'),
						enabled = switchFeature.bootstrapSwitch('status');

					if(!('smartpbx' in data.group)) { data.group.smartpbx = {}; }
					if(!('call_recording' in data.group.smartpbx)) {
						data.group.smartpbx.call_recording = {
							enabled: false
						};
					}

					if(data.group.smartpbx.call_recording.enabled || enabled) {
						data.group.smartpbx.call_recording.enabled = enabled;
						var newCallflow = $.extend(true, {}, data.callflow);
						if(enabled) {
							if(newCallflow.flow.module === 'record_call') {
								newCallflow.flow.data = $.extend(true, { action: "start" }, formData);
							} else {
								newCallflow.flow = {
									children: {
										"_": $.extend(true, {}, data.callflow.flow)
									},
									module: "record_call",
									data: $.extend(true, { action: "start" }, formData)
								}
							}
						} else {
							newCallflow.flow = $.extend(true, {}, data.callflow.flow.children["_"]);
						}
						self.groupsUpdateCallflow(newCallflow, function(updatedCallflow) {
							self.groupsUpdate(data.group, function(updatedGroup) {
								popup.dialog('close').remove();
								self.groupsRender({ groupId: data.group.id });
							});
						});
					} else {
						popup.dialog('close').remove();
						self.groupsRender({ groupId: data.group.id });
					}
				}
			});

			popup = monster.ui.dialog(featureTemplate, {
				title: data.group.extra.mapFeatures.call_recording.title,
				position: ['center', 20]
			});
		},

		groupsRenderMusicOnHold: function(data) {
			var self = this,
				silenceMediaId = 'silence_stream://300000';

			self.groupsListMedias(function(medias) {
				var templateData = {
						group: data.group,
						silenceMedia: silenceMediaId,
						mediaList: medias,
						media: 'music_on_hold' in data.group && 'media_id' in data.group.music_on_hold ? data.group.music_on_hold.media_id : silenceMediaId
					},
					featureTemplate = $(monster.template(self, 'groups-feature-music_on_hold', templateData)),
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
							resource: 'voip.groups.createMedia',
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
									resource: 'voip.groups.uploadMedia',
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
											resource: 'voip.groups.deleteMedia',
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
						monster.ui.alert(self.i18n.active().groups.musicOnHold.emptyUploadAlert);
					}
				});

				featureTemplate.find('.save').on('click', function() {
					var selectedMedia = featureTemplate.find('.media-dropdown option:selected').val(),
					    enabled = switchFeature.bootstrapSwitch('status');

					if(!('music_on_hold' in data.group)) {
						data.group.music_on_hold = {};
					}

					if('media_id' in data.group.music_on_hold || enabled) {
						if(enabled) {
							data.group.music_on_hold = {
								media_id: selectedMedia
							};
						} else {
							data.group.music_on_hold = {};
						}
						self.groupsUpdate(data.group, function(updatedGroup) {
							popup.dialog('close').remove();
							self.groupsRender({ groupId: data.group.id });
						});
					} else {
						popup.dialog('close').remove();
						self.groupsRender({ groupId: data.group.id });
					}
				});

				popup = monster.ui.dialog(featureTemplate, {
					title: data.group.extra.mapFeatures.music_on_hold.title,
					position: ['center', 20]
				});
			});
		},

		groupsBindName: function(template, data) {
			var self = this,
				nameForm = template.find('#form-name');

			monster.ui.validate(nameForm);

			template.find('.save-group').on('click', function() {
				if(monster.ui.valid(nameForm)) {
					var formData = form2object('form-name');

					//formData = self.groupsCleanNameData(formData);

					data = $.extend(true, {}, data, formData);

					self.groupsUpdate(data, function(data) {
						self.groupsRender({ groupId: data.id });
					});
				}
			});

			template.find('.delete-group').on('click', function() {
				monster.ui.confirm(self.i18n.active().groups.confirmDeleteGroup, function() {
					self.groupsDelete(data.id, function(data) {
						toastr.success(monster.template(self, '!' + self.i18n.active().groups.groupDeleted, { name: data.group.name }));

						self.groupsRender();
					});
				});
			});
		},

		groupsBindNumbers: function(template, data) {
			var self = this,
				toastrMessages = self.i18n.active().groups.toastrMessages,
				currentNumberSearch = '';

			// template.on('click', '.list-assigned-items .remove-number', function() {
			// 	var row = $(this).parents('.item-row'),
			// 		spare = template.find('.count-spare'),
			// 		countSpare = spare.data('count') + 1,
			// 		unassignedList = template.find('.list-unassigned-items');

			// 	/* Alter the html */
			// 	row.hide();

			// 	row.find('button')
			// 		.removeClass('remove-number btn-danger')
			// 		.addClass('add-number btn-primary')
			// 		.text(self.i18n.active().add);

			// 	unassignedList.append(row);
			// 	unassignedList.find('.empty-row').hide();

			// 	spare
			// 		.html(countSpare)
			// 		.data('count', countSpare);

			// 	var rows = template.find('.list-assigned-items .item-row');
			// 	/* If no rows beside the clicked one, display empty row */
			// 	if(rows.is(':visible') === false) {
			// 		template.find('.list-assigned-items .empty-row').show();
			// 	}

			// 	/* If it matches the search string, show it */
			// 	if(row.data('search').indexOf(currentNumberSearch) >= 0) {
			// 		row.show();
			// 		unassignedList.find('.empty-search-row').hide();
			// 	}
			// });

			template.on('click', '.list-assigned-items .remove-number', function() {
				var $this = $(this),
					parentRow = $this.parents('.grid-row'),
					callflowId = parentRow.data('callflow_id'),
					groupName = parentRow.data('name'),
					row = $this.parents('.item-row'),
					dataNumbers = [];

				row.slideUp(function() {
					row.remove();

					if ( !template.find('.list-assigned-items .item-row').is(':visible') ) {
						template.find('.list-assigned-items .empty-row').slideDown();
					}

					template.find('.item-row').each(function(idx, elem) {
						dataNumbers.push($(elem).data('id'));
					});

					self.groupsUpdateNumbers(callflowId, dataNumbers, function(callflowData) {
						toastr.success(monster.template(self, '!' + toastrMessages.numbersUpdated, { name: groupName }));
						self.groupsRender({ groupId: callflowData.group_id });
					});
				});
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

			template.on('click', '.actions .spare-link:not(.disabled)', function(e) {
				e.preventDefault();

				var $this = $(this),
					args = {
					accountName: monster.apps['auth'].currentAccount.name,
					accountId: self.accountId,
					callback: function(numberList) {
						var parentRow = $this.parents('.grid-row'),
							callflowId = parentRow.data('callflow_id'),
							name = parentRow.data('name');
							dataNumbers = [];

						template.find('.empty-row').hide();

						template.find('.item-row').each(function(idx, elem) {
							dataNumbers.push($(elem).data('id'));
						});

						_.each(numberList, function(val, idx) {
							dataNumbers.push(val.phoneNumber);

							template
								.find('.list-assigned-items')
								.append($(monster.template(self, 'groups-numbersItemRow', { number: val })));
						});

						self.groupsUpdateNumbers(callflowId, dataNumbers, function(callflowData) {
							toastr.success(monster.template(self, '!' + toastrMessages.numbersUpdated, { name: name }));
							self.groupsRender({ groupId: callflowData.group_id });
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
		},

		groupsBindExtensions: function(template, data) {
			var self = this,
				toastrMessages = self.i18n.active().groups.toastrMessages,
				listExtension = [];

			template.on('click', '.save-extensions', function() {
				var extensionsToSave = [],
					parentRow = $(this).parents('.grid-row'),
					callflowId = parentRow.data('callflow_id'),
					name = parentRow.data('name');

				template.find('.list-assigned-items .item-row').each(function(k, row) {
					var row = $(row),
						number;

					number = (row.data('id') ? row.data('id') : row.find('.input-extension').val()) + '';

					extensionsToSave.push(number);
				});

				self.groupsUpdateExtensions(callflowId, extensionsToSave, function(callflowData) {
					toastr.success(monster.template(self, '!' + toastrMessages.numbersUpdated, { name: name }));
					self.groupsRender({ groupId: callflowData.group_id });
				});
			});

			template.on('click', '#add_extensions', function() {
				var renderNewRow = function(lastExtension) {
					var lastExtension = listExtension[listExtension.length - 1] + 1,
					    dataTemplate = {
							recommendedExtension: lastExtension
						},
						newLineTemplate = $(monster.template(self, 'groups-newExtension', dataTemplate)),
						$listExtensions = template.find('.list-assigned-items');

					listExtension.push(lastExtension);
					$listExtensions.find('.empty-row').hide();

					$listExtensions.append(newLineTemplate);
				};

				if(_.isEmpty(listExtension)) {
					self.groupsListExtensions(function(arrayExtension) {
						listExtension = arrayExtension;

						renderNewRow();
					});
				}
				else {
					renderNewRow();
				}
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
				var extension = parseInt($(this).siblings('input').val()),
				    index = listExtension.indexOf(extension);

				if(index > -1) {
					listExtension.splice(index, 1);
				}

				$(this).parents('.item-row').remove();
			});
		},

		groupsBindMembers: function(template, data) {
			var self = this,
				scaleSections = 6, //Number of 'sections' in the time scales for the sliders
				scaleMaxSeconds = 60; //Maximum of seconds, corresponding to the end of the scale

			template.find('.save-groups').on('click', function() {
				var endpoints = [],
					groupId = data.id,
					selectedEntity = template.find('.extra-node-select option:selected');

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

				endpoints.extraNode = {
					id: selectedEntity.val(),
					module: selectedEntity.data('module')
				};

				self.groupsUpdateRingGroup(groupId, endpoints, function(data) {
					self.groupsRender({ groupId: groupId });
				});
			});

			template.on('click', '.remove-user', function() {
				var parentRow = $(this).parents('.group-row');
				template.find('.add-user[data-id="'+parentRow.data('user_id')+'"]').removeClass('in-use');
				parentRow.remove();
			});

			template.on('click', '.add-user', function() {
				var $this = $(this),
					newEndpoint = {
						id: $this.data('id'),
						timeout: '20',
						delay: '0',
						endpoint_type: 'user'
					};

				template.find('.grid-time').append(monster.template(self, 'groups-membersRow', {
					id: newEndpoint.id,
					name: $(this).text()
				}));
				createSlider(newEndpoint);

				$this.addClass('in-use');
			});

			var sliderTooltip = function(event, ui) {
					var val = ui.value,
						tooltip = '<div class="slider-tooltip"><div class="slider-tooltip-inner">' + val + '</div></div>';

					$(ui.handle).html(tooltip);
				},
				createTooltip = function(event, ui, userId, sliderObj) {
					var val1 = sliderObj.slider('values', 0),
						val2 = sliderObj.slider('values', 1),
						tooltip1 = '<div class="slider-tooltip"><div class="slider-tooltip-inner">' + val1 + '</div></div>',
						tooltip2 = '<div class="slider-tooltip"><div class="slider-tooltip-inner">' + val2 + '</div></div>';

					template.find('.group-row[data-user_id="'+ userId + '"] .slider-time .ui-slider-handle').first().html(tooltip1);
					template.find('.group-row[data-user_id="'+ userId + '"] .slider-time .ui-slider-handle').last().html(tooltip2);
				},
				createSlider = function(endpoint) {
					var groupRow = template.find('.group-row[data-user_id="'+ endpoint.id +'"]');
					groupRow.find('.slider-time').slider({
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
					createSliderScale(groupRow);
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

			_.each(data.extra.ringGroup, function(endpoint) {
				createSlider(endpoint);
			});
			createSliderScale(template.find('.group-row.title'), true);
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

		// groupsGetFeaturesData: function(groupId, callback) {
		// 	var self = this;

		// 	self.groupsGetGroup(groupId, function(data) {
		// 		if(!('extra') in data) { data.extra = {}; }
		// 		$.extend(true, data.extra, self.groupsGetGroupFeatures(data));
		// 		callback && callback(data);
		// 	});
		// },

		groupsGetFeaturesData: function(groupId, callback) {
			var self = this;

			monster.parallel({
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
					results.group.extra = self.groupsGetGroupFeatures(results.group);
					callback && callback(results);
				}
			);
		},

		groupsGetNameData: function(groupId, callback) {
			var self = this;

			self.groupsGetGroup(groupId, function(data) {
				callback && callback(data);
			});
		},

		groupsFormatNumbersData: function(data, callback) {
			var self = this,
				response = {
					emptyExtensions: true,
					extensions: [],

					emptyAssigned: true,
					assignedNumbers: {},
					countSpare: 0,
					unassignedNumbers: {}
				};


			monster.pub('common.numbers.getListFeatures', function(features) {
				_.each(data.numbers.numbers, function(number, id) {
					/* Formating number */
                    number.viewFeatures = $.extend(true, {}, features);
                    /* TODO: Once locality is enabled, we need to remove it */
                    number.localityEnabled = 'locality' in number ? true : false;

                    _.each(number.features, function(feature) {
                        number.viewFeatures[feature].active = 'active';
                    });

					if(number.used_by === '') {
						response.unassignedNumbers[id] = number;
						response.countSpare++;
					}
				});

				if('groupCallflow' in data.callflow && 'numbers' in data.callflow.groupCallflow) {
					_.each(data.callflow.groupCallflow.numbers, function(number) {
						if(!(number in data.numbers.numbers)) {
							response.extensions.push(number);
						}
						else {
							response.assignedNumbers[number] = data.numbers.numbers[number];
						}
					});
				}
				response.emptyExtensions = _.isEmpty(response.extensions);
				response.emptyAssigned = _.isEmpty(response.assignedNumbers);
				response.emptySpare = _.isEmpty(response.unassignedNumbers);

				callback && callback(response);
			});
		},

		groupsGetNumbersData: function(groupId, callback) {
			var self = this;

			monster.parallel({
					callflow: function(callbackParallel) {
						var response = {};

						monster.request({
							resource: 'voip.groups.getCallflows',
							data: {
								accountId: self.accountId
							},
							success: function(callflows) {
								response.list = callflows.data;

								var callflowId;

								$.each(callflows.data, function(k, callflowLoop) {
									/* Find Smart PBX Callflow of this group */
									if(callflowLoop.group_id === groupId) {
										callflowId = callflowLoop.id;

										return false;
									}
								});

								if(callflowId) {
									monster.request({
										resource: 'voip.groups.getCallflow',
										data: {
											accountId: self.accountId,
											callflowId: callflowId
										},
										success: function(callflow) {
											response.groupCallflow = callflow.data;

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
							resource: 'voip.groups.getNumbers',
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

					},
					voicemails: function(callback) {
						self.groupsListVMBoxes(function(data) {
							callback(null, data);
						});
					},
					mainMenu: function(callback) {
						monster.request({
							resource: 'voip.groups.listMainCallflows',
							data: {
								accountId: self.accountId
							},
							success: function(data) {
								callback(null, data.data && data.data.length > 0 ? _.find(data.data, function(callflow) { return callflow.numbers[0] === "MainOpenHoursMenu" }) : null);
							}
						});
					},
					userCallflows: function(callback) {
						monster.request({
							resource: 'voip.groups.listUserCallflows',
							data: {
								accountId: self.accountId
							},
							success: function(data) {
								callback(null, data.data);
							}
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
				mapUsers = {},
				flow = data.callflow.flow,
				callEntities = {
					mainMenu: data.mainMenu,
					voicemails: data.voicemails.sort(function(a,b) { return a.name.toLowerCase() > b.name.toLowerCase() ? 1 : -1; }),
					userCallflows : []
				};

			_.each(data.users, function(user) {
				mapUsers[user.id] = user;

				var userCallflow = _.find(data.userCallflows, function(callflow) { return callflow.owner_id === user.id });
				if(userCallflow) {
					userCallflow.userName = user.first_name + ' ' + user.last_name;
					callEntities.userCallflows.push(userCallflow);
				}
			});

			callEntities.userCallflows.sort(function(a,b) { return a.userName.toLowerCase() > b.userName.toLowerCase() ? 1 : -1; });

			while(flow.module !== 'ring_group' && !_.isEmpty(flow.children)) {
				flow = flow.children['_'];
			}

			var endpoints = flow.data.endpoints;

			_.each(endpoints, function(endpoint) {
				user = mapUsers[endpoint.id];

				endpoint.delay = parseInt(endpoint.delay);
				endpoint.timeout = parseInt(endpoint.timeout);

				if(endpoint.id in mapUsers) {
					endpoint.name = user.first_name + ' ' + user.last_name;
					mapUsers[endpoint.id].inUse = true;
				} else {
					endpoint.name = 'Not a user';
				}
			});

			data.group.extra = {
				ringGroup: endpoints,
				remainingUsers: mapUsers,
				callEntities: callEntities,
				selectedEntity: flow.children['_'] ? {
					id: flow.children['_'].data.id,
					module: flow.children['_'].module
				} : null
			};

			return data.group;
		},

		groupsUpdateNumbers: function(callflowId, newNumbers, callback) {
			var self = this;

			self.groupsGetCallflow(callflowId, function(callflow) {
				_.each(callflow.numbers, function(number) {
					if(number.length < 7) {
						newNumbers.push(number);
					}
				});

				callflow.numbers = newNumbers;

				self.groupsUpdateCallflow(callflow, function(callflow) {
					callback && callback(callflow);
				});
			});
		},

		groupsUpdateExtensions: function(callflowId, newNumbers, callback) {
			var self = this;

			self.groupsGetCallflow(callflowId, function(callflow) {
				_.each(callflow.numbers, function(number) {
					if(number.length > 6) {
						newNumbers.push(number);
					}
				});

				callflow.numbers = newNumbers;

				self.groupsUpdateCallflow(callflow, function(callflow) {
					callback && callback(callflow);
				});
			});
		},

		groupsListExtensions: function(callback) {
			var self = this,
				extensionList = [];

			self.groupsListCallflows(function(callflowList) {
				_.each(callflowList, function(callflow) {
					_.each(callflow.numbers, function(number) {
						if(number.length < 7) {
							var extension = parseInt(number);

							if(extension > 1) {
								extensionList.push(extension);
							}
						}
					});
				});

				extensionList.sort(function(a, b) {
					var parsedA = parseInt(a),
						parsedB = parseInt(b),
						result = -1;

					if(parsedA > 0 && parsedB > 0) {
						result = parsedA > parsedB;
					}

					return result;
				});

				callback && callback(extensionList);
			});
		},

		groupsListCallflows: function(callback) {
			var self = this;

			monster.request({
				resource: 'voip.groups.getCallflows',
				data: {
					accountId: self.accountId
				},
				success: function(callflows) {
					callback && callback(callflows.data);
				}
			});
		},

		groupsListMedias: function(callback) {
			var self = this;

			monster.request({
				resource: 'voip.groups.listMedia',
				data: {
					accountId: self.accountId
				},
				success: function(medias) {
					callback && callback(medias.data);
				}
			});
		},

		groupsListVMBoxes: function(callback) {
			var self = this;

			monster.request({
				resource: 'voip.groups.listVMBoxes',
				data: {
					accountId: self.accountId
				},
				success: function(medias) {
					callback && callback(medias.data);
				}
			});
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
			var self = this,
				extraNode = endpoints.extraNode;

			delete endpoints.extraNode;

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
							var flow = ringGroup.flow;
							while(flow.module !== 'ring_group' && !_.isEmpty(flow.children)) {
								flow = flow.children['_'];
							}

							flow.data.endpoints = endpoints;

							flow.data.timeout = self.groupsComputeTimeout(endpoints);

							if(extraNode) {
								flow.children['_'] = {
									data: {
										id: extraNode.id
									},
									module: extraNode.module,
									children: {}
								}
							}

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

		groupsUpdate: function(group, callback) {
			var self = this;

			delete group.extra;

			monster.request({
				resource: 'voip.groups.updateGroup',
				data: {
					accountId: self.accountId,
					groupId: group.id,
					data: group
				},
				success: function(data) {
					callback && callback(data.data);
				}
			});
		},

		groupsUpdateCallflow: function(callflow, callback) {
			var self = this;

			delete callflow.metadata;

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

		groupsGetCallflow: function(callflowId, callback) {
			var self = this;

			monster.request({
				resource: 'voip.groups.getCallflow',
				data: {
					accountId: self.accountId,
					callflowId: callflowId
				},
				success: function(data) {
					callback && callback(data.data);
				}
			});
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
		},

		groupsRemoveOverlay: function() {
			$('body').find('#groups_container_overlay').remove();
		}
	};

	return app;
});
