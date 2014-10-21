define(function(require){
	var $ = require('jquery'),
		_ = require('underscore'),
		monster = require('monster');

	var app = {
		name: 'common',

		subModules: ['accountDropdown', 'buyNumbers', 'callerId', 'e911', 'failover', 'numbers', 'port', 'chooseModel', 'servicePlanDetails'],

		css: [ 'app' ],

		i18n: { 
			'en-US': { customCss: false },
			'fr-FR': { customCss: false }
		},

		requests: {},
		subscribe: {},

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
		}
	};

	return app;
});
