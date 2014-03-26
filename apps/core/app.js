define(function(require){
	var $ = require('jquery'),
		_ = require('underscore'),
		monster = require('monster');

	var app = {

		name: 'core',

		i18n: [ 'en-US', 'fr-FR' ],

		requests: {
			'layout.getLogo': {
				url: 'whitelabel/{domain}/logo',
				dataType: '*',
				verb: 'GET',
				generateError: false
			}
		},

		subscribe: {
			'core.loadApps': '_loadApps',
			'core.landing': '_landing'
		},

		load: function(callback){
			var self = this;

			callback(this);
		},

		render: function(container){
			var self = this,
				template = monster.template(self, 'app', {}),
				content = $(template),
				isLoggedIn = true;

			document.title = 'Monster UI - ' + monster.config.company.name;

			container.append(content);
			container.append(monster.template(self, 'footer'));

			self._render(container);

			if(!$.cookie('monster-auth')) {
				isLoggedIn = false;

				self._welcome(content);
			}

			var dataLinks = {
					isLoggedIn: isLoggedIn
				},
			    linksTemplate = $(monster.template(self, 'top-right-links', dataLinks));

			linksTemplate.find('a.signout').on('click', function() {
				monster.pub('auth.clickLogout');
			});

			container.find('.links').append(linksTemplate);

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

		_apps: ['auth'],

		//List of apps required once the user is logged in (LIFO)
		_baseApps: ['apploader', 'appstore', 'myaccount', 'common'],

		//Default app to render if the user is logged in, can be changed by setting a default app
		_defaultApp: 'appstore',

		_load: function(){
			var self = this;

			if(!self._apps.length){
				return;
			}

			var appName = self._apps.pop();

			monster.apps.load(appName, function(app){
				app.render($('#ws-content'));
				self._load();
			});
		},

		_loadApps: function(args) {
			var self = this;

			if(!self._baseApps.length) {
				/* If admin with no app, go to app store, otherwise, oh well... */
				var defaultApp = monster.apps['auth'].currentUser.priv_level === 'admin' ? args.defaultApp || self._defaultApp : args.defaultApp;

				if(defaultApp && defaultApp !== '') {
					monster.apps.load(defaultApp, function(app) {
						app.render($('#ws-content'));
					});
				}
				else {
					var args = {
						data: monster.apps.auth.currentUser
					};

					monster.pub('core.landing', args);
				}
			}
			else {
				var appName = self._baseApps.pop();

				monster.apps.load(appName, function(app) {
					self._loadApps(args);
				});
			}
		},

		_render: function(container) {
			var self = this,
				domain = window.location.hostname,
				apiUrl = monster.config.api.default,
				homeLink = $('#home_link'),
				renderLanding = function() {
					if(monster.config.appleConference) {
						if(monster.apps['conferences']) {
							monster.pub('conferences.show');
						} else {
							window.location.reload();
						}
					} else {
						if($.cookie('monster-auth')) {
							var args = {
								data: monster.apps.auth.currentUser
							};

							monster.pub('core.landing', args);
						}
					}
				};

			homeLink.on('click', function(e) {
				e.preventDefault();
				monster.pub('apploader.toggle');
				// monster.apps.load('apploader', function(app){
				// 	app.render();
				// });
				// renderLanding();
			});

			container.find('#ws-navbar .logo').on('click', function(e) {
				e.preventDefault();
				// renderLanding();
			});

			monster.getVersion(function(version) {
				$('.footer-wrapper .tag-version').html('('+version+')');

				monster.config.version = version;
			});

			if(monster.config.appleConference) {
				homeLink.find('i').addClass('icon-apple icon-2x');
				homeLink.addClass('conferencing');
				container.find('#ws-navbar .logo')
						 .text(self.i18n.active().conferencingLogo)
						 .addClass('conferencing');
			} else {
				//homeLink.find('i').addClass('icon-home icon-large');
				homeLink.find('i').addClass('icon-th icon-large');
				monster.request({
					resource: 'layout.getLogo',
					data: {
						domain: domain
					},
					success: function(_data) {
						container.find('#ws-navbar .logo').css('background-image', 'url(' + apiUrl + 'whitelabel/' + domain + '/logo?_='+new Date().getTime()+')');
					},
					error: function(error) {
						container.find('#ws-navbar .logo').css('background-image', 'url("apps/core/static/images/logo.png")');
					}
				});
			}
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
		},

		_landing: function(args) {
			var self = this,
				parent = args.parent || $('.ws-content'),
				html = monster.template(self, 'landing', args.data);

			parent
				.empty()
				.append(html);
		}
	};

	return app;
});
