define(function(require){
	var $ = require('jquery'),
		monster = require('monster');

	var app = {

		name: 'port',

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

		render: function(parent){
			var self = this,
				parent = parent || $('#ws-content');

			var portManager = $(monster.template(self, 'app'));

			monster.pub('common.port.render', {
				container: portManager,
				callbackAfterRender: function(portControl) {
					parent
						.empty()
						.append(portControl);
				},
				parent: parent
			});
		},
	};

	return app;
});

