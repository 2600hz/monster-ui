/**
 * This file lets you connect your different backend services to Monster UI and
 * exposes other options like whitelabeling that can be set here for entire UI.
 *
 * This minimal, almost working example will get you up an running in no time.
 * You just need to hook up your Kazoo server at `api.default` and you should be
 * good to go.
 *
 * For a full list and description of configurable options, head over to:
 * https://docs.2600hz.com/ui/docs/configuration/
 */
define({
	api: {
		'default': 'http://my.kazoo.server/'
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
