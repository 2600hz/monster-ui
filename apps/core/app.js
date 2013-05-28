define(function(require){
	var $ = require('jquery'),
		_ = require('underscore'),
		monster = require('monster'),
		toaster = require('toastr');

	var app = {

		name: 'core',

		i18n: [ 'en-US', 'fr-FR' ],

		requests: {
			'layout.getLogo': {
				url: 'whitelabel/{domain}/logo',
				dataType: '*',
				verb: 'GET'
			}
		},

		subscribe: {
			'auth.loadApps': '_loadApps',
			'app.nav.add': function(data){
				console.log(data);
			},
			'app.nav.context.add': function(data){
				console.log(data);
			}
		},

		load: function(callback){
			var self = this;

			callback(this);
		},

		render: function(container){
			var self = this,
				template = monster.template(self, 'app', {}),
				content = $(template);

			document.title = 'Monster UI - ' + monster.config.company.name;

			container.append(content);

			self._render(container);

			if(!$.cookie('monster-auth')) {
				self._welcome(content);
			}

			if('nav' in monster.config) {
				if('help' in monster.config.nav || 'myHelp' in monster.config.nav) {
					$('#ws-navbar a.help').unbind('click')
						.attr('href', monster.config.nav.help || monster.config.nav.my_help);
				}

				if('logout' in monster.config.nav || 'myLogout' in monster.config.nav) {
					$('#ws-navbar .links .logout').unbind('click')
						.attr('href', monster.config.nav.logout || monster.config.nav.my_logout);
				}

			}

			self._load(); // do this here because subsequent apps are dependent upon core layout
		},

		_apps: ['auth'], // FILO //'pbxs', 'myaccount',

			//List of apps required once the user is logged in
			_baseApps: [],//['myaccount', 'app_store'],

			//Default app to render if the user is logged in, can be changed by setting a default app
			_defaultApp: 'app_store',

		_load: function(){
			var self = this;

			if(!self._apps.length){
				return;
			}

			var appName = self._apps.pop();

			monster._loadApp(appName, function(app){
				app.render($('#ws-content'));
				self._load();
			});
		},

		_loadApps: function(args) {
			var self = this;

			if(!self._baseApps.length) {
				var defaultApp = args.defaultApp.id || self._defaultApp;

				monster._loadApp(defaultApp, function(app) {
					app.render($('#ws-content'));
				});
			}
			else {
				var appName = self._baseApps.pop();

				monster._loadApp(appName, function(app) {
					self._loadApps(args);
				});
			}
		},

		_render: function(container) {
			var self = this,
				domain = window.location.hostname,
				apiUrl = monster.config.api.default,
				homeLink = $('#home_link');

			homeLink.on('click', function() {
				if($.cookie('monster-auth')) {
					monster.pub('auth.landing');
				}
			});

			monster.getVersion(function(version) {
				$('.footer_wrapper .tag_version').html('('+version.replace(/\s/g,'')+')');
			});

			container.find('#ws-navbar .logo').click(function() {
				if($.cookie('monster-auth')) {
					monster.pub('auth.landing');
				}
			});

			monster.request({
				resource: 'layout.getLogo',
				data: {
					domain: domain
				},
				success: function(_data) {
					container.find('#ws-navbar .logo').css('background-image', 'url(' + apiUrl + '/whitelabel/' + domain + '/logo?_='+new Date().getTime()+')');
				},
				error: function(error) {
					container.find('#ws-navbar .logo').css('background-image', 'url("apps/core/static/images/logo.png")');
				}
			});
		},

		_welcome: function(container) {
			var self = this,
				data = {
					companyName: monster.config.company.name || '-',
					companyWebsite: monster.config.company.website || '',
					learnMore: monster.config.nav.learnMore || 'http://www.2600hz.com/'
				};
				template = monster.template(self, 'welcome', data),
				content = $(template);

			container.append(content);

			template = monster.template(self, 'welcome-left', data);
			content = $(template);

			container.find('.left_div').append(content);
		}
	};

	return app;
});
