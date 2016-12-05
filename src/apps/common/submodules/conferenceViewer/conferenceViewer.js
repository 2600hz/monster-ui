define(function(require){
	var $ = require('jquery'),
		_ = require('underscore'),
		monster = require('monster'),
		toastr = require('toastr');

	var conferenceViewer = {

		requests: {},

		appFlags: {
			conferenceViewer: {
				avatarCount: 25,
				currentConference: {
					avatars: []
				}
			}
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

				if(formattedData.conference.participants.length) {
					_.each(formattedData.conference.participants, function(participant) {
						participantsDiv.append(monster.template(self, 'conferenceViewer-user', participant));
					});
				}
				else {
					participantsDiv.append(monster.template(self, 'conferenceViewer-emptyCategory', { text: self.i18n.active().conferenceViewer.emptyParticipants }));
				}

				if(formattedData.conference.moderators.length) {
					_.each(formattedData.conference.moderators, function(moderator) {
						moderatorsDiv.append(monster.template(self, 'conferenceViewer-user', moderator));
					});
				}
				else {
					moderatorsDiv.append(monster.template(self, 'conferenceViewer-emptyCategory', { text: self.i18n.active().conferenceViewer.emptyModerators }));
				}

				self.conferenceViewerStartTimers(template, formattedData.conference);

				monster.ui.tooltips(template);

				self.conferenceViewerBind(template, data, args);

				args.callback && args.callback(template, formattedData)

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

			if($('.view-conference-wrapper').is(':visible')) {
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
					self.appFlags.conferenceViewer.mapUsers = _.indexBy(data.data, 'id');

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
				if($('.view-conference-wrapper').size() > 0 && target.is(':visible')) {
					target.html(monster.util.friendlyTimer(duration++));
				}
				else {
					clearInterval(interval);
				}
			}, 1000);

			return interval;
		},

		conferenceViewerStartTimers: function(template, data) {
			var self = this,
				$this;

			if(data.participants.length + data.moderators.length > 0) {
				self.conferenceViewerStartConference(data.duration, template);
			}
			else {
				self.conferenceViewerStopConference(template);
			}

			template.find('.conference-timer').each(function() {
				$this = $(this);
				self.conferenceViewerStartTimer($this, $this.data('duration'));
			});
		},

		conferenceViewerBind: function(template, data, args) {
			var self = this;

			if(args.hasOwnProperty('backButton')) {
				template.find('#back_button').on('click', function() {
					args.backButton.onClick();
				});
			}

			template.find('.view-content').on('click', '.action-user i', function() {
				var $this = $(this),
					participantId = $this.parents('.conference-user-wrapper').data('id'),
					action = $this.data('action'),
					$parent = $this.parents('.action-user');

				if($parent.hasClass('togglable')) {
					$parent.toggleClass('active');
				}

				self.conferenceViewerActionParticipant(action, data.conference.id, participantId);
			});

			template.find('.conference-action').on('click', function() {
				var $this = $(this),
					action = $this.data('action'),
					$parent = $this.parents('.action-user');

				if($parent.hasClass('togglable')) {
					$parent.toggleClass('active');
				}

				self.conferenceViewerActionConference(action, data.conference.id);
			});
		},

		conferenceViewerFormatData: function(data, args) {
			var self = this,
				liveData = data.conference['_read_only'],
				formattedData = {
					backButton: args.backButton,
					conference: {
						id: data.conference.id,
						name: data.conference.name,
						duration: data.conference['_read_only'].duration,
						isLocked: data.conference['_read_only'].is_locked,
						participants: [],
						moderators: []
					}
				};

			self.conferenceViewerFormatUsers(data.participants);

			_.each(data.participants, function(participant) {
				participant.is_moderator ? formattedData.conference.moderators.push(participant) : formattedData.conference.participants.push(participant);
			});

			return formattedData;
		},

		conferenceViewerGetNotSoRandomAvatarId: function(pStr, pMaxNumber) {
			var self = this,
				str = pStr || 'unknown',
				maxNumber = pMaxNumber || 25,
				firstChar = str.substring(0,1),
				lastChar = str.substring(str.length, 1),
				uniqueCode = firstChar.charCodeAt(0) + lastChar.charCodeAt(0) + str.length,
				id = uniqueCode % maxNumber;

			return id;
		},

		conferenceViewerAssignAvatarIdToUser: function(user, id) {
			var self = this;

			user.avatarId = self.appFlags.conferenceViewer.currentConference.avatars[id];
			self.appFlags.conferenceViewer.currentConference.avatars[id] = -1;
		},

		conferenceViewerGetAvatarsArray: function() {
			var self = this;

			return _.range(self.appFlags.conferenceViewer.avatarCount);
		},

		conferenceViewerGetNewParticipantAvatar: function(user) {
			var self = this,
				randomIndex = self.conferenceViewerGetNotSoRandomAvatarId(user.displayName, self.appFlags.conferenceViewer.avatarCount),
				foundAvailableAvatar = false;

			if(self.appFlags.conferenceViewer.currentConference.avatars[randomIndex] !== -1) {
				self.conferenceViewerAssignAvatarIdToUser(user, randomIndex);
				foundAvailableAvatar = true;
			}
			else {
				_.each(self.appFlags.conferenceViewer.currentConference.avatars, function(v, i) {
					if(v !== -1 && !foundAvailableAvatar) {
						self.conferenceViewerAssignAvatarIdToUser(user, i);
						foundAvailableAvatar = true;
					}
				});

				if(!foundAvailableAvatar) {
					self.appFlags.conferenceViewer.currentConference.avatars = self.conferenceViewerGetAvatarsArray().slice();

					self.conferenceViewerGetNewParticipantAvatar(user);
				}
			}
		},

		conferenceViewerPopulateAvatars: function(noAvatarParticipants) {
			var self = this,
				randomIndex,
				alreadyUsedAvatarParticipants,
				mapParticipants = _.indexBy(noAvatarParticipants,'participant_id'),
				defaultAvatars = self.conferenceViewerGetAvatarsArray(),
				arrayResult = [];

			// Initialize array with all avatars
			self.appFlags.conferenceViewer.currentConference.avatars = defaultAvatars.slice();

			// while we still have participants with no avatars
			while(noAvatarParticipants.length) {
				alreadyUsedAvatarParticipants = [];

				// first for all participants, we try to get their own unique avatar
				_.each(noAvatarParticipants, function(user) {
					randomIndex = self.conferenceViewerGetNotSoRandomAvatarId(user.displayName, self.appFlags.conferenceViewer.avatarCount);

					//if it's already used, we skip them and add them to the list to use for next loop
					if(self.appFlags.conferenceViewer.currentConference.avatars[randomIndex] !== -1) {
						self.conferenceViewerAssignAvatarIdToUser(mapParticipants[user.participant_id], randomIndex);
					}
					else {
						alreadyUsedAvatarParticipants.push(user);
					}
				});

				// once the first loop is done, we look at the unused avatars, and automatically assign them to participants without avatar.
				// because we would rather have people not have their own avatar than 2 participants share the same avatar when there still are unique avatars available
				_.each(self.appFlags.conferenceViewer.currentConference.avatars, function(v, i) {
					if(v !== -1) {
						if(alreadyUsedAvatarParticipants.length) {
							self.conferenceViewerAssignAvatarIdToUser(mapParticipants[alreadyUsedAvatarParticipants[0].participant_id], i);
							// we remove the user from the list since we assigned an avatar
							alreadyUsedAvatarParticipants.splice(0,1);
						}
					}
				});

				// if there still are users that haven't been assigned an avatar, we reset the list of available avatars as we have exhausted the list of unique matches
				if(alreadyUsedAvatarParticipants.length) {
					self.appFlags.conferenceViewer.currentConference.avatars = defaultAvatars.slice();
				}

				// we need to re run the algorithm on the users that we didn't assign an avatar to
				noAvatarParticipants = alreadyUsedAvatarParticipants;
			}

			arrayResult = _.map(mapParticipants, function(v) { return v });

			return arrayResult;
		},

		conferenceViewerFormatParticipant: function(participant) {
			var self = this,
				mapUsers = self.appFlags.conferenceViewer.mapUsers,
				ownerId;

			if(participant.channel && participant.channel.custom_channel_vars && participant.channel.custom_channel_vars.owner_id) {
				ownerId = participant.channel.custom_channel_vars.owner_id;
			}
			else if(participant.custom_channel_vars && participant.custom_channel_vars.owner_id) {
				ownerId = participant.custom_channel_vars.owner_id;
			}

			if(mapUsers.hasOwnProperty(ownerId)) {
				participant.displayName = mapUsers[ownerId].first_name + ' ' + mapUsers[ownerId].last_name;
			}
			else {
				participant.displayName = participant.caller_id_name;
			}

			for(key in participant.conference_channel_vars)
				participant[key] = participant.conference_channel_vars[key];

			return participant;
		},

		conferenceViewerFormatUsers: function(participants) {
			var self = this,
				formattedData = [];

			_.each(participants, function(participant) {
				self.conferenceViewerFormatParticipant(participant);
			});

			formattedData = self.conferenceViewerPopulateAvatars(participants);

			return formattedData;
		},

		conferenceViewerFormatUser: function(participant) {
			var self = this;

			self.conferenceViewerFormatParticipant(participant);
			self.conferenceViewerGetNewParticipantAvatar(participant);

			return participant;
		},

		conferenceViewerOnNewParticipant: function(participant, callback) {
			var self = this,
				container = $('.view-conference-wrapper'),
				formattedParticipant = self.conferenceViewerFormatUser(participant),
				userTemplate = $(monster.template(self, 'conferenceViewer-user', formattedParticipant)),
				countUser = container.find('.conference-user-wrapper').length;

			if(countUser === 0) {
				self.conferenceViewerStartConference();
			}

			self.conferenceViewerStartTimer(userTemplate.find('.conference-timer'), formattedParticipant.duration);

			if(participant.is_moderator) {
				container.find('.moderators-wrapper .users').append(userTemplate);
				container.find('.moderators-wrapper .empty-user-category').remove();
			}
			else {
				container.find('.participants-wrapper .users').append(userTemplate);
				container.find('.participants-wrapper .empty-user-category').remove();
			}

			return formattedParticipant;
		},

		conferenceViewerOnParticipantAction: function(data) {
			var self = this,
				action = data.event,
				container = $('.view-conference-wrapper'),
				toasterActions = ['mute-member', 'unmute-member', 'deaf-member', 'undeaf-member', 'del-member', 'lock', 'unlock'],
				$userDiv = container.find('.conference-user-wrapper[data-id="'+ data.participant_id + '"]'),
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
					var avatarId = parseInt($userDiv.find('[data-avatar-id]').data('avatar-id'));

					if(avatarId) {
						self.appFlags.conferenceViewer.currentConference.avatars[avatarId] = avatarId;
					}
					
					$userDiv.remove();

					if(container.find('.conference-user-wrapper').length === 0) {
						self.conferenceViewerStopConference();
					}

					if(isModerator && $moderatorsDiv.find('.conference-user-wrapper').length === 0) {
						$moderatorsDiv.append(monster.template(self, 'conferenceViewer-emptyCategory', { text: self.i18n.active().conferenceViewer.emptyModerators }));
					}
					else if(!isModerator && $participantsDiv.find('.conference-user-wrapper').length === 0) {
						$participantsDiv.append(monster.template(self, 'conferenceViewer-emptyCategory', { text: self.i18n.active().conferenceViewer.emptyParticipants }));
					}

					break;
				case 'start-talking': 
					$userDiv.addClass('speaking');
					break;
				case 'stop-talking': 
					$userDiv.removeClass('speaking');
					break;
				case 'lock':
					container.find('.conference-action[data-action="lock"]').removeClass('active');
					container.find('.conference-action[data-action="unlock"]').addClass('active');
					break;
				case 'unlock':
					container.find('.conference-action[data-action="unlock"]').removeClass('active');
					container.find('.conference-action[data-action="lock"]').addClass('active');
					break;
				default:
					break
			}

			if(toasterActions.indexOf(action) >= 0) {
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

			if(allowedActions.indexOf(action) >= 0) {
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
			}
			else {
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

			if(stateActions.indexOf(action) >= 0) {
				self.conferenceViewerActionStateConference(action, conferenceId, callback);
			}
			else if(participantsAction.indexOf(action) >= 0) {
				self.conferenceViewerActionBulkParticipants(action, conferenceId, callback);
			}
			else {
				console.log('Conference action not allowed');
			}
		}
	}

	return conferenceViewer;
});
