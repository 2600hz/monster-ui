define(function(require){

	return {
		api: {
			//provisioner: 'http://p.2600hz.com/',
			default: 'http://10.26.0.41:8000/v2/'/*,*/
			// default: 'http://10.26.0.61:8000/v2/'
			//socket: 'http://10.26.0.41:5555'
		},

		company: {
			name: '2600hz',
			website: ''
		},

		i18n: {
			default: 'en-US',
			active: 'en-US'
		},

		nav: {
			help: 'http://wiki.2600hz.com',
			learnMore: 'http://www.2600hz.com/'
		}

	};

});
