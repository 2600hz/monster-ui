define(function(require){
	var $ = require('jquery'),
		_ = require('underscore'),
		monster = require('monster');

	var app = {

		name: 'apploader',

		i18n: [ 'en-US' ],

		requests: {
			'apploader.users.update': {
				url: 'accounts/{accountId}/users/{userId}',
				verb: 'POST'
			}
		},

		subscribe: {
			'apploader.show': '_render',
			'apploader.hide': '_hide',
			'apploader.toggle': '_toggle'
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

		_render: function() {
			var self = this;
			
		},

		isRendered: function() {
			return ($('#apploader').length !== 0);
		},

		render: function() {
			var self = this;
			if(!self.isRendered()) {
				var installedApps = $.extend(true, {}, monster.apps['auth'].installedApps),
					userApps = monster.apps['auth'].currentUser.appList || [],
					updateUserApps = false,
					appList = [];

				userApps = $.grep(userApps, function(val, key) {
					var app = installedApps[val];
					if(app) {
						appList.push({
							id: val,
							name: app.name,
							icon: self.apiUrl + "accounts/" + self.accountId + "/apps_store/" + val + "/icon?auth_token=" + self.authToken,
							label: app.i18n["en-US"].label
						});
						delete installedApps[val];
						return true;
					}
					return false;
				});

				$.each(installedApps, function(key, val) {
					appList.push({
						id: key,
						name: val.name,
						icon: self.apiUrl + "accounts/" + self.accountId + "/apps_store/" + key + "/icon?auth_token=" + self.authToken,
						label: val.i18n["en-US"].label
					});

					userApps.push(key);
					updateUserApps = true;
				});

				if(updateUserApps) {
					monster.apps['auth'].currentUser.appList = userApps;
					monster.request({
						resource: 'apploader.users.update',
						data: {
							accountId: self.accountId,
							userId: self.userId,
							data: monster.apps['auth'].currentUser
						},
						success: function(_data, status) {},
						error: function(_data, status) {}
					});
				}

				var template = $(monster.template(self, 'app', { apps: appList, allowAppstore: true }));
				$('#topbar').after(template);

				template.find('.app-list').sortable({ 
					axis: "y", 
					cursor: "move", 
					containment: "parent",
					handle: ".app-draggable", 
					placeholder: "app-list-element-placeholder", 
					revert: 100,
					tolerance: "pointer"
				});

				template.find('.app-list').niceScroll({
					cursorcolor:"#333",
					cursoropacitymin:0.5,
					hidecursordelay:1000
				}).hide();

				self.bindEvents(template);
				self.show();
			} else {
				self.show();	
			}
		},

		bindEvents: function(parent) {
			var self = this,
				defaultDiv = parent.find('.app-default');

			parent.find('.app-list').on('sortupdate', function(e, ui) {
				var $this = $(this),
					firstElement = $this.find('.app-list-element:first-child');
				if(!firstElement.find('.app-default').length) {
					defaultDiv.fadeOut(function() {
						firstElement.append(defaultDiv);
						defaultDiv.fadeIn();
					});
				}

				monster.apps['auth'].currentUser.appList = $.map(
					$this.find('.app-list-element'), 
					function(val) { 
						return $(val).data('id'); 
					}
				);
				monster.request({
					resource: 'apploader.users.update',
					data: {
						accountId: self.accountId,
						userId: self.userId,
						data: monster.apps['auth'].currentUser
					},
					success: function(_data, status) {},
					error: function(_data, status) {}
				});
			});

			parent.find('.app-list-element, .appstore-link').on('click', function(e) {
				monster.apps.load($(this).data('name'), function(app){
					app.render();
				});
				self._hide(parent);
				monster.pub('myaccount.hide');
			});

			parent.find('.app-list-element .app-draggable').on('click', function(e) {
				e.stopPropagation();
			});

			$(document).on('click', function(e) {
				var homeLink = $('#home_link');
				if(!parent.is(e.target) 
				&& !parent.has(e.target).length
				&& !homeLink.is(e.target) 
				&& !homeLink.has(e.target).length) {
					self._hide(parent);
				}
			});
		},

		show: function(app) {
			var self =  this,
				apploader = app || $('#apploader'),
				niceScrollBar = apploader.find('.app-list').getNiceScroll()[0];

			if(!apploader.hasClass('active')) {
				apploader.addClass('active')
						 .animate(
						 	{ left: 0 }, 
						 	400, 
						 	"swing", 
						 	function() {
						 		niceScrollBar.resize();
						 		niceScrollBar.show();
						 	}
						 );
			}
		},

		_hide: function(app) {
			var self =  this,
				apploader = app || $('#apploader'),
				niceScrollBar = apploader.find('.app-list').getNiceScroll()[0];

			if(apploader.hasClass('active')) {
				niceScrollBar.hide();
				apploader.removeClass('active')
						 .animate(
						 	{ left: "-310px" }, 
						 	400, 
						 	"swing", 
						 	niceScrollBar.resize
						 );
			}
		},

		_toggle: function() {
			var self = this;
			if(!self.isRendered()) {
				self.render();
			} else {
				var apploader = $('#apploader');
				apploader.hasClass('active') ? self._hide(apploader) : self.show(apploader);
			}
		}
	};

	return app;
});
