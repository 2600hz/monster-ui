define(function(require){

	return {
		api: {
			default: 'http://api.zswitch.net:8000/v2/'
			// If you have provisioner turned on in your install and can use the one provided by 2600hz, add the URL in the 'provisioner' key below
			// provisioner: 'your_provisioner_url',
			// If you want to use WebSockets you need to turn blackhole on in the back-end and then put the URL in the 'socket' key below
			// socket: 'your_web_socket_url'
		},

		// By default the language is set by the browser, and once the user is log in it will take what's set in the account/user.
		// If you want to force the language of the UI before the user is logged in, you can set it here.
		// language: 'en-US',

		// The resellerId key is the accountId of your master account, and is needed for some reseller features
		// For example it won't prompt for a credit card the subaccounts that have a different resellerId than this resellerId
		// resellerId: 'your_master_account_id',

		nav: {
			help: 'http://wiki.2600hz.com'
		}
	};
});
