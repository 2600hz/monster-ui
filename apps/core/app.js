define(function(require){
	var $ = require("jquery"),
		_ = require("underscore"),
		monster = require("monster");

	var app = {

		name: "core",

		i18n: [ 'en-US', 'fr-FR' ],

		requests: {
			// "cors.test": {
			// 	url: "phone_numbers?prefix=415&quantity=15",
			// 	type: "text/plain",
			// 	verb: "GET"
			// },
			'layout.getLogo': {
				url: 'whitelabel/{domain}/logo',
				dataType: '*',
				verb: 'GET'
			}
		},

		subscribe: {
			"app.nav.add": function(data){
				console.log(data);
			},
			"app.nav.context.add": function(data){
				console.log(data);
			}
		},

		load: function(callback){

			var self = this;

			// monster.request({
			// 	resource: "cors.test",
			// 	data: { foo: "bar" },
			// 	success: function(data){
			// 		callback(self);
			// 	},
			// 	error: function(message, level){
			// 		console.log(message, level);
			// 		monster.config.companyName = "unknown";
			// 		callback(self);
			// 	}
			// })

			callback(this);
		},

		render: function(container){
			var self = this,
				template = monster.template(self, 'app', {}),
				content = $(template);

			document.title = 'Monster Mash - He did the mash.';

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

		_render: function(container) {
			var self = this,
				domain = window.location.hostname,
				apiUrl = monster.config.api.default || monster.apps['auth'].apiUrl,
				homeLink = $('#home_link')

			homeLink.ajaxStart(function() {
				homeLink.find('i').addClass('icon-spinner icon-spin');
			})
			.ajaxStop(function() {
				homeLink.find('i').removeClass('icon-spinner icon-spin');
			})
			.ajaxError(function() {
				if($.active === 0) {
					homeLink.find('i').removeClass('icon-spinner icon-spin');
				}
			});

			homeLink.on('click', function() {
				if($.cookie('monster-auth')) {
					monster.publish('auth.landing');
				}
			});

			monster.getVersion(function(version) {
				$('.footer_wrapper .tag_version').html('('+version.replace(/\s/g,'')+')');
			});

			container.find('#ws-navbar .logo').click(function() {
				$('.whapps .whapp > a').removeClass('activate');
				if($.cookie('monster-auth')) {
					monster.publish('auth.landing');
				}
			});

			monster.request({
				resource: 'layout.getLogo',
				data: {
					domain: domain === "localhost" ? "2600hz.com" : domain
				},
				success: function(_data) {
					container.find('#ws-navbar .logo').css('background-image', 'url(' + apiUrl + '/whitelabel/' + domain + '/logo?_='+new Date().getTime()+')');
				},
				error: function(error) {
					var logo = 'url("apps/core/static/images/logo.png")';

					container.find('#ws-navbar .logo').css('background-image', logo);
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
