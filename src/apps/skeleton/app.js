define(function(require) {
	var $ = require('jquery'),
		monster = require('monster'),
		app = require('./embedded/2600hz-universal-app-shell.js');
		//singleSpa = require('https://cdnjs.cloudflare.com/ajax/libs/single-spa/5.9.3/umd/single-spa.min.js'),
		//app = require('embedded/2600hz-universal-app-shell.js');

	return {
		// Entry Point of the app
		render: function() {
			var self = this;
				//registerApplication = singleSpa.registerApplication,
				//start = singleSpa.start;

			/*registerApplication({
				name: '@2600hz/universal-app-shell',
				app: () => app,
				activeWhen: () => true
			});*/
			console.log(app);
			app.default();

			console.log('Skeleton app loaded!');
		}
	};
});
