define(function(require){

	return {
		api: {
			// The default API URL defines what API is used to log in to your back-end
			// default: 'http://api.zswitch.net:8000/v2/'
			default: 'http://10.26.0.41:8000/v2/'

			// If you have provisioner turned on in your install and can use the one provided by 2600hz, add the URL in the 'provisioner' key below
			// 		provisioner: 'your_provisioner_url',

			// If you want to use WebSockets you need to turn blackhole on in the back-end and then put the URL in the 'socket' key below
			// 		socket: 'your_web_socket_url'
		},

		// The resellerId key is the accountId of your master account, and is needed for some reseller features
		// For example it won't prompt for a credit card the subaccounts that have a different resellerId than this resellerId
		// resellerId: 'your_master_account_id',

		// whitelabel: Contains all the flags that are whitelabel-able via the Branding app. 
		// Setting them in the config file will set the defaults if you don't use any whitelabel
		// If the domain used is defined in the whitelabel database, we'll override the following settings by what is set in the whitelabel document
		whitelabel: {
			// Logout Timer (minutes before showing the logged in user that it will auto-disconnect him soon)
			// Changing this value allows you to disable the auto-logout mechanism by setting itto 0. 
			// If you want to change the default duration (15), you can set this value with a number > 0
			// 		logoutTimer: 0,

			// By default the language is set by the browser, and once the user is log in it will take what's set in the account/user.
			// If you want to force the language of the UI before the user is logged in, you can set it here.
			//		language: 'en-US',

			// Application title, displayed in the browser tab
			applicationTitle: 'Monster UI - 2600hz',

			// Company Name, used in many places in the UI
			companyName: '2600hz',

			nav: {
				// Link used when user click on the top-right interrogation mark
				help: 'http://wiki.2600hz.com',

				// Link used when clicking on logging out. By default the UI logs out the user after confirmation, but some people wanted to override that behavior
				// 		logout: 'http://www.google.com'
			}
		}
	};
});
