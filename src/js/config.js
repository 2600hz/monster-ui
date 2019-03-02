var type = 'dev';
// var type = 'prod';
var kazoo;
var provisioner;
var socket;
var socketWebphone;
var kazooClusterId;
if (type === 'dev') {
	kazoo = 'https://sandbox.2600hz.com:8443/v2/';
	provisioner = 'https://provisioner.sandbox.2600hz.com/';
	socket = 'wss://sandbox.2600hz.com:5443';
	socketWebphone = 'wss://sandbox.2600hz.com:5065';
	kazooClusterId = 'aa2b36ac6a5edb290159cd1298283322';
} else if (type === 'prod') {
	kazoo = '//ui.zswitch.net/v2/';
	provisioner = '//p3.zswitch.net/';
	socket = 'wss://api.zswitch.net:5443';
	socketWebphone = 'wss://proxy.zswitch.net:5065';
	kazooClusterId = '8a901bea1d3297ef7d4c8d34809472c2';
}
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
	kazooClusterId: kazooClusterId,
	api: {
		'default': kazoo,
		provisioner: provisioner,
		socket: socket,
		socketWebphone: socketWebphone
	},
	developerFlags: {
		showAllCallflows: true
	},
	whitelabel: {
		logoutTimer: 0,
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
