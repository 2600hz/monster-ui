define(function(require){
	var $ = require('jquery'),
		monster = require('monster');

	var app = {

		name: 'numbers',

		i18n: [ 'en-US', 'fr-FR' ],

		requests: {
		},

		subscribe: {
		},

		load: function(callback){
			var self = this;

			self.initApp(function() {
				callback && callback(self);
			});
		},

		initApp: function(callback) {
			var self = this;

			monster.pub('auth.initApp', {
				app: self,
				callback: callback
			});
		},

		render: function(parent){
			var self = this,
				parent = parent || $('#ws-content');

			var numberManager = $(monster.template(self, 'app'));

			monster.pub('common.numbers.render', {
				container: numberManager,
				callbackAfterRender: function(numberControl) {
					parent
						.empty()
						.append(numberControl);
				}
			});
		},
	};

	return app;
});

