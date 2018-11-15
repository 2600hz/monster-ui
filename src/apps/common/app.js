define(function(require) {
	var monster = require('monster');

	var appSubmodules = [
		'accountAncestors',
		'accountBrowser',
		'buyNumbers',
		'callerId',
		'carrierSelector',
		'chooseModel',
		'conferenceViewer',
		'deleteSmartUser',
		'e911',
		'extensionTools',
		'failover',
		'mediaSelect',
		'monsterListing',
		'numberFeaturesMenu',
		'numberPrepend',
		'numberRenameCarrier',
		'numberSelector',
		'numbers',
		'portListing',
		'portWizard',
		'ringingDurationControl',
		'servicePlanDetails',
		'storagePlanManager',
		'storageSelector',
		'webphone'
	];

	require(_.map(appSubmodules, function(name) {
		return './submodules/' + name + '/' + name;
	}));

	var app = {
		name: 'common',

		subModules: appSubmodules,

		css: [ 'app' ],

		i18n: {
			'de-DE': { customCss: false },
			'en-US': { customCss: false },
			'fr-FR': { customCss: false },
			'ru-RU': { customCss: false }
		},

		requests: {},
		subscribe: {},

		load: function(callback) {
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
		}
	};

	return app;
});
