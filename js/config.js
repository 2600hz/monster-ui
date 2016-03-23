define(function(require){

	return {
		api: {
			// The default API URL defines what API is used to log in to your back-end
			default: 'http://your_API_URL/' // could be formatted like http://api.server.net:8000/v2/

			// If you have provisioner turned on in your install and can use the one provided by 2600Hz, add the URL in the 'provisioner' key below
			// provisioner: 'http://URL/2600hz-provisioner/'

			// If you want to use WebSockets you need to turn Blackhole on in the back-end and then put the URL in the 'socket' key below
			// socket: 'your_web_socket_url'

			// Set Project Phonebook URL if you want to use it to search phone numbers
			// phonebook: 'project_phonebook_url'
		},

		// The resellerId key is the accountId of your master account, and is needed for some reseller features
		// For example it won't prompt for a credit card the sub-accounts that have a different resellerId than this resellerId
		// resellerId: 'your_master_account_id',

		// If you are not using Braintree in your environment, you should add the following flag to disable the UI components that are using it:
		// disableBraintree: true,

		// Contains all the flags that are whitelabel-able via the Branding app.
		// Setting them in the config file will set the defaults if you don't use any whitelabel
		// If the domain used is defined in the whitelabel database, we'll override the following settings by what is set in the whitelabel document
		whitelabel: {
			// Logout Timer (minutes before showing the logged in user that it will auto-disconnect him soon)
			// Changing this value allows you to disable the auto-logout mechanism by setting it to 0. 
			// If you want to change the default duration (15), you can set this value with a number > 0
			// 		logoutTimer: 0,

			// By default the language is set by the browser, and once the user is log in it will take what's set in the account/user.
			// If you want to force the language of the UI before the user is logged in, you can set it here.
			//		language: 'en-US',

			// Application title, displayed in the browser tab
			applicationTitle: 'Monster UI',

			// E-mail address used to report calls in SmartPBX's Call Logs. "Report Call" link won't be displayed if no address is specified.
			// This address can either be set here in the config file, or through the Branding app.
			callReportEmail: 'support@2600hz.com',

			// Company Name, used in many places in the UI
			companyName: '2600Hz',

			nav: {
				// Link used when user click on the top-right interrogation mark
				help: 'http://wiki.2600hz.com',

				// Link used when clicking on logging out. By default the UI logs out the user after confirmation, but some people wanted to override that behavior
				// logout: 'http://www.google.com'
			},

			// In the Port Manager, we use a LOA Form link. By changing this attribute, you'll change the default link. If any user has a whitelabel profile set via the Branding app, he can override that value.
			port: {
				// loa: 'custom_loa_url'
			}
		},
		developerFlags: {
			// Setting this flag to true will show the SmartPBX Callflows in the Callflows app
			// showSmartPBXCallflows: true,

			// Settings this flag to true will show JS error when they happen, but in general we want to hide those so we comment it
			// showJSErrors: true
		}
	};
});