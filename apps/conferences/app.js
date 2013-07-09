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
				self.renderNewConference();
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
		renderNewConference: function() {
			var self = this;
		}
	};

	return app;
});
