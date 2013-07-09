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
		}
	};

	return app;
});
