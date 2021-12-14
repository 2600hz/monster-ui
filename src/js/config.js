// var type = 'karlDev';
// var type = 'dev';
var type = 'staging';
// var type = 'qa';
// var type = 'prod';
// var type = 'provisioner';

var baseConfig = {
	developerFlags: {
		showAllCallflows: true
	},
	advancedView: true,
	whitelabel: {
		logoutTimer: 0
	}
};
var envConfig = {
	karlDev: {
		api: {
			'default': 'https://kanderson.2600hz.dev/api/v2/',
			socket: '',
			socketWebphone: ''
		},
		kazooClusterId: ''
	},
	dev: {
		api: {
			'default': 'https://ui.squanchy.2600hz.dev:8443/v2/',
			socket: 'wss://ui.squanchy.2600hz.dev:5443',
			socketWebphone: 'wss://ui.squanchy.2600hz.dev:5443'
		},
		kazooClusterId: '366a221c486922cf98efd6322677df92'
	},
	staging: {
		api: {
			'default': 'https://sandbox.2600hz.com:8443/v2/',
			provisioner: 'https://provisioner.sandbox.2600hz.com/',
			socket: 'wss://sandbox.2600hz.com:5443',
			socketWebphone: 'wss://sandbox.2600hz.com:5065'
		},
		kazooClusterId: 'aa2b36ac6a5edb290159cd1298283322'
	},
	qa: {
		api: {
			'default': 'https://ui.meeseeks.qa.2600hz.com:8443/v2/',
			provisioner: 'https://provisioner.meeseeks.qa.2600hz.com/',
			socket: 'wss://ui.meeseeks.qa.2600hz.com:5443',
			socketWebphone: 'wss://ui.meeseeks.qa.2600hz.com:5065'
		},
		kazooClusterId: 'b84d05d0e184ff746d2e46eff50018fe'
	},
	prod: {
		api: {
			'default': '//ui.zswitch.net/v2/',
			provisioner: '//p3.zswitch.net/',
			socket: 'wss://api.zswitch.net:5443',
			socketWebphone: 'wss://proxy.zswitch.net:5065'
		},
		kazooClusterId: '8a901bea1d3297ef7d4c8d34809472c2'
	},
	provisioner: {
		api: {
			kazoo: 'https://ui.provisioner.2600hz.dev:8000/v2/',
			provisioner: 'https://provisioner.2600hz.dev/'
		},
		kazooClusterId: '9d6f550746003b89601fcebfd530daaf'
	}
}[type];

/**
 * This file lets you connect your different backend services to Monster UI and
 * exposes other settings like whitelabeling that can be set for the entire UI.
 *
 * This minimal, working example is designed to get you up and running in no
 * time when Monster UI is installed on the same server running Kazoo and the
 * APIs are accessible at the default location (`:8000/v2/`).
 *
 * If that is not the case, you will need to hook up your Kazoo server with the
 * `api.'default'` property and you should be good to go.
 *
 * For a full list and description of configurable options, head over to:
 * https://docs.2600hz.com/ui/docs/configuration/
 */
define({
	api: envConfig.api,
	kazooClusterId: envConfig.kazooClusterId,
	developerFlags: baseConfig.developerFlags,
	advancedView: baseConfig.advancedView,
	whitelabel: {
		logoutTimer: baseConfig.whitelabel.logoutTimer,
		companyName: '2600Hz',
		applicationTitle: 'Monster UI',
		callReportEmail: 'support@2600hz.com',
		nav: {
			help: 'http://wiki.2600hz.com'
		},
		port: {
			loa: 'http://ui.zswitch.net/Editable.LOA.Form.pdf',
			resporg: 'http://ui.zswitch.net/Editable.Resporg.Form.pdf'
		}
	}
});
