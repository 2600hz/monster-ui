define(function(require){
	var $ = require('jquery'),
		_ = require('underscore'),
		monster = require('monster');

	var subModules = {
			numbers: require('./submodules/numbers/numbers'),
			users: require('./submodules/users/users'),
			myOffice: require('./submodules/myOffice/myOffice'),
			strategy: require('./submodules/strategy/strategy'),
			callLogs: require('./submodules/callLogs/callLogs')
		};

	var app = {

		name: 'voip',

		i18n: [ 'en-US' ],

		requests: {
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
				parent = container || $('#ws-content'),
				template = $(monster.template(self, 'app'));

			/* On first Load, load my office */
			template.find('.category#users').addClass('active');
			monster.pub('voip.users.render', { parent: template.find('.right-content') });

			self.bindEvents(template);

			parent
				.empty()
				.append(template);
		},

		formatData: function(data) {
			var self = this;
		},

		bindEvents: function(parent) {
			var self = this,
				container = parent.find('.right-content');

			parent.find('.category').on('click', function() {
				parent
					.find('.category')
					.removeClass('active');

				container.empty();

				$(this).toggleClass('active');
			});

			parent.find('.category#my_office').on('click', function() {
				monster.pub('voip.myOffice.render', container);
			});

			parent.find('.category#users').on('click', function() {
				monster.pub('voip.users.render', { parent: container });
			});

			parent.find('.category#groups').on('click', function() {
				monster.pub('voip.groups.render', container);
			});

			parent.find('.category#numbers').on('click', function() {
				monster.pub('voip.numbers.render', container);
			});

			parent.find('.category#devices').on('click', function() {
				monster.pub('voip.devices.render', container);
			});

			parent.find('.category#strategy').on('click', function() {
				monster.pub('voip.strategy.render', container);
			});

			parent.find('.category#call_logs').on('click', function() {
				monster.pub('voip.callLogs.render', container);
			});

			parent.find('.category#quick_links').on('click', function() {
				monster.pub('voip.quickLinks.render', container);
			});
		}
	};

	$.each(subModules, function(k, subModule) {
		$.extend(true, app, subModule);
	});

	return app;
});
