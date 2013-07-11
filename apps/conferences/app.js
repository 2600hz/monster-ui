define(function(require){
	var $ = require('jquery'),
		_ = require('underscore'),
		monster = require('monster'),
		socket = require('socket');

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
				self.renderViewConference($(this).parents('tr').first().data('id'));
			});
		},
		formatActiveConference: function(data) {
			_.each(data.conferences, function(conference) {
				conference.friendlyDuration = monster.util.friendlyTimer(conference.duration);
			});

			return data;
		},
		renderUpcomingConferences: function(parent) {
			var self = this,
				data = self.formatUpcomingConferences(
						{ conferences: [
							{ name: 'Upcoming Conference\'s Name 0',timestamp: 1982073630,moderatorPin: '161427',memberPin: '194212' },
							{ name: 'Upcoming Conference\'s Name 1',timestamp: 1982077230,moderatorPin: '168143',memberPin: '124881' },
							{ name: 'Upcoming Conference\'s Name 2',timestamp: 1982080830,moderatorPin: '188445',memberPin: '122869' },
							{ name: 'Upcoming Conference\'s Name 3',timestamp: 1982084430,moderatorPin: '148621',memberPin: '173447' },
							{ name: 'Upcoming Conference\'s Name 4',timestamp: 1982088030,moderatorPin: '161427',memberPin: '194212' },
							{ name: 'Upcoming Conference\'s Name 5',timestamp: 1982091630,moderatorPin: '161427',memberPin: '194212' },
							{ name: 'Upcoming Conference\'s Name 6',timestamp: 1982095230,moderatorPin: '161427',memberPin: '194212' },
							{ name: 'Upcoming Conference\'s Name 7',timestamp: 1982098830,moderatorPin: '161427',memberPin: '194212' },
							{ name: 'Upcoming Conference\'s Name 8',timestamp: 1982102430,moderatorPin: '161427',memberPin: '194212' },
							{ name: 'Upcoming Conference\'s Name 9',timestamp: 1982106030,moderatorPin: '161427',memberPin: '194212' }
						]}),
				upcomingConfView = monster.template(self, 'upcomingConferences', data);

			parent
				.find('.right-content')
				.empty()
				.append(upcomingConfView);

			parent.find('#upcoming_conferences_content .header input').on('keyup', function() {
				var self = $(this),
					search = self.val();

				if(search) {
					$.each(parent.find('tbody tr'), function() {
						var td= $(this).find('td:first-child'),
							val = $(this).data('name').toLowerCase();
						console.log(val, $(this));
						if(val.indexOf(search.toLowerCase()) >= 0) {
							$(this).show();
						} else {
							$(this).hide();
						}
					});
				} else {
					parent.find('tbody tr').show();
				}
			});
		},
		formatUpcomingConferences: function(data) {
			var conferences = data.conferences;

			for(var key in conferences) {
				var item = conferences[key];
					timestamp = monster.util.toFriendlyDate(item.timestamp);

				item.date = timestamp.match(/([0-9]+)\/([0-9]+)/)[0];
				item.startTime = timestamp.match(/([0-9]+):([0-9]+)\s(AM|PM)/)[0];
			}

			data.conferences.sort(function(a,b) {
				return a.timestamp - b.timestamp;
			});

			return data;
		},
		renderCallinNumbers: function(parent) {
			var self = this,
				data = {
					numbers: {
						0: { number: '+1 (415) 123-456'},
						1: { number: '+1 (813) 123-456'},
						2: { number: '+1 (236) 123-456'},
						3: { number: '+1 (734) 123-456'},
						4: { number: '+1 (665) 123-456'},
						5: { number: '+1 (542) 123-456'},
						6: { number: '+1 (102) 123-456'},
						7: { number: '+1 (442) 123-456'},
						8: { number: '+1 (401) 123-456'},
						9: { number: '+1 (565) 123-456'}
					}
				},
				callinNumbersView = monster.template(self, 'callinNumbers', data);

			parent
				.find('.right-content')
				.empty()
				.append(callinNumbersView);
		},
		searchAsYouType: function(item, parent) {
			parent.find('#' + item + '_conferences_content .header input').on('keyup', function() {
				var self = $(this),
					search = self.val();

				if(search) {
					$.each(parent.find('.list-element'), function() {
						if($(this).find('td:first-child').html().toLowerCase().indexOf(search.toLowerCase()) >= 0) {
							$(this).show();
						} else {
							$(this).hide();
						}
					});
				} else {
					parent.find('.list-element').show();
				}
			});
		},
		renderCustomizeNotifications: function(parent) {
			var self = this;
		},
		renderNewConference: function(parent) {
			var self = this;
		},

		renderViewConference: function(conferenceId) {
			var self = this,
				parent = $('#conferences_container'),
				dataTemplate = {
					name: 'JR\'s Conference',
					moderator_pin: '123456',
					member_pin: '939201',
					rawElapsedTime: 459,
					users: [
						{ name: 'JR', isDeaf: false, isMuted: false, isSpeaking: true, isAdmin: true, imageRef: 'jean' },
						{ name: 'James', isDeaf: false, isMuted: false, isSpeaking: false, isAdmin: false, imageRef: 'james' },
						{ name: 'Karl', isDeaf: true, isMuted: false, isSpeaking: false, isAdmin: false, imageRef: 'karl' },
						{ name: 'Peter', isDeaf: false, isMuted: true, isSpeaking: false, isAdmin: false, imageRef: 'peter' },
						{ name: 'Darren', isDeaf: false, isMuted: false, isSpeaking: false, isAdmin: true, imageRef: 'darren' },
						{ name: 'Dhruvi', isDeaf: false, isMuted: false, isSpeaking: true, isAdmin: false, imageRef: 'dhruvi' },
						{ name: 'Patrick', isDeaf: true, isMuted: false, isSpeaking: false, isAdmin: false, imageRef: 'patrick' },
						{ name: 'Xavier', isDeaf: false, isMuted: true, isSpeaking: false, isAdmin: false, imageRef: 'xavier' }
					]
				};

			dataTemplate = self.formatViewConference(dataTemplate);

			var	conferenceView = $(monster.template(self, 'viewConference', dataTemplate));

			parent
				.find('#conference_viewer')
				.empty()
				.append(conferenceView);

			self.bindViewConference(parent, dataTemplate);

			parent
				.find('.menu, .right-content')
				.hide();

			parent
				.find('#conference_viewer')
				.show();
		},

		formatViewConference: function(data) {
			data.elapsedTime = monster.util.friendlyTimer(data.rawElapsedTime);

			/* Sort by admin */
			data.users.sort(function(a, b) {
				return a.isAdmin === true ? -1 : 1;
			});

			return data;
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

			parent.find('.action-conference[data-action="hangup"]').on('click', function() {
				parent
					.find('#conference_viewer')
					.hide();

				parent
					.find('.menu')
					.show();

				parent
					.find('.right-content')
					.show();
			});

			parent.find('.action-user.togglable').on('click', function() {
				$(this).toggleClass('active');
			});
		}
	};

	return app;
});
