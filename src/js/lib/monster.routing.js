define(function(require) {
	var $ = require('jquery'),
		_ = require('lodash'),
		monster = require('monster'),
		crossroads = require('crossroads'),
		hasher = require('hasher');

	var routes = [];

	function add(url, callback) {
		var currentUrl = getUrl();

		routes.push(crossroads.addRoute(url, callback));

		if (currentUrl === url) {
			parseHash(url);
		}
	}

	function addDefaultRoutes() {
		var appWhitelist = {
			'appstore': { onlyAdmins: true }
		};

		add('apps/{appName}:?query:', function(appName, query) {
			if (monster && monster.apps && monster.apps.auth) {
				if (appWhitelist.hasOwnProperty(appName)) {
					if (!appWhitelist[appName].onlyAdmins || monster.util.isAdmin()) {
						loadApp(appName, query);
					}
				} else {
					var found = false;

					_.each(monster.apps.auth.installedApps, function(app) {
						if (appName === app.name && !found) {
							loadApp(appName, query);

							found = true;
						}
					});
				}
			}
		});
	}

	function getUrl() {
		return hasher.getHash();
	}

	function goTo(url) {
		updateHash(url);

		parseHash(url);
	}

	function hasMatch() {
		return crossroads._getMatchedRoutes(getUrl()).length > 0;
	}

	function init() {
		var onEvent = function(newHash, oldHash) {
			parseHash(newHash, oldHash);
		};

		addDefaultRoutes();

		hasher.initialized.add(onEvent); // parse initial hash
		hasher.changed.add(onEvent); // parse hash changes
		hasher.init(); // start listening for history changes

		crossroads.ignoreState = true;
	}

	function isAccountIDMasqueradable(id) {
		return /^[0-9a-f]{32}$/i.test(id) && (monster.apps.auth.currentAccount.id !== id);
	}

	function loadApp(appName, query) {
		// See if we have a 'm' query string (masquerading), and see if it's an ID, if yes, then trigger an attempt to masquerade
		if (query && query.hasOwnProperty('m') && isAccountIDMasqueradable(query.m)) {
			var accountData = { id: query.m };

			monster.pub('core.triggerMasquerading', {
				account: accountData,
				callback: function() {
					renderApp(appName);
				}
			});
		} else {
			renderApp(appName);
		}
	}

	function parseHash(newHash) {
		if (!newHash || newHash === '') {
			newHash = getUrl();
		}

		crossroads.parse(newHash);
	}

	function renderApp(appName) {
		if (appName === 'appstore' || !monster.util.isMasquerading() || monster.appsStore[appName].masqueradable === true) {
			monster.pub('apploader.hide');
			monster.pub('myaccount.hide');

			monster.apps.load(appName, function(loadedApp) {
				monster.pub('core.showAppName', appName);
				$('#monster_content').empty();

				loadedApp.render();
			});
		} else {
			monster.ui.toast({
				type: 'error',
				message: monster.apps.core.i18n.active().appMasqueradingError
			});
		}
	}

	// We silence the event so it only changes the URL.
	function updateHash(url) {
		hasher.changed.active = false; //disable changed signal

		hasher.setHash(url); //set hash without dispatching changed signal

		hasher.changed.active = true; //re-enable signal
	}

	return {
		goTo: goTo,
		hasMatch: hasMatch,
		init: init,
		parseHash: parseHash,
		updateHash: updateHash
	};
});
