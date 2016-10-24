define(function(require){
	var $ = require('jquery'),
		_ = require('underscore'),
		monster = require('monster'),
		crossroads = require('crossroads'),
		hasher = require('hasher');

	var loadApp = function(appName, query) {
		var renderApp = function() {
				monster.apps.load(appName, function(loadedApp) {
					monster.pub('core.showAppName', appName);
					$('#monster-content').empty();

					loadedApp.render();
				});
			},
			isMasqueradable = function(id) {
				return /^[0-9a-f]{32}$/i.test(query.m) && (monster.apps.auth.currentAccount.id !== query.m);
			};

		monster.pub('apploader.hide');
		monster.pub('myaccount.hide');

		// See if we have a 'm' query string (masquerading), and see if it's an ID, if yes, then trigger an attempt to masquerade
		if(query && query.hasOwnProperty('m') && isMasqueradable(query.m)) {
			var accountData = { id: query.m };

			monster.pub('core.triggerMasquerading', {
				account: accountData,
				callback: function() {
					renderApp();
				}
			});
		}
		else {
			renderApp();
		}
	};

	var routing = {
		routes: [],

		goTo: function(url) {
			this.updateHash(url);

			this.parseHash(url);
		},

		getUrl: function() {
			return hasher.getHash();
		},

		add: function(url, callback) {
			var currentUrl = this.getUrl();

			this.routes.push(crossroads.addRoute(url, callback));

			if(currentUrl === url) {
				this.parseHash(url);
			}
		},

		addDefaultRoutes: function() {
			var appWhitelist = {
				'appstore': { onlyAdmins: true }
			};

			this.add('apps/{appName}:?query:', function(appName, query) {
				if(monster && monster.apps && monster.apps.auth) {
					if(appWhitelist.hasOwnProperty(appName)) {
						if(!appWhitelist[appName].onlyAdmins || monster.util.isAdmin()) {
							loadApp(appName, query);
						}
					}
					else {
						var found = false;

						_.each(monster.apps.auth.installedApps, function(app) {
							if(appName === app.name && !found) {
								loadApp(appName, query);

								found = true;
							}
						});
					}
				}
			});
		},

		hasMatch: function() {
			return crossroads._getMatchedRoutes(this.getUrl()).length > 0;
		},

		init: function() {
			var self = this,
				onEvent = function(newHash, oldHash) {
					self.parseHash(newHash, oldHash);
				};
			
			this.addDefaultRoutes();

			hasher.initialized.add(onEvent); // parse initial hash
			hasher.changed.add(onEvent); // parse hash changes
			hasher.init(); // start listening for history changes

			crossroads.ignoreState = true;
		},

		parseHash: function(newHash, oldHash) {
			if(!newHash || newHash === '') {
				newHash = this.getUrl();
			}

			crossroads.parse(newHash);
		},

		// We silence the event so it only changes the URL.
		updateHash: function(url) {
			hasher.changed.active = false; //disable changed signal

			hasher.setHash(url); //set hash without dispatching changed signal

			hasher.changed.active = true; //re-enable signal
		}
	};

	routing.init();

	return routing;
});
