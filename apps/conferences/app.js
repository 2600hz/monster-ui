define(function(require){
	var $ = require('jquery'),
		_ = require('underscore'),
		hotkeys = require('hotkeys'),
		monster = require('monster'),
		timepicker = require('timepicker'),
		toastr = require('toastr'),
		wysiwyg = require('wysiwyg');

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
			},
			'conferences.getPins': {
				url: 'accounts/{accountId}/conferences/pins',
				verb: 'GET'
			},
			'conferences.listConferencesServers': {
				url: 'accounts/{accountId}/conferences_servers',
				verb: 'GET'
			},
			'conferences.createConferencesServer': {
				url: 'accounts/{accountId}/conferences_servers',
				verb: 'PUT'
			},
			'conferences.getConferencesServer': {
				url: 'accounts/{accountId}/conferences_servers/{conferencesServerId}',
				verb: 'GET'
			},
			'conferences.updateConferencesServer': {
				url: 'accounts/{accountId}/conferences_servers/{conferencesServerId}',
				verb: 'POST'
			},
			'conferences.view': {
				url: 'accounts/{accountId}/conferences/{conferenceId}/status',
				verb: 'GET'
			},
			'conferences.muteParticipant': {
				url: 'accounts/{accountId}/conferences/{conferenceId}/mute/{participantId}',
				verb: 'POST'
			},
			'conferences.unmuteParticipant': {
				url: 'accounts/{accountId}/conferences/{conferenceId}/unmute/{participantId}',
				verb: 'POST'
			},
			'conferences.deafParticipant': {
				url: 'accounts/{accountId}/conferences/{conferenceId}/deaf/{participantId}',
				verb: 'POST'
			},
			'conferences.undeafParticipant': {
				url: 'accounts/{accountId}/conferences/{conferenceId}/undeaf/{participantId}',
				verb: 'POST'
			},
			'conferences.kickParticipant': {
				url: 'accounts/{accountId}/conferences/{conferenceId}/kick/{participantId}',
				verb: 'POST'
			},
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

			parent.find('.left-menu .nav-item:not(.role)').on('click', function() {
				parent.find('.left-menu .nav-item').removeClass('active');
				$(this).addClass('active');
			});

			parent.find('#new_conference').on('click', function() {
				self.renderNewConference(parent);
			});

			parent.find('#upcoming_conferences').on('click', function() {
				self.renderUpcomingConferences(parent);
			});

			parent.find('#callin_numbers').on('click', function() {
				self.renderCallinNumbers(parent);
			});

			parent.find('#active_conferences').on('click', function() {
				self.renderActiveConference(parent);
			});

			parent.find('#customize_notifications').on('click', function() {
				self.renderCustomizeNotifications(parent);
			});
		},

		renderActiveConference: function(parent) {
			var self = this,
				data = self.formatActiveConference(
						{ conferences: [
							{ id: '123', name: 'Upcoming Conference\'s Name 0',duration: 10 },
							{ id: '131', name: 'Upcoming Conference\'s Name 1',duration: 150 },
							{ id: '141', name: 'Upcoming Conference\'s Name 2',duration: 54 },
							{ id: '152', name: 'Upcoming Conference\'s Name 3',duration: 128 },
							{ id: '120', name: 'Upcoming Conference\'s Name 4',duration: 314 },
							{ id: '129', name: 'Upcoming Conference\'s Name 5',duration: 159 },
							{ id: '128', name: 'Upcoming Conference\'s Name 6',duration: 211 },
							{ id: '127', name: 'Upcoming Conference\'s Name 7',duration: 121 },
							{ id: '125', name: 'Upcoming Conference\'s Name 8',duration: 947 },
							{ id: '124', name: 'Upcoming Conference\'s Name 9',duration: 231 }
						]}),
				activeConfView = $(monster.template(self, 'activeConferences', data));

				self.bindActiveConference(activeConfView, data);

			parent
				.find('.right-content')
				.empty()
				.append(activeConfView);

			self.searchAsYouType('active', parent);
		},

		bindActiveConference: function(parent, data) {
			var self = this,
				mapTimers = {};

			_.each(data.conferences, function(conference) {
				mapTimers[conference.id] = {
					duration: conference.duration,
					timer: {}
				};

				mapTimers[conference.id].timer = setInterval(function() {
					target = parent.find('[data-id="'+conference.id+'"] td.duration');

					mapTimers[conference.id].duration++;

					/* As long as the page is displayed */
					if(parent.find('#active_conferences_content').size() > 0) {
						target.html(monster.util.friendlyTimer(mapTimers[conference.id].duration));
					}
					else {
						clearInterval(mapTimers[conference.id].timer);
						delete mapTimers[conference.id];
					}
				}, 1000);
			});

			parent.find('.view-conference').on('click', function() {
				//self.renderViewConference($(this).parents('tr').first().data('id'));
				console.log('click');
				self.renderViewConference('838934b5a23c210681eaadb89d0fb8ad');
			});
		},

		formatActiveConference: function(data) {
			_.each(data.conferences, function(conference) {
				conference.friendlyDuration = monster.util.friendlyTimer(conference.duration);
			});

			return data;
		},

		renderUpcomingConferences: function(parent) {
			var self = this;

			monster.request({
				resource: 'conferences.list',
				data: {
					accountId: self.accountId
				},
				success: function(data, status) {
					var conferences = self.formatUpcomingConferences(data.data),
						upcomingConfView = $(monster.template(self, 'upcomingConferences', { conferences: conferences }));

					self.bindUpcomingConferencesEvents(upcomingConfView, parent);

					parent
						.find('.right-content')
						.empty()
						.append(upcomingConfView);
				}
			});
		},

		formatUpcomingConferences: function(conferences) {
			var currentTimestamp = monster.util.dateToGregorian(new Date()),
				result = [];

			_.each(conferences, function(item) {
				if(item.start > currentTimestamp) {
					var timestamp = monster.util.toFriendlyDate(item.start, 'standard');

					item.date = timestamp.match(/([0-9]+)\/([0-9]+)/)[0];
					item.startTime = timestamp.match(/([0-9]+):([0-9]+)\s(AM|PM)/)[0];
					result.push(item);
				}
			});

			result.sort(function(a,b) {
				return a.start - b.start;
			});

			return result;
		},

		bindUpcomingConferencesEvents: function(parent, appContainer) {
			var self = this;

			self.searchAsYouType('upcoming', parent);

			parent.find('.edit-conference-link').on('click', function(e) {
				self.editConference(appContainer, $(this).data('id'));
			});
		},

		refreshCallinNumbers: function(parent, data) {
			var self = this;

			var callinNumbersRows = $(monster.template(self, 'callinNumbersRows', data));

			parent
				.find('#callin_conferences_content tbody')
				.empty()
				.append(callinNumbersRows);
		},

		renderCallinNumbers: function(parent) {
			var self = this;

			monster.request({
				resource: 'conferences.listConferencesServers',
				data: {
					accountId: self.accountId
				},
				success: function(listConferencesServers) {
					var getConferencesServer = function(conferencesServerId) {
						monster.request({
							resource: 'conferences.getConferencesServer',
							data: {
								conferencesServerId: conferencesServerId,
								accountId: self.accountId
							},
							success: function(data) {
								var callinNumbersView = $(monster.template(self, 'callinNumbers', data.data));

								self.refreshCallinNumbers(callinNumbersView, data.data);

								self.bindCallinNumbersEvents(callinNumbersView, parent, data.data);

								parent
									.find('.right-content')
									.empty()
									.append(callinNumbersView);
							}
						});
					};

					if(listConferencesServers.data.length === 0) {
						monster.request({
							resource: 'conferences.createConferencesServer',
							data: {
								accountId: self.accountId,
								data: {
									name: 'Conference Server',
									numbers: {}
								}
							},
							success: function(conferencesServer) {
								getConferencesServer(conferencesServer.data.id);
							}
						});
					}
					else {
						getConferencesServer(listConferencesServers.data[0].id);
					}
				}
			});
		},

		renderAddCallinNumberDialog: function(parent, conferencesServerId) {
			var self = this,
				dialog = monster.ui.dialog(monster.template(self, 'addCallinNumberPopup'), {
					dialogClass: 'conference-dialog',
					dialogType: 'conference',
					title: self.i18n.active().popupTitles.callinNumber
				});

			dialog.find('#add_number').on('click', function() {
				var number = monster.util.unformatPhoneNumber(dialog.find('.phone-number').val());

				monster.request({
					resource: 'conferences.getConferencesServer',
					data: {
						conferencesServerId: conferencesServerId,
						accountId: self.accountId
					},
					success: function(data) {
						data.data.numbers[number] = {};

						monster.request({
							resource: 'conferences.updateConferencesServer',
							data: {
								conferencesServerId: conferencesServerId,
								accountId: self.accountId,
								data: data.data
							},
							success: function(data) {
								var templateToastr = monster.template(self, '!' + self.i18n.active().toastrMessages.successAddCallin, { number: monster.util.formatPhoneNumber(number) });

								toastr.success(templateToastr);

								dialog.dialog('destroy').remove();

								self.refreshCallinNumbers(parent, data.data);
							}
						});
					}
				});
			});
		},

		bindCallinNumbersEvents: function(parent, appContainer, data) {
			var self = this;

			self.searchAsYouType('callin', parent, 'phoneNumber');

			parent.find('#add_callin_number').on('click', function() {
				self.renderAddCallinNumberDialog(parent, data.id);
			});

			parent.on('click', '.remove-callin-number', function() {
				var number = $(this).parents('tr').data('id');

				delete data.numbers[number];

				monster.request({
                    resource: 'conferences.updateConferencesServer',
                    data: {
                        conferencesServerId: data.id,
                        accountId: self.accountId,
                        data: data
                    },
                    success: function(data) {
                        var templateToastr = monster.template(self, '!' + self.i18n.active().toastrMessages.successDeleteCallin, { number: monster.util.formatPhoneNumber(number) });

                        toastr.success(templateToastr);

                        self.refreshCallinNumbers(parent, data.data);
                    }
                });
			});
		},

		searchAsYouType: function(type, parent, searchType) {
			parent.find('#' + type + '_conferences_content .header input').on('keyup', function() {
				var self = $(this),
					search;

				if(searchType && searchType === 'phoneNumber') {
					search = monster.util.unformatPhoneNumber(self.val().toLowerCase());
				}
				else {
					search = self.val().toLowerCase();
				}

				if(search) {
					var row,
						rowValue;

					_.each(parent.find('tbody tr'), function(row) {
						row = $(row);

						rowValue = row.data('search').toString();

						if(rowValue) {
							rowValue = rowValue.toLowerCase();

							rowValue.indexOf(search) >= 0 ? row.show() : row.hide();
						}
					});
				}
				else {
					parent.find('tbody tr').show();
				}
			});
		},

		renderCustomizeNotifications: function(parent) {
			var self = this,
				customizeNotificationsView = monster.template(self, 'customizeNotifications'),
				data = {
						email: '<i>email</i> <b>data</b>',
						updates: '<i>updates</i> <b>data</b>',
						summary: '<i>summary</i> <b>data</b>'
					};

			parent
				.find('.right-content')
				.empty()
				.append(customizeNotificationsView);

			self.renderWysiwyg(parent, data);

			self.bindCustomizeNotificationsEvents(parent, data);
		},

		bindCustomizeNotificationsEvents: function(parent, data) {
			var self = this,
				parent = parent.find('#customize_notifications_content');

			parent.find('.switch-link').on('click', function() {
				if (!$(this).hasClass('active')) {
					parent.find('.switch-link.active').removeClass('active');
					$(this).addClass('active');
				}
				self.loadWysiwygContent(parent, data);
			});

			parent.find('> button').on('click', function() {
				for (var key in data) {
					if (key == parent.find('.switch-link.active').data('link')) {
						data[key] = parent.find('#editor')[0].innerHTML;
					};
				}
			});
		},

		renderWysiwyg: function(parent, data) {
			var self = this,
				parent = parent.find('#customize_notifications_content'),
				fonts = ['Serif','Sans','Arial','Arial Black','Courier','Courier New','Comic Sans MS','Helvetica','Impact','Lucida Grande','Lucida Sans','Tahoma','Times','Times New Roman','Verdana'],
				fontTarget = parent.find('[data-original-title=Font]').siblings('.dropdown-menu'),
				msg = '';

			$.each(fonts, function (idx, val) {
				fontTarget.append($('<li><a data-edit="fontName ' + val +'" style="font-family:\'' + val + '\'">' + val + '</a></li>'));
			});

			parent.find('a[title]').tooltip({container:'body'});

			parent.find('.dropdown-menu input').click(function () {
						return false;
					})
					.change(function () {
						$(this).parent('.dropdown-menu').siblings('.dropdown-toggle').dropdown('toggle');
					})
					.keydown('esc', function () {
						this.value='';
						$(this).change();
					}
			);

			parent.find('#editor').wysiwyg({ fileUploadError: function(reason, detail) {
				if (reason==='unsupported-file-type') {
					msg = "Unsupported format " + detail;
				} else {
					console.log("error uploading file", reason, detail);
				}
				$('<div class="alert"> <button type="button" class="close" data-dismiss="alert">&times;</button>' + '<strong>File upload error</strong> ' + msg + ' </div>').prependTo('#alerts');
			}});

			self.loadWysiwygContent(parent, data);
		},

		loadWysiwygContent: function(parent, data) {
			for (var key in data) {
				if (key = parent.find('.switch-link.active').data('link')) {
					parent.find('#editor').html(data[key]);
				}
			}
		},

		renderNewConference: function(parent) {
			var self = this;

			monster.request({
				resource: 'conferences.getPins',
				data: {
					accountId: self.accountId
				},
				success: function(data, status) {
					var conference = {
							participants: [],
							pins: {
								moderator: data.data[0],
								member: data.data[1]
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
						appContainer: parent,
						conference: conference
					});


					parent.find('.right-content')
						.empty()
						.append(conferenceTemplate);
				}
			});
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
						appContainer: parent,
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
				type = isModerator ? 'moderator' : 'member',
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
		 * - appContainer
		 * - conference
		 */
		bindNewConferenceEvents: function(params) {
			var self = this,
				parent = params.parent,
				appContainer = params.appContainer,
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
							self.conferenceAlert(self.i18n.active().popupMessages.participantEmailDuplicateAlert);
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
					self.conferenceAlert(self.i18n.active().popupMessages.mandatoryConferenceNameAlert);
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
									var currentTimestamp = monster.util.dateToGregorian(new Date());
									toastr.success(self.i18n.active().toastrMessages.newConferenceSuccess);

									appContainer.find('.left-menu .nav-item').removeClass('active');
									if(newConference.start > currentTimestamp) {
										self.renderUpcomingConferences(appContainer);
										appContainer.find('#upcoming_conferences').addClass('active');
									} else {
										self.renderActiveConference(appContainer);
										appContainer.find('#active_conferences').addClass('active');
									}
								},
								error: function(data, status) {
									toastr.error(self.i18n.active().toastrMessages.newConferenceError);
								}
							});
						};

						if(newConference.participants.length <= 0) {
							self.conferenceConfirm(self.i18n.active().popupMessages.noParticipantConfirm, function() {
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
					self.conferenceAlert(self.i18n.active().popupMessages.mandatoryConferenceNameAlert);
				} else {
					if(parent.find('.switch-link.active').data() === 'now') {
						newConference.start = monster.util.dateToGregorian(new Date());
					} else {
						function updateConference() {
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
									var currentTimestamp = monster.util.dateToGregorian(new Date());
									toastr.success(self.i18n.active().toastrMessages.updateConferenceSuccess);

									appContainer.find('.left-menu .nav-item').removeClass('active');
									if(newConference.start > currentTimestamp) {
										self.renderUpcomingConferences(appContainer);
										appContainer.find('#upcoming_conferences').addClass('active');
									} else {
										self.renderActiveConference(appContainer);
										appContainer.find('#active_conferences').addClass('active');
									}
								},
								error: function(data, status) {
									toastr.error(self.i18n.active().toastrMessages.updateConferenceError);
								}
							});
						};

						if(newConference.participants.length <= 0) {
							self.conferenceConfirm(self.i18n.active().popupMessages.noParticipantConfirm, function() {
								updateConference();
							});
						} else {
							updateConference();
						}
					}
				}
			});

			parent.find('#cancel_conference_btn').on('click', function(e) {
				e.preventDefault();
				self.conferenceConfirm(self.i18n.active().popupMessages.deleteConferenceConfirm, function() {
					monster.request({
						resource: 'conferences.delete',
						data: {
							accountId: self.accountId,
							conferenceId: conference.id,
							data: {}
						},
						success: function(data, status) {
							toastr.success(self.i18n.active().toastrMessages.deleteConferenceSuccess);
							self.renderUpcomingConferences(appContainer);
						},
						error: function(data, status) {
							toastr.error(self.i18n.active().toastrMessages.deleteConferenceError);
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
					dialogClass: "conference-dialog",
					dialogType: "conference",
					onClose: function() {
						ok ? callbackOk && callbackOk(participant) : callbackCancel && callbackCancel();
					}
				},
				ok = false,
				participant = {};

			options.title = '<i class="icon-user icon-large adduser-user-icon"></i>'
						  + '<i class="icon-plus icon-small adduser-plus-icon"></i>';
			if(!participantType) {
				options.title += self.i18n.active().popupTitles.participant;
			} else if(participantType === "member") {
				options.title += self.i18n.active().popupTitles.member;
			} else if(participantType === "moderator") {
				options.title += self.i18n.active().popupTitles.moderator;
			}

			dialog = monster.ui.dialog(template, options);

			template.find('#add_participant_btn').on('click', function(e) {
				e.preventDefault();
				participant = form2object('add_new_participant_form');
				participant.moderator = (template.find('input:radio[name="moderator"]:checked').val() === 'true');

				if(!participant.email) {
					self.conferenceAlert(self.i18n.active().popupMessages.mandatoryParticipantEmailAlert);
				} else {
					ok = true;
					dialog.dialog('close');
				}
			});

			return dialog;
		},

		renderViewConference: function(conferenceId) {
			var self = this,
				parent = $('#conferences_container'),
				renderView = function() {
					var defaults = {};

					monster.parallel({
						status: function(callback) {
							monster.request({
								resource: 'conferences.view',
								data: {
									accountId: self.accountId,
									conferenceId: conferenceId
								},
								success: function(data) {
									callback(null, data.data);
								}
							});
						},
						conference: function(callback) {
							monster.request({
								resource: 'conferences.get',
								data: {
									accountId: self.accountId,
									conferenceId: conferenceId
								},
								success: function(data) {
									callback(null, data.data);
								}
							});
						}
					},
					function(err, results) {
						var dataTemplate = self.formatViewConference(results),
							conferenceView = $(monster.template(self, 'viewConference', dataTemplate));

						parent
							.find('#conference_viewer')
							.empty()
							.append(conferenceView);

						self.bindViewConference(parent, dataTemplate);

						parent
							.find('.menu')
							.hide();

						parent
							.find('#conference_viewer')
							.fadeIn('slow');
						}
					);
				};

			monster.socket.emit('connection_status');

			monster.socket.once('connection_status', function(isConnected) {
				if(!isConnected) {
					monster.socket.emit('connection', {'conference_id': conferenceId, 'user_name': self.userId});

					monster.socket.on('connected', function() {
						renderView();
					});
				}
				else {
					renderView();
				}
			});
		},

		formatUserViewConference: function(user) {
			var formattedUser = {},
				//randomImages = [ 'jean', 'james', 'karl', 'peter', 'darren', 'dhruvi', 'patrick', 'xavier' ];
				randomImages = [ 'meme21', 'meme22', 'meme23', 'meme24', 'meme25', 'meme26', 'meme27', 'meme28' ];

			formattedUser.id = user['Call-ID'] || user.call_id;
			formattedUser.isMuted = user['Mute-Detect'] || user.mute_detect;
			formattedUser.isSpeaking = user['Speak'] || user.speak;
			formattedUser.isDeaf = 'Hear' in user ? !(user['Hear']) : !(user.hear);
			formattedUser.name = user['Caller-ID-Name'] || user.caller_id_name;
			formattedUser.isAdmin = user['Is-Moderator'] || user.is_moderator;
			formattedUser.imageRef = randomImages[Math.floor(Math.random()*randomImages.length)];

			return formattedUser;
		},

		formatViewConference: function(data) {
			var self = this,
				formattedData = {
					users: [],
					moderator_pin: '123456',
					member_pin: '654321'
				};

			formattedData.elapsedTime = monster.util.friendlyTimer(data.status['Run-Time']);
			formattedData.rawElapsedTime = data.status['Run-Time'];
			formattedData.name = data.conference.name;
			formattedData.id = data.conference.id;

			_.each(data.status['Participants'], function(user) {
				formattedData.users.push(self.formatUserViewConference(user));
			});

			/* Sort by admin */
			formattedData.users.sort(function(a, b) {
				return a.isAdmin === true ? -1 : 1;
			});

			return formattedData;
		},

		/* Expected Args:
			action,
			conferenceId,
			participantId,
			successCallback
		*/
		actionUser: function(args) {
			var self = this;

			monster.request({
				resource: 'conferences.' + args.action + 'Participant',
				data: {
					conferenceId: args.conferenceId,
					accountId: self.accountId,
					participantId: args.participantId,
					data: {}
				},
				success: function(data) {
					args.success && args.success(data);
				}
			});
		},

		bindViewConference: function(parent, data) {
			var self = this,
				time = data.rawElapsedTime,
				target,
				interval = setInterval(function() {
					target = parent.find('.timerjs');

					time++;

					/* As long as the page is displayed */
					if(parent.find('.info:visible').size() > 0) {
						target.html(monster.util.friendlyTimer(time));
					}
					else {
						clearInterval(interval);
					}
				}, 1000);

			parent.find('[data-toggle="tooltip"]').tooltip();

			/* Prevent bug on iPad for tooltips */
			parent.find('[data-toggle="tooltip"]').on('show', function (e) {
				if ('ontouchstart' in document.documentElement) e.preventDefault()
			});

			parent.find('.action-conference.togglable').on('click', function() {
				$(this).toggleClass('active');
			});

			parent.find('.action-conference[data-action="add-user"]').on('click', function() {
				self.showAddParticipantPopup(function(participant) {
					console.log(participant);
				});
			});

			var quitConferenceViewer = function() {
				monster.socket.emit('disconnection');

				parent
					.find('#conference_viewer')
					.hide();

                parent
                    .find('.menu')
                    .fadeIn('slow');

                parent
                    .find('#conference_viewer')
                    .hide();
			};

			parent.find('.action-conference[data-action="hangup"]').on('click', function() {
				quitConferenceViewer();
			});

			parent.on('click', '.action-user', function() {
				var actionBox = $(this),
					prefix = actionBox.hasClass('active') ? 'un' : '',
					action = prefix + actionBox.data('action'),
					participantId = actionBox.parents('.user').data('id'),
					conferenceId = data.id;

				self.actionUser({
					action: action,
					participantId: participantId,
					conferenceId: conferenceId
				});
			});

			var ifStillUsingConference = function(callback) {
				if(parent.find('#view_conference:visible').size() === 0) {
					monster.socket.emit('disconnection')
				}
				else {
					callback();
				}
			};

			monster.socket.once('add_member', function(user, data) {
				ifStillUsingConference(function() {
					var dataUser = self.formatUserViewConference(data),
					userTemplate = monster.template(self, 'boxUser', dataUser);

					parent.find('#view_conference .content').append(userTemplate);
				});
			});

			monster.socket.once('conference_destroy', function(conferenceId) {
				if(data.id === conferenceId) {
					toastr.warning(self.i18n.active().toastrMessages.almostDoneConference);

					setTimeout(function() {
						toastr.success(self.i18n.active().toastrMessages.destroyedConference);

						quitConferenceViewer();
					}, 5000);
				}
			});

			monster.socket.once('del_member', function(user, data) {
				ifStillUsingConference(function() {
					parent.find('.user[data-id="'+ user + '"]').remove();
				});
			});

			monster.socket.once('mute_member', function(user, data) {
				console.log('mute_member');
				ifStillUsingConference(function() {
					parent.find('.user[data-id="'+ user + '"] .action-user[data-action="mute"]').addClass('active');
				});
			});

			monster.socket.once('unmute_member', function(user, data) {
				console.log('unmute_member');
				ifStillUsingConference(function() {
					parent.find('.user[data-id="'+ user + '"] .action-user[data-action="mute"]').removeClass('active');
				});
			});

			monster.socket.once('deaf_member', function(user, data) {
				console.log('deaf_member');
				ifStillUsingConference(function() {
					parent.find('.user[data-id="'+ user + '"] .action-user[data-action="deaf"]').addClass('active');
				});
			});

			monster.socket.once('undeaf_member', function(user, data) {
				console.log('undeaf_member');
				ifStillUsingConference(function() {
					parent.find('.user[data-id="'+ user + '"] .action-user[data-action="deaf"]').removeClass('active');
				});
			});

			monster.socket.once('start_talking', function(user, data) {
				console.log('start_talking');
				ifStillUsingConference(function() {
					parent.find('.user[data-id="'+ user + '"] .currently-speaking').addClass('active');
				});
			});

			monster.socket.once('stop_talking', function(user, data) {
				console.log('stop_talking');
				ifStillUsingConference(function() {
					parent.find('.user[data-id="'+ user + '"] .currently-speaking').removeClass('active');
				});
			});
		},

		conferenceAlert: function(type, content, callback) {
			return monster.ui.alert(type, content, callback, { dialogClass: "conference-dialog", dialogType: "conference" });
		},

		conferenceConfirm: function(content, callbackOk, callbackCancel) {
			var dialog = monster.ui.confirm(content, callbackOk, callbackCancel, { dialogClass: "conference-dialog", dialogType: "conference" });
			dialog.find('.btn').removeClass('btn').addClass('conf-btn');
			dialog.find('.btn-danger').removeClass('btn-danger');
			dialog.find('.btn-success').removeClass('btn-success').addClass('blue-btn');
			return dialog;
		}
	};

	return app;
});
