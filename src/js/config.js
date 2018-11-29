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
	api: {
		'default': 'http://10.69.1.140:8000/v2/',
		'socket': 'ws://10.69.1.140:5555'
	},
	whitelabel: {
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
