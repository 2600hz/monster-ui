define(function(require){

	return {
		api: {
			default: "https://api.2600hz.com:8443/v1/"
		},

		company: {
			name: "2600hz",
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
