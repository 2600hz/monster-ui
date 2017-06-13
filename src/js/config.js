define(function(require){

	return {
		api: {
			// The default API URL defines what API is used to log in to your back-end
			//default: 'https://ui.zswitch.net/v2/',
			default: 'https://sandbox.2600hz.com:8443/v2/',
			//default: 'http://159.8.96.235:8000/v2/',
			// If you have provisioner turned on in your install and can use the one provided by 2600Hz, add the URL in the 'provisioner' key below
			//provisioner: 'https://provisioner.sandbox.2600hz.com/',
			//provisioner: "https://p3.zswitch.net/",
			provisioner: "https://provisioner.sandbox.2600hz.com/",
			//default: 'http://159.203.242.118:8000/v2/',

			// If you want to use WebSockets you need to turn Blackhole on in the back-end and then put the URL in the 'socket' key below
			// socket: 'your_web_socket_url'
			socket: 'wss://sandbox.2600hz.com:5443',
			socketWebphone: 'wss://sandbox.2600hz.com:5065'

			// Set Project Phonebook URL if you want to use it to search phone numbers
			// phonebook: 'project_phonebook_url'

			
			//screwdriver: "https://screwdriver.2600hz.com/v1/screwdriver/"
		},

		 kazooClusterId: 'aa2b36ac6a5edb290159cd1298283322',

		// The resellerId key is the accountId of your master account, and is needed for some reseller features
		// For example it won't prompt for a credit card the sub-accounts that have a different resellerId than this resellerId
		//resellerId: 'b6bcca6222424e2cb41dbc5a572d428e',

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

			// Additional apps to load once the user is logged in (will be loaded along the appstore, apploader, common controls etc..)
			// additionalLoggedInApps: ['sso'],

			// Additional CSS files to load. Need to be in src/css folder.
			// additionalCss: ['extra/mine.css', 'anotherOne.css'],

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
				loa: 'http://ui.zswitch.net/Editable.LOA.Form.pdf',
				resporg: 'http://ui.zswitch.net/Editable.Resporg.Form.pdf'
			},

			// If set to true, the UI will stop trying to pretty print DIDs. Typically you want to leave this on if you handle US numbers, but if you handle different countries, it won't display numbers properly... 
			// while we're working on a better fix, this is a quick way to disable the pretty printing from the time being.
			preventDIDFormatting: false,

			//announcement: '<h1>Welcome to Monster-UI Whitelabeled</h1><br/> 2600hz Is awesome!',

			// If you want to provide a "Provide Feedback" button tied with JIRA issue collector, you can set this object to enabled: true, and provide the URL of the JIRA Issue collector to the url property.
			// if this item is removed or set to enabled: false, nothing will appear in the UI.
			jiraFeedback: {
				enabled: true,
				url: 'https://2600hz.atlassian.net/s/97fa9439eb5877d16b5da001bbf48dc3-T/-7ct1es/100012/c/1000.0.9/_/download/batch/com.atlassian.jira.collector.plugin.jira-issue-collector-plugin:issuecollector/com.atlassian.jira.collector.plugin.jira-issue-collector-plugin:issuecollector.js?locale=en-US&collectorId=3bd5d144'
			}
		},
		developerFlags: {
			// Setting this flag to true will show all restricted callflows in the Callflows app
			// showAllCallflows: true,

			// Settings this flag to true will show JS error when they happen, but in general we want to hide those so we comment it
			showJSErrors: true
		}
	};
});
