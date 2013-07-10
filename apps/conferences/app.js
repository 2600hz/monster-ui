define(function(require){
	var $ = require('jquery'),
		_ = require('underscore'),
		monster = require('monster'),
		socket = require('socket'),
		timepicker = require('timepicker'),
		toastr = require('toastr');

	var app = {

		name: 'conferences',

		i18n: [ 'en-US' ],

		requests: {
			'conferences.list': {
				url: 'accounts/{accountId}/conferences',
				verb: 'GET'
			},
			'conferences.get': {
				url: 'accounts/{accountId}/conferences/{conferenceId}',
				verb: 'GET'
			},
			'conferences.add': {
				url: 'accounts/{accountId}/conferences',
				verb: 'PUT'
			},
			'conferences.update': {
				url: 'accounts/{accountId}/conferences/{conferenceId}',
				verb: 'POST'
			},
			'conferences.delete': {
				url: 'accounts/{accountId}/conferences/{conferenceId}',
				verb: 'DELETE'
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
				conferenceView = $(monster.template(self, 'app'));
/*
			var socket = io.connect('http://192.168.1.102:8080');

			socket.emit('connected', { user: 'odeonn@gmail.com' });

			socket.on('user_connected', function(data) {
				toastr.success('user connected!');
				console.log(data);
			});

			socket.on('user_start_speaking', function(data) {
				toastr.success('user started speaking!');
				console.log(data);
			});

			socket.on('user_stop_speaking', function(data) {
				toastr.warning('user stopped speaking');
				console.log(data);
			});
*/

			self.bindEvents(conferenceView);

			$('#ws-content')
				.empty()
				.append(conferenceView);
		},

		//_util
		formatData: function(data) {
		},

		bindEvents: function(parent) {
			var self = this;

			parent.find('.left-menu .nav-item').on('click', function() {
				parent.find('.left-menu .nav-item').removeClass('active');
				$(this).addClass('active');
			});

			parent.find('#new_conference').on('click', function() {
				self.renderNewConference(parent);
			});

			parent.find('#upcoming_conferences').on('click', function() {
				self.renderUpcomingConferences();
			});

			parent.find('#callin_numbers').on('click', function() {
				self.renderCallinNumbers();
			});

			parent.find('#active_conferences').on('click', function() {
				self.renderActiveConference();
			});

			parent.find('#customize_notifications').on('click', function() {
				self.renderCustomizeNotifications();
			});
		},

		renderActiveConference: function() {
			var self = this;
		},
		renderUpcomingConferences: function() {
			var self = this;
		},
		renderCallinNumbers: function() {
			var self = this;
		},
		renderCustomizeNotifications: function() {
			var self = this;
		},

		renderNewConference: function(parent) {
			var self = this,
				conference = {
					participants: [],
					pins: { //TODO Call an API to get unique PINs
						moderator: 123456, 
						member: 654321
					}
				},
				conferenceTemplate = $(monster.template(self, 'editConference', {conference: conference})),
				dateInputDiv = conferenceTemplate.find('.date-input-div'),
				dateInput = dateInputDiv.find('.date-input'),
				timeInput = dateInputDiv.find('.time-input');


			dateInput.datepicker({ minDate: 0 });
			dateInput.datepicker('setDate', new Date());
			timeInput.timepicker();
			timeInput.timepicker('setTime', new Date());
			dateInputDiv.hide();

			self.refreshParticipantsList(conferenceTemplate, conference.participants, true);
			self.refreshParticipantsList(conferenceTemplate, conference.participants, false);

			self.bindNewConferenceEvents( {
				parent: conferenceTemplate,
				conference: conference
			});


			parent.find('.right-content')
				.empty()
				.append(conferenceTemplate);
		},

		editConference: function(parent, conferenceId) {
			var self = this;
			monster.request({
				resource: 'conferences.get', 
				data: {
					accountId: self.accountId,
					conferenceId: conferenceId
				},
				success: function(data, status) {
					var conference = data.data,
						startDate = monster.util.gregorianToDate(conference.start),
						conferenceTemplate = $(monster.template(self, 'editConference', {conference: conference})),
						dateInput = conferenceTemplate.find('.date-input'),
						timeInput = conferenceTemplate.find('.time-input');

					dateInput.datepicker({ minDate: 0 });
					dateInput.datepicker('setDate', startDate);
					timeInput.timepicker();
					timeInput.timepicker('setTime', startDate);

					self.refreshParticipantsList(conferenceTemplate, conference.participants, true);
					self.refreshParticipantsList(conferenceTemplate, conference.participants, false);

					self.bindNewConferenceEvents( {
						parent: conferenceTemplate,
						conference: conference
					});

					parent.find('.right-content')
						.empty()
						.append(conferenceTemplate);
				}
			});
		},

		refreshParticipantsList: function(parent, participants, isModerator) {
			var self = this,
				type = isModerator ? "moderator" : "member",
				params = {
					participants: $.map(participants, function(v) {
						return v.moderator === isModerator ? v : null;
					}),
					moderator: isModerator
				},
				template = $(monster.template(self, 'participantsList', params));

			parent.find('.participant-list-container[data-type="'+type+'"]')
				.empty()
				.append(template);
		},

		/**
		 * Expected params:
		 * - parent
		 * - conference
		 */
		bindNewConferenceEvents: function(params) {
			var self = this,
				parent = params.parent,
				conference = params.conference,
				switchLinks = parent.find('.switch-link'),
				containsEmail = function(email, participants) {
					var result = false;
					$.each(participants, function(k, v) {
						if(v.email === email) {
							result = true;
							return false;
						}
					});
					return result;
				};

			conference.participants = conference.participants || [];

			switchLinks.on('click', function() {
				var $this = $(this);
				if(!$this.hasClass('active')) {
					switchLinks.removeClass('active');
					$this.addClass('active');
					if($this.data('start') === 'now') {
						parent.find('.date-input-div').slideUp();
					} else {
						parent.find('.date-input-div').slideDown();
					}
				}
			});

			parent.find('.participant-list-container').on('click', '.add-participant-link > a', function(e) {
				e.preventDefault();

				self.showAddParticipantPopup(
					function(participant) {
						if(!containsEmail(participant.email, conference.participants)) {
							conference.participants.push(participant);
							self.refreshParticipantsList(parent, conference.participants, participant.moderator);
						} else {
							monster.ui.alert(self.i18n.active().popupMessages.participantEmailDuplicateAlert);
						}
					},
					function() {},
					$(this).parent().data('type')
				);
			});

			parent.find('.participant-list-container').on('click', '.remove-participant-link', function(e) {
				var $this = $(this),
					email = $this.data('email');

				$.each(conference.participants, function(key, val) {
					if(val.email === email) {
						conference.participants.splice(key, 1);
						self.refreshParticipantsList(parent, conference.participants, val.moderator);
						return false;
					}
				});
			});

			parent.find('#create_conference_btn').on('click', function(e) {
				e.preventDefault();
				var formData = form2object('edit_conference_container'),
					newConference;
				delete formData.extra;
				newConference = $.extend(true, {}, conference, formData);

				if(!newConference.name) {
					monster.ui.alert(self.i18n.active().popupMessages.mandatoryConferenceNameAlert);
				} else {
					if(parent.find('.switch-link.active').data() === 'now') {
						newConference.start = monster.util.dateToGregorian(new Date());
					} else {
						function createConference() {
							var date = parent.find('.date-input').datepicker('getDate'),
								time = parent.find('.time-input').timepicker('getTime');

							date.setHours(time.getHours());
							date.setMinutes(time.getMinutes());
							newConference.start = monster.util.dateToGregorian(date);

							monster.request({
								resource: 'conferences.add', 
								data: {
									accountId: self.accountId,
									data: newConference
								},
								success: function(data, status) {
									toastr.success(self.i18n.active().toastrMessages.newConferenceSuccess, '', {"timeOut": 5000});
								},
								error: function(data, status) {
									toastr.error(self.i18n.active().toastrMessages.newConferenceError, '', {"timeOut": 5000});
								}
							});
						};
						
						if(newConference.participants.length <= 0) {
							monster.ui.confirm(self.i18n.active().popupMessages.noParticipantConfirm, function() {
								createConference();
							});
						} else {
							createConference();
						}
					}
				}
			});

			parent.find('#update_conference_btn').on('click', function(e) {
				e.preventDefault();
				var formData = form2object('edit_conference_container'),
					newConference;
				delete formData.extra;
				newConference = $.extend(true, {}, conference, formData);

				if(!newConference.name) {
					monster.ui.alert(self.i18n.active().popupMessages.mandatoryConferenceNameAlert);
				} else {
					if(parent.find('.switch-link.active').data() === 'now') {
						newConference.start = monster.util.dateToGregorian(new Date());
					} else {
						function createConference() {
							var date = parent.find('.date-input').datepicker('getDate'),
								time = parent.find('.time-input').timepicker('getTime');

							date.setHours(time.getHours());
							date.setMinutes(time.getMinutes());
							newConference.start = monster.util.dateToGregorian(date);

							monster.request({
								resource: 'conferences.update', 
								data: {
									accountId: self.accountId,
									conferenceId: newConference.id,
									data: newConference
								},
								success: function(data, status) {
									toastr.success(self.i18n.active().toastrMessages.updateConferenceSuccess, '', {"timeOut": 5000});
								},
								error: function(data, status) {
									toastr.error(self.i18n.active().toastrMessages.updateConferenceError, '', {"timeOut": 5000});
								}
							});
						};
						
						if(newConference.participants.length <= 0) {
							monster.ui.confirm(self.i18n.active().popupMessages.noParticipantConfirm, function() {
								createConference();
							});
						} else {
							createConference();
						}
					}
				}
			});

			parent.find('#cancel_conference_btn').on('click', function(e) {
				e.preventDefault();
				monster.ui.confirm(self.i18n.active().popupMessages.deleteConferenceConfirm, function() {
					monster.request({
						resource: 'conferences.delete', 
						data: {
							accountId: self.accountId,
							conferenceId: conference.id,
							data: {}
						},
						success: function(data, status) {
							toastr.success(self.i18n.active().toastrMessages.deleteConferenceSuccess, '', {"timeOut": 5000});
						},
						error: function(data, status) {
							toastr.error(self.i18n.active().toastrMessages.deleteConferenceError, '', {"timeOut": 5000});
						}
					});
				});
			});
		},

		showAddParticipantPopup: function(callbackOk, callbackCancel, participantType) {
			var self = this,
				dialog,
				template = $(monster.template(self, 'addParticipantPopup', { type: participantType })),
				options = {
					closeOnEscape: true,
					onClose: function() {
						ok ? callbackOk && callbackOk(participant) : callbackCancel && callbackCancel();
					}
				},
				ok = false,
				participant = {};

			if(!participantType) {
				options.title = self.i18n.active().popupTitles.participant;
			} else if(participantType === "member") {
				options.title = self.i18n.active().popupTitles.member;
			} else if(participantType === "moderator") {
				options.title = self.i18n.active().popupTitles.moderator;
			}

			dialog = monster.ui.dialog(template, options);

			template.find('#add_participant_btn').on('click', function(e) {
				e.preventDefault();
				participant = form2object('add_new_participant_form');
				participant.moderator = (template.find('input:radio[name="moderator"]:checked').val() === "true");

				if(!participant.email) {
					monster.ui.alert(self.i18n.active().popupMessages.mandatoryParticipantEmailAlert);
				} else {
					ok = true;
					dialog.dialog('close');
				}
			});

			return dialog;
		}
	};

	return app;
});
