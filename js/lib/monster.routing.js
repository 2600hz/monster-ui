define(function(require){
	var $ = require('jquery'),
		_ = require('underscore'),
		monster = require('monster'),
		crossroads = require('crossroads'),
		hasher = require('hasher');

	var routing = {
		routes: [],

		goTo: function(url) {
			this.updateHash(url);
		},

		getUrl: function() {
			var self = this;
			
			return hasher.getHash();
		},

		add: function(url, callback) {
			var self = this;
			
			this.routes.push(crossroads.addRoute(url, callback));
		},

		addDefault: function() {
			var self = this,
				appsToRoute = monster.apps.auth.installedApps;

			appsToRoute.push({ name: 'appstore'});

			_.each(monster.apps.auth.installedApps, function(app) {
				self.add('/apps/' + app.name, function() {
					monster.pub('apploader.hide');
					monster.pub('myaccount.hide');

					monster.apps.load(app.name, function(loadedApp) {
						monster.pub('core.showAppName', app.name);

						loadedApp.render();
					});
				});
			});
		},

		hasMatch: function() {
			var self = this;

			return crossroads._getMatchedRoutes(this.getUrl()).length > 0;
		},

		init: function() {
			var self = this;
			
			self.addDefault();

			hasher.initialized.add(this.parseHash); // parse initial hash  
			hasher.changed.add(this.parseHash); // parse hash changes  
			hasher.init(); // start listening for history changes  

			crossroads.ignoreState = true;
		},

		parseHash: function(newHash, oldHash) {
			crossroads.parse(newHash);
		},

		// This is only used by monster.routing.goTo which is called manually. 
		// We need to silence the change signal to make sure that we force a crossroads.parse without relying on hasher.change firing. 
		// Because if we reload the same hash, hasher won't fire the event, which mean we won't reload that path.
		updateHash: function(url) {
			hasher.changed.active = false; //disable changed signal

			hasher.setHash(url); //set hash without dispatching changed signal
			this.parseHash(url);

			hasher.changed.active = true; //re-enable signal
		}
	};

	return routing;
});
