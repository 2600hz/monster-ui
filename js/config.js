define(function(require){
	
	return {
		debug: false,
		companyName: "2600mhz",
		i18n: {
			default: "en-US",
			active: "en-US"
		},
		api: {
			default: "https://api.2600hz.com:8443/v1/"
		},
		apps: [ "account", "auth", "pbxs" ],
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