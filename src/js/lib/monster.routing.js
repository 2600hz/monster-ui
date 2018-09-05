define(function(require) {
	var Hasher = require('hasher');
	var Crossroads = require('crossroads');
	var _ = require('lodash');
	var monster = require('monster');
	var $ = require('jquery');

	function addDefaultRoutes() {
		var appWhitelist = {
			appstore: {
				onlyAdmins: true
			}
		};
		var app;
		addRoutes('apps/{appName}:?query:', function(name, query) {
			if (!_.has(monster, 'apps.auth')) {
				return;
			}
			if (_.has(appWhitelist, name)) {
				if (!appWhitelist[name].onlyAdmins || monster.util.isAdmin()) {
					app = {
						name: name
					};
				} else {
					return;
				}
			} else {
				app = _.find(monster.apps.auth.installedApps, {
					name: name
				});
			}
			loadApp(app.name, query);
		});
	}

	function addRoutes(url, callback) {
		var currentUrl = getUrl();
		Crossroads.addRoute(url, callback);
		if (currentUrl === url) {
			parseHash(url);
		}
	}

	function getUrl() {
		return Hasher.getHash();
	}

	function goTo(url) {
		updateHash(url);
		parseHash(url);
	}

	function hasMatch() {
		return !_.isEmpty(Crossroads._getMatchedRoutes(getUrl()));
	}

	function init() {
		var onEvent = function(newHash) {
			parseHash(newHash);
		};
		addDefaultRoutes();
		Hasher.initialized.add(onEvent);
		Hasher.changed.add(onEvent);
		Hasher.init();
		Crossroads.ignoreState = true;
	}

	function isAccountIDMasqueradable(id) {
		return /^[0-9a-f]{32}$/i.test(id)
			&& monster.apps.auth.currentAccount.id !== id;
	}

	function loadApp(appName, query) {
		if (_.has(query, 'm') && isAccountIDMasqueradable(query.m)) {
			monster.pub('core.triggerMasquerading', {
				account: {
					id: query.m
				},
				callback: function() {
					renderApp(appName);
				}
			});
		} else {
			renderApp(appName);
		}
	}

	function parseHash(newHash) {
		if (_.isUndefined(newHash) || _.isEmpty(newHash)) {
			newHash = getUrl();
		}
		Crossroads.parse(newHash);
	}

	function renderApp(appName) {
		if (!(appName === 'appstore'
			|| !monster.util.isMasquerading()
			|| monster.appsStore[appName].masqueradable === true)) {
			monster.ui.toast({
				type: 'error',
				message: monster.apps.core.i18n.active().appMasqueradingError
			});
			return;
		}
		monster.pub('apploader.hide');
		monster.pub('myaccount.hide');
		monster.apps.load(appName, function(loadedApp) {
			monster.pub('core.showAppName', appName);
			$('#monster_content').empty();
			loadedApp.render();
		});
	}

	function updateHash(url) {
		Hasher.changed.active = false;
		Hasher.setHash(url);
		Hasher.changed.active = true;
	}

	return {
		goTo: goTo,
		hasMatch: hasMatch,
		init: init,
		parseHash: parseHash,
		updateHash: updateHash
	};
});
