define(function(require){
	var $ = require('jquery'),
		_ = require('underscore'),
		monster = require('monster');

	require([
		'./submodules/accountAncestors/accountAncestors',
		'./submodules/accountBrowser/accountBrowser',
		'./submodules/buyNumbers/buyNumbers',
		'./submodules/callerId/callerId',
		'./submodules/e911/e911',
		'./submodules/failover/failover',
		'./submodules/numbers/numbers',
		'./submodules/port/port',
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
		'./submodules/conferenceViewer/conferenceViewer'
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
			'port',
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
			'conferenceViewer'
		],

		css: [ 'app' ],

		i18n: { 
			'en-US': { customCss: false },
			'fr-FR': { customCss: false },
			'ru-RU': { customCss: false }
		},

		requests: {},
		subscribe: {},

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
		}
	};

	return app;
});
