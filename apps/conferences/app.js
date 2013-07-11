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
			var self = this;
		},
		renderUpcomingConferences: function(parent) {
			var self = this;
		},
		renderCallinNumbers: function(parent) {
			var self = this;
		},
		renderCustomizeNotifications: function(parent) {
			var self = this;

			self.renderViewConference(parent);
		},
		renderNewConference: function(parent) {
			var self = this;
		},

		renderViewConference: function(parent) {
			var self = this,
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
				.find('.menu')
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
			});

			parent.find('.action-user.togglable').on('click', function() {
				$(this).toggleClass('active');
			});
		}
	};

	return app;
});
