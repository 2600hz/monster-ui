define(function(require){

	return {
		api: {
			provisioner: 'http://10.26.0.219:8888/Provisioner-2600hz/',
			default: 'http://10.26.0.41:8000/v2/'/*,*/
			// default: 'http://10.26.0.61:8000/v2/'E
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
