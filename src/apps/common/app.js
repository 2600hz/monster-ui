define(function(require) {
	var monster = require('monster');

	require([
		'./submodules/accountAncestors/accountAncestors',
		'./submodules/accountBrowser/accountBrowser',
		'./submodules/buyNumbers/buyNumbers',
		'./submodules/callerId/callerId',
		'./submodules/e911/e911',
		'./submodules/failover/failover',
		'./submodules/numbers/numbers',
		'./submodules/chooseModel/chooseModel',
		'./submodules/servicePlanDetails/servicePlanDetails',
		'./submodules/ringingDurationControl/ringingDurationControl',
		'./submodules/carrierSelector/carrierSelector',
		'./submodules/numberPrepend/numberPrepend',
		'./submodules/numberSelector/numberSelector',
		'./submodules/numberFeaturesMenu/numberFeaturesMenu',
		'./submodules/monsterListing/monsterListing',
		'./submodules/extensionTools/extensionTools',
		'./submodules/mediaSelect/mediaSelect',
		'./submodules/webphone/webphone',
		'./submodules/portListing/portListing',
		'./submodules/portWizard/portWizard',
		'./submodules/conferenceViewer/conferenceViewer',
		'./submodules/numberRenameCarrier/numberRenameCarrier',
		'./submodules/storageSelector/storageSelector',
		'./submodules/storagePlanManager/storagePlanManager'
	]);

	var app = {
		name: 'common',

		subModules: [
			'accountAncestors',
			'accountBrowser',
			'buyNumbers',
			'callerId',
			'e911',
			'failover',
			'numbers',
			'chooseModel',
			'servicePlanDetails',
			'ringingDurationControl',
			'carrierSelector',
			'numberPrepend',
			'numberSelector',
			'numberFeaturesMenu',
			'monsterListing',
			'extensionTools',
			'mediaSelect',
			'webphone',
			'portListing',
			'portWizard',
			'conferenceViewer',
			'numberRenameCarrier',
			'storageSelector',
			'storagePlanManager'
		],

		css: [ 'app' ],

		i18n: {
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
