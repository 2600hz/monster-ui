define(function(require){
	
	return {
		api: {
			default: "https://api.2600hz.com:8443/v1/"
		},
		
		apps: [ "account", "auth", "pbxs" ],		
		
		baseUrls: {
			'u.2600hz.com': {
				/* If this was set to true, Winkstart would look for u_2600hz_com.png in config/images/logos */
				custom_logo: false
			},
			'apps.2600hz.com': {
				custom_logo: false
			}
		},

		company: {
			name: "2600mhz",
			website: ''
		},

		debug: false,

		i18n: {
			default: "en-US",
			active: "en-US"
		},

		nav: {
			help: 'http://wiki.2600hz.com',
			learnMore: 'http://www.2600hz.com/'
		},

		roles: {
			active: "default",
			default: {
				apps: []
			}
		},

		user: {
			name: "",
			userName: "",
			accountId: 0,
			companyName: "",
			apps: {},
			authToken: ""
		}
	};

});