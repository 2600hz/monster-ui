define(function(require){
	var $ = require('jquery'),
		monster = require('monster');

	var app = {

		name: 'numbers',

		i18n: [ 'en-US' ],

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

		render: function(container){
			var self = this,
				container = container || $('#ws-content');

			monster.pub('common.numbers.render', container);
		},
	};

	return app;
});

