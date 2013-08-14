define(function(require){
	var $ = require('jquery'),
		_ = require('underscore'),
		monster = require('monster'),
		accountDropdown = require('apps/common/js/accountDropdown');

	var app = {

		name: 'common',

		i18n: [ 'en-US' ],

		requests: {
		},

		subscribe: {
			'common.selectAccount': '_renderSelectAccount'
		},

		load: function(callback){
			var self = this;

			callback && callback(self);
		},

		render: function(container){

		},

		/* Events */
		_renderSelectAccount: function(args) {
			accountDropdown.render(this, args);
		}
	};

	return app;
});
