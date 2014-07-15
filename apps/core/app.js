define(function(require){
	var $ = require('jquery'),
		_ = require('underscore'),
		monster = require('monster');

	var app = {
		name: 'core',

		i18n: [ 'en-US', 'fr-FR' ],

		requests: {},

		subscribe: {
			'core.loadApps': '_loadApps',
			'core.showAppName' : 'showAppName'
		},

		//List of apps required once the user is logged in (LIFO)
		_baseApps: ['apploader', 'appstore', 'myaccount', 'common'],

		//Default app to render if the user is logged in, can be changed by setting a default app
		_defaultApp: 'appstore',

		// Global var used to show the loading gif
		requestAmount: 0,

		load: function(callback){
			var self = this;

			callback(this);
		},

		render: function(container){
			var self = this,
				mainTemplate = $(monster.template(self, 'app', {}));
				
			document.title = 'Monster UI - ' + monster.config.company.name;

			self.bindEvents(mainTemplate);

			self.displayVersion(mainTemplate);
			self.displayLogo(mainTemplate);

			container.append(mainTemplate);

			self.loadAuth(); // do this here because subsequent apps are dependent upon core layout
		},

		loadAuth: function(){
			var self = this;

			monster.apps.load('auth', function(app){
				app.render($('#ws-content'));
			});
		},

		showAppName: function(appName) {
			var self = this,
				navbar = $('#ws-navbar'),
				defaultApp;

			_.each(monster.apps.auth.installedApps, function(val) {
				if ( val.name === appName ) {
					defaultApp = val;
				}
			});

			if ( appName === 'appstore' ) {
				navbar.find('.current-app').empty();
			} else if ( navbar.find('.current-app').is(':empty') ) {
				navbar
					.find('.current-app')
					.append(monster.template(self, 'current-app', defaultApp));

				navbar.find('.active-app').fadeIn(100);
			} else {
				navbar.find('.active-app').fadeOut(100, function() {
					navbar
						.find('.current-app')
						.empty()
						.append(monster.template(self, 'current-app', defaultApp));

					navbar.find('.active-app').fadeIn(100);
				});
			}
		},

		_loadApps: function(args) {
			var self = this;

			if(!self._baseApps.length) {
				/* If admin with no app, go to app store, otherwise, oh well... */
				var defaultApp = monster.apps['auth'].currentUser.priv_level === 'admin' ? args.defaultApp || self._defaultApp : args.defaultApp;
				
				if(typeof defaultApp !== 'undefined') {
					monster.apps.load(defaultApp, function(app) {
						self.showAppName(defaultApp);
						app.render($('#ws-content'));
					});
				}
				else {
					console.warn('Current user doesn\'t have a default app');
				}
			}
			else {
				var appName = self._baseApps.pop();

				monster.apps.load(appName, function(app) {
					self._loadApps(args);
				});
			}
		},

		bindEvents: function(container) {
			var self = this,
				spinner = container.find('.loading-wrap');

			/* Only subscribe to the requestStart and End event when the spinner is loaded */
			monster.sub('monster.requestStart', function() {
				self.onRequestStart(spinner);
			});

			monster.sub('monster.requestEnd', function() {
				self.onRequestEnd(spinner);
			});

			container.find('#home_link').on('click', function(e) {
				e.preventDefault();
				monster.pub('apploader.toggle');
			});

			container.find('a.signout').on('click', function() {
				monster.pub('auth.clickLogout');
			});

			container.find('#ws-navbar .current-app').on('click', function() {
				monster.apps.load($(this).find('.active-app').data('name'), function(app) {
					app.render();
				});
			});

			if(monster.config.hasOwnProperty('nav')) {
				if(monster.config.nav.hasOwnProperty('help')) {
					container.find('#ws-navbar a.help')
							 .unbind('click')
							 .attr('href', monster.config.nav.help);
				}

				if(monster.config.nav.hasOwnProperty('logout')) {
					container.find('#ws-navbar .links .logout')
							 .unbind('click')
							 .attr('href', monster.config.nav.logout);
				}
			}
		},

		displayVersion: function(container) {
			var self = this;

			monster.getVersion(function(version) {
				container.find('.footer-wrapper .tag-version').html('('+version+')');

				monster.config.version = version;
			});
		},

		displayLogo: function(container) {
			var self = this,
				domain = window.location.hostname,
				apiUrl = monster.config.api.default;

			self.callApi({
				resource: 'whitelabel.getLogo',
				data: {
					domain: domain,
					generateError: false,
					dataType: '*'
				},
				success: function(_data) {
					container.find('#ws-navbar .logo').css('background-image', 'url(' + apiUrl + 'whitelabel/' + domain + '/logo?_='+new Date().getTime()+')');
				},
				error: function(error) {
					container.find('#ws-navbar .logo').css('background-image', 'url("apps/core/static/images/logo.png")');
				}
			});
		},

		onRequestStart: function(spinner) {
			var self = this;

			if(self.requestAmount === 0) {
				spinner.addClass('active');
			}

			self.requestAmount++;
		},

		onRequestEnd: function(spinner) {
			var self = this;

			if(--self.requestAmount === 0) {
				spinner.removeClass('active');
			}
		}
	};

	return app;
});
