define(function(require){
	var $ = require('jquery'),
		monster = require('monster');

	var app = {

		requests: {
		},

		subscribe: {
			'voip.numbers.render': 'numbersRender'
		},

		numbersRender: function(container){
			var self = this,
				parent = container || $('#ws_content');

			monster.pub('common.numbers.render', {
				container: parent,
				viewType: 'pbx'
			});
		}
	};

	return app;
});
