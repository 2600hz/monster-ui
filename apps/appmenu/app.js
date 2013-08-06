define(function(require){
	var $ = require('jquery'),
		_ = require('underscore'),
		monster = require('monster');

	var app = {

		name: 'appmenu',

		i18n: [ 'en-US' ],

		requests: {
			
		},

		subscribe: {
			'appmenu.show': '_render'
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

		_render: function() {
			var self = this;
			self.render();
		},

		render: function(container){
			var self = this,
				parent = container || $('#ws-content');
			//TODO Render app
			self.
		},

		bindEvents: function(parent) {
			var self = this;

			//TODO Bind app events
		}
	};

	return app;
});
