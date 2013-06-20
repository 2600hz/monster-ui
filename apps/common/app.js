define(function(require){
	var $ = require('jquery'),
		_ = require('underscore'),
		monster = require('monster');

	var app = {

		name: 'common',

		i18n: [ 'en-US' ],

		requests: {
		},

		subscribe: {
		},

		load: function(callback){
			var self = this;

			callback && callback(self);
		},

		render: function(container){

		}
	};

	return app;
});
