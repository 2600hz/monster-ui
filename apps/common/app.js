define(function(require){
	var $ = require('jquery'),
		_ = require('underscore'),
		monster = require('monster'),

		//accountDropdown = require('./controls/accountDropdown/accountDropdown');

		controls = {
			'accountDropdown': require('./controls/accountDropdown/accountDropdown')
		}

	var app = /*$.extend(true, accountDropdown,*/ {
		name: 'common',

		i18n: [ 'en-US' ],

		load: function(callback){
			var self = this;

			callback && callback(self);
		},

		render: function() {}
	};

	$.each(controls, function(k, v) {
		app = $.extend(true, app, v);
	});

	return app;
});
