define(function(require) {
	var monster = require('monster');

	var appSubmodules = [
		'accountAncestors',
		'accountBrowser',
		'appSelector',
		'buyNumbers',
		'callerId',
		'carrierSelector',
		'chooseModel',
		'conferenceViewer',
		'csvUploader',
		'deleteSmartUser',
		'dragableUploads',
		'e911',
		'extensionTools',
		'failover',
		'mediaSelect',
		'monsterListing',
		'navigationWizard',
		'numberFeaturesMenu',
		'numberPrepend',
		'numberRenameCarrier',
		'numberSelector',
		'numberMessaging',
		'numbers',
		'portListing',
		'portWizard',
		'ringingDurationControl',
		'servicePlanDetails',
		'servicePlanItemEditor',
		'storagePlanManager',
		'storageSelector',
		'webphone'
	];

	require(_.map(appSubmodules, function(name) {
		return './submodules/' + name + '/' + name;
	}));

	var app = {
		subModules: appSubmodules,

		i18n: {
			'de-DE': { customCss: false },
			'en-US': { customCss: false },
			'fr-FR': { customCss: false },
			'ru-RU': { customCss: false }
		}
	};

	return app;
});
