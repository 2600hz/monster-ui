define(function(require) {
	var $ = require('jquery'),
		_ = require('lodash'),
		monster = require('monster'),
		crossroads = require('crossroads'),
		hasher = require('hasher');

	var loadApp = function(appName, query) {
		var isAccountIDMasqueradable = function(id) {
			return /^[0-9a-f]{32}$/i.test(id) && (monster.apps.auth.currentAccount.id !== id);
		};

		monster.series([
			// See if we have a 'm' query string (masquerading), and see if it's an ID, if yes, then trigger an attempt to masquerade
			function(cb) {
				if (
					!_.has(query, 'm')
					|| !isAccountIDMasqueradable(query.m)
				) {
					return cb(null);
				}
				monster.pub('core.triggerMasquerading', {
					account: { id: query.m },
					callback: function() {
						cb(null);
					}
				});
			}
		], function(err, results) {
			if (
				appName !== 'appstore'
				&& monster.util.isMasquerading()
				&& monster.appsStore[appName].masqueradable !== true
			) {
				monster.ui.toast({
					type: 'error',
					message: monster.apps.core.i18n.active().appMasqueradingError
				});
				return;
			}
			monster.pub('apploader.hide');
			monster.pub('myaccount.hide');

			monster.apps.load(appName, function(loadedApp) {
				monster.pub('core.alerts.refresh');
				monster.pub('core.showAppName', appName);
				$('#monster_content').empty();

				loadedApp.render();
			});
		});
	};

	var isAppLoadable = function(appName) {
		var installed = _
			.chain(monster)
			.get('apps.auth.installedApps', [])
			.map('name')
			.concat('appstore')
			.value();
		var available = _.transform(monster.appsStore || {}, function(acc, app) {
			_.set(acc, app.name, _.pick(app, ['allowed_users', 'users']));
		}, {
			appstore: {
				allowed_users: 'admins'
			}
		});
		var app = _.get(available, appName);
		var user = monster.apps.auth.currentUser;
		var appUsers = _
			.chain(app)
			.get('users', [])
			.map('id')
			.value();

		if (
			app && app.allowed_users
			&& _.includes(installed, appName)
			&& (
				app.allowed_users === 'all'
				|| (app.allowed_users === 'admins' && user.priv_level === 'admin')
				|| (app.allowed_users === 'specific' && _.includes(appUsers, user.id))
			)
		) {
			return true;
		}
		return false;
	};

	var getAppNameById = function(appId) {
		return _
			.chain(monster)
			.get('apps.auth.installedApps', [])
			.find({ id: appId })
			.get('name')
			.value();
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

			if (currentUrl === url) {
				this.parseHash(url);
			}
		},

		addDefaultRoutes: function() {
			this.add('apps/{appName}:?query:', function(appName, query) {
				// not logged in, do nothing to preserve potentially valid route to load after successful login
				if (!_.has(monster, 'apps.auth.installedApps')) {
					return;
				}
				// try loading the requested app
				if (isAppLoadable(appName)) {
					loadApp(appName, query);
				// load last loaded app
				} else if (
					appName !== monster.apps.lastLoadedApp
					&& _.find(monster.apps.auth.installedApps, { name: monster.apps.lastLoadedApp })
				) {
					routing.goTo('apps/' + monster.apps.lastLoadedApp);
				// load default app
				} else if (
					!_.isEmpty(monster.apps.auth.currentUser.appList)
					&& appName !== getAppNameById(monster.apps.auth.currentUser.appList[0])
				) {
					routing.goTo('apps/' + getAppNameById(monster.apps.auth.currentUser.appList[0]));
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

		parseHash: function(newHash) {
			if (!newHash || newHash === '') {
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
