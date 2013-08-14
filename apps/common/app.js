define(function(require){
	var $ = require('jquery'),
		_ = require('underscore'),
		monster = require('monster'),

		accountDropdown = require('./controls/accountDropdown/accountDropdown');

	var app = $.extend(true, accountDropdown, {
		name: 'common',

		i18n: [ 'en-US' ],

		load: function(callback){
			var self = this;

			callback && callback(self);
		},

		render: function() {}
	});

	console.log(app);

	return app;
});
