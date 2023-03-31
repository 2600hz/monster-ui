define(function(require) {
	var $ = require('jquery'),
		_ = require('lodash'),
		monster = require('monster'),
		randomColor = require('randomColor');

	var conferenceViewer = {

		requests: {},

		appFlags: {
			conferenceViewer: {}
		},

		subscribe: {
			'common.conferenceViewer.get': 'conferenceViewerGet',
			'socket.connected': 'conferenceViewerSocketReconnected'
		},

		conferenceViewerGet: function(args) {
			var self = this,
				conferenceId = args.id;

			self.conferenceViewerGetData(conferenceId, function(data) {
				var formattedData = self.conferenceViewerFormatData(data, args),
					template = $(self.getTemplate({
						name: 'layout',
						submodule: 'conferenceViewer',
						data: formattedData
					})),
					participantsDiv = template.find('.participants-wrapper .users'),
					moderatorsDiv = template.find('.moderators-wrapper .users');

				if (formattedData.conference.participants.length) {
					_.each(formattedData.conference.participants, function(participant) {
						participantsDiv.append(self.getTemplate({ name: 'user', submodule: 'conferenceViewer', data: participant }));
					});
				} else {
					participantsDiv.append(self.getTemplate({ name: 'emptyCategory', submodule: 'conferenceViewer', data: { title: self.i18n.active().conferenceViewer.empty, text: self.i18n.active().conferenceViewer.emptyParticipants } }));
				}

				if (formattedData.conference.moderators.length) {
					_.each(formattedData.conference.moderators, function(moderator) {
						moderatorsDiv.append(self.getTemplate({ name: 'user', submodule: 'conferenceViewer', data: moderator }));
					});
				} else {
					moderatorsDiv.append(self.getTemplate({ name: 'emptyCategory', submodule: 'conferenceViewer', data: { title: self.i18n.active().conferenceViewer.empty, text: self.i18n.active().conferenceViewer.emptyModerators } }));
				}

				if (formattedData.conference.moderators.length + formattedData.conference.participants.length === 0) {
					template.find('.admin-actions button').addClass('disabled');
				}

				self.conferenceViewerStartTimers(template, formattedData.conference);

				monster.ui.tooltips(template);

				self.conferenceViewerBind(template, data, args);

				args.callback && args.callback(template, formattedData);

				self.conferenceViewerBindSocketEvents(conferenceId, template);
			});
		},

		conferenceViewerGetData: function(conferenceId, globalCallback) {
			var self = this;

			monster.parallel({
				conference: function(callback) {
					self.conferenceViewerGetConference(conferenceId, function(data) {
						callback && callback(null, data);
					});
				},
				users: function(callback) {
					self.conferenceViewerListUsers(function(data) {
						callback && callback(null, data);
					});
				},
				participants: function(callback) {
					self.callApi({
						resource: 'conference.participantsList',
						data: {
							accountId: self.accountId,
							conferenceId: conferenceId
						},
						success: function(data) {
							callback && callback(null, data.data);
						}
					});
				}
			}, function(err, results) {
				globalCallback && globalCallback(results);
			});
		},

		conferenceViewerSocketReconnected: function() {
			var self = this;

			if ($('.view-conference-wrapper').is(':visible')) {
				var container = $('.view-conference-wrapper'),
					conferenceId = container.data('id');

				monster.ui.toast({
					type: 'info',
					message: self.i18n.active().conferenceViewer.refreshWebsocket
				});
				self.conferenceViewerGet({ id: conferenceId });
			}
		},

		conferenceViewerGetConference: function(conferenceId, callback) {
			var self = this;

			self.callApi({
				resource: 'conference.get',
				data: {
					accountId: self.accountId,
					conferenceId: conferenceId
				},
				success: function(data) {
					var conferenceData = _.merge({}, data.data, {
						metadata: data.metadata
					});

					callback && callback(conferenceData);
				}
			});
		},

		conferenceViewerListUsers: function(callback) {
			var self = this;

			self.callApi({
				resource: 'user.list',
				data: {
					accountId: self.accountId,
					filters: {
						paginate: false
					}
				},
				success: function(data) {
					self.appFlags.conferenceViewer.mapUsers = _.keyBy(data.data, 'id');

					callback && callback(data.data);
				}
			});
		},

		conferenceViewerBindSocketEvents: function(conferenceId, template) {
			var self = this;

			self.subscribeWebSocket({
				binding: 'conference.event.*.' + conferenceId + '.*',
				requiredElement: template,
				callback: function(event) {
					self.conferenceViewerOnParticipantAction(event);
				}
			});
		},

		conferenceViewerStartTimer: function(target, pDuration) {
			var self = this,
				duration = pDuration || 0;

			target.html(monster.util.friendlyTimer(duration));

			var interval = setInterval(function() {
				/* As long as the page is displayed */
				if ($('.view-conference-wrapper').size() > 0 && target.is(':visible')) {
					target.html(monster.util.friendlyTimer(duration++));
				} else {
					clearInterval(interval);
				}
			}, 1000);

			return interval;
		},

		conferenceViewerStartTimers: function(template, data) {
			var self = this,
				$this;

			if (data.participants.length + data.moderators.length > 0) {
				self.conferenceViewerStartConference(data.duration, template);
			} else {
				self.conferenceViewerStopConference(template);
			}

			template.find('.conference-timer').each(function() {
				$this = $(this);
				self.conferenceViewerStartTimer($this, $this.data('duration'));
			});
		},

		conferenceViewerBind: function(template, data, args) {
			var self = this;

			if (args.hasOwnProperty('backButton')) {
				template.find('#back_button').on('click', function() {
					args.backButton.onClick();
				});
			}

			template.find('.view-content').on('click', '.action-user i', function() {
				var $this = $(this),
					participantId = $this.parents('.conference-user-wrapper').data('id'),
					action = $this.data('action'),
					$parent = $this.parents('.action-user');

				if ($parent.hasClass('togglable')) {
					$parent.toggleClass('active');
				}

				var callback = null;
				if (action === 'kick') {
					callback = function(requestData) {
						self.conferenceViewerOnParticipantAction({
							event: 'del-member',
							participant_id: requestData.participantId
						});
					};
				}

				self.conferenceViewerActionParticipant(action, data.conference.id, participantId, callback);
			});

			template.find('.conference-action').on('click', function() {
				var $this = $(this),
					action = $this.data('action'),
					isDisabled = $this.hasClass('disabled');

				if (!isDisabled) {
					var callback = null;
					if (action === 'kick') {
						callback = function(data) {
							template.find('.conference-user-wrapper').remove();
							self.afterUserRemoved(template);
							monster.ui.toast({
								type: 'info',
								message: self.i18n.active().conferenceViewer.conferenceActions.kick
							});
						};
					}

					self.conferenceViewerActionConference(action, data.conference, callback);
				}
			});
		},

		conferenceViewerFormatData: function(data, args) {
			var self = this,
				isModerator = _.flow(
					_.partial(_.ary(_.get, 2), _, 'is_moderator'),
					_.partial(_.isEqual, true)
				),
				users = self.conferenceViewerFormatUsers(data.participants),
				moderators = _.filter(users, isModerator),
				participants = _.reject(users, isModerator);

			return {
				backButton: args.backButton,
				conference: _.merge({
					duration: data.conference.metadata.duration,
					isLocked: data.conference.metadata.is_locked,
					participants: participants,
					moderators: moderators
				}, _.pick(data.conference, [
					'id',
					'name'
				]))
			};
		},

		conferenceViewerFormatParticipant: function(participant) {
			var self = this,
				ownerId = _
					.chain([
						'channel.custom_channel_vars.owner_id',
						'custom_channel_vars.owner_id'
					])
					.map(_.partial(_.ary(_.get, 2), participant))
					.find(_.negate(_.isUndefined))
					.value(),
				user = _.get(self.appFlags.conferenceViewer.mapUsers, ownerId);

			return _.merge(_.isUndefined(user) ? {
				backgroundColor: randomColor({
					hue: 'monochrome',
					luminosity: 'light'
				}),
				displayName: participant.caller_id_name,
				initials: '?'
			} : {
				backgroundColor: randomColor(),
				displayName: monster.util.getUserFullName(user),
				initials: _
					.chain(['first_name', 'last_name'])
					.map(_.flow(
						_.partial(_.ary(_.get, 2), user),
						_.head
					))
					.join('')
					.toUpper()
					.value()
			}, _.pick(participant, [
				'caller_id_number',
				'duration',
				'participant_id'
			]), participant.conference_channel_vars);
		},

		conferenceViewerFormatUsers: function(participants) {
			var self = this;

			return _.map(participants, _.bind(self.conferenceViewerFormatParticipant, self));
		},

		conferenceViewerFormatUser: function(participant) {
			var self = this;

			return self.conferenceViewerFormatParticipant(participant);
		},

		conferenceViewerOnNewParticipant: function(participant) {
			var self = this,
				container = $('.view-conference-wrapper'),
				formattedParticipant = self.conferenceViewerFormatUser(participant),
				userTemplate = $(self.getTemplate({ name: 'user', submodule: 'conferenceViewer', data: formattedParticipant })),
				countUser = container.find('.conference-user-wrapper').length;

			if (countUser === 0) {
				self.conferenceViewerStartConference();
			}

			self.conferenceViewerStartTimer(userTemplate.find('.conference-timer'), formattedParticipant.duration);

			if (formattedParticipant.is_moderator) {
				container.find('.moderators-wrapper .users').append(userTemplate);
				container.find('.moderators-wrapper .empty-user-category').remove();
			} else {
				container.find('.participants-wrapper .users').append(userTemplate);
				container.find('.participants-wrapper .empty-user-category').remove();
			}

			container.find('.admin-actions button').removeClass('disabled');

			return formattedParticipant;
		},

		conferenceViewerOnParticipantAction: function(data) {
			var self = this,
				action = data.event,
				container = $('.view-conference-wrapper'),
				toasterActions = ['mute-member', 'unmute-member', 'deaf-member', 'undeaf-member', 'del-member', 'lock', 'unlock'],
				$addButton = container.find('.conference-action[data-action="add"]'),
				$userDiv = container.find('.conference-user-wrapper[data-id="' + data.participant_id + '"]'),
				userName = $userDiv.data('name');

			switch (action) {
				case 'add-member':
					var newParticipant = self.conferenceViewerOnNewParticipant(data);

					userName = newParticipant.displayName;
					break;
				case 'mute-member':
					$userDiv.removeClass('speaking');
					$userDiv.find('[data-action-category="mute"]').addClass('active');
					break;
				case 'unmute-member':
					$userDiv.find('[data-action-category="mute"]').removeClass('active');
					break;
				case 'deaf-member':
					$userDiv.find('[data-action-category="deaf"]').addClass('active');
					break;
				case 'undeaf-member':
					$userDiv.find('[data-action-category="deaf"]').removeClass('active');
					break;
				case 'del-member':
					if ($userDiv.length === 0) {
						// If user card was already removed, this method was called
						// both from socket event handler and user hangup click event,
						// and this is the second call, so there is nothing more to do
						return;
					}

					$userDiv.remove();
					self.afterUserRemoved(container);

					break;
				case 'start-talking':
					if (!$userDiv.find('[data-action-category="mute"]').hasClass('active')) {
						$userDiv.addClass('speaking');
					}
					break;
				case 'stop-talking':
					$userDiv.removeClass('speaking');
					break;
				case 'lock':
					container.find('.conference-action[data-action="lock"]').addClass('hidden');
					container.find('.conference-action[data-action="unlock"]').removeClass('hidden');
					$addButton.addClass('disabled');
					break;
				case 'unlock':
					self.conferenceViewerUnlockAction();
					break;
				default:
					break;
			}

			if (toasterActions.indexOf(action) >= 0) {
				monster.ui.toast({
					type: 'info',
					message: self.getTemplate({
						name: '!' + self.i18n.active().conferenceViewer.userActions[action],
						data: {
							name: userName
						}
					})
				});
			}
		},

		conferenceViewerUnlockAction: function() {
			var container = $('.view-conference-wrapper'),
				$addButton = container.find('.conference-action[data-action="add"]');

			container.find('.conference-action[data-action="unlock"]').addClass('hidden');
			container.find('.conference-action[data-action="lock"]').removeClass('hidden');
			$addButton.removeClass('disabled');
		},

		conferenceViewerStartConference: function(duration, container) {
			var self = this,
				container = container || $('.view-conference-wrapper');

			self.appFlags.conferenceViewer.mainConferenceTimer = self.conferenceViewerStartTimer(container.find('.main-conference-timer'), duration);
		},

		conferenceViewerStopConference: function(container) {
			var self = this,
				container = container || $('.view-conference-wrapper');

			clearInterval(self.appFlags.conferenceViewer.mainConferenceTimer);
			container.find('.main-conference-timer').html(self.i18n.active().conferenceViewer.notStarted);
		},

		conferenceViewerActionParticipant: function(action, conferenceId, participantId, callback) {
			var self = this,
				allowedActions = ['kick', 'mute', 'unmute', 'deaf', 'undeaf'];

			if (allowedActions.indexOf(action) >= 0) {
				var requestData = {
					accountId: self.accountId,
					conferenceId: conferenceId,
					participantId: participantId,
					data: {
						action: action
					}
				};
				self.callApi({
					resource: 'conference.participantsAction',
					data: requestData,
					success: function(data) {
						callback && callback(requestData, data.data);
					}
				});
			} else {
				console.log('Conference action not allowed');
			}
		},

		conferenceViewerActionBulkParticipants: function(action, conferenceId, callback) {
			var self = this;

			self.callApi({
				resource: 'conference.participantsBulkAction',
				data: {
					accountId: self.accountId,
					conferenceId: conferenceId,
					data: {
						action: action
					}
				},
				success: function(data) {
					callback && callback(data.data);
				}
			});
		},

		conferenceViewerActionStateConference: function(action, conferenceId, callback) {
			var self = this;

			self.callApi({
				resource: 'conference.action',
				data: {
					accountId: self.accountId,
					conferenceId: conferenceId,
					data: {
						action: action
					}
				},
				success: function(data) {
					callback && callback(data.data);
				}
			});
		},

		conferenceViewerAddParticipantsData: function(conferenceId, data, callback) {
			var self = this;

			self.callApi({
				resource: 'conference.action',
				bypassProgressIndicator: true,
				data: {
					accountId: self.accountId,
					conferenceId: conferenceId,
					data: {
						action: 'dial',
						data: data
					}
				},
				success: function(data) {
					callback && callback(null, data.data);
				},
				error: function(parsedError) {
					callback && callback(parsedError);
				}
			});
		},

		conferenceViewerActionConference: function(action, conference, callback) {
			var self = this,
				stateActions = ['lock', 'unlock'],
				participantsAction = ['kick', 'mute', 'unmute', 'deaf', 'undeaf'];

			if (action === 'add') {
				self.conferenceViewerAddParticipantsDialog(conference);
			} else if (stateActions.indexOf(action) >= 0) {
				self.conferenceViewerActionStateConference(action, conference.id, callback);
			} else if (participantsAction.indexOf(action) >= 0) {
				self.conferenceViewerActionBulkParticipants(action, conference.id, callback);
			} else {
				console.log('Conference action not allowed');
			}
		},

		conferenceViewerAddParticipantsDialog: function(conference) {
			var self = this,
				getEndpointName = function(endpoint) {
					var userFullName;
					try {
						userFullName = monster.util.getUserFullName(endpoint);
					} catch (error) {
						userFullName = self.i18n.active().conferenceViewer.unknownEndpointName;
					}
					return _
						.chain(endpoint)
						.get('name')
						.defaultTo(userFullName)
						.value();
				};

			self.conferenceViewerGetAddEndpointsData(function(data) {
				var formattedData = self.conferenceViewerFormatAddParticipants(data),
					endpointsPerId = _
						.chain([data.devices, data.users])
						.flatten()
						.keyBy('id')
						.value(),
					template = $(self.getTemplate({ name: 'addEndpointDialog', submodule: 'conferenceViewer', data: formattedData }));

				monster.ui.chosen(template.find('#select_endpoints'), {
					width: '100%'
				});

				template.find('#add').on('click', function(e) {
					e.preventDefault();

					var selectedEndpointIds = template.find('#select_endpoints').val(),
						data = {
							endpoints: selectedEndpointIds,
							caller_id_name: conference.name
						};

					self.conferenceViewerAddParticipantsData(conference.id, data, function(err, response) {
						if (err) {
							monster.ui.toast({
								type: 'error',
								message: self.i18n.active().conferenceViewer.toastr.error.participantInvite
							});
							return;
						}
						var unreachableEndpointsNames = _
							.chain(response)
							.get('endpoint_responses', [])
							.filter({ status: 'error' })
							.map(function(metadata) {
								var endpointId = _.get(metadata, 'endpoint_id');

								return _
									.chain(endpointsPerId)
									.get(endpointId)
									.thru(getEndpointName)
									.value();
							})
							.value();

						_.forEach(unreachableEndpointsNames, function(name) {
							monster.ui.toast({
								type: 'info',
								message: self.getTemplate({
									name: '!' + self.i18n.active().conferenceViewer.toastr.info.participantInvite,
									data: {
										name: name
									}
								})
							});
						});
					});

					monster.ui.toast({
						type: 'success',
						message: self.i18n.active().conferenceViewer.addEndpointDialog.successAdd
					});

					popup.dialog('close');
				});

				var popup = monster.ui.dialog(template, { title: self.i18n.active().conferenceViewer.addEndpointDialog.title });
			});
		},

		conferenceViewerGetAddEndpointsData: function(callback) {
			var self = this;

			monster.parallel({
				devices: function(callback) {
					self.callApi({
						resource: 'device.list',
						data: {
							accountId: self.accountId
						},
						success: function(data) {
							callback && callback(null, data.data);
						}
					});
				},
				users: function(callback) {
					callback(null, self.appFlags.conferenceViewer.mapUsers);
				}
			}, function(err, results) {
				callback && callback(results);
			});
		},

		conferenceViewerFormatAddParticipants: function(data) {
			var self = this;

			return data;
		},

		afterUserRemoved: function(container) {
			var self = this,
				$participantsDiv = container.find('.participants-wrapper .users'),
				$moderatorsDiv = container.find('.moderators-wrapper .users'),
				moderatorsCount = $moderatorsDiv.find('.conference-user-wrapper').length,
				participantsCount = $participantsDiv.find('.conference-user-wrapper').length;

			if (moderatorsCount + participantsCount === 0) {
				self.conferenceViewerStopConference();
				self.conferenceViewerUnlockAction();
				container.find('.admin-actions button').addClass('disabled');
			}

			if ($moderatorsDiv.children().length === 0) {
				$moderatorsDiv.append(self.getTemplate({ name: 'emptyCategory', submodule: 'conferenceViewer', data: { title: self.i18n.active().conferenceViewer.empty, text: self.i18n.active().conferenceViewer.emptyModerators } }));
			}
			if ($participantsDiv.children().length === 0) {
				$participantsDiv.append(self.getTemplate({ name: 'emptyCategory', submodule: 'conferenceViewer', data: { title: self.i18n.active().conferenceViewer.empty, text: self.i18n.active().conferenceViewer.emptyParticipants } }));
			}
		}
	};

	return conferenceViewer;
});
