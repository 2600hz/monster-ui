define(function(require) {
	var $ = require('jquery'),
		_ = require('lodash'),
		monster = require('monster'),
		toastr = require('toastr'),
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
					template = $(monster.template(self, 'conferenceViewer-layout', formattedData)),
					participantsDiv = template.find('.participants-wrapper .users'),
					moderatorsDiv = template.find('.moderators-wrapper .users');

				if (formattedData.conference.participants.length) {
					_.each(formattedData.conference.participants, function(participant) {
						participantsDiv.append(monster.template(self, 'conferenceViewer-user', participant));
					});
				} else {
					participantsDiv.append(monster.template(self, 'conferenceViewer-emptyCategory', { title: self.i18n.active().conferenceViewer.empty, text: self.i18n.active().conferenceViewer.emptyParticipants }));
				}

				if (formattedData.conference.moderators.length) {
					_.each(formattedData.conference.moderators, function(moderator) {
						moderatorsDiv.append(monster.template(self, 'conferenceViewer-user', moderator));
					});
				} else {
					moderatorsDiv.append(monster.template(self, 'conferenceViewer-emptyCategory', { title: self.i18n.active().conferenceViewer.empty, text: self.i18n.active().conferenceViewer.emptyModerators }));
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

				toastr.info(self.i18n.active().conferenceViewer.refreshWebsocket);
				self.conferenceViewerRender({ container: container, id: conferenceId });
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
					callback && callback(data.data);
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
				binding: 'conference.event.' + conferenceId + '.*',
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

				self.conferenceViewerActionParticipant(action, data.conference.id, participantId);
			});

			template.find('.conference-action').on('click', function() {
				var $this = $(this),
					action = $this.data('action'),
					isDisabled = $this.hasClass('disabled'),
					$parent = $this.parents('.action-user');

				if ($parent.hasClass('togglable')) {
					$parent.toggleClass('active');
				}

				if (!isDisabled) {
					self.conferenceViewerActionConference(action, data.conference.id);
				}
			});
		},

		conferenceViewerFormatData: function(data, args) {
			var self = this,
				formattedData = {
					backButton: args.backButton,
					conference: {
						id: data.conference.id,
						name: data.conference.name,
						duration: data.conference._read_only.duration,
						isLocked: data.conference._read_only.is_locked,
						participants: [],
						moderators: []
					}
				};

			data.participants = self.conferenceViewerFormatUsers(data.participants);

			_.each(data.participants, function(participant) {
				participant.is_moderator ? formattedData.conference.moderators.push(participant) : formattedData.conference.participants.push(participant);
			});

			formattedData.conference.disabledActions = formattedData.conference.participants.length + formattedData.conference.moderators.length === 0;

			return formattedData;
		},

		conferenceViewerFormatParticipant: function(oldParticipant) {
			var self = this,
				mapUsers = self.appFlags.conferenceViewer.mapUsers,
				ownerId,
				participant = $.extend(true, {}, oldParticipant);

			if (participant.channel && participant.channel.custom_channel_vars && participant.channel.custom_channel_vars.owner_id) {
				ownerId = participant.channel.custom_channel_vars.owner_id;
			} else if (participant.custom_channel_vars && participant.custom_channel_vars.owner_id) {
				ownerId = participant.custom_channel_vars.owner_id;
			}

			if (mapUsers.hasOwnProperty(ownerId)) {
				participant.displayName = mapUsers[ownerId].first_name + ' ' + mapUsers[ownerId].last_name;
				participant.initials = mapUsers[ownerId].first_name.charAt(0) + mapUsers[ownerId].last_name.charAt(0);
				participant.backgroundColor = randomColor();
			} else {
				participant.displayName = participant.caller_id_name;
				participant.initials = '?';
				participant.backgroundColor = randomColor({ hue: 'monochrome', luminosity: 'light' });
			}

			for (var key in participant.conference_channel_vars) {
				participant[key] = participant.conference_channel_vars[key];
			}

			return participant;
		},

		conferenceViewerFormatUsers: function(participants) {
			var self = this,
				formattedData = [];

			_.each(participants, function(participant) {
				formattedData.push(self.conferenceViewerFormatParticipant(participant));
			});

			return formattedData;
		},

		conferenceViewerFormatUser: function(participant) {
			var self = this;

			return self.conferenceViewerFormatParticipant(participant);
		},

		conferenceViewerOnNewParticipant: function(participant) {
			var self = this,
				container = $('.view-conference-wrapper'),
				formattedParticipant = self.conferenceViewerFormatUser(participant),
				userTemplate = $(monster.template(self, 'conferenceViewer-user', formattedParticipant)),
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
				$userDiv = container.find('.conference-user-wrapper[data-id="' + data.participant_id + '"]'),
				isModerator = $userDiv.parents('.moderators-wrapper').length,
				$participantsDiv = container.find('.participants-wrapper .users'),
				$moderatorsDiv = container.find('.moderators-wrapper .users'),
				userName = $userDiv.data('name');

			switch (action) {
				case 'add-member':
					var newParticipant = self.conferenceViewerOnNewParticipant(data);

					userName = newParticipant.displayName;
					break;
				case 'mute-member':
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
					$userDiv.remove();
					var moderatorsCount = $moderatorsDiv.find('.conference-user-wrapper').length,
						participantsCount = $participantsDiv.find('.conference-user-wrapper').length;

					if (container.find('.conference-user-wrapper').length === 0) {
						self.conferenceViewerStopConference();
					}

					if (isModerator && moderatorsCount === 0) {
						$moderatorsDiv.append(monster.template(self, 'conferenceViewer-emptyCategory', { title: self.i18n.active().conferenceViewer.empty, text: self.i18n.active().conferenceViewer.emptyModerators }));
					} else if (!isModerator && participantsCount === 0) {
						$participantsDiv.append(monster.template(self, 'conferenceViewer-emptyCategory', { title: self.i18n.active().conferenceViewer.empty, text: self.i18n.active().conferenceViewer.emptyParticipants }));
					}

					if (moderatorsCount + participantsCount === 0) {
						container.find('.admin-actions button').addClass('disabled');
					}

					break;
				case 'start-talking':
					$userDiv.addClass('speaking');
					break;
				case 'stop-talking':
					$userDiv.removeClass('speaking');
					break;
				case 'lock':
					container.find('.conference-action[data-action="lock"]').addClass('hidden');
					container.find('.conference-action[data-action="unlock"]').removeClass('hidden');
					break;
				case 'unlock':
					container.find('.conference-action[data-action="unlock"]').addClass('hidden');
					container.find('.conference-action[data-action="lock"]').removeClass('hidden');
					break;
				default:
					break;
			}

			if (toasterActions.indexOf(action) >= 0) {
				toastr.info(monster.template(self, '!' + self.i18n.active().conferenceViewer.userActions[action], { name: userName }));
			}
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
				self.callApi({
					resource: 'conference.participantsAction',
					data: {
						accountId: self.accountId,
						conferenceId: conferenceId,
						participantId: participantId,
						data: {
							action: action
						}
					},
					success: function(data) {
						callback && callback(data.data);
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

		conferenceViewerActionConference: function(action, conferenceId, callback) {
			var self = this,
				stateActions = ['lock', 'unlock'],
				participantsAction = ['kick', 'mute', 'unmute', 'deaf', 'undeaf'];

			if (stateActions.indexOf(action) >= 0) {
				self.conferenceViewerActionStateConference(action, conferenceId, callback);
			} else if (participantsAction.indexOf(action) >= 0) {
				self.conferenceViewerActionBulkParticipants(action, conferenceId, callback);
			} else {
				console.log('Conference action not allowed');
			}
		}
	};

	return conferenceViewer;
});
